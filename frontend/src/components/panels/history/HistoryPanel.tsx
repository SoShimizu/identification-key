import React from "react";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Table from "@mui/material/Table";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableBody from "@mui/material/TableBody";
import TableContainer from "@mui/material/TableContainer";

type HistoryItem = { t: number; text: string; gain?: number };

export default function HistoryPanel({
  title = "選択履歴",
  items = [],
}: {
  title?: string;
  items: HistoryItem[];
}) {
  return (
    <Paper sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ px: 2, py: 1 }}>
        <Typography variant="h6">{title}</Typography>
      </Box>
      <TableContainer sx={{ flex: 1 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 140 }}>時刻</TableCell>
              <TableCell>操作</TableCell>
              <TableCell sx={{ width: 90 }}>ΔInfo</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((h, i) => (
              <TableRow key={i} hover>
                <TableCell>{new Date(h.t).toLocaleTimeString()}</TableCell>
                <TableCell>{h.text}</TableCell>
                <TableCell>{h.gain != null ? h.gain.toFixed(3) : "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
