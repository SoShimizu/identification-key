// frontend/src/utils/applyFilters.ts
import { ApplyFiltersAlgoOpt } from "../../wailsjs/go/main/App";
import { main } from "../../wailsjs/go/models";
import { AlgoOptions } from "../hooks/useAlgoOpts";
import { MultiChoice } from "../api";

export type ApplyResult = main.ApplyResultEx;

export async function applyFilters(
  selected: Record<string, number>,
  selectedMulti: Record<string, MultiChoice>,
  mode: "strict" | "lenient",
  algorithm: "bayes" | "heuristic",
  opts: AlgoOptions
): Promise<ApplyResult> {

  // Create the single request object
  const request: main.ApplyRequest = new main.ApplyRequest({
    selected: selected,
    selectedMulti: selectedMulti,
    mode: mode,
    algo: algorithm,
    opts: {
      ...opts,
      wantInfoGain: opts.wantInfoGain ?? false,
    }
  });

  // Call the backend with the single request object
  const res = await ApplyFiltersAlgoOpt(request);

  return res as ApplyResult;
}