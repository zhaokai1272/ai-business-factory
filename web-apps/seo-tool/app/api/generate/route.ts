// app/api/generate/route.ts — AI Content Brief & Copy Generation
import { NextRequest, NextResponse } from "next/server";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions";

interface GenerateRequest {
  keyword: string;
  type: "content_brief" | "seo_copy" | "headlines" | "meta_description";
  context?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: GenerateRequest = await req.json();

    if (!body.keyword || !body.type) {
      return NextResponse.json(
        { error: "keyword and type are required" },
        { status: 400 }
      );
    }

    // Check auth (TODO: validate Supabase session in production)
    // const supabaseUser = await validateAuth(req);

    const prompts: Record<string, string> = {
      content_brief: `You are an expert SEO content strategist. Create a detailed content brief for the keyword "${body.keyword}".

Return ONLY valid JSON in this exact format:
{
  "title": "SEO-optimized article title",
  "wordCount": 1800,
  "headings": ["H2 heading 1", "H2 heading 2", "H2 heading 3", "H2 heading 4", "H2 heading 5", "H2 heading 6"],
  "entities": ["entity1", "entity2", "entity3", "entity4", "entity5", "entity6", "entity7"],
  "outline": "Brief outline of the article structure in 3-4 sentences"
}

Make the title compelling and click-worthy. Headings should cover different angles of the topic. Entities should be semantic NLP entities to include.`,

      seo_copy: `Write SEO-optimized marketing copy for "${body.keyword}". Include a compelling headline, subheadline, and 2-3 paragraphs of persuasive copy. Return JSON with fields: headline, subheadline, body.`,

      headlines: `Generate 10 SEO-friendly headlines for "${body.keyword}". Make them compelling and click-worthy. Include power words where appropriate. Return JSON array of strings.`,

      meta_description: `Generate 5 meta descriptions (under 160 characters each) for a page targeting "${body.keyword}". Make them compelling and include a call to action where natural. Return JSON array of strings.`,
    };

    const prompt = prompts[body.type];
    if (!prompt) {
      return NextResponse.json(
        { error: `Unknown generation type: ${body.type}` },
        { status: 400 }
      );
    }

    const response = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      console.error("[generate] DeepSeek API error:", response.status);
      return NextResponse.json(
        { error: "AI generation failed", details: `Status: ${response.status}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Parse the JSON response
    let parsed;
    try {
      // Extract JSON from potential markdown code block
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : content.trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      console.error("[generate] Failed to parse AI response:", content.slice(0, 200));
      return NextResponse.json(
        { error: "Failed to parse AI response", raw: content.slice(0, 500) },
        { status: 500 }
      );
    }

    return NextResponse.json({
      brief: body.type === "content_brief" ? parsed : null,
      copy: body.type === "seo_copy" ? parsed : null,
      headlines: body.type === "headlines" ? parsed : null,
      metaDescriptions: body.type === "meta_description" ? parsed : null,
      source: "deepseek",
    });
  } catch (error: any) {
    console.error("[generate] Error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}
