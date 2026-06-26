import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-900">
      <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Deal Cockpit</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">{user.email}</span>
            <form action="/auth/signout" method="POST">
              <button
                type="submit"
                className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Pipeline Overview
          </h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Connect your HubSpot to start tracking deals.
          </p>
        </div>

        {/* Connect integrations placeholder */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-950">
            <h3 className="font-medium text-zinc-900 dark:text-zinc-50">HubSpot</h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Connect HubSpot to sync your deals.
            </p>
            <button className="mt-4 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600">
              Connect HubSpot
            </button>
          </div>

          <div className="rounded-xl border border-dashed border-zinc-300 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-950">
            <h3 className="font-medium text-zinc-900 dark:text-zinc-50">Gmail</h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Already connected via Google sign-in.
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm text-green-600 dark:text-green-400">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Connected
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
