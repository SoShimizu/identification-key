// frontend/src/i18n.ts

export const STR = {
  ja: {
    appTitle: "ClavisID",
    panels: {
      candidates: "候補タクサ",
      traits_unselected: "未選択の形質",
      traits_selected: "選択済みの形質",
      history: "選択履歴",
      comparison: "タクサ比較",
      help_placeholder: "形質の行をクリックするとヘルプが表示されます",
    },
    ribbon: {
      welcome: "ようこそ",
      candidates_settings: "候補タクサ設定",
      traits_settings: "形質推薦設定",
      help: "ヘルプ",
      switchTheme: "テーマ切替",
      matrix: "マトリクス",
      selectedCount: "選択数",
      switchMatrix: "マトリクス切替",
      refreshList: "一覧を再取得",
      description: "各設定タブから評価方法やパラメータを調整できます。設定はマトリクスごとに自動保存されます。",
      diagnosticPanel: "診断パネル",
    },
    candidatesPanel: {
        header_rank: "#",
        header_name: "Name",
        header_post_prob: "Post. prob.",
        header_score: "Score",
        header_delta: "Δ",
        header_conflicts: "Conflicts",
        header_match_support: "Match/Support",
        tooltip_post: "事後確率：現在の観測と整合する度合い。高いほど有力な候補です。",
        tooltip_score: "一致率スコア：選択された形質との単純な一致率。",
        tooltip_delta: "1位との差：小さいほど競っている状態を示します。",
        tooltip_conflicts: "矛盾数：選択した形質とタクソンのデータが明確に矛盾する数。",
        compare_button: "比較",
        show_match_support: "Match/Supportを表示",
    },
    comparisonPanel: {
        title: "タクサ比較",
        select_prompt: "候補リストから2つ以上のタクサを選択して比較します。",
        hide_same_traits: "違いのない形質を隠す",
        trait: "形質",
    },
    traitsPanel: {
        sort_recommend: "推奨順",
        sort_group: "グループ別",
        sort_name: "名前順",
        state_yes: "Yes",
        state_no: "No",
        state_na: "NA",
        state_clear: "Clear",
        reset_selections: "選択をリセット",
        apply_selection: "適用",
        multi_select_tooltip: "複数選択が可能です",
        tooltip_na: "標本の破損などで形質が『観測不能』な場合に使います。この形質は計算から除外されます。",
        tooltip_clear: "この形質に対する選択を解除します。",
    },
    candidatesTab: {
      algorithm: "アルゴリズム",
      effect_label: "結果への影響",
      tradeoff_label: "トレードオフ",
      table_header_setting: "設定",
      table_header_merit: "メリット",
      table_header_demerit: "デメリット",
      param_conflict: {
          title: "矛盾の扱い",
          name: "矛盾ペナルティ (既定値: 1.0)",
          description: "観察結果とマトリクスのデータが明確に違う（例：Yesを選択したがデータはNo）場合のペナルティの強さを決めます。",
          effect: "値を1.0 (Strict) に近づけるほど、わずかな矛盾でも候補から除外されやすくなります。0.0 (Lenient) に近づけると、多少の矛盾は許容して候補に残りやすくなります。",
          tradeoffs: [
              { setting: "Strict (高めの値)", pro: "矛盾のない候補に素早く絞り込める", con: "データや観察の小さな間違いに弱い" },
              { setting: "Lenient (低めの値)", pro: "間違いに頑健", con: "候補が絞り込まれにくい" }
          ]
      },
      param_na: {
          title: "データ欠損(NA)の扱い",
          name: "γ (NAペナルティ) (既定値: 0.8)",
          description: "観察した形質について、マトリクス側にデータがない(NA)場合のペナルティです。",
          effect: "値を1.0にするとペナルティは完全に無くなります。0.0に近づけるほど、データ欠損を持つ候補種のスコアが大きく低下します。",
          tradeoffs: [
            { setting: "強いペナルティ (低い値)", pro: "データが豊富な種が有利になる", con: "データが少ない分類群で候補が不当に排除されやすい" },
            { setting: "ペナルティ無し (1.0)", pro: "データが不完全でも候補に残る", con: "情報不足の種が過大評価される可能性" }
          ]
      },
      param_bayes: {
          title: "ベイズ推定の詳細設定"
      },
      param_kappa: {
          name: "κ (平滑化) (既定値: 1.0)",
          description: "スコアの過信を抑制する調整値です。特に選択形質が少ない序盤で、一つの形質だけでスコアが極端に変動するのを防ぎます。",
          effect: "値を大きくするほど、全候補のスコアが平均に近づき、順位変動が穏やかになります。",
          tradeoffs: [
            { setting: "高めの値", pro: "安定したランキング", con: "決定的情報があってもスコア差がつきにくい" },
            { setting: "低めの値", pro: "スコア差が明確", con: "序盤の順位が不安定になりやすい" }
          ]
      },
      param_alpha: {
        name: "α (偽陽性率)",
        description: "(既定値: 0.03) 「本当はNoなのにYesと観察してしまう」観察エラーの確率。",
      },
      param_beta: {
        name: "β (偽陰性率)",
        description: "(既定値: 0.07) 「本当はYesなのにNoと観察してしまう」観察エラーの確率。",
      },
      reset_defaults: "既定に戻す",
    },
    traitsTab: {
        param_recommend: {
            title: "形質推薦のスコア計算",
        },
        pragmatic_score: {
            name: "実用性スコアを有効化 (既定値: 有効)",
            description: "有効にすると、単なる情報量だけでなく、「観察のしやすさ(コスト)」と「見間違いにくさ(リスク)」を考慮して次に調べるべき形質を推薦します。",
            effect: "観察が難しかったり、専門家でも判断が分かれるような形質の推薦順位が下がります。",
            tradeoffs: [
              { setting: "有効", pro: "初心者でも安全で効率的な順序で同定を進められる", con: "常に情報量が最大となる形質が推薦されるとは限らない" }
            ],
        },
        param_continuous: {
            title: "連続値形質の扱い",
        },
        param_tolerance: {
            name: "許容範囲 (Tolerance) (既定値: 10%)",
            description: "連続値（長さなど）のデータ範囲に対して、ユーザーの入力値がどの程度範囲外でも「一致」と見なすかを設定します。",
            effect: "値を大きくするほど、マトリクスの範囲から多少外れた値でも矛盾と見なされにくくなります。",
            tradeoffs: [
              { setting: "高めの値", pro: "個体変異や測定誤差に強くなる", con: "近縁な別種との区別がつきにくくなる可能性" },
              { setting: "低めの値", pro: "厳密な同定が可能", con: "わずかな変異で候補から除外されやすい" }
            ]
        },
        param_multi: {
            title: "複数選択形質の扱い",
        },
        categorical_algo: {
            name: "評価アルゴリズム (既定値: Jaccard)",
            desc_jaccard: "【Jaccard】選択した項目とデータの一致度(集合の類似度)で評価します。『日本と韓国に分布』というデータに対し『日本』とだけ選択した場合、部分的に一致していると見なされます。",
            desc_binary: "【Binary】選択した項目のうち、1つでもデータに含まれていれば完全に一致と見なします。『日本』と選択すれば、『日本と韓国に分布』は完全一致となります。",
        },
        jaccard_threshold: {
            name: "Jaccard類似度しきい値 (既定値: 0.5)",
            description: "Jaccardモードの際、「一致」と判断するのに必要となる類似度の下限値です。",
            effect: "値を高くするほど、より多くの項目が一致しないと「一致」と見なされなくなります。",
            tradeoffs: [
              { setting: "高めの値", pro: "厳密な分布域を持つ種を絞りやすい", con: "情報が不完全な場合に候補から外れやすい" },
              { setting: "低めの値", pro: "部分的な情報でも候補に残りやすい", con: "絞り込みが甘くなる" }
            ]
        },
      },
  },
  en: {
    // English translations follow the same structure
    appTitle: "ClavisID",
    panels: {
        candidates: "Candidates",
        traits_unselected: "Unselected Traits",
        traits_selected: "Selected Traits",
        history: "History",
        comparison: "Taxa Comparison",
        help_placeholder: "Click a trait row to see help materials",
    },
    ribbon: {
        welcome: "Welcome",
        candidates_settings: "Candidate Settings",
        traits_settings: "Trait Settings",
        help: "Help",
        switchTheme: "Switch Theme",
        matrix: "Matrix",
        selectedCount: "Selected",
        switchMatrix: "Switch Matrix",
        refreshList: "Refresh List",
        description: "You can adjust evaluation methods and parameters from the settings tabs. Settings are saved automatically for each matrix.",
        diagnosticPanel: "Diagnostic Panel",
    },
    candidatesPanel: {
        header_rank: "#",
        header_name: "Name",
        header_post_prob: "Post. prob.",
        header_score: "Score",
        header_delta: "Δ",
        header_conflicts: "Conflicts",
        header_match_support: "Match/Support",
        tooltip_post: "Posterior Probability: The degree to which the candidate matches the current observations. Higher is better.",
        tooltip_score: "Match Score: The simple percentage of matching traits.",
        tooltip_delta: "Delta: The difference from the top candidate. A smaller value indicates a closer match.",
        tooltip_conflicts: "Conflicts: The number of direct contradictions between selected traits and the taxon's data.",
        compare_button: "Compare",
        show_match_support: "Show Match/Support",
    },
    comparisonPanel: {
        title: "Taxa Comparison",
        select_prompt: "Select two or more taxa from the candidate list to compare.",
        hide_same_traits: "Hide traits with no differences",
        trait: "Trait",
    },
    traitsPanel: {
        sort_recommend: "Recommended",
        sort_group: "Group",
        sort_name: "Name",
        state_yes: "Yes",
        state_no: "No",
        state_na: "NA",
        state_clear: "Clear",
        reset_selections: "Reset Selections",
        apply_selection: "Apply",
        multi_select_tooltip: "Multiple selections are possible",
        tooltip_na: "Use when a trait is 'Unobservable' (e.g., due to specimen damage). This trait will be excluded from the calculation.",
        tooltip_clear: "Clears the selection for this trait.",
    },
    candidatesTab: {
        algorithm: "Algorithm",
        effect_label: "Effect on Results",
        tradeoff_label: "Trade-offs",
        table_header_setting: "Setting",
        table_header_merit: "Merit",
        table_header_demerit: "Demerit",
        param_conflict: {
            title: "Conflict Handling",
            name: "Conflict Penalty (Default: 1.0)",
            description: "Determines the penalty strength when an observation clearly contradicts the matrix data (e.g., selecting 'Yes' when the data is 'No').",
            effect: "Closer to 1.0 (Strict), candidates are more easily excluded by slight conflicts. Closer to 0.0 (Lenient), some conflicts are tolerated, and candidates are more likely to remain.",
            tradeoffs: [
                { setting: "Strict (High Value)", pro: "Quickly narrows down to consistent candidates.", con: "Sensitive to minor errors in data or observation." },
                { setting: "Lenient (Low Value)", pro: "Robust against errors.", con: "Candidate list is less refined." }
            ]
        },
        param_na: {
            title: "Missing Data (NA) Handling",
            name: "γ (NA Penalty) (Default: 0.8)",
            description: "The penalty applied when a taxon has no data (NA) for an observed trait.",
            effect: "At 1.0, there is no penalty. Closer to 0.0, the score of a candidate with missing data is significantly reduced.",
            tradeoffs: [
              { setting: "Strong Penalty (Low Value)", pro: "Favors taxa with comprehensive data.", con: "May unfairly penalize taxa from poorly studied groups." },
              { setting: "No Penalty (1.0)", pro: "Incomplete data does not disqualify a candidate.", con: "Candidates with little information might be overestimated." }
            ]
        },
        param_bayes: {
            title: "Advanced Bayesian Settings"
        },
        param_kappa: {
            name: "κ (Smoothing) (Default: 1.0)",
            description: "An adjustment to prevent overconfidence in scores, especially when few traits are selected.",
            effect: "Higher values bring all candidate scores closer to the average, making rank changes more gradual.",
            tradeoffs: [
              { setting: "High Value", pro: "Stable ranking.", con: "Score differences may be less pronounced, even with decisive evidence." },
              { setting: "Low Value", pro: "Clear score differences.", con: "Ranks may be volatile in the early stages." }
            ]
        },
        param_alpha: {
          name: "α (False Positive Rate)",
          description: "(Default: 0.03) Informs the model of the probability of observing 'Yes' when the true state is 'No'.",
        },
        param_beta: {
          name: "β (False Negative Rate)",
          description: "(Default: 0.07) Informs the model of the probability of observing 'No' when the true state is 'Yes'.",
        },
        reset_defaults: "Reset to Defaults",
      },
    traitsTab: {
        param_recommend: {
            title: "Trait Recommendation Scoring",
        },
        pragmatic_score: {
            name: "Enable Pragmatic Score (Default: Enabled)",
            description: "If enabled, recommends the next trait to observe based not just on information theory, but also on 'ease of observation' (cost) and 'risk of misinterpretation'.",
            effect: "Traits that are difficult to observe or are often ambiguous will be ranked lower in the recommendation list.",
            tradeoffs: [
              { setting: "Enabled", pro: "Guides users, especially non-experts, through a safer and more efficient identification path.", con: "May not always suggest the trait that provides the absolute most information." }
            ],
        },
        param_continuous: {
            title: "Continuous Trait Handling",
        },
        param_tolerance: {
            name: "Tolerance (Default: 10%)",
            description: "Sets how much a user's input for a continuous value (like length) can deviate from the range in the matrix and still be considered a 'match'.",
            effect: "A higher value makes the system more forgiving of values that fall slightly outside the specified range.",
            tradeoffs: [
              { setting: "High Value", pro: "More robust to individual variation and measurement error.", con: "May become harder to distinguish between closely related species." },
              { setting: "Low Value", pro: "Allows for precise identification.", con: "Minor variations may exclude the correct candidate." }
            ]
        },
        param_multi: {
            title: "Multi-Select Trait Handling",
        },
        categorical_algo: {
            name: "Evaluation Algorithm (Default: Jaccard)",
            desc_jaccard: "[Jaccard] Evaluates based on the degree of overlap (set similarity). If the data is 'Japan; Korea' and you select only 'Japan', it's treated as a partial match.",
            desc_binary: "[Binary] Considers it a full match if at least one of the selected items is present in the data. If you select 'Japan', 'Japan; Korea' is a perfect match.",
        },
        jaccard_threshold: {
            name: "Jaccard Similarity Threshold (Default: 0.5)",
            description: "The minimum similarity score required to be considered a 'match' when using the Jaccard algorithm.",
            effect: "A higher value requires more of the selected items to be present in the data to be considered a match.",
            tradeoffs: [
              { setting: "High Value", pro: "Good for narrowing down species with very specific distributions.", con: "The correct candidate might be excluded if your information is incomplete." },
              { setting: "Low Value", pro: "Candidates remain even with partial information.", con: "Less effective at narrowing down the list." }
            ]
        },
      },
  },
} as const;