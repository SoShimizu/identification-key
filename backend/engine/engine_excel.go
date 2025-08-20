// backend/engine/engine_excel.go
package engine

import (
	"errors"
	"fmt"
	"math"
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

func toHalfWidthNums(s string) string {
	repl := strings.NewReplacer(
		"０", "0", "１", "1", "２", "2", "３", "3", "４", "4",
		"５", "5", "６", "6", "７", "7", "８", "8", "９", "9",
		"．", ".", "，", ",", "－", "-", "＋", "+",
	)
	return repl.Replace(s)
}

func parseTernaryCell(s string) Ternary {
	if s == "" {
		return NA
	}
	s = strings.TrimSpace(toHalfWidthNums(s))
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

func getCell(rows [][]string, r, c int) string {
	if c < 0 {
		return ""
	}
	if r < 0 || r >= len(rows) {
		return ""
	}
	if c >= len(rows[r]) {
		return ""
	}
	return strings.TrimSpace(rows[r][c])
}

// ---- Type spec ----
type traitKind int

const (
	kindBinary traitKind = iota
	kindNominal
	kindOrdinal
	kindContinuous
)

type typeSpec struct {
	kind     traitKind
	states   []string
	min, max float64
	bins     int
}

func parseStateList(s string) []string {
	s = strings.TrimSpace(s)
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
	s = strings.TrimSpace(s)
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
	x := strings.ToLower(strings.TrimSpace(s))
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
		inside := strings.TrimSpace(x[len("continuous"):])
		min, max := math.NaN(), math.NaN()
		bins := 5
		if strings.HasPrefix(inside, "[") && strings.HasSuffix(inside, "]") {
			body := strings.TrimSpace(inside[1 : len(inside)-1])
			parts := strings.Split(body, ";")
			if len(parts) > 0 && strings.Contains(parts[0], "..") {
				rp := strings.Split(parts[0], "..")
				if len(rp) == 2 {
					if v, err := strconv.ParseFloat(strings.TrimSpace(rp[0]), 64); err == nil {
						min = v
					}
					if v, err := strconv.ParseFloat(strings.TrimSpace(rp[1]), 64); err == nil {
						max = v
					}
				}
			}
			for _, kv := range parts[1:] {
				kv = strings.TrimSpace(kv)
				if strings.HasPrefix(kv, "bins=") {
					if v, err := strconv.Atoi(strings.TrimSpace(kv[len("bins="):])); err == nil && v >= 2 {
						bins = v
					}
				}
			}
		}
		return typeSpec{kind: kindContinuous, min: min, max: max, bins: bins}
	}
	return typeSpec{kind: kindBinary}
}

func binLabel(a, b float64, last bool) string {
	if last {
		return fmt.Sprintf("[%.4g～%.4g]", a, b)
	}
	return fmt.Sprintf("[%.4g～%.4g)", a, b)
}

func (m *Matrix) LoadMatrixExcel(path string) (*LoadSummary, error) {
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
	colIdxGroup, colIdxTrait, colIdxType, colIdxCost, colIdxParent := -1, -1, -1, -1, -1
	for i, h := range header {
		switch strings.ToLower(strings.TrimSpace(h)) {
		case "group":
			colIdxGroup = i
		case "trait":
			colIdxTrait = i
		case "type":
			colIdxType = i
		case "cost":
			colIdxCost = i
		case "parent":
			colIdxParent = i
		}
	}
	if colIdxTrait == -1 {
		return nil, errors.New("header must contain 'Trait' column")
	}

	taxonStartCol := 0
	for _, idx := range []int{colIdxGroup, colIdxTrait, colIdxType, colIdxCost, colIdxParent} {
		if idx+1 > taxonStartCol {
			taxonStartCol = idx + 1
		}
	}

	taxonNames := []string{}
	taxonCols := []int{}
	seen := map[string]int{}
	for c := taxonStartCol; c < len(header); c++ {
		name := strings.TrimSpace(header[c])
		if name == "" {
			continue
		}
		if n, ok := seen[name]; ok {
			n++
			seen[name] = n
			name = fmt.Sprintf("%s_%d", name, n)
		} else {
			seen[name] = 1
		}
		taxonNames = append(taxonNames, name)
		taxonCols = append(taxonCols, c)
	}
	if len(taxonNames) == 0 {
		return nil, errors.New("no taxa found")
	}

	m.Traits = []Trait{}
	m.Taxa = []Taxon{}
	taxonIndex := map[string]int{}
	for i, nm := range taxonNames {
		m.Taxa = append(m.Taxa, Taxon{ID: nm, Name: nm, Traits: map[string]Ternary{}})
		taxonIndex[nm] = i
	}

	for r := 1; r < len(rows); r++ {
		group := getCell(rows, r, colIdxGroup)
		traitName := getCell(rows, r, colIdxTrait)
		if traitName == "" {
			continue
		}
		spec := parseTypeSpec(getCell(rows, r, colIdxType))
		costVal, err := strconv.ParseFloat(getCell(rows, r, colIdxCost), 64)
		if err != nil || costVal <= 0 {
			costVal = 1.0
		}
		parentName := getCell(rows, r, colIdxParent)

		switch spec.kind {
		case kindBinary:
			traitID := fmt.Sprintf("t%04d", len(m.Traits)+1)
			m.Traits = append(m.Traits, Trait{ID: traitID, Name: traitName, Group: group, Type: "binary", Cost: costVal, Parent: parentName})
			for i, col := range taxonCols {
				valStr := getCell(rows, r, col)
				val := parseTernaryCell(valStr)
				idx := taxonIndex[taxonNames[i]]
				m.Taxa[idx].Traits[traitID] = val
			}

		case kindNominal, kindOrdinal:
			// (Same as before, just adding Cost and Parent to the derived traits)
			states := spec.states
			if len(states) == 0 {
				uniq := map[string]struct{}{}
				for _, col := range taxonCols {
					raw := getCell(rows, r, col)
					if raw == "" || parseTernaryCell(raw) != NA {
						continue
					}
					uniq[raw] = struct{}{}
				}
				if len(uniq) < 2 {
					traitID := fmt.Sprintf("t%04d", len(m.Traits)+1)
					m.Traits = append(m.Traits, Trait{ID: traitID, Name: traitName, Group: group, Type: "binary", Cost: costVal, Parent: parentName})
					for i, col := range taxonCols {
						val := parseTernaryCell(getCell(rows, r, col))
						m.Taxa[taxonIndex[taxonNames[i]]].Traits[traitID] = val
					}
					continue
				}
				for k := range uniq {
					states = append(states, k)
				}
				sort.Strings(states)
			}

			derivedIDs := make([]string, len(states))
			for i, st := range states {
				tid := fmt.Sprintf("t%04d", len(m.Traits)+1)
				derivedIDs[i] = tid
				m.Traits = append(m.Traits, Trait{
					ID: tid, Name: fmt.Sprintf("%s = %s", traitName, st),
					Group: group, Type: "derived", Parent: traitName, State: st, Cost: costVal,
				})
			}
			for i, col := range taxonCols {
				raw := getCell(rows, r, col)
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
			// (Same as before, just adding Cost and Parent to derived traits)
			values := make([]float64, len(taxonCols))
			have := make([]bool, len(taxonCols))
			minv, maxv := math.Inf(1), math.Inf(-1)
			for i, col := range taxonCols {
				raw := getCell(rows, r, col)
				if v, err := strconv.ParseFloat(strings.ReplaceAll(toHalfWidthNums(raw), ",", ""), 64); err == nil {
					values[i], have[i] = v, true
					if v < minv {
						minv = v
					}
					if v > maxv {
						maxv = v
					}
				}
			}
			min, max := spec.min, spec.max
			if math.IsNaN(min) || math.IsNaN(max) || min >= max {
				if minv == math.Inf(1) || maxv == math.Inf(-1) {
					continue
				}
				min, max = minv, maxv
			}
			bins := spec.bins
			if bins < 2 {
				bins = 5
			}
			edges := make([]float64, bins+1)
			for i := 0; i <= bins; i++ {
				edges[i] = min + (max-min)*float64(i)/float64(bins)
			}

			derivedIDs := make([]string, bins)
			for i := 0; i < bins; i++ {
				tid := fmt.Sprintf("t%04d", len(m.Traits)+1)
				derivedIDs[i] = tid
				label := binLabel(edges[i], edges[i+1], i == bins-1)
				m.Traits = append(m.Traits, Trait{
					ID: tid, Name: fmt.Sprintf("%s = %s", traitName, label),
					Group: group, Type: "derived", Parent: traitName, State: label, Cost: costVal,
				})
			}
			for i, colIdx := range taxonCols {
				idx := taxonIndex[taxonNames[i]]
				if !have[i] {
					for _, tid := range derivedIDs {
						m.Taxa[idx].Traits[tid] = NA
					}
					continue
				}
				v := values[colIdx]
				bin := 0
				for j := 0; j < bins; j++ {
					last := (j == bins-1)
					if (!last && v >= edges[j] && v < edges[j+1]) || (last && v >= edges[j] && v <= edges[j+1]) {
						bin = j
						break
					}
				}
				for j, tid := range derivedIDs {
					m.Taxa[idx].Traits[tid] = Nary(j == bin)
				}
			}
		}
	}

	sum := &LoadSummary{Dir: path, Traits: len(m.Traits), Taxa: len(m.Taxa), FilesParsed: 1}
	if sum.Traits == 0 || sum.Taxa == 0 {
		return sum, errors.New("parsed zero traits or taxa")
	}
	return sum, nil
}

// Helper to convert bool to Ternary
func Nary(b bool) Ternary {
	if b {
		return Yes
	}
	return No
}
