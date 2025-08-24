// backend/app_api.go
package main

import (
	"encoding/base64"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"my-id-key/backend/engine"

	"github.com/google/uuid"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// EnsureMyKeysAndSamples
// keys/ と help_materials/ を確認し、空ならデモファイル群を自動生成
func (a *App) EnsureMyKeysAndSamples() error {
	// Ensure keys directory exists
	if err := os.MkdirAll(a.keysDir, 0o755); err != nil {
		return fmt.Errorf("failed to create keys directory: %w", err)
	}

	// --- NEW: Ensure help_materials directory and sample image exist ---
	materialsDir := filepath.Join(a.basePath, "help_materials")
	if err := os.MkdirAll(materialsDir, 0o755); err != nil {
		return fmt.Errorf("failed to create help_materials directory: %w", err)
	}
	// Create reports directory
	reportsDir := filepath.Join(a.basePath, "my_identification_reports")
	if err := os.MkdirAll(reportsDir, 0o755); err != nil {
		return fmt.Errorf("failed to create my_identification_reports directory: %w", err)
	}

	sampleImagePath := filepath.Join(materialsDir, "sample_image.png")
	if _, err := os.Stat(sampleImagePath); os.IsNotExist(err) {
		// Image does not exist, so create it
		pngData, err := createPlaceholderImage()
		if err != nil {
			log.Printf("Failed to generate placeholder image: %v", err)
			return err
		}
		if err := os.WriteFile(sampleImagePath, pngData, 0o644); err != nil {
			log.Printf("Failed to write sample image: %v", err)
			return err
		}
		log.Printf("Successfully created sample image at: %s", sampleImagePath)
	}
	// --- END NEW ---

	// Check if sample keys need to be created
	list, _ := a.listXLSX()
	if len(list) > 0 {
		return nil
	}

	// --- NEW: Write updated samples ---
	if err := writeSampleSakura(filepath.Join(a.keysDir, "Sample_Sakura.xlsx")); err != nil {
		return err
	}
	if err := writeSampleKarasu(filepath.Join(a.keysDir, "Sample_Karasu.xlsx")); err != nil {
		return err
	}
	if err := writeSampleHonyurui(filepath.Join(a.keysDir, "Sample_Honyurui.xlsx")); err != nil {
		return err
	}
	if err := writeSampleSuzumebachi(filepath.Join(a.keysDir, "Sample_Suzumebachi.xlsx")); err != nil {
		return err
	}

	runtime.LogInfo(a.ctx, "[EnsureMyKeysAndSamples] demo keys written")
	return nil
}

// ListMyKeys: keys/ 直下の .xlsx 一覧を返す
func (a *App) ListMyKeys() ([]KeyInfo, error) {
	return a.listXLSX()
}

// GetCurrentKeyName: 現在選択中のキー名（無ければ""）
func (a *App) GetCurrentKeyName() string {
	return a.currentKey
}

// PickKey: フロントからの選択→ロード
func (a *App) PickKey(name string) error {
	if name == "" {
		return fmt.Errorf("empty name")
	}
	p := filepath.Join(a.keysDir, name)
	return a.setCurrentKeyByPath(p)
}

// GetMatrix: 現在の行列（名前/タクサ数/Traits含む）を返す
func (a *App) GetMatrix() (*engine.Matrix, error) {
	if a.currentMatrix == nil {
		_ = a.EnsureMyKeysAndSamples()
		list, err := a.listXLSX()
		if err != nil {
			return nil, err
		}
		if len(list) == 0 {
			runtime.LogInfo(a.ctx, "No keys found in the keys directory.")
			return &engine.Matrix{Name: "No keys found"}, nil
		}
		if err := a.setCurrentKeyByPath(list[0].Path); err != nil {
			return nil, err
		}
	}
	return a.currentMatrix, nil
}

// GetTaxonDetails returns all available data for a single taxon.
func (a *App) GetTaxonDetails(taxonID string) (*engine.Taxon, error) {
	if a.currentMatrix == nil {
		return nil, fmt.Errorf("no matrix loaded")
	}
	for _, taxon := range a.currentMatrix.Taxa {
		if taxon.ID == taxonID {
			return &taxon, nil
		}
	}
	return nil, fmt.Errorf("taxon with ID '%s' not found", taxonID)
}

// GetHelpImage: ヘルプ画像を読み込んでBase64エンコードされた文字列として返す
func (a *App) GetHelpImage(filename string) (string, error) {
	// Try help_materials first, then fall back to keys directory for taxon images
	imgPath := filepath.Join(a.basePath, "help_materials", filename)

	if _, err := os.Stat(imgPath); os.IsNotExist(err) {
		// Fallback for taxon images which might be placed alongside keys
		imgPath = filepath.Join(a.keysDir, filename)
	}

	data, err := os.ReadFile(imgPath)
	if err != nil {
		log.Printf("ERROR: Failed to read image %s: %v", filename, err)
		return "", err
	}

	return base64.StdEncoding.EncodeToString(data), nil
}

// ApplyFiltersAlgoOpt now accepts a single request struct
func (a *App) ApplyFiltersAlgoOpt(req ApplyRequest) (*ApplyResultEx, error) {
	log.Println("===== New ApplyFiltersAlgoOpt Request =====")
	log.Printf("[API] Received Mode: %s, Algo: %s", req.Mode, req.Algo)
	log.Printf("[API] Received Selected (Binary/Continuous): %+v", req.Selected)
	log.Printf("[API] Received SelectedMulti (Categorical): %+v", req.SelectedMulti)

	if a.currentMatrix == nil {
		if _, err := a.GetMatrix(); err != nil {
			return nil, err
		}
	}

	eopts := engine.AlgoOptions{
		DefaultAlphaFP:         req.Opts.DefaultAlphaFP,
		DefaultBetaFN:          req.Opts.DefaultBetaFN,
		GammaNAPenalty:         req.Opts.GammaNAPenalty,
		WantInfoGain:           req.Opts.WantInfoGain,
		UsePragmaticScore:      req.Opts.UsePragmaticScore,
		RecommendationStrategy: req.Opts.RecommendationStrategy,
		Lambda:                 req.Opts.Lambda,
		A0:                     req.Opts.A0,
		B0:                     req.Opts.B0,
		Kappa:                  req.Opts.Kappa,
		ConflictPenalty:        req.Opts.ConflictPenalty,
		ToleranceFactor:        req.Opts.ToleranceFactor,
		CategoricalAlgo:        req.Opts.CategoricalAlgo,
		JaccardThreshold:       req.Opts.JaccardThreshold,
	}

	res, err := engine.ApplyFiltersAlgoOpt(
		a.currentMatrix,
		req.Selected,
		req.SelectedMulti,
		req.Mode,
		req.Algo,
		eopts,
	)
	if err != nil {
		log.Printf("Error from engine.ApplyFiltersAlgoOpt: %v", err)
		return nil, err
	}

	log.Println("===== ApplyFiltersAlgoOpt Request Finished =====")
	return &ApplyResultEx{
		Scores:      res.Scores,
		Suggestions: res.Suggestions,
	}, nil
}

// SaveReportDialog displays a save file dialog for the report.
func (a *App) SaveReportDialog(defaultName string) (string, error) {
	return runtime.SaveFileDialog(a.ctx, runtime.SaveDialogOptions{
		DefaultDirectory: a.reportsDir,
		DefaultFilename:  defaultName,
		Title:            "Save Identification Report",
		Filters: []runtime.FileFilter{
			{
				DisplayName: "Text Files (*.txt)",
				Pattern:     "*.txt",
			},
		},
	})
}

// GenerateIdentificationReport generates a human-readable text report of the identification session and saves it to the path chosen by the user.
// GenerateIdentificationReport generates a human-readable text report.
func (a *App) GenerateIdentificationReport(req ReportRequest, path string) error {

	s := getReportStrings(req.Lang)

	var sb strings.Builder

	// Header
	sb.WriteString("==================================================\n")
	sb.WriteString(fmt.Sprintf("       %s\n", s.Title))
	sb.WriteString("==================================================\n\n")
	sb.WriteString(fmt.Sprintf("%s: %s\n", s.ReportID, uuid.New().String()))
	sb.WriteString(fmt.Sprintf("%s: %s\n", s.Date, time.Now().Format("2006-01-02 15:04:05 MST")))
	sb.WriteString("\n")

	// Matrix Info
	sb.WriteString("--------------------------------------------------\n")
	sb.WriteString(fmt.Sprintf("%s\n", s.MatrixInfoTitle))
	sb.WriteString("--------------------------------------------------\n")
	sb.WriteString(fmt.Sprintf("  - %s: %s\n", s.MatrixFile, req.MatrixName))
	matrixTitle := req.MatrixInfo.TitleEN
	if req.Lang == "ja" && req.MatrixInfo.TitleJP != "" {
		matrixTitle = req.MatrixInfo.TitleJP
	}
	sb.WriteString(fmt.Sprintf("  - %s: %s\n", s.MatrixTitle, matrixTitle))
	sb.WriteString(fmt.Sprintf("  - %s: %s\n", s.MatrixVersion, req.MatrixInfo.Version))
	matrixAuthors := req.MatrixInfo.AuthorsEN
	if req.Lang == "ja" && req.MatrixInfo.AuthorsJP != "" {
		matrixAuthors = req.MatrixInfo.AuthorsJP
	}
	sb.WriteString(fmt.Sprintf("  - %s: %s\n", s.MatrixAuthors, matrixAuthors))
	matrixCitation := req.MatrixInfo.CitationEN
	if req.Lang == "ja" && req.MatrixInfo.CitationJP != "" {
		matrixCitation = req.MatrixInfo.CitationJP
	}
	if matrixCitation != "" {
		sb.WriteString(fmt.Sprintf("  - %s: %s\n", s.MatrixCitation, matrixCitation))
	}
	sb.WriteString("\n")

	// Parameters
	sb.WriteString("--------------------------------------------------\n")
	sb.WriteString(fmt.Sprintf("%s\n", s.ParametersUsed))
	sb.WriteString("--------------------------------------------------\n")
	sb.WriteString(fmt.Sprintf("  - %s: %s\n", s.Algorithm, req.Algorithm))
	sb.WriteString(fmt.Sprintf("  - %s: %.4f\n", s.Alpha, req.Options.DefaultAlphaFP))
	sb.WriteString(fmt.Sprintf("  - %s: %.4f\n", s.Beta, req.Options.DefaultBetaFN))
	sb.WriteString(fmt.Sprintf("  - %s: %.4f\n", s.Gamma, req.Options.GammaNAPenalty))
	sb.WriteString(fmt.Sprintf("  - %s: %.4f\n", s.Kappa, req.Options.Kappa))
	sb.WriteString(fmt.Sprintf("  - %s: %.4f\n", s.ConflictPenalty, req.Options.ConflictPenalty))
	sb.WriteString(fmt.Sprintf("  - %s: %.2f%%\n", s.Tolerance, req.Options.ToleranceFactor*100))
	sb.WriteString("\n")

	// Observation History
	sb.WriteString("--------------------------------------------------\n")
	sb.WriteString(fmt.Sprintf("%s\n", s.ObservationHistory))
	sb.WriteString("--------------------------------------------------\n")
	if len(req.History) == 0 {
		sb.WriteString(fmt.Sprintf("  %s\n", s.NoObservations))
	} else {
		sort.SliceStable(req.History, func(i, j int) bool {
			return req.History[i].Timestamp < req.History[j].Timestamp
		})
		for i, item := range req.History {
			sb.WriteString(fmt.Sprintf("  %d. %s: %s\n", i+1, item.TraitName, item.Selection))
		}
	}
	sb.WriteString("\n")

	// Final Results
	sb.WriteString("--------------------------------------------------\n")
	sb.WriteString(fmt.Sprintf("%s\n", s.FinalRanking))
	sb.WriteString("--------------------------------------------------\n")
	if len(req.FinalScores) == 0 {
		sb.WriteString(fmt.Sprintf("  %s\n", s.NoCandidates))
	} else {
		header := fmt.Sprintf("%-6s %-40s %-15s %-12s %-10s\n", s.RankHeader, s.TaxonHeader, s.ScoreHeader, s.ConflictsHeader, s.MatchSupportHeader)
		sb.WriteString(header)
		sb.WriteString(strings.Repeat("-", 85) + "\n")
		for i, score := range req.FinalScores {
			if i >= 10 {
				sb.WriteString(fmt.Sprintf("  "+s.AndMore+"\n", len(req.FinalScores)-10))
				break
			}
			probStr := fmt.Sprintf("%.4f", score.Post)
			matchSupport := fmt.Sprintf("%d/%d", score.Match, score.Support)

			// CORRECTED: Format scientific name with asterisks for italics
			formattedName := fmt.Sprintf("*%s %s*", score.Taxon.Genus, score.Taxon.Species)
			if score.Taxon.Subspecies != "" {
				formattedName += fmt.Sprintf(" *%s*", score.Taxon.Subspecies)
			}

			sb.WriteString(fmt.Sprintf("%-6d %-40s %-15s %-12d %-10s\n", i+1, formattedName, probStr, score.Conflicts, matchSupport))
		}
	}
	sb.WriteString("\n")

	// Confidence Score
	var confidence string
	if len(req.FinalScores) >= 2 {
		if req.FinalScores[1].Post > 1e-9 { // Avoid division by zero
			ratio := req.FinalScores[0].Post / req.FinalScores[1].Post
			if ratio > 2.0 {
				confidence = fmt.Sprintf(s.ConfidenceHigh, ratio)
			} else {
				confidence = s.ConfidenceContested
			}
		} else {
			confidence = s.ConfidenceVeryHigh
		}
	} else if len(req.FinalScores) == 1 {
		confidence = s.ConfidenceAbsolute
	} else {
		confidence = s.ConfidenceNA
	}
	sb.WriteString("--------------------------------------------------\n")
	sb.WriteString(fmt.Sprintf("%s\n", s.ConfidenceTitle))
	sb.WriteString("--------------------------------------------------\n")
	sb.WriteString(fmt.Sprintf("  %s\n\n", confidence))
	sb.WriteString(fmt.Sprintf("  %s\n\n", s.ConfidenceDisclaimer))

	// Citation Note
	sb.WriteString("--------------------------------------------------\n")
	sb.WriteString(fmt.Sprintf("%s\n", s.CitationTitle))
	sb.WriteString("--------------------------------------------------\n")
	sb.WriteString(fmt.Sprintf("  %s\n\n", s.CitationText))

	sb.WriteString("==================================================\n")
	sb.WriteString(fmt.Sprintf("               %s\n", s.EndOfReport))
	sb.WriteString("==================================================\n")

	return os.WriteFile(path, []byte(sb.String()), 0644)
}

// GetJustificationForTaxon returns a breakdown of which traits match, conflict, or are unobserved for a given taxon.
func (a *App) GetJustificationForTaxon(taxonID string, selected map[string]int, selectedMulti map[string][]string) (*Justification, error) {
	if a.currentMatrix == nil {
		return nil, fmt.Errorf("no matrix loaded")
	}

	var targetTaxon *engine.Taxon
	for i := range a.currentMatrix.Taxa {
		if a.currentMatrix.Taxa[i].ID == taxonID {
			targetTaxon = &a.currentMatrix.Taxa[i]
			break
		}
	}

	if targetTaxon == nil {
		return nil, fmt.Errorf("taxon with ID '%s' not found", taxonID)
	}

	traitMap := make(map[string]engine.Trait)
	parentTraits := make(map[string]engine.Trait)
	childrenMap := make(map[string][]engine.Trait)

	for _, t := range a.currentMatrix.Traits {
		traitMap[t.ID] = t
		if t.Type == "nominal_parent" {
			parentTraits[t.NameEN] = t // Using NameEN as key
		}
		if t.Parent != "" {
			// Using Parent TraitID as key
			childrenMap[t.Parent] = append(childrenMap[t.Parent], t)
		}
	}

	justification := &Justification{}

	// Create a map of all user selections for easier lookup
	allSelections := make(map[string]bool)
	for k := range selected {
		allSelections[k] = true
	}
	for k := range selectedMulti {
		allSelections[k] = true
	}

	for _, trait := range a.currentMatrix.Traits {
		// Skip derived traits, they are handled via their parent
		if trait.Type == "derived" {
			continue
		}

		userChoiceStr := "Unobserved"
		taxonStateStr := "NA"
		status := "unobserved"

		// Check if this trait (or its children) were selected by the user
		isSelected := false
		if _, ok := allSelections[trait.ID]; ok {
			isSelected = true
		} else if trait.Type == "nominal_parent" {
			for _, child := range childrenMap[trait.TraitID] {
				if _, ok := allSelections[child.ID]; ok {
					isSelected = true
					break
				}
			}
		}

		if !isSelected {
			justification.Unobserved = append(justification.Unobserved, JustificationItem{
				TraitName:      trait.NameEN,
				TraitGroupName: trait.GroupEN,
				Status:         "unobserved",
			})
			continue
		}

		// --- Process selected traits ---
		switch trait.Type {
		case "binary":
			userChoice, _ := selected[trait.ID]
			userChoiceStr = ternaryToString(engine.Ternary(userChoice))
			taxonState, _ := targetTaxon.Traits[trait.ID]
			taxonStateStr = ternaryToString(taxonState)
			if userChoice != 0 && taxonState != 0 {
				if userChoice == int(taxonState) {
					status = "match"
				} else {
					status = "conflict"
				}
			} else {
				status = "neutral"
			}

		case "continuous":
			userValue, _ := selected[trait.ID]
			userChoiceStr = fmt.Sprintf("%v", userValue)
			taxonValue, ok := targetTaxon.ContinuousTraits[trait.ID]
			if ok {
				taxonStateStr = fmt.Sprintf("[%.2f, %.2f]", taxonValue.Min, taxonValue.Max)
				if float64(userValue) >= taxonValue.Min && float64(userValue) <= taxonValue.Max {
					status = "match"
				} else {
					status = "conflict"
				}
			} else {
				taxonStateStr = "NA"
				status = "neutral"
			}

		case "categorical_multi":
			userStates, _ := selectedMulti[trait.ID]
			userChoiceStr = strings.Join(userStates, "; ")
			taxonStates, ok := targetTaxon.CategoricalTraits[trait.ID]
			if ok {
				taxonStateStr = strings.Join(taxonStates, "; ")
				if hasIntersection(userStates, taxonStates) {
					status = "match"
				} else {
					status = "conflict"
				}
			} else {
				taxonStateStr = "NA"
				status = "neutral"
			}

		case "nominal_parent":
			var chosenChild engine.Trait
			for _, child := range childrenMap[trait.TraitID] {
				if val, ok := selected[child.ID]; ok && val == 1 {
					chosenChild = child
					break
				}
			}
			userChoiceStr = chosenChild.State

			var taxonChildState engine.Trait
			for _, child := range childrenMap[trait.TraitID] {
				if val, ok := targetTaxon.Traits[child.ID]; ok && val == 1 {
					taxonChildState = child
					break
				}
			}

			if taxonChildState.ID != "" {
				taxonStateStr = taxonChildState.State
				if chosenChild.ID == taxonChildState.ID {
					status = "match"
				} else {
					status = "conflict"
				}
			} else {
				taxonStateStr = "NA"
				status = "neutral"
			}
		}

		item := JustificationItem{
			TraitName:      trait.NameEN,
			TraitGroupName: trait.GroupEN,
			UserChoice:     userChoiceStr,
			TaxonState:     taxonStateStr,
			Status:         status,
		}

		if status == "match" {
			justification.Matches = append(justification.Matches, item)
		} else if status == "conflict" {
			justification.Conflicts = append(justification.Conflicts, item)
		}
	}

	justification.MatchCount = len(justification.Matches)
	justification.ConflictCount = len(justification.Conflicts)

	return justification, nil
}

// --- Helper Functions ---

func ternaryToString(t engine.Ternary) string {
	switch t {
	case engine.Yes:
		return "Yes"
	case engine.No:
		return "No"
	case engine.NA:
		return "NA"
	default:
		return "Unknown"
	}
}

// hasIntersection checks if there is at least one common element.
func hasIntersection(set1, set2 []string) bool {
	map1 := make(map[string]struct{}, len(set1))
	for _, item := range set1 {
		map1[item] = struct{}{}
	}
	for _, item := range set2 {
		if _, found := map1[item]; found {
			return true
		}
	}
	return false
}
