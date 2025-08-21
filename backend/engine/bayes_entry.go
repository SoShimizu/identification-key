// backend/engine/bayes_entry.go
package engine

import "sort"

// EvaluateBayesA2FromOptions
// 既存の AlgoOptions から A2（Bayesコア）を呼び出し、
// BayesRanked（Index/Post/Delta）で返すエントリ関数。
func EvaluateBayesA2FromOptions(
	nTaxa int,
	traitIDs []string,
	truthGetter BayesTruthGetter,
	obsGetter BayesObsGetter,
	opt AlgoOptions, // プロジェクト既存の型をそのまま受け取る
) ([]BayesRanked, error) {

	// ---- パラメータ解決 ----
	// Use values directly from the passed 'opt' struct.
	// Default fallbacks can be handled here if a value is zero, but the frontend should provide sane defaults.
	alpha := opt.DefaultAlphaFP
	if alpha <= 0 {
		alpha = 0.03
	}
	beta := opt.DefaultBetaFN
	if beta <= 0 {
		beta = 0.07
	}
	kappa := opt.Kappa
	if kappa < 0 {
		kappa = 1.0
	}
	gamma := opt.GammaNAPenalty
	if gamma <= 0 || gamma > 1.0 {
		gamma = 0.95 // Fallback if an invalid value is passed
	}

	// Pass all relevant parameters to the core evaluation function.
	params := BayesEvalParams{
		AlphaFP:          alpha,
		BetaFN:           beta,
		GammaNAPenalty:   gamma, // Use the value from frontend options
		Kappa:            kappa,
		EpsilonCut:       1e-6,
		ConflictPenalty:  opt.ConflictPenalty,
		ToleranceFactor:  opt.ToleranceFactor,
		CategoricalAlgo:  opt.CategoricalAlgo,
		JaccardThreshold: opt.JaccardThreshold,
	}

	// ---- Bayes 本体の評価 ----
	post, err := EvalBayesPosteriorGeneric(nTaxa, traitIDs, truthGetter, obsGetter, params)
	if err != nil {
		return nil, err
	}

	// ---- ランキング（降順）と Δ（topとの差） ----
	rs := make([]BayesRanked, len(post))
	for i, p := range post {
		rs[i] = BayesRanked{Index: i, Post: p}
	}
	sort.Slice(rs, func(i, j int) bool { return rs[i].Post > rs[j].Post })
	top := 0.0
	if len(rs) > 0 {
		top = rs[0].Post
	}
	for i := range rs {
		rs[i].Delta = top - rs[i].Post
	}
	return rs, nil
}
