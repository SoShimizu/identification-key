package engine

import (
	"sort"
	"strings"
)

func computeMatchStats(obs map[string]Ternary, tx *Taxon) (matches, support, conflicts int) {
	for tid, o := range obs {
		if o == NA {
			continue
		}
		support++
		v := tx.Traits[tid]
		if v == NA {
			continue
		}
		if (o == Yes && v == Yes) || (o == No && v == No) {
			matches++
		} else if (o == Yes && v == No) || (o == No && v == Yes) {
			conflicts++
		}
	}
	return
}

type stateDef struct {
	yesNo    bool
	childIDs []string
	labels   []string
	traitID  string
	name     string
	group    string
}

func buildStateDefs(m *Matrix) []stateDef {
	childrenByParent := map[string][]Trait{}
	for _, t := range m.Traits {
		if strings.EqualFold(t.Type, "derived") {
			p := strings.TrimSpace(t.Parent)
			childrenByParent[p] = append(childrenByParent[p], t)
		}
	}
	var out []stateDef
	for _, t := range m.Traits {
		if strings.EqualFold(t.Type, "derived") {
			continue
		}
		kids := append([]Trait{}, childrenByParent[t.ID]...)
		kids = append(kids, childrenByParent[t.Name]...)
		if len(kids) == 0 {
			out = append(out, stateDef{
				yesNo:   true,
				traitID: t.ID,
				name:    t.Name,
				group:   t.Group,
			})
		} else {
			ids := make([]string, 0, len(kids))
			lb := make([]string, 0, len(kids))
			for _, c := range kids {
				ids = append(ids, c.ID)
				if c.State != "" {
					lb = append(lb, c.State)
				} else if c.Name != "" {
					lb = append(lb, c.Name)
				} else {
					lb = append(lb, c.ID)
				}
			}
			out = append(out, stateDef{
				traitID:  t.ID,
				name:     t.Name,
				group:    t.Group,
				childIDs: ids,
				labels:   lb,
			})
		}
	}
	return out
}

func compatibleBinary(val Ternary, wantYes bool) bool {
	if wantYes {
		return val == Yes
	}
	return val == No
}

// posterior と行列から IG/ECR を算出
func SuggestTraitsBayes(m *Matrix, post []float64, tau float64, selected map[string]int) []TraitSuggestion {
	if len(m.Taxa) == 0 || len(m.Traits) == 0 || len(post) != len(m.Taxa) {
		return nil
	}
	normalize(post)
	Hnow := shannon(post)
	cNow := countAbove(post, tau)

	defs := buildStateDefs(m)

	filtered := make([]stateDef, 0, len(defs))
	for _, d := range defs {
		skip := false
		if d.yesNo {
			if v, ok := selected[d.traitID]; ok && v != 0 {
				skip = true
			}
		} else {
			for _, cid := range d.childIDs {
				if selected[cid] == 1 {
					skip = true
					break
				}
			}
		}
		if !skip {
			filtered = append(filtered, d)
		}
	}

	out := make([]TraitSuggestion, 0, len(filtered))
	for _, d := range filtered {
		var py []float64
		var labels []string

		if d.yesNo {
			sumY, sumN := 0.0, 0.0
			for i, tx := range m.Taxa {
				switch tx.Traits[d.traitID] {
				case Yes:
					sumY += post[i]
				case No:
					sumN += post[i]
				}
			}
			py = []float64{sumY, sumN}
			labels = []string{"Yes", "No"}
		} else {
			py = make([]float64, len(d.childIDs))
			labels = append([]string{}, d.labels...)
			for s, cid := range d.childIDs {
				sum := 0.0
				for i, tx := range m.Taxa {
					if tx.Traits[cid] == Yes {
						sum += post[i]
					}
				}
				py[s] = sum
			}
		}
		normalize(py)

		// バランス
		gini := 1.0
		for _, v := range py {
			gini -= v * v
		}
		ent := shannon(py)

		// 期待エントロピー・期待候補削減率
		expH := 0.0
		expRed := 0.0
		for s := range py {
			postY := make([]float64, len(post))
			if d.yesNo {
				wantYes := (s == 0)
				for i, tx := range m.Taxa {
					if compatibleBinary(tx.Traits[d.traitID], wantYes) {
						postY[i] = post[i]
					} else {
						postY[i] = 0
					}
				}
			} else {
				cid := d.childIDs[s]
				for i, tx := range m.Taxa {
					if tx.Traits[cid] == Yes {
						postY[i] = post[i]
					} else {
						postY[i] = 0
					}
				}
			}
			normalize(postY)
			expH += py[s] * shannon(postY)
			if cNow > 0 {
				cY := countAbove(postY, tau)
				expRed += py[s] * (1.0 - float64(cY)/float64(cNow))
			}
		}
		ig := Hnow - expH

		ps := make([]StateProb, len(py))
		for i := range py {
			ps[i] = StateProb{State: labels[i], P: py[i]}
		}
		out = append(out, TraitSuggestion{
			TraitId: d.traitID, Name: d.name, Group: d.group,
			IG: ig, ECR: expRed, Gini: gini, Entropy: ent,
			PStates: ps, Score: ig,
		})
	}

	sort.Slice(out, func(i, j int) bool {
		if out[i].Score == out[j].Score {
			return strings.Compare(out[i].Name, out[j].Name) < 0
		}
		return out[i].Score > out[j].Score
	})
	return out
}
