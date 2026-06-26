"use client";

import { useEffect, useState } from "react";

function getGreeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function Greeting({ name }: { name: string }) {
  const [greeting, setGreeting] = useState("Good morning");
  const [location, setLocation] = useState("Lisbon");
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    const now = new Date();
    setGreeting(getGreeting(now.getHours()));
    setDateStr(now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }));

    // Detect timezone city name (best effort)
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const city = tz.split("/").pop()?.replace(/_/g, " ") ?? tz;
      setLocation(city);
    } catch {}
  }, []);

  return (
    <div>
      <div style={{ fontSize: 12, color: "#A1A1AA", marginBottom: 4 }}>
        {dateStr} · {location}
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color: "#18181B", letterSpacing: "-0.02em" }}>
        {greeting}, {name}
      </div>
    </div>
  );
}
