"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Hotel, ShieldCheck, KeyRound } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 2FA state
  const [requires2FA, setRequires2FA] = useState(false);
  const [totpToken, setTotpToken] = useState("");
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCode, setBackupCode] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const body: Record<string, string> = { email, password };

      if (requires2FA) {
        if (useBackupCode) {
          body.backupCode = backupCode.toUpperCase().trim();
        } else {
          body.totpToken = totpToken.trim();
        }
      }

      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.requires2FA) {
        setRequires2FA(true);
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      router.push("/admin/dashboard");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-deep-blue to-deep-blue-dark px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-elegant">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-terracotta text-white">
            {requires2FA ? (
              <ShieldCheck className="h-7 w-7" />
            ) : (
              <Hotel className="h-7 w-7" />
            )}
          </div>
          <h1 className="mt-4 font-serif text-2xl font-bold text-deep-blue">
            {requires2FA ? "Two-Factor Auth" : "Panorama Seaside"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {requires2FA
              ? "Enter your authenticator code to continue"
              : "Admin Dashboard"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {!requires2FA ? (
            <>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/20"
                  placeholder="admin@panoramaseasidekos.com"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-10 text-sm focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/20"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              {!useBackupCode ? (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Authenticator Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={totpToken}
                    onChange={(e) =>
                      setTotpToken(e.target.value.replace(/\D/g, ""))
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-2xl font-mono tracking-[0.5em] focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/20"
                    placeholder="000000"
                    autoFocus
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Backup Code
                  </label>
                  <input
                    type="text"
                    maxLength={8}
                    value={backupCode}
                    onChange={(e) =>
                      setBackupCode(e.target.value.toUpperCase())
                    }
                    className="w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-lg font-mono tracking-widest focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/20"
                    placeholder="XXXXXXXX"
                    autoFocus
                    required
                  />
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setUseBackupCode(!useBackupCode);
                  setError("");
                }}
                className="flex w-full items-center justify-center gap-2 text-sm text-gray-500 hover:text-terracotta"
              >
                <KeyRound className="h-3.5 w-3.5" />
                {useBackupCode
                  ? "Use authenticator app instead"
                  : "Use a backup code"}
              </button>
            </>
          )}

          <Button
            type="submit"
            className="w-full"
            size="lg"
            isLoading={loading}
          >
            {requires2FA ? "Verify" : "Sign In"}
          </Button>

          {requires2FA && (
            <button
              type="button"
              onClick={() => {
                setRequires2FA(false);
                setTotpToken("");
                setBackupCode("");
                setUseBackupCode(false);
                setError("");
              }}
              className="w-full text-center text-sm text-gray-400 hover:text-gray-600"
            >
              ← Back to login
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
