// フロントと Go 間の共有型（Go側の json タグと一致）
export type Choice = -1 | 0 | 1;

export type Trait = {
  id: string;
  name: string;
  group: string;
  type: "binary" | "derived";
  parent?: string;
  state?: string;
};

export type Taxon = { id: string; name: string; traits?: Record<string, Choice> };

export type Matrix = {
  name: string;
  traits: Trait[];
  taxa: Taxon[];
};

export type TaxonScore = {
  taxon: Taxon;
  post: number;
  score: number;
  delta: number;
  used: number;
  conflicts: number;
  match: number;
  support: number;
};

export type StateProb = { state: string; p: number };

export type TraitSuggestion = {
  traitId: string;
  name: string;
  group: string;
  ig: number;
  ecr: number;
  gini: number;
  entropy: number;
  pStates: StateProb[];
  score: number;
};

export type ApplyOptions = {
  defaultAlphaFP: number;
  defaultBetaFN: number;
  wantInfoGain?: boolean;
  lambda?: number;
  a0?: number; b0?: number; kappa?: number;
  tau?: number;
};

export type ApplyResult = {
  scores: TaxonScore[];
  suggestions: TraitSuggestion[];
};

// ---- Wails バインディング呼び出し ----
const GO: any = (window as any).go?.main?.App;

export async function getMatrix(): Promise<Matrix> {
  return await GO.GetMatrix();
}

export async function applyFiltersAlgoOpt(
  selected: Record<string, number>,
  mode: "lenient" | "strict",
  algo: "bayes" | "heuristic",
  opt: ApplyOptions
): Promise<ApplyResult> {
  return await GO.ApplyFiltersAlgoOpt(selected, mode, algo, opt);
}
