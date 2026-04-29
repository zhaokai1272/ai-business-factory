"use client";

import { useState } from "react";
import Script from "next/script";
import Link from "next/link";

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = (priceId: string, label: string) => {
    // In production, this loads Paddle.js and opens checkout
    // For now, we simulate and show the user what happens
    setLoading(label);

    setTimeout(() => {
      // Simulate Paddle checkout opening
      alert(
        `🏁 Paddle checkout would open for: ${label}\nPrice ID: ${priceId}\n\n` +
          `In production, this integrates with Paddle.js for a seamless overlay checkout.`
      );
      setLoading(null);
    }, 1000);
  };

  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "/month",
      description: "For trying out the tool",
      priceId: "free",
      searches: "5 searches/month",
      features: [
        "50 keywords per search",
        "Basic intent analysis",
        "CSV export",
        "Search history (7 days)",
      ],
      cta: "Get Started",
      popular: false,
      gradient: "",
    },
    {
      name: "Pro",
      price: "$19",
      period: "/month",
      description: "For serious SEO professionals",
      priceId: "pri_01hxxxxx_pro_monthly",
      searches: "Unlimited searches",
      features: [
        "500 keywords per search",
        "Full intent + difficulty + CPC data",
        "AI content briefs (unlimited)",
        "Bulk keyword processing",
        "Search history (forever)",
        "Priority API access",
        "Export to Ahrefs / Semrush",
        "Email reports",
      ],
      cta: "Start Pro Trial",
      popular: true,
      gradient: "from-primary to-accent",
    },
    {
      name: "Pay-as-you-go",
      price: "$3",
      period: "/report",
      description: "One-time purchase",
      priceId: "pri_01hxxxxx_single_report",
      searches: "1 report",
      features: [
        "50 keywords per report",
        "Basic intent analysis",
        "1 AI content brief",
        "CSV export",
        "No subscription",
      ],
      cta: "Buy One Report",
      popular: false,
      gradient: "",
    },
  ];

  return (
    <>
      {/* Load Paddle.js in production */}
      {process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN &&
        process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN !== "test_xxx" && (
          <Script
            src="https://cdn.paddle.com/paddle/v2/paddle.js"
            strategy="afterInteractive"
          />
        )}

      <main className="min-h-screen px-4 py-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">
              Simple,{" "}
              <span className="gradient-text">Transparent</span> Pricing
            </h1>
            <p className="text-lg text-gray-400 max-w-xl mx-auto">
              Start free. Upgrade when you&apos;re ready. No hidden fees, cancel
              anytime.
            </p>
          </div>

          {/* Plans */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {plans.map((plan, i) => (
              <div
                key={i}
                className={`relative rounded-2xl border p-8 flex flex-col ${
                  plan.popular
                    ? "border-primary/40 bg-gray-800/60"
                    : "border-gray-700 bg-gray-800/30"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-primary to-accent text-white text-xs font-bold">
                    MOST POPULAR
                  </div>
                )}

                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                <p className="text-sm text-gray-400 mb-6">{plan.description}</p>

                <div className="mb-6">
                  <span className="text-4xl font-extrabold">{plan.price}</span>
                  <span className="text-gray-400 ml-1">{plan.period}</span>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  <li className="flex items-center gap-2 text-sm">
                    <span className="text-accent font-bold">
                      {plan.searches}
                    </span>
                  </li>
                  {plan.features.map((f, j) => (
                    <li
                      key={j}
                      className="flex items-start gap-2 text-sm text-gray-300"
                    >
                      <span className="text-green-400 mt-0.5 shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleCheckout(plan.priceId, plan.name)}
                  disabled={loading !== null}
                  className={`w-full py-3 rounded-xl font-bold text-center transition disabled:opacity-50 ${
                    plan.popular
                      ? `bg-gradient-to-r ${plan.gradient} text-white hover:opacity-90`
                      : "bg-gray-700 text-white hover:bg-gray-600"
                  }`}
                >
                  {loading === plan.name ? (
                    <span className="inline-flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Loading...
                    </span>
                  ) : (
                    plan.cta
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* FAQ */}
          <div className="max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl font-bold text-center mb-8">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {[
                {
                  q: "Can I cancel anytime?",
                  a: "Yes. Pro is month-to-month with no long-term contract. Cancel with one click and your access continues until the end of the billing period.",
                },
                {
                  q: "What counts as a search?",
                  a: "Each time you enter a seed keyword and click 'Analyze', that counts as one search — even if you generate 50+ keyword variations in that single search.",
                },
                {
                  q: "Is my data secure?",
                  a: "Absolutely. Your keyword research data is stored encrypted in Supabase. We never share or sell your data. We use Paddle for secure payment processing — we never touch your credit card.",
                },
                {
                  q: "What's the difference between Free and Pro?",
                  a: "Free gets 5 searches/month with 50 keywords each. Pro unlocks unlimited searches, 500 keywords per search, AI content briefs, bulk processing, and priority support.",
                },
              ].map((faq, i) => (
                <details
                  key={i}
                  className="group rounded-xl bg-gray-800/40 border border-gray-700/50 overflow-hidden"
                >
                  <summary className="px-6 py-4 cursor-pointer font-semibold list-none flex items-center justify-between">
                    {faq.q}
                    <span className="text-gray-400 group-open:rotate-180 transition-transform">
                      ▼
                    </span>
                  </summary>
                  <div className="px-6 pb-4 text-sm text-gray-400 leading-relaxed">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center pb-10">
            <p className="text-gray-400 mb-2">Have questions?</p>
            <a
              href="mailto:support@deepkeyword.com"
              className="text-accent hover:underline"
            >
              Contact support →
            </a>
          </div>

          {/* Back link */}
          <div className="text-center pb-6">
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-300 transition">
              ← Back to Home
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
