import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/gmail";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return Response.json({ error: "Not authenticated" }, { status: 401 });
  }

  const providerToken = session.provider_token;
  if (!providerToken) {
    return Response.json({ error: "No Google token — please sign out and sign in again" }, { status: 400 });
  }

  const { to, subject, body } = await req.json();
  if (!to || !subject || !body) {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }

  try {
    const result = await sendEmail({ accessToken: providerToken, to, subject, body });
    return Response.json({ ok: true, messageId: result.id, threadId: result.threadId });
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 });
  }
}
