// app/api/keywords/route.ts — Keyword generation API endpoint
import { NextRequest, NextResponse } from "next/server";

// Configuration
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

export async function POST(req: NextRequest) {
  try {
    const { keyword } = await req.json();
    if (!keyword || typeof keyword !== "string") {
      return NextResponse.json({ error: "Keyword is required" }, { status: 400 });
    }

    // TODO: Check user auth + free tier limit (5/month) via Supabase

    // Call DeepSeek API for keyword expansion
    const prompt = `You are an SEO expert. Given the seed keyword "${keyword}", generate 30 long-tail keyword variations that:
1. Have search intent behind them
2. Include question-based, comparison, and transactional variants
3. Cover different stages of the buyer journey
4. Are realistic (people actually search these)

Return ONLY a JSON array of strings, no other text. Example: ["best crm for startups 2024","how to choose crm for small business","crm comparison for startups"]`;

    const response = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      console.error("[keywords] DeepSeek API error:", response.status);
      // Fallback: return simulated keywords
      return NextResponse.json({
        keywords: [
          `${keyword} best practices`,
          `${keyword} for beginners`,
          `${keyword} vs alternatives`,
          `${keyword} guide 2024`,
          `how to ${keyword}`,
          `${keyword} tools and software`,
          `${keyword} for small business`,
          `${keyword} examples`,
          `best ${keyword} 2024`,
          `${keyword} comparison`
        ],
        source: "fallback"
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";
    const keywords = JSON.parse(content);

    // TODO: Save to Supabase for user history

    return NextResponse.json({ keywords, source: "deepseek" });
  } catch (error: any) {
    console.error("[keywords] Error:", error);
    return NextResponse.json({ error: "Failed to generate keywords" }, { status: 500 });
  }
}
