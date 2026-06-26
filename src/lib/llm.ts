const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!;

export async function generateNudgeEmail({
  dealName,
  stageName,
  state,
  daysSilent,
  flags,
  contactName,
  contactEmail,
  senderName,
}: {
  dealName: string;
  stageName: string;
  state: string;
  daysSilent: number;
  flags: string[];
  contactName: string;
  contactEmail: string;
  senderName: string;
}): Promise<{ subject: string; body: string }> {
  const flagDescriptions: Record<string, string> = {
    days_silent: `no contact for ${daysSilent} days`,
    close_date_past: "close date has passed",
    single_threaded: "only one contact at the company",
    no_next_step: "no next step defined",
    proposal_silence: "proposal sent with no reply",
  };

  const flagText = flags.map((f) => flagDescriptions[f] ?? f).join(", ");
  const stateText = { chase_now: "urgent follow-up needed", stalling: "deal is stalling", likely_dead: "deal may be lost" }[state] ?? state;

  const prompt = `You are a senior B2B sales rep writing a short, warm follow-up email.

Deal: ${dealName}
Stage: ${stageName}
Situation: ${stateText}
Risk signals: ${flagText || "none"}
Contact name: ${contactName}
Your name: ${senderName}

Write a concise follow-up email (3-4 sentences max). Be warm and human, not pushy. Do not use generic phrases like "I hope this finds you well" or "touching base". Get straight to the point. End with a soft call to action.

Respond with JSON only: { "subject": "...", "body": "..." }`;

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "https://deal-cockpit-gamma.vercel.app",
    },
    body: JSON.stringify({
      model: "anthropic/claude-haiku-4-5",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 300,
    }),
  });

  if (!res.ok) throw new Error(`OpenRouter error: ${res.status}`);
  const json = await res.json();
  const content = json.choices?.[0]?.message?.content ?? "{}";

  try {
    return JSON.parse(content);
  } catch {
    return {
      subject: `Re: ${dealName} — quick follow-up`,
      body: content,
    };
  }
}
