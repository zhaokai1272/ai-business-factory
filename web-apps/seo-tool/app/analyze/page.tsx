"use client";

import { useState } from "react";
import Link from "next/link";

interface KeywordResult {
  keyword: string;
  volume: number;
  difficulty: number;
  cpc: number;
  intent: string;
}

interface ContentBrief {
  title: string;
  wordCount: number;
  headings: string[];
  entities: string[];
  outline: string;
}

export default function AnalyzePage() {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<KeywordResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [brief, setBrief] = useState<ContentBrief | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState<string>("");
  const [error, setError] = useState("");

  const handleSearch = async () => {
    if (!keyword.trim()) return;
    setLoading(true);
    setError("");
    setResults([]);
    setBrief(null);
    try {
      const res = await fetch("/api/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: keyword.trim() }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResults(data.keywords || []);
      }
    } catch {
      setError("Failed to connect. Please try again.");
    }
    setLoading(false);
  };

  const handleGenerateBrief = async (kw: string) => {
    setSelectedKeyword(kw);
    setBriefLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: kw, type: "content_brief" }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setBrief(data.brief);
      }
    } catch {
      setError("Failed to generate content brief.");
    }
    setBriefLoading(false);
  };

  const handleExportCSV = () => {
    if (results.length === 0) return;
    const headers = ["Keyword", "Volume", "Difficulty", "CPC", "Intent"];
    const rows = results.map((r) =>
      [r.keyword, r.volume, r.difficulty, r.cpc, r.intent].join(",")
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `deepkeyword-${keyword.replace(/\s+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const intentColors: Record<string, string> = {
    informational: "bg-blue-900/50 text-blue-300 border-blue-800",
    commercial: "bg-green-900/50 text-green-300 border-green-800",
    transactional: "bg-purple-900/50 text-purple-300 border-purple-800",
    navigational: "bg-yellow-900/50 text-yellow-300 border-yellow-800",
  };

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">
              <span className="gradient-text">Keyword Analysis</span>
            </h1>
            <p className="text-gray-400 mt-1">
              Enter a seed keyword to discover long-tail variations
            </p>
          </div>
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm hover:bg-gray-700 transition"
          >
            ← Dashboard
          </Link>
        </div>

        {/* Search Bar */}
        <div className="flex gap-3 mb-8">
          <div className="flex-1 relative">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder='Enter a seed keyword — e.g. "email marketing"'
              className="w-full px-5 py-3.5 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition text-lg"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || !keyword.trim()}
            className="px-8 py-3.5 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 disabled:opacity-40 transition text-lg flex items-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Analyzing...
              </>
            ) : (
              "Analyze"
            )}
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-900/30 border border-red-800 text-red-300">
            {error}
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">
                🎯 {results.length} Keywords for &quot;{keyword}&quot;
              </h2>
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-600 text-sm hover:bg-gray-700 transition"
              >
                📥 Export CSV
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-gray-700">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-800/80 text-left">
                    <th className="px-5 py-3 font-semibold text-gray-300">Keyword</th>
                    <th className="px-5 py-3 font-semibold text-gray-300">Volume</th>
                    <th className="px-5 py-3 font-semibold text-gray-300">Difficulty</th>
                    <th className="px-5 py-3 font-semibold text-gray-300">CPC</th>
                    <th className="px-5 py-3 font-semibold text-gray-300">Intent</th>
                    <th className="px-5 py-3 font-semibold text-gray-300">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr
                      key={i}
                      className="border-t border-gray-700/50 hover:bg-gray-800/30 transition"
                    >
                      <td className="px-5 py-3 font-medium">{r.keyword}</td>
                      <td className="px-5 py-3 text-gray-400">
                        {r.volume?.toLocaleString() || "—"}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            (r.difficulty || 0) > 60
                              ? "bg-red-900/50 text-red-300"
                              : (r.difficulty || 0) > 30
                              ? "bg-yellow-900/50 text-yellow-300"
                              : "bg-green-900/50 text-green-300"
                          }`}
                        >
                          {r.difficulty || "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-400">
                        {r.cpc ? `$${r.cpc.toFixed(2)}` : "—"}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-xs border ${
                            intentColors[r.intent] || "bg-gray-800 text-gray-400 border-gray-700"
                          }`}
                        >
                          {r.intent || "general"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <button
                          onClick={() => handleGenerateBrief(r.keyword)}
                          disabled={briefLoading}
                          className="px-3 py-1.5 rounded-lg bg-accent/10 text-accent border border-accent/30 text-xs font-medium hover:bg-accent/20 transition disabled:opacity-40"
                        >
                          {briefLoading && selectedKeyword === r.keyword
                            ? "Loading..."
                            : "Generate Brief"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Content Brief */}
        {brief && (
          <div className="rounded-xl bg-gray-800/50 border border-gray-700 p-6 mb-8">
            <h3 className="text-lg font-bold text-accent mb-4">
              📝 Content Brief: {brief.title}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-400 mb-2">Target Word Count</p>
                <p className="text-2xl font-bold">{brief.wordCount}</p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-400 mb-2">Suggested Headings</p>
                <ul className="space-y-1">
                  {brief.headings.map((h, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-accent mt-1">•</span> {h}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-400 mb-2">Semantic Entities</p>
              <div className="flex flex-wrap gap-2">
                {brief.entities.map((e, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs"
                  >
                    {e}
                  </span>
                ))}
              </div>
            </div>
            {brief.outline && (
              <div className="mt-4">
                <p className="text-sm text-gray-400 mb-2">Outline</p>
                <pre className="whitespace-pre-wrap text-sm bg-gray-900/60 rounded-lg p-4 border border-gray-700">
                  {brief.outline}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!loading && results.length === 0 && !error && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-300 mb-2">
              Ready to discover keywords?
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Enter a seed keyword above. Our AI will generate long-tail
              variations with search volume, difficulty, CPC, and intent
              analysis.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
