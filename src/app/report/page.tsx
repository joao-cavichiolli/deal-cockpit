import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AppLayout from "@/components/app-layout";
import { getDeals, getDealContacts } from "@/lib/hubspot";
import { scoreDeal, sortByRisk } from "@/lib/scoring";

const STATE_CONFIG = {
  healthy:     { label: "Healthy",     bg: "#E8F6EE", color: "#15824B" },
  stalling:    { label: "Stalling",    bg: "#FBF1E0", color: "#B45309" },
  chase_now:   { label: "Chase now",   bg: "#FCEDE9", color: "#C53A1B" },
  likely_dead: { label: "Likely dead", bg: "#F1F1F3", color: "#6B7280" },
} as const;

function riskReason(state: string, daysSilent: number, flags: string[]): string {
  const parts: string[] = [];
  if (daysSilent >= 7 && daysSilent < 999) parts.push(`No contact in ${daysSilent} days.`);
  if (daysSilent >= 999) parts.push("Never contacted.");
  if (flags.includes("close_date_past")) parts.push("Close date passed.");
  if (flags.includes("single_threaded")) parts.push("Single-threaded.");
  if (flags.includes("no_next_step")) parts.push("No next step defined.");
  return parts.join(" ") || "Needs attention.";
}

const today = new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

export default async function ReportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const hasToken = !!process.env.HUBSPOT_ACCESS_TOKEN;
  let atRisk: any[] = [];

  if (hasToken) {
    try {
      const rawDeals = await getDeals();
      const scored = await Promise.all(
        rawDeals.map(async (d) => {
          const contacts = await getDealContacts(d.id);
          return scoreDeal(d, contacts.length);
        })
      );
      atRisk = sortByRisk(scored).filter((d) => d.state !== "healthy").slice(0, 10);
    } catch {}
  }

  return (
    <AppLayout userEmail={user.email} userName={user.user_metadata?.full_name}>
      <div style={{ padding: "32px 36px", maxWidth: 720 }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#18181B", letterSpacing: "-0.02em", margin: 0 }}>Weekly report</h1>
          <p style={{ fontSize: 13.5, color: "#71717A", marginTop: 4, marginBottom: 0 }}>Generated {today} · sent to {user.email}</p>
        </div>

        <div style={{ background: "#fff", border: "1px solid #EBEBEB", borderRadius: 14, overflow: "hidden" }}>
          {/* Email header */}
          <div style={{ padding: "22px 28px", borderBottom: "1px solid #F1F1F2", background: "#FAFAFA" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#18181B", letterSpacing: "-0.02em", marginBottom: 12 }}>Deal Cockpit · Weekly Pipeline Report</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {[
                ["From", "Deal Cockpit <noreply@dealcockpit.io>"],
                ["To",   user.email ?? ""],
                ["Date", today],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", gap: 8, fontSize: 12.5 }}>
                  <span style={{ color: "#A1A1AA", width: 36, flexShrink: 0 }}>{k}</span>
                  <span style={{ color: "#52525B" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Email body */}
          <div style={{ padding: "28px 28px" }}>
            <p style={{ fontSize: 14, color: "#3F3F46", margin: "0 0 24px 0", lineHeight: 1.6 }}>
              Hi there — here&apos;s your weekly pipeline snapshot.
              {atRisk.length > 0
                ? <> You have <strong>{atRisk.length} deals at risk</strong> this week.</>
                : <> All your deals look healthy this week 🎉</>
              }
            </p>

            {atRisk.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#A1A1AA", marginBottom: 12 }}>At risk</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {atRisk.map((d) => {
                    const cfg = STATE_CONFIG[d.state as keyof typeof STATE_CONFIG];
                    return (
                      <div key={d.id} style={{ border: "1px solid #EBEBEB", borderRadius: 10, padding: "14px 16px", display: "flex", gap: 14, alignItems: "flex-start" }}>
                        <span style={{ background: cfg.bg, color: cfg.color, borderRadius: 6, padding: "3px 9px", fontSize: 11.5, fontWeight: 600, flexShrink: 0, marginTop: 1 }}>{cfg.label}</span>
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: "#18181B", marginBottom: 3 }}>{d.name}</div>
                          <div style={{ fontSize: 13, color: "#71717A" }}>{riskReason(d.state, d.days_silent, d.flags)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ padding: "14px 16px", background: "#F4F4F5", borderRadius: 10, fontSize: 13, color: "#71717A" }}>
              Nudge emails will appear here after the first automated run.
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
