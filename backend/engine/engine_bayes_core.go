// backend/engine/engine_bayes_core.go
package engine

import (
	"errors"
	"log"
	"math"
	"sort"
)

type BayesTraitKind int

const (
	BayesTraitBinary BayesTraitKind = iota
	BayesTraitNominal
	BayesTraitOrdinal
	BayesTraitContinuous
	BayesTraitCategoricalMulti // New kind
)

type BayesTruth struct {
	Kind        BayesTraitKind
	K           int
	Unknown     bool
	States      []int
	Weights     []float64
	Min, Max    float64
	StatesMulti []string // For categorical multi
}
type BayesObservation struct {
	Kind        BayesTraitKind
	K           int
	IsNA        bool
	State       int
	Multi       []int
	MultiW      []float64
	Value       float64
	StatesMulti []string // For categorical multi
}

type BayesTruthGetter func(taxonIdx int, traitID string) (BayesTruth, bool)
type BayesObsGetter func(traitID string) (BayesObservation, bool)
type BayesRanked struct {
	Index       int
	Post, Delta float64
}

const largeNegativeLogLikelihood = -1e6 // Penalty base for conflicts

// jaccardSimilarity calculates the Jaccard index between two sets of strings.
func jaccardSimilarity(set1, set2 []string) float64 {
	intersectionSize := 0

	map1 := make(map[string]struct{}, len(set1))
	for _, item := range set1 {
		map1[item] = struct{}{}
	}

	map2 := make(map[string]struct{}, len(set2))
	for _, item := range set2 {
		map2[item] = struct{}{}
	}

	for item := range map1 {
		if _, found := map2[item]; found {
			intersectionSize++
		}
	}

	unionSize := len(map1) + len(map2) - intersectionSize
	if unionSize == 0 {
		return 1.0 // Both sets are empty, similarity is 1.
	}
	return float64(intersectionSize) / float64(unionSize)
}

// hasIntersection checks if there is at least one common element.
func hasIntersection(set1, set2 []string) bool {
	map1 := make(map[string]struct{}, len(set1))
	for _, item := range set1 {
		map1[item] = struct{}{}
	}
	for _, item := range set2 {
		if _, found := map1[item]; found {
			return true
		}
	}
	return false
}

func logProbContinuous(obsValue float64, truthMin, truthMax float64, toleranceFactor float64) float64 {
	truthRange := truthMax - truthMin
	if toleranceFactor < 0 {
		toleranceFactor = 0
	}
	if toleranceFactor > 0.5 {
		toleranceFactor = 0.5
	}
	tolerance := math.Max(truthRange*toleranceFactor, 0.05)
	if tolerance < 1e-9 {
		if obsValue >= truthMin && obsValue <= truthMax {
			return 0.0
		}
		return largeNegativeLogLikelihood
	}
	if obsValue >= truthMin && obsValue <= truthMax {
		return 0.0
	}
	if obsValue > truthMax && obsValue < truthMax+tolerance {
		dist := obsValue - truthMax
		penalty := (dist / tolerance) * 10
		return -penalty
	}
	if obsValue < truthMin && obsValue > truthMin-tolerance {
		dist := truthMin - obsValue
		penalty := (dist / tolerance) * 10
		return -penalty
	}
	return largeNegativeLogLikelihood
}

func logProbBinary(obs int, truth int, alpha, beta, conflictPenaltyFactor float64) float64 {
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
		var standardLogProb float64
		if obsNorm == 1 {
			standardLogProb = math.Log(alpha)
		} else {
			standardLogProb = math.Log(beta)
		}
		penalty := conflictPenaltyFactor * largeNegativeLogLikelihood
		return (1-conflictPenaltyFactor)*standardLogProb + penalty
	}
	switch truthNorm {
	case 1:
		return math.Log(1.0 - beta)
	case 0:
		return math.Log(1.0 - alpha)
	}
	return 0
}

func logProbCategoricalMulti(taxonIdx int, obsStates, truthStates []string, algo string, jaccardThreshold float64, alpha, beta, conflictPenalty float64) float64 {
	var isMatch bool

	log.Printf("[Matcher] Taxon %d: Comparing Obs %v WITH Truth %v", taxonIdx, obsStates, truthStates)

	if algo == "jaccard" {
		similarity := jaccardSimilarity(obsStates, truthStates)
		isMatch = similarity >= jaccardThreshold
		log.Printf("[Matcher] Taxon %d: Jaccard similarity = %.2f, Threshold = %.2f -> isMatch = %t", taxonIdx, similarity, jaccardThreshold, isMatch)
	} else { // "binary"
		isMatch = hasIntersection(obsStates, truthStates)
		log.Printf("[Matcher] Taxon %d: Intersection found -> isMatch = %t", taxonIdx, isMatch)
	}

	if isMatch {
		return logProbBinary(1, 1, alpha, beta, conflictPenalty)
	}
	return logProbBinary(1, 0, alpha, beta, conflictPenalty)
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
	AlphaFP          float64
	BetaFN           float64
	GammaNAPenalty   float64
	Kappa            float64
	EpsilonCut       float64
	ConflictPenalty  float64
	ToleranceFactor  float64
	CategoricalAlgo  string
	JaccardThreshold float64
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

			switch obs.Kind {
			case BayesTraitBinary:
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
				}
			case BayesTraitContinuous:
				if truth.Unknown {
					lp += math.Log(p.GammaNAPenalty)
				} else {
					lp += logProbContinuous(obs.Value, truth.Min, truth.Max, p.ToleranceFactor)
				}
			case BayesTraitCategoricalMulti:
				if truth.Unknown {
					lp += math.Log(p.GammaNAPenalty)
				} else {
					lp += logProbCategoricalMulti(i, obs.StatesMulti, truth.StatesMulti, p.CategoricalAlgo, p.JaccardThreshold, p.AlphaFP, p.BetaFN, p.ConflictPenalty)
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
