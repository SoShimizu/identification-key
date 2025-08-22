// backend/engine/engine_types.go
package engine

// ContinuousValue represents a min-max range for a continuous trait.
type ContinuousValue struct {
	Min float64 `json:"min"`
	Max float64 `json:"max"`
}

type Ternary int8

const (
	No  Ternary = -1
	NA  Ternary = 0
	Yes Ternary = 1
)

type Trait struct {
	ID         string   `json:"id"`
	Name       string   `json:"name"`
	Group      string   `json:"group"`
	Type       string   `json:"type"` // "binary", "derived", "nominal_parent", "continuous", "categorical_multi"
	Parent     string   `json:"parent,omitempty"`
	State      string   `json:"state,omitempty"`
	Difficulty float64  `json:"difficulty,omitempty"`
	Risk       float64  `json:"risk,omitempty"`
	HelpText   string   `json:"helpText,omitempty"`
	HelpImages []string `json:"helpImages,omitempty"`
	// For continuous traits
	MinValue  float64 `json:"minValue,omitempty"`
	MaxValue  float64 `json:"maxValue,omitempty"`
	IsInteger bool    `json:"isInteger,omitempty"` // True if the trait only takes integer values
	// For categorical_multi traits
	States []string `json:"states,omitempty"`
}

type Taxon struct {
	ID                string                     `json:"id"`
	Name              string                     `json:"name"`
	Traits            map[string]Ternary         `json:"traits"`
	ContinuousTraits  map[string]ContinuousValue `json:"continuousTraits"`
	CategoricalTraits map[string][]string        `json:"categoricalTraits"`
	Description       string                     `json:"description,omitempty"`
	References        string                     `json:"references,omitempty"`
	Images            []string                   `json:"images,omitempty"`
}

type Matrix struct {
	Name   string  `json:"name"`
	Traits []Trait `json:"traits"`
	Taxa   []Taxon `json:"taxa"`
}

type TaxonScore struct {
	Index     int     `json:"index"`
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
	TraitId    string      `json:"traitId"`
	Name       string      `json:"name"`
	Group      string      `json:"group"`
	IG         float64     `json:"ig"`
	MaxIG      float64     `json:"max_ig"` // NEW: To store the max possible IG for a state
	ECR        float64     `json:"ecr"`
	Gini       float64     `json:"gini"`
	Entropy    float64     `json:"entropy"`
	PStates    []StateProb `json:"pStates"`
	Difficulty float64     `json:"difficulty,omitempty"`
	Risk       float64     `json:"risk,omitempty"`
	Score      float64     `json:"score"`
}
type AlgoOptions struct {
	DefaultAlphaFP         float64 `json:"defaultAlphaFP"`
	DefaultBetaFN          float64 `json:"defaultBetaFN"`
	GammaNAPenalty         float64 `json:"gammaNAPenalty"`
	WantInfoGain           bool    `json:"wantInfoGain"`
	UsePragmaticScore      bool    `json:"usePragmaticScore"`
	RecommendationStrategy string  `json:"recommendationStrategy"` // NEW: "expected_ig" or "max_ig"
	Lambda                 float64 `json:"lambda"`
	A0                     float64 `json:"a0"`
	B0                     float64 `json:"b0"`
	Kappa                  float64 `json:"kappa"`
	ConflictPenalty        float64 `json:"conflictPenalty"`
	ToleranceFactor        float64 `json:"toleranceFactor"`
	CategoricalAlgo        string  `json:"categoricalAlgo"`
	JaccardThreshold       float64 `json:"jaccardThreshold"`
}
type EvalResult struct {
	Scores      []TaxonScore      `json:"scores"`
	Suggestions []TraitSuggestion `json:"suggestions"`
}
