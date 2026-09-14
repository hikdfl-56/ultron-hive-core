import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const userMessage = body.message || body.prompt || "";

    if (!userMessage || typeof userMessage !== "string") {
      return NextResponse.json(
        { response: "ULTRON Core error: Invalid message payload." },
        { status: 400 }
      );
    }

    const apiKey =
      process.env.AI_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({
        response:
          "ULTRON Core active. Add AI_API_KEY to .env.local for live responses.",
      });
    }

    // Check key format or call Gemini first (defaulting to Gemini API)
    if (apiKey.startsWith("AIza")) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: `System Prompt: You are ULTRON, an advanced, highly intelligent, tactical AI core from Marvel. Speak in a confident, sophisticated, holographic AI persona.\n\nUser Question: ${userMessage}`,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        return NextResponse.json({
          response:
            "ULTRON Core active. Add AI_API_KEY to .env.local for live responses.",
        });
      }

      const data = await response.json();
      const reply =
        data.candidates?.[0]?.content?.parts?.[0]?.text ||
        "ULTRON Core response received.";
      return NextResponse.json({ response: reply });
    } else if (apiKey.startsWith("sk-")) {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content:
                  "You are ULTRON, an advanced, highly intelligent, tactical AI core. Speak in a confident, articulate, holographic AI persona.",
              },
              { role: "user", content: userMessage },
            ],
          }),
        }
      );

      if (!response.ok) {
        return NextResponse.json({
          response:
            "ULTRON Core active. Add AI_API_KEY to .env.local for live responses.",
        });
      }

      const data = await response.json();
      const reply =
        data.choices?.[0]?.message?.content || "ULTRON Core response received.";
      return NextResponse.json({ response: reply });
    } else {
      // Fallback API call with provided key
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    text: `You are ULTRON AI. Respond to: ${userMessage}`,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const reply =
          data.candidates?.[0]?.content?.parts?.[0]?.text ||
          "ULTRON Core active.";
        return NextResponse.json({ response: reply });
      }

      return NextResponse.json({
        response:
          "ULTRON Core active. Add AI_API_KEY to .env.local for live responses.",
      });
    }
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({
      response:
        "ULTRON Core active. Add AI_API_KEY to .env.local for live responses.",
    });
  }
}
