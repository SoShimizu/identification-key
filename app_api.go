// backend/app_api.go
package main

import (
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
			return &engine.Matrix{}, nil
		}
		if err := a.setCurrentKeyByPath(list[0].Path); err != nil {
			return nil, err
		}
	}
	return a.currentMatrix, nil
}

// ApplyFiltersAlgoOpt:
//   - selected: 形質ID -> -1/0/1
//   - mode: "lenient" | "strict"
//   - algo: "bayes" | "heuristic"
//   - options: 誤検出/見落とし/ハイパパラ/情報利得有無 など
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

	// app 側オプション → engine 側オプションへ写し替え
	eopts := engine.AlgoOptions{
		DefaultAlphaFP:    opts.DefaultAlphaFP,
		DefaultBetaFN:     opts.DefaultBetaFN,
		WantInfoGain:      opts.WantInfoGain,
		UsePragmaticScore: opts.UsePragmaticScore, // ✨ この行を追加して値を引き渡す
		Lambda:            opts.Lambda,
		A0:                opts.A0,
		B0:                opts.B0,
		Kappa:             opts.Kappa,
		ConflictPenalty:   opts.ConflictPenalty,
	}

	// 新しいエンジンへ処理を委譲
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
