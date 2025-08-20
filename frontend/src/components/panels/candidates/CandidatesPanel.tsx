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

export type EngineScore = {
  rank?: number;
  taxon: { id?: string; name: string };
  post?: number;
  delta?: number;
  used?: number;
  conflicts?: number;
  match?: number;
  support?: number;
};

export default function CandidatesPanel({
  title, rows, totalTaxa, showMatchSupport = false,
}: {
  title?: string;
  rows: EngineScore[];
  totalTaxa: number;
  showMatchSupport?: boolean;
}) {
  return (
    <Paper sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ px: 2, py: 1 }}>
        <Typography variant="h6">{title || "候補タクサ"}</Typography>
        <Typography variant="caption" color="text.secondary">{rows?.length ?? 0}/{totalTaxa}</Typography>
      </Box>

      <TableContainer sx={{ flex: 1 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 56 }}>#</TableCell>
              <TableCell>Name</TableCell>
              <TableCell sx={{ width: 94 }}>Post</TableCell>
              <TableCell sx={{ width: 94 }}>Δ</TableCell>
              <TableCell sx={{ width: 80 }}>Used</TableCell>
              <TableCell sx={{ width: 72 }}>Conf</TableCell>
              {showMatchSupport && <TableCell sx={{ width: 110 }}>Match/Support</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {(rows || []).map((r, i) => (
              <TableRow key={r.taxon?.id ?? `${i}-${r.taxon?.name}`} hover>
                <TableCell>{r.rank ?? i + 1}</TableCell>
                <TableCell>{r.taxon?.name}</TableCell>
                <TableCell>{(r.post ?? 0).toFixed(6)}</TableCell>
                <TableCell>{(r.delta ?? 0).toFixed(6)}</TableCell>
                <TableCell>{r.used ?? 0}</TableCell>
                <TableCell>{r.conflicts ?? 0}</TableCell>
                {showMatchSupport && <TableCell>{(r.match ?? 0)}/{(r.support ?? 0)}</TableCell>}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
