// backend/app_api.go
package main

import (
	"encoding/base64"
	"fmt"
	"os"
	"path/filepath"

	"my-id-key/backend/engine"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

// EnsureMyKeysAndSamples
// keys/ が空ならデモ行列を自動生成
func (a *App) EnsureMyKeysAndSamples() error {
	if err := os.MkdirAll(a.keysDir, 0o755); err != nil {
		return err
	}
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
			// フォルダは見つかったが、キーが一つもなかった場合
			runtime.LogInfo(a.ctx, "No keys found in the keys directory.")
			return &engine.Matrix{Name: "No keys found"}, nil // 空のMatrixを返してUIがクラッシュしないようにする
		}
		if err := a.setCurrentKeyByPath(list[0].Path); err != nil {
			return nil, err
		}
	}
	return a.currentMatrix, nil
}

// GetHelpImage: ヘルプ画像を読み込んでBase64エンコードされた文字列として返す
func (a *App) GetHelpImage(filename string) (string, error) {
	// ✨ 起動時に設定したbasePathを基準にパスを構築
	imgPath := filepath.Join(a.basePath, "help_materials", filename)

	data, err := os.ReadFile(imgPath)
	if err != nil {
		runtime.LogError(a.ctx, fmt.Sprintf("Failed to read help image %s: %v", imgPath, err))
		return "", err
	}

	return base64.StdEncoding.EncodeToString(data), nil
}

// ApplyFiltersAlgoOpt
func (a *App) ApplyFiltersAlgoOpt(
	selected map[string]int,
	mode string,
	algo string,
	opts ApplyOptions,
) (*ApplyResultEx, error) {
	if a.currentMatrix == nil {
		if _, err := a.GetMatrix(); err != nil {
			return nil, err
		}
	}

	eopts := engine.AlgoOptions{
		DefaultAlphaFP:    opts.DefaultAlphaFP,
		DefaultBetaFN:     opts.DefaultBetaFN,
		WantInfoGain:      opts.WantInfoGain,
		UsePragmaticScore: opts.UsePragmaticScore,
		Lambda:            opts.Lambda,
		A0:                opts.A0,
		B0:                opts.B0,
		Kappa:             opts.Kappa,
		ConflictPenalty:   opts.ConflictPenalty,
	}

	res, err := engine.ApplyFiltersAlgoOpt(
		a.currentMatrix,
		selected,
		mode,
		algo,
		eopts,
	)
	if err != nil {
		return nil, err
	}

	return &ApplyResultEx{
		Scores:      res.Scores,
		Suggestions: res.Suggestions,
	}, nil
}
