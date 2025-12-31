// Vercel Serverless Function for AI Differential Diagnosis
// Supports multiple models: Gemini and MiMo-V2-Flash (via OpenRouter)

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, model = 'gemini' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    let responseText;

    if (model === 'mimo') {
      // Use OpenRouter API for MiMo-V2-Flash
      responseText = await callMiMoAPI(prompt);
    } else if (model === 'gemini') {
      // Use Google Gemini API
      responseText = await callGeminiAPI(prompt);
    } else if (model === 'both') {
      // Call both models for comparison
      const [geminiResult, mimoResult] = await Promise.allSettled([
        callGeminiAPI(prompt),
        callMiMoAPI(prompt)
      ]);

      return res.status(200).json({
        content: [
          {
            type: 'text',
            text: geminiResult.status === 'fulfilled' ? geminiResult.value : 'Error fetching Gemini response',
            model: 'gemini',
            modelName: 'Google Gemini 2.5 Flash'
          },
          {
            type: 'text',
            text: mimoResult.status === 'fulfilled' ? mimoResult.value : 'Error fetching MiMo response',
            model: 'mimo',
            modelName: 'Xiaomi MiMo-V2-Flash'
          }
        ],
        multiModel: true
      });
    } else {
      return res.status(400).json({ error: 'Invalid model specified' });
    }

    return res.status(200).json({
      content: [
        {
          type: 'text',
          text: responseText,
          model: model,
          modelName: model === 'gemini' ? 'Google Gemini 2.5 Flash' : 'Xiaomi MiMo-V2-Flash'
        }
      ],
      multiModel: false
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

// Google Gemini API call
async function callGeminiAPI(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }

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
    throw new Error(error.error?.message || 'Gemini API error');
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';
}

// OpenRouter API call for MiMo-V2-Flash
async function callMiMoAPI(prompt) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error('OpenRouter API key not configured');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://vetddx.vercel.app',
      'X-Title': 'VetDDx - Veterinary Differential Diagnosis',
    },
    body: JSON.stringify({
      model: 'xiaomi/mimo-v2-flash:free',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 8192,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('OpenRouter API Error:', error);
    throw new Error(error.error?.message || 'OpenRouter API error');
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'No response generated';
}