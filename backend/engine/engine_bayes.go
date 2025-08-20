// backend/engine/engine_bayes.go
package engine

import (
	"sort"
)

// evaluateBayes handles the core logic for Bayesian evaluation.
// It prepares data getters for the generic evaluation function.
func evaluateBayes(m *Matrix, selected map[string]int, opt AlgoOptions, mode string) ([]BayesRanked, []TaxonScore, error) {
	nTaxa := len(m.Taxa)

	// Create a map of selected trait IDs to their observed values for efficient lookup.
	// This includes both binary and continuous traits.
	activeSelections := make(map[string]float64)
	for id, val := range selected {
		// For binary traits, 0 means unselected. For continuous, any value is a selection.
		// The value itself is stored as a float64.
		if val != 0 {
			activeSelections[id] = float64(val)
		}
	}
	// Also consider continuous values that might be 0 but are still selected.
	// The `selected` map now handles both, so we just filter out the unselected binary traits (value 0).
	// Let's refine the logic to handle continuous traits whose value could be 0.
	// A better approach is to check the trait type. Let's create a trait map first.
	traitMap := make(map[string]Trait)
	for _, t := range m.Traits {
		traitMap[t.ID] = t
	}

	activeTraitIDs := make([]string, 0, len(selected))
	for id := range selected {
		if _, ok := traitMap[id]; ok {
			activeTraitIDs = append(activeTraitIDs, id)
		}
	}

	// getTruth provides the ground truth data for a given taxon and trait.
	getTruth := func(taxonIdx int, traitID string) (BayesTruth, bool) {
		if taxonIdx < 0 || taxonIdx >= nTaxa {
			return BayesTruth{Unknown: true}, false
		}
		taxon := m.Taxa[taxonIdx]
		trait, ok := traitMap[traitID]
		if !ok {
			return BayesTruth{Unknown: true}, false
		}

		if trait.Type == "continuous" {
			if val, ok := taxon.ContinuousTraits[traitID]; ok {
				return BayesTruth{Kind: BayesTraitContinuous, Min: val.Min, Max: val.Max}, true
			}
			return BayesTruth{Kind: BayesTraitContinuous, Unknown: true}, true
		}

		// Default to binary/derived
		val, ok := taxon.Traits[traitID]
		if !ok || val == NA {
			return BayesTruth{Kind: BayesTraitBinary, K: 2, Unknown: true}, true
		}
		return BayesTruth{Kind: BayesTraitBinary, K: 2, States: []int{int(val)}}, true
	}

	// getObs provides the user's observation for a given trait.
	getObs := func(traitID string) (BayesObservation, bool) {
		val, ok := selected[traitID]
		if !ok {
			return BayesObservation{IsNA: true}, false
		}

		trait, ok := traitMap[traitID]
		if !ok {
			return BayesObservation{IsNA: true}, false
		}

		if trait.Type == "continuous" {
			// For continuous, the value is stored directly. A value of 0 is a valid observation.
			return BayesObservation{Kind: BayesTraitContinuous, Value: float64(val)}, true
		}

		// For binary, a value of 0 means "unselected" or NA.
		if val == 0 {
			return BayesObservation{IsNA: true}, false
		}
		return BayesObservation{Kind: BayesTraitBinary, K: 2, State: val}, true
	}

	// Prepare parameters for the Bayesian evaluation
	evalParams := BayesEvalParams{
		AlphaFP:         opt.DefaultAlphaFP,
		BetaFN:          opt.DefaultBetaFN,
		GammaNAPenalty:  0.95, // This could be made configurable later
		Kappa:           opt.Kappa,
		EpsilonCut:      1e-6, // This could be made configurable later
		ConflictPenalty: opt.ConflictPenalty,
		ToleranceFactor: opt.ToleranceFactor,
	}

	// Call the generic Bayes evaluator
	post, err := EvalBayesPosteriorGeneric(nTaxa, activeTraitIDs, getTruth, getObs, evalParams)
	if err != nil {
		return nil, nil, err
	}

	ranked := RankPosterior(post)

	// Convert ranked posteriors to TaxonScore slice for the UI
	selectedTernary := make(map[string]Ternary)
	for k, v := range selected {
		if trait, ok := traitMap[k]; ok && trait.Type != "continuous" {
			selectedTernary[k] = Ternary(v)
		}
	}

	scores := make([]TaxonScore, len(ranked))
	for i, r := range ranked {
		taxon := Taxon{}
		if r.Index >= 0 && r.Index < len(m.Taxa) {
			taxon = m.Taxa[r.Index]
		}
		matches, support, conflicts := computeMatchStats(selectedTernary, &taxon)

		// Add conflicts from continuous traits
		for traitId, obsValue := range selected {
			if trait, ok := traitMap[traitId]; ok && trait.Type == "continuous" {
				if truth, ok := taxon.ContinuousTraits[traitId]; ok {
					support++
					// A simple conflict check for continuous traits
					if float64(obsValue) < truth.Min || float64(obsValue) > truth.Max {
						conflicts++
					} else {
						matches++
					}
				}
			}
		}

		scores[i] = TaxonScore{
			Index:     r.Index,
			Taxon:     taxon,
			Post:      r.Post,
			Delta:     r.Delta,
			Used:      len(activeTraitIDs),
			Match:     matches,
			Support:   support,
			Conflicts: conflicts,
		}
	}

	sort.Slice(scores, func(i, j int) bool {
		if scores[i].Post == scores[j].Post {
			return scores[i].Conflicts < scores[j].Conflicts
		}
		return scores[i].Post > scores[j].Post
	})

	return ranked, scores, nil
}
