package engine

// ==== 基本型 & 公開構造体（Wails/TSに渡る） ====

type Ternary int8

const (
	No  Ternary = -1
	NA  Ternary = 0
	Yes Ternary = 1
)

type Trait struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Group  string `json:"group"`
	Type   string `json:"type"`             // "binary" | "derived"
	Parent string `json:"parent,omitempty"` // derived の親（名前/IDどちらでも）
	State  string `json:"state,omitempty"`  // 派生の状態ラベル
}

type Taxon struct {
	ID     string             `json:"id"`
	Name   string             `json:"name"`
	Traits map[string]Ternary `json:"traits"`
}

type Matrix struct {
	Name   string  `json:"name"`
	Traits []Trait `json:"traits"`
	Taxa   []Taxon `json:"taxa"`
}

// 候補タクサの行
type TaxonScore struct {
	Taxon     Taxon   `json:"taxon"`
	Post      float64 `json:"post"`      // 事後
	Delta     float64 `json:"delta"`     // 1位との差
	Used      int     `json:"used"`      // 使用観測数
	Conflicts int     `json:"conflicts"` // 矛盾数
	Match     int     `json:"match"`     // 一致
	Support   int     `json:"support"`   // 分母
}

// 推奨の状態出現確率
type StateProb struct {
	State string  `json:"state"`
	P     float64 `json:"p"`
}

// 「次に効く形質」
type TraitSuggestion struct {
	TraitId string      `json:"traitId"`
	Name    string      `json:"name"`
	Group   string      `json:"group"`
	IG      float64     `json:"ig"`      // 情報利得
	ECR     float64     `json:"ecr"`     // 期待候補削減率
	Gini    float64     `json:"gini"`    // 1-Σp^2
	Entropy float64     `json:"entropy"` // H
	PStates []StateProb `json:"pStates"` // 状態分布
	Cost    float64     `json:"cost,omitempty"`
	Score   float64     `json:"score"` // 並べ替え用（既定=IG）
}

// モード/アルゴ & パラメータ
type AlgoOptions struct {
	DefaultAlphaFP float64 `json:"defaultAlphaFP"` // 偽陽性 P(obs=Yes | truth=No)
	DefaultBetaFN  float64 `json:"defaultBetaFN"`  // 偽陰性 P(obs=No  | truth=Yes)
	WantInfoGain   bool    `json:"wantInfoGain"`
	Lambda         float64 `json:"lambda"` // 予備
	A0             float64 `json:"a0"`     // 予備（経験ベイズの超パラ用途）
	B0             float64 `json:"b0"`
	Kappa          float64 `json:"kappa"`
}

// 評価結果
type EvalResult struct {
	Scores      []TaxonScore      `json:"scores"`
	Suggestions []TraitSuggestion `json:"suggestions"`
}
