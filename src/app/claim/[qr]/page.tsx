"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ClaimPage() {
  const params = useParams();
  const router = useRouter();
  const qr = params?.qr;
  const token = Array.isArray(qr) ? qr[0] : qr;

  const [loading, setLoading] = useState(true);
  const [qrData, setQrData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [claimedBy, setClaimedBy] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [claiming, setClaiming] = useState(false);
  const [selfMode, setSelfMode] = useState(false);

  useEffect(() => {
    if (!token) return;
    let mounted = true;
    setLoading(true);
    fetch(`/api/racePack/qr?qr=${encodeURIComponent(String(token))}`)
      .then((r) => r.json())
      .then((b) => {
        if (!mounted) return;
        if (b.error) {
          setError(b.error);
          setQrData(null);
        } else {
          setQrData(b.qrCode);
        }
      })
      .catch((e) => setError(String(e)))
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [token]);

  function toggleSelect(id: number) {
    setSelectedIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function submitClaim() {
    if (!token) return;
    if (selectedIds.length === 0 && !selfMode) {
      alert("Select at least one participant or use Self Claim.");
      return;
    }
    if (selfMode && !password) {
      alert("Password is required for self-claim.");
      return;
    }

    setClaiming(true);
    try {
      const res = await fetch("/api/racePack/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qrCodeData: token,
          participantIds: selectedIds.length ? selectedIds : undefined,
          claimedBy: claimedBy || (selfMode ? "self" : "staff"),
          claimType: selfMode ? "self" : "staff",
          password: selfMode ? password : undefined,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || body?.message || res.statusText);
      alert("Claim successful");
      // reload to show updated claimed state
      router.replace(window.location.pathname);
    } catch (err: any) {
      alert("Claim failed: " + (err?.message || String(err)));
    } finally {
      setClaiming(false);
    }
  }

  if (loading) return <div className="p-6 text-center">Loading QR info…</div>;
  if (error) return <div className="p-6 text-center text-red-600">Error: {error}</div>;
  if (!qrData) return <div className="p-6 text-center">No data found for this QR.</div>;

  const registration = qrData.registration;
  const participants = registration.participants || [];

  // Group participants by race category name (fallback "Unassigned")
  const groupedByCategory: Record<string, any[]> = {};
  participants.forEach((p: any) => {
    const cat = p.category?.name || "Unassigned";
    groupedByCategory[cat] = groupedByCategory[cat] || [];
    groupedByCategory[cat].push(p);
  });

  return (
    <main className="min-h-screen pt-28 p-4 md:p-6 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <header className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">Claim Race Pack</h1>
              <p className="text-sm text-gray-600">
                Registration: <strong>{registration.user?.name || "—"}</strong>
                {" • "}Total packs: <strong>{qrData.totalPacks}</strong>
                {" • "}Scans remaining: <strong>{qrData.scansRemaining}</strong>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <button
                onClick={() => { navigator.clipboard?.writeText(token || ""); alert("QR token copied"); }}
                className="px-4 py-2 bg-gray-200 text-sm rounded-md hover:bg-gray-300"
              >
                Copy Token
              </button>
              <button
                onClick={() => { setSelectedIds([]); setPassword(''); setClaimedBy(''); }}
                className="px-4 py-2 border rounded-md text-sm"
              >
                Reset
              </button>
            </div>
          </div>
        </header>

        <section className="mb-6">
          <h2 className="font-semibold mb-3">Participants (grouped by category)</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(groupedByCategory).map(([categoryName, list]) => {
              const total = list.length;
              const claimed = list.filter((x: any) => x.packClaimed).length;
              return (
                <div key={categoryName} className="bg-white rounded-lg border p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-sm font-medium">{categoryName}</div>
                      <div className="text-xs text-gray-500">Total: {total} • Claimed: {claimed}</div>
                    </div>
                    <div className="text-xs text-gray-400">{/* optional small badge */}</div>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {list.map((p: any) => (
                      <label
                        key={p.id}
                        className={`flex items-center justify-between gap-3 p-2 rounded-md border transition ${
                          p.packClaimed ? "bg-gray-100 opacity-75 cursor-not-allowed" : "bg-white hover:bg-green-50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            disabled={p.packClaimed}
                            checked={selectedIds.includes(p.id)}
                            onChange={() => toggleSelect(p.id)}
                            className="h-4 w-4"
                          />
                          <div className="text-sm">
                            <div className="font-medium">{p.bibNumber || `#${p.id}`}</div>
                            <div className="text-xs text-gray-500">{p.fullName || p.participantName || registration.user?.name || "Participant"}</div>
                          </div>
                        </div>

                        <div className="text-xs text-gray-500 text-right">
                          {p.packClaimed ? <span className="text-emerald-600 font-semibold">Claimed</span> : <span>Unclaimed</span>}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mb-6">
          <h2 className="font-semibold mb-3">Claim Options</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-sm mb-1">Claimed By (name)</label>
              <input
                value={claimedBy}
                onChange={(e) => setClaimedBy(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                placeholder="Name of claimer (optional)"
              />
            </div>

            <div className="flex items-center gap-3">
              <label className="inline-flex items-center">
                <input type="checkbox" checked={selfMode} onChange={() => setSelfMode((s) => !s)} />
                <span className="ml-2 text-sm">Self-claim (requires admin password)</span>
              </label>
            </div>

            {selfMode && (
              <div>
                <label className="block text-sm mb-1">Admin Claim Password</label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  className="w-full px-3 py-2 border rounded"
                  placeholder="Enter claim password"
                />
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                disabled={claiming}
                onClick={submitClaim}
                className="w-full sm:w-auto px-4 py-2 bg-emerald-600 text-white rounded-md font-semibold hover:bg-emerald-700 disabled:opacity-60"
              >
                {claiming ? "Claiming…" : "Submit Claim"}
              </button>

              <button
                onClick={() => { setSelectedIds([]); setPassword(''); setClaimedBy(''); }}
                className="w-full sm:w-auto px-4 py-2 border rounded-md"
              >
                Reset
              </button>
            </div>
          </div>
        </section>

        <div className="text-sm text-gray-500 mt-4">
          Tip: staff can select exact participants to claim (per-category). For quick claims you may leave selection empty and staff will claim first available unclaimed packs.
        </div>
      </div>
    </main>
  );
}