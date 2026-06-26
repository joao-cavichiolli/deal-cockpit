import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getDeals, getDealContacts, getPipelineStages } from "@/lib/hubspot";
import { scoreDeal, sortByRisk } from "@/lib/scoring";
import ActionsClient from "./actions-client";

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
          dealId: deal.id,
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
    <ActionsClient
      actions={actions}
      hasToken={hasToken}
      userEmail={user.email}
      userName={user.user_metadata?.full_name}
    />
  );
}
