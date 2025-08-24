// frontend/src/components/common/FormattedTaxonName.tsx
import React from 'react';
import { Box, Typography } from '@mui/material';
import { Taxon } from '../../api';

type Props = {
    taxon: Taxon,
    lang: 'ja' | 'en',
    typographyVariant?: any,
};

// 学名部分を整形して表示する内部コンポーネント
const ScientificNameDisplay: React.FC<{ taxon: Taxon, variant: any }> = ({ taxon, variant }) => {
    const build = () => {
        const parts: (string | JSX.Element)[] = [];
        if (taxon.genus) parts.push(<i key="g">{taxon.genus}</i>);
        if (taxon.subgenus) parts.push(<React.Fragment key="sg"> <i>({taxon.subgenus})</i></React.Fragment>);
        if (taxon.species) parts.push(<React.Fragment key="s"> <i>{taxon.species}</i></React.Fragment>);
        if (taxon.subspecies) parts.push(<React.Fragment key="ss"> <i>{taxon.subspecies}</i></React.Fragment>);
        
        if (parts.length > 0) {
            return parts.reduce((prev, curr, i) => i === 0 ? [curr] : [...prev, ' ', curr], [] as (string | JSX.Element)[]);
        }
        const higherRankName = taxon.subtribe || taxon.tribe || taxon.subfamily || taxon.family || taxon.superfamily || taxon.order;
        return higherRankName ? [higherRankName] : null;
    };
    const nameDisplay = build();

    if (!nameDisplay) return null;

    return (
        <>
            <Typography variant={variant} component="div" sx={{ lineHeight: 1.2 }}>
                {nameDisplay}
            </Typography>
            {taxon.taxonAuthor && (
                <Typography variant="body2" component="div" color="text.secondary" sx={{ pl: 2 }}>
                    {taxon.taxonAuthor}
                </Typography>
            )}
        </>
    );
};


export const FormattedTaxonName: React.FC<Props> = ({ taxon, lang, typographyVariant = "body1" }) => {

    // 1. 必要な情報を抽出
    const vernacularName = lang === 'ja'
        ? taxon.vernacularName_ja || taxon.vernacularName_en
        : taxon.vernacularName_en || taxon.vernacularName_ja;

    // 2. Rank列から対応する学名のキーを取得する
    const getRankKey = (rankStr: string | undefined): keyof Taxon | null => {
        if (!rankStr) return null;
        const lowerRank = rankStr.toLowerCase();
        const rankMap: { [key: string]: keyof Taxon } = {
            species: 'species', '種': 'species', subspecies: 'subspecies', '亜種': 'subspecies',
            genus: 'genus', '属': 'genus', subgenus: 'subgenus', '亜属': 'subgenus',
            tribe: 'tribe', '族': 'tribe', subtribe: 'subtribe', '亜族': 'subtribe',
            subfamily: 'subfamily', '亜科': 'subfamily', family: 'family', '科': 'family',
            superfamily: 'superfamily', '上科': 'superfamily', order: 'order', '目': 'order',
        };
        for (const key in rankMap) {
            if (lowerRank.includes(key)) return rankMap[key];
        }
        return null;
    };

    // 3. 表示ルールを決定するための条件を定義
    const targetRankKey = getRankKey(taxon.rank);
    const hasTargetRankName = targetRankKey ? !!taxon[targetRankKey] && (taxon[targetRankKey] as string).trim() !== '' : false;
    const hasScientificName = !!(taxon.genus || taxon.family || taxon.order || taxon.scientificName);

    // --- 表示ロジック ---

    // ルールA: Rank列で指定された学名が存在する場合 -> 学名を主、一般名を副として表示
    if (hasTargetRankName && hasScientificName) {
        return (
            <Box>
                <ScientificNameDisplay taxon={taxon} variant={typographyVariant} />
                {vernacularName && <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{vernacularName}</Typography>}
            </Box>
        );
    }

    // ルールB: ルールAに当てはまらず、一般名が存在する場合 -> 一般名を主として表示
    if (vernacularName) {
        return <Typography variant={typographyVariant} component="div">{vernacularName}</Typography>;
    }

    // ルールC: 上記に当てはまらず、何らかの学名情報が存在する場合 -> 学名を表示
    if(hasScientificName){
        return <ScientificNameDisplay taxon={taxon} variant={typographyVariant} />
    }

    // 最終フォールバック: TaxonIDを表示
    return <Typography variant={typographyVariant} component="div">{taxon.id}</Typography>;
};