// frontend/src/components/header/RibbonWelcomeTab.tsx
import React from "react";
import {
  Box,
  Card,
  CardContent,
  Stack,
  Link,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import BugReportIcon from "@mui/icons-material/BugReport";
import ArticleIcon from "@mui/icons-material/Article";
import ScienceIcon from "@mui/icons-material/Science";
import TipsAndUpdatesIcon from "@mui/icons-material/TipsAndUpdates";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import PolicyIcon from "@mui/icons-material/Policy";
import { STR } from "../../i18n";

type Props = {
  lang: "ja" | "en";
};

export default function RibbonWelcomeTab({ lang }: Props) {
  const ja = lang === "ja";

  // ────────────────────────────────────────────────────────────────────────────
  // Matrix help: trait type table
  // ────────────────────────────────────────────────────────────────────────────
  const matrixTypeTable = `
    <table class="manual-table">
      <thead>
        <tr>
          <th>${ja ? "形質タイプ" : "Trait Type"}</th>
          <th>${ja ? "説明" : "Description"}</th>
          <th>${ja ? "入力例" : "Input Examples"}</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>binary</code></td>
          <td>${ja ? "はい/いいえ の二択" : "Yes / No (two-state)"}</td>
          <td><code>1</code>, <code>-1</code>, <code>0</code>, (blank)</td>
        </tr>
        <tr>
          <td><code>continuous</code></td>
          <td>${ja ? "連続値（単一値または範囲）" : "Continuous (single value or range)"}</td>
          <td><code>5.2</code> ${ja ? "または" : "or"} <code>3.1-4.5</code></td>
        </tr>
        <tr>
          <td><code>nominal</code></td>
          <td>${ja ? "多状態（カテゴリ）" : "Multi-state (categorical)"}</td>
          <td>e.g., <code>orange</code>, <code>black</code></td>
        </tr>
      </tbody>
    </table>`;

  // ────────────────────────────────────────────────────────────────────────────
  // Matrix schema: header columns
  // ────────────────────────────────────────────────────────────────────────────
  const matrixHeaderTable = `
    <table class="manual-table">
      <thead>
        <tr>
          <th>${ja ? "ヘッダー名" : "Header"}</th>
          <th>${ja ? "必須" : "Required"}</th>
          <th>${ja ? "説明" : "Description"}</th>
          <th>${ja ? "入力例" : "Example"}</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>#Group</code></td>
          <td>${ja ? "任意" : "Optional"}</td>
          <td>${
            ja
              ? "形質のグループ名。自由記述（例：頭部、翅、幼生、生態、分布）。UIのセクション見出しとして利用。"
              : "Free-text group label (e.g., Head, Wing, Larva, Ecology, Distribution). Used as section headers in the UI."
          }</td>
          <td>${ja ? "頭部 / 生態 / 分布" : "Head / Ecology / Distribution"}</td>
        </tr>
        <tr>
          <td><code>#Trait</code></td>
          <td>${ja ? "必須" : "Required"}</td>
          <td>${
            ja
              ? "形質（項目）名。行の識別子。重複しない短い名前を推奨。"
              : "Character (trait) name. Row identifier. Prefer short, unique names."
          }</td>
          <td>${ja ? "複眼の有無" : "Ocelli present"}</td>
        </tr>
        <tr>
          <td><code>#Type</code></td>
          <td>${ja ? "必須" : "Required"}</td>
          <td>${
            ja
              ? "<code>binary</code> / <code>continuous</code> / <code>nominal</code> のいずれか。"
              : "One of <code>binary</code>, <code>continuous</code>, or <code>nominal</code>."
          }</td>
          <td><code>binary</code></td>
        </tr>
        <tr>
          <td><code>#Difficulty</code></td>
          <td>${ja ? "任意" : "Optional"}</td>
          <td>${
            ja
              ? "測定難易度。候補推薦（Best+Cost+Risk）の“コスト”に使用。<code>Easy</code> / <code>Normal</code> / <code>Hard</code>。"
              : "Measurement difficulty, used as ‘cost’ in recommendation. <code>Easy</code> / <code>Normal</code> / <code>Hard</code>."
          }</td>
          <td><code>Normal</code></td>
        </tr>
        <tr>
          <td><code>#Risk</code></td>
          <td>${ja ? "任意" : "Optional"}</td>
          <td>${
            ja
              ? "誤解・誤判定リスク。推薦の“リスク”重み付けに使用。<code>Low</code> / <code>Medium</code> / <code>High</code>。"
              : "Risk of misinterpretation, used in recommendation weighting. <code>Low</code> / <code>Medium</code> / <code>High</code>."
          }</td>
          <td><code>High</code></td>
        </tr>
        <tr>
          <td><code>#HelpText</code></td>
          <td>${ja ? "任意" : "Optional"}</td>
          <td>${
            ja
              ? "形質の定義・計測手順・注意点などの短い説明文。UIのヘルプに表示。"
              : "Short help text with definition, measurement hints, caveats; shown in the UI."
          }</td>
          <td>${
            ja
              ? "前胸背板の前縁を基準に測定。スケールバー必須。"
              : "Measure from the anterior margin of pronotum; include a scale bar."
          }</td>
        </tr>
        <tr>
          <td><code>#HelpImages</code></td>
          <td>${ja ? "任意" : "Optional"}</td>
          <td>${
            ja
              ? "ヘルプ画像のファイル名（拡張子込み）をカンマ区切りで。アプリと同じディレクトリの <code>help_materials</code> フォルダに配置。"
              : "Comma-separated filenames (with extension). Files must exist under the app-side <code>help_materials</code> folder."
          }</td>
          <td><code>head_ocelli.png,head_ocelli_diag.jpg</code></td>
        </tr>
      </tbody>
    </table>`;

  // ────────────────────────────────────────────────────────────────────────────
  // Minimal sample row (for visual guidance only; not read by code)
  // ────────────────────────────────────────────────────────────────────────────
  const sampleMatrixSnippet = `
    <table class="manual-table">
      <thead>
        <tr>
          <th>#Group</th><th>#Trait</th><th>#Type</th><th>#Difficulty</th><th>#Risk</th><th>#HelpText</th><th>#HelpImages</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Head</td>
          <td>Ocelli present</td>
          <td>binary</td>
          <td>Normal</td>
          <td>Medium</td>
          <td>${ja ? "単眼の有無。正面像で確認。" : "Presence of ocelli; verify in frontal view."}</td>
          <td>head_ocelli.png</td>
        </tr>
        <tr>
          <td>Wing</td>
          <td>Forewing length (mm)</td>
          <td>continuous</td>
          <td>Easy</td>
          <td>Low</td>
          <td>${ja ? "基部から先端まで直線距離。" : "Straight distance from base to apex."}</td>
          <td>wing_measure.png</td>
        </tr>
        <tr>
          <td>Color</td>
          <td>Abdomen color</td>
          <td>nominal</td>
          <td>Normal</td>
          <td>High</td>
          <td>${ja ? "光条件で見え方が変わるため注意。" : "Color perception varies with lighting; caution."}</td>
          <td>abdomen_colors.jpg</td>
        </tr>
      </tbody>
    </table>`;

  // ────────────────────────────────────────────────────────────────────────────
  // Curated public references (primary / near-primary sources only)
  // ────────────────────────────────────────────────────────────────────────────
  const refs: Array<{ title: string; url: string; noteJa: string; noteEn: string }> = [
    {
      title: "Lucid ‘Best’ (IDtools)",
      url: "https://idtools.org/lucid_best_practices.cfm",
      noteJa: "候補削減を最大化する次形質推薦の考え方（Best機能）。",
      noteEn: "Rationale behind the ‘Best’ next-character suggestion (maximize entity reduction).",
    },
    {
      title: "TDWG SDD – Structured Descriptive Data",
      url: "https://www.tdwg.org/standards/sdd/",
      noteJa: "分類記述データの標準（XMLベース）。相互運用の基盤。",
      noteEn: "XML-based standard for descriptive data; foundation for interoperability.",
    },
    {
      title: "SDD Primer – DependencyRules",
      url: "https://sdd.tdwg.org/primer/SddDependencies.html",
      noteJa: "依存ルール（DependencyRules）の定義と例。",
      noteEn: "Definition and examples of character dependency rules.",
    },
    {
      title: "Dallwitz: Principles of Interactive Keys",
      url: "https://www.delta-intkey.com/www/interactivekeys.pdf",
      noteJa: "相互作用型キーの原則。エラー許容の考え方を含む。",
      noteEn: "Principles of interactive keys incl. error tolerance concept.",
    },
    {
      title: "DELTA System Overview",
      url: "https://www.delta-intkey.com/www/overview.htm",
      noteJa: "DELTA 形式の概要。標準的データ交換としての歴史的背景。",
      noteEn: "Overview of DELTA format; historical standard for data exchange.",
    },
    {
      title: "WEBiKEY（Botanical Society of America / PMC）",
      url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4850057/",
      noteJa: "Webベース・マルチアクセス鍵。依存や図版、Excel取込等の実装例。",
      noteEn: "Web-based multi-access key; example implementation incl. dependencies, media, XLSX.",
    },
    {
      title: "TaxonWorks – Matrices (error tolerance)",
      url: "https://docs.taxonworks.org/guide/Manual/matrices.html",
      noteJa: "“誤差許容=1”など、矛盾許容の概念。",
      noteEn: "Concept of error tolerance (e.g., tolerance = 1) in interactive keying.",
    },
    {
      title: "Clavis – open key format (PLOS ONE)",
      url: "https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0277752",
      noteJa: "JSONベースのオープンな識別キー形式。",
      noteEn: "JSON-based open identification key format.",
    },
    {
      title: "DiversityNaviKey (PWA / offline)",
      url: "https://dl.gi.de/bitstreams/f97e624d-36a1-40d7-9bde-f1d58f850644/download",
      noteJa: "PWAによるオフライン動作など、現場向け実装。",
      noteEn: "PWA design enabling offline functionality for field use.",
    },
    {
      title: "KeyBase – Royal Botanic Gardens Victoria",
      url: "https://keybase.rbg.vic.gov.au/",
      noteJa: "大規模な二分岐鍵基盤と公開運用の事例。",
      noteEn: "Large-scale platform and public deployments of dichotomous keys.",
    },
  ];

  return (
    <Box
      sx={{
        maxHeight: "70vh",
        overflowY: "auto",
        p: 1,
        ".manual-table": {
          width: "100%",
          borderCollapse: "collapse",
          "& th, & td": {
            border: 1,
            borderColor: "divider",
            p: 1,
            textAlign: "left",
            verticalAlign: "top",
            fontSize: "0.8rem",
          },
          "& th": {
            backgroundColor: "action.hover",
            fontWeight: "bold",
          },
          "& code": {
            fontFamily: "monospace",
            backgroundColor: "action.disabledBackground",
            padding: "0 4px",
            borderRadius: "4px",
          },
        },
        ".ref-note": { color: "text.secondary", fontSize: "0.8rem" },
      }}
    >
      {/* Title */}
      <Typography variant="h4" gutterBottom sx={{ fontWeight: "bold" }}>
        {ja ? "ClavisIDへようこそ！" : "Welcome to ClavisID!"}
      </Typography>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: "bold" }}>
        {ja
          ? "分類学的同定のための知的・インタラクティブ・マルチアクセスキー"
          : "An Intelligent, Interactive Multi-Access Key for Taxonomic Identification"}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {ja
          ? "ClavisIDは、形質行列（マトリクス）に基づくインタラクティブ検索表ツールです。形質は形態に限らず、生態・行動・生息環境・分布なども同定形質として利用できます。順不同で観察可能な形質を入力すれば、候補が動的に絞り込まれます。"
          : "ClavisID is built on trait matrices. Traits need not be morphological only—ecology, behaviour, habitat, and distribution can be used for identification as well. Provide any observable characters in any order to dynamically narrow candidates."}
      </Typography>

      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        {/* Left column: Manuals & Concept */}
        <Box sx={{ flex: 2 }}>
          {/* Quick start */}
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <MenuBookIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  {ja ? "クイックスタート" : "Quick Start"}
                </Typography>
              </Box>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary={ja ? "① データセットの用意" : "1) Prepare a dataset"}
                    secondary={
                      ja
                        ? "初回起動時、アプリと同じディレクトリに keys フォルダとサンプル .xlsx が自動生成されます。keys 内の Excel 形質マトリクスを編集して利用します。"
                        : "On first launch, the app creates a keys folder with sample .xlsx matrices next to the app. Edit and place your Excel matrices in keys."
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary={ja ? "② 検索手順" : "2) Identification workflow"}
                    secondary={
                      ja
                        ? "観察可能な形質から順不同で選択 → 候補が動的に更新されます。おすすめ（Best+Cost+Risk）で“次に測ると効率的”な形質も提示します。"
                        : "Select any observable characters in any order → candidates update dynamically. The recommender (Best+Cost+Risk) suggests efficient next characters."
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary={ja ? "③ 結果の解釈" : "3) Interpreting results"}
                    secondary={
                      ja
                        ? "候補リストの“なぜ？”パネルで、形質ごとの一致/矛盾/未使用と寄与を確認できます。"
                        : "Use the “Why?” panel to inspect per-character matches, conflicts, unused traits, and contributions."
                    }
                  />
                </ListItem>
              </List>
              <Divider sx={{ my: 1 }} />
              <Typography variant="body2" sx={{ mb: 1 }}>
                {ja ? "形質タイプと値の入力：" : "Trait types and value encoding:"}
              </Typography>
              <Box dangerouslySetInnerHTML={{ __html: matrixTypeTable }} />
            </CardContent>
          </Card>

          {/* Matrix schema */}
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <PolicyIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  {ja ? "マトリクステーブルの構造" : "Matrix Table Schema"}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                {ja
                  ? "各行が1つの形質（キャラクター）を表します。ヘッダー名は # で始まります。以下のカラムを用意してください。"
                  : "Each row describes one character (trait). Header names start with #. Provide the columns below."}
              </Typography>
              <Box dangerouslySetInnerHTML={{ __html: matrixHeaderTable }} />
              <Divider sx={{ my: 1 }} />
              <Typography variant="body2" sx={{ mb: 1 }}>
                {ja ? "最小構成の例：" : "Minimal example:"}
              </Typography>
              <Box dangerouslySetInnerHTML={{ __html: sampleMatrixSnippet }} />
              <Typography variant="caption" color="text.secondary">
                {ja
                  ? "ヘルプ画像はアプリと同階層にある help_materials フォルダへ配置してください。"
                  : "Place help images inside the help_materials folder located next to the app executable."}
              </Typography>
              <Divider sx={{ my: 1 }} />
              <List dense>
                <ListItem>
                  <ListItemText
                    primary={ja ? "実務ヒント 1：一意な形質名" : "Practical tip 1: unique trait names"}
                    secondary={
                      ja
                        ? "重複した #Trait 名は避け、末尾や先頭の空白も削除してください。"
                        : "Avoid duplicate #Trait values and trim leading/trailing whitespace."
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary={ja ? "実務ヒント 2：難易度/リスクの使い分け" : "Practical tip 2: difficulty & risk"}
                    secondary={
                      ja
                        ? "測定に時間がかかる項目は Hard、誤判定が起きやすい項目は High を設定すると推薦品質が向上します。"
                        : "Mark time-consuming characters as Hard and error-prone ones as High to improve recommendations."
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary={ja ? "実務ヒント 3：連続値の範囲表現" : "Practical tip 3: continuous ranges"}
                    secondary={
                      ja
                        ? "範囲はハイフン（例 3.1-4.5）で記述。小数点はピリオドを使用してください。"
                        : "Express ranges with a hyphen (e.g., 3.1-4.5). Use a dot for decimals."
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary={ja ? "実務ヒント 4：ヘルプの充実" : "Practical tip 4: rich help"}
                    secondary={
                      ja
                        ? "HelpText は定義・計測手順・注意点を簡潔に。HelpImages で視覚補助を加えると初心者の誤解を抑制できます。"
                        : "Keep HelpText concise (definition, how-to, caveats). HelpImages significantly reduce novice misinterpretation."
                    }
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          {/* Algorithm & Explainability */}
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <ScienceIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  {ja ? "アルゴリズム概要（透明性）" : "Algorithm Overview (Explainability)"}
                </Typography>
              </Box>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary={ja ? "ハイブリッドBayes" : "Hybrid Bayes ranking"}
                    secondary={
                      ja
                        ? "ハード矛盾は直ちに除外し、残りを対数尤度の加算＋平滑化でランク付け（ソフトマックス正規化）。未観察（NA）には小さなペナルティを適用。"
                        : "Eliminate hard conflicts first; rank remaining taxa via summed log-likelihood with smoothing and softmax; apply a small NA penalty."
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary={
                      ja ? "“Best+Cost+Risk” 形質推薦" : "“Best+Cost+Risk” character recommendation"
                    }
                    secondary={
                      ja
                        ? "Lucidの“Best”発想（候補削減最大）を踏まえ、情報利得×測定コスト×誤判定リスクで最適化。"
                        : "Extends Lucid’s ‘Best’ (maximize reduction) by optimizing information gain × measurement cost × misinterpretation risk."
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary={ja ? "エラー許容" : "Error tolerance"}
                    secondary={
                      ja
                        ? "ユーザー誤判定やデータ誤差に頑健化するため、一定数の矛盾を許容する設定（例：1ミスまで）を提供。"
                        : "Allow a limited number of conflicts (e.g., tolerance=1) to be robust to user/data errors."
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary={ja ? "依存ルールの扱い" : "Handling dependency rules"}
                    secondary={
                      ja
                        ? "SDDのDependencyRules概念に準拠して、親条件を満たさない形質は非表示/ロック等でガイド。マルチアクセス性を損なわないよう過度な強制は避けます。"
                        : "Follow SDD ‘DependencyRules’: hide/lock characters until parent conditions apply, while preserving multi-access flexibility."
                    }
                  />
                </ListItem>
              </List>
              <Stack direction="row" spacing={1}>
                <Chip size="small" label="Bayes" />
                <Chip size="small" label="Info Gain" />
                <Chip size="small" label="Error Tolerance" />
                <Chip size="small" label="SDD DependencyRules" />
                <Chip size="small" label="Explainability" />
              </Stack>
            </CardContent>
          </Card>

          {/* Field / UX */}
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <TipsAndUpdatesIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  {ja ? "フィールドでの使いこなし" : "Field-use Tips"}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                {ja
                  ? "誤解されやすい形質にはヘルプ（用語集・写真・短い手順動画）を添え、夜間/オフラインでも動作するPWAモードを活用してください。"
                  : "Provide concise help (glossary, photos, short how-to clips) for error-prone characters, and leverage PWA mode for night/offline work."}
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Right column: Citation, Bugs, Formats, Refs */}
        <Box sx={{ flex: 1 }}>
          <Stack spacing={2}>
            {/* How to cite */}
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <InfoIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    {ja ? "引用方法" : "How to Cite"}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
                  <strong>Shimizu S. 2025.</strong>{" "}
                  {ja
                    ? "ClavisID: 分類学的同定のための知的・インタラクティブ・マルチアクセスキー。"
                    : "ClavisID: An Intelligent, Interactive Multi-Access Key for Taxonomic Identification."}
                  <Link
                    href="https://github.com/soshimizu/identification-key"
                    target="_blank"
                    display="block"
                  >
                    github.com/soshimizu/identification-key
                  </Link>
                </Typography>
              </CardContent>
            </Card>

            {/* Supported formats / policy note */}
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <PolicyIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    {ja ? "対応フォーマットとポリシー" : "Supported Formats & Policy"}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {ja
                    ? "現在の安定入力形式：Excel (.xlsx)。相互運用（SDD/Clavis/DELTA 等）はビルドや将来バージョンで提供される場合があります。"
                    : "Stable input format: Excel (.xlsx). Interop with SDD/Clavis/DELTA may be available depending on build or future versions."}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {ja
                    ? "相互運用の設計は、公開仕様（TDWG SDD・Clavis・DELTA）に準拠する方針です。"
                    : "Interop is designed to follow public specs (TDWG SDD, Clavis, DELTA)."}
                </Typography>
              </CardContent>
            </Card>

            {/* Bugs */}
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <BugReportIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    {ja ? "バグ報告" : "Bug Reports"}
                  </Typography>
                </Box>
                <Typography variant="body2">
                  {ja
                    ? "不具合やご要望は GitHub Issues へお願いします。"
                    : "Please submit issues and feature requests on GitHub."}
                  <Link
                    href="https://github.com/soshimizu/identification-key/issues"
                    target="_blank"
                    display="block"
                  >
                    GitHub Issues
                  </Link>
                </Typography>
              </CardContent>
            </Card>

            {/* References */}
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <ArticleIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    {ja ? "参考文献・外部資料" : "References & Further Reading"}
                  </Typography>
                </Box>
                <List dense>
                  {refs.map((r) => (
                    <ListItem key={r.url} sx={{ alignItems: "flex-start" }}>
                      <ListItemText
                        primary={
                          <Link href={r.url} target="_blank" rel="noreferrer">
                            {r.title}
                          </Link>
                        }
                        secondary={
                          <span className="ref-note">
                            {ja ? r.noteJa : r.noteEn}
                          </span>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
                <Typography variant="caption" color="text.secondary">
                  {ja
                    ? "※ 公開仕様・原則・実装事例などの一次/準一次情報源のみを掲示しています。"
                    : "※ Links target primary / near-primary sources (standards, principles, implementations)."}
                </Typography>
              </CardContent>
            </Card>
          </Stack>
        </Box>
      </Stack>

      {/* Footer note */}
      <Divider sx={{ my: 2 }} />
      <Typography variant="caption" color="text.secondary">
        {ja
          ? "このヘルプは公開情報とアプリの仕様に基づいています。機能の有無や名称はビルド構成により異なる場合があります。"
          : "This help reflects public sources and app behaviour; feature names/availability may vary by build configuration."}
      </Typography>
    </Box>
  );
}
