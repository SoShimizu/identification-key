// backend/engine/engine.go
package engine

import (
	"errors"
	"sort"
)

// ApplyFiltersAlgoOpt : 選択を反映して候補タクサと「次に効く形質」を返す
func ApplyFiltersAlgoOpt(m *Matrix, selected map[string]int, mode, algo string, opt AlgoOptions) (*EvalResult, error) {
	if m == nil {
		return nil, errors.New("no matrix loaded")
	}

	var scores []TaxonScore
	var post []float64
	var err error

	switch algo {
	case "heuristic":
		scores, err = evaluateHeuristic(m, selected, mode)
		if err == nil {
			post = make([]float64, len(m.Taxa))
			taxonIndexMap := make(map[string]int)
			for i, taxon := range m.Taxa {
				taxonIndexMap[taxon.ID] = i
			}
			for _, s := range scores {
				if idx, ok := taxonIndexMap[s.Taxon.ID]; ok {
					post[idx] = s.Post
				}
			}
			normalize(post)
		}

	default: // "bayes"
		_, scores, err = evaluateBayes(m, selected, opt, mode)
		if err == nil {
			// The bayes evaluation now handles penalties internally.
			// We just need to reconstruct the `post` array for trait suggestion.
			post = make([]float64, len(m.Taxa))
			originalIndexMap := make(map[int]float64)
			for _, s := range scores {
				originalIndexMap[s.Index] = s.Post
			}
			for i := 0; i < len(m.Taxa); i++ {
				if p, ok := originalIndexMap[i]; ok {
					post[i] = p
				}
			}
		}
	}

	if err != nil {
		return nil, err
	}

	// Sort the final scores list by Post DESC
	sort.Slice(scores, func(i, j int) bool {
		return scores[i].Post > scores[j].Post
	})

	// Recalculate Delta based on the final sorted list
	if len(scores) > 0 {
		topScore := scores[0].Post
		for i := range scores {
			scores[i].Delta = topScore - scores[i].Post
		}
	}

	var sugg []TraitSuggestion
	if opt.WantInfoGain && post != nil {
		tau := 0.01
		sugg = SuggestTraitsBayes(m, post, tau, selected)
	}

	return &EvalResult{
		Scores:      scores,
		Suggestions: sugg,
	}, nil
}
