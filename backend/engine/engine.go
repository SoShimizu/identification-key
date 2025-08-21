// backend/engine/engine.go
package engine

import (
	"errors"
	"sort"
)

func ApplyFiltersAlgoOpt(m *Matrix, selected map[string]int, mode, algo string, opt AlgoOptions) (*EvalResult, error) {
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
		// Note: Heuristic mode doesn't currently support categorical_multi traits.
		// It could be extended to do so if needed.
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
		ranked, scores, err = evaluateBayes(m, selected, opt, mode)
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
		sugg = SuggestTraitsBayes(m, post, tau, selected, opt) // Pass opt here
	}

	return &EvalResult{
		Scores:      scores,
		Suggestions: sugg,
	}, nil
}
