"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface QueryRecord {
  id: string;
  seed_keyword: string;
  result_count: number;
  created_at: string;
  source: string;
}

export default function DashboardPage() {
  const [queries, setQueries] = useState<QueryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{
    email: string;
    plan: string;
    searches_remaining: number;
    total_searches: number;
  } | null>(null);

  // Simulated data — in production, fetch from Supabase
  useEffect(() => {
    const timer = setTimeout(() => {
      setProfile({
        email: "user@example.com",
        plan: "free",
        searches_remaining: 3,
        total_searches: 12,
      });
      setQueries([
        {
          id: "1",
          seed_keyword: "best CRM for startups",
          result_count: 50,
          created_at: new Date(Date.now() - 3600000).toISOString(),
          source: "deepseek",
        },
        {
          id: "2",
          seed_keyword: "email marketing automation",
          result_count: 48,
          created_at: new Date(Date.now() - 86400000).toISOString(),
          source: "deepseek",
        },
        {
          id: "3",
          seed_keyword: "SEO tools comparison",
          result_count: 50,
          created_at: new Date(Date.now() - 172800000).toISOString(),
          source: "deepseek",
        },
        {
          id: "4",
          seed_keyword: "content marketing strategy B2B",
          result_count: 45,
          created_at: new Date(Date.now() - 259200000).toISOString(),
          source: "fallback",
        },
      ]);
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">
              <span className="gradient-text">Dashboard</span>
            </h1>
            <p className="text-gray-400 mt-1">Your SEO research overview</p>
          </div>
          <Link
            href="/analyze"
            className="px-5 py-2.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 transition"
          >
            + New Search
          </Link>
        </div>

        {/* Stats cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-28 rounded-xl bg-gray-800/50 border border-gray-700 animate-pulse"
              />
            ))}
          </div>
        ) : profile ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="p-5 rounded-xl bg-gray-800/50 border border-gray-700">
              <p className="text-sm text-gray-400 mb-1">Plan</p>
              <div className="flex items-center gap-2">
                <span
                  className={`text-lg font-bold uppercase ${
                    profile.plan === "pro" ? "text-accent" : "text-gray-300"
                  }`}
                >
                  {profile.plan}
                </span>
                {profile.plan === "free" && (
                  <Link
                    href="/pricing"
                    className="text-xs text-primary hover:underline"
                  >
                    Upgrade →
                  </Link>
                )}
              </div>
            </div>

            <div className="p-5 rounded-xl bg-gray-800/50 border border-gray-700">
              <p className="text-sm text-gray-400 mb-1">Searches Left</p>
              <p className="text-2xl font-bold">
                {profile.searches_remaining}
                <span className="text-sm text-gray-500 font-normal">
                  {" "}
                  / {profile.plan === "pro" ? "∞" : "5"} this month
                </span>
              </p>
            </div>

            <div className="p-5 rounded-xl bg-gray-800/50 border border-gray-700">
              <p className="text-sm text-gray-400 mb-1">Total Searches</p>
              <p className="text-2xl font-bold">{profile.total_searches}</p>
            </div>

            <div className="p-5 rounded-xl bg-gray-800/50 border border-gray-700">
              <p className="text-sm text-gray-400 mb-1">Account</p>
              <p className="text-sm font-mono text-gray-300 truncate">
                {profile.email}
              </p>
            </div>
          </div>
        ) : null}

        {/* History table */}
        <div className="rounded-xl border border-gray-700 overflow-hidden">
          <div className="px-5 py-4 bg-gray-800/50 border-b border-gray-700">
            <h2 className="font-semibold">📋 Search History</h2>
          </div>

          {loading ? (
            <div className="p-8 space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-12 rounded-lg bg-gray-800/50 animate-pulse"
                />
              ))}
            </div>
          ) : queries.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 mb-4">No searches yet.</p>
              <Link
                href="/analyze"
                className="text-primary hover:underline"
              >
                Run your first keyword analysis →
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400">
                    <th className="px-5 py-3 font-medium">Seed Keyword</th>
                    <th className="px-5 py-3 font-medium">Results</th>
                    <th className="px-5 py-3 font-medium">Source</th>
                    <th className="px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {queries.map((q) => (
                    <tr
                      key={q.id}
                      className="border-t border-gray-700/50 hover:bg-gray-800/30 transition"
                    >
                      <td className="px-5 py-3.5 font-medium">
                        {q.seed_keyword}
                      </td>
                      <td className="px-5 py-3.5 text-gray-400">
                        {q.result_count} keywords
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${
                            q.source === "deepseek"
                              ? "bg-primary/10 text-primary border border-primary/20"
                              : "bg-yellow-900/30 text-yellow-300 border border-yellow-800"
                          }`}
                        >
                          {q.source}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-400">
                        {new Date(q.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/analyze?q=${encodeURIComponent(q.seed_keyword)}`}
                          className="text-accent text-xs hover:underline"
                        >
                          Re-run →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/analyze"
            className="p-5 rounded-xl bg-gray-800/50 border border-gray-700 hover:border-primary/40 transition text-center"
          >
            <span className="text-2xl block mb-2">🔍</span>
            <span className="font-semibold">Keyword Discovery</span>
          </Link>
          <Link
            href="/pricing"
            className="p-5 rounded-xl bg-gray-800/50 border border-gray-700 hover:border-accent/40 transition text-center"
          >
            <span className="text-2xl block mb-2">💎</span>
            <span className="font-semibold">Upgrade Plan</span>
          </Link>
          <button
            onClick={() => alert("Export feature coming soon!")}
            className="p-5 rounded-xl bg-gray-800/50 border border-gray-700 hover:border-green-500/40 transition text-center"
          >
            <span className="text-2xl block mb-2">📤</span>
            <span className="font-semibold">Export Data</span>
          </button>
        </div>
      </div>
    </main>
  );
}
