// backend/engine/engine_bayes.go
package engine

import (
	"sort"
)

// evaluateBayes は、具象的なMatrix型から汎用的なBayesコアを呼び出すためのアダプタです。
func evaluateBayes(m *Matrix, selected map[string]int, opt AlgoOptions, mode string) ([]BayesRanked, []TaxonScore, error) {
	nTaxa := len(m.Taxa)
	traitIDs := make([]string, 0, len(selected))
	for id, val := range selected {
		if val != 0 { // 0は「未選択」なので評価から除外
			traitIDs = append(traitIDs, id)
		}
	}

	// Truth Getter: タクソンと形質IDから真理値を取得するクロージャ
	getTruth := func(taxonIdx int, traitID string) (BayesTruth, bool) {
		if taxonIdx < 0 || taxonIdx >= nTaxa {
			return BayesTruth{Unknown: true}, false
		}
		val, ok := m.Taxa[taxonIdx].Traits[traitID]
		if !ok || val == NA {
			return BayesTruth{Kind: BayesTraitBinary, K: 2, Unknown: true}, true
		}
		return BayesTruth{Kind: BayesTraitBinary, K: 2, States: []int{int(val)}}, true
	}

	// Observation Getter: 形質IDから観測値を取得するクロージャ
	getObs := func(traitID string) (BayesObservation, bool) {
		val, ok := selected[traitID]
		if !ok || val == 0 {
			return BayesObservation{IsNA: true}, false
		}
		return BayesObservation{Kind: BayesTraitBinary, K: 2, State: val}, true
	}

	// パラメータをセットして汎用評価関数を呼び出す
	ranked, err := EvaluateBayesA2FromOptions(nTaxa, traitIDs, getTruth, getObs, mode, opt)
	if err != nil {
		return nil, nil, err
	}

	// computeMatchStatsのために型をTernaryに変換
	selectedTernary := make(map[string]Ternary)
	for k, v := range selected {
		selectedTernary[k] = Ternary(v)
	}

	// 結果をTaxonScore形式に詰め替える
	scores := make([]TaxonScore, len(ranked))
	for i, r := range ranked {
		taxon := Taxon{}
		if r.Index >= 0 && r.Index < len(m.Taxa) {
			taxon = m.Taxa[r.Index]
		}
		// マッチ/サポート/コンフリクトを再計算（表示用）
		matches, support, conflicts := computeMatchStats(selectedTernary, &taxon)
		scores[i] = TaxonScore{
			Taxon:     taxon,
			Post:      r.Post,
			Delta:     r.Delta,
			Used:      len(traitIDs),
			Match:     matches,
			Support:   support,
			Conflicts: conflicts,
		}
	}

	// 念のためPostでソート
	sort.Slice(scores, func(i, j int) bool {
		return scores[i].Post > scores[j].Post
	})

	return ranked, scores, nil
}
