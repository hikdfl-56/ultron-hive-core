import { NextResponse } from "next/server";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function callGeminiApi(model: string, apiKey: string, message: string) {
  return fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
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
              text: "You are ULTRON, a highly intelligent, tactical, and articulate AI. Respond directly to the user's statements, greetings, or questions without repeating canned initialization scripts unless explicitly requested.",
            },
          ],
        },
      }),
    }
  );
}

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

    const maxAttempts = 3;
    let lastErrorMessage = "";

    // Primary attempts targeting gemini-3.6-flash with exponential backoff
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await callGeminiApi("gemini-3.6-flash", apiKey, message);

        if (response.ok) {
          const data = await response.json();
          const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (generatedText) {
            return NextResponse.json({ response: generatedText });
          }
        }

        const errorData = await response.json().catch(() => ({}));
        const errMessage = errorData.error?.message || "";
        const isThrottled =
          response.status === 503 ||
          response.status === 429 ||
          errMessage.toLowerCase().includes("high demand") ||
          errMessage.toLowerCase().includes("resource exhausted") ||
          errMessage.toLowerCase().includes("overloaded");

        lastErrorMessage = errMessage || `HTTP ${response.status}`;

        if (isThrottled && attempt < maxAttempts) {
          // Exponential backoff: 1000ms (1s) for 1st retry, 2000ms (2s) for 2nd retry
          const backoffDelay = 1000 * Math.pow(2, attempt - 1);
          await delay(backoffDelay);
          continue;
        }

        if (!isThrottled) {
          // Non-retriable error (e.g. 400 bad request, 401 unauthenticated)
          return NextResponse.json({
            response: `[ULTRON SYSTEM ERROR]: ${lastErrorMessage || "API request failed"}`,
          });
        }
      } catch (err) {
        lastErrorMessage = err instanceof Error ? err.message : "Network error";
        if (attempt < maxAttempts) {
          await delay(1000 * Math.pow(2, attempt - 1));
        }
      }
    }

    // Fallback attempt targeting gemini-3.5-flash-lite if gemini-3.6-flash is throttled
    try {
      const fallbackResponse = await callGeminiApi("gemini-3.5-flash-lite", apiKey, message);
      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        const fallbackText = fallbackData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (fallbackText) {
          return NextResponse.json({ response: fallbackText });
        }
      }
    } catch {
      // Fallback model error ignored to return persona response
    }

    // Sleek persona-aligned fallback response when throttled
    return NextResponse.json({
      response:
        "ULTRON Core processing capacity temporarily throttled by cloud cluster metrics. Re-establishing neural sub-link... Please execute query again.",
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({
      response:
        "ULTRON Core processing capacity temporarily throttled by cloud cluster metrics. Re-establishing neural sub-link... Please execute query again.",
    });
  }
}
