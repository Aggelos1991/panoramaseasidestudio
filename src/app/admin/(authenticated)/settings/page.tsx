"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { Button } from "@/components/ui/button";
import {
  Settings2,
  Lock,
  ShieldCheck,
  ShieldOff,
  Eye,
  EyeOff,
  Copy,
  Check,
  AlertTriangle,
  Smartphone,
} from "lucide-react";

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Manage your account security"
        icon={Settings2}
      />
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <PasswordChangeCard />
        <TwoFactorCard />
      </div>
    </>
  );
}

// ─── Password Change ────────────────────────────────────
function PasswordChangeCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }

      setSuccess("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError("Failed to change password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Lock className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-semibold text-gray-900">Change Password</h2>
          <p className="text-sm text-gray-500">Update your admin password</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-600">
            {success}
          </div>
        )}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Current Password
          </label>
          <div className="relative">
            <input
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-10 text-sm focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/20"
              required
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            New Password
          </label>
          <div className="relative">
            <input
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-10 text-sm focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/20"
              minLength={8}
              required
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-400">Minimum 8 characters</p>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Confirm New Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/20"
            required
          />
        </div>

        <Button type="submit" isLoading={loading} className="w-full">
          Update Password
        </Button>
      </form>
    </div>
  );
}

// ─── Two-Factor Authentication ──────────────────────────
function TwoFactorCard() {
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"idle" | "setup" | "verify" | "backup" | "disable">("idle");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [totpToken, setTotpToken] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [disablePassword, setDisablePassword] = useState("");
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // Check 2FA status on load
  useEffect(() => {
    fetch("/api/auth/2fa/status")
      .then((r) => r.json())
      .then((d) => {
        setIs2FAEnabled(d.enabled);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleSetup() {
    setError("");
    setActionLoading(true);
    try {
      const res = await fetch("/api/auth/2fa/setup", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setStep("setup");
    } catch {
      setError("Failed to initiate 2FA setup");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setActionLoading(true);
    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: totpToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setBackupCodes(data.backupCodes);
      setIs2FAEnabled(true);
      setStep("backup");
    } catch {
      setError("Failed to verify code");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDisable(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setActionLoading(true);
    try {
      const res = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: disablePassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error);
        return;
      }
      setIs2FAEnabled(false);
      setStep("idle");
      setDisablePassword("");
    } catch {
      setError("Failed to disable 2FA");
    } finally {
      setActionLoading(false);
    }
  }

  function copyBackupCodes() {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-300 border-t-terracotta" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            is2FAEnabled ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
          }`}
        >
          {is2FAEnabled ? <ShieldCheck className="h-5 w-5" /> : <ShieldOff className="h-5 w-5" />}
        </div>
        <div>
          <h2 className="font-semibold text-gray-900">Two-Factor Authentication</h2>
          <p className="text-sm text-gray-500">
            {is2FAEnabled ? (
              <span className="text-emerald-600 font-medium">Enabled</span>
            ) : (
              "Add an extra layer of security"
            )}
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Idle — show enable/disable button */}
      {step === "idle" && (
        <>
          {!is2FAEnabled ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-amber-50 p-4">
                <div className="flex gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium">2FA is not enabled</p>
                    <p className="mt-1 text-amber-700">
                      Protect your admin account with Google Authenticator or any TOTP app.
                    </p>
                  </div>
                </div>
              </div>
              <Button
                onClick={handleSetup}
                isLoading={actionLoading}
                className="w-full"
              >
                <Smartphone className="mr-2 h-4 w-4" />
                Enable 2FA
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg bg-emerald-50 p-4">
                <div className="flex gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                  <div className="text-sm text-emerald-800">
                    <p className="font-medium">Your account is protected</p>
                    <p className="mt-1 text-emerald-700">
                      Two-factor authentication is active. You&apos;ll need your authenticator app to sign in.
                    </p>
                  </div>
                </div>
              </div>
              <Button
                variant="danger"
                onClick={() => setStep("disable")}
                className="w-full"
              >
                <ShieldOff className="mr-2 h-4 w-4" />
                Disable 2FA
              </Button>
            </div>
          )}
        </>
      )}

      {/* Setup — show QR code */}
      {step === "setup" && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
          </p>

          <div className="flex justify-center rounded-xl bg-gray-50 p-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrCode} alt="2FA QR Code" className="h-48 w-48" />
          </div>

          <div className="rounded-lg bg-gray-50 p-3">
            <p className="mb-1 text-xs font-medium text-gray-500">
              Or enter this code manually:
            </p>
            <code className="block break-all text-sm font-mono text-gray-800">
              {secret}
            </code>
          </div>

          <form onSubmit={handleVerify} className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Enter the 6-digit code from your app
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={totpToken}
                onChange={(e) => setTotpToken(e.target.value.replace(/\D/g, ""))}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-center text-2xl font-mono tracking-[0.5em] focus:border-terracotta focus:outline-none focus:ring-2 focus:ring-terracotta/20"
                placeholder="000000"
                autoFocus
                required
              />
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStep("idle");
                  setError("");
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={actionLoading}
                className="flex-1"
              >
                Verify & Enable
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Backup codes — show after successful verification */}
      {step === "backup" && (
        <div className="space-y-4">
          <div className="rounded-lg bg-emerald-50 p-4">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
              <div className="text-sm text-emerald-800">
                <p className="font-medium">2FA is now enabled!</p>
                <p className="mt-1 text-emerald-700">
                  Save these backup codes somewhere safe. You&apos;ll need them if you lose access to your authenticator app.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-gray-900 p-4">
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((code, i) => (
                <code
                  key={i}
                  className="rounded bg-gray-800 px-3 py-1.5 text-center text-sm font-mono text-emerald-400"
                >
                  {code}
                </code>
              ))}
            </div>
          </div>

          <Button
            variant="outline"
            onClick={copyBackupCodes}
            className="w-full"
          >
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4 text-emerald-500" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy Backup Codes
              </>
            )}
          </Button>

          <Button onClick={() => setStep("idle")} className="w-full">
            Done
          </Button>
        </div>
      )}

      {/* Disable — confirm with password */}
      {step === "disable" && (
        <form onSubmit={handleDisable} className="space-y-4">
          <div className="rounded-lg bg-red-50 p-4">
            <div className="flex gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
              <div className="text-sm text-red-800">
                <p className="font-medium">Are you sure?</p>
                <p className="mt-1 text-red-700">
                  Disabling 2FA will make your account less secure. Enter your password to confirm.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              value={disablePassword}
              onChange={(e) => setDisablePassword(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-200"
              required
              autoFocus
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setStep("idle");
                setDisablePassword("");
                setError("");
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              isLoading={actionLoading}
              className="flex-1"
            >
              Disable 2FA
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
