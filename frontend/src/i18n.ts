// frontend/src/i18n.ts

const jaManual = `
# MorphoKey マニュアル

## 形質マトリクスの作り方

MorphoKeyは、特定のフォーマットに準拠したExcelファイル（.xlsx）を読み込みます。

### ### ヘッダー行の規約

最初の行はヘッダーです。以下の2種類の列を定義します。

1.  **管理列**: 先頭に '#' をつけます。これらの列はアプリの動作を制御します。
    - \`#Group\`: 形質をまとめるグループ名（例: Head, Thorax）。
    - \`#Trait\`: 形質の名前。
    - \`#Type\`: 形質の種類（binary, nominal, ordinal, continuous）。
    - \`#Difficulty\`: 形質の観察難易度。
    - \`#Risk\`: 形質の誤判定リスク。
    - \`#Parent\`: 派生形質（derived）の親となる形質名を指定します。

2.  **タクサ列**: '#' をつけずに、分類群（タクサ）の名前を記述します。

### ### 形質状態の入力ルール (タクサ列)

各タクサの形質状態は、以下のルールに基づいて解釈されます。

-   **Yes (肯定)**: \`1\`, \`y\`, \`yes\`, \`true\`, \`present\`, \`はい\`, \`有り\` などのキーワード。
-   **No (否定)**: \`-1\`, \`n\`, \`no\`, \`false\`, \`absent\`, \`いいえ\`, \`無し\` などのキーワード。
-   **NA (不明/無効)**: \`0\`, \`na\`, \`unknown\`, \`不明\`、または**空欄（ブランク）**。セルが空の場合は「データなし」として扱われます。
-   **多状態形質**: \`nominal\`や\`ordinal\`の場合、状態名（例: 'orange', 'small'）を直接記述します。

### ### Difficulty (観察難易度) と Risk (誤判定リスク)

推薦アルゴリズムの精度向上のため、これらの値を単語で指定できます。**空欄の場合は標準値が適用されるため、特徴的な形質のみ入力すれば問題ありません。**

-   **Difficulty**: \`Easy\`, \`Normal\`, \`Hard\`, \`Very Hard\` で指定します。**空欄の場合は \`Normal\` として扱われます。**
-   **Risk**: \`Lowest\`, \`Low\`, \`Medium\`, \`High\`, \`Highest\` で指定します。**空欄の場合は \`Medium\` として扱われます。**
-   数値での直接指定も可能です。

### ### 形質の種類 (#Type)

-   **binary**: Yes/No/NA で記述する基本的な形質。
-   **nominal**: 順序のない多状態形質（例: 体色）。
-   **ordinal**: 順序のある多状態形質（例: サイズ）。
-   **continuous**: 連続的な数値データ。アプリが自動でビン分割します。

## アプリケーションの使い方

### ### アルゴリズムタブ

-   **矛盾ペナルティ**: 選択した形質とデータの矛盾に対する厳しさを調整します。1に近いほど厳格（Strict）になります。
-   **実用性スコア**: ONにすると、情報利得に加え、観察難易度(Difficulty)と誤判定リスク(Risk)を考慮して「次に測るべき形質」を推薦します。
-   **α (偽陽性)**: 「本当はNoなのにYesと観察してしまう」エラー率。
-   **β (偽陰性)**: 「本当はYesなのにNoと観察してしまう」エラー率。
-   **κ (平滑化)**: スコアの過信を防ぎ、候補を均すためのパラメータ。

`;

const enManual = `
# MorphoKey Manual

## How to Create a Trait Matrix

MorphoKey reads Excel files (.xlsx) that follow a specific format.

### ### Header Row Convention

The first row is the header. It defines two types of columns:

1.  **Control Columns**: Start with a '#' symbol. They control the app's behavior.
    - \`#Group\`: The group name for traits (e.g., Head, Thorax).
    - \`#Trait\`: The name of the trait.
    - \`#Type\`: The type of the trait (binary, nominal, ordinal, continuous).
    - \`#Difficulty\`: The observation difficulty of the trait.
    - \`#Risk\`: The risk of misidentifying the trait.
    - \`#Parent\`: Specifies the parent trait for derived traits.

2.  **Taxon Columns**: Do not have a '#' prefix and contain the names of the taxa.

### ### Trait State Input Rules (Taxon Columns)

The trait state for each taxon is interpreted based on the following rules:

-   **Yes**: Keywords like \`1\`, \`y\`, \`yes\`, \`true\`, \`present\`.
-   **No**: Keywords like \`-1\`, \`n\`, \`no\`, \`false\`, \`absent\`.
-   **NA (Not Applicable/Unknown)**: Keywords like \`0\`, \`na\`, \`unknown\`, or a **blank cell**. An empty cell is treated as "no data".
-   **Multi-state Traits**: For \`nominal\` or \`ordinal\` types, write the state name directly (e.g., 'orange', 'small').

### ### Difficulty and Risk

You can specify these values using intuitive words to improve trait suggestions. **You only need to fill these for non-standard traits, as blank cells will default to standard values.**

-   **Difficulty**: Use \`Easy\`, \`Normal\`, \`Hard\`, \`Very Hard\`. **A blank cell is treated as \`Normal\`.**
-   **Risk**: Use \`Lowest\`, \`Low\`, \`Medium\`, \`High\`, \`Highest\`. **A blank cell is treated as \`Medium\`.**
-   Direct numeric input is also supported.

### ### Trait Types (#Type)

-   **binary**: A basic trait described with Yes/No/NA.
-   **nominal**: A multi-state trait without a specific order (e.g., body color).
-   **ordinal**: A multi-state trait with a specific order (e.g., size).
-   **continuous**: Continuous numerical data. The app will automatically create binned traits.

## How to Use the Application

### ### Algorithm Tab

-   **Conflict Penalty**: Adjusts the penalty for contradictions. A value closer to 1 makes it stricter.
-   **Use Pragmatic Score**: When ON, trait suggestions will consider Difficulty and Risk in addition to information gain.
-   **α (False Positive)**: The error rate of observing 'Yes' when the truth is 'No'.
-   **β (False Negative)**: The error rate of observing 'No' when the truth is 'Yes'.
-   **κ (Smoothing)**: A parameter to prevent overconfidence in scores and to even out the candidates.

`;


export const STR = {
  ja: {
    appTitle: "MorphoKey",
    panels: {
      candidates: "候補タクサ",
      traits_unselected: "未選択の形質",
      traits_selected: "選択済みの形質",
      history: "選択履歴",
    },
    ribbon: {
      overview: "概要",
      algorithm: "アルゴリズム",
      viewSettings: "表示設定",
      manual: "マニュアル",
      help: "ヘルプ",
      switchTheme: "テーマ切替",
      matrix: "マトリクス",
      selectedCount: "選択数",
      switchMatrix: "マトリクス切替",
      refreshList: "一覧を再取得",
      description: "「アルゴリズム」タブから評価方法やパラメータを調整できます。設定はマトリクスごとに自動保存されます。",
      diagnosticPanel: "診断パネル",
    },
    candidatesPanel: {
      header_rank: "#",
      header_name: "Name",
      header_post: "Post",
      header_delta: "Δ",
      header_conflicts: "Conflicts",
      header_match_support: "Match/Support",
      tooltip_post: "事後確率：現在の観測と整合する度合い。高いほど有力な候補です。",
      tooltip_delta: "1位との差：小さいほど競っている状態を示します。",
      tooltip_conflicts: "矛盾数：選択した形質とタクソンのデータが明確に矛盾する数。",
    },
    traitsPanel: {
      sort_recommend: "推奨順",
      sort_group: "グループ別",
      sort_name: "名前順",
      state_yes: "Yes",
      state_no: "No",
      state_clear: "Clear",
    },
    algoTab: {
        algorithm: "アルゴリズム",
        mode: "モード",
        mode_strict: "Strict (矛盾を厳格に扱う)",
        mode_lenient: "Lenient (寛容)",
        auto_apply: "自動適用",
        manual_apply: "手動適用",
        reset_defaults: "既定に戻す",
        param_alpha: "α (偽陽性)",
        param_beta: "β (偽陰性)",
        param_gamma: "γ (NAペナルティ)",
        param_kappa: "κ (平滑化)",
        param_epsilon: "ε (丸め閾値)",
        param_hard_contradiction: "ハード矛盾除外",
        tooltip_alpha: "truth=No を Yes と観測する誤り率。0〜0.2 推奨。",
        tooltip_beta: "truth=Yes を No と観測する誤り率。0〜0.2 推奨。",
        tooltip_gamma: "truth=NA で Yes/No を観測した場合の軽い減点。0.8〜1.0。",
        tooltip_kappa: "事後分布の均し。過信抑制に有効。0〜5。",
        tooltip_epsilon: "極小確率を 0 に丸める数値安定化。1e-12〜1e-3。",
        tooltip_hard_contradiction: "strict時、明確な矛盾を即時除外します。",
    },
    manualTab: {
      title: "マニュアル",
      content: jaManual,
    },
    help: {
        title: "MorphoKey ヘルプ",
        tabs: {
          overview: "概要",
          bayes: "ベイズ（階層）",
          heuristic: "ヒューリスティック",
          interpret: "スコアの解釈",
          tips: "同定のコツ",
        },
        overview: "MorphoKey は、形質マトリクスに基づくインタラクティブ検索表です...",
        bayes: "ベイズモデルは...",
        heuristic: "ヒューリスティックモデルは...",
        interpret: "スコアの解釈は...",
        tips: "同定のコツは...",
    }
  },
  en: {
    appTitle: "MorphoKey",
    panels: {
      candidates: "Candidates",
      traits_unselected: "Unselected Traits",
      traits_selected: "Selected Traits",
      history: "History",
    },
    ribbon: {
      overview: "Overview",
      algorithm: "Algorithm",
      viewSettings: "View Settings",
      manual: "Manual",
      help: "Help",
      switchTheme: "Switch Theme",
      matrix: "Matrix",
      selectedCount: "Selected",
      switchMatrix: "Switch Matrix",
      refreshList: "Refresh List",
      description: "You can adjust evaluation methods and parameters from the 'Algorithm' tab. Settings are saved automatically for each matrix.",
      diagnosticPanel: "Diagnostic Panel",
    },
    candidatesPanel: {
        header_rank: "#",
        header_name: "Name",
        header_post: "Post",
        header_delta: "Δ",
        header_conflicts: "Conflicts",
        header_match_support: "Match/Support",
        tooltip_post: "Posterior Probability: The degree to which the candidate matches the current observations. Higher is better.",
        tooltip_delta: "Delta: The difference from the top candidate. A smaller value indicates a closer match.",
        tooltip_conflicts: "Conflicts: The number of direct contradictions between selected traits and the taxon's data.",
    },
    traitsPanel: {
        sort_recommend: "Recommended",
        sort_group: "Group",
        sort_name: "Name",
        state_yes: "Yes",
        state_no: "No",
        state_clear: "Clear",
    },
    algoTab: {
        algorithm: "Algorithm",
        mode: "Mode",
        mode_strict: "Strict (handle conflicts rigorously)",
        mode_lenient: "Lenient",
        auto_apply: "Auto Apply",
        manual_apply: "Manual Apply",
        reset_defaults: "Reset to Defaults",
        param_alpha: "α (False Positive)",
        param_beta: "β (False Negative)",
        param_gamma: "γ (NA Penalty)",
        param_kappa: "κ (Smoothing)",
        param_epsilon: "ε (Epsilon Cutoff)",
        param_hard_contradiction: "Hard Contradiction",
        tooltip_alpha: "Error rate of observing Yes when truth is No. Recommended: 0-0.2.",
        tooltip_beta: "Error rate of observing No when truth is Yes. Recommended: 0-0.2.",
        tooltip_gamma: "Slight penalty for observing Yes/No when truth is NA. Recommended: 0.8-1.0.",
        tooltip_kappa: "Posterior distribution smoothing to prevent overconfidence. Recommended: 0-5.",
        tooltip_epsilon: "Numerical stabilization by rounding small probabilities to zero. Recommended: 1e-12 to 1e-3.",
        tooltip_hard_contradiction: "When in strict mode, immediately exclude candidates with clear contradictions.",
    },
    manualTab: {
        title: "Manual",
        content: enManual,
    },
    help: {
        title: "MorphoKey Help",
        tabs: {
            overview: "Overview",
            bayes: "Bayesian (Hier.)",
            heuristic: "Heuristic",
            interpret: "Score interpretation",
            tips: "Practical tips",
        },
        overview: "MorphoKey is an interactive identification key driven by a trait matrix...",
        bayes: "The Bayesian model...",
        heuristic: "The Heuristic model...",
        interpret: "Score interpretation...",
        tips: "Practical tips...",
    }
  },
} as const;