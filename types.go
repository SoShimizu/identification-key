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
type ApplyOptions struct {
	DefaultAlphaFP float64 `json:"defaultAlphaFP"`
	DefaultBetaFN  float64 `json:"defaultBetaFN"`

	AlphaFP    map[string]float64 `json:"alphaFP,omitempty"`
	BetaFN     map[string]float64 `json:"betaFN,omitempty"`
	Confidence map[string]float64 `json:"confidence,omitempty"`
	Priors     map[string]float64 `json:"priors,omitempty"`

	WantInfoGain      bool    `json:"wantInfoGain"`
	UsePragmaticScore bool    `json:"usePragmaticScore"` // ✨ フロントからの値を受け取るフィールドを追加
	Lambda            float64 `json:"lambda"`
	A0                float64 `json:"a0"`
	B0                float64 `json:"b0"`
	Kappa             float64 `json:"kappa"`
	ConflictPenalty   float64 `json:"conflictPenalty"`
}

// バックエンド→フロント：スコアと推薦をまとめて返す
type ApplyResultEx struct {
	Scores      []engine.TaxonScore      `json:"scores"`
	Suggestions []engine.TraitSuggestion `json:"suggestions"`
}
