import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AppLayout from "@/components/app-layout";

const ACTIONS = [
  {
    rank: 1,
    deal: "Acme Corp — Enterprise",
    state: "chase_now",
    to: "sarah.chen@acmecorp.com",
    subject: "Re: Enterprise proposal — quick check-in",
    preview: "Hi Sarah, I wanted to follow up on the proposal I sent last week. I know you're busy, but I'd love to understand if you have any questions or concerns before the quarter closes. Would a 15-minute call this week work?",
    status: "ready",
  },
  {
    rank: 2,
    deal: "Meridian Co — Pro",
    state: "likely_dead",
    to: "james@meridian.co",
    subject: "Still interested in Meridian's growth goals?",
    preview: "Hi James, it's been a while since we last connected and I didn't want to let this slip through the cracks. If the timing isn't right, totally understand — just let me know and I'll reach out again next quarter.",
    status: "ready",
  },
  {
    rank: 3,
    deal: "Nordex GmbH — Platform",
    state: "stalling",
    to: "m.weber@nordex.de",
    subject: "Next steps for Nordex platform rollout",
    preview: "Hi Marcus, following up on our last call — I wanted to check if you've had a chance to review the platform spec with your team. Happy to set up a technical deep-dive if that would help move things forward.",
    status: "sent",
  },
  {
    rank: 4,
    deal: "Vertex Labs — Growth",
    state: "stalling",
    to: "alex@vertexlabs.io",
    subject: "Vertex Labs — defining next steps together",
    preview: "Hi Alex, I noticed we haven't locked in a next step since our last meeting. I'd love to propose a quick 20-minute call to align on timeline and what's needed from your side to move forward.",
    status: "ready",
  },
];

const STATE_CONFIG = {
  healthy:     { label: "Healthy",     bg: "#E8F6EE", color: "#15824B", dot: "#18A05B" },
  stalling:    { label: "Stalling",    bg: "#FBF1E0", color: "#B45309", dot: "#D97706" },
  chase_now:   { label: "Chase now",   bg: "#FCEDE9", color: "#C53A1B", dot: "#E0532B" },
  likely_dead: { label: "Likely dead", bg: "#F1F1F3", color: "#6B7280", dot: "#9CA3AF" },
} as const;

export default async function ActionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  return (
    <AppLayout userEmail={user.email} userName={user.user_metadata?.full_name}>
      <div style={{ padding: "32px 36px", maxWidth: 860 }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#18181B", letterSpacing: "-0.02em", margin: 0 }}>This week&apos;s actions</h1>
          <p style={{ fontSize: 13.5, color: "#71717A", marginTop: 4, marginBottom: 0 }}>4 nudges ranked by urgency · Jun 23–27</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {ACTIONS.map((a) => {
            const cfg = STATE_CONFIG[a.state as keyof typeof STATE_CONFIG];
            const sent = a.status === "sent";
            return (
              <div key={a.rank} style={{ background: "#fff", border: "1px solid #EBEBEB", borderRadius: 12, padding: "20px 22px", opacity: sent ? 0.72 : 1 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  {/* Rank badge */}
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: sent ? "#F4F4F5" : "#EEF0FF", color: sent ? "#A1A1AA" : "#4F46E5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                    {a.rank}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Top row */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#18181B" }}>{a.deal}</span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: cfg.bg, color: cfg.color, borderRadius: 20, padding: "2px 9px", fontSize: 11.5, fontWeight: 600 }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.dot }} />
                        {cfg.label}
                      </span>
                      {sent && (
                        <span style={{ fontSize: 11.5, fontWeight: 600, background: "#E8F6EE", color: "#15824B", borderRadius: 20, padding: "2px 9px" }}>✓ Sent</span>
                      )}
                    </div>

                    {/* Email preview card */}
                    <div style={{ background: "#FAFAFA", border: "1px solid #F1F1F2", borderRadius: 8, padding: "12px 14px", marginBottom: 14 }}>
                      <div style={{ fontSize: 11, color: "#A1A1AA", marginBottom: 4 }}>To: {a.to}</div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: "#18181B", marginBottom: 6 }}>{a.subject}</div>
                      <div style={{ fontSize: 13, color: "#52525B", lineHeight: 1.55 }}>{a.preview}</div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: "flex", gap: 8 }}>
                      {sent ? (
                        <>
                          <button style={btnStyle("#fff", "#EBEBEB", "#27272A")}>Edit &amp; resend</button>
                          <button style={btnStyle("#fff", "#EBEBEB", "#71717A")}>Stop follow-ups</button>
                        </>
                      ) : (
                        <>
                          <button style={btnStyle("#4F46E5", "#4F46E5", "#fff")}>Send now</button>
                          <button style={btnStyle("#fff", "#EBEBEB", "#27272A")}>Edit draft</button>
                          <button style={btnStyle("#fff", "#EBEBEB", "#71717A")}>Skip</button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}

function btnStyle(bg: string, border: string, color: string): React.CSSProperties {
  return { background: bg, border: `1px solid ${border}`, color, borderRadius: 7, padding: "6px 14px", fontSize: 12.5, fontWeight: 500, cursor: "pointer" };
}
