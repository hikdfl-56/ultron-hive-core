import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const message = body.message || body.prompt || "";

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { response: "[ULTRON SYSTEM ERROR]: Invalid message payload." },
        { status: 400 }
      );
    }

    const apiKey =
      process.env.AI_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        response:
          "ULTRON Core active. Add AI_API_KEY to .env.local for live responses.",
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: message }],
            },
          ],
          systemInstruction: {
            parts: [
              {
                text: "You are ULTRON, a sophisticated, tactical, high-tech AI system. Keep answers direct, concise, and structured in short tech-focused paragraphs.",
              },
            ],
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json({
        response: `[ULTRON SYSTEM ERROR]: ${errorData.error?.message || "API request failed"}`,
      });
    }

    const data = await response.json();
    const generatedText =
      data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      return NextResponse.json({
        response: "[ULTRON SYSTEM ERROR]: Empty response received from Gemini API.",
      });
    }

    return NextResponse.json({ response: generatedText });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({
      response: `[ULTRON SYSTEM ERROR]: ${
        error instanceof Error ? error.message : "API request failed"
      }`,
    });
  }
}
