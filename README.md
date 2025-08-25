[English version](#English_version) • [日本語版](#日本語版)

<!--ここにアイコン画像を入れる-->

# MyKeyLogue

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="MIT License"></a>
  <!-- JOSS採択後にDOIバッジを追加 -->
  <!-- <a href="https://doi.org/10.5281/zenodo.XXXXXXX"><img src="https://zenodo.org/badge/DOI/10.5281/zenodo.XXXXXXX.svg" alt="DOI"></a> -->
  <img src="https://img.shields.io/badge/Go-1.22+-00ADD8?logo=go&logoColor=white" alt="Go 1.22+">
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white" alt="TypeScript 5.x">
  <img src="https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=black" alt="React 18">
  <img src="https://img.shields.io/badge/Wails-v2-8A2BE2" alt="Wails v2">
  <img src="https://img.shields.io/badge/platform-Windows%20|%20macOS%20|%20Linux-lightgrey" alt="Windows | macOS | Linux">
</p>

<p align="center">
  <img alt="MyKeyLogue main screen / メイン画面" src="readme_images/sample.png" width="800">
</p>

---

## English_version

### Overview

**MyKeyLogue** is a cross-platform desktop application that generates and runs **interactive multi-access keys** directly from an **Excel-based trait matrix**. It empowers users to input observable characters in any order and dynamically filters candidates. The software's Bayesian inference engine helps navigate uncertainty by highlighting the most plausible taxa based on the evidence provided, making it a powerful tool for taxonomic research, education, and citizen science.

### Key Features

- **Cross-platform**: Natively runs on Windows, macOS, and Linux.
- **Matrix-First Workflow**: Author and manage complex identification keys in the familiar and accessible environment of Microsoft Excel. The application reads the `.xlsx` file directly, streamlining the key creation process.
- **Statistical Identification Engine**: Employs a **Bayesian inference model** to recompute candidate probabilities after each trait selection. The engine's parameters are adjustable, allowing users to fine-tune its tolerance for observational errors and data ambiguity.
- **Rich Interactive UI**: Features a comprehensive interface including a live-updating candidate list, a filterable trait list with integrated help text and images, detailed taxon information panels, a complete selection history, "Why?" justifications for scoring, and a side-by-side **Compare** view to highlight diagnostic differences.
- **Pragmatic Trait Recommendation**: Suggests the most effective next traits to observe, balancing statistical utility (information gain), user-defined observation difficulty, and potential for misinterpretation (risk).
- **Multilingual Support**: The user interface is fully available in both English and Japanese.

---

### Installation

**Prerequisites**

- Go **1.18+**
- Node.js **16+**
- Wails CLI v2

```bash
# 1. Install Wails CLI
go install [github.com/wailsapp/wails/v2/cmd/wails@latest](https://github.com/wailsapp/wails/v2/cmd/wails@latest)

# 2. Clone the repository
git clone [https://github.com/soshimizu/MyKeyLogue.git](https://github.com/soshimizu/MyKeyLogue.git)
cd MyKeyLogue

# 3. Install frontend dependencies
cd frontend && npm install && cd ..

# 4. Build the application
wails build
```

The compiled executable will be located in the `build/bin/` directory.

---

### Quick Start Guide

1.  **Launch the Application**: On the first run, MyKeyLogue will automatically create three directories next to the executable:
    - `keys/`: Place your Excel matrix (`.xlsx`) files here. Sample matrices are included on first launch.
    - `help_materials/`: Store help images referenced in your matrices here.
    - `my_identification_reports/`: Identification reports will be saved here.
2.  **Load a Matrix**: Select an identification key from the dropdown menu at the top of the window. Use the refresh button next to the dropdown to rescan the `keys/` directory for new files.
3.  **Perform Identification**: Select observable traits from the bottom-right panel in any order. The candidate list in the top-right panel will update in real-time. Traits are sorted by a recommendation score to guide you to an efficient identification.
4.  **Interpret Results**:
    - Click a taxon in the candidate list to view its detailed information (description, images, etc.) in the bottom-left panel.
    - Click the **"Why?"** button (question mark icon) next to a candidate to see a breakdown of matching and conflicting traits.
    - Select multiple taxa and use the **"Compare"** button to view their trait states side-by-side, highlighting diagnostic differences.
5.  **Generate a Report**: Once your identification is complete, you can export a detailed report of your session.

---

### Data Format (Excel)

An identification key is defined by an Excel (`.xlsx`) file containing three required sheets: `MatrixInfo`, `TaxaInfo`, and `Traits`.

| Sheet Name   | Role                                                                 |
| :----------- | :------------------------------------------------------------------- |
| `MatrixInfo` | Contains metadata for the key (e.g., title, authors, citation).      |
| `TaxaInfo`   | Defines each taxon and its details (e.g., names, rank, description). |
| `Traits`     | The core matrix defining characters and their states for each taxon. |

For detailed specifications of all headers, please refer to the sample files provided by the application.

---

### Community and Contributing

Bug reports, feature requests, and pull requests are highly welcome. Please open an issue to discuss any substantial changes before implementation.

- **GitHub Repository**: [https://github.com/soshimizu/MyKeyLogue](https://github.com/soshimizu/MyKeyLogue)
- **Issue Tracker**: [https://github.com/soshimizu/MyKeyLogue/issues](https://github.com/soshimizu/MyKeyLogue/issues)

---

### Citation

If you use MyKeyLogue in your research, please cite both the software and the specific identification key (matrix) you used.

**Software:**

> Shimizu, S. (2025). _MyKeyLogue: A cross-platform desktop application for creating and using interactive multi-access taxonomic keys using statistical algorithms_. Journal of Open Source Software, X(Y), ZZZZ. https://doi.org/10.21105/joss.ZZZZZ _(Note: JOSS DOI will be assigned upon acceptance)_

**Data:**

> Please also cite the matrix authors as specified in the `MatrixInfo` sheet of the key you are using.

---

### Author and License

Developed by **So Shimizu, PhD** (NARO).

This project is released under the **MIT License**. See the [`LICENSE`](LICENSE) file for details.

---

---

## 日本語版

### ソフトウェアの必要性 (JOSS 向け)

マクロ生物学を中心とした多くの生物学的研究において、対象分類群の正確な同定は、研究の信頼性を左右する根源的かつ最も重要なプロセスです。このプロセスを支えるのが「検索表」ですが、従来主流であった二分岐検索表には構造的な課題がありました。すなわち、形質の欠損や観察の難しさ、解釈の誤りなどにより、一度でも分岐を誤ると正しい同定結果に到達できないという脆弱性を抱えており、その利用には熟練した分類学的技能が求められてきました。

こうした課題を解決する柔軟な手段として、近年、マトリクスベースの多分岐検索表（multi-access key）が注目されています。多分岐検索表は、観察可能な形質を任意の順序で入力でき、観察不能な形質をスキップできるなど、二分岐検索表を大きく超える利点を有します。

しかし、その優れた有用性にもかかわらず、普及は限定的でした。既存のツールの多くは、操作が難解であったり、内部アルゴリズムがブラックボックスであったり、あるいはプログラミング知識を要求するなど、専門家から初心者まで幅広い層が簡便に利用できる状況にはありませんでした。

MyKeyLogue は、このギャップを埋めるために開発された、オープンソースかつクロスプラットフォーム対応のデスクトップアプリケーションです。研究者、博物館、環境調査機関、そして市民科学者に至るまで、幅広いユーザーが使い慣れた Excel 形式で簡単に対話的な検索表を作成・共有・利用できる統合的ソリューションを提供します。さらに、ベイジアン推論エンジンを組み込むことで、同定結果の確からしさを統計的に評価し、科学的に裏付けられた同定を可能にします。MyKeyLogue は、堅牢な同定プロセスを、よりアクセスしやすく、柔軟な形で幅広い科学コミュニティに提供します。

### 概要

**MyKeyLogue**は、**Excel ベースの形質マトリクス**から直接、**対話的な多分岐検索キー**を生成・実行するクロスプラットフォーム対応のデスクトップアプリケーションです。ユーザーは観察可能な形質を任意の順序で入力し、候補を動的に絞り込むことができます。本ソフトウェアのベイジアン推定エンジンは、提供された証拠に基づいて最も確からしい分類群を提示することで不確実な状況下での意思決定を助け、分類学的研究、教育、市民科学のための強力なツールとなります。

### 主要機能

- **クロスプラットフォーム**: Windows, macOS, Linux でネイティブに動作します。
- **マトリクス中心のワークフロー**: 使い慣れた Microsoft Excel の環境で、複雑な同定キーを作成・管理します。`.xlsx`ファイルを直接読み込むため、キーの作成プロセスが効率化されます。
- **統計的同定エンジン**: **ベイジアン推定モデル**を採用し、形質が選択されるたびに候補の確率を再計算します。エンジンのパラメータは調整可能で、観察エラーやデータの曖昧さに対する許容度をユーザーが微調整できます。
- **豊富な対話型 UI**: リアルタイムに更新される候補リスト、ヘルプテキストや画像が統合されたフィルタ可能な形質リスト、詳細な分類群情報パネル、完全な選択履歴、スコアリングの根拠を示す「Why?」機能、そして識別点を強調表示するサイドバイサイドの**比較**ビューなど、包括的なインターフェースを備えています。
- **実用的な形質推薦**: 次に観察すべき最も効果的な形質を提案します。この推薦は、統計的有用性（情報利得）、ユーザーが定義した観察の難易度、および誤判定のリスクをバランス良く考慮します。
- **多言語サポート**: ユーザーインターフェースは日本語と英語に完全対応しています。

---

### インストール方法

**前提条件**

- Go **1.18+**
- Node.js **16+**
- Wails CLI v2

```bash
# 1. Wails CLIをインストール
go install [github.com/wailsapp/wails/v2/cmd/wails@latest](https://github.com/wailsapp/wails/v2/cmd/wails@latest)

# 2. リポジトリをクローン
git clone [https://github.com/soshimizu/MyKeyLogue.git](https://github.com/soshimizu/MyKeyLogue.git)
cd MyKeyLogue

# 3. フロントエンドの依存関係をインストール
cd frontend && npm install && cd ..

# 4. アプリケーションをビルド
wails build
```

コンパイルされた実行ファイルは`build/bin/`ディレクトリに生成されます。

---

### クイックスタートガイド

1.  **アプリケーションの起動**: 初回起動時、MyKeyLogue は実行ファイルの隣に 3 つのディレクトリを自動で作成します。
    - `keys/`: Excel マトリクス（`.xlsx`）ファイルをここに配置します。初回起動時にはサンプルマトリクスが含まれています。
    - `help_materials/`: マトリクスで参照される補助画像をここに保存します。
    - `my_identification_reports/`: 同定レポートがここに保存されます。
2.  **マトリクスの読み込み**: ウィンドウ上部のドロップダウンメニューから同定キーを選択します。ドロップダウンの隣にある更新ボタンで`keys/`ディレクトリを再スキャンし、新しいファイルを認識させることができます。
3.  **同定の実行**: 右下のパネルから観察可能な形質を任意の順序で選択します。右上の候補リストはリアルタイムで更新されます。形質は、同定を効率化するための推薦スコア順に並んでいます。
4.  **結果の解釈**:
    - 候補リストの分類群をクリックすると、左下のパネルにその詳細情報（解説、画像など）が表示されます。
    - 候補の隣にある**「Why?」**ボタン（疑問符アイコン）をクリックすると、一致する形質と矛盾する形質の詳細が表示されます。
    - 複数の分類群を選択して**「比較」**ボタンを使用すると、それらの形質状態を並べて表示し、識別点を明確にできます。
5.  **レポートの生成**: 同定が完了したら、セッションの詳細なレポートを出力できます。

---

### データ形式 (Excel)

同定キーは、`MatrixInfo`, `TaxaInfo`, `Traits`という 3 つの必須シートを含む単一の Excel (`.xlsx`) ファイルによって定義されます。

| シート名     | 役割                                                             |
| :----------- | :--------------------------------------------------------------- |
| `MatrixInfo` | キー全体のメタデータ（タイトル、著者、引用情報など）を含みます。 |
| `TaxaInfo`   | 各分類群とその詳細（学名、和名、階級、解説など）を定義します。   |
| `Traits`     | 各分類群の形質と形質状態を定義する中心的なマトリクスです。       |

全てのヘッダーに関する詳細な仕様については、アプリケーションが提供するサンプルファイルを参照してください。

---

### コミュニティと貢献

バグ報告、機能要望、プルリクエストを歓迎します。大きな変更を加える場合は、実装前に Issue で議論を開始してください。

- **GitHub リポジトリ**: [https://github.com/soshimizu/MyKeyLogue](https://github.com/soshimizu/MyKeyLogue)
- **課題トラッカー**: [https://github.com/soshimizu/MyKeyLogue/issues](https://github.com/soshimizu/MyKeyLogue/issues)

---

### 引用について

研究で MyKeyLogue を使用する場合は、ソフトウェア本体と、使用した特定の同定キー（マトリクス）の両方を引用してください。

**ソフトウェア:**

> Shimizu, S. (2025). _MyKeyLogue: A cross-platform desktop application for creating and using interactive multi-access taxonomic keys using statistical algorithms_. Journal of Open Source Software, X(Y), ZZZZ. https://doi.org/10.21105/joss.ZZZZZ (注: JOSS に採択され次第、DOI が付与されます)

**データ:**

> 使用したキーの`MatrixInfo`シートに記載されている、マトリクス著者の指定に従って引用してください。

---

### 著者とライセンス

開発者: **清水 壮, 博士（農学）** (農研機構)

本プロジェクトは**MIT ライセンス**の下で公開されています。詳細は[`LICENSE`](LICENSE)ファイルをご覧ください。
