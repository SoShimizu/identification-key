// samples.go
package main

import (
	"bytes"
	"fmt"
	"image"
	"image/color"
	"image/png"
	"os"
	"path/filepath"
	"strings"

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
		{"Head", "Mandible torsion", "ordinal(low<mid<high)"},
		{"Wings", "Wing darkness", "ordinal(pale<moderate<dark)"},
		{"Color", "Body color", "nominal(orange|brown|black)"},
		{"Ecology", "Distribution", "categorical_multi"}, // New Type
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
	sh := "Matrix"
	f.SetSheetName(f.GetSheetName(0), sh)

	header := append([]string{"#Group", "#Trait", "#Type"}, species10()...)
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

	if err := os.MkdirAll(filepath.Dir(outpath), 0o755); err != nil {
		return err
	}
	return f.SaveAs(outpath)
}

// ---- ② v2: mixed（binary + ordinal/nominal/continuous/categorical_multi） ----
func writeSampleMixedV2(outpath string) error {
	f := excelize.NewFile()
	sh := "Matrix"
	f.SetSheetName(f.GetSheetName(0), sh)

	header := append([]string{"#Group", "#Trait", "#Type", "#Difficulty", "#Risk", "#HelpText", "#HelpImages"}, species10()...)
	for i, v := range header {
		_ = f.SetCellStr(sh, fmtCell(i+1, 1), v)
	}

	trows := traits20()
	row := 2
	for r, trip := range trows {
		_ = f.SetCellStr(sh, fmtCell(1, row), trip[0]) // #Group
		_ = f.SetCellStr(sh, fmtCell(2, row), trip[1]) // #Trait
		_ = f.SetCellStr(sh, fmtCell(3, row), trip[2]) // #Type

		// Add some dummy metadata for difficulty/risk/help
		_ = f.SetCellStr(sh, fmtCell(4, row), "Normal")
		_ = f.SetCellStr(sh, fmtCell(5, row), "Low")
		_ = f.SetCellStr(sh, fmtCell(6, row), fmt.Sprintf("This is a help text for %s.", trip[1]))

		// MODIFIED: Add sample image to a few traits
		if r == 0 || r == 7 { // Add to "Antenna long" and "Fore wing fenestra..."
			_ = f.SetCellStr(sh, fmtCell(7, row), "sample_image.png")
		} else {
			_ = f.SetCellStr(sh, fmtCell(7, row), "") // #HelpImages
		}

		colOffset := 8 // Data starts from the 8th column now
		switch trip[2] {
		case "binary":
			for c := 0; c < 10; c++ {
				val := demoTernaryValue(r, c)
				_ = f.SetCellStr(sh, fmtCell(colOffset+c, row), val)
			}
		case "ordinal(low<mid<high)":
			states := []string{"low", "mid", "high"}
			for c := 0; c < 10; c++ {
				_ = f.SetCellStr(sh, fmtCell(colOffset+c, row), states[(r+c)%3])
			}
		case "nominal(orange|brown|black)":
			states := []string{"orange", "brown", "black"}
			for c := 0; c < 10; c++ {
				_ = f.SetCellStr(sh, fmtCell(colOffset+c, row), states[(2*r+c)%3])
			}
		case "continuous":
			for c := 0; c < 10; c++ {
				val := 10.0 + float64((r*3+c)%12) + 0.1*float64((r+c)%9)
				_ = f.SetCellFloat(sh, fmtCell(colOffset+c, row), val, 2, 64)
			}
		case "categorical_multi":
			// Example: Distribution data
			dists := [][]string{
				{"Japan", "Korea"},
				{"Japan", "Taiwan", "China"},
				{"China"},
				{"Korea", "Taiwan"},
				{"Japan"},
				{"Taiwan"},
				{"Japan", "China"},
				{"Korea"},
				{"China", "Taiwan"},
				{"Japan", "Korea", "Taiwan"},
			}
			for c := 0; c < 10; c++ {
				// Join with semicolon
				_ = f.SetCellStr(sh, fmtCell(colOffset+c, row), strings.Join(dists[(r+c)%10], "; "))
			}
		}
		row++
	}

	if err := os.MkdirAll(filepath.Dir(outpath), 0o755); err != nil {
		return err
	}
	return f.SaveAs(outpath)
}

// ---- ③ 小さめ v2（UI検証用） ----

func writeSampleSmallV2(outpath string) error {
	f := excelize.NewFile()
	sh := "Matrix"
	f.SetSheetName(f.GetSheetName(0), sh)

	header := []string{"#Group", "#Trait", "#Type", "A sp.", "B sp.", "C sp."}
	for i, v := range header {
		_ = f.SetCellStr(sh, fmtCell(i+1, 1), v)
	}

	rows := [][]string{
		{"Head", "Antenna long", "binary", "1", "0", "-1"},
		{"Wings", "Central sclerite", "binary", "1", "1", "0"},
		{"Abdomen", "Posterior segments black", "binary", "0", "1", "0"},
	}
	for r, rowData := range rows {
		for c, v := range rowData {
			_ = f.SetCellStr(sh, fmtCell(c+1, r+2), v)
		}
	}

	if err := os.MkdirAll(filepath.Dir(outpath), 0o755); err != nil {
		return err
	}
	return f.SaveAs(outpath)
}

// createPlaceholderImage generates a simple 100x100 PNG with a green checkmark
func createPlaceholderImage() ([]byte, error) {
	width, height := 100, 100
	img := image.NewRGBA(image.Rect(0, 0, width, height))

	// Background
	bgColor := color.RGBA{240, 240, 240, 255}
	for x := 0; x < width; x++ {
		for y := 0; y < height; y++ {
			img.Set(x, y, bgColor)
		}
	}

	// Green checkmark
	checkColor := color.RGBA{34, 139, 34, 255}
	// Draw the checkmark lines
	for i := 0; i < 25; i++ {
		img.Set(25+i, 50+i, checkColor)
		img.Set(26+i, 50+i, checkColor)
	}
	for i := 0; i < 50; i++ {
		img.Set(50+i, 75-i, checkColor)
		img.Set(51+i, 75-i, checkColor)
	}

	var buf bytes.Buffer
	if err := png.Encode(&buf, img); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}
