// backend/engine/engine.go
package engine

import (
	"errors"
)

// ApplyFiltersAlgoOpt : 選択を反映して候補タクサと「次に効く形質」を返す
// - algo: "bayes" | "heuristic"
// - mode: "lenient" | "strict"
func ApplyFiltersAlgoOpt(m *Matrix, selected map[string]int, mode, algo string, opt AlgoOptions) (*EvalResult, error) {
	if m == nil {
		return nil, errors.New("no matrix loaded")
	}

	var scores []TaxonScore
	var post []float64 // ベイズ法の場合の事後確率
	var err error

	switch algo {
	case "heuristic":
		scores, err = evaluateHeuristic(m, selected, mode)
		if err == nil {
			// ヒューリスティックスコアを正規化して事後確率として扱う
			// ただし、単純なスコアなので、そのまま渡しても良い
			post = make([]float64, len(m.Taxa))
			// マッピングを作成
			taxonIndexMap := make(map[string]int)
			for i, taxon := range m.Taxa {
				taxonIndexMap[taxon.ID] = i
			}
			// post配列にスコアをセット
			for _, s := range scores {
				if idx, ok := taxonIndexMap[s.Taxon.ID]; ok {
					post[idx] = s.Post
				}
			}
			normalize(post)
		}

	default: // "bayes"
		var ranked []BayesRanked
		ranked, scores, err = evaluateBayes(m, selected, opt, mode)
		if err == nil {
			// evaluateBayesから返されるrankedはソート済み
			// post配列を生成するために、元のインデックス順に戻す必要がある
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

	var sugg []TraitSuggestion
	if opt.WantInfoGain && post != nil {
		// 期待候補削減率は 1% を既定の閾値とする
		tau := 0.01
		sugg = SuggestTraitsBayes(m, post, tau, selected)
	}

	return &EvalResult{
		Scores:      scores,
		Suggestions: sugg,
	}, nil
}
