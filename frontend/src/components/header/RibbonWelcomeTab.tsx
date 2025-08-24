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
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import BugReportIcon from "@mui/icons-material/BugReport";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import PolicyIcon from "@mui/icons-material/Policy";
import GitHubIcon from '@mui/icons-material/GitHub';

type Props = {
  lang: "ja" | "en";
};

export default function RibbonWelcomeTab({ lang }: Props) {
  const ja = lang === "ja";

  const matrixStructureTable = `
    <table class="manual-table">
      <thead>
        <tr>
          <th>${ja ? "シート名" : "Sheet Name"}</th>
          <th>${ja ? "役割" : "Role"}</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>MatrixInfo</code></td>
          <td>${ja ? "マトリクス全体のメタデータ（タイトル、作者、引用情報など）を定義します。" : "Defines metadata for the entire matrix (title, authors, citation, etc.)."}</td>
        </tr>
        <tr>
          <td><code>TaxaInfo</code></td>
          <td>${ja ? "マトリクスに含まれる分類群（Taxon）のリストと、その詳細情報（学名、和名、解説など）を定義します。" : "Defines the list of taxa included in the matrix and their detailed information (scientific name, vernacular name, description, etc.)."}</td>
        </tr>
        <tr>
          <td><code>Traits</code></td>
          <td>${ja ? "同定に使用する形質（Character）と、各分類群の形質状態（State）を定義する本体部分です。" : "The main sheet defining the characters used for identification and the state of each character for each taxon."}</td>
        </tr>
      </tbody>
    </table>`;
  
  const traitsHeaderTable = `
  <table class="manual-table">
    <thead>
      <tr>
        <th>${ja ? "ヘッダー" : "Header"}</th>
        <th>${ja ? "必須" : "Required"}</th>
        <th>${ja ? "説明と入力規則" : "Description & Input Rules"}</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>#TraitID</code></td>
        <td>${ja ? "任意" : "Optional"}</td>
        <td>${ja ? "形質の一意なID。省略すると#Trait_enから自動生成されます。依存関係機能で親形質を指定する際にこのIDを使用します。" : "A unique ID for the character. If omitted, it's auto-generated from #Trait_en. This ID is used to specify parent characters in dependencies."}</td>
      </tr>
      <tr>
        <td><code>#Dependency</code></td>
        <td>${ja ? "任意" : "Optional"}</td>
        <td>${ja ? "形質の依存関係を <code>親のTraitID=状態名</code> の形式で定義します。この形質は、親形質が指定された状態の時のみUIに表示されます。" : "Defines character dependencies in the format <code>parent_trait_id=state_name</code>. The character will only be shown in the UI if the parent character is in the specified state."}</td>
      </tr>
      <tr>
        <td><code>#Group_en / #Group_jp</code></td>
        <td>${ja ? "必須" : "Required"}</td>
        <td>${ja ? "形質をグループ化するための名称です (例: 頭部, 翅)。UI上でカテゴリ分けされます。" : "The name for grouping characters (e.g., Head, Wings). Used for categorization in the UI."}</td>
      </tr>
      <tr>
        <td><code>#Trait_en / #Trait_ja</code></td>
        <td>${ja ? "必須" : "Required"}</td>
        <td>${ja ? "形質の名称。UIに表示される項目名です。" : "The name of the character, which is displayed in the UI."}</td>
      </tr>
      <tr>
        <td><code>#Type</code></td>
        <td>${ja ? "必須" : "Required"}</td>
        <td>${ja ? "形質の型を定義します。詳細は下のTipsで解説します。" : "Defines the type of character. See Tips below for details."}</td>
      </tr>
      <tr>
        <td><code>#HelpText_en / #HelpText_ja</code></td>
        <td>${ja ? "任意" : "Optional"}</td>
        <td>${ja ? "形質の定義や観察方法に関する補助テキスト。UIのヘルプパネルに表示されます。" : "Supplementary text about the character's definition or observation method, displayed in the help panel."}</td>
      </tr>
      <tr>
        <td><code>#HelpImages</code></td>
        <td>${ja ? "任意" : "Optional"}</td>
        <td>${ja ? "補助画像のファイル名 (カンマ区切り)。<code>help_materials</code> フォルダに配置します。" : "Comma-separated image filenames, located in the <code>help_materials</code> folder."}</td>
      </tr>
      <tr>
        <td><code>#Difficulty</code></td>
        <td>${ja ? "任意" : "Optional"}</td>
        <td>${ja ? "観察の難易度。推薦スコアに影響します。<br><b>入力値:</b> <code>Easy</code>, <code>Normal</code>, <code>Hard</code>, <code>Very Hard</code> または正の数値。" : "Difficulty of observation. Affects the recommendation score.<br><b>Accepted values:</b> <code>Easy</code>, <code>Normal</code>, <code>Hard</code>, <code>Very Hard</code>, or a positive number."}</td>
      </tr>
      <tr>
        <td><code>#Risk</code></td>
        <td>${ja ? "任意" : "Optional"}</td>
        <td>${ja ? "誤判定のリスク。推薦スコアに影響します。<br><b>入力値:</b> <code>Lowest</code>, <code>Low</code>, <code>Medium</code>, <code>High</code>, <code>Highest</code> または0から1の間の数値。" : "Risk of misinterpretation. Affects the recommendation score.<br><b>Accepted values:</b> <code>Lowest</code>, <code>Low</code>, <code>Medium</code>, <code>High</code>, <code>Highest</code>, or a number between 0 and 1."}</td>
      </tr>
    </tbody>
  </table>`;


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
      }}
    >
      {/* Title & Introduction */}
      <Typography variant="h4" gutterBottom sx={{ fontWeight: "bold" }}>
        {ja ? "MyKeyLogueへようこそ！" : "Welcome to MyKeyLogue!"}
      </Typography>
      <Typography variant="h6" component="p" gutterBottom>
        {ja
          ? "分類学的同定におけるインタラクティブなマルチアクセスキーのためのソフトウェアプラットフォーム"
          : "A Software Platform for Interactive Multi-Access Keys in Taxonomic Identification"}
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        {ja
          ? "MyKeyLogueは、形質行列（マトリクス）駆動型のインタラクティブ・マルチアクセス検索表プラットフォームです。形態に限らず、生態・行動・分布など様々なデータを同定形質として利用できます。伝統的な二分岐検索表とは異なり、観察可能な形質を順不同で入力することで、候補を動的に絞り込みます。形質の解釈ミスやデータ欠損に対するエラー許容度を設定でき、統計的処理に基づき同定の確からしさを評価することで、より正確な同定を支援します。本ソフトウェアはオープンソースとして公開されており、専門家から一般の方まで、幅広いユーザーの需要に対応します。"
          : "MyKeyLogue is a trait matrix-driven platform for interactive, multi-access keys. It goes beyond morphology, allowing ecological, behavioral, and distributional data to be used as identifying characters. Unlike traditional dichotomous keys, you can input observable characters in any order to dynamically filter candidates. It features adjustable error tolerance for interpretation mistakes or missing data, assisting accurate identification through statistical evaluation. As a fully open-source GUI application, it caters to a wide range of users, from experts seeking a professional tool to enthusiasts using it like a digital field guide."}
      </Typography>

      <Stack direction={{ xs: "column", lg: "row" }} spacing={2} alignItems="flex-start">
        {/* Left Column */}
        <Box sx={{ flex: 2, width: '100%' }}>
          {/* Quick Start */}
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
                  <ListItemIcon sx={{minWidth: 32}}>1.</ListItemIcon>
                  <ListItemText
                    primary={ja ? "データセットの用意" : "Prepare Your Dataset"}
                    secondary={
                      ja
                        ? "初回起動時、アプリと同じ階層に「keys」(マトリクス)、「help_materials」(補助画像)、「my_identification_reports」(レポート出力先) フォルダが自動生成されます。「keys」内のサンプルExcelファイルを参考に、あなただけの検索表を作成・共有できます。"
                        : "On first launch, folders for `keys` (matrices), `help_materials` (images), and `my_identification_reports` (report output) are created next to the app. Use the sample Excel files in the `keys` folder as a template to create and share your own identification keys."
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon sx={{minWidth: 32}}>2.</ListItemIcon>
                  <ListItemText
                    primary={ja ? "検索手順" : "Identification Workflow"}
                    secondary={
                      ja
                        ? "観察可能な形質を順不同で選択すると、候補が動的に更新されます。推薦スコア (統計的有効度・難易度・リスクを考慮) を参考に、効率的に同定を進められます。形質の行をクリックすれば、解説や補助画像も確認できます。"
                        : "Select observable characters in any order to dynamically update the candidate list. A recommendation score (considering statistical utility, difficulty, and risk) helps you proceed efficiently. Click on any trait row to view its help text and images."
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon sx={{minWidth: 32}}>3.</ListItemIcon>
                  <ListItemText
                    primary={ja ? "結果の解釈" : "Interpreting Results"}
                    secondary={
                      ja
                        ? "候補タクサ名をクリックすると詳細情報を、'Why?'ボタンで形質ごとの一致・矛盾を確認できます。複数候補をチェックして比較機能を使えば、識別点の確認に役立ちます。※確率スコアはマトリクス内での相対評価です。リスト外の種である可能性も常に考慮してください。"
                        : "Click a candidate taxon name for details, or the 'Why?' button to see matching and conflicting characters. Check multiple candidates and use the 'Compare' function to highlight diagnostic differences. *Note: Probability scores are relative within the current matrix; always consider that your specimen might not be in this key.*"
                    }
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
          
          {/* Matrix Creation Guide */}
          <Card variant="outlined" sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                <PolicyIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">
                  {ja ? "マトリクス作成ガイド" : "Matrix Creation Guide"}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                {ja
                  ? "受け入れ可能なファイルフォーマットはExcel (.xlsx) です。データは3つのシートに分けて管理します。"
                  : "The accepted file format is Excel (.xlsx). Data is organized into three separate sheets for clarity."}
              </Typography>
              <Box dangerouslySetInnerHTML={{ __html: matrixStructureTable }} sx={{ my: 2 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{ja ? "`Traits`シートのヘッダー" : "`Traits` Sheet Headers"}</Typography>
              <Box dangerouslySetInnerHTML={{ __html: traitsHeaderTable }} sx={{ my: 2 }} />

              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{ja ? "優れた検索を実現するコツ" : "Tips for a Better Key"}</Typography>
              <List dense>
                 <ListItem>
                  <ListItemText
                    primary={ja ? "形質タイプの使い分け" : "Choosing the Right Trait Type"}
                    secondary={
                      ja
                        ? "「有無」「はい/いいえ」で表現できる形質は `binary` を使います (例: `1`, `y`, `present` は「Yes」、`-1`, `n`, `absent`は「No」と解釈されます)。複数の独立した状態を持つ形質は `nominal_parent` を (例: 体色)、数値は `continuous` を、複数の状態を同時に持ちうる場合は `categorical_multi` (例: 分布域) を使用します。"
                        : "Use `binary` for presence/absence traits (e.g., `1`, `y`, `present` are interpreted as 'Yes'; `-1`, `n`, `absent` as 'No'). Use `nominal_parent` for traits with multiple exclusive states (e.g., color), `continuous` for numerical values, and `categorical_multi` for traits where multiple states can be true simultaneously (e.g., distribution)."
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary={ja ? "主観的な形質を避ける" : "Avoid Subjective Traits"}
                    secondary={
                      ja
                        ? "「弱く点刻」のような段階表現は専門家以外には伝わりにくいため、「点刻の有無」(`binary`) のように客観的な記述にし、詳細はヘルプテキストで補足するのが有効です。"
                        : "Avoid subjective scaling like 'weakly punctate,' which can be ambiguous. Use objective states (e.g., a `binary` 'Punctate' trait) and provide details in the help text."
                    }
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>

        </Box>

        {/* Right Column */}
        <Box sx={{ flex: 1, width: '100%' }}>
          <Stack spacing={2}>
            {/* How to cite */}
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <InfoIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    {ja ? "引用" : "Citation"}
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
                  <strong>{ja ? "本ソフトウェアの引用:" : "To cite this software:"}</strong><br/>
                  Shimizu S. (2025) MyKeyLogue: A Software Platform for Interactive Multi-Access Keys in Taxonomic Identification. https://github.com/soshimizu/identification-key
                </Typography>
                <Divider sx={{ my: 1.5 }} />
                <Typography variant="caption" color="text.secondary">
                  {ja ? "本ソフトウェアで作成された、あるいは利用したマトリクスを研究等で利用する場合は、ソフトウェアの引用に加えて、各マトリクスの作成者が指定する引用情報に従ってください。本ソフトウェアのソースコードを二次利用する場合も、上記ソフトウェアの引用をお願いします。" : "When using a matrix created with or used in this software for research, please cite both the software (as above) and the matrix itself according to the matrix author's specifications. If you reuse the source code, please also cite the software."}
                </Typography>
              </CardContent>
            </Card>

            {/* Full Manual */}
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <GitHubIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    {ja ? "フルマニュアル・ソースコード" : "Full Manual & Source Code"}
                  </Typography>
                </Box>
                <Typography variant="body2">
                  {ja ? "より詳細なマニュアルと完全なソースコードは、以下のGitHubリポジトリで公開しています。" : "The complete manual and source code are available on the GitHub repository."}
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

            {/* Bugs */}
            <Card variant="outlined">
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                  <BugReportIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">
                    {ja ? "バグ報告・ご要望" : "Bug Reports & Feedback"}
                  </Typography>
                </Box>
                <Typography variant="body2">
                  {ja
                    ? "不具合や機能改善の提案は GitHub Issues へお願いします。"
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

          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}