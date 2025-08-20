// frontend/src/types.ts（存在場所に合わせて置いてください）

export type Choice = -1 | 0 | 1;

export type Trait = {
  id: string;
  name: string;
  group?: string;
  type?: string;   // "binary" or "derived" ほか
  parent?: string; // derived の親（名前またはID）
  state?: string;  // 派生状態のラベル
};

export type Taxon = {
  id: string;
  name: string;
  traits?: Record<string, Choice>;
};

export type TaxonScore = {
  taxon: Taxon;
  post?: number;
  score?: number;           // 旧互換
  delta?: number;
  used?: number;
  conflicts?: number;
  match?: number;
  support?: number;
};

export type TraitSuggestion = {
  traitId: string;
  name: string;
  group?: string;
  // 主指標
  ig?: number;
  ecr?: number;
  gini?: number;
  entropy?: number;
  // 表示用 score（既定=IG）
  score: number;
  // 状態の出現確率（診断・説明用）
  pStates?: { state: string; p: number }[];
};
