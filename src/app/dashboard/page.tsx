import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AppLayout from "@/components/app-layout";
import { getDeals, getDealContacts, getPipelineStages } from "@/lib/hubspot";
import { scoreDeal, sortByRisk } from "@/lib/scoring";

const STATE_CONFIG = {
  healthy:     { label: "Healthy",     bg: "#E8F6EE", color: "#15824B", dot: "#18A05B" },
  stalling:    { label: "Stalling",    bg: "#FBF1E0", color: "#B45309", dot: "#D97706" },
  chase_now:   { label: "Chase now",   bg: "#FCEDE9", color: "#C53A1B", dot: "#E0532B" },
  likely_dead: { label: "Likely dead", bg: "#F1F1F3", color: "#6B7280", dot: "#9CA3AF" },
} as const;

const FLAG_LABELS: Record<string, string> = {
  days_silent: "Silent 7d+", close_date_past: "Close date past", single_threaded: "Single contact",
};

function fmt(n: number | null) {
  if (!n) return "—";
  return "€" + new Intl.NumberFormat("de-DE").format(n);
}

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const hasToken = !!process.env.HUBSPOT_ACCESS_TOKEN;

  let deals = null;
  let error = null;
  let stages: Record<string, string> = {};

  if (hasToken) {
    try {
      const [rawDeals, stageMap] = await Promise.all([getDeals(), getPipelineStages()]);
      stages = stageMap;
      const scored = await Promise.all(
        rawDeals.map(async (d) => {
          const contacts = await getDealContacts(d.id);
          return scoreDeal(d, contacts.length);
        })
      );
      deals = sortByRisk(scored);
    } catch (e: any) {
      error = e.message;
    }
  }

  const atRisk = deals ? deals.filter((d) => d.state === "chase_now" || d.state === "likely_dead").length : 0;
  const pipeline = deals ? deals.reduce((s, d) => s + (d.amount ?? 0), 0) : 0;

  const STATS = [
    { label: "Active deals",   value: deals ? String(deals.length) : "—", sub: "in pipeline" },
    { label: "Pipeline value", value: deals ? fmt(pipeline) : "—",        sub: "total open" },
    { label: "At risk",        value: String(atRisk),                      sub: "need attention", accent: atRisk > 0 },
    { label: "Nudges sent",    value: "0",                                 sub: "this week" },
  ];

  return (
    <AppLayout userEmail={user.email} userName={user.user_metadata?.full_name}>
      <div style={{ padding: "32px 36px" }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#18181B", letterSpacing: "-0.02em", margin: 0 }}>Pipeline overview</h1>
          <p style={{ fontSize: 13.5, color: "#71717A", marginTop: 4, marginBottom: 0 }}>
            {deals ? `${deals.length} deals synced from HubSpot` : "Connect HubSpot to see your pipeline"}
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          {STATS.map((s) => (
            <div key={s.label} style={{ background: "#fff", border: "1px solid #EBEBEB", borderRadius: 12, padding: "18px 20px" }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: s.accent ? "#E0532B" : "#18181B", letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>{s.value}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#27272A", marginTop: 4 }}>{s.label}</div>
              <div style={{ fontSize: 12, color: "#A1A1AA", marginTop: 2 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "14px 18px", marginBottom: 20, fontSize: 13, color: "#B91C1C" }}>
            HubSpot error: {error}
          </div>
        )}

        {/* No token */}
        {!hasToken && (
          <div style={{ background: "#fff", border: "1px solid #EBEBEB", borderRadius: 12, padding: "40px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#18181B", marginBottom: 8 }}>HubSpot not connected</div>
            <div style={{ fontSize: 13.5, color: "#71717A", marginBottom: 20 }}>Add your HubSpot access token to start tracking deals.</div>
            <a href="/connections" style={{ background: "#4F46E5", color: "#fff", borderRadius: 8, padding: "9px 20px", fontSize: 13.5, fontWeight: 600, textDecoration: "none" }}>Go to Connections</a>
          </div>
        )}

        {/* Deal table */}
        {deals && deals.length > 0 && (
          <div style={{ background: "#fff", border: "1px solid #EBEBEB", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #F1F1F2", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#18181B" }}>Deals · sorted by risk</span>
              <span style={{ fontSize: 12, color: "#A1A1AA" }}>{deals.length} deals</span>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #F1F1F2" }}>
                  {["Deal", "Stage", "Amount", "Close", "Last touch", "Status", "Flags"].map((h) => (
                    <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#A1A1AA", letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {deals.map((deal, i) => {
                  const cfg = STATE_CONFIG[deal.state];
                  const stageName = stages[deal.stage] ?? deal.stage;
                  return (
                    <tr key={deal.id} style={{ borderBottom: i < deals.length - 1 ? "1px solid #F4F4F5" : "none" }}>
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
        )}

        {deals && deals.length === 0 && (
          <div style={{ background: "#fff", border: "1px solid #EBEBEB", borderRadius: 12, padding: "40px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 14, color: "#71717A" }}>No deals found in HubSpot.</div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
