import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AppLayout from "@/components/app-layout";

const DEALS = [
  { name: "Acme Corp — Enterprise", stage: "Proposal Sent", amount: "€85,000", close: "Jun 30", state: "chase_now", flags: ["days_silent", "proposal_silence", "close_date_past"], contacts: 1 },
  { name: "Nordex GmbH — Platform", stage: "Negotiation", amount: "€62,000", close: "Jul 15", state: "stalling", flags: ["days_silent", "no_next_step"], contacts: 2 },
  { name: "BlueSky SaaS — Starter", stage: "Demo Done", amount: "€18,500", close: "Jul 31", state: "healthy", flags: [], contacts: 3 },
  { name: "Meridian Co — Pro", stage: "Contacted", amount: "€94,000", close: "Jun 14", state: "likely_dead", flags: ["days_silent", "close_date_past", "single_threaded"], contacts: 1 },
  { name: "Vertex Labs — Growth", stage: "Proposal Sent", amount: "€33,500", close: "Jul 20", state: "stalling", flags: ["no_next_step"], contacts: 2 },
];

const STATE_CONFIG = {
  healthy:     { label: "Healthy",     bg: "#E8F6EE", color: "#15824B", dot: "#18A05B" },
  stalling:    { label: "Stalling",    bg: "#FBF1E0", color: "#B45309", dot: "#D97706" },
  chase_now:   { label: "Chase now",   bg: "#FCEDE9", color: "#C53A1B", dot: "#E0532B" },
  likely_dead: { label: "Likely dead", bg: "#F1F1F3", color: "#6B7280", dot: "#9CA3AF" },
} as const;

const FLAG_LABELS: Record<string, string> = {
  days_silent: "Silent 7d+", proposal_silence: "Proposal ignored",
  no_next_step: "No next step", close_date_past: "Close date past", single_threaded: "Single contact",
};

const STATS = [
  { label: "Active deals",   value: "5",     sub: "in pipeline" },
  { label: "Pipeline value", value: "€293k", sub: "total open" },
  { label: "At risk",        value: "3",     sub: "need attention", accent: true },
  { label: "Nudges sent",    value: "4",     sub: "this week" },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  return (
    <AppLayout userEmail={user.email} userName={user.user_metadata?.full_name}>
      <div style={{ padding: "32px 36px" }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#18181B", letterSpacing: "-0.02em", margin: 0 }}>Pipeline overview</h1>
          <p style={{ fontSize: 13.5, color: "#71717A", marginTop: 4, marginBottom: 0 }}>Week of Jun 23 · last synced 2h ago</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 28 }}>
          {STATS.map((s) => (
            <div key={s.label} style={{ background: "#fff", border: "1px solid #EBEBEB", borderRadius: 12, padding: "18px 20px" }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: s.accent ? "#E0532B" : "#18181B", letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>{s.value}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#27272A", marginTop: 4 }}>{s.label}</div>
              <div style={{ fontSize: 12, color: "#A1A1AA", marginTop: 2 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ background: "#fff", border: "1px solid #EBEBEB", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #F1F1F2", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#18181B" }}>Deals · sorted by risk</span>
            <span style={{ fontSize: 12, color: "#A1A1AA" }}>5 deals</span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #F1F1F2" }}>
                {["Deal", "Stage", "Amount", "Close", "Status", "Flags", "Contacts"].map((h) => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#A1A1AA", letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DEALS.map((deal, i) => {
                const cfg = STATE_CONFIG[deal.state as keyof typeof STATE_CONFIG];
                return (
                  <tr key={i} style={{ borderBottom: i < DEALS.length - 1 ? "1px solid #F4F4F5" : "none" }}>
                    <td style={{ padding: "13px 16px", fontSize: 13.5, fontWeight: 500, color: "#18181B" }}>{deal.name}</td>
                    <td style={{ padding: "13px 16px", fontSize: 13, color: "#52525B" }}>{deal.stage}</td>
                    <td style={{ padding: "13px 16px", fontSize: 13, fontWeight: 600, color: "#27272A", fontVariantNumeric: "tabular-nums" }}>{deal.amount}</td>
                    <td style={{ padding: "13px 16px", fontSize: 13, color: "#52525B" }}>{deal.close}</td>
                    <td style={{ padding: "13px 16px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: cfg.bg, color: cfg.color, borderRadius: 20, padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>
                        <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
                        {cfg.label}
                      </span>
                    </td>
                    <td style={{ padding: "13px 16px" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {deal.flags.map((f) => (
                          <span key={f} style={{ fontSize: 11, background: "#F4F4F5", color: "#71717A", borderRadius: 4, padding: "2px 7px", border: "1px solid #EBEBEB" }}>{FLAG_LABELS[f]}</span>
                        ))}
                        {deal.flags.length === 0 && <span style={{ fontSize: 11, color: "#A1A1AA" }}>—</span>}
                      </div>
                    </td>
                    <td style={{ padding: "13px 16px", fontSize: 13, color: "#52525B" }}>{deal.contacts}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
}
