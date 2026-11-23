"use client";

import { Loader2, ShoppingBag } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { TOKEN_KEY, USER_KEY } from "@/lib/auth-storage";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(TOKEN_KEY)) router.replace("/");
  }, [router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = (await response.json()) as {
        error?: string;
        token?: string;
        user?: unknown;
      };

      if (!response.ok || typeof payload.token !== "string") {
        setError(payload.error ?? "Login gagal. Coba lagi.");
        return;
      }

      localStorage.setItem(TOKEN_KEY, payload.token);
      localStorage.setItem(USER_KEY, JSON.stringify(payload.user ?? null));
      router.replace("/");
    } catch {
      setError("Tidak dapat menghubungi server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-[#f5f8fc] px-4 text-slate-800">
      <main className="w-full max-w-sm rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.03)] sm:p-8">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-blue-700 text-white shadow-sm shadow-blue-700/20">
            <ShoppingBag size={19} strokeWidth={2.2} aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight text-slate-900">Axon Sales</p>
            <p className="text-[11px] text-slate-500">Masuk untuk melihat dashboard</p>
          </div>
        </div>

        <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="text-xs font-medium text-slate-600">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="nama@perusahaan.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="text-xs font-medium text-slate-600">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="••••••••"
            />
          </div>

          {error ? (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700 ring-1 ring-inset ring-rose-600/15">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : null}
            {loading ? "Memproses…" : "Masuk"}
          </button>
        </form>
      </main>
    </div>
  );
}
