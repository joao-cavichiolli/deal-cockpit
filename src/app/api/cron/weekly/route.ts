import { createClient } from "@/lib/supabase/server";
import { getDeals, getDealContacts } from "@/lib/hubspot";
import { scoreDeal, sortByRisk } from "@/lib/scoring";

// Vercel Cron calls this every Monday at 10:00 Lisbon time (09:00 UTC)
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.HUBSPOT_ACCESS_TOKEN) {
    return Response.json({ error: "No HubSpot token" }, { status: 400 });
  }

  try {
    const rawDeals = await getDeals();
    const scored = await Promise.all(
      rawDeals.map(async (d) => {
        const contacts = await getDealContacts(d.id);
        return scoreDeal(d, contacts.length);
      })
    );
    const atRisk = sortByRisk(scored).filter((d) => d.state !== "healthy");

    return Response.json({
      ok: true,
      total: rawDeals.length,
      atRisk: atRisk.length,
      deals: atRisk.map((d) => ({ name: d.name, state: d.state, flags: d.flags })),
    });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
