# MyKeyLogue

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**EN:** A cross-platform desktop application for interactive multi-access taxonomic keys powered by statistical algorithms.  
**JP:** 統計アルゴリズムを用いた**対話型マルチアクセス検索表**のためのクロスプラットフォーム・デスクトップアプリです。

<img alt="MyKeyLogue UI" src="readme_images/sample.png" width="720">

---

## Overview / 概要

**EN:** MyKeyLogue generates and runs **multi-access keys** directly from an **Excel-based trait matrix**, enabling you to input observable characters in any order and dynamically filter candidates. Bayesian-style scoring helps under uncertainty by highlighting the most plausible taxa.  
**JP:** **Excel の形質マトリクス**から**マルチアクセスキー**を自動生成・実行します。観察可能な形質を**順不同**で入力して候補を動的に絞り込み、**ベイズ的な確率評価**により不確実性下でも最も有力な候補を提示します。

---

## Key Features / 主要機能

- **Cross-platform**  
  **EN:** Runs on Windows / macOS / Linux.  
  **JP:** Windows / macOS / Linux で動作。

- **Matrix-first workflow**  
  **EN:** Author and edit keys in familiar Excel; the app reads matrices directly.  
  **JP:** なじみのある **Excel** で検索表を作成・編集し、そのまま読み込み。

- **Statistical identification engine**  
  **EN:** Recomputes candidate probabilities after each trait selection; adjustable tolerance for missing or ambiguous data.  
  **JP:** 形質選択ごとに候補の**確率**を再計算。欠損や曖昧さへの許容度を調整可能。

- **Interactive UI**  
  **EN:** Candidate list, trait list with help text & images, detail panes, selection history, “Why?” explanations, and **Compare** view.  
  **JP:** 候補リスト、形質一覧（ヘルプ/画像）、詳細パネル、選択履歴、**Why?** の根拠表示、**比較**機能。

- **Multilingual UI**  
  **EN:** English and Japanese supported.  
  **JP:** **英語 / 日本語**に対応。

---

## Quick Start / クイックスタート

1. **Prepare your dataset / データセットの用意**  
   **EN:** On first launch, the app creates sibling folders:  
   `keys/` (matrices), `help_materials/` (help images), `my_identification_reports/` (reports). Use sample Excel files in `keys/` as templates.  
   **JP:** 初回起動時に `keys/`（マトリクス）, `help_materials/`（補助画像）, `my_identification_reports/`（レポート）を自動生成。`keys/` 内のサンプル Excel を雛形に編集。

2. **Identify / 検索手順**  
   **EN:** Select observable traits (any order). The candidate list updates live with a **recommendation score** that reflects statistical utility, difficulty, and risk.  
   **JP:** 観察できる形質を**順不同**で選択。統計的有効度・**難易度**・**リスク**を考慮した推奨スコアで効率的に絞り込み。

3. **Interpret results / 結果の解釈**  
   **EN:** Click a candidate taxon for details; use **Why?** to see matches/conflicts; **Compare** multiple taxa to highlight diagnostic differences.  
   **JP:** 候補名から詳細へ。**Why?** で一致/矛盾の根拠を確認し、**比較**で識別点を把握。  
   **Note / 注意:** Scores are **relative to the loaded matrix**; the true specimen might be outside the key.

---

## Data Format (Excel) / データ形式（Excel）

**EN:** Use Excel `.xlsx` with **three sheets**:  
**JP:** Excel（`.xlsx`）で**3 つのシート**に分割して管理します。

| Sheet Name   | Role (EN)                                                           | 役割（JP）                                                 |
| ------------ | ------------------------------------------------------------------- | ---------------------------------------------------------- |
| `MatrixInfo` | Metadata for the entire key (title, authors, citation, etc.)        | マトリクス全体のメタデータ（タイトル、作者、引用情報など） |
| `TaxaInfo`   | List of taxa and details (scientific/vernacular names, description) | 分類群（Taxon）の一覧と詳細情報（学名・和名・解説など）    |
| `Traits`     | Characters used for identification and their states per taxon       | 同定に使用する形質と、各分類群の形質状態                   |

### `Traits` Sheet Headers / `Traits` シートの主なヘッダー

| Header                        | Required | 説明（EN / JP）                                                                                                                                                                                                            |
| ----------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `#TraitID`                    | Optional | **EN:** Unique ID (auto-generated from `#Trait_en` if omitted); used for dependencies. **JP:** 形質の一意 ID。省略時は `#Trait_en` から自動生成。依存関係で参照。                                                          |
| `#Dependency`                 | Optional | **EN:** `parent_trait_id=state_name`; only show when the parent has the specified state. **JP:** `親TraitID=状態名` 形式。条件成立時のみ UI に表示。                                                                       |
| `#Group_en / #Group_ja`       | Required | **EN:** Grouping label (e.g., Head, Wings). **JP:** 形質グループ名（例：頭部、翅）。                                                                                                                                       |
| `#Trait_en / #Trait_ja`       | Required | **EN:** Character name shown in the UI. **JP:** UI に表示される形質名。                                                                                                                                                    |
| `#Type`                       | Required | **EN:** Character type (see below). **JP:** 形質の型（後述）。                                                                                                                                                             |
| `#HelpText_en / #HelpText_ja` | Optional | **EN:** Definition and how-to-observe; displayed in help panel. **JP:** 定義・観察方法などの補助説明（ヘルプに表示）。                                                                                                     |
| `#HelpImages`                 | Optional | **EN:** Comma-separated image filenames in `help_materials/`. **JP:** `help_materials/` に置く画像ファイル名（カンマ区切り）。                                                                                             |
| `#Difficulty`                 | Optional | **EN:** Observation difficulty; affects recommendation. Accepted: `Easy`, `Normal`, `Hard`, `Very Hard`, or a positive number. **JP:** 観察難易度。推奨度に影響。`Easy` / `Normal` / `Hard` / `Very Hard` または正の数値。 |
| `#Risk`                       | Optional | **EN:** Misinterpretation risk; affects recommendation. Accepted: `Lowest`, `Low`, `Medium`, `High`, `Highest`, or a number between 0 and 1. **JP:** 誤判定リスク。推奨度に影響。`Lowest`〜`Highest` または 0〜1 の数値。  |

#### Character Types / 形質タイプの指針

- **EN:**
  - `binary`: presence/absence (e.g., `1`, `y`, `present` = Yes; `-1`, `n`, `absent` = No)
  - `nominal_parent`: multiple **exclusive** states (e.g., body color)
  - `continuous`: numeric values
  - `categorical_multi`: multiple **simultaneous** states (e.g., distribution)
- **JP:**
  - `binary`: **有無/はい・いいえ**（`1`,`y`,`present` = Yes / `-1`,`n`,`absent` = No）
  - `nominal_parent`: 相互排他的な**複数状態**（例：体色）
  - `continuous`: **数値**
  - `categorical_multi`: **複数状態が同時**に成り立つ（例：分布域）

**Best Practices / コツ**  
**EN:** Prefer objective traits (e.g., “Punctate: yes/no”) and move nuance into help text, instead of vague scales like “weakly punctate.”  
**JP:** 「弱く点刻」などの主観的表現は避け、「点刻の有無」のように客観化し、細部はヘルプで補足。

---

## Installation / インストール

**Prereqs / 前提条件**

- Go **1.18+**
- Node.js **16+**
- Wails CLI

```bash
# Install Wails
go install github.com/wailsapp/wails/v2/cmd/wails@latest

# Clone and enter
git clone https://github.com/soshimizu/identification-key.git
cd identification-key

# Install frontend deps
cd frontend && npm install && cd ..

# Build the app
wails build
```

**EN:** Artifacts will be in `build/bin/`.
**JP:** 生成物は `build/bin/` に出力されます。

---

## Usage / 使い方

1. **Launch / 起動**: run the executable in `build/bin/`.
2. **Load matrix / マトリクス選択**: choose a matrix from the top dropdown.
3. **Select traits / 形質選択**: pick any observable traits; candidates update live.
4. **Inspect / 詳細**: click a candidate for details; use **Why?** to view supporting/conflicting traits; **Compare** for side-by-side differences.
5. **Reports / レポート**: outputs are saved under `my_identification_reports/`.

---

## Contributing / 開発・貢献

**EN:** Issues and PRs are welcome. Please discuss large changes in an issue first.
**JP:** 不具合報告・機能要望・PR 歓迎。大きな変更は事前に Issue で議論してください。

- GitHub: [https://github.com/soshimizu/identification-key](https://github.com/soshimizu/identification-key)
- Issues: [https://github.com/soshimizu/identification-key/issues](https://github.com/soshimizu/identification-key/issues)

---

## Citation / 引用

**EN (software):**
Shimizu S. (2025) _MyKeyLogue: A Software Platform for Interactive Multi-Access Keys in Taxonomic Identification._ [https://github.com/soshimizu/identification-key](https://github.com/soshimizu/identification-key)

**JP（ソフトウェア引用）:**
Shimizu S. (2025) _MyKeyLogue: 分類学的同定のためのインタラクティブ・マルチアクセスキー・プラットフォーム._ [https://github.com/soshimizu/identification-key](https://github.com/soshimizu/identification-key)

**Matrices / マトリクスの引用:**
**EN:** When publishing results built with a given matrix, cite the matrix as specified by its author **in addition** to citing this software.
**JP:** 本ソフトで作成・利用したマトリクスを研究等で用いる場合は、**ソフトの引用に加え**、各マトリクス作者が指定する引用情報にも従ってください。

---

## License / ライセンス

**EN:** Released under the **MIT License**. See [`LICENSE`](LICENSE).
**JP:** 本プロジェクトは **MIT ライセンス** です。詳細は [`LICENSE`](LICENSE) を参照。

---

## Author / 著者

So Shimizu, PhD
Web: [https://soshimizu.com/](https://soshimizu.com/) / [https://ichneumonoidea-world.com/](https://ichneumonoidea-world.com/)
Email: [parasitoidwasp.sou@gmail.com](mailto:parasitoidwasp.sou@gmail.com)
