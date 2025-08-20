// frontend/src/api.ts
import { engine, main } from "../wailsjs/go/models";
import { GetMatrix } from "../wailsjs/go/main/App";

// フロントと Go 間の共有型（Go側の json タグと一致）
export type Choice = -1 | 0 | 1;

// Goの `engine.Trait` 構造体と型を一致させる
export type Trait = {
  id: string;
  name: string;
  group: string;
  // ✨ 修正: 'continuous_parent' 型を追加
  type: "binary" | "derived" | "nominal_parent" | "continuous_parent";
  parent?: string;
  state?: string;
  difficulty?: number;
  risk?: number;
  helpText?: string;
  helpImages?: string[];
};

export type Taxon = engine.Taxon;

export type Matrix = {
  name: string;
  traits: Trait[];
  taxa: Taxon[];
};

export type TaxonScore = engine.TaxonScore;
export type StateProb = engine.StateProb;
export type TraitSuggestion = engine.TraitSuggestion;
export type ApplyOptions = main.ApplyOptions;
export type ApplyResult = main.ApplyResultEx;

// ---- Wails バインディング呼び出し ----

export async function getMatrix(): Promise<Matrix> {
  const m = await GetMatrix();
  return m as unknown as Matrix;
}