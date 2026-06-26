import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AppLayout from "@/components/app-layout";

const AT_RISK = [
  { name: "Acme Corp — Enterprise", reason: "Proposal sent 9 days ago, no reply. Close date passed.", state: "chase_now" },
  { name: "Meridian Co — Pro",       reason: "No contact in 21 days. Single-threaded. Close date passed.", state: "likely_dead" },
  { name: "Nordex GmbH — Platform",  reason: "No next step defined. Last touch 8 days ago.",           state: "stalling" },
];

const NUDGES_SENT = [
  { deal: "Acme Corp — Enterprise",   to: "sarah.chen@acmecorp.com",  subject: "Re: Enterprise proposal — quick check-in" },
  { deal: "Meridian Co — Pro",         to: "james@meridian.co",         subject: "Still interested in Meridian's growth goals?" },
  { deal: "Nordex GmbH — Platform",   to: "m.weber@nordex.de",         subject: "Next steps for Nordex platform rollout" },
  { deal: "Vertex Labs — Growth",     to: "alex@vertexlabs.io",        subject: "Vertex Labs — defining next steps together" },
];

const STATE_CONFIG = {
  healthy:     { label: "Healthy",     bg: "#E8F6EE", color: "#15824B" },
  stalling:    { label: "Stalling",    bg: "#FBF1E0", color: "#B45309" },
  chase_now:   { label: "Chase now",   bg: "#FCEDE9", color: "#C53A1B" },
  likely_dead: { label: "Likely dead", bg: "#F1F1F3", color: "#6B7280" },
} as const;

export default async function ReportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  return (
    <AppLayout userEmail={user.email} userName={user.user_metadata?.full_name}>
      <div style={{ padding: "32px 36px", maxWidth: 720 }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#18181B", letterSpacing: "-0.02em", margin: 0 }}>Weekly report</h1>
          <p style={{ fontSize: 13.5, color: "#71717A", marginTop: 4, marginBottom: 0 }}>Generated Mon Jun 23, 2025 · sent to {user.email}</p>
        </div>

        {/* Email receipt card */}
        <div style={{ background: "#fff", border: "1px solid #EBEBEB", borderRadius: 14, overflow: "hidden" }}>
          {/* Email header */}
          <div style={{ padding: "22px 28px", borderBottom: "1px solid #F1F1F2", background: "#FAFAFA" }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#18181B", letterSpacing: "-0.02em", marginBottom: 12 }}>Deal Cockpit · Weekly Pipeline Report</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {[
                ["From", "Deal Cockpit <noreply@dealcockpit.io>"],
                ["To",   user.email ?? ""],
                ["Date", "Mon, Jun 23 2025 · 10:00 AM"],
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
              Hi there — here&apos;s your weekly pipeline snapshot. You have <strong>3 deals at risk</strong> this week.
              Deal Cockpit has already drafted and sent <strong>4 follow-up emails</strong> on your behalf.
            </p>

            {/* At risk section */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#A1A1AA", marginBottom: 12 }}>At risk</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {AT_RISK.map((d) => {
                  const cfg = STATE_CONFIG[d.state as keyof typeof STATE_CONFIG];
                  return (
                    <div key={d.name} style={{ border: "1px solid #EBEBEB", borderRadius: 10, padding: "14px 16px", display: "flex", gap: 14, alignItems: "flex-start" }}>
                      <span style={{ background: cfg.bg, color: cfg.color, borderRadius: 6, padding: "3px 9px", fontSize: 11.5, fontWeight: 600, flexShrink: 0, marginTop: 1 }}>{cfg.label}</span>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: "#18181B", marginBottom: 3 }}>{d.name}</div>
                        <div style={{ fontSize: 13, color: "#71717A" }}>{d.reason}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Nudges sent */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "#A1A1AA", marginBottom: 12 }}>Nudges sent</div>
              <div style={{ border: "1px solid #EBEBEB", borderRadius: 10, overflow: "hidden" }}>
                {NUDGES_SENT.map((n, i) => (
                  <div key={i} style={{ padding: "12px 16px", borderBottom: i < NUDGES_SENT.length - 1 ? "1px solid #F4F4F5" : "none", display: "flex", gap: 12, alignItems: "center" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#18A05B", flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "#27272A" }}>{n.subject}</div>
                      <div style={{ fontSize: 12, color: "#A1A1AA", marginTop: 1 }}>{n.deal} · {n.to}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
