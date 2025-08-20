// frontend/src/i18n.ts
export const STR = {
  ja: {
    appTitle: "MorphoKey",
    candidates: "候補数",
    btnPickExcel: "EXCEL を選択",
    btnReset: "全選択リセット",
    sectionsTitle: "形質フィルタ",
    expandAll: "全展開",
    collapseAll: "全折りたたみ",
    tableHeader: {
      trait: "形質",
      yes: "該当する",
      no: "該当しない",
      unk: "わからない",
      unset: "未選択",
    },
    right: {
      candidates: "候補タクサ",
      suggested: "次に効く形質（推奨）",
      name: "Name",
      score: "Score",
      match: "Match/Support",
      trait: "形質",
      y: "Y",
      n: "N",
      na: "NA",
      known: "Known%",
      disc: "Disc.",
    },
    top: {
      algo: "アルゴリズム",
      mode: "わからない（NA）の扱い",
      modeLenient: "寛容（不採点）",
      modeStrict: "厳格（評価）",
      impossible: "不可能な選択肢（Yes/No）",
      impossibleHide: "非表示",
      impossibleDisable: "無効化",
      impossibleMark: "マーキング",
      language: "言語",
      help: "ヘルプ",
    },
    algoLabel: { bayes: "ベイズ（階層）", heuristic: "ヒューリスティック" },

    help: {
      title: "MorphoKey ヘルプ",
      tabs: {
        overview: "概要",
        bayes: "ベイズ（階層）",
        heuristic: "ヒューリスティック",
        interpret: "スコアの解釈",
        tips: "同定のコツ",
        matrix: "マトリクスの作り方",
      },

      // ---- 本文タブ ----
      overview: `
MorphoKey は、形質マトリクスに基づくインタラクティブ検索表です。
A列の見出し（部位名など）ごとに形質をグループ化し、左で観察結果を選ぶと右に候補タクサと「次に効く形質」を表示します。
デフォルトの評価は **ベイズ（階層）** で、確率スコア（0..1, 候補で正規化）を返します。
      `,
      bayes: `
【モデルの要点】
- 各 形質t×タクサi に対し、「Yes率」の事後分布 Beta(a,b) を経験ベイズで推定。
- 形質ごとに母平均θと集中度κを持ち、観測のY/Nを擬似カウントλとして加算。
- 観測ノイズ（偽陽性α・偽陰性β）を仮定（既定 α=0.03, β=0.05）。

【計算】
1) 選択した形質の希望値（Yes/No）に対し、タクサiの p̂_i,t（後分布平均）と α,β から尤度 ℓ_i,t を計算。
2) タクサごとに ∏ℓ_i,t を取り、全候補で正規化して事後確率 Score_i（0..1, 合計≈1）。

【利点】
- NAが多い・曖昧でもロバスト。断定ではなく相対確率で比較できる。
      `,
      heuristic: `
【計算】
- Support = 評価できた本数（NA除く）、Matches = 一致した本数。
- Score = Matches / max(1, Support)。矛盾するタクサは除外（LenientではNAは不採点）。

【利点】
- 単純で挙動が読みやすい。行列が十分埋まっているとベイズに近い順位になりやすい。
      `,
      interpret: `
【スコアの見方】
- ベイズ: 相対的な事後確率。上位2候補の差が大きいほど有意な絞り込み。
- ヒューリスティック: 一致率。Support が小さい場合は過信しない。

【推奨フロー】
1) 右の「次に効く形質」で **Discriminancy**（既知率×Gini）が高いものから確認。
2) スコア上位の差がどう変わるかを観察し、寄与の大きい形質を優先。
3) 不確かな観察は **Unknown** を使い、安易なYes/Noを避ける。
      `,
      tips: `
- 情報が不足しているときは、既知率が高く分岐性の高い形質を優先的に確認。
- 候補が多い場合は「強い形質」（Discriminancyが閾値以上）を先に当てにいく。
- 収斂などに注意。翅脈や口器など安定的な形質を優先。
- スコアは指標であり確証ではありません。標本の欠損・雌雄差・時期差なども考慮してください。
      `,
      matrix: `
# マトリクスの作り方（Excel）

## 推奨フォーマット（v2）
- **A列: Group**（部位名など） … Head / Thorax / Legs / Wings / Abdomen / Ecology / …
- **B列: Trait**（形質名）
- **C列: Type** … \`binary\` / \`ordinal3\` / \`nominal3\` / \`continuous\`
- **D列以降: Taxon**（各列が1種）

### 値の書き方
- **binary**: \`1\`(Yes), \`-1\`(No), \`0\` or 空白(NA)。日本語・英語・記号（×, ○, ✓）にも対応。
- **ordinal/nominal/continuous**: 現行版では**読み込みのみ**（スコア計算は NA 相当）。将来拡張で対応予定。

> サンプル：\`Demo_binary_v2.xlsx\`（10種×20形質）、\`Demo_mixed_v2.xlsx\`（非バイナリ見本）

## レガシー（v1）
- **A列: Trait**（先頭に \`[Head]\` などのタグ）、**B列以降: Taxon**
- 例: \`[Head] Antenna long\`

## メタ情報（任意）
- シート名 **TaxaMeta**
- 列：\`Taxon\`, \`Regions\`, \`Seasons\`, \`Habitats\`

## よくあるエラー
- 種の列名の重複 → 別名にしてください
- Type が未記入 → \`binary\` とみなします
- 非バイナリ値を binary trait に書いた → NA として扱われます

将来拡張：地域・季節・生息域の**事前確率（P(taxon))**、形質ごとの誤差率（α,β）、多状態/連続の**確率モデル**に順次対応予定です。
      `,

      // ---- 各セクションの ? ボタンが参照する短文 ----
      sections: {
        filters: `
左の「形質フィルタ」から観察結果を選びます。
- Yes / No / Unknown / Unset の4択。
- 不可能な選択肢（現候補に該当がない Yes/No）は、上部設定に従い 非表示/無効化/マーキング。
- 行の薄青ハイライトは、現在の候補で分岐性が高い「推奨（強い）形質」です。
        `,
        candidates: `
右上の表は、現在の候補タクサをスコア順に表示します。
- ベイズ：相対確率（0..1, 合計≈1）
- ヒューリスティック：一致率（Matches/Support）
Support が少ない場合は過信せず、右下の「推奨形質」を追加で確認してください。
        `,
        suggested: `
右下は「次に効く形質」です（Discriminancy 高い順）。
- Known%：候補群で Yes/No が既知の割合
- Disc.：Gini×Known。大きいほど Yes/No で割れやすく情報量が高い
形質名をクリックすると左側の該当行へジャンプします。
        `,
      },
    },
  },

  en: {
    appTitle: "MorphoKey",
    candidates: "Candidates",
    btnPickExcel: "PICK EXCEL",
    btnReset: "RESET",
    sectionsTitle: "Trait Filters",
    expandAll: "EXPAND ALL",
    collapseAll: "COLLAPSE ALL",
    tableHeader: {
      trait: "Trait",
      yes: "Yes",
      no: "No",
      unk: "Unknown",
      unset: "Unset",
    },
    right: {
      candidates: "Candidate taxa",
      suggested: "Suggested traits",
      name: "Name",
      score: "Score",
      match: "Match/Support",
      trait: "Trait",
      y: "Y",
      n: "N",
      na: "NA",
      known: "Known%",
      disc: "Disc.",
    },
    top: {
      algo: "Algorithm",
      mode: "Unknown (NA)",
      modeLenient: "Lenient (not scored)",
      modeStrict: "Strict (scored)",
      impossible: "Impossible choices (Yes/No)",
      impossibleHide: "Hide",
      impossibleDisable: "Disable",
      impossibleMark: "Mark",
      language: "Language",
      help: "Help",
    },
    algoLabel: { bayes: "Bayesian (Hier.)", heuristic: "Heuristic" },

    help: {
      title: "MorphoKey Help",
      tabs: {
        overview: "Overview",
        bayes: "Bayesian (Hier.)",
        heuristic: "Heuristic",
        interpret: "Score interpretation",
        tips: "Practical tips",
        matrix: "Authoring matrices",
      },

      overview: `
MorphoKey is an interactive identification key driven by a trait matrix.
Groups from column A become collapsible sections. Selecting traits updates candidate taxa and suggested traits.
Default evaluation is **Bayesian (hierarchical)**, returning probability-like scores (0..1, normalized across candidates).
      `,
      bayes: `
[Model]
- For each trait–taxon cell, maintain Beta(a,b) over "Yes rate" via empirical Bayes.
- Each trait has mean θ and concentration κ; observed Y/N adds pseudo-count λ.
- Observation noise: false positive α and false negative β (defaults α=0.03, β=0.05).

[Computation]
1) For each selected trait, compute likelihood ℓ_i,t using posterior mean p̂_i,t and α,β.
2) Multiply across traits (∏ℓ_i,t), then normalize across taxa to get posterior Score_i (uniform prior).

[Pros]
- Robust with sparse/ambiguous matrices; comparative probabilities instead of forced pass/fail.
      `,
      heuristic: `
[Computation]
- Support = comparable traits (excl. NA), Matches = agreed traits.
- Score = Matches / max(1, Support). Contradictions remove a taxon (or penalize under Strict).

[Pros]
- Simple and predictable; often similar to Bayesian when the matrix is dense.
      `,
      interpret: `
[Reading scores]
- Bayesian: relative posterior probability; larger gap between top-2 indicates stronger evidence.
- Heuristic: match ratio; be cautious with small Support.

[Workflow]
1) Prefer traits with high **Discriminancy** (Known×Gini).
2) Watch how the top scores diverge/converge as you add traits.
3) Use **Unknown** when uncertain; avoid overconfident Yes/No.
      `,
      tips: `
- When information is scarce, query highly known & discriminative traits first.
- For many candidates, target "strong traits" above the Discriminancy threshold.
- Beware convergence; prioritize stable traits (e.g., wing venation).
- Scores guide decisions; consider specimen damage, sex, seasonality.
      `,
      matrix: `
# Authoring matrices (Excel)

## Recommended (v2)
- **Col A: Group** (e.g., Head / Thorax / Legs / Wings / Abdomen / Ecology / …)
- **Col B: Trait** (character name)
- **Col C: Type** … \`binary\` / \`ordinal3\` / \`nominal3\` / \`continuous\`
- **Cols D~: Taxon** (each column is a species)

### Cell values
- **binary**: \`1\`(Yes), \`-1\`(No), \`0\` or blank (NA). Also accepts common text/marks.
- **ordinal/nominal/continuous**: *loaded only* in the current version (treated as NA in scoring). Future versions will model them properly.

> Samples: \`Demo_binary_v2.xlsx\` (10×20), \`Demo_mixed_v2.xlsx\` (non-binary examples)

## Legacy (v1)
- **Col A: Trait** with a leading \`[Head]\` tag; **Cols B~: Taxon**
- Example: \`[Head] Antenna long\`

## Optional metadata
- Sheet **TaxaMeta**
- Columns: \`Taxon\`, \`Regions\`, \`Seasons\`, \`Habitats\`

## Common pitfalls
- Duplicate taxon headers → rename
- Missing Type → treated as \`binary\`
- Non-binary tokens placed in a binary trait → treated as NA

Planned: geographic/seasonal **priors P(taxon)**, per-trait error rates (α,β), and proper probabilistic handling of multi-state/continuous traits.
      `,

      sections: {
        filters: `
Select your observations on the left.
- Four choices: Yes / No / Unknown / Unset.
- Impossible choices (no candidate supports a Yes/No) are hidden/disabled/marked per the top setting.
- Rows with a light blue background are "strong" traits (high Discriminancy) for the current candidates.
        `,
        candidates: `
The upper-right table lists current candidate taxa in score order.
- Bayesian: relative probability (0..1; sums ≈1)
- Heuristic: match ratio (Matches/Support)
When Support is small, don't over-trust; add more from "Suggested traits" below.
        `,
        suggested: `
The lower-right table lists the next informative traits (sorted by Discriminancy).
- Known%: fraction of candidates with known Yes/No
- Disc.: Gini×Known; larger means more divisive and informative
Click a trait name to jump to it on the left.
        `,
      },
    },
  },
} as const;
