// backend/engine/engine_excel.go
package engine

import (
	"errors"
	"fmt"
	"log"
	"math"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
	"strings"

	"github.com/xuri/excelize/v2"
)

type LoadSummary struct {
	Dir         string `json:"dir"`
	Traits      int    `json:"traits"`
	Taxa        int    `json:"taxa"`
	FilesParsed int    `json:"filesParsed"`
	Conflicts   int    `json:"conflicts"`
}

var reFullWidthDigit = regexp.MustCompile(`[０-９－]+`)

// A replacer to clean up various whitespace characters, including non-breaking spaces.
var whitespaceReplacer = strings.NewReplacer("\u00A0", " ", "\t", " ", "　", " ") // Added full-width space

// cleanString is a new helper function to standardize string cleaning.
func cleanString(s string) string {
	s = toHalfWidthNums(s)
	s = whitespaceReplacer.Replace(s)
	return strings.TrimSpace(s)
}

// parseRange parses a string like "5.0" or "1.4-1.5" into a ContinuousValue.
func parseRange(s string) (ContinuousValue, bool) {
	s = cleanString(s)
	s = strings.ReplaceAll(s, ",", "")

	if s == "" {
		return ContinuousValue{}, false
	}

	parts := strings.Split(s, "-")
	if len(parts) == 1 {
		val, err := strconv.ParseFloat(parts[0], 64)
		if err != nil {
			return ContinuousValue{}, false
		}
		return ContinuousValue{Min: val, Max: val}, true
	} else if len(parts) == 2 {
		min, errMin := strconv.ParseFloat(strings.TrimSpace(parts[0]), 64)
		max, errMax := strconv.ParseFloat(strings.TrimSpace(parts[1]), 64)
		if errMin != nil || errMax != nil {
			return ContinuousValue{}, false
		}
		if min > max {
			min, max = max, min // Swap if order is wrong
		}
		return ContinuousValue{Min: min, Max: max}, true
	}

	return ContinuousValue{}, false
}

func toHalfWidthNums(s string) string {
	repl := strings.NewReplacer(
		"０", "0", "１", "1", "２", "2", "３", "3", "４", "4",
		"５", "5", "６", "6", "７", "7", "８", "8", "９", "9",
		"．", ".", "，", ",", "－", "-", "＋", "+",
	)
	return repl.Replace(s)
}

func parseTernaryCell(s string) Ternary {
	s = cleanString(s)
	if s == "" {
		return NA
	}
	ls := strings.ToLower(s)
	switch ls {
	case "-1", "n", "no", "false", "いいえ", "無し", "なし", "absent":
		return No
	case "1", "y", "yes", "true", "はい", "有り", "あり", "present", "x", "×", "○", "◯", "✓":
		return Yes
	case "0", "na", "unknown", "不明", "未", "":
		fallthrough
	default:
		return NA
	}
}

func parseDifficulty(s string) float64 {
	s = strings.ToLower(cleanString(s))
	switch s {
	case "easy":
		return 0.5
	case "normal", "":
		return 1.0
	case "hard":
		return 2.0
	case "very hard":
		return 3.0
	default:
		if v, err := strconv.ParseFloat(s, 64); err == nil && v > 0 {
			return v
		}
		return 1.0
	}
}

func parseRisk(s string) float64 {
	s = strings.ToLower(cleanString(s))
	switch s {
	case "lowest":
		return 0.0
	case "low":
		return 0.2
	case "medium", "":
		return 0.5
	case "high":
		return 0.8
	case "highest":
		return 1.0
	default:
		if v, err := strconv.ParseFloat(s, 64); err == nil && v >= 0 && v <= 1 {
			return v
		}
		return 0.5
	}
}

func getRawCell(rows [][]string, r, c int) string {
	if c < 0 || r < 0 || r >= len(rows) || c >= len(rows[r]) {
		return ""
	}
	// Return the raw string, cleaning will be done by callers.
	return rows[r][c]
}

type traitKind int

const (
	kindBinary traitKind = iota
	kindNominal
	kindOrdinal
	kindContinuous
	kindCategoricalMulti // New kind
)

type typeSpec struct {
	kind   traitKind
	states []string
}

func parseStateList(s string) []string {
	s = cleanString(s)
	if strings.HasPrefix(s, "(") && strings.HasSuffix(s, ")") {
		s = strings.TrimSpace(s[1 : len(s)-1])
	}
	s = strings.ReplaceAll(s, "/", "|")
	s = strings.ReplaceAll(s, ",", "|")
	parts := strings.Split(s, "|")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if p = strings.TrimSpace(p); p != "" {
			out = append(out, p)
		}
	}
	return out
}

func parseStateListOrdered(s string) []string {
	s = cleanString(s)
	if strings.HasPrefix(s, "(") && strings.HasSuffix(s, ")") {
		s = strings.TrimSpace(s[1 : len(s)-1])
	}
	s = strings.ReplaceAll(s, ">", "<")
	s = strings.ReplaceAll(s, "/", "<")
	parts := strings.Split(s, "<")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if p = strings.TrimSpace(p); p != "" {
			out = append(out, p)
		}
	}
	return out
}

func parseTypeSpec(s string) typeSpec {
	x := strings.ToLower(cleanString(s))
	if x == "" || x == "binary" {
		return typeSpec{kind: kindBinary}
	}
	if strings.HasPrefix(x, "nominal") {
		inside := strings.TrimSpace(x[len("nominal"):])
		return typeSpec{kind: kindNominal, states: parseStateList(inside)}
	}
	if strings.HasPrefix(x, "ordinal") {
		inside := strings.TrimSpace(x[len("ordinal"):])
		return typeSpec{kind: kindOrdinal, states: parseStateListOrdered(inside)}
	}
	if strings.HasPrefix(x, "continuous") {
		return typeSpec{kind: kindContinuous}
	}
	if strings.HasPrefix(x, "categorical_multi") { // New type handling
		return typeSpec{kind: kindCategoricalMulti}
	}
	return typeSpec{kind: kindBinary}
}

func (m *Matrix) LoadMatrixExcel(path string) (*LoadSummary, error) {
	log.Printf("[EXCEL PARSER] Starting to load matrix from: %s", path)
	f, err := excelize.OpenFile(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	if len(f.WorkBook.Sheets.Sheet) == 0 {
		return nil, errors.New("sheet not found")
	}
	sheet := f.WorkBook.Sheets.Sheet[0].Name
	rows, err := f.GetRows(sheet)
	if err != nil || len(rows) < 2 || len(rows[0]) < 1 {
		return nil, errors.New("invalid matrix: need header row and at least one trait")
	}

	header := rows[0]
	if len(header) > 0 {
		header[0] = strings.TrimPrefix(header[0], "\ufeff")
	}

	colIdxGroup, colIdxTrait, colIdxType, colIdxDifficulty, colIdxRisk, colIdxParent, colIdxHelpText, colIdxHelpImage := -1, -1, -1, -1, -1, -1, -1, -1

	taxonNames := []string{}
	taxonCols := []int{}

	for i, h := range header {
		cleanHeader := strings.ToLower(cleanString(h))
		if strings.HasPrefix(cleanHeader, "#") {
			switch cleanHeader {
			case "#group":
				colIdxGroup = i
			case "#trait":
				colIdxTrait = i
			case "#type":
				colIdxType = i
			case "#difficulty":
				colIdxDifficulty = i
			case "#risk":
				colIdxRisk = i
			case "#parent":
				colIdxParent = i
			case "#helptext":
				colIdxHelpText = i
			case "#helpimages":
				colIdxHelpImage = i
			}
		} else if cleanHeader != "" {
			taxonNames = append(taxonNames, cleanString(h))
			taxonCols = append(taxonCols, i)
		}
	}

	if colIdxTrait == -1 {
		return nil, errors.New("header must contain '#Trait' column")
	}
	if len(taxonNames) == 0 {
		return nil, errors.New("no taxa found in header")
	}
	log.Printf("[EXCEL PARSER] Found %d taxa.", len(taxonNames))

	m.Name = filepath.Base(path)
	m.Traits = []Trait{}
	m.Taxa = []Taxon{}
	taxonIndex := map[string]int{}
	for i, nm := range taxonNames {
		m.Taxa = append(m.Taxa, Taxon{
			ID:                nm,
			Name:              nm,
			Traits:            make(map[string]Ternary),
			ContinuousTraits:  make(map[string]ContinuousValue),
			CategoricalTraits: make(map[string][]string), // Initialize new map
		})
		taxonIndex[nm] = i
	}

	for r := 1; r < len(rows); r++ {
		group := cleanString(getRawCell(rows, r, colIdxGroup))
		traitName := cleanString(getRawCell(rows, r, colIdxTrait))
		if traitName == "" {
			continue
		}
		spec := parseTypeSpec(cleanString(getRawCell(rows, r, colIdxType)))

		difficultyVal := parseDifficulty(cleanString(getRawCell(rows, r, colIdxDifficulty)))
		riskVal := parseRisk(cleanString(getRawCell(rows, r, colIdxRisk)))
		parentName := cleanString(getRawCell(rows, r, colIdxParent))
		helpText := getRawCell(rows, r, colIdxHelpText)
		helpImageStr := cleanString(getRawCell(rows, r, colIdxHelpImage))
		var helpImages []string
		if helpImageStr != "" {
			parts := regexp.MustCompile(`[ ,;]+`).Split(helpImageStr, -1)
			for _, part := range parts {
				if part != "" {
					helpImages = append(helpImages, part)
				}
			}
		}

		switch spec.kind {
		case kindBinary:
			traitID := fmt.Sprintf("t%04d", len(m.Traits)+1)
			m.Traits = append(m.Traits, Trait{
				ID:         traitID,
				Name:       traitName,
				Group:      group,
				Type:       "binary",
				Difficulty: difficultyVal,
				Risk:       riskVal,
				Parent:     parentName,
				HelpText:   helpText,
				HelpImages: helpImages,
			})
			for i, col := range taxonCols {
				valStr := getRawCell(rows, r, col)
				val := parseTernaryCell(valStr)
				idx := taxonIndex[taxonNames[i]]
				m.Taxa[idx].Traits[traitID] = val
			}

		case kindNominal, kindOrdinal:
			states := spec.states
			if len(states) == 0 {
				uniq := map[string]struct{}{}
				for _, col := range taxonCols {
					raw := cleanString(getRawCell(rows, r, col))
					if raw == "" || parseTernaryCell(raw) != NA {
						continue
					}
					uniq[raw] = struct{}{}
				}
				if len(uniq) < 2 {
					continue
				}
				for k := range uniq {
					states = append(states, k)
				}
				sort.Strings(states)
			}

			parentTraitID := fmt.Sprintf("t%04d_parent", len(m.Traits)+1)
			m.Traits = append(m.Traits, Trait{ID: parentTraitID, Name: traitName, Group: group, Type: "nominal_parent", Difficulty: difficultyVal, Risk: riskVal, HelpText: helpText, HelpImages: helpImages})

			derivedIDs := make([]string, len(states))
			for i, st := range states {
				tid := fmt.Sprintf("t%04d", len(m.Traits)+1)
				derivedIDs[i] = tid
				m.Traits = append(m.Traits, Trait{
					ID:         tid,
					Name:       fmt.Sprintf("%s = %s", traitName, st),
					Group:      group,
					Type:       "derived",
					Parent:     traitName,
					State:      st,
					Difficulty: difficultyVal,
					Risk:       riskVal,
					HelpText:   helpText,
					HelpImages: helpImages,
				})
			}
			for i, col := range taxonCols {
				raw := cleanString(getRawCell(rows, r, col))
				which := -1
				for j, st := range states {
					if strings.EqualFold(st, raw) {
						which = j
						break
					}
				}
				idx := taxonIndex[taxonNames[i]]
				for j, tid := range derivedIDs {
					if which == j {
						m.Taxa[idx].Traits[tid] = Yes
					} else {
						m.Taxa[idx].Traits[tid] = No
					}
				}
				if which < 0 {
					for _, tid := range derivedIDs {
						m.Taxa[idx].Traits[tid] = NA
					}
				}
			}

		case kindContinuous:
			traitID := fmt.Sprintf("t%04d", len(m.Traits)+1)
			overallMin, overallMax := math.Inf(1), math.Inf(-1)
			hasValues := false
			isInteger := true

			for i, col := range taxonCols {
				valStr := getRawCell(rows, r, col)
				if val, ok := parseRange(valStr); ok {
					idx := taxonIndex[taxonNames[i]]
					m.Taxa[idx].ContinuousTraits[traitID] = val

					if val.Min < overallMin {
						overallMin = val.Min
					}
					if val.Max > overallMax {
						overallMax = val.Max
					}
					hasValues = true

					if val.Min != math.Floor(val.Min) || val.Max != math.Floor(val.Max) {
						isInteger = false
					}
				}
			}

			if hasValues {
				m.Traits = append(m.Traits, Trait{
					ID:         traitID,
					Name:       traitName,
					Group:      group,
					Type:       "continuous",
					Difficulty: difficultyVal,
					Risk:       riskVal,
					HelpText:   helpText,
					HelpImages: helpImages,
					MinValue:   overallMin,
					MaxValue:   overallMax,
					IsInteger:  isInteger,
				})
			}
		case kindCategoricalMulti:
			traitID := fmt.Sprintf("t%04d", len(m.Traits)+1)
			allStates := make(map[string]struct{})
			for i, col := range taxonCols {
				valStr := getRawCell(rows, r, col)
				if valStr == "" {
					continue
				}
				parts := strings.Split(valStr, ";")
				var values []string
				for _, p := range parts {
					trimmed := cleanString(p)
					if trimmed != "" {
						values = append(values, trimmed)
						allStates[trimmed] = struct{}{}
					}
				}
				if len(values) > 0 {
					idx := taxonIndex[taxonNames[i]]
					m.Taxa[idx].CategoricalTraits[traitID] = values
					log.Printf("[EXCEL PARSER] Parsed for Taxon '%s', Trait '%s': Raw='%s', Parsed Values=%v", taxonNames[i], traitName, valStr, values)
				}
			}

			var states []string
			for state := range allStates {
				states = append(states, state)
			}
			sort.Strings(states)
			log.Printf("[EXCEL PARSER] Trait '%s', All possible states found: %v", traitName, states)

			m.Traits = append(m.Traits, Trait{
				ID:         traitID,
				Name:       traitName,
				Group:      group,
				Type:       "categorical_multi",
				Difficulty: difficultyVal,
				Risk:       riskVal,
				HelpText:   helpText,
				HelpImages: helpImages,
				States:     states,
			})
		}
	}

	sum := &LoadSummary{Dir: path, Traits: len(m.Traits), Taxa: len(m.Taxa), FilesParsed: 1}
	if sum.Traits == 0 || sum.Taxa == 0 {
		return sum, errors.New("parsed zero traits or taxa")
	}
	log.Printf("[EXCEL PARSER] Successfully loaded matrix. Traits: %d, Taxa: %d", sum.Traits, sum.Taxa)
	return sum, nil
}

func Nary(b bool) Ternary {
	if b {
		return Yes
	}
	return No
}
