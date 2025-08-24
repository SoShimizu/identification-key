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

var reParentDependency = regexp.MustCompile(`^([a-zA-Z0-9_.-]+)(?:\[.*?\])?\s*=\s*(?:"([^"]+)"|([^"\s=]+))$`)
var reNormalizeTraitID = regexp.MustCompile(`^[^\[]+`)
var whitespaceReplacer = strings.NewReplacer("\u00A0", " ", "\t", " ", "　", " ")

func cleanString(s string) string {
	s = toHalfWidthNums(s)
	s = whitespaceReplacer.Replace(s)
	return strings.TrimSpace(s)
}

func parseParentDependency(s string) *Dependency {
	s = strings.TrimSpace(s)
	if s == "" {
		return nil
	}
	matches := reParentDependency.FindStringSubmatch(s)
	if len(matches) != 4 {
		log.Printf("[EXCEL PARSER] Invalid dependency format: %s", s)
		return nil
	}
	requiredState := matches[2]
	if requiredState == "" {
		requiredState = matches[3]
	}
	return &Dependency{ParentTraitID: matches[1], RequiredState: requiredState}
}

func normalizeTraitID(id string) string {
	trimmedID := strings.TrimSpace(id)
	if match := reNormalizeTraitID.FindString(trimmedID); match != "" {
		return strings.TrimSpace(match)
	}
	return trimmedID
}

func sanitizeToID(s string) string {
	s = strings.ToLower(s)
	s = regexp.MustCompile(`[\s/\\,.;:'"]+`).ReplaceAllString(s, "_")
	s = regexp.MustCompile(`[^a-z0-9_-]+`).ReplaceAllString(s, "")
	return s
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
func getCell(rows [][]string, r, c int) string {
	if c < 0 || r < 0 || r >= len(rows) || c >= len(rows[r]) {
		return ""
	}
	return rows[r][c]
}
func getHeaderMap(header []string) map[string]int {
	m := make(map[string]int)
	for i, h := range header {
		m[strings.ToLower(cleanString(h))] = i
	}
	return m
}

func LoadMatrixExcel(path string) (*Matrix, error) {
	log.Printf("[EXCEL PARSER] Starting to load matrix from: %s", path)
	f, err := excelize.OpenFile(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	matrix := &Matrix{Name: filepath.Base(path)}

	if err := parseMatrixInfo(f, matrix); err != nil {
		return nil, fmt.Errorf("error parsing MatrixInfo sheet: %w", err)
	}

	taxaMap, err := parseTaxaInfo(f)
	if err != nil {
		return nil, fmt.Errorf("error parsing TaxaInfo sheet: %w", err)
	}

	if err := parseTraits(f, matrix, taxaMap); err != nil {
		return nil, fmt.Errorf("error parsing Traits sheet: %w", err)
	}

	matrix.Taxa = make([]Taxon, 0, len(taxaMap))
	for _, taxon := range taxaMap {
		matrix.Taxa = append(matrix.Taxa, *taxon)
	}
	sort.Slice(matrix.Taxa, func(i, j int) bool {
		return matrix.Taxa[i].ScientificName < matrix.Taxa[j].ScientificName
	})

	log.Printf("[EXCEL PARSER] Successfully loaded matrix. Traits: %d, Taxa: %d", len(matrix.Traits), len(matrix.Taxa))
	if len(matrix.Traits) == 0 || len(matrix.Taxa) == 0 {
		return matrix, errors.New("parsed zero traits or taxa")
	}

	return matrix, nil
}

func parseMatrixInfo(f *excelize.File, matrix *Matrix) error {
	rows, err := f.GetRows("MatrixInfo")
	if err != nil {
		return errors.New("'MatrixInfo' sheet not found or unreadable")
	}
	infoMap := make(map[string]string)
	for _, row := range rows {
		if len(row) >= 2 {
			key := strings.ToLower(cleanString(row[0]))
			infoMap[key] = row[1]
		}
	}
	matrix.Info = MatrixInfo{
		TitleEN:       infoMap["title_en"],
		TitleJP:       infoMap["title_jp"],
		Version:       infoMap["version"],
		DescriptionEN: infoMap["description_en"],
		DescriptionJP: infoMap["description_jp"],
		AuthorsEN:     infoMap["authors_en"],
		AuthorsJP:     infoMap["authors_jp"],
		ContactEN:     infoMap["contact_en"],
		ContactJP:     infoMap["contact_jp"],
		CitationEN:    infoMap["citation_en"],
		CitationJP:    infoMap["citation_jp"],
		ReferencesEN:  infoMap["references_en"],
		ReferencesJP:  infoMap["references_jp"],
	}
	return nil
}

func parseTaxaInfo(f *excelize.File) (map[string]*Taxon, error) {
	rows, err := f.GetRows("TaxaInfo")
	if err != nil || len(rows) < 1 {
		return nil, errors.New("'TaxaInfo' sheet not found or has no header")
	}

	header := getHeaderMap(rows[0])
	taxaMap := make(map[string]*Taxon)

	col, ok := header["#taxonid"]
	if !ok {
		return nil, errors.New("#TaxonID column not found in TaxaInfo sheet")
	}

	for r := 1; r < len(rows); r++ {
		taxonID := cleanString(getCell(rows, r, col))
		if taxonID == "" {
			continue
		}

		name := cleanString(getCell(rows, r, header["#scientificname"]))
		taxaMap[taxonID] = &Taxon{
			ID:                taxonID,
			Name:              name,
			ScientificName:    name,
			Rank:              cleanString(getCell(rows, r, header["#rank"])), // Read the new #Rank column
			TaxonAuthor:       cleanString(getCell(rows, r, header["#author"])),
			VernacularNameEN:  cleanString(getCell(rows, r, header["#vernacularname_en"])),
			VernacularNameJP:  cleanString(getCell(rows, r, header["#vernacularname_ja"])),
			DescriptionEN:     getCell(rows, r, header["#description_en"]),
			DescriptionJP:     getCell(rows, r, header["#description_ja"]),
			Images:            strings.Split(cleanString(getCell(rows, r, header["#images"])), ","),
			References:        getCell(rows, r, header["#references"]),
			Order:             cleanString(getCell(rows, r, header["#order"])),
			Superfamily:       cleanString(getCell(rows, r, header["#superfamily"])),
			Family:            cleanString(getCell(rows, r, header["#family"])),
			Subfamily:         cleanString(getCell(rows, r, header["#subfamily"])),
			Tribe:             cleanString(getCell(rows, r, header["#tribe"])),
			Subtribe:          cleanString(getCell(rows, r, header["#subtribe"])),
			Genus:             cleanString(getCell(rows, r, header["#genus"])),
			Subgenus:          cleanString(getCell(rows, r, header["#subgenus"])),
			Species:           cleanString(getCell(rows, r, header["#species"])),
			Subspecies:        cleanString(getCell(rows, r, header["#subspecies"])),
			Traits:            make(map[string]Ternary),
			ContinuousTraits:  make(map[string]ContinuousValue),
			CategoricalTraits: make(map[string][]string),
		}
	}
	return taxaMap, nil
}

func parseTraits(f *excelize.File, matrix *Matrix, taxaMap map[string]*Taxon) error {
	rows, err := f.GetRows("Traits")
	if err != nil || len(rows) < 1 {
		return errors.New("'Traits' sheet not found or has no header")
	}

	headerMap := getHeaderMap(rows[0])

	requiredHeaders := []string{"#type"}
	for _, h := range requiredHeaders {
		if _, ok := headerMap[h]; !ok {
			return fmt.Errorf("required header '%s' not found in Traits sheet", h)
		}
	}

	taxonIDs := make([]string, 0, len(taxaMap))
	taxonCols := make([]int, 0, len(taxaMap))
	for i, h := range rows[0] {
		cleanedHeader := cleanString(h)
		if _, ok := taxaMap[cleanedHeader]; ok {
			taxonIDs = append(taxonIDs, cleanedHeader)
			taxonCols = append(taxonCols, i)
		}
	}
	if len(taxonIDs) == 0 {
		return errors.New("no matching taxonIDs found between Traits header and TaxaInfo sheet")
	}

	traitIDResolver := make(map[string]string)
	usedCanonicalIDs := make(map[string]bool)

	for r := 1; r < len(rows); r++ {
		traitNameEN := cleanString(getCell(rows, r, headerMap["#trait_en"]))
		traitNameJP := cleanString(getCell(rows, r, headerMap["#trait_ja"]))

		traitIdentifier := traitNameEN
		if traitIdentifier == "" {
			traitIdentifier = traitNameJP
		}
		if traitIdentifier == "" {
			continue
		}

		var canonicalTraitID string
		userDefinedID := cleanString(getCell(rows, r, headerMap["#traitid"]))

		if userDefinedID != "" {
			canonicalTraitID = userDefinedID
		} else {
			sanitizedNameID := sanitizeToID(traitIdentifier)
			if _, exists := usedCanonicalIDs[sanitizedNameID]; exists {
				groupNameEN := cleanString(getCell(rows, r, headerMap["#group_en"]))
				groupNameJP := cleanString(getCell(rows, r, headerMap["#group_jp"]))
				groupName := groupNameEN
				if groupName == "" {
					groupName = groupNameJP
				}
				sanitizedGroupName := sanitizeToID(groupName)
				canonicalTraitID = fmt.Sprintf("%s_%s", sanitizedGroupName, sanitizedNameID)
				log.Printf("[EXCEL PARSER] Duplicate sanitized name '%s' found. Generated unique ID with group: '%s'", sanitizedNameID, canonicalTraitID)
			} else {
				canonicalTraitID = sanitizedNameID
			}
		}

		if _, exists := usedCanonicalIDs[canonicalTraitID]; exists && userDefinedID != "" {
			log.Printf("[EXCEL PARSER] Warning: Duplicate user-defined TraitID '%s' detected. This may cause issues with dependencies.", userDefinedID)
		}
		usedCanonicalIDs[canonicalTraitID] = true

		sanitizedNameID := sanitizeToID(traitIdentifier)
		traitIDResolver[sanitizedNameID] = canonicalTraitID
		if traitNameEN != "" {
			traitIDResolver[sanitizeToID(traitNameEN)] = canonicalTraitID
		}
		if traitNameJP != "" {
			traitIDResolver[sanitizeToID(traitNameJP)] = canonicalTraitID
		}

		if userDefinedID != "" {
			traitIDResolver[userDefinedID] = canonicalTraitID
		}
	}
	log.Printf("[EXCEL PARSER] Pass 1 complete. Built TraitID resolver map with %d entries.", len(traitIDResolver))

	for r := 1; r < len(rows); r++ {
		traitNameEN := cleanString(getCell(rows, r, headerMap["#trait_en"]))
		traitNameJP := cleanString(getCell(rows, r, headerMap["#trait_ja"]))

		traitIdentifier := traitNameEN
		if traitIdentifier == "" {
			traitIdentifier = traitNameJP
		}
		if traitIdentifier == "" {
			continue
		}

		var canonicalTraitID string
		userDefinedID := cleanString(getCell(rows, r, headerMap["#traitid"]))

		if userDefinedID != "" {
			canonicalTraitID = userDefinedID
		} else {
			sanitizedNameID := sanitizeToID(traitIdentifier)
			resolvedID, ok := traitIDResolver[sanitizedNameID]
			if !ok {
				log.Printf("[EXCEL PARSER] FATAL: Could not find resolved ID for trait '%s' in Pass 2. This should not happen.", traitIdentifier)
				continue
			}
			canonicalTraitID = resolvedID
		}

		var dependency *Dependency
		depStr := cleanString(getCell(rows, r, headerMap["#dependency"]))
		if depStr != "" {
			dep := parseParentDependency(depStr)
			if dep != nil {
				parentIdentifier := dep.ParentTraitID
				resolvedParentID, ok := traitIDResolver[parentIdentifier]
				if !ok {
					resolvedParentID, ok = traitIDResolver[sanitizeToID(parentIdentifier)]
				}

				if ok {
					dep.ParentTraitID = resolvedParentID
					dependency = dep
				} else {
					log.Printf("[EXCEL PARSER] Warning: Could not resolve dependency parent '%s' for trait '%s'. Dependency will be ignored.", parentIdentifier, traitIdentifier)
				}
			}
		}

		spec := parseTypeSpec(cleanString(getCell(rows, r, headerMap["#type"])))

		trait := Trait{
			ID:               fmt.Sprintf("t%04d", len(matrix.Traits)+1),
			TraitID:          canonicalTraitID,
			NameEN:           traitNameEN,
			NameJP:           traitNameJP,
			GroupEN:          cleanString(getCell(rows, r, headerMap["#group_en"])),
			GroupJP:          cleanString(getCell(rows, r, headerMap["#group_jp"])),
			Type:             "",
			ParentDependency: dependency,
			Difficulty:       parseDifficulty(cleanString(getCell(rows, r, headerMap["#difficulty"]))),
			Risk:             parseRisk(cleanString(getCell(rows, r, headerMap["#risk"]))),
			HelpTextEN:       getCell(rows, r, headerMap["#helptext_en"]),
			HelpTextJP:       getCell(rows, r, headerMap["#helptext_ja"]),
			HelpImages:       strings.Split(cleanString(getCell(rows, r, headerMap["#helpimages"])), ","),
		}

		switch spec.kind {
		case kindBinary:
			trait.Type = "binary"
			matrix.Traits = append(matrix.Traits, trait)
			for i, taxID := range taxonIDs {
				taxaMap[taxID].Traits[trait.ID] = parseTernaryCell(getCell(rows, r, taxonCols[i]))
			}

		case kindNominal, kindOrdinal:
			states := spec.states
			if len(states) == 0 {
				uniq := map[string]struct{}{}
				for _, col := range taxonCols {
					raw := cleanString(getCell(rows, r, col))
					if raw != "" {
						uniq[raw] = struct{}{}
					}
				}
				for k := range uniq {
					states = append(states, k)
				}
				sort.Strings(states)
			}

			trait.Type = "nominal_parent"
			trait.States = states
			matrix.Traits = append(matrix.Traits, trait)

			derivedIDs := make([]string, len(states))
			for i, st := range states {
				childID := fmt.Sprintf("t%04d", len(matrix.Traits)+1)
				derivedIDs[i] = childID
				matrix.Traits = append(matrix.Traits, Trait{
					ID:      childID,
					TraitID: fmt.Sprintf("%s_state%d", trait.TraitID, i),
					NameEN:  fmt.Sprintf("%s = %s", trait.NameEN, st),
					NameJP:  fmt.Sprintf("%s = %s", trait.NameJP, st),
					GroupEN: trait.GroupEN,
					GroupJP: trait.GroupJP,
					Type:    "derived",
					Parent:  trait.TraitID,
					ParentName: func() string {
						if trait.NameEN != "" {
							return trait.NameEN
						}
						return trait.NameJP
					}(),
					State: st,
				})
			}

			for i, taxID := range taxonIDs {
				raw := cleanString(getCell(rows, r, taxonCols[i]))
				which := -1
				for j, st := range states {
					if strings.EqualFold(st, raw) {
						which = j
						break
					}
				}
				for j, tid := range derivedIDs {
					if which == j {
						taxaMap[taxID].Traits[tid] = Yes
					} else {
						taxaMap[taxID].Traits[tid] = No
					}
				}
				if which < 0 {
					for _, tid := range derivedIDs {
						taxaMap[taxID].Traits[tid] = NA
					}
				}
			}

		case kindContinuous:
			trait.Type = "continuous"
			overallMin, overallMax := math.Inf(1), math.Inf(-1)
			hasValues, isInteger := false, true

			for i, taxID := range taxonIDs {
				if val, ok := parseRange(getCell(rows, r, taxonCols[i])); ok {
					taxaMap[taxID].ContinuousTraits[trait.ID] = val
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
				trait.MinValue = overallMin
				trait.MaxValue = overallMax
				trait.IsInteger = isInteger
				matrix.Traits = append(matrix.Traits, trait)
			}

		case kindCategoricalMulti:
			trait.Type = "categorical_multi"
			allStates := make(map[string]struct{})
			for i, taxID := range taxonIDs {
				valStr := getCell(rows, r, taxonCols[i])
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
					taxaMap[taxID].CategoricalTraits[trait.ID] = values
				}
			}

			var states []string
			for state := range allStates {
				states = append(states, state)
			}
			sort.Strings(states)
			trait.States = states
			matrix.Traits = append(matrix.Traits, trait)
		}
	}
	log.Printf("[EXCEL PARSER] Pass 2 complete. All traits processed.")

	return nil
}
