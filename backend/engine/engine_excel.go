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

// Regex to parse parent dependency string like T001[note]="Yes" or T002=orange
// This regex correctly ignores optional bracketed text to extract the core TraitID.
var reParentDependency = regexp.MustCompile(`^([a-zA-Z0-9_]+)(?:\[.*?\])?\s*=\s*(?:"([^"]+)"|([^"\s=]+))$`)

// Regex to normalize a TraitID by removing any bracketed notes, e.g., "FW01[note]" -> "FW01"
var reNormalizeTraitID = regexp.MustCompile(`^[^\[]+`)

// Helper function to parse the #Dependency column.
// It extracts the parent TraitID and the required state.
func parseParentDependency(s string) *Dependency {
	s = strings.TrimSpace(s)
	if s == "" {
		return nil
	}

	matches := reParentDependency.FindStringSubmatch(s)
	// Successful match will have 4 elements: the full string, group 1 (ID), group 2 (quoted state), group 3 (unquoted state)
	if len(matches) != 4 {
		log.Printf("[EXCEL PARSER] Invalid dependency format: %s", s)
		return nil
	}

	requiredState := matches[2] // Assume quoted state first
	if requiredState == "" {
		requiredState = matches[3] // Fallback to unquoted state
	}

	dep := &Dependency{
		ParentTraitID: matches[1],
		RequiredState: requiredState,
	}

	return dep
}

// Helper function to normalize a TraitID by removing bracketed notes.
func normalizeTraitID(id string) string {
	trimmedID := strings.TrimSpace(id)
	if match := reNormalizeTraitID.FindString(trimmedID); match != "" {
		return strings.TrimSpace(match)
	}
	return trimmedID
}

type LoadSummary struct {
	Dir         string `json:"dir"`
	Traits      int    `json:"traits"`
	Taxa        int    `json:"taxa"`
	FilesParsed int    `json:"filesParsed"`
	Conflicts   int    `json:"conflicts"`
}

var reFullWidthDigit = regexp.MustCompile(`[０-９－]+`)
var whitespaceReplacer = strings.NewReplacer("\u00A0", " ", "\t", " ", "　", " ")

func cleanString(s string) string {
	s = toHalfWidthNums(s)
	s = whitespaceReplacer.Replace(s)
	return strings.TrimSpace(s)
}

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
			min, max = max, min
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
	return rows[r][c]
}

type traitKind int

const (
	kindBinary traitKind = iota
	kindNominal
	kindOrdinal
	kindContinuous
	kindCategoricalMulti
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
	if strings.HasPrefix(x, "categorical_multi") {
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

	sheet := f.WorkBook.Sheets.Sheet[0].Name
	rows, err := f.GetRows(sheet)
	if err != nil || len(rows) < 2 || len(rows[0]) < 1 {
		return nil, errors.New("invalid matrix: need header row and at least one trait")
	}

	header := rows[0]
	if len(header) > 0 {
		header[0] = strings.TrimPrefix(header[0], "\ufeff")
	}

	colIdxGroup, colIdxTrait, colIdxType, colIdxTraitID, colIdxDifficulty, colIdxRisk, colIdxParent, colIdxDependency, colIdxHelpText, colIdxHelpImage := -1, -1, -1, -1, -1, -1, -1, -1, -1, -1

	taxonNames, taxonCols := []string{}, []int{}
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
			case "#traitid":
				colIdxTraitID = i
			case "#difficulty":
				colIdxDifficulty = i
			case "#risk":
				colIdxRisk = i
			case "#parent":
				colIdxParent = i
			case "#dependency":
				colIdxDependency = i
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

	m.Name, m.Traits, m.Taxa = filepath.Base(path), []Trait{}, []Taxon{}
	taxonIndex := map[string]int{}
	for i, nm := range taxonNames {
		m.Taxa = append(m.Taxa, Taxon{
			ID: nm, Name: nm,
			Traits:            make(map[string]Ternary),
			ContinuousTraits:  make(map[string]ContinuousValue),
			CategoricalTraits: make(map[string][]string),
		})
		taxonIndex[nm] = i
	}

	for r := 1; r < len(rows); r++ {
		traitName := cleanString(getRawCell(rows, r, colIdxTrait))
		if traitName == "" {
			continue
		}

		group := cleanString(getRawCell(rows, r, colIdxGroup))
		spec := parseTypeSpec(cleanString(getRawCell(rows, r, colIdxType)))

		// Normalizes the TraitID by removing bracketed notes. This is the key fix.
		traitIDStr := normalizeTraitID(getRawCell(rows, r, colIdxTraitID))

		dependency := parseParentDependency(cleanString(getRawCell(rows, r, colIdxDependency)))
		difficultyVal := parseDifficulty(cleanString(getRawCell(rows, r, colIdxDifficulty)))
		riskVal := parseRisk(cleanString(getRawCell(rows, r, colIdxRisk)))
		parentName := cleanString(getRawCell(rows, r, colIdxParent))
		helpText := getRawCell(rows, r, colIdxHelpText)
		helpImageStr := cleanString(getRawCell(rows, r, colIdxHelpImage))
		var helpImages []string
		if helpImageStr != "" {
			helpImages = regexp.MustCompile(`\s*[,;]\s*`).Split(helpImageStr, -1)
		}

		switch spec.kind {
		case kindBinary:
			internalID := fmt.Sprintf("t%04d", len(m.Traits)+1)
			m.Traits = append(m.Traits, Trait{
				ID: internalID, TraitID: traitIDStr, Name: traitName, Group: group, Type: "binary",
				Difficulty: difficultyVal, Risk: riskVal, Parent: parentName, ParentDependency: dependency,
				HelpText: helpText, HelpImages: helpImages,
			})
			for i, col := range taxonCols {
				m.Taxa[taxonIndex[taxonNames[i]]].Traits[internalID] = parseTernaryCell(getRawCell(rows, r, col))
			}

		case kindNominal, kindOrdinal:
			states := spec.states
			if len(states) == 0 {
				uniq := map[string]struct{}{}
				for _, col := range taxonCols {
					raw := cleanString(getRawCell(rows, r, col))
					if raw != "" {
						uniq[raw] = struct{}{}
					}
				}
				if len(uniq) == 0 {
					log.Printf("[EXCEL PARSER] Warning: Nominal trait '%s' has no states. Skipping.", traitName)
					continue
				}
				for k := range uniq {
					states = append(states, k)
				}
				sort.Strings(states)
			}

			parentTraitID := fmt.Sprintf("t%04d_parent", len(m.Traits)+1)
			m.Traits = append(m.Traits, Trait{
				ID: parentTraitID, TraitID: traitIDStr, Name: traitName, Group: group, Type: "nominal_parent",
				Difficulty: difficultyVal, Risk: riskVal, ParentDependency: dependency,
				HelpText: helpText, HelpImages: helpImages, States: states,
			})

			derivedIDs := make([]string, len(states))
			for i, st := range states {
				tid := fmt.Sprintf("t%04d", len(m.Traits)+1)
				derivedIDs[i] = tid
				m.Traits = append(m.Traits, Trait{
					ID: tid, Name: fmt.Sprintf("%s = %s", traitName, st), Group: group, Type: "derived",
					Parent: traitName, State: st, Difficulty: difficultyVal, Risk: riskVal,
					HelpText: helpText, HelpImages: helpImages,
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
			internalID := fmt.Sprintf("t%04d", len(m.Traits)+1)
			overallMin, overallMax := math.Inf(1), math.Inf(-1)
			hasValues, isInteger := false, true

			for i, col := range taxonCols {
				if val, ok := parseRange(getRawCell(rows, r, col)); ok {
					idx := taxonIndex[taxonNames[i]]
					m.Taxa[idx].ContinuousTraits[internalID] = val
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
					ID: internalID, TraitID: traitIDStr, Name: traitName, Group: group, Type: "continuous",
					Difficulty: difficultyVal, Risk: riskVal, ParentDependency: dependency,
					HelpText: helpText, HelpImages: helpImages,
					MinValue: overallMin, MaxValue: overallMax, IsInteger: isInteger,
				})
			}

		case kindCategoricalMulti:
			internalID := fmt.Sprintf("t%04d", len(m.Traits)+1)
			allStates := make(map[string]struct{})
			for i, col := range taxonCols {
				valStr := getRawCell(rows, r, col)
				if valStr == "" {
					continue
				}
				parts := strings.Split(valStr, ";")
				var values []string
				for _, p := range parts {
					if trimmed := cleanString(p); trimmed != "" {
						values = append(values, trimmed)
						allStates[trimmed] = struct{}{}
					}
				}
				if len(values) > 0 {
					m.Taxa[taxonIndex[taxonNames[i]]].CategoricalTraits[internalID] = values
				}
			}

			var states []string
			for state := range allStates {
				states = append(states, state)
			}
			sort.Strings(states)

			m.Traits = append(m.Traits, Trait{
				ID: internalID, TraitID: traitIDStr, Name: traitName, Group: group, Type: "categorical_multi",
				Difficulty: difficultyVal, Risk: riskVal, ParentDependency: dependency,
				HelpText: helpText, HelpImages: helpImages, States: states,
			})
		}
	}

	metaSheetName := "TaxaMeta"
	if metaSheetRows, err := f.GetRows(metaSheetName); err == nil && len(metaSheetRows) > 1 {
		log.Printf("[EXCEL PARSER] Found 'TaxaMeta' sheet. Loading details...")
		header := metaSheetRows[0]
		colIdxName, colIdxDesc, colIdxRefs, colIdxImages := -1, -1, -1, -1
		for i, h := range header {
			switch strings.ToLower(cleanString(h)) {
			case "#taxonname":
				colIdxName = i
			case "#description":
				colIdxDesc = i
			case "#references":
				colIdxRefs = i
			case "#images":
				colIdxImages = i
			}
		}

		if colIdxName != -1 {
			for r := 1; r < len(metaSheetRows); r++ {
				taxonName := cleanString(getRawCell(metaSheetRows, r, colIdxName))
				if idx, ok := taxonIndex[taxonName]; ok {
					m.Taxa[idx].Description = getRawCell(metaSheetRows, r, colIdxDesc)
					m.Taxa[idx].References = getRawCell(metaSheetRows, r, colIdxRefs)
					if imageStr := cleanString(getRawCell(metaSheetRows, r, colIdxImages)); imageStr != "" {
						m.Taxa[idx].Images = regexp.MustCompile(`[ ,;]+`).Split(imageStr, -1)
					}
				}
			}
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
