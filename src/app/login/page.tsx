"use client";
import { getSession, signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { LogIn, Eye, EyeOff, ShieldCheck, HeartHandshake, Utensils } from "lucide-react";

export default function Login() {
  const [error, setError] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [emailVal, setEmailVal] = useState("");
  const [passwordVal, setPasswordVal] = useState("");

  async function handleLogin(email?: string, password?: string) {
    setBusy(true);
    setError("");
    const targetEmail = email ?? emailVal;
    const targetPass = password ?? passwordVal;

    try {
      const r = await signIn("credentials", {
        email: targetEmail,
        password: targetPass,
        redirect: false,
      });

      if (!r?.ok) {
        setError(
          r?.error === "CredentialsSignin"
            ? "Invalid email or password"
            : "Sign-in is temporarily unavailable. Check the server configuration and try again."
        );
        return;
      }

      const session = await getSession();
      const user = session?.user as { role?: string } | undefined;

      if (user?.role === "ADMIN") {
        window.location.href = "/admin";
      } else if (user?.role === "SHELTER") {
        window.location.href = "/shelter/dashboard";
      } else if (user?.role === "DELIVERY") {
        window.location.href = "/deliveries";
      } else {
        window.location.href = "/restaurant/dashboard";
      }
    } catch {
      setError("Sign-in is temporarily unavailable. Check the server configuration and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const em = f.get("email") as string;
    const pw = f.get("password") as string;
    await handleLogin(em, pw);
  }

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <div className="rounded-2xl border border-ink/10 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest/10 text-forest">
            <LogIn className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-forest">Sign in</h1>
            <p className="text-xs text-ink/60">Welcome back to FoodBridge</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-ink/70">Email Address</label>
            <input
              name="email"
              type="email"
              required
              value={emailVal}
              onChange={(e) => setEmailVal(e.target.value)}
              placeholder="name@organization.com"
              className="input"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-ink/70">Password</label>
            <div className="relative">
              <input
                name="password"
                type={show ? "text" : "password"}
                required
                value={passwordVal}
                onChange={(e) => setPasswordVal(e.target.value)}
                placeholder="••••••••"
                className="input pr-10"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink/80"
                onClick={() => setShow(!show)}
                aria-label="Toggle password visibility"
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
              {error}
            </div>
          )}

          <button className="btn w-full py-2.5" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="mt-6 border-t border-ink/10 pt-4 text-center">
          <p className="text-xs text-ink/60">
            Don&apos;t have an account yet?{" "}
            <Link href="/register" className="font-semibold text-forest hover:underline">
              Register organization
            </Link>
          </p>
        </div>

        <div className="mt-6 rounded-xl border border-dashed border-ink/15 bg-cream/70 p-4">
          <p className="mb-2 text-xs font-semibold text-ink/70">Quick Demo Accounts (Local):</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setEmailVal("bistro@foodbridge.org");
                setPasswordVal("Provider@123456");
              }}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-ink/10 bg-white px-2 py-1.5 text-[11px] font-medium text-ink hover:bg-sage/40"
            >
              <Utensils className="h-3 w-3 text-forest" />
              Provider
            </button>
            <button
              type="button"
              onClick={() => {
                setEmailVal("hope@foodbridge.org");
                setPasswordVal("Shelter@123456");
              }}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-ink/10 bg-white px-2 py-1.5 text-[11px] font-medium text-ink hover:bg-sage/40"
            >
              <HeartHandshake className="h-3 w-3 text-amber-warn" />
              Shelter
            </button>
            <button
              type="button"
              onClick={() => {
                setEmailVal("admin@foodbridge.org");
                setPasswordVal("Admin@123456");
              }}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-ink/10 bg-white px-2 py-1.5 text-[11px] font-medium text-ink hover:bg-sage/40"
            >
              <ShieldCheck className="h-3 w-3 text-forest" />
              Admin
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
