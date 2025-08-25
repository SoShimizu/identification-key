// soshimizu/key-testa/key-testA-eececee799c6cbc1a9ab195da73ad52495f23149/frontend/src/components/tabs/matrix/gui/EntityList.tsx

import React, { useMemo, useRef, useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Button,
  Collapse,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';

import { TaxonInfoItem, TraitInfoItem, groupTraits } from '../matrixUtils';

// 学名らしきものをイタリックにするシンプルなコンポーネント
const SimpleTaxonName: React.FC<{ name: string }> = ({ name }) => {
  const isScientific = /^[A-Z][a-z]+ [a-z]+/.test(name);
  return (
    <Typography component="span" sx={{ fontStyle: isScientific ? 'italic' : 'normal' }}>
      {name}
    </Typography>
  );
};

interface EntityListProps {
  taxa: TaxonInfoItem[];
  traits: TraitInfoItem[];
  selectedItem: { type: 'taxon' | 'trait'; index: number } | null;
  onSelectItem: (type: 'taxon' | 'trait', index: number) => void;
  onAddItem: (type: 'taxon' | 'trait') => void;
  onRemoveItem: (type: 'taxon' | 'trait', index: number) => void;
}

export const EntityList: React.FC<EntityListProps> = ({
  taxa,
  traits,
  selectedItem,
  onSelectItem,
  onAddItem,
  onRemoveItem,
}) => {
  const [tab, setTab] = useState<'taxa' | 'traits'>('taxa');
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

  // タブごとのスクロール位置を保持
  const scrollBoxRef = useRef<HTMLDivElement | null>(null);
  const scrollPosRef = useRef<{ taxa: number; traits: number }>({ taxa: 0, traits: 0 });

  const groupedTraits = useMemo(() => groupTraits(traits), [traits]);
  const sortedGroupNames = useMemo(() => Array.from(groupedTraits.keys()).sort(), [groupedTraits]);

  const handleGroupClick = (groupName: string) => {
    const next = new Set(openGroups);
    next.has(groupName) ? next.delete(groupName) : next.add(groupName);
    setOpenGroups(next);
  };

  const handleTabChange = (_e: React.SyntheticEvent, newValue: 'taxa' | 'traits') => {
    // 現タブのスクロール位置を保存
    if (scrollBoxRef.current) {
      scrollPosRef.current[tab] = scrollBoxRef.current.scrollTop;
    }
    setTab(newValue);
    // 次フレームで復元
    requestAnimationFrame(() => {
      if (scrollBoxRef.current) {
        scrollBoxRef.current.scrollTop = scrollPosRef.current[newValue] ?? 0;
      }
    });
  };

  const handleScroll: React.UIEventHandler<HTMLDivElement> = () => {
    if (scrollBoxRef.current) {
      scrollPosRef.current[tab] = scrollBoxRef.current.scrollTop;
    }
  };

  const handleRemoveClick = (e: React.MouseEvent, type: 'taxon' | 'trait', index: number) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete this ${type}?`)) {
      onRemoveItem(type, index);
    }
  };

  const renderTraitsList = () => (
    <List component="nav" sx={{ p: 0 }}>
      {sortedGroupNames.map((groupName) => (
        <React.Fragment key={groupName}>
          <ListItemButton onClick={() => handleGroupClick(groupName)}>
            <ListItemText
              primary={groupName}
              primaryTypographyProps={{ fontWeight: 'bold', color: 'text.secondary' }}
            />
            {openGroups.has(groupName) ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
          <Collapse in={openGroups.has(groupName)} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {groupedTraits.get(groupName)?.map((trait) => (
                <ListItem
                  key={trait.rowIndex}
                  disablePadding
                  sx={{ pl: 2 }}
                  secondaryAction={
                    <Tooltip title="Delete Trait">
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={(e) => handleRemoveClick(e, 'trait', trait.rowIndex)}
                        size="small"
                      >
                        <RemoveCircleOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  }
                >
                  <ListItemButton
                    selected={selectedItem?.type === 'trait' && selectedItem.index === trait.rowIndex}
                    onClick={() => onSelectItem('trait', trait.rowIndex)}
                  >
                    <ListItemText
                      primary={trait.name}
                      secondary={trait.id}
                      primaryTypographyProps={{
                        style: { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
                      }}
                      secondaryTypographyProps={{
                        fontSize: '0.75rem',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Collapse>
        </React.Fragment>
      ))}
    </List>
  );

  const renderTaxaList = () => (
    <List sx={{ p: 0 }}>
      {taxa.map((taxonItem) => (
        <ListItem
          key={taxonItem.rowIndex}
          disablePadding
          secondaryAction={
            <Tooltip title="Delete Taxon">
              <IconButton
                edge="end"
                aria-label="delete"
                onClick={(e) => handleRemoveClick(e, 'taxon', taxonItem.rowIndex)}
              >
                <RemoveCircleOutlineIcon />
              </IconButton>
            </Tooltip>
          }
        >
          <ListItemButton
            selected={selectedItem?.type === 'taxon' && selectedItem.index === taxonItem.rowIndex}
            onClick={() => onSelectItem('taxon', taxonItem.rowIndex)}
          >
            <ListItemText
              primary={<SimpleTaxonName name={taxonItem.name} />}
              secondary={`ID: ${taxonItem.id}`}
            />
          </ListItemButton>
        </ListItem>
      ))}
    </List>
  );

  return (
    <Box
      sx={{
        borderRight: 1,
        borderColor: 'divider',
        height: '100%',
        // ★ Gridで「ヘッダー/中央/フッター」の3行に分ける
        display: 'grid',
        gridTemplateRows: 'auto 1fr auto',
        minHeight: 0,
      }}
    >
      {/* ヘッダー（固定） */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tab} onChange={handleTabChange} variant="fullWidth">
          <Tab label={`Taxa (${taxa.length})`} value="taxa" />
          <Tab label={`Traits (${traits.length})`} value="traits" />
        </Tabs>
      </Box>

      {/* 中央（スクロール） */}
      <Box
        ref={scrollBoxRef}
        onScroll={handleScroll}
        sx={{
          overflowY: 'auto',
          minHeight: 0, // ← これが効くと 1fr の中だけスクロール
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {tab === 'taxa' ? renderTaxaList() : renderTraitsList()}
      </Box>

      {/* フッター（固定） */}
      <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider' }}>
        <Tooltip title={`Add New ${tab === 'taxa' ? 'Taxon' : 'Trait'}`}>
          <Button
            startIcon={<AddCircleOutlineIcon />}
            onClick={() => onAddItem(tab === 'taxa' ? 'taxon' : 'trait')}
            fullWidth
          >
            Add New {tab === 'taxa' ? 'Taxon' : 'Trait'}
          </Button>
        </Tooltip>
      </Box>
    </Box>
  );
};

export default EntityList;
