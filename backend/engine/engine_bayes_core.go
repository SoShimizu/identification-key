// backend/engine/engine_bayes_core.go
package engine

import (
	"errors"
	"math"
	"sort"
)

type BayesTraitKind int

const (
	BayesTraitBinary BayesTraitKind = iota
	BayesTraitNominal
	BayesTraitOrdinal
)

type BayesTruth struct {
	Kind, K int
	Unknown bool
	States  []int
	Weights []float64
}
type BayesObservation struct {
	Kind, K int
	IsNA    bool
	State   int
	Multi   []int
	MultiW  []float64
}
type BayesTruthGetter func(taxonIdx int, traitID string) (BayesTruth, bool)
type BayesObsGetter func(traitID string) (BayesObservation, bool)
type BayesRanked struct {
	Index       int
	Post, Delta float64
}

const largeNegativeLogLikelihood = -1e6 // Penalty base for conflicts

// logProbBinary calculates the log probability, now with a robust, interpolated conflict penalty.
func logProbBinary(obs int, truth int, alpha, beta, conflictPenaltyFactor float64) float64 {
	// Normalize inputs to 1 (Yes) and 0 (No) for consistent logic
	obsNorm := 0
	if obs == 1 {
		obsNorm = 1
	}
	truthNorm := 0
	if truth == 1 {
		truthNorm = 1
	}

	isConflict := obsNorm != truthNorm

	if isConflict {
		// Calculate the standard log probability based on error rates (alpha/beta)
		var standardLogProb float64
		if obsNorm == 1 { // False Positive (obs=1, truth=0)
			standardLogProb = math.Log(alpha)
		} else { // False Negative (obs=0, truth=1)
			standardLogProb = math.Log(beta)
		}

		// Linearly interpolate between the standard probability and the large penalty
		// When conflictPenaltyFactor is 0, we use the standard probability.
		// When conflictPenaltyFactor is 1, we add the full large penalty.
		// The penalty is scaled by the factor.
		penalty := conflictPenaltyFactor * largeNegativeLogLikelihood

		// The final score is a mix. If factor is 1, penalty dominates. If 0, it's just standard prob.
		return (1-conflictPenaltyFactor)*standardLogProb + penalty
	}

	// No conflict
	switch truthNorm {
	case 1: // Truth is Yes
		return math.Log(1.0 - beta)
	case 0: // Truth is No
		return math.Log(1.0 - alpha)
	}
	return 0
}

func softmaxWithKappa(logPost []float64, kappa, eps float64) []float64 {
	n := len(logPost)
	if n == 0 {
		return []float64{}
	}
	maxLog := math.Inf(-1)
	for _, v := range logPost {
		if !math.IsInf(v, -1) && v > maxLog {
			maxLog = v
		}
	}
	if math.IsInf(maxLog, -1) {
		uniform := make([]float64, n)
		for i := range uniform {
			uniform[i] = 1.0 / float64(n)
		}
		return uniform
	}
	u := make([]float64, n)
	sumU := 0.0
	for i, v := range logPost {
		if math.IsInf(v, -1) {
			u[i] = 0
			continue
		}
		val := math.Exp(v - maxLog)
		if val < eps {
			val = 0
		}
		u[i] = val
		sumU += val
	}
	if sumU == 0 {
		uniform := make([]float64, n)
		for i := range uniform {
			uniform[i] = 1.0 / float64(n)
		}
		return uniform
	}
	out := make([]float64, n)
	den := sumU + kappa
	add := 0.0
	if kappa > 0 && n > 0 {
		add = kappa / float64(n)
	}
	for i := range u {
		out[i] = (u[i] + add) / den
	}
	return out
}

type BayesEvalParams struct {
	AlphaFP         float64
	BetaFN          float64
	GammaNAPenalty  float64
	Kappa           float64
	EpsilonCut      float64
	ConflictPenalty float64
}

func EvalBayesPosteriorGeneric(
	nTaxa int,
	traitIDs []string,
	getTruth BayesTruthGetter,
	getObs BayesObsGetter,
	p BayesEvalParams,
) ([]float64, error) {
	if nTaxa <= 0 {
		return nil, errors.New("no taxa")
	}
	logPost := make([]float64, nTaxa)

	for i := 0; i < nTaxa; i++ {
		lp := 0.0
		for _, tid := range traitIDs {
			truth, okT := getTruth(i, tid)
			if !okT {
				continue
			}
			obs, okO := getObs(tid)
			if !okO || obs.IsNA {
				continue
			}

			if obs.Kind == int(BayesTraitBinary) {
				if truth.Unknown {
					var pr float64
					if obs.State == 1 {
						pr = 0.5*(1.0-p.BetaFN) + 0.5*p.AlphaFP
					} else {
						pr = 0.5*(1.0-p.AlphaFP) + 0.5*p.BetaFN
					}
					lp += math.Log(p.GammaNAPenalty) + math.Log(pr)
				} else if len(truth.States) == 1 {
					lp += logProbBinary(obs.State, truth.States[0], p.AlphaFP, p.BetaFN, p.ConflictPenalty)
				} else {
					pr := 0.0
					weightSum := 0.0
					useWeights := len(truth.Weights) == len(truth.States)
					for k, s := range truth.States {
						weight := 1.0
						if useWeights {
							weight = truth.Weights[k]
						}
						weightSum += weight
						if obs.State == 1 {
							if s == 1 {
								pr += weight * (1.0 - p.BetaFN)
							} else {
								pr += weight * p.AlphaFP
							}
						} else {
							if s == 0 {
								pr += weight * (1.0 - p.AlphaFP)
							} else {
								pr += weight * p.BetaFN
							}
						}
					}
					if weightSum > 0 {
						lp += math.Log(pr / weightSum)
					}
				}
			}
		}
		logPost[i] = lp
	}
	post := softmaxWithKappa(logPost, p.Kappa, p.EpsilonCut)
	return post, nil
}

func RankPosterior(post []float64) []BayesRanked {
	ps := make([]BayesRanked, len(post))
	for i, p := range post {
		ps[i] = BayesRanked{Index: i, Post: p}
	}
	sort.Slice(ps, func(i, j int) bool { return ps[i].Post > ps[j].Post })
	top := 0.0
	if len(ps) > 0 {
		top = ps[0].Post
	}
	for i := range ps {
		ps[i].Delta = top - ps[i].Post
	}
	return ps
}
