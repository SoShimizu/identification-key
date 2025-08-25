import { MatrixData } from "../../../types";

export interface TaxonInfoItem {
  id: string;
  name: string;
  rowData: string[];
  rowIndex: number;
}

export interface TraitInfoItem {
  id:string;
  name: string;
  group: string;
  rowData: string[];
  rowIndex: number;
}

const findTaxonColumnIndices = (headerRow: string[]): { idIndex: number; nameIndex: number } => {
  const idIndex = headerRow.findIndex(h => h.trim() === '#TaxonID');
  const nameIndex = headerRow.findIndex(h => h.trim() === 'Name');
  return { 
    idIndex: idIndex === -1 ? 0 : idIndex,
    nameIndex: nameIndex === -1 ? 1 : nameIndex
  };
};

const findTraitColumnIndices = (headerRow: string[]): { idIndex: number; nameIndex: number; groupIndex: number; allowedValuesIndex: number; } => {
    let nameIndex = headerRow.findIndex(h => h.trim() === '#Trait_en');
    if (nameIndex === -1) { nameIndex = headerRow.findIndex(h => h.trim() === '#Trait_jp'); }
    if (nameIndex === -1) { nameIndex = headerRow.findIndex(h => h.trim() === 'Name'); }

    const idIndex = headerRow.findIndex(h => h.trim() === '#TraitID');
    const groupIndex = headerRow.findIndex(h => h.trim() === '#Group_en');
    const allowedValuesIndex = headerRow.findIndex(h => h.trim() === '#AllowedValues');
    
    return {
        idIndex: idIndex === -1 ? 0 : idIndex,
        nameIndex: nameIndex === -1 ? 1 : nameIndex,
        groupIndex: groupIndex === -1 ? 2 : groupIndex,
        allowedValuesIndex: allowedValuesIndex,
    };
};

export const parseTaxaInfo = (taxaInfo: string[][]): TaxonInfoItem[] => {
  if (!taxaInfo || taxaInfo.length < 2) return [];
  const header = taxaInfo[0];
  const { idIndex, nameIndex } = findTaxonColumnIndices(header);
  return taxaInfo.slice(1).map((row, index) => ({
    id: row[idIndex] || `taxon_${index}`,
    name: row[nameIndex] || row[idIndex] || '',
    rowData: row, rowIndex: index + 1,
  }));
};

export const parseTraits = (traits: string[][]): TraitInfoItem[] => {
    if (!traits || traits.length < 2) return [];
    const header = traits[0];
    const { idIndex, nameIndex, groupIndex } = findTraitColumnIndices(header);
    return traits.slice(1).map((row, index) => {
        const id = row[idIndex] || `trait_${index}`;
        const name = (row[nameIndex] && row[nameIndex].trim() !== '') ? row[nameIndex] : id;
        return {
            id: id, name: name, group: row[groupIndex] || 'Ungrouped',
            rowData: row, rowIndex: index + 1,
        };
    });
};

export const getUniqueTraitStates = (matrixData: MatrixData, traitRowIndex: number, allTaxonIDs: Set<string>): string[] => {
    const traitsHeader = matrixData.traits[0] || [];
    const traitRow = matrixData.traits[traitRowIndex] || [];
    const states = new Set<string>();
    traitsHeader.forEach((header, colIndex) => {
        if (allTaxonIDs.has(header.trim())) {
            const state = traitRow[colIndex];
            if (state && state.trim() !== '') {
                state.split(';').forEach(s => states.add(s.trim()));
            }
        }
    });
    return Array.from(states).sort();
};

export const groupTraits = (traits: TraitInfoItem[]): Map<string, TraitInfoItem[]> => {
    const grouped = new Map<string, TraitInfoItem[]>();
    traits.forEach(trait => {
        const group = trait.group || 'Ungrouped';
        if (!grouped.has(group)) { grouped.set(group, []); }
        grouped.get(group)!.push(trait);
    });
    return grouped;
};

// --- ★ここから下を全て追加 ---
/**
 * Traitsシートから特定のTaxonとTraitに対応する状態値を取得する
 * @param traitsSheet - Traitsシートの二次元配列
 * @param traitRowIndex - 形質の行インデックス
 * @param taxonId - 分類群のID
 * @returns 状態値の文字列と、その値が存在する列のインデックス
 */
export const getStateValue = (traitsSheet: string[][], traitRowIndex: number, taxonId: string): { value: string, colIndex: number } => {
    const header = traitsSheet[0] || [];
    const traitRow = traitsSheet[traitRowIndex] || [];
    
    const colIndex = header.findIndex(h => h.trim() === taxonId);

    if (colIndex === -1) {
        return { value: '', colIndex: -1 }; // 対応するTaxon列が見つからない
    }
    
    return { value: traitRow[colIndex] || '', colIndex: colIndex };
};