export async function handler(event) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST' && event.httpMethod !== 'OPTIONS') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: '',
    };
  }

  // CORS headers (same as before)
  const corsHeaders = {
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const body = JSON.parse(event.body || '{}');
    const { prompt } = body;

    if (!prompt) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Prompt is required' }),
      };
    }

    // Get API key from environment variable
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'API key not configured' }),
      };
    }

    // Call Google Gemini API (UNCHANGED)
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('Gemini API Error:', error);

      return {
        statusCode: response.status,
        headers: corsHeaders,
        body: JSON.stringify({
          error: error.error?.message || 'API error',
        }),
      };
    }

    const data = await response.json();

    // Extract text (UNCHANGED)
    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      'No response generated';

    // SAME response structure as before
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        content: [
          {
            type: 'text',
            text: text,
          },
        ],
      }),
    };
  } catch (error) {
    console.error('Error:', error);

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
}
