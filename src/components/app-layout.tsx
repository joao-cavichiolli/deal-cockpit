"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const NAV = [
  {
    key: "dashboard",
    href: "/dashboard",
    label: "Dashboard",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    key: "actions",
    href: "/actions",
    label: "This week's actions",
    badge: "4",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h7l-1 8 10-12h-7z" />
      </svg>
    ),
  },
  {
    key: "report",
    href: "/report",
    label: "Weekly report",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" />
      </svg>
    ),
  },
  {
    key: "connections",
    href: "/connections",
    label: "Connections",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 7V3M15 7V3M7 7h10v5a5 5 0 0 1-10 0z" /><path d="M12 17v4" />
      </svg>
    ),
  },
  {
    key: "settings",
    href: "/settings",
    label: "Settings",
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
      </svg>
    ),
  },
];

interface AppLayoutProps {
  children: React.ReactNode;
  userEmail?: string;
  userName?: string;
}

export default function AppLayout({ children, userEmail, userName }: AppLayoutProps) {
  const pathname = usePathname();
  const initials = (userName ?? userEmail ?? "??")
    .split(/[\s@]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  return (
    <div style={{ display: "flex", height: "100vh", width: "100%", overflow: "hidden", background: "#FAFAFA" }}>
      {/* Sidebar */}
      <aside style={{ width: 248, flexShrink: 0, background: "#FFFFFF", borderRight: "1px solid #ECECEC", display: "flex", flexDirection: "column", padding: "18px 14px" }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 8px 20px 8px" }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: "#4F46E5", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 2px rgba(79,70,229,.4)" }}>
            <div style={{ width: 12, height: 12, border: "2.5px solid #fff", borderRadius: 3 }} />
          </div>
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em" }}>Deal Cockpit</div>
            <div style={{ fontSize: 11, color: "#A1A1AA", fontWeight: 500 }}>LayerX</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {NAV.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.key}
                href={item.href}
                style={{
                  display: "flex", alignItems: "center", gap: 11,
                  padding: "8px 11px", borderRadius: 8,
                  fontSize: 13.5, fontWeight: 500, cursor: "pointer",
                  textDecoration: "none", transition: "background .12s, color .12s",
                  background: active ? "#EEF0FF" : "transparent",
                  color: active ? "#4F46E5" : "#52525B",
                }}
              >
                {item.icon}
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge && (
                  <span style={{
                    fontSize: 11, fontWeight: 600,
                    background: active ? "#4F46E5" : "#E4E4E7",
                    color: active ? "#fff" : "#71717A",
                    minWidth: 18, height: 18, borderRadius: 9,
                    display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px",
                  }}>{item.badge}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div style={{ marginTop: "auto", paddingTop: 16, borderTop: "1px solid #F1F1F2" }}>
          <form action="/auth/signout" method="POST">
            <button type="submit" style={{ width: "100%", background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#E0E7FF", color: "#4338CA", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600, flexShrink: 0 }}>
                  {initials}
                </div>
                <div style={{ lineHeight: 1.2, minWidth: 0, textAlign: "left" }}>
                  <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "#18181B" }}>
                    {userName ?? userEmail?.split("@")[0]}
                  </div>
                  <div style={{ fontSize: 11, color: "#A1A1AA", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {userEmail}
                  </div>
                </div>
              </div>
            </button>
          </form>
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, overflowY: "auto", minWidth: 0 }}>
        {children}
      </main>
    </div>
  );
}
