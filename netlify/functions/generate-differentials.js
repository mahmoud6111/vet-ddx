export async function handler(event) {
  try {
    // السماح بطلبات POST فقط
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method not allowed" }),
      };
    }

    const body = JSON.parse(event.body || "{}");
    const prompt = body.prompt;

    if (!prompt) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Prompt is required" }),
      };
    }

    // سحب المفتاح من إعدادات Netlify (Environment Variables)
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Server error: API key not configured on Netlify" }),
      };
    }

    // الاتصال بموديل Gemini-1.5-flash (أسرع وأرخص)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: "Gemini API error", details: data }),
      };
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response text found.";

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text }),
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error", details: error.message }),
    };
  }
}