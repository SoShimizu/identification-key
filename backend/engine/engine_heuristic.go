// backend/engine/engine_heuristic.go
package engine

import (
	"sort"
)

// evaluateHeuristic は単純な一致率でスコアリングします
func evaluateHeuristic(m *Matrix, selected map[string]int, mode string) ([]TaxonScore, error) {
	var scores []TaxonScore

	for _, taxon := range m.Taxa {
		matches := 0
		support := 0
		conflicts := 0

		for traitID, obsValue := range selected {
			if obsValue == 0 { // 0は未選択
				continue
			}
			obsTernary := Ternary(obsValue)
			truthValue, ok := taxon.Traits[traitID]
			if !ok || truthValue == NA {
				continue
			}

			support++
			if truthValue == obsTernary {
				matches++
			} else {
				conflicts++
			}
		}

		// strictモードでは矛盾があれば除外
		if mode == "strict" && conflicts > 0 {
			continue
		}

		score := 0.0
		if support > 0 {
			score = float64(matches) / float64(support)
		}

		scores = append(scores, TaxonScore{
			Taxon:     taxon,
			Post:      score, // Postフィールドをヒューリスティックスコアに流用
			Used:      len(selected),
			Conflicts: conflicts,
			Match:     matches,
			Support:   support,
		})
	}

	// スコアで降順ソート
	sort.Slice(scores, func(i, j int) bool {
		return scores[i].Post > scores[j].Post
	})

	// Deltaを計算
	topScore := 0.0
	if len(scores) > 0 {
		topScore = scores[0].Post
	}
	for i := range scores {
		scores[i].Delta = topScore - scores[i].Post
	}

	return scores, nil
}
