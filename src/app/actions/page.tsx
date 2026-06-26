import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getDeals, getDealContacts, getPipelineStages } from "@/lib/hubspot";
import { scoreDeal, sortByRisk } from "@/lib/scoring";
import { generateNudgeEmail } from "@/lib/llm";
import ActionsClient from "./actions-client";

export default async function ActionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const hasToken = !!process.env.HUBSPOT_ACCESS_TOKEN;
  const hasLLM = !!process.env.OPENROUTER_API_KEY;
  const senderName = user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "there";

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

      actions = await Promise.all(
        atRisk.map(async (deal, i) => {
          const entry = scored.find((s) => s.deal.id === deal.id)!;
          const contact = entry.contacts[0];
          const contactName = contact?.first_name || contact?.email?.split("@")[0] || "there";
          const toEmail = contact?.email ?? "";
          const stageName = stages[deal.stage] ?? deal.stage;

          let subject = `Re: ${deal.name} — quick follow-up`;
          let preview = `Hi ${contactName},\n\nFollowing up on ${deal.name}. Would love to connect and discuss next steps.\n\nBest regards`;

          if (hasLLM) {
            try {
              const draft = await generateNudgeEmail({
                dealName: deal.name,
                stageName,
                state: deal.state,
                daysSilent: deal.days_silent,
                flags: deal.flags,
                contactName,
                contactEmail: toEmail,
                senderName,
              });
              subject = draft.subject ?? subject;
              preview = draft.body ?? preview;
            } catch {}
          }

          return {
            rank: i + 1,
            dealId: deal.id,
            deal: deal.name,
            state: deal.state,
            to: toEmail,
            subject,
            preview,
          };
        })
      );
    } catch {}
  }

  return (
    <ActionsClient
      actions={actions}
      hasToken={hasToken}
      userEmail={user.email}
      userName={user.user_metadata?.full_name}
    />
  );
}
