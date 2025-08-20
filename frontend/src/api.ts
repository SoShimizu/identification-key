// frontend/src/api.ts

// Wailsが自動生成した型定義をwailsjsからインポート
import { engine, main } from "../wailsjs/go/models";
import { GetMatrix, ApplyFiltersAlgoOpt } from "../wailsjs/go/main/App";

// フロントと Go 間の共有型（Go側の json タグと一致）
export type Choice = -1 | 0 | 1;

// Goの `engine.Trait` 構造体と型を一致させる
export type Trait = {
  id: string;
  name: string;
  group: string;
  type: "binary" | "derived" | "nominal_parent"; // "nominal_parent" を追加
  parent?: string;
  state?: string;
  cost?: number; // CostもGo側にあるので含めておく
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
  // getMatrixはWailsjsから直接呼び出す
  const m = await GetMatrix();
  return m as unknown as Matrix; // フロントエンドの厳密な型にキャスト
}

// applyFiltersはutilsに移動したため、ここからは削除