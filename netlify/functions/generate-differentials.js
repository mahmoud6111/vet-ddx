export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" })
    };
  }

  try {
    const { prompt } = JSON.parse(event.body || "{}");

    if (!prompt) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing prompt" })
      };
    }

    const apiKey = process.env.GEMINI_API_KEY;

    const geminiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=" +
        apiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `
You are a veterinary clinician writing a formal clinical report.

TASK:
Using established veterinary references (e.g. Merck Veterinary Manual, BSAVA Manuals):

1. Write a concise Case Summary.
2. Provide Differential Diagnoses with justification.
3. Recommend Diagnostic Steps.
4. Identify Red Flags.
5. Suggest Initial Treatment.
6. Cite references clearly.

IMPORTANT:
- Do not repeat the input verbatim.
- Apply clinical reasoning.

CASE DATA:
${prompt}
                  `
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.4,
            maxOutputTokens: 2048
          }
        })
      }
    );

    const data = await geminiResponse.json();

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          text: "No clinical report could be generated."
        })
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    };
  } catch (error) {
    console.error("Function error:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" })
    };
  }
}
