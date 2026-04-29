"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function LandingPage() {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [demoCount, setDemoCount] = useState(3);

  const handleDemoSearch = async () => {
    if (!keyword.trim() || demoCount <= 0) return;
    setLoading(true);
    try {
      const res = await fetch("/api/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: keyword.trim(), demo: true }),
      });
      const data = await res.json();
      setResults(data.keywords || []);
      setDemoCount((prev) => prev - 1);
    } catch {
      // silent fail for demo
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen">
      {/* ===== HERO ===== */}
      <section className="relative px-4 pt-24 pb-16 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm text-primary mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            AI-Powered SEO Research
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold leading-tight mb-6">
            Find Long-Tail{" "}
            <span className="gradient-text">Keywords</span>
            <br />
            Your Competitors Missed
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            DeepKeyword uses AI to analyze search intent and generate 50+ high-value
            long-tail keywords in seconds. Stop guessing — start ranking.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/pricing"
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold text-lg hover:opacity-90 transition shadow-lg shadow-primary/25"
            >
              Get Started Free →
            </Link>
            <Link
              href="#demo"
              className="px-8 py-4 rounded-xl bg-gray-800 border border-gray-700 text-white font-semibold text-lg hover:bg-gray-700 transition"
            >
              Try Demo ↓
            </Link>
          </div>
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section className="max-w-5xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: "50+", label: "Keywords per search" },
            { value: "3s", label: "Average generation time" },
            { value: "99%", label: "Unique keywords found" },
            { value: "12k+", label: "Keywords generated daily" },
          ].map((s, i) => (
            <div
              key={i}
              className="p-6 rounded-xl bg-gray-800/50 border border-gray-700/50 text-center"
            >
              <p className="text-3xl font-bold text-accent mb-1">{s.value}</p>
              <p className="text-sm text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== DEMO SEARCH ===== */}
      <section id="demo" className="max-w-2xl mx-auto px-4 pb-20 scroll-mt-20">
        <h2 className="text-2xl font-bold text-center mb-2">Try It Now</h2>
        <p className="text-gray-400 text-center mb-8">
          {demoCount} free demo searches remaining — no signup required
        </p>

        <div className="flex gap-3 mb-4">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder='e.g. "best CRM for startups"'
            className="flex-1 px-5 py-3.5 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition text-lg"
            onKeyDown={(e) => e.key === "Enter" && handleDemoSearch()}
          />
          <button
            onClick={handleDemoSearch}
            disabled={loading || demoCount <= 0}
            className="px-8 py-3.5 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 disabled:opacity-40 transition text-lg"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Analyzing...
              </span>
            ) : (
              "Generate"
            )}
          </button>
        </div>

        {results.length > 0 && (
          <div className="rounded-xl bg-gray-800/50 border border-gray-700 p-6">
            <p className="text-accent font-semibold mb-4">
              🎯 Generated {results.length} long-tail keywords
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto">
              {results.map((kw, i) => (
                <div
                  key={i}
                  className="px-4 py-2.5 rounded-lg bg-gray-900/60 border border-gray-700/50 text-sm hover:border-primary/30 transition cursor-default"
                >
                  {kw}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ===== FEATURES ===== */}
      <section className="max-w-6xl mx-auto px-4 pb-20">
        <h2 className="text-3xl font-bold text-center mb-12">
          Everything You Need for{" "}
          <span className="gradient-text">SEO Research</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: "🔍",
              title: "Semantic Intent Analysis",
              desc: "Our AI understands what searchers actually want — informational, commercial, navigational, or transactional intent.",
            },
            {
              icon: "📊",
              title: "Competition Intelligence",
              desc: "Get estimated search volume, keyword difficulty, and CPC for every keyword variation we generate.",
            },
            {
              icon: "✍️",
              title: "AI Content Briefs",
              desc: "One-click content outlines with target word count, suggested headings, and semantic entities to include.",
            },
            {
              icon: "🚀",
              title: "Bulk Generation",
              desc: "Need 500 keywords for a content silo? Pro plan supports batch processing up to 1,000 seed terms.",
            },
            {
              icon: "📈",
              title: "Trend Detection",
              desc: "Spot rising keywords before they peak. Our AI surfaces emerging trends in your niche.",
            },
            {
              icon: "🔗",
              title: "Export & Integrate",
              desc: "Export to CSV, Google Sheets, or push directly to Ahrefs and Semrush via API.",
            },
          ].map((f, i) => (
            <div
              key={i}
              className="p-6 rounded-xl bg-gray-800/40 border border-gray-700/50 hover:border-primary/30 transition"
            >
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== PRICING CTA ===== */}
      <section className="max-w-3xl mx-auto px-4 pb-20 text-center">
        <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-accent/5 border border-primary/20 p-10">
          <h2 className="text-3xl font-bold mb-4">Ready to Scale Your SEO?</h2>
          <p className="text-gray-400 mb-8 max-w-lg mx-auto">
            Start with 5 free searches per month. Upgrade to Pro for unlimited
            access and AI content generation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/pricing"
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-bold hover:opacity-90 transition"
            >
              View Plans →
            </Link>
            <Link
              href="/analyze"
              className="px-8 py-4 rounded-xl bg-gray-800 border border-gray-700 text-white font-semibold hover:bg-gray-700 transition"
            >
              Sign In & Start
            </Link>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-gray-800 py-8 text-center text-sm text-gray-500">
        <p>© {new Date().getFullYear()} DeepKeyword. Built for SEO professionals.</p>
      </footer>
    </main>
  );
}
