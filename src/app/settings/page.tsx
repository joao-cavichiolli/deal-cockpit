"use client";

import { useState } from "react";
import AppLayout from "@/components/app-layout";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const HOURS = Array.from({ length: 12 }, (_, i) => {
  const h = i + 7;
  return { value: h, label: h < 12 ? `${h}:00 AM` : h === 12 ? "12:00 PM" : `${h - 12}:00 PM` };
});

export default function SettingsPage() {
  const [day, setDay] = useState(1);
  const [hour, setHour] = useState(10);
  const [email, setEmail] = useState("");
  const [autoSend, setAutoSend] = useState(true);
  const [dryRun, setDryRun] = useState(true);
  const [saved, setSaved] = useState(false);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <AppLayout>
      <div style={{ padding: "32px 36px", maxWidth: 640 }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#18181B", letterSpacing: "-0.02em", margin: 0 }}>Settings</h1>
          <p style={{ fontSize: 13.5, color: "#71717A", marginTop: 4, marginBottom: 0 }}>Configure your report schedule and sending preferences</p>
        </div>

        <form onSubmit={handleSave}>
          {/* Report schedule */}
          <Section title="Report schedule">
            <Row label="Report day" desc="Which day of the week to run the analysis">
              <select value={day} onChange={(e) => setDay(Number(e.target.value))} style={selectStyle}>
                {DAYS.map((d, i) => <option key={d} value={i + 1}>{d}</option>)}
              </select>
            </Row>
            <Row label="Report time" desc="Time your report is generated and emails are sent (Lisbon time)">
              <select value={hour} onChange={(e) => setHour(Number(e.target.value))} style={selectStyle}>
                {HOURS.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
              </select>
            </Row>
            <Row label="Report email" desc="Where to send the weekly digest (defaults to your login email)">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{ ...selectStyle, minWidth: 260 }}
              />
            </Row>
          </Section>

          {/* Sending */}
          <Section title="Sending">
            <Row label="Auto-send nudges" desc="Automatically send AI-drafted follow-up emails without manual review">
              <Toggle checked={autoSend} onChange={setAutoSend} />
            </Row>
            <Row label="Dry run mode" desc="Generate and show drafts but never actually send emails — great for testing">
              <Toggle checked={dryRun} onChange={setDryRun} />
            </Row>
          </Section>

          <button
            type="submit"
            style={{ background: "#4F46E5", color: "#fff", border: "none", borderRadius: 8, padding: "9px 22px", fontSize: 13.5, fontWeight: 600, cursor: "pointer", marginTop: 4, transition: "background .15s" }}
          >
            {saved ? "Saved ✓" : "Save settings"}
          </button>
        </form>
      </div>
    </AppLayout>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #EBEBEB", borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid #F1F1F2", fontSize: 13, fontWeight: 600, color: "#18181B" }}>{title}</div>
      <div>{children}</div>
    </div>
  );
}

function Row({ label, desc, children }: { label: string; desc: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, padding: "16px 20px", borderBottom: "1px solid #F4F4F5" }}>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 500, color: "#27272A" }}>{label}</div>
        <div style={{ fontSize: 12.5, color: "#A1A1AA", marginTop: 2 }}>{desc}</div>
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        width: 42, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
        background: checked ? "#4F46E5" : "#E4E4E7", position: "relative", transition: "background .2s",
      }}
    >
      <span style={{
        position: "absolute", top: 3, left: checked ? 21 : 3,
        width: 18, height: 18, borderRadius: "50%", background: "#fff",
        transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)",
      }} />
    </button>
  );
}

const selectStyle: React.CSSProperties = {
  background: "#fff", border: "1px solid #EBEBEB", borderRadius: 8,
  padding: "7px 12px", fontSize: 13.5, color: "#27272A", outline: "none", cursor: "pointer",
};
