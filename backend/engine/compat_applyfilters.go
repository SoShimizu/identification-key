package engine

import (
	"fmt"
	"log"
	"math"
	"reflect"
	"sort"
)

/*──────────────── ApplyResult ────────────────*/

type ApplyResult struct {
	Scores      []TaxonScore      `json:"scores"`
	Suggestions []TraitSuggestion `json:"suggestions"`
}

/*──────────────── 反射ユーティリティ ────────────────*/

func rv(x any) reflect.Value {
	v := reflect.ValueOf(x)
	if v.Kind() == reflect.Pointer {
		v = v.Elem()
	}
	return v
}

func getField(v reflect.Value, name string) (reflect.Value, bool) {
	f := v.FieldByName(name)
	if f.IsValid() && f.CanInterface() {
		return f, true
	}
	return reflect.Value{}, false
}

func getStringFieldAny(v reflect.Value, cands ...string) (string, bool) {
	for _, n := range cands {
		if f, ok := getField(v, n); ok && f.IsValid() && f.Kind() == reflect.String {
			return f.String(), true
		}
	}
	return "", false
}

func firstMapStringIntField(v reflect.Value) (reflect.Value, bool) {
	for i := 0; i < v.NumField(); i++ {
		f := v.Field(i)
		if f.Kind() == reflect.Map && f.Type().Key().Kind() == reflect.String {
			switch f.Type().Elem().Kind() {
			case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
				return f, true
			}
		}
	}
	return reflect.Value{}, false
}

func setIfExists(v reflect.Value, name string, value any) {
	f := v.FieldByName(name)
	if !f.IsValid() || !f.CanSet() {
		return
	}
	val := reflect.ValueOf(value)
	switch f.Kind() {
	case reflect.Float32, reflect.Float64:
		switch vv := value.(type) {
		case float64:
			f.SetFloat(vv)
		case float32:
			f.SetFloat(float64(vv))
		case int:
			f.SetFloat(float64(vv))
		}
	case reflect.Int, reflect.Int32, reflect.Int64:
		switch vv := value.(type) {
		case int:
			f.SetInt(int64(vv))
		case float64:
			f.SetInt(int64(vv))
		}
	case reflect.String:
		if s, ok := value.(string); ok {
			f.SetString(s)
		}
	default:
		if val.IsValid() && val.Type().AssignableTo(f.Type()) {
			f.Set(val)
		}
	}
}

func copyMapStringInt(dst reflect.Value, src reflect.Value) bool {
	if dst.Kind() != reflect.Map || src.Kind() != reflect.Map {
		return false
	}
	if dst.Type().Key().Kind() != reflect.String || src.Type().Key().Kind() != reflect.String {
		return false
	}
	if !(dst.Type().Elem().Kind() == reflect.Int || dst.Type().Elem().Kind() == reflect.Int64) {
		return false
	}
	if !(src.Type().Elem().Kind() == reflect.Int || src.Type().Elem().Kind() == reflect.Int64) {
		return false
	}
	if dst.IsNil() {
		dst.Set(reflect.MakeMap(dst.Type()))
	}
	iter := src.MapRange()
	for iter.Next() {
		k := iter.Key()
		v := iter.Value()
		var iv int64
		switch v.Kind() {
		case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
			iv = v.Int()
		default:
			continue
		}
		dst.SetMapIndex(k, reflect.ValueOf(int(iv)))
	}
	return true
}

func assignTaxonIntoScore(tsv reflect.Value, srcTaxon reflect.Value) {
	ft := tsv.FieldByName("Taxon")
	if !ft.IsValid() || !ft.CanSet() {
		return
	}
	if srcTaxon.Type().AssignableTo(ft.Type()) {
		ft.Set(srcTaxon)
		return
	}
	if ft.Kind() == reflect.Struct {
		dst := reflect.New(ft.Type()).Elem()
		name, _ := getStringFieldAny(srcTaxon, "Name", "Label", "ScientificName", "Species", "TaxonName")
		id, _ := getStringFieldAny(srcTaxon, "ID", "Id", "Code", "UID", "Uuid", "UUID")
		setIfExists(dst, "ID", id)
		setIfExists(dst, "Id", id)
		setIfExists(dst, "Name", name)
		setIfExists(dst, "Label", name)
		if sf, ok := firstMapStringIntField(srcTaxon); ok {
			if df := dst.FieldByName("Traits"); df.IsValid() && df.CanSet() && df.Kind() == reflect.Map {
				_ = copyMapStringInt(df, sf)
			}
		}
		ft.Set(dst)
	}
}

/*──────────────── 共通数理 ────────────────*/

func entropy(ps []float64) float64 {
	h := 0.0
	for _, p := range ps {
		if p > 0 {
			h += -p * math.Log(p)
		}
	}
	return h
}
func gini(ps []float64) float64 {
	s := 0.0
	for _, p := range ps {
		s += p * p
	}
	return 1 - s
}

func probsFromRanked(ranked []BayesRanked) []float64 {
	ps := make([]float64, len(ranked))
	for i, r := range ranked {
		ps[i] = r.Post
	}
	return ps
}

/*──────────────── Trait 列挙（未選択） ────────────────*/

func collectAllTraitIDsFromMatrix(m *Matrix) []string {
	mv := rv(m)
	taxaField, ok := getField(mv, "Taxa")
	if !ok || taxaField.Kind() != reflect.Slice {
		return []string{}
	}
	seen := map[string]bool{}
	out := []string{}
	for i := 0; i < taxaField.Len(); i++ {
		tx := taxaField.Index(i)
		if msi, ok := firstMapStringIntField(tx); ok && msi.IsValid() {
			iter := msi.MapRange()
			for iter.Next() {
				k := iter.Key()
				if k.Kind() == reflect.String {
					id := k.String()
					if !seen[id] {
						seen[id] = true
						out = append(out, id)
					}
				}
			}
		}
	}
	sort.Strings(out)
	return out
}

/*──────────────── Apply（A2本体＋推奨の算出） ────────────────*/

func ApplyFiltersAlgoOpt(
	m *Matrix,
	selected map[string]int,
	mode string, // "strict" | "lenient"
	algorithm string,
	opt AlgoOptions,
) (ApplyResult, error) {

	mv := rv(m)
	taxaField, ok := getField(mv, "Taxa")
	if !ok || taxaField.Kind() != reflect.Slice {
		log.Printf("[A2] ERR: Matrix.Taxa が見つかりません")
		return ApplyResult{Scores: []TaxonScore{}, Suggestions: []TraitSuggestion{}}, nil
	}
	nTaxa := taxaField.Len()
	log.Printf("[A2] ApplyFilters: taxa=%d selected=%d mode=%s algo=%s", nTaxa, len(selected), mode, algorithm)

	// Heuristic 未配線なら空返却
	if algorithm == "heuristic" {
		log.Printf("[A2] heuristic path not wired; returning empty (todo)")
		return ApplyResult{Scores: []TaxonScore{}, Suggestions: []TraitSuggestion{}}, nil
	}

	// 選択済み traitIDs
	traitIDsSel := make([]string, 0, len(selected))
	for k := range selected {
		traitIDsSel = append(traitIDsSel, k)
	}

	// Truth / Obs getter（ベース）
	getTruth := func(taxonIdx int, traitID string) (BayesTruth, bool) {
		if taxonIdx < 0 || taxonIdx >= nTaxa {
			return BayesTruth{Kind: BayesTraitBinary, K: 2, Unknown: true}, true
		}
		taxon := taxaField.Index(taxonIdx)
		if msi, ok := firstMapStringIntField(taxon); ok {
			key := reflect.ValueOf(traitID)
			val := msi.MapIndex(key)
			if val.IsValid() {
				iv := int(val.Int())
				switch iv {
				case 0:
					return BayesTruth{Kind: BayesTraitBinary, K: 2, States: []int{0}}, true
				case 1:
					return BayesTruth{Kind: BayesTraitBinary, K: 2, States: []int{1}}, true
				default:
					return BayesTruth{Kind: BayesTraitBinary, K: 2, Unknown: true}, true
				}
			}
		}
		return BayesTruth{Kind: BayesTraitBinary, K: 2, Unknown: true}, true
	}
	getObsBase := func(traitID string) (BayesObservation, bool) {
		v, ok := selected[traitID]
		if !ok {
			return BayesObservation{Kind: BayesTraitBinary, K: 2, IsNA: true}, true
		}
		switch v {
		case 1:
			return BayesObservation{Kind: BayesTraitBinary, K: 2, State: 1}, true
		case 0:
			return BayesObservation{Kind: BayesTraitBinary, K: 2, State: 0}, true
		default:
			return BayesObservation{Kind: BayesTraitBinary, K: 2, IsNA: true}, true
		}
	}

	// まず現状の事後分布（Scores 用）
	ranked, err := EvaluateBayesA2FromOptions(
		nTaxa, traitIDsSel, getTruth, getObsBase, mode, opt,
	)
	if err != nil {
		log.Printf("[A2] ERR: EvaluateBayesA2FromOptions: %v", err)
		return ApplyResult{Scores: []TaxonScore{}, Suggestions: []TraitSuggestion{}}, nil
	}

	// Scores へ詰め替え
	scores := make([]TaxonScore, 0, len(ranked))
	for _, r := range ranked {
		var ts TaxonScore
		tsv := rv(&ts)

		// 候補名・ID
		name := ""
		id := ""
		if r.Index >= 0 && r.Index < nTaxa {
			tx := taxaField.Index(r.Index)
			if s, ok := getStringFieldAny(tx, "Name", "Label", "ScientificName", "Species", "TaxonName"); ok {
				name = s
			}
			if s, ok := getStringFieldAny(tx, "ID", "Id", "Code", "UID", "Uuid", "UUID"); ok {
				id = s
			}
			assignTaxonIntoScore(tsv, tx)
		}

		setIfExists(tsv, "Index", r.Index)
		setIfExists(tsv, "Idx", r.Index)
		setIfExists(tsv, "Post", r.Post)
		setIfExists(tsv, "Delta", r.Delta)
		setIfExists(tsv, "Δ", r.Delta)
		setIfExists(tsv, "Name", name)
		setIfExists(tsv, "Label", name)
		setIfExists(tsv, "ID", id)
		setIfExists(tsv, "Id", id)
		setIfExists(tsv, "Used", len(selected))
		setIfExists(tsv, "Conf", 0)
		setIfExists(tsv, "Conflicts", 0)
		setIfExists(tsv, "Match", 0.0)
		setIfExists(tsv, "Support", 0.0)

		scores = append(scores, ts)
	}
	sort.Slice(scores, func(i, j int) bool {
		pi := getFloatField(scores[i], "Post")
		pj := getFloatField(scores[j], "Post")
		return pi > pj
	})
	logTop3(ranked, taxaField)

	/*──────── 推奨（情報利得） ────────*/

	// 未選択の全形質候補
	allTraits := collectAllTraitIDsFromMatrix(m)
	unselected := make([]string, 0, len(allTraits))
	for _, t := range allTraits {
		if _, picked := selected[t]; !picked {
			unselected = append(unselected, t)
		}
	}

	// baseline 指標
	postNow := probsFromRanked(ranked)
	H0 := entropy(postNow)
	G0 := gini(postNow)

	// パラメータ（フォールバック）
	alpha := opt.DefaultAlphaFP
	if alpha <= 0 {
		alpha = 0.03
	}
	beta := opt.DefaultBetaFN
	if beta <= 0 {
		beta = 0.07
	}

	// 事前（現状の事後）で観測が 1/0 になる確率を近似
	// P(obs=1) = Σ_i p_i * P(obs=1 | truth_i)
	pObs := func(traitID string) (p1, p0 float64) {
		p1, p0 = 0, 0
		for i, pi := range postNow {
			bt, _ := getTruth(i, traitID)
			// Unknown は 0/1 を 0.5 ずつの素朴近似（必要ならここに gamma の効果を織り込み可）
			if bt.Unknown || len(bt.States) == 0 {
				p1 += pi * 0.5
				p0 += pi * 0.5
				continue
			}
			// 二値前提
			s := 0
			if len(bt.States) > 0 {
				s = bt.States[0]
			}
			if s == 1 {
				p1 += pi * (1.0 - beta)
				p0 += pi * beta
			} else {
				p1 += pi * alpha
				p0 += pi * (1.0 - alpha)
			}
		}
		// 正規化（端数誤差対策）
		sum := p1 + p0
		if sum <= 0 {
			return 0.5, 0.5
		}
		return p1 / sum, p0 / sum
	}

	type sugRow struct {
		traitID    string
		infoGain   float64
		giniGain   float64
		expEntropy float64
		expGini    float64
	}

	sugRows := make([]sugRow, 0, len(unselected))
	for _, traitID := range unselected {
		// 観測シナリオ（1/0）での事後を計算
		traitIDs2 := append(append([]string{}, traitIDsSel...), traitID)

		// obs=1
		getObs1 := func(id string) (BayesObservation, bool) {
			if id == traitID {
				return BayesObservation{Kind: BayesTraitBinary, K: 2, State: 1}, true
			}
			return getObsBase(id)
		}
		r1, err1 := EvaluateBayesA2FromOptions(nTaxa, traitIDs2, getTruth, getObs1, mode, opt)
		if err1 != nil {
			continue
		}
		p1 := probsFromRanked(r1)

		// obs=0
		getObs0 := func(id string) (BayesObservation, bool) {
			if id == traitID {
				return BayesObservation{Kind: BayesTraitBinary, K: 2, State: 0}, true
			}
			return getObsBase(id)
		}
		r0, err0 := EvaluateBayesA2FromOptions(nTaxa, traitIDs2, getTruth, getObs0, mode, opt)
		if err0 != nil {
			continue
		}
		p0 := probsFromRanked(r0)

		q1, q0 := pObs(traitID)
		// 期待エントロピー / 期待Gini
		expH := q1*entropy(p1) + q0*entropy(p0)
		expG := q1*gini(p1) + q0*gini(p0)

		sugRows = append(sugRows, sugRow{
			traitID:    traitID,
			infoGain:   H0 - expH,
			giniGain:   G0 - expG,
			expEntropy: expH,
			expGini:    expG,
		})
	}

	// 情報利得降順で上位に
	sort.Slice(sugRows, func(i, j int) bool { return sugRows[i].infoGain > sugRows[j].infoGain })

	// TraitSuggestion[] へ詰め替え（存在するフィールドにだけ入れる）
	suggestions := make([]TraitSuggestion, 0, len(sugRows))
	for _, sr := range sugRows {
		var sug TraitSuggestion
		sv := rv(&sug)
		// ID/Name 系（フロントが traitID で突き合わせる前提）
		setIfExists(sv, "TraitID", sr.traitID)
		setIfExists(sv, "ID", sr.traitID)
		setIfExists(sv, "Name", sr.traitID)
		setIfExists(sv, "Label", sr.traitID)
		// 指標
		setIfExists(sv, "Score", sr.infoGain)
		setIfExists(sv, "InfoGain", sr.infoGain)
		setIfExists(sv, "Gain", sr.infoGain)
		setIfExists(sv, "Entropy", sr.expEntropy) // 期待後エントロピー
		setIfExists(sv, "GINI", sr.giniGain)      // Gini利得（減少量）
		setIfExists(sv, "Gini", sr.giniGain)
		// 将来の重み付け用（Cost/Risk）フィールドがあれば 1.0 で埋める
		setIfExists(sv, "Cost", 1.0)
		setIfExists(sv, "Risk", 1.0)
		suggestions = append(suggestions, sug)
	}

	return ApplyResult{
		Scores:      scores,
		Suggestions: suggestions,
	}, nil
}

/*──────────────── 補助ログ ────────────────*/

func getFloatField(ts TaxonScore, name string) float64 {
	v := rv(&ts)
	f := v.FieldByName(name)
	if f.IsValid() {
		switch f.Kind() {
		case reflect.Float32, reflect.Float64:
			return f.Convert(reflect.TypeOf(float64(0))).Float()
		}
	}
	return math.NaN()
}

func logTop3(ranked []BayesRanked, taxaField reflect.Value) {
	n := 3
	if len(ranked) < n {
		n = len(ranked)
	}
	msg := "[A2] top:"
	for i := 0; i < n; i++ {
		r := ranked[i]
		name := fmt.Sprintf("#%d", r.Index)
		if r.Index >= 0 && r.Index < taxaField.Len() {
			tx := taxaField.Index(r.Index)
			if s, ok := getStringFieldAny(tx, "Name", "Label", "ScientificName", "Species", "TaxonName"); ok {
				name = s
			}
		}
		msg += fmt.Sprintf(" [%d] %s (%.4f)", i+1, name, r.Post)
	}
	log.Println(msg)
}
