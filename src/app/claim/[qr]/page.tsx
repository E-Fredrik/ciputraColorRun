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
  const [claimPassword, setClaimPassword] = useState<string>('');
  const [claiming, setClaiming] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authPassword, setAuthPassword] = useState<string>('');

  const CLAIM_PASSWORD = "cirun2026";

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

  function handleAuthenticate(e: React.FormEvent) {
    e.preventDefault();
    if (authPassword === CLAIM_PASSWORD) {
      setIsAuthenticated(true);
      setAuthPassword('');
    } else {
      alert('Incorrect password. Please try again.');
      setAuthPassword('');
    }
  }

  function toggleSelect(id: number) {
    setSelectedIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function submitClaim() {
    if (!token) return;
    if (selectedIds.length === 0) {
      alert("Please select at least one participant to claim.");
      return;
    }

    setClaiming(true);
    try {
      const res = await fetch("/api/racePack/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qrCodeData: token,
          participantIds: selectedIds,
          claimedBy: claimedBy || "staff",
          claimType: "staff",
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || body?.message || res.statusText);
      alert("Claim successful!");
      setSelectedIds([]);
      setClaimedBy('');
      // reload to show updated claimed state
      router.replace(window.location.pathname);
    } catch (err: any) {
      alert("Claim failed: " + (err?.message || String(err)));
    } finally {
      setClaiming(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading QR information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen pt-28 p-6 bg-gradient-to-br from-red-50 to-pink-50">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="text-2xl font-bold text-red-600 mb-2">Error</h2>
            <p className="text-gray-700">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="mt-6 px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!qrData) {
    return (
      <div className="min-h-screen pt-28 p-6 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          <p className="text-gray-600 text-lg">No data found for this QR code.</p>
        </div>
      </div>
    );
  }

  // Password authentication screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen pt-28 p-6 bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🔒</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Authentication Required</h1>
              <p className="text-gray-600">Enter the claim password to continue</p>
            </div>

            <form onSubmit={handleAuthenticate} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Claim Password
                </label>
                <input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none text-gray-800"
                  placeholder="Enter password"
                  required
                  autoFocus
                />
              </div>

              <button
                type="submit"
                className="w-full px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-lg hover:from-emerald-700 hover:to-teal-700 transform hover:scale-105 transition-all shadow-lg"
              >
                Authenticate
              </button>
            </form>

            <p className="text-xs text-gray-500 text-center mt-6">
              Contact event organizers if you don't have the password
            </p>
          </div>
        </div>
      </div>
    );
  }

  const registration = qrData.registration;
  const participants = registration.participants || [];

  // Group participants by race category name (sorted alphabetically)
  const groupedByCategory: Record<string, any[]> = {};
  participants.forEach((p: any) => {
    const cat = p.category?.name || "Unassigned";
    groupedByCategory[cat] = groupedByCategory[cat] || [];
    groupedByCategory[cat].push(p);
  });

  // Sort category names alphabetically
  const sortedCategories = Object.keys(groupedByCategory).sort();

  return (
    <main className="min-h-screen pt-28 pb-12 px-4 md:px-6 bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50">
      <div className="max-w-6xl mx-auto">
        {/* Header Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-3">Race Pack Claim System</h1>
              <div className="space-y-2">
                <p className="text-base text-gray-700">
                  <span className="font-semibold text-emerald-600">Registration:</span>{" "}
                  <span className="font-medium">{registration.user?.name || "—"}</span>
                </p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium">
                    Total Packs: {qrData.totalPacks}
                  </span>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-medium">
                    Remaining: {qrData.scansRemaining}
                  </span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full font-medium">
                    Categories: {sortedCategories.length}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => { navigator.clipboard?.writeText(token || ""); alert("QR token copied to clipboard!"); }}
                className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
              >
                📋 Copy Token
              </button>
              <button
                onClick={() => { setSelectedIds([]); setClaimedBy(''); }}
                className="px-4 py-2 border-2 border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all"
              >
                🔄 Reset Selection
              </button>
            </div>
          </div>
        </div>

        {/* Participants Section - Grouped by Category */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Participants by Category</h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {sortedCategories.map((categoryName) => {
              const list = groupedByCategory[categoryName];
              const total = list.length;
              const claimed = list.filter((x: any) => x.packClaimed).length;
              const unclaimed = total - claimed;

              return (
                <div key={categoryName} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200 p-4 shadow-md hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-gray-300">
                    <div>
                      <div className="text-lg font-bold text-gray-800">{categoryName}</div>
                      <div className="flex gap-3 mt-1 text-xs">
                        <span className="text-gray-600">Total: <strong>{total}</strong></span>
                        <span className="text-emerald-600">Claimed: <strong>{claimed}</strong></span>
                        <span className="text-orange-600">Pending: <strong>{unclaimed}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {list.map((p: any) => (
                      <label
                        key={p.id}
                        className={`flex items-center justify-between gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                          p.packClaimed
                            ? "bg-gray-200 border-gray-300 opacity-60 cursor-not-allowed"
                            : selectedIds.includes(p.id)
                            ? "bg-emerald-100 border-emerald-500 shadow-md"
                            : "bg-white border-gray-300 hover:border-emerald-400 hover:bg-emerald-50"
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            disabled={p.packClaimed}
                            checked={selectedIds.includes(p.id)}
                            onChange={() => toggleSelect(p.id)}
                            className="h-5 w-5 text-emerald-600 rounded focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-800 truncate">
                              {p.bibNumber || `#${p.id}`}
                            </div>
                            <div className="text-xs text-gray-600 truncate">
                              {p.fullName || p.participantName || registration.user?.name || "Participant"}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              Jersey: {p.jersey?.size || "—"}
                            </div>
                          </div>
                        </div>

                        <div className="text-xs font-semibold whitespace-nowrap">
                          {p.packClaimed ? (
                            <span className="px-2 py-1 bg-emerald-600 text-white rounded-full">✓ Claimed</span>
                          ) : (
                            <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full">Pending</span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Claim Options Section */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Claim Options</h2>
          
          <div className="space-y-5">
            {/* Selected Count */}
            {selectedIds.length > 0 && (
              <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-lg">
                <p className="text-emerald-800 font-semibold">
                  ✓ {selectedIds.length} participant{selectedIds.length > 1 ? 's' : ''} selected for claiming
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Claimed By (Staff Name) - Optional
              </label>
              <input
                value={claimedBy}
                onChange={(e) => setClaimedBy(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all outline-none text-gray-800"
                placeholder="Enter staff name (optional)"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                disabled={claiming || selectedIds.length === 0}
                onClick={submitClaim}
                className={`flex-1 px-6 py-4 rounded-lg font-bold text-white text-lg shadow-lg transition-all transform ${
                  claiming || selectedIds.length === 0
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 hover:scale-105 active:scale-95"
                }`}
              >
                {claiming ? "Processing..." : `Claim ${selectedIds.length} Pack${selectedIds.length > 1 ? 's' : ''}`}
              </button>

              <button
                onClick={() => { setSelectedIds([]); setClaimedBy(''); }}
                className="px-6 py-4 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all"
              >
                Clear Selection
              </button>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>💡 Tip:</strong> Select participants from the category cards above, then click "Claim" to process their race packs.
              You can select multiple participants across different categories in one claim.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}