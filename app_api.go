// backend/app_api.go
package main

import (
	"encoding/base64"
	"fmt"
	"log"
	"os"
	"path/filepath"

	"my-id-key/backend/engine"

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

	if err := writeSampleBinaryV2(filepath.Join(a.keysDir, "Binary_v2_demo.xlsx")); err != nil {
		return err
	}
	if err := writeSampleMixedV2(filepath.Join(a.keysDir, "Mixed_v2_demo.xlsx")); err != nil {
		return err
	}
	if err := writeSampleSmallV2(filepath.Join(a.keysDir, "Small_v2_demo.xlsx")); err != nil {
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
		RecommendationStrategy: req.Opts.RecommendationStrategy, // BUG FIX: Pass strategy to engine
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
