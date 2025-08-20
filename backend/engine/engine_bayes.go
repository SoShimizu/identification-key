// backend/engine/engine_bayes.go
package engine

import (
	"sort"
)

func evaluateBayes(m *Matrix, selected map[string]int, opt AlgoOptions, mode string) ([]BayesRanked, []TaxonScore, error) {
	nTaxa := len(m.Taxa)
	traitIDs := make([]string, 0, len(selected))
	for id, val := range selected {
		if val != 0 {
			traitIDs = append(traitIDs, id)
		}
	}

	getTruth := func(taxonIdx int, traitID string) (BayesTruth, bool) {
		if taxonIdx < 0 || taxonIdx >= nTaxa {
			return BayesTruth{Unknown: true}, false
		}
		val, ok := m.Taxa[taxonIdx].Traits[traitID]
		if !ok || val == NA {
			return BayesTruth{Kind: int(BayesTraitBinary), K: 2, Unknown: true}, true
		}
		return BayesTruth{Kind: int(BayesTraitBinary), K: 2, States: []int{int(val)}}, true
	}

	getObs := func(traitID string) (BayesObservation, bool) {
		val, ok := selected[traitID]
		if !ok || val == 0 {
			return BayesObservation{IsNA: true}, false
		}
		return BayesObservation{Kind: int(BayesTraitBinary), K: 2, State: val}, true
	}

	ranked, err := EvaluateBayesA2FromOptions(nTaxa, traitIDs, getTruth, getObs, opt)
	if err != nil {
		return nil, nil, err
	}

	selectedTernary := make(map[string]Ternary)
	for k, v := range selected {
		selectedTernary[k] = Ternary(v)
	}

	scores := make([]TaxonScore, len(ranked))
	for i, r := range ranked {
		taxon := Taxon{}
		if r.Index >= 0 && r.Index < len(m.Taxa) {
			taxon = m.Taxa[r.Index]
		}
		matches, support, conflicts := computeMatchStats(selectedTernary, &taxon)
		scores[i] = TaxonScore{
			Index:     r.Index,
			Taxon:     taxon,
			Post:      r.Post,
			Delta:     r.Delta,
			Used:      len(traitIDs),
			Match:     matches,
			Support:   support,
			Conflicts: conflicts,
		}
	}

	sort.Slice(scores, func(i, j int) bool {
		return scores[i].Post > scores[j].Post
	})

	return ranked, scores, nil
}
