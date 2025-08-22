// backend/engine/engine_bayes.go
package engine

import (
	"log"
	"sort"
)

// evaluateBayes handles the core logic for Bayesian evaluation.
func evaluateBayes(m *Matrix, selected map[string]int, selectedMulti map[string][]string, opt AlgoOptions, mode string) ([]BayesRanked, []TaxonScore, error) {
	nTaxa := len(m.Taxa)

	traitMap := make(map[string]Trait)
	for _, t := range m.Traits {
		traitMap[t.ID] = t
	}

	activeTraitIDs := make([]string, 0, len(selected)+len(selectedMulti))
	for id, val := range selected {
		if _, ok := traitMap[id]; ok && val != 0 {
			activeTraitIDs = append(activeTraitIDs, id)
		}
	}
	for id, val := range selectedMulti {
		if _, ok := traitMap[id]; ok && len(val) > 0 {
			activeTraitIDs = append(activeTraitIDs, id)
		}
	}
	log.Printf("[Bayes] Active Trait IDs for evaluation: %v", activeTraitIDs)

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

		if trait.Type == "categorical_multi" {
			truthValues, _ := taxon.CategoricalTraits[traitID]
			log.Printf("[getTruth] For Taxon '%s', Trait '%s', DB value is: %v", taxon.Name, trait.Name, truthValues)
		}

		switch trait.Type {
		case "continuous":
			if val, ok := taxon.ContinuousTraits[traitID]; ok {
				return BayesTruth{Kind: BayesTraitContinuous, Min: val.Min, Max: val.Max}, true
			}
			return BayesTruth{Kind: BayesTraitContinuous, Unknown: true}, true
		case "categorical_multi":
			if values, ok := taxon.CategoricalTraits[traitID]; ok && len(values) > 0 {
				return BayesTruth{Kind: BayesTraitCategoricalMulti, StatesMulti: values}, true
			}
			return BayesTruth{Kind: BayesTraitCategoricalMulti, Unknown: true}, true
		default: // binary/derived
			val, ok := taxon.Traits[traitID]
			if !ok || val == NA {
				return BayesTruth{Kind: BayesTraitBinary, K: 2, Unknown: true}, true
			}
			return BayesTruth{Kind: BayesTraitBinary, K: 2, States: []int{int(val)}}, true
		}
	}

	// getObs provides the user's observation for a given trait.
	getObs := func(traitID string) (BayesObservation, bool) {
		trait, ok := traitMap[traitID]
		if !ok {
			return BayesObservation{IsNA: true}, false
		}

		switch trait.Type {
		case "continuous":
			if val, ok := selected[traitID]; ok && val != 0 {
				return BayesObservation{Kind: BayesTraitContinuous, Value: float64(val)}, true
			}
		case "categorical_multi":
			// MODIFIED: Read directly from selectedMulti map
			if states, ok := selectedMulti[traitID]; ok && len(states) > 0 {
				log.Printf("[getObs] User selection for trait '%s': %v", trait.Name, states)
				return BayesObservation{Kind: BayesTraitCategoricalMulti, StatesMulti: states}, true
			}
		default: // binary
			if val, ok := selected[traitID]; ok && val != 0 {
				return BayesObservation{Kind: BayesTraitBinary, K: 2, State: val}, true
			}
		}

		return BayesObservation{IsNA: true}, false
	}

	// Prepare parameters for the Bayesian evaluation...
	evalParams := BayesEvalParams{
		AlphaFP:          opt.DefaultAlphaFP,
		BetaFN:           opt.DefaultBetaFN,
		GammaNAPenalty:   opt.GammaNAPenalty,
		Kappa:            opt.Kappa,
		EpsilonCut:       1e-6,
		ConflictPenalty:  opt.ConflictPenalty,
		ToleranceFactor:  opt.ToleranceFactor,
		CategoricalAlgo:  opt.CategoricalAlgo,
		JaccardThreshold: opt.JaccardThreshold,
	}

	// Call the generic Bayes evaluator
	post, err := EvalBayesPosteriorGeneric(nTaxa, activeTraitIDs, getTruth, getObs, evalParams)
	if err != nil {
		return nil, nil, err
	}

	ranked := RankPosterior(post)

	// Convert ranked posteriors to TaxonScore slice for the UI
	scores := make([]TaxonScore, len(ranked))
	for i, r := range ranked {
		taxon := Taxon{}
		if r.Index >= 0 && r.Index < len(m.Taxa) {
			taxon = m.Taxa[r.Index]
		}
		matches, support, conflicts := computeMatchStatsGeneric(m, &taxon, selected, selectedMulti, traitMap, opt)

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

// computeMatchStatsGeneric computes match/support/conflict stats for all trait types.
func computeMatchStatsGeneric(m *Matrix, taxon *Taxon, selected map[string]int, selectedMulti map[string][]string, traitMap map[string]Trait, opt AlgoOptions) (matches, support, conflicts int) {
	// Handle binary and continuous traits from 'selected'
	for traitID, obsValue := range selected {
		if obsValue == 0 {
			continue
		}
		trait, ok := traitMap[traitID]
		if !ok || trait.Type == "categorical_multi" { // Skip multi here
			continue
		}

		support++
		isMatch := false

		switch trait.Type {
		case "binary", "derived":
			truthValue, ok := taxon.Traits[traitID]
			if !ok || truthValue == NA {
				continue
			}
			if int(truthValue) == obsValue {
				isMatch = true
			}
		case "continuous":
			truth, ok := taxon.ContinuousTraits[traitID]
			if !ok {
				continue
			}
			if float64(obsValue) >= truth.Min && float64(obsValue) <= truth.Max {
				isMatch = true
			}
		}

		if isMatch {
			matches++
		} else {
			conflicts++
		}
	}

	// MODIFIED: Handle categorical_multi traits directly from 'selectedMulti'
	for traitID, selectedStates := range selectedMulti {
		if len(selectedStates) == 0 {
			continue
		}
		support++
		isMatch := false

		truthStates, ok := taxon.CategoricalTraits[traitID]
		if !ok || len(truthStates) == 0 {
			continue // Taxon has no data for this trait
		}

		if opt.CategoricalAlgo == "jaccard" {
			if jaccardSimilarity(selectedStates, truthStates) >= opt.JaccardThreshold {
				isMatch = true
			}
		} else { // "binary"
			if hasIntersection(selectedStates, truthStates) {
				isMatch = true
			}
		}

		if isMatch {
			matches++
		} else {
			conflicts++
		}
	}
	return
}
