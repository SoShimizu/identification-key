// backend/app_api.go
package main

import (
	"encoding/base64"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"my-id-key/backend/engine"

	"baliance.com/gooxml/color"
	"baliance.com/gooxml/document"
	"baliance.com/gooxml/schema/soo/wml"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"golang.org/x/net/html"
)

// EnsureMyKeysAndSamples
// keys/ と help_materials/ を確認し、空ならデモファイル群を自動生成
func (a *App) EnsureMyKeysAndSamples() error {
	// Ensure keys directory exists
	if err := os.MkdirAll(a.keysDir, 0o755); err != nil {
		return fmt.Errorf("failed to create keys directory: %w", err)
	}

	materialsDir := filepath.Join(a.basePath, "help_materials")
	if err := os.MkdirAll(materialsDir, 0o755); err != nil {
		return fmt.Errorf("failed to create help_materials directory: %w", err)
	}
	reportsDir := filepath.Join(a.basePath, "my_identification_reports")
	if err := os.MkdirAll(reportsDir, 0o755); err != nil {
		return fmt.Errorf("failed to create my_identification_reports directory: %w", err)
	}

	sampleImagePath := filepath.Join(materialsDir, "sample_image.png")
	if _, err := os.Stat(sampleImagePath); os.IsNotExist(err) {
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

	list, _ := a.listXLSX()
	if len(list) > 0 {
		return nil
	}

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
	imgPath := filepath.Join(a.basePath, "help_materials", filename)

	if _, err := os.Stat(imgPath); os.IsNotExist(err) {
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

// SaveReport はフロントエンドから受け取ったHTMLコンテンツを指定された形式で保存します。
func (a *App) SaveReport(htmlContent string, format string, defaultName string) (string, error) {
	var dialogOptions runtime.SaveDialogOptions
	if format == "docx" {
		dialogOptions = runtime.SaveDialogOptions{
			DefaultDirectory: a.reportsDir,
			DefaultFilename:  strings.Replace(defaultName, ".txt", ".docx", 1),
			Title:            "Save Report as Word Document",
			Filters:          []runtime.FileFilter{{DisplayName: "Word Documents (*.docx)", Pattern: "*.docx"}},
		}
	} else {
		dialogOptions = runtime.SaveDialogOptions{
			DefaultDirectory: a.reportsDir,
			DefaultFilename:  defaultName,
			Title:            "Save Report as Text File",
			Filters:          []runtime.FileFilter{{DisplayName: "Text Files (*.txt)", Pattern: "*.txt"}},
		}
	}

	path, err := runtime.SaveFileDialog(a.ctx, dialogOptions)
	if err != nil {
		return "", err
	}
	if path == "" {
		return "", nil // ユーザーがキャンセル
	}

	if format == "docx" {
		err = saveAsDocx(htmlContent, path)
	} else {
		err = saveAsTxt(htmlContent, path)
	}

	if err != nil {
		return "", err
	}

	return path, nil
}

// saveAsTxt はHTMLをプレーンテキストに変換して保存します。
func saveAsTxt(htmlContent string, path string) error {
	re := regexp.MustCompile("<[^>]*>")
	plainText := re.ReplaceAllString(htmlContent, "")
	plainText = html.UnescapeString(plainText)
	return os.WriteFile(path, []byte(plainText), 0644)
}

// saveAsDocx はHTMLをDOCXに変換して保存します。
func saveAsDocx(htmlContent string, path string) error {
	doc := document.New()
	tokenizer := html.NewTokenizer(strings.NewReader(htmlContent))

	var currentPara document.Paragraph
	var isBold, isItalic, isUnderline bool

	currentPara = doc.AddParagraph()

	for {
		tt := tokenizer.Next()
		switch tt {
		case html.ErrorToken:
			if tokenizer.Err() == io.EOF {
				return doc.SaveToFile(path)
			}
			return fmt.Errorf("error tokenizing html: %v", tokenizer.Err())

		case html.TextToken:
			text := html.UnescapeString(string(tokenizer.Text()))
			if len(text) > 0 {
				run := currentPara.AddRun()
				run.AddText(text)
				props := run.Properties()
				props.SetBold(isBold)
				props.SetItalic(isItalic)
				if isUnderline {
					props.SetUnderline(wml.ST_UnderlineSingle, color.Auto)
				}
			}

		case html.StartTagToken, html.EndTagToken:
			tn, _ := tokenizer.TagName()
			tagName := string(tn)

			if tagName == "p" || tagName == "h1" {
				if tt == html.StartTagToken {
					currentPara = doc.AddParagraph()
					if tagName == "h1" {
						currentPara.Properties().SetStyle("Heading1")
					}
				} else {
					isBold, isItalic, isUnderline = false, false, false
				}
			} else if tagName == "strong" || tagName == "b" {
				isBold = (tt == html.StartTagToken)
			} else if tagName == "em" || tagName == "i" {
				isItalic = (tt == html.StartTagToken)
			} else if tagName == "u" {
				isUnderline = (tt == html.StartTagToken)
			} else if tagName == "br" && tt == html.StartTagToken {
				currentPara.AddRun().AddBreak()
			}
		}
	}
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
			parentTraits[t.NameEN] = t
		}
		if t.Parent != "" {
			childrenMap[t.Parent] = append(childrenMap[t.Parent], t)
		}
	}

	justification := &Justification{}

	allSelections := make(map[string]bool)
	for k := range selected {
		allSelections[k] = true
	}
	for k := range selectedMulti {
		allSelections[k] = true
	}

	for _, trait := range a.currentMatrix.Traits {
		if trait.Type == "derived" {
			continue
		}

		userChoiceStr := "Unobserved"
		taxonStateStr := "NA"
		status := "unobserved"

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
