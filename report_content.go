// backend/report_content.go
package main

// reportStrings 構造体は、レポートで使用されるすべてのテキストを保持します。
type reportStrings struct {
	Title                string
	ReportID             string
	Date                 string
	MatrixFile           string
	Algorithm            string
	ParametersUsed       string
	Alpha                string
	Beta                 string
	Gamma                string
	Kappa                string
	ConflictPenalty      string
	Tolerance            string
	ObservationHistory   string
	NoObservations       string
	FinalRanking         string
	NoCandidates         string
	RankHeader           string
	TaxonHeader          string
	ScoreHeader          string
	ConflictsHeader      string
	MatchSupportHeader   string
	AndMore              string
	ConfidenceTitle      string
	ConfidenceHigh       string
	ConfidenceVeryHigh   string
	ConfidenceAbsolute   string
	ConfidenceContested  string // RENAMED
	ConfidenceNA         string
	CitationTitle        string
	CitationText         string
	EndOfReport          string
	ReportFilenamePrefix string
}

// getReportStrings は、指定された言語に基づいて適切な文字列セットを返します。
func getReportStrings(lang string) reportStrings {
	if lang == "ja" {
		return reportStrings{
			Title:                "MyKeyLogue 同定レポート",
			ReportID:             "レポートID",
			Date:                 "日時",
			MatrixFile:           "マトリクスファイル",
			Algorithm:            "アルゴリズム",
			ParametersUsed:       "使用したパラメータ",
			Alpha:                "偽陽性率 (α)",
			Beta:                 "偽陰性率 (β)",
			Gamma:                "NAペナルティ (γ)",
			Kappa:                "平滑化 (κ)",
			ConflictPenalty:      "矛盾ペナルティ",
			Tolerance:            "許容範囲 (連続値)",
			ObservationHistory:   "操作履歴 (選択順)",
			NoObservations:       "観察は行われませんでした。",
			FinalRanking:         "最終的な候補ランキング",
			NoCandidates:         "観察に一致する候補はありませんでした。",
			RankHeader:           "ランク",
			TaxonHeader:          "タクソン名",
			ScoreHeader:          "スコア (確率)",
			ConflictsHeader:      "矛盾数",
			MatchSupportHeader:   "一致/適用",
			AndMore:              "...他 %d 件",
			ConfidenceTitle:      "同定の信頼度",
			ConfidenceHigh:       "高い (1位の候補は2位より %.2f倍確からしい)",
			ConfidenceVeryHigh:   "非常に高い (2位以下の候補の確率は0です)",
			ConfidenceAbsolute:   "決定的 (候補は1つに絞り込まれました)",
			ConfidenceContested:  "要検討 (上位候補が競合しており、単一のタクソンを断定するには情報が不十分です。追加の形質観察を推奨します)",
			ConfidenceNA:         "N/A (候補なし)",
			CitationTitle:        "引用",
			CitationText:         "このレポートを研究等で利用する場合は、MyKeyLogueを引用してください:\n  Shimizu S. 2025. MyKeyLogue: A Software Platform for Interactive Multi-Access Keys in Taxonomic Identification. https://github.com/soshimizu/identification-key",
			EndOfReport:          "レポート終端",
			ReportFilenamePrefix: "MyKeyLogueレポート",
		}
	}
	// Default to English
	return reportStrings{
		Title:                "MyKeyLogue Identification Report",
		ReportID:             "Report ID",
		Date:                 "Date",
		MatrixFile:           "Matrix File",
		Algorithm:            "Algorithm",
		ParametersUsed:       "Parameters Used",
		Alpha:                "False Positive Rate (α)",
		Beta:                 "False Negative Rate (β)",
		Gamma:                "NA Penalty (γ)",
		Kappa:                "Smoothing (κ)",
		ConflictPenalty:      "Conflict Penalty",
		Tolerance:            "Tolerance (Continuous)",
		ObservationHistory:   "Observation History (in order of selection)",
		NoObservations:       "No observations were made.",
		FinalRanking:         "Final Candidate Ranking",
		NoCandidates:         "No candidates matched the observations.",
		RankHeader:           "Rank",
		TaxonHeader:          "Taxon Name",
		ScoreHeader:          "Score (Prob.)",
		ConflictsHeader:      "Conflicts",
		MatchSupportHeader:   "Match/Sup.",
		AndMore:              "...and %d more.",
		ConfidenceTitle:      "Identification Confidence",
		ConfidenceHigh:       "High (Top candidate is %.2fx more likely than the second)",
		ConfidenceVeryHigh:   "Very High (Second candidate has a probability of zero)",
		ConfidenceAbsolute:   "Conclusive (Only one candidate remains)",
		ConfidenceContested:  "Contested (Top candidates are too close to make a definitive identification. Additional character observation is recommended)",
		ConfidenceNA:         "N/A (No candidates)",
		CitationTitle:        "Citation",
		CitationText:         "If you use this report in your work, please cite MyKeyLogue:\n  Shimizu S. 2025. MyKeyLogue: A Software Platform for Interactive Multi-Access Keys in Taxonomic Identification. https://github.com/soshimizu/identification-key",
		EndOfReport:          "End of Report",
		ReportFilenamePrefix: "MyKeyLogue_Report",
	}
}
