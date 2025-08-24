// frontend/src/api.ts
import { engine, main } from "../wailsjs/go/models";
import { GetMatrix, GetTaxonDetails } from "../wailsjs/go/main/App";

export type Choice = number;
export type MultiChoice = string[];

export type Dependency = {
    parentTraitId: string;
    requiredState: string;
};

export type MatrixInfo = {
    title_en: string;
    title_jp: string;
    version: string;
    description_en: string;
    description_jp: string;
    authors_en: string;
    authors_jp: string;
    contact_en: string;
    contact_jp: string;
    citation_en: string;
    citation_jp: string;
    references_en: string;
    references_jp: string;
}

export type Trait = {
  id: string;
  traitId?: string;
  name_en: string;
  name_jp: string;
  group_en: string;
  group_jp: string;
  type: "binary" | "derived" | "nominal_parent" | "continuous" | "categorical_multi";
  parent?: string;
  parentName?: string;
  parentDependency?: Dependency;
  state?: string;
  difficulty?: number;
  risk?: number;
  helpText_en?: string;
  helpText_jp?: string;
  helpImages?: string[];
  minValue?: number;
  maxValue?: number;
  isInteger?: boolean;
  states?: string[];
};

export type Taxon = {
    id: string;
    name: string;
    scientificName: string;
    rank?: string; // <-- 修正：この行を追加
    taxonAuthor?: string;
    vernacularName_en?: string;
    vernacularName_ja?: string;
    description_en?: string;
    description_jp?: string;
    images?: string[];
    references?: string;
    order?: string;
    superfamily?: string;
    family?: string;
    subfamily?: string;
    tribe?: string;
    subtribe?: string;
    genus?: string;
    subgenus?: string;
    species?: string;
    subspecies?: string;
    traits?: Record<string, number>;
    continuousTraits?: Record<string, {min: number, max: number}>;
    categoricalTraits?: Record<string, string[]>;
};

export type Matrix = {
  name: string;
  info: MatrixInfo;
  traits: Trait[];
  taxa: Taxon[];
};

export type TaxonScore = engine.TaxonScore;
export type StateProb = engine.StateProb;
export type TraitSuggestion = engine.TraitSuggestion & {
    max_ig?: number;
};
export type ApplyOptions = main.ApplyOptions;
export type ApplyResult = main.ApplyResultEx;
export type ReportRequest = main.ReportRequest;

export type JustificationItem = {
    traitName: string;
    traitGroupName: string;
    userChoice: string;
    taxonState: string;
    status: "match" | "conflict" | "neutral" | "unobserved";
}

export type Justification = {
    matches: JustificationItem[];
    conflicts: JustificationItem[];
    unobserved: JustificationItem[];
    matchCount: number;
    conflictCount: number;
}

export type HistoryItem = {
    traitName: string;
    selection: string;
    timestamp: number;
}

export async function getMatrix(): Promise<Matrix> {
  const m = await GetMatrix();
  return m as unknown as Matrix;
}

export async function getTaxonDetails(taxonId: string): Promise<Taxon | null> {
    try {
        const taxon = await GetTaxonDetails(taxonId);
        return taxon as unknown as Taxon;
    } catch (error) {
        console.error(`Failed to get details for taxon ${taxonId}:`, error);
        return null;
    }
}