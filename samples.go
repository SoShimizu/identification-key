// samples.go
package main

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/xuri/excelize/v2"
)

// ---- サンプル共通ヘルパ ----

func fmtCell(col, row int) string {
	cell, _ := excelize.CoordinatesToCellName(col, row)
	return cell
}

func species10() []string {
	return []string{
		"Species 01", "Species 02", "Species 03", "Species 04", "Species 05",
		"Species 06", "Species 07", "Species 08", "Species 09", "Species 10",
	}
}

// Group, Trait, Type
func traits20() [][3]string {
	return [][3]string{
		{"Head", "Antenna long", "binary"},
		{"Head", "Clypeus convex", "binary"},
		{"Head", "Interocellar area black", "binary"},
		{"Thorax", "Mesoscutum infuscate", "binary"},
		{"Thorax", "Mesopleuron densely punctate", "binary"},
		{"Legs", "Hind tarsal claw uniformly pectinate", "binary"},
		{"Legs", "Proximal pectin absent", "binary"},
		{"Wings", "Fore wing fenestra central sclerite", "binary"},
		{"Wings", "Distal sclerite confluent with proximal", "binary"},
		{"Wings", "Marginal cell widely glabrous proximally", "binary"},
		{"Abdomen", "Metasomal posterior segments black", "binary"},
		{"Abdomen", "Propodeum posterior area strongly shiny", "binary"},
		{"Ecology", "Nocturnal", "binary"},
		{"Ecology", "Large fore wing (>20mm)", "binary"},
		// mixed 用（v2での型バリエーションの見本）
		{"Head", "Mandible torsion", "ordinal3"}, // low/mid/high
		{"Wings", "Wing darkness", "ordinal3"},   // pale/moderate/dark
		{"Color", "Body color", "nominal3"},      // orange/brown/black
		{"Ecology", "Habitat type", "nominal3"},  // forest/farmland/wetland
		{"Wings", "Fore wing length (mm)", "continuous"},
		{"Abdomen", "T7 spot area ratio", "continuous"},
	}
}

func demoTernaryValue(traitIndex, taxonIndex int) string {
	// それっぽいパターンで -1/0/1 を配る（デモ用）
	switch {
	case (traitIndex+taxonIndex)%7 == 0:
		return "0"
	case (traitIndex+2*taxonIndex)%3 == 0:
		return "-1"
	case (2*traitIndex+taxonIndex)%5 == 0:
		return "0"
	default:
		if (traitIndex+taxonIndex)%2 == 0 {
			return "1"
		}
		return "-1"
	}
}

// ---- ① v2: binary（10種×binary形質） ----

func writeSampleBinaryV2(outpath string) error {
	f := excelize.NewFile()
	sh := f.GetSheetName(0)

	header := append([]string{"Group", "Trait", "Type"}, species10()...)
	for i, v := range header {
		_ = f.SetCellStr(sh, fmtCell(i+1, 1), v)
	}

	trows := traits20()
	row := 2
	for r, trip := range trows {
		if trip[2] != "binary" {
			continue
		}
		_ = f.SetCellStr(sh, fmtCell(1, row), trip[0])
		_ = f.SetCellStr(sh, fmtCell(2, row), trip[1])
		_ = f.SetCellStr(sh, fmtCell(3, row), "binary")
		for c := 0; c < 10; c++ {
			val := demoTernaryValue(r, c)
			_ = f.SetCellStr(sh, fmtCell(4+c, row), val)
		}
		row++
	}

	// TaxaMeta
	if _, err := f.NewSheet("TaxaMeta"); err == nil {
		metaHeader := []string{"Taxon", "Regions", "Seasons", "Habitats"}
		for i, v := range metaHeader {
			_ = f.SetCellStr("TaxaMeta", fmtCell(i+1, 1), v)
		}
		meta := [][]string{
			{"Species 01", "Hokkaido,Honshu", "Spring,Summer", "Forest"},
			{"Species 02", "Honshu", "Spring", "Forest,Farmland"},
			{"Species 03", "Shikoku,Kyushu", "Summer", "Forest"},
			{"Species 04", "Ryukyu", "Summer,Autumn", "Forest"},
			{"Species 05", "Honshu,Shikoku", "Autumn", "Wetland"},
			{"Species 06", "Honshu,Kyushu", "All", "Urban"},
			{"Species 07", "Hokkaido", "Spring", "Farmland"},
			{"Species 08", "Honshu", "Summer", "Forest"},
			{"Species 09", "Honshu,Shikoku", "Summer,Autumn", "Forest"},
			{"Species 10", "Ryukyu", "Summer", "Forest"},
		}
		for r, row := range meta {
			for c, v := range row {
				_ = f.SetCellStr("TaxaMeta", fmtCell(c+1, r+2), v)
			}
		}
	}

	if err := os.MkdirAll(filepath.Dir(outpath), 0o755); err != nil {
		return err
	}
	return f.SaveAs(outpath)
}

// ---- ② v1: レガシー（A=Trait、[Group] 付きラベル） ----

func writeSampleBinaryV1(outpath string) error {
	f := excelize.NewFile()
	sh := f.GetSheetName(0)

	header := append([]string{"Trait"}, species10()...)
	for i, v := range header {
		_ = f.SetCellStr(sh, fmtCell(i+1, 1), v)
	}

	trows := traits20()
	row := 2
	for r, trip := range trows {
		if trip[2] != "binary" {
			continue
		}
		tagged := fmt.Sprintf("[%s] %s", trip[0], trip[1])
		_ = f.SetCellStr(sh, fmtCell(1, row), tagged)
		for c := 0; c < 10; c++ {
			val := demoTernaryValue(r, c)
			_ = f.SetCellStr(sh, fmtCell(2+c, row), val)
		}
		row++
	}

	if err := os.MkdirAll(filepath.Dir(outpath), 0o755); err != nil {
		return err
	}
	return f.SaveAs(outpath)
}

// ---- ③ v2: mixed（binary + ordinal/nominal/continuous） ----
// ※ 現在のエンジンは binary 中心ですが、mixed 形式の「型の宣言例」を提供します。

func writeSampleMixedV2(outpath string) error {
	f := excelize.NewFile()
	sh := f.GetSheetName(0)

	header := append([]string{"Group", "Trait", "Type"}, species10()...)
	for i, v := range header {
		_ = f.SetCellStr(sh, fmtCell(i+1, 1), v)
	}

	trows := traits20()
	row := 2
	for r, trip := range trows {
		_ = f.SetCellStr(sh, fmtCell(1, row), trip[0])
		_ = f.SetCellStr(sh, fmtCell(2, row), trip[1])
		_ = f.SetCellStr(sh, fmtCell(3, row), trip[2])

		switch trip[2] {
		case "binary":
			for c := 0; c < 10; c++ {
				val := demoTernaryValue(r, c)
				_ = f.SetCellStr(sh, fmtCell(4+c, row), val)
			}
		case "ordinal3":
			// low / mid / high
			states := []string{"low", "mid", "high"}
			for c := 0; c < 10; c++ {
				_ = f.SetCellStr(sh, fmtCell(4+c, row), states[(r+c)%3])
			}
		case "nominal3":
			// orange / brown / black
			states := []string{"orange", "brown", "black"}
			for c := 0; c < 10; c++ {
				_ = f.SetCellStr(sh, fmtCell(4+c, row), states[(2*r+c)%3])
			}
		case "continuous":
			// 適当な実数値（例示）
			for c := 0; c < 10; c++ {
				val := 10.0 + float64((r*3+c)%12) + 0.1*float64((r+c)%9)
				_ = f.SetCellFloat(sh, fmtCell(4+c, row), val, 2, 64)
			}
		}
		row++
	}

	// TaxaMeta
	if _, err := f.NewSheet("TaxaMeta"); err == nil {
		metaHeader := []string{"Taxon", "Regions", "Seasons", "Habitats"}
		for i, v := range metaHeader {
			_ = f.SetCellStr("TaxaMeta", fmtCell(i+1, 1), v)
		}
		for i, nm := range species10() {
			r := i + 2
			_ = f.SetCellStr("TaxaMeta", fmtCell(1, r), nm)
			_ = f.SetCellStr("TaxaMeta", fmtCell(2, r), "Honshu,Shikoku")
			_ = f.SetCellStr("TaxaMeta", fmtCell(3, r), "Spring,Summer")
			_ = f.SetCellStr("TaxaMeta", fmtCell(4, r), "Forest")
		}
	}

	if err := os.MkdirAll(filepath.Dir(outpath), 0o755); err != nil {
		return err
	}
	return f.SaveAs(outpath)
}

// ---- ④ 小さめ v2（UI検証用） ----

func writeSampleSmallV2(outpath string) error {
	f := excelize.NewFile()
	sh := f.GetSheetName(0)

	header := []string{"Group", "Trait", "Type", "A sp.", "B sp.", "C sp."}
	for i, v := range header {
		_ = f.SetCellStr(sh, fmtCell(i+1, 1), v)
	}

	rows := [][]string{
		{"Head", "Antenna long", "binary", "1", "0", "-1"},
		{"Wings", "Central sclerite", "binary", "1", "1", "0"},
		{"Abdomen", "Posterior segments black", "binary", "0", "1", "0"},
	}
	for r, row := range rows {
		for c, v := range row {
			_ = f.SetCellStr(sh, fmtCell(c+1, r+2), v)
		}
	}

	if err := os.MkdirAll(filepath.Dir(outpath), 0o755); err != nil {
		return err
	}
	return f.SaveAs(outpath)
}
