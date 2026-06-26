import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AppLayout from "@/components/app-layout";

export default async function ConnectionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: conns } = await supabase.from("connections").select("provider").eq("user_id", user.id);
  const connected = new Set((conns ?? []).map((c: { provider: string }) => c.provider));
  const googleConnected = connected.has("google");
  const hubspotConnected = connected.has("hubspot");

  return (
    <AppLayout userEmail={user.email} userName={user.user_metadata?.full_name}>
      <div style={{ padding: "32px 36px", maxWidth: 700 }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#18181B", letterSpacing: "-0.02em", margin: 0 }}>Connections</h1>
          <p style={{ fontSize: 13.5, color: "#71717A", marginTop: 4, marginBottom: 0 }}>Manage your integrations</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Google */}
          <div style={{ background: "#fff", border: "1px solid #EBEBEB", borderRadius: 12, padding: "22px 24px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, border: "1px solid #EBEBEB", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#18181B", marginBottom: 4 }}>Google / Gmail</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
                    {["gmail.send", "gmail.readonly", "profile", "email"].map((s) => (
                      <span key={s} style={{ fontSize: 11, background: "#F4F4F5", color: "#52525B", border: "1px solid #EBEBEB", borderRadius: 4, padding: "2px 7px" }}>{s}</span>
                    ))}
                  </div>
                  <div style={{ fontSize: 13, color: "#71717A" }}>Used to send nudge emails and read thread history from your Gmail account.</div>
                </div>
              </div>
              <div style={{ flexShrink: 0 }}>
                {googleConnected ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: "#15824B", background: "#E8F6EE", borderRadius: 20, padding: "5px 13px" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#18A05B" }} />Connected
                  </span>
                ) : (
                  <a href="/auth/google" style={{ display: "inline-block", background: "#4F46E5", color: "#fff", borderRadius: 8, padding: "7px 16px", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Connect</a>
                )}
              </div>
            </div>
          </div>

          {/* HubSpot */}
          <div style={{ background: "#fff", border: "1px solid #EBEBEB", borderRadius: 12, padding: "22px 24px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, border: "1px solid #EBEBEB", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: "#FF7A59" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M15.28 5.11V3.56A1.56 1.56 0 0 0 13.72 2h-.01a1.56 1.56 0 0 0-1.56 1.56v1.55a4.68 4.68 0 0 0-2.42 1.52L5.9 4.94a1.56 1.56 0 1 0-1.11 1.94l3.7 1.63A4.69 4.69 0 0 0 8.19 10a4.72 4.72 0 0 0 .3 1.65L5.33 13.1a1.56 1.56 0 1 0 .78 1.36l3.23-1.49A4.73 4.73 0 0 0 13.71 15a4.73 4.73 0 0 0 4.73-4.73 4.74 4.74 0 0 0-3.16-4.46zm-1.57 6.84a2.11 2.11 0 1 1 0-4.22 2.11 2.11 0 0 1 0 4.22z"/></svg>
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#18181B", marginBottom: 4 }}>HubSpot CRM</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 8 }}>
                    {["crm.objects.deals.read", "crm.objects.contacts.read", "timeline"].map((s) => (
                      <span key={s} style={{ fontSize: 11, background: "#F4F4F5", color: "#52525B", border: "1px solid #EBEBEB", borderRadius: 4, padding: "2px 7px" }}>{s}</span>
                    ))}
                  </div>
                  <div style={{ fontSize: 13, color: "#71717A" }}>Used to read your deal pipeline, contacts, and activity timeline.</div>
                </div>
              </div>
              <div style={{ flexShrink: 0 }}>
                {hubspotConnected ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, fontWeight: 600, color: "#15824B", background: "#E8F6EE", borderRadius: 20, padding: "5px 13px" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#18A05B" }} />Connected
                  </span>
                ) : (
                  <a href="/auth/hubspot" style={{ display: "inline-block", background: "#4F46E5", color: "#fff", borderRadius: 8, padding: "7px 16px", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>Connect</a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Security note */}
        <div style={{ marginTop: 20, padding: "14px 16px", background: "#FAFAFA", border: "1px solid #F1F1F2", borderRadius: 10, display: "flex", gap: 10, alignItems: "flex-start" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#A1A1AA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
          <p style={{ fontSize: 12.5, color: "#71717A", margin: 0, lineHeight: 1.55 }}>
            Tokens are stored encrypted at rest. Deal Cockpit only requests the minimum required scopes and never stores your email content.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
