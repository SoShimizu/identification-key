package engine

import "sort"

// EvaluateBayesA2FromOptions
// 既存の AlgoOptions と mode("strict"/"lenient") から A2（Bayesコア）を呼び出し、
// BayesRanked（Index/Post/Delta）で返すエントリ関数。
// ※ AlgoOptions に GammaNAPenalty / EpsilonCut / UseHardContradiction が無くてもビルドできるよう
//    本関数内で安全なデフォルトにフォールバックします。
func EvaluateBayesA2FromOptions(
	nTaxa int,
	traitIDs []string,
	truthGetter BayesTruthGetter,
	obsGetter BayesObsGetter,
	mode string,
	opt AlgoOptions, // プロジェクト既存の型をそのまま受け取る
) ([]BayesRanked, error) {

	// ---- フォールバックを含むパラメータ解決 ----
	// α（偽陽性）
	alpha := opt.DefaultAlphaFP
	if alpha <= 0 {
		alpha = 0.03
	}
	// β（偽陰性）
	beta := opt.DefaultBetaFN
	if beta <= 0 {
		beta = 0.07
	}
	// κ（Dirichlet平滑化）
	kappa := opt.Kappa
	if kappa <= 0 {
		kappa = 1.0
	}
	// γ（NAペナルティ）: AlgoOptions に無い場合の既定
	gamma := 0.95
	// ε（丸め閾値）: AlgoOptions に無い場合の既定
	eps := 1e-6
	// ハード矛盾除外: フラグが無い環境では strict のとき有効にする
	useHard := (mode == "strict")

	// 上記のうち、プロジェクト側で拡張フィールドが存在する場合に値を上書きしたいときは、
	// ここに条件付きの代入（ビルドタグや別関数）を追加してください。

	params := BayesEvalParams{
		AlphaFP:              alpha,
		BetaFN:               beta,
		GammaNAPenalty:       gamma,
		Kappa:                kappa,
		EpsilonCut:           eps,
		UseHardContradiction: useHard,
		ModeStrict:           mode == "strict",
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
