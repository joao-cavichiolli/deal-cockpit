"use client";

import { useState } from "react";

const STATE_CONFIG = {
  healthy:     { label: "Healthy",     bg: "#E8F6EE", color: "#15824B", dot: "#18A05B" },
  stalling:    { label: "Stalling",    bg: "#FBF1E0", color: "#B45309", dot: "#D97706" },
  chase_now:   { label: "Chase now",   bg: "#FCEDE9", color: "#C53A1B", dot: "#E0532B" },
  likely_dead: { label: "Likely dead", bg: "#F1F1F3", color: "#6B7280", dot: "#9CA3AF" },
} as const;

const FLAG_LABELS: Record<string, string> = {
  days_silent: "Silent 7d+", close_date_past: "Close date past",
  single_threaded: "Single contact", no_next_step: "No next step",
};

function fmt(n: number | null) {
  if (!n) return "—";
  return "€" + new Intl.NumberFormat("de-DE").format(n);
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

interface Deal {
  id: string;
  name: string;
  stage: string;
  amount: number | null;
  close_date: string | null;
  days_silent: number;
  state: string;
  flags: string[];
}

interface Props {
  deals: Deal[];
  stages: Record<string, string>;
}

const sel: React.CSSProperties = {
  background: "#fff", border: "1px solid #EBEBEB", borderRadius: 7,
  padding: "5px 10px", fontSize: 12.5, color: "#27272A", cursor: "pointer", outline: "none",
};

export default function DealsTable({ deals, stages }: Props) {
  const [statusFilter, setStatusFilter] = useState("all");
  const [stageFilter, setStageFilter] = useState("all");
  const [search, setSearch] = useState("");

  const uniqueStages = Array.from(new Set(deals.map((d) => stages[d.stage] ?? d.stage).filter(Boolean))).sort();

  const filtered = deals.filter((d) => {
    if (statusFilter !== "all" && d.state !== statusFilter) return false;
    if (stageFilter !== "all" && (stages[d.stage] ?? d.stage) !== stageFilter) return false;
    if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div style={{ background: "#fff", border: "1px solid #EBEBEB", borderRadius: 12, overflow: "hidden" }}>
      {/* Toolbar */}
      <div style={{ padding: "14px 20px", borderBottom: "1px solid #F1F1F2", display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#18181B", flex: 1 }}>Deals · sorted by risk</span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search deal…"
          style={{ ...sel, width: 160 }}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={sel}>
          <option value="all">All statuses</option>
          <option value="likely_dead">Likely dead</option>
          <option value="chase_now">Chase now</option>
          <option value="stalling">Stalling</option>
          <option value="healthy">Healthy</option>
        </select>
        <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} style={sel}>
          <option value="all">All stages</option>
          {uniqueStages.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <span style={{ fontSize: 12, color: "#A1A1AA" }}>{filtered.length} deals</span>
      </div>

      {/* Table */}
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #F1F1F2" }}>
            {["Deal", "Stage", "Amount", "Close", "Last touch", "Status", "Flags"].map((h) => (
              <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#A1A1AA", letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 && (
            <tr><td colSpan={7} style={{ padding: "32px 16px", textAlign: "center", fontSize: 13, color: "#A1A1AA" }}>No deals match the filters.</td></tr>
          )}
          {filtered.map((deal, i) => {
            const cfg = STATE_CONFIG[deal.state as keyof typeof STATE_CONFIG];
            const stageName = stages[deal.stage] ?? deal.stage;
            return (
              <tr key={deal.id} style={{ borderBottom: i < filtered.length - 1 ? "1px solid #F4F4F5" : "none" }}>
                <td style={{ padding: "13px 16px", fontSize: 13.5, fontWeight: 500, color: "#18181B", maxWidth: 220 }}>
                  <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{deal.name}</div>
                </td>
                <td style={{ padding: "13px 16px", fontSize: 13, color: "#52525B" }}>{stageName || "—"}</td>
                <td style={{ padding: "13px 16px", fontSize: 13, fontWeight: 600, color: "#27272A", fontVariantNumeric: "tabular-nums" }}>{fmt(deal.amount)}</td>
                <td style={{ padding: "13px 16px", fontSize: 13, color: "#52525B" }}>{fmtDate(deal.close_date)}</td>
                <td style={{ padding: "13px 16px", fontSize: 13, color: deal.days_silent >= 7 ? "#E0532B" : "#52525B" }}>
                  {deal.days_silent >= 999 ? "Never" : `${deal.days_silent}d ago`}
                </td>
                <td style={{ padding: "13px 16px" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: cfg.bg, color: cfg.color, borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
                    {cfg.label}
                  </span>
                </td>
                <td style={{ padding: "13px 16px" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {deal.flags.map((f) => (
                      <span key={f} style={{ fontSize: 11, background: "#F4F4F5", color: "#71717A", borderRadius: 4, padding: "2px 7px", border: "1px solid #EBEBEB" }}>{FLAG_LABELS[f] ?? f}</span>
                    ))}
                    {deal.flags.length === 0 && <span style={{ fontSize: 11, color: "#A1A1AA" }}>—</span>}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
