// frontend/src/api.ts
import { engine, main } from "../wailsjs/go/models";
import { GetMatrix } from "../wailsjs/go/main/App";

// For binary traits, -1, 0, 1. For continuous, the float value.
export type Choice = number; 

// Goの `engine.Trait` 構造体と型を一致させる
export type Trait = {
  id: string;
  name: string;
  group: string;
  type: "binary" | "derived" | "nominal_parent" | "continuous";
  parent?: string;
  state?: string;
  difficulty?: number;
  risk?: number;
  helpText?: string;
  helpImages?: string[];
  minValue?: number;
  maxValue?: number;
  isInteger?: boolean; // Add this line
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