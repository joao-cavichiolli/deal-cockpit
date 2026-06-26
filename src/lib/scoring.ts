import type { HubDeal } from "./hubspot";

export type DealState = "healthy" | "stalling" | "chase_now" | "likely_dead";

export interface ScoredDeal extends HubDeal {
  state: DealState;
  flags: string[];
  days_silent: number;
  contact_count: number;
}

function daysSince(iso: string | null): number {
  if (!iso) return 999;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

function isDatePast(iso: string | null): boolean {
  if (!iso) return false;
  return new Date(iso).getTime() < Date.now();
}

export function scoreDeal(deal: HubDeal, contactCount: number): ScoredDeal {
  const days = daysSince(deal.last_activity);
  const closePast = isDatePast(deal.close_date);
  const flags: string[] = [];

  if (days >= 7)  flags.push("days_silent");
  if (closePast)  flags.push("close_date_past");
  if (contactCount <= 1) flags.push("single_threaded");

  let state: DealState;
  if (days >= 21 || (days >= 14 && closePast)) {
    state = "likely_dead";
  } else if (days >= 10 || (closePast && days >= 5)) {
    state = "chase_now";
  } else if (days >= 7 || contactCount <= 1) {
    state = "stalling";
  } else {
    state = "healthy";
  }

  return { ...deal, state, flags, days_silent: days, contact_count: contactCount };
}

export function sortByRisk(deals: ScoredDeal[]): ScoredDeal[] {
  const order: Record<DealState, number> = { likely_dead: 0, chase_now: 1, stalling: 2, healthy: 3 };
  return [...deals].sort((a, b) => order[a.state] - order[b.state]);
}
