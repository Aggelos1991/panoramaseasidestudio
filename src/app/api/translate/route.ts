import { NextRequest, NextResponse } from "next/server";
import * as deepl from "deepl-node";
import { getAdminSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKey = process.env.DEEPL_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Translation service not configured" },
        { status: 503 },
      );
    }

    const body = await request.json();
    const { texts, targetLang } = body;

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return NextResponse.json(
        { error: "texts array is required" },
        { status: 400 },
      );
    }

    if (!targetLang || !["el", "de"].includes(targetLang)) {
      return NextResponse.json(
        { error: "targetLang must be 'el' or 'de'" },
        { status: 400 },
      );
    }

    const translator = new deepl.Translator(apiKey);

    const targetMap: Record<string, deepl.TargetLanguageCode> = {
      el: "el",
      de: "de",
    };

    const results = await translator.translateText(
      texts,
      "en",
      targetMap[targetLang],
    );

    const translations = (Array.isArray(results) ? results : [results]).map(
      (r) => r.text,
    );

    return NextResponse.json({ translations });
  } catch (error) {
    console.error("Translation error:", error);
    return NextResponse.json(
      { error: "Translation failed" },
      { status: 500 },
    );
  }
}
