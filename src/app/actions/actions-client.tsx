"use client";

import { useState } from "react";
import AppLayout from "@/components/app-layout";

const STATE_CONFIG = {
  healthy:     { label: "Healthy",     bg: "#E8F6EE", color: "#15824B", dot: "#18A05B" },
  stalling:    { label: "Stalling",    bg: "#FBF1E0", color: "#B45309", dot: "#D97706" },
  chase_now:   { label: "Chase now",   bg: "#FCEDE9", color: "#C53A1B", dot: "#E0532B" },
  likely_dead: { label: "Likely dead", bg: "#F1F1F3", color: "#6B7280", dot: "#9CA3AF" },
} as const;

interface Action {
  rank: number;
  dealId: string;
  deal: string;
  state: string;
  to: string;
  subject: string;
  preview: string;
}

interface Props {
  actions: Action[];
  hasToken: boolean;
  userEmail?: string;
  userName?: string;
}

export default function ActionsClient({ actions, hasToken, userEmail, userName }: Props) {
  const [statuses, setStatuses] = useState<Record<number, "idle" | "sending" | "sent" | "error">>({});
  const [errors, setErrors] = useState<Record<number, string>>({});
  const [editing, setEditing] = useState<Record<number, string>>({});

  async function handleSend(a: Action) {
    setStatuses((s) => ({ ...s, [a.rank]: "sending" }));
    const body = editing[a.rank] ?? a.preview;
    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: a.to, subject: a.subject, body }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setStatuses((s) => ({ ...s, [a.rank]: "sent" }));
    } catch (e: any) {
      setStatuses((s) => ({ ...s, [a.rank]: "error" }));
      setErrors((s) => ({ ...s, [a.rank]: e.message }));
    }
  }

  return (
    <AppLayout userEmail={userEmail} userName={userName}>
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
            const status = statuses[a.rank] ?? "idle";
            const sent = status === "sent";
            const sending = status === "sending";

            return (
              <div key={a.rank} style={{ background: "#fff", border: "1px solid #EBEBEB", borderRadius: 12, padding: "20px 22px", opacity: sent ? 0.75 : 1 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: sent ? "#F4F4F5" : "#EEF0FF", color: sent ? "#A1A1AA" : "#4F46E5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                    {a.rank}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#18181B" }}>{a.deal}</span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: cfg.bg, color: cfg.color, borderRadius: 20, padding: "2px 9px", fontSize: 11.5, fontWeight: 600 }}>
                        <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.dot }} />
                        {cfg.label}
                      </span>
                      {sent && <span style={{ fontSize: 11.5, fontWeight: 600, background: "#E8F6EE", color: "#15824B", borderRadius: 20, padding: "2px 9px" }}>✓ Sent</span>}
                    </div>

                    <div style={{ background: "#FAFAFA", border: "1px solid #F1F1F2", borderRadius: 8, padding: "12px 14px", marginBottom: 14 }}>
                      {a.to && <div style={{ fontSize: 11, color: "#A1A1AA", marginBottom: 4 }}>To: {a.to}</div>}
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: "#18181B", marginBottom: 8 }}>{a.subject}</div>
                      <textarea
                        value={editing[a.rank] ?? a.preview}
                        onChange={(e) => setEditing((s) => ({ ...s, [a.rank]: e.target.value }))}
                        disabled={sent}
                        style={{ width: "100%", minHeight: 120, fontSize: 13, color: "#52525B", lineHeight: 1.55, background: "transparent", border: "none", resize: "vertical", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }}
                      />
                    </div>

                    {errors[a.rank] && (
                      <div style={{ fontSize: 12, color: "#B91C1C", marginBottom: 8 }}>Error: {errors[a.rank]}</div>
                    )}

                    <div style={{ display: "flex", gap: 8 }}>
                      {!sent && (
                        <>
                          <button
                            onClick={() => handleSend(a)}
                            disabled={sending || !a.to}
                            style={{ ...btnStyle("#4F46E5", "#4F46E5", "#fff"), opacity: sending || !a.to ? 0.6 : 1 }}
                          >
                            {sending ? "Sending…" : "Send now"}
                          </button>
                          <button style={btnStyle("#fff", "#EBEBEB", "#71717A")} onClick={() => setEditing((s) => ({ ...s, [a.rank]: a.preview }))}>Reset</button>
                        </>
                      )}
                      {sent && (
                        <span style={{ fontSize: 12.5, color: "#15824B" }}>Email sent via Gmail ✓</span>
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
