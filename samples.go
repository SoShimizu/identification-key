// backend/samples.go
package main

import (
	"bytes"
	"image"
	"image/color"
	"image/png"

	"github.com/xuri/excelize/v2"
)

// ---- サンプル共通ヘルパ ----

func writeSheet(f *excelize.File, sheetName string, data [][]string) {
	for r, rowData := range data {
		for c, cellData := range rowData {
			cell, _ := excelize.CoordinatesToCellName(c+1, r+1)
			f.SetCellValue(sheetName, cell, cellData)
		}
	}
}

// ---- ① 日本のサクラ サンプル ----
func writeSampleSakura(outpath string) error {
	f := excelize.NewFile()
	f.DeleteSheet("Sheet1")

	// MatrixInfo
	f.NewSheet("MatrixInfo")
	writeSheet(f, "MatrixInfo", [][]string{
		{"title_ja", "日本のサクラ（簡易版）"},
		{"title_en", "Chery Blossoms in Japan (Simple ver.)"},
		{"version", "1.0"},
		{"authors_jp", "MyKeyLogue サンプル"},
	})

	// TaxaInfo
	f.NewSheet("TaxaInfo")
	writeSheet(f, "TaxaInfo", [][]string{
		{"#TaxonID", "#ScientificName", "#VernacularName_ja"},
		{"cerasus_jamasakura", "Cerasus jamasakura", "ヤマザクラ"},
		{"cerasus_itosakura", "Cerasus itosakura", "エドヒガン"},
		{"cerasus_speciosa", "Cerasus speciosa", "オオシマザクラ"},
	})

	// Traits
	f.NewSheet("Traits")
	writeSheet(f, "Traits", [][]string{
		{"#Trait_ja", "#Trait_en", "#Group_ja", "#Group_en", "#Type", "cerasus_jamasakura", "cerasus_itosakura", "cerasus_speciosa"},
		{"葉より先に花が咲く", "Flowers bloom before leaves", "花と葉", "Flower & Leaf", "binary", "-1", "1", "1"},
		{"葉柄に蜜腺がある", "Nectar glands on petiole", "花と葉", "Flower & Leaf", "binary", "1", "-1", "1"},
		{"萼筒（がくづつ）が無毛", "Calyx tube is glabrous", "花", "Flower", "binary", "1", "-1", "1"},
		{"萼筒が壺形", "Calyx tube is urn-shaped", "花", "Flower", "binary", "-1", "1", "-1"},
	})

	return f.SaveAs(outpath)
}

// ---- ② 日本のカラス サンプル ----
func writeSampleKarasu(outpath string) error {
	f := excelize.NewFile()
	f.DeleteSheet("Sheet1")

	// MatrixInfo & TaxaInfo
	f.NewSheet("MatrixInfo")
	writeSheet(f, "MatrixInfo", [][]string{
		{"title_ja", "日本のカラス"}, {"version", "1.0"},
	})
	f.NewSheet("TaxaInfo")
	writeSheet(f, "TaxaInfo", [][]string{
		{"#TaxonID", "#ScientificName", "#VernacularName_ja"},
		{"corvus_corone", "Corvus corone", "ハシボソガラス"},
		{"corvus_macrorhynchos", "Corvus macrorhynchos", "ハシブトガラス"},
	})

	// Traits
	f.NewSheet("Traits")
	writeSheet(f, "Traits", [][]string{
		{"#Trait_ja", "#Group_ja", "#Type", "corvus_corone", "corvus_macrorhynchos"},
		{"くちばしが細い", "形態", "binary", "1", "-1"},
		{"おでこが出っ張っていない", "形態", "binary", "1", "-1"},
		{"鳴き声が「カーカー」と澄んでいる", "生態", "binary", "1", "-1"},
		{"鳴き声が「カァーカァー」と濁っている", "生態", "binary", "-1", "1"},
		{"主に畑や河原にいる", "生態", "binary", "1", "-1"},
		{"主に森林や市街地にいる", "生態", "binary", "-1", "1"},
	})

	return f.SaveAs(outpath)
}

// ---- ③ 日本の哺乳類 サンプル ----
func writeSampleHonyurui(outpath string) error {
	f := excelize.NewFile()
	f.DeleteSheet("Sheet1")

	f.NewSheet("MatrixInfo")
	writeSheet(f, "MatrixInfo", [][]string{
		{"title_ja", "日本の哺乳類（齧歯目と翼手目）"}, {"version", "1.0"},
	})
	f.NewSheet("TaxaInfo")
	writeSheet(f, "TaxaInfo", [][]string{
		{"#TaxonID", "#ScientificName", "#VernacularName_ja"},
		{"rattus_rattus", "Rattus rattus", "クマネズミ"},
		{"mus_musculus", "Mus musculus", "ハツカネズミ"},
		{"pipistrellus_abramus", "Pipistrellus abramus", "アブラコウモリ"},
	})

	// Traits
	f.NewSheet("Traits")
	writeSheet(f, "Traits", [][]string{
		{"#Trait_ja", "#Group_ja", "#Type", "#HelpText_ja", "rattus_rattus", "mus_musculus", "pipistrellus_abramus"},
		{"翼がある", "形態", "binary", "", "-1", "-1", "1"},
		{"体長が15cm以上", "形態", "binary", "頭から尾の付け根までの長さ", "1", "-1", "-1"},
		{"尾が体長より長い", "形態", "binary", "", "1", "-1", "NA"},
		{"体重 (g)", "形態", "continuous", "", "150-250", "15-30", "5-10"},
	})
	return f.SaveAs(outpath)
}

// ---- ④ 日本のスズメバチ サンプル ----
func writeSampleSuzumebachi(outpath string) error {
	f := excelize.NewFile()
	f.DeleteSheet("Sheet1")

	f.NewSheet("MatrixInfo")
	writeSheet(f, "MatrixInfo", [][]string{
		{"title_ja", "日本のスズメバチ（Vespa属）"}, {"version", "1.0"},
	})
	f.NewSheet("TaxaInfo")
	writeSheet(f, "TaxaInfo", [][]string{
		{"#TaxonID", "#ScientificName", "#VernacularName_ja"},
		{"vespa_mandarinia", "Vespa mandarinia", "オオスズメバチ"},
		{"vespa_crabro", "Vespa crabro", "モンスズメバチ"},
		{"vespa_simillima", "Vespa simillima", "キイロスズメバチ"},
		{"vespa_velutina", "Vespa velutina", "ツマアカスズメバチ"},
	})

	// Traits
	f.NewSheet("Traits")
	writeSheet(f, "Traits", [][]string{
		{"#TraitID", "#Dependency", "#Trait_ja", "#Group_ja", "#Type", "#HelpText_ja", "vespa_mandarinia", "vespa_crabro", "vespa_simillima", "vespa_velutina"},
		{"head_large", "", "頭部が大きい (頭幅5mm以上)", "形態", "binary", "女王で比較", "1", "-1", "-1", "-1"},
		{"head_color", "", "頭楯の色", "形態", "nominal_parent(黄色|橙色)", "", "黄色", "黄色", "黄色", "橙色"},
		{"body_color", "", "腹部の色彩", "生態", "categorical_multi", "腹部末端の節の色。複数選択可。", "黄;黒", "黄;赤;黒", "黄;黒", "橙;黒"},
		{"nest_closed", "", "巣が外皮に覆われるか", "生態", "binary", "巣盤が露出しているか否か", "1", "0", "1", "1"},
		{"nest_loc_closed", "nest_closed=1", "巣の場所 (閉鎖空間)", "生態", "binary", "樹洞や屋根裏など", "1", "NA", "1", "0"},
	})
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
