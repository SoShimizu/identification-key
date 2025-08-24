// backend/types.go
package main

import "my-id-key/backend/engine"

// KeyInfo フロントへ返す “MyKeys” 内ファイル情報
type KeyInfo struct {
	Name    string `json:"name"`
	Path    string `json:"path"`
	Size    int64  `json:"size"`
	Ext     string `json:"ext"`
	ModTime string `json:"modTime"`
}

// ApplyOptions フロント→バックエンド：ベイズ／ヒューリスティック適用時のオプション
// This struct must contain ALL fields from frontend's AlgoOptions
type ApplyOptions struct {
	DefaultAlphaFP         float64            `json:"defaultAlphaFP"`
	DefaultBetaFN          float64            `json:"defaultBetaFN"`
	GammaNAPenalty         float64            `json:"gammaNAPenalty"`
	Kappa                  float64            `json:"kappa"`
	ConflictPenalty        float64            `json:"conflictPenalty"`
	ToleranceFactor        float64            `json:"toleranceFactor"`
	CategoricalAlgo        string             `json:"categoricalAlgo"`
	JaccardThreshold       float64            `json:"jaccardThreshold"`
	WantInfoGain           bool               `json:"wantInfoGain"`
	UsePragmaticScore      bool               `json:"usePragmaticScore"`
	RecommendationStrategy string             `json:"recommendationStrategy"`
	Lambda                 float64            `json:"lambda"`
	A0                     float64            `json:"a0"`
	B0                     float64            `json:"b0"`
	AlphaFP                map[string]float64 `json:"alphaFP,omitempty"`
	BetaFN                 map[string]float64 `json:"betaFN,omitempty"`
	Confidence             map[string]float64 `json:"confidence,omitempty"`
	Priors                 map[string]float64 `json:"priors,omitempty"`
}

// ApplyRequest フロントからの全リクエストをまとめる構造体
type ApplyRequest struct {
	Selected      map[string]int      `json:"selected"`
	SelectedMulti map[string][]string `json:"selectedMulti"`
	SelectedNA    map[string]bool     `json:"selectedNA"` // NEW: For unobservable traits
	Mode          string              `json:"mode"`
	Algo          string              `json:"algo"`
	Opts          ApplyOptions        `json:"opts"`
}

// ApplyResultEx バックエンド→フロント：スコアと推薦をまとめて返す
type ApplyResultEx struct {
	Scores      []engine.TaxonScore      `json:"scores"`
	Suggestions []engine.TraitSuggestion `json:"suggestions"`
}

// JustificationItem 「なぜ？」機能で各形質の状態を示すための構造体
type JustificationItem struct {
	TraitName      string `json:"traitName"`
	TraitGroupName string `json:"traitGroupName"`
	UserChoice     string `json:"userChoice"`
	TaxonState     string `json:"taxonState"`
	Status         string `json:"status"` // "match", "conflict", "unobserved"
}

// Justification 「なぜ？」機能の全体的な結果
type Justification struct {
	Matches       []JustificationItem `json:"matches"`
	Conflicts     []JustificationItem `json:"conflicts"`
	Unobserved    []JustificationItem `json:"unobserved"`
	MatchCount    int                 `json:"matchCount"`
	ConflictCount int                 `json:"conflictCount"`
}

// HistoryItem ユーザーの操作履歴の各項目
type HistoryItem struct {
	TraitName string `json:"traitName"`
	Selection string `json:"selection"`
	Timestamp int64  `json:"timestamp"`
}

// ReportRequest レポート生成APIへのリクエスト
type ReportRequest struct {
	Lang        string              `json:"lang"` // NEW: Language setting
	MatrixName  string              `json:"matrixName"`
	Algorithm   string              `json:"algorithm"`
	Options     ApplyOptions        `json:"options"`
	History     []HistoryItem       `json:"history"`
	FinalScores []engine.TaxonScore `json:"finalScores"`
	MatrixInfo  engine.MatrixInfo   `json:"matrixInfo"`
}
