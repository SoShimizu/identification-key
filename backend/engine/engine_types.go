// backend/engine/engine_types.go
package engine

type Ternary int8

const (
	No  Ternary = -1
	NA  Ternary = 0
	Yes Ternary = 1
)

type Trait struct {
	ID     string  `json:"id"`
	Name   string  `json:"name"`
	Group  string  `json:"group"`
	Type   string  `json:"type"`
	Parent string  `json:"parent,omitempty"`
	State  string  `json:"state,omitempty"`
	Cost   float64 `json:"cost,omitempty"`
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

type TaxonScore struct {
	Index     int     `json:"index"` // The original index in Matrix.Taxa
	Taxon     Taxon   `json:"taxon"`
	Post      float64 `json:"post"`
	Delta     float64 `json:"delta"`
	Used      int     `json:"used"`
	Conflicts int     `json:"conflicts"`
	Match     int     `json:"match"`
	Support   int     `json:"support"`
}

type StateProb struct {
	State string  `json:"state"`
	P     float64 `json:"p"`
}

type TraitSuggestion struct {
	TraitId string      `json:"traitId"`
	Name    string      `json:"name"`
	Group   string      `json:"group"`
	IG      float64     `json:"ig"`
	ECR     float64     `json:"ecr"`
	Gini    float64     `json:"gini"`
	Entropy float64     `json:"entropy"`
	PStates []StateProb `json:"pStates"`
	Cost    float64     `json:"cost,omitempty"`
	Score   float64     `json:"score"`
}

type AlgoOptions struct {
	DefaultAlphaFP float64 `json:"defaultAlphaFP"`
	DefaultBetaFN  float64 `json:"defaultBetaFN"`
	WantInfoGain   bool    `json:"wantInfoGain"`
	Lambda         float64 `json:"lambda"`
	A0             float64 `json:"a0"`
	B0             float64 `json:"b0"`
	Kappa          float64 `json:"kappa"`
}

type EvalResult struct {
	Scores      []TaxonScore      `json:"scores"`
	Suggestions []TraitSuggestion `json:"suggestions"`
}
