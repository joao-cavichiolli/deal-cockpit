const BASE = "https://api.hubapi.com";
const TOKEN = process.env.HUBSPOT_ACCESS_TOKEN!;

function headers() {
  return { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" };
}

export interface HubDeal {
  id: string;
  name: string;
  stage: string;
  amount: number | null;
  close_date: string | null;
  last_activity: string | null;
}

export interface HubContact {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

export async function getDeals(): Promise<HubDeal[]> {
  // Use search API to exclude closed deals
  const body = {
    filterGroups: [
      {
        filters: [
          { propertyName: "hs_is_closed", operator: "EQ", value: "false" },
        ],
      },
    ],
    properties: ["dealname", "dealstage", "amount", "closedate", "hs_lastmodifieddate"],
    limit: 100,
  };

  const res = await fetch(`${BASE}/crm/v3/objects/deals/search`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`HubSpot deals error: ${res.status}`);
  const json = await res.json();
  return (json.results ?? []).map((d: any) => ({
    id: d.id,
    name: d.properties.dealname ?? "Unnamed deal",
    stage: d.properties.dealstage ?? "",
    amount: d.properties.amount ? Number(d.properties.amount) : null,
    close_date: d.properties.closedate ?? null,
    last_activity: d.properties.hs_lastmodifieddate ?? null,
  }));
}

export async function getDealContacts(dealId: string): Promise<HubContact[]> {
  const res = await fetch(
    `${BASE}/crm/v3/objects/deals/${dealId}/associations/contacts`,
    { headers: headers(), next: { revalidate: 300 } }
  );
  if (!res.ok) return [];
  const json = await res.json();
  const ids: string[] = (json.results ?? []).map((r: any) => r.id);
  if (ids.length === 0) return [];

  const contacts = await Promise.all(
    ids.slice(0, 5).map(async (id) => {
      const r = await fetch(
        `${BASE}/crm/v3/objects/contacts/${id}?properties=email,firstname,lastname`,
        { headers: headers(), next: { revalidate: 300 } }
      );
      if (!r.ok) return null;
      const c = await r.json();
      return {
        id: c.id,
        email: c.properties.email ?? "",
        first_name: c.properties.firstname ?? "",
        last_name: c.properties.lastname ?? "",
      };
    })
  );
  return contacts.filter(Boolean) as HubContact[];
}

export async function getDealContactsWithInfo(dealId: string): Promise<HubContact[]> {
  return getDealContacts(dealId);
}

export async function getPipelineStages(): Promise<Record<string, string>> {
  const res = await fetch(`${BASE}/crm/v3/pipelines/deals`, {
    headers: headers(),
    next: { revalidate: 3600 },
  });
  if (!res.ok) return {};
  const json = await res.json();
  const map: Record<string, string> = {};
  for (const pipeline of json.results ?? []) {
    for (const stage of pipeline.stages ?? []) {
      map[stage.id] = stage.label;
    }
  }
  return map;
}
