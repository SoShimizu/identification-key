// frontend/src/components/HistoryLog.tsx
import React from "react";
import { Paper, Box, Typography, Table, TableHead, TableRow, TableCell, TableContainer, TableBody } from "@mui/material";

export default function HistoryLog({ items }: { items: { t: number; text: string; gain?: number }[] }) {
  return (
    <Paper sx={{ p: 1.5, display: "flex", flexDirection: "column", height: "100%" }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
        <Typography variant="h6">選択履歴</Typography>
      </Box>
      <TableContainer sx={{ flex: 1 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 140 }}>時刻</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((h, i) => (
              <TableRow key={i}>
                <TableCell sx={{ whiteSpace: "nowrap" }}>{new Date(h.t).toLocaleTimeString()}</TableCell>
                <TableCell sx={{ whiteSpace: "nowrap" }}>{h.text}</TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={2} sx={{ color: "text.secondary" }}>
                  （操作するとここに履歴がたまります）
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
