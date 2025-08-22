// backend/engine/engine.go
package engine

import (
	"errors"
	"sort"
)

func ApplyFiltersAlgoOpt(m *Matrix, selected map[string]int, selectedMulti map[string][]string, mode, algo string, opt AlgoOptions) (*EvalResult, error) {
	if m == nil {
		return nil, errors.New("no matrix loaded")
	}

	var scores []TaxonScore
	var post []float64
	var err error

	taxonIndexMap := make(map[string]int)
	for i, taxon := range m.Taxa {
		taxonIndexMap[taxon.ID] = i
	}

	switch algo {
	case "heuristic":
		// Note: Heuristic mode needs updating if it is to support categorical_multi traits.
		scores, err = evaluateHeuristic(m, selected, mode)
		if err == nil {
			post = make([]float64, len(m.Taxa))
			tempScores := make([]float64, len(m.Taxa))
			for _, s := range scores {
				if idx, ok := taxonIndexMap[s.Taxon.ID]; ok {
					tempScores[idx] = s.Post
				}
			}
			normalize(tempScores)
			post = tempScores
		}

	default: // "bayes"
		var ranked []BayesRanked
		// Pass the new options to the bayesian evaluator
		ranked, scores, err = evaluateBayes(m, selected, selectedMulti, opt, mode)
		if err == nil {
			post = make([]float64, len(m.Taxa))
			for _, r := range ranked {
				if r.Index >= 0 && r.Index < len(post) {
					post[r.Index] = r.Post
				}
			}
		}
	}

	if err != nil {
		return nil, err
	}

	sort.Slice(scores, func(i, j int) bool {
		if scores[i].Post == scores[j].Post {
			return scores[i].Conflicts < scores[j].Conflicts
		}
		return scores[i].Post > scores[j].Post
	})

	if len(scores) > 0 {
		topScore := scores[0].Post
		for i := range scores {
			scores[i].Delta = topScore - scores[i].Post
		}
	}

	var sugg []TraitSuggestion
	if opt.WantInfoGain && post != nil {
		tau := 0.01
		// Combine selected and selectedMulti for suggestion filtering
		allSelected := make(map[string]int)
		for k, v := range selected {
			if v != 0 {
				allSelected[k] = v
			}
		}
		for k, v := range selectedMulti {
			if len(v) > 0 {
				allSelected[k] = 1 // Mark as selected
			}
		}
		sugg = SuggestTraitsBayes(m, post, tau, allSelected, opt) // Pass combined map
	}

	return &EvalResult{
		Scores:      scores,
		Suggestions: sugg,
	}, nil
}
