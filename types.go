// backend/types.go
package main

import "my-id-key/backend/engine"

// フロントへ返す “MyKeys” 内ファイル情報
type KeyInfo struct {
	Name    string `json:"name"`
	Path    string `json:"path"`
	Size    int64  `json:"size"`
	Ext     string `json:"ext"`
	ModTime string `json:"modTime"`
}

// フロント→バックエンド：ベイズ／ヒューリスティック適用時のオプション
// ベイズ用パラメータは Map を許容（trait/taxon ごとに上書き可能）
type ApplyOptions struct {
	// 誤検出(偽陽性)・見落とし(偽陰性)のデフォルト
	DefaultAlphaFP float64 `json:"defaultAlphaFP"` // P(Yes と言ったのに実は No)
	DefaultBetaFN  float64 `json:"defaultBetaFN"`  // P(No と言ったのに実は Yes) または未検出

	// 形質単位での上書き
	AlphaFP    map[string]float64 `json:"alphaFP,omitempty"`
	BetaFN     map[string]float64 `json:"betaFN,omitempty"`
	Confidence map[string]float64 `json:"confidence,omitempty"` // 観測の確からしさ(0..1)
	Priors     map[string]float64 `json:"priors,omitempty"`     // タクサ事前確率

	// 情報利得（質問推薦）を計算するか
	WantInfoGain bool `json:"wantInfoGain"`

	// Empirical Bayes 用ハイパーパラメータ
	Lambda float64 `json:"lambda"`
	A0     float64 `json:"a0"`
	B0     float64 `json:"b0"`
	Kappa  float64 `json:"kappa"`
}

// バックエンド→フロント：スコアと推薦をまとめて返す
type ApplyResultEx struct {
	Scores      []engine.TaxonScore      `json:"scores"`
	Suggestions []engine.TraitSuggestion `json:"suggestions"`
}
