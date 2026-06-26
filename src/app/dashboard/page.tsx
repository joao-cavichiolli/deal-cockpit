import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AppLayout from "@/components/app-layout";
import { getDeals, getDealContacts, getPipelineStages } from "@/lib/hubspot";
import { scoreDeal, sortByRisk } from "@/lib/scoring";
import DealsTable from "./deals-table";

function fmt(n: number | null) {
  if (!n) return "—";
  return "€" + new Intl.NumberFormat("de-DE").format(n);
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
        {/* Morning header */}
        <div style={{ background: "#fff", border: "1px solid #EBEBEB", borderRadius: 12, padding: "18px 22px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, color: "#A1A1AA", marginBottom: 4 }}>
              {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })} · Lisbon
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#18181B", letterSpacing: "-0.02em" }}>
              Good morning, {user.user_metadata?.full_name?.split(" ")[0] ?? user.email?.split("@")[0]}
            </div>
            <div style={{ fontSize: 13.5, color: "#71717A", marginTop: 3 }}>
              {deals
                ? `Your pipeline has ${deals.length} open deals — ${atRisk} need a move.`
                : "Connect HubSpot to see your pipeline."}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 20, flexShrink: 0 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 500, color: "#15824B" }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#18A05B" }} />
              Auto-send on
            </span>
            <span style={{ fontSize: 13, color: "#A1A1AA" }}>Next run Mon 10:00</span>
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "#18181B", margin: 0 }}>Pipeline overview</h2>
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

        {error && (
          <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "14px 18px", marginBottom: 20, fontSize: 13, color: "#B91C1C" }}>
            HubSpot error: {error}
          </div>
        )}

        {!hasToken && (
          <div style={{ background: "#fff", border: "1px solid #EBEBEB", borderRadius: 12, padding: "40px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#18181B", marginBottom: 8 }}>HubSpot not connected</div>
            <div style={{ fontSize: 13.5, color: "#71717A", marginBottom: 20 }}>Add your HubSpot access token to start tracking deals.</div>
            <a href="/connections" style={{ background: "#4F46E5", color: "#fff", borderRadius: 8, padding: "9px 20px", fontSize: 13.5, fontWeight: 600, textDecoration: "none" }}>Go to Connections</a>
          </div>
        )}

        {deals && deals.length === 0 && (
          <div style={{ background: "#fff", border: "1px solid #EBEBEB", borderRadius: 12, padding: "40px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 14, color: "#71717A" }}>No open deals found in HubSpot.</div>
          </div>
        )}

        {deals && deals.length > 0 && (
          <DealsTable deals={deals} stages={stages} />
        )}
      </div>
    </AppLayout>
  );
}
