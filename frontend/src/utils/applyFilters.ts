// frontend/src/utils/applyFilters.ts
//
// Wails の自動生成に合わせて 4 引数で呼び出す版。
// - models の名前空間は "main" 想定（通常の Wails v2 生成）
// - もしプロジェクトのパッケージ名が "main" 以外なら、models 側の名前空間に読み替えてください。

import { ApplyFiltersAlgoOpt } from "../../wailsjs/go/main/App";
import { main } from "../../wailsjs/go/models";
import { AlgoOptions } from "../hooks/useAlgoOpts";

// Wails 側の戻り値型（models で生成済み）
export type ApplyResult = main.ApplyResultEx;

// selected: 形質ID -> 観測値（-1/0/1 など既存仕様に合わせて）
// mode: "strict" | "lenient"
// algorithm: "bayes" | "heuristic"
// opts: A2 の UI で編集したパラメータ（フロント側の AlgoOptions）
export async function applyFilters(
  selected: Record<string, number>,
  mode: "strict" | "lenient",
  algorithm: "bayes" | "heuristic",
  opts: AlgoOptions
): Promise<ApplyResult> {
  // Wails が生成した型 main.ApplyOptions に詰め替え
  // （フィールド名が一致していればそのままスプレッドでOK。念のため unknown→型化）
  const opt4 = {
    defaultAlphaFP: opts.defaultAlphaFP,
    defaultBetaFN:  opts.defaultBetaFN,
    gammaNAPenalty: opts.gammaNAPenalty,
    kappa:          opts.kappa,
    epsilonCut:     opts.epsilonCut,
    useHardContradiction: opts.useHardContradiction,
    wantInfoGain:   opts.wantInfoGain ?? false,
  } as unknown as main.ApplyOptions;

  // ★ 4 引数で呼び出す（以前の payload 1 個ではなく）
  const res = await ApplyFiltersAlgoOpt(selected, mode, algorithm, opt4);

  // そのまま返す（scores / suggestions 等は ApplyResultEx に含まれる想定）
  return res as ApplyResult;
}
