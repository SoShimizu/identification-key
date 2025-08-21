// keys_samples.go
package main

import (
	"fmt"
	"math/rand"
	"time"

	"github.com/xuri/excelize/v2"
)

func writeSampleMinimal(outpath string) error {
	f := excelize.NewFile()
	const sh = "Matrix"
	f.SetSheetName("Sheet1", sh)

	// Taxa 10
	taxa := []string{
		"Alpha", "Bravo", "Charlie", "Delta", "Echo",
		"Foxtrot", "Golf", "Hotel", "India", "Juliet",
	}

	// Header
	header := append([]string{"#Group", "#Trait", "#Type"}, taxa...)
	for i, v := range header {
		cell, _ := excelize.CoordinatesToCellName(i+1, 1)
		_ = f.SetCellStr(sh, cell, v)
	}

	r := 2
	put := func(group, trait, typ string, vals []string) {
		row := append([]string{group, trait, typ}, vals...)
		for c, v := range row {
			cell, _ := excelize.CoordinatesToCellName(c+1, r)
			_ = f.SetCellStr(sh, cell, v)
		}
		r++
	}

	rand.Seed(time.Now().UnixNano())

	// --- Binary (5 rows)
	put("Head", "Antenna long", "binary", pickBinary(10))
	put("Head", "Clypeus convex", "binary", pickBinary(10))
	put("Wings", "Metallic sheen", "binary", pickBinary(10))
	put("Ecology", "Nocturnal", "binary", pickBinary(10))
	put("Abdomen", "Posterior segments black", "binary", pickBinary(10))

	// --- Nominal / Ordinal (1 row each)
	// Nominal3: Body color in {black, white, yellow}
	put("Color", "Body color", "nominal(black|white|yellow)", pickNominal([]string{"black", "white", "yellow"}, 10))
	// Ordinal3: Wing darkness in {pale, medium, dark}
	put("Wings", "Wing darkness", "ordinal(pale<medium<dark)", pickNominal([]string{"pale", "medium", "dark"}, 10))
	// Ordinal4: Mandible torsion in {none, slight, strong, extreme}
	put("Head", "Mandible torsion", "ordinal(none<slight<strong<extreme)", pickNominal([]string{"none", "slight", "strong", "extreme"}, 10))

	// --- Continuous (3 rows): numeric strings（GetRows で文字列で取れる）
	put("Wings", "Fore wing length (mm)", "continuous", pickContinuous(8.0, 16.0, 10))
	put("Thorax", "Mesopleuron punctation density", "continuous", pickContinuous(0.1, 0.9, 10))
	put("Ecology", "Altitude (m)", "continuous", pickContinuous(50, 1800, 10))

	// 追加の Binary/名義で 20 前後に
	put("Antenna", "Flagellomere count > 30", "binary", pickBinary(10))
	put("Head", "Ocellus large", "binary", pickBinary(10))
	put("Color", "Leg color", "nominal(brown|yellow|black)", pickNominal([]string{"brown", "yellow", "black"}, 10))
	put("Abdomen", "Tergite band width", "ordinal(narrow<medium<wide)", pickNominal([]string{"narrow", "medium", "wide"}, 10))

	// Save
	return f.SaveAs(outpath)
}

func pickBinary(n int) []string {
	out := make([]string, n)
	for i := range out {
		if rand.Float64() < 0.5 {
			out[i] = "1"
		} else {
			out[i] = "0"
		}
	}
	return out
}

func pickNominal(states []string, n int) []string {
	out := make([]string, n)
	for i := range out {
		out[i] = states[rand.Intn(len(states))]
	}
	return out
}

func pickContinuous(min, max float64, n int) []string {
	out := make([]string, n)
	for i := range out {
		v := min + rand.Float64()*(max-min)
		out[i] = fmt.Sprintf("%.2f", v)
	}
	return out
}
