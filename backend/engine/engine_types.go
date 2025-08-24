// backend/engine/engine_types.go
package engine

// MatrixInfo contains metadata about the entire matrix.
type MatrixInfo struct {
	TitleEN       string `json:"title_en"`
	TitleJP       string `json:"title_jp"`
	Version       string `json:"version"`
	DescriptionEN string `json:"description_en"`
	DescriptionJP string `json:"description_jp"`
	AuthorsEN     string `json:"authors_en"`
	AuthorsJP     string `json:"authors_jp"`
	ContactEN     string `json:"contact_en"`
	ContactJP     string `json:"contact_jp"`
	CitationEN    string `json:"citation_en"`
	CitationJP    string `json:"citation_jp"`
	ReferencesEN  string `json:"references_en"`
	ReferencesJP  string `json:"references_jp"`
}

// Dependency holds parsed dependency rule information.
type Dependency struct {
	ParentTraitID string `json:"parentTraitId"`
	RequiredState string `json:"requiredState"`
}

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
	ID               string      `json:"id"`
	TraitID          string      `json:"traitId,omitempty"` // User-defined ID from Excel (#TraitID)
	NameEN           string      `json:"name_en"`
	NameJP           string      `json:"name_jp"`
	GroupEN          string      `json:"group_en"`
	GroupJP          string      `json:"group_jp"`
	Type             string      `json:"type"`
	Parent           string      `json:"parent,omitempty"`           // For derived traits (references TraitID)
	ParentName       string      `json:"parentName,omitempty"`       // For derived traits (references Trait Name for display)
	ParentDependency *Dependency `json:"parentDependency,omitempty"` // For dependency rules
	State            string      `json:"state,omitempty"`
	Difficulty       float64     `json:"difficulty,omitempty"`
	Risk             float64     `json:"risk,omitempty"`
	HelpTextEN       string      `json:"helpText_en,omitempty"`
	HelpTextJP       string      `json:"helpText_jp,omitempty"`
	HelpImages       []string    `json:"helpImages,omitempty"`
	MinValue         float64     `json:"minValue,omitempty"`
	MaxValue         float64     `json:"maxValue,omitempty"`
	IsInteger        bool        `json:"isInteger,omitempty"`
	States           []string    `json:"states,omitempty"`
}

type Taxon struct {
	ID                string                     `json:"id"`   // From #TaxonID
	Name              string                     `json:"name"` // For display, from ScientificName
	ScientificName    string                     `json:"scientificName"`
	Rank              string                     `json:"rank,omitempty"` // <-- この行を追加しました
	TaxonAuthor       string                     `json:"taxonAuthor,omitempty"`
	VernacularNameEN  string                     `json:"vernacularName_en,omitempty"`
	VernacularNameJP  string                     `json:"vernacularName_ja,omitempty"`
	DescriptionEN     string                     `json:"description_en,omitempty"`
	DescriptionJP     string                     `json:"description_ja,omitempty"`
	Images            []string                   `json:"images,omitempty"`
	References        string                     `json:"references,omitempty"`
	Traits            map[string]Ternary         `json:"traits"`
	ContinuousTraits  map[string]ContinuousValue `json:"continuousTraits"`
	CategoricalTraits map[string][]string        `json:"categoricalTraits"`
	// Taxonomic Ranks
	Order       string `json:"order,omitempty"`
	Superfamily string `json:"superfamily,omitempty"`
	Family      string `json:"family,omitempty"`
	Subfamily   string `json:"subfamily,omitempty"`
	Tribe       string `json:"tribe,omitempty"`
	Subtribe    string `json:"subtribe,omitempty"`
	Genus       string `json:"genus,omitempty"`
	Subgenus    string `json:"subgenus,omitempty"`
	Species     string `json:"species,omitempty"`
	Subspecies  string `json:"subspecies,omitempty"`
}

type Matrix struct {
	Name   string     `json:"name"`
	Info   MatrixInfo `json:"info"`
	Traits []Trait    `json:"traits"`
	Taxa   []Taxon    `json:"taxa"`
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
	Name       string      `json:"name"`  // This will be lang-specific in frontend
	Group      string      `json:"group"` // This will be lang-specific in frontend
	IG         float64     `json:"ig"`
	MaxIG      float64     `json:"max_ig"`
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
	RecommendationStrategy string  `json:"recommendationStrategy"`
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
