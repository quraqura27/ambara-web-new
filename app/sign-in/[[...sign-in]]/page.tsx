import Image from "next/image";
import Link from "next/link";

import { signIn } from "@/actions/auth";

type SignInPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

const errorMessages: Record<string, string> = {
  config: "Portal sign-in is not configured. Check JWT_SECRET in the deployment environment.",
  invalid: "Invalid email or password.",
  missing: "Email and password are required.",
  server: "Unable to reach the staff account database. Try again shortly.",
};

export default async function Page({ searchParams }: SignInPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const error = params?.error ? errorMessages[params.error] : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0a0a0f] px-4 text-slate-100">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0f0f16] p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <Image
            src="/logo.png"
            alt="PT Ambara Artha Globaltrans"
            className="mx-auto h-auto w-64 invert"
            width={4000}
            height={622}
            priority
          />
          <p className="mt-4 text-sm text-slate-400">Operations Portal</p>
        </div>

        {error ? (
          <div className="mb-5 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        ) : null}

        <form action={signIn} className="space-y-5">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">
              Email
            </label>
            <input
              autoComplete="email"
              className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
              name="email"
              required
              type="email"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">
              Password
            </label>
            <input
              autoComplete="current-password"
              className="w-full rounded-lg border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
              name="password"
              required
              type="password"
            />
          </div>

          <button
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-500"
            type="submit"
          >
            Sign In
          </button>
        </form>

        <Link className="mt-6 block text-center text-sm text-slate-500 hover:text-slate-300" href="/en">
          Back to website
        </Link>
      </div>
    </main>
  );
}
