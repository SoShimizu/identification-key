package engine

import (
	"errors"
	"math"
	"sort"
)

/*
A2: log-domain Bayesian core (衝突回避版)
--------------------------------------
- 既存プロジェクトの型（Matrix/Taxon/AlgoOptions）に依存しない。
- 任意のデータ構造から Truth / Observation を callback で供給して使う。
- Binary / Nominal（将来: Ordinal）に対応。
*/

// 種類（バイナリ / 多状態）
type BayesTraitKind int

const (
	BayesTraitBinary BayesTraitKind = iota
	BayesTraitNominal
	BayesTraitOrdinal // 予約（距離重みなどの拡張用）
)

// タクサ側の真値分布（決定的 / 多態 / 未知）
type BayesTruth struct {
	Kind    BayesTraitKind
	K       int
	Unknown bool
	States  []int
	Weights []float64
}

// 観測（単一 / 複数 / NA）
type BayesObservation struct {
	Kind   BayesTraitKind
	K      int
	IsNA   bool
	State  int
	Multi  []int
	MultiW []float64
}

// 既存行列と独立させるためのアクセサ
type BayesTruthGetter func(taxonIdx int, traitID string) (BayesTruth, bool)
type BayesObsGetter func(traitID string) (BayesObservation, bool)

// 返却用
type BayesRanked struct {
	Index int
	Post  float64
	Delta float64
}

// ---- 内部ユーティリティ ----

func confusionSym(alpha float64, K int, same bool) float64 {
	if K <= 1 {
		return 1.0
	}
	if same {
		return 1.0 - alpha
	}
	return alpha / float64(K-1)
}

func logProbBinary(obs int, truth int, alpha, beta float64, hard bool) float64 {
	switch truth {
	case 1:
		if obs == 1 {
			return math.Log(1.0 - beta)
		}
		if obs == 0 {
			if hard {
				return math.Inf(-1)
			}
			return math.Log(beta)
		}
	case 0:
		if obs == 0 {
			return math.Log(1.0 - alpha)
		}
		if obs == 1 {
			if hard {
				return math.Inf(-1)
			}
			return math.Log(alpha)
		}
	}
	return 0
}

func pObsGivenStateNominal(obs BayesObservation, s int, alpha float64) float64 {
	if obs.IsNA {
		return 1.0
	}
	if len(obs.Multi) > 0 {
		sum := 0.0
		if len(obs.MultiW) == len(obs.Multi) && len(obs.Multi) > 0 {
			for i, o := range obs.Multi {
				sum += obs.MultiW[i] * confusionSym(alpha, obs.K, o == s)
			}
			return sum
		}
		for _, o := range obs.Multi {
			sum += confusionSym(alpha, obs.K, o == s)
		}
		return sum
	}
	return confusionSym(alpha, obs.K, obs.State == s)
}

func logProbNominal(obs BayesObservation, truth BayesTruth, alpha, gamma float64, hard bool) float64 {
	if obs.IsNA {
		return 0
	}
	if hard && !truth.Unknown && len(truth.States) == 1 && len(obs.Multi) == 0 {
		if obs.State != truth.States[0] {
			return math.Inf(-1)
		}
	}
	p := 0.0
	switch {
	case truth.Unknown:
		if truth.K <= 0 {
			return 0
		}
		base := 1.0 / float64(truth.K)
		for s := 0; s < truth.K; s++ {
			p += base * pObsGivenStateNominal(obs, s, alpha)
		}
		return math.Log(gamma) + math.Log(p)
	case len(truth.States) <= 0:
		return math.Log(gamma)
	case len(truth.States) == 1:
		p = pObsGivenStateNominal(obs, truth.States[0], alpha)
		return math.Log(p)
	default:
		if len(truth.Weights) == len(truth.States) {
			for i, s := range truth.States {
				p += truth.Weights[i] * pObsGivenStateNominal(obs, s, alpha)
			}
		} else {
			uni := 1.0 / float64(len(truth.States))
			for _, s := range truth.States {
				p += uni * pObsGivenStateNominal(obs, s, alpha)
			}
		}
		return math.Log(p)
	}
}

func softmaxWithKappa(logPost []float64, kappa, eps float64) []float64 {
	n := len(logPost)
	maxLog := math.Inf(-1)
	for _, v := range logPost {
		if v > maxLog {
			maxLog = v
		}
	}
	u := make([]float64, n)
	sumU := 0.0
	for i, v := range logPost {
		val := math.Exp(v - maxLog)
		if val < eps {
			val = 0
		}
		u[i] = val
		sumU += val
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

// ---- 公開API（既存型に依存しない） ----

// BayesEvalParams: AlgoOptions に依存しない素の引数
type BayesEvalParams struct {
	AlphaFP              float64 // α
	BetaFN               float64 // β
	GammaNAPenalty       float64 // γ
	Kappa                float64 // κ
	EpsilonCut           float64 // ε
	UseHardContradiction bool
	ModeStrict           bool // "strict" のとき true
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
				switch {
				case truth.Unknown:
					var pr float64
					if obs.State == 1 {
						pr = 0.5*(1.0-p.BetaFN) + 0.5*p.AlphaFP
					} else {
						pr = 0.5*(1.0-p.AlphaFP) + 0.5*p.BetaFN
					}
					lp += math.Log(p.GammaNAPenalty) + math.Log(pr)
				case len(truth.States) == 1:
					lp += logProbBinary(obs.State, truth.States[0], p.AlphaFP, p.BetaFN, p.ModeStrict && p.UseHardContradiction)
				default:
					pr := 0.0
					if len(truth.Weights) == len(truth.States) {
						for k, s := range truth.States {
							if obs.State == 1 {
								if s == 1 {
									pr += truth.Weights[k] * (1.0 - p.BetaFN)
								} else {
									pr += truth.Weights[k] * p.AlphaFP
								}
							} else {
								if s == 0 {
									pr += truth.Weights[k] * (1.0 - p.AlphaFP)
								} else {
									pr += truth.Weights[k] * p.BetaFN
								}
							}
						}
					} else {
						uni := 1.0 / float64(len(truth.States))
						for _, s := range truth.States {
							if obs.State == 1 {
								if s == 1 {
									pr += uni * (1.0 - p.BetaFN)
								} else {
									pr += uni * p.AlphaFP
								}
							} else {
								if s == 0 {
									pr += uni * (1.0 - p.AlphaFP)
								} else {
									pr += uni * p.BetaFN
								}
							}
						}
					}
					lp += math.Log(pr)
				}
			case BayesTraitNominal, BayesTraitOrdinal:
				lp += logProbNominal(obs, truth, p.AlphaFP, p.GammaNAPenalty, p.ModeStrict && p.UseHardContradiction)
			}

			if math.IsInf(lp, -1) {
				break
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
