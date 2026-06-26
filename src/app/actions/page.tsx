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

function draftEmail(dealName: string, state: string, contactName: string, stageName: string) {
  if (state === "chase_now") {
    return `Hi ${contactName},\n\nI wanted to follow up on our conversation about ${dealName}. We're at the ${stageName} stage and I'd love to understand if there are any questions or concerns I can help address before we move forward.\n\nWould a quick 15-minute call this week work for you?\n\nBest regards`;
  }
  if (state === "likely_dead") {
    return `Hi ${contactName},\n\nIt's been a while since we last connected regarding ${dealName}. I didn't want to let this slip through the cracks — if the timing isn't right, I completely understand. Just let me know and I'll reach out again next quarter.\n\nBest regards`;
  }
  return `Hi ${contactName},\n\nFollowing up on ${dealName} — I wanted to check in and see if you've had a chance to review things on your end. Happy to set up a call to discuss next steps.\n\nBest regards`;
}

export default async function ActionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const hasToken = !!process.env.HUBSPOT_ACCESS_TOKEN;
  let actions: any[] = [];

  if (hasToken) {
    try {
      const [rawDeals, stages] = await Promise.all([getDeals(), getPipelineStages()]);
      const scored = await Promise.all(
        rawDeals.map(async (d) => {
          const contacts = await getDealContacts(d.id);
          return { deal: scoreDeal(d, contacts.length), contacts };
        })
      );
      const sorted = sortByRisk(scored.map((s) => s.deal));
      const atRisk = sorted.filter((d) => d.state !== "healthy").slice(0, 5);

      actions = atRisk.map((deal, i) => {
        const entry = scored.find((s) => s.deal.id === deal.id)!;
        const contact = entry.contacts[0];
        const contactName = contact ? (contact.first_name || contact.email.split("@")[0]) : "there";
        const toEmail = contact?.email ?? "";
        const stageName = stages[deal.stage] ?? deal.stage;
        return {
          rank: i + 1,
          deal: deal.name,
          state: deal.state,
          to: toEmail,
          subject: `Re: ${deal.name} — quick follow-up`,
          preview: draftEmail(deal.name, deal.state, contactName, stageName),
        };
      });
    } catch {}
  }

  return (
    <AppLayout userEmail={user.email} userName={user.user_metadata?.full_name}>
      <div style={{ padding: "32px 36px", maxWidth: 860 }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#18181B", letterSpacing: "-0.02em", margin: 0 }}>This week&apos;s actions</h1>
          <p style={{ fontSize: 13.5, color: "#71717A", marginTop: 4, marginBottom: 0 }}>
            {actions.length} nudges ranked by urgency
          </p>
        </div>

        {!hasToken && (
          <div style={{ background: "#fff", border: "1px solid #EBEBEB", borderRadius: 12, padding: "40px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 14, color: "#71717A" }}>Connect HubSpot to generate actions.</div>
            <a href="/connections" style={{ display: "inline-block", marginTop: 16, background: "#4F46E5", color: "#fff", borderRadius: 8, padding: "9px 20px", fontSize: 13.5, fontWeight: 600, textDecoration: "none" }}>Go to Connections</a>
          </div>
        )}

        {actions.length === 0 && hasToken && (
          <div style={{ background: "#fff", border: "1px solid #EBEBEB", borderRadius: 12, padding: "40px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: "#18181B", marginBottom: 8 }}>All deals look healthy 🎉</div>
            <div style={{ fontSize: 13.5, color: "#71717A" }}>No at-risk deals requiring follow-up this week.</div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {actions.map((a) => {
            const cfg = STATE_CONFIG[a.state as keyof typeof STATE_CONFIG];
            return (
              <div key={a.rank} style={{ background: "#fff", border: "1px solid #EBEBEB", borderRadius: 12, padding: "20px 22px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: "#EEF0FF", color: "#4F46E5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                    {a.rank}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#18181B" }}>{a.deal}</span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: cfg.bg, color: cfg.color, borderRadius: 20, padding: "2px 9px", fontSize: 11.5, fontWeight: 600 }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.dot }} />
                        {cfg.label}
                      </span>
                    </div>
                    <div style={{ background: "#FAFAFA", border: "1px solid #F1F1F2", borderRadius: 8, padding: "12px 14px", marginBottom: 14 }}>
                      {a.to && <div style={{ fontSize: 11, color: "#A1A1AA", marginBottom: 4 }}>To: {a.to}</div>}
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: "#18181B", marginBottom: 6 }}>{a.subject}</div>
                      <div style={{ fontSize: 13, color: "#52525B", lineHeight: 1.55, whiteSpace: "pre-line" }}>{a.preview}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button style={btnStyle("#4F46E5", "#4F46E5", "#fff")}>Send now</button>
                      <button style={btnStyle("#fff", "#EBEBEB", "#27272A")}>Edit draft</button>
                      <button style={btnStyle("#fff", "#EBEBEB", "#71717A")}>Skip</button>
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
