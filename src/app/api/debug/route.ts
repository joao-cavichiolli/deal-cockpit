export async function GET() {
  return Response.json({
    hasHubspot: !!process.env.HUBSPOT_ACCESS_TOKEN,
    tokenPrefix: process.env.HUBSPOT_ACCESS_TOKEN?.slice(0, 10) ?? null,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
  });
}
