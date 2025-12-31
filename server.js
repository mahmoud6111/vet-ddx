// Local development server for API routes
// This mimics Vercel's serverless functions locally

import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const app = express();

app.use(cors());
app.use(express.json());

// API Route: Generate Differentials
app.post('/api/generate-differentials', async (req, res) => {
    const { prompt, model = 'gemini' } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
    }

    try {
        let responseText;

        if (model === 'mimo') {
            responseText = await callMiMoAPI(prompt);
        } else if (model === 'gemini') {
            responseText = await callGeminiAPI(prompt);
        } else if (model === 'both') {
            const [geminiResult, mimoResult] = await Promise.allSettled([
                callGeminiAPI(prompt),
                callMiMoAPI(prompt)
            ]);

            return res.json({
                content: [
                    {
                        type: 'text',
                        text: geminiResult.status === 'fulfilled' ? geminiResult.value : 'Error fetching Gemini response: ' + geminiResult.reason?.message,
                        model: 'gemini',
                        modelName: 'Google Gemini 2.5 Flash'
                    },
                    {
                        type: 'text',
                        text: mimoResult.status === 'fulfilled' ? mimoResult.value : 'Error fetching MiMo response: ' + mimoResult.reason?.message,
                        model: 'mimo',
                        modelName: 'Xiaomi MiMo-V2-Flash'
                    }
                ],
                multiModel: true
            });
        } else {
            return res.status(400).json({ error: 'Invalid model specified' });
        }

        return res.json({
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
});

// Google Gemini API call
async function callGeminiAPI(prompt) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error('Gemini API key not configured. Add GEMINI_API_KEY to your .env.local file');
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
        throw new Error('OpenRouter API key not configured. Add OPENROUTER_API_KEY to your .env.local file');
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'VetDDx - Veterinary Differential Diagnosis (Dev)',
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

// Create Vite server in middleware mode
async function startServer() {
    const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa'
    });

    // Use Vite's connect instance as middleware
    app.use(vite.middlewares);

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`\n🩺 VetDDx Development Server`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`➜  Local:   http://localhost:${PORT}/`);
        console.log(`➜  API:     http://localhost:${PORT}/api/generate-differentials`);
        console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`\n📋 Environment Check:`);
        console.log(`   GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? '✅ Configured' : '❌ Missing'}`);
        console.log(`   OPENROUTER_API_KEY: ${process.env.OPENROUTER_API_KEY ? '✅ Configured' : '❌ Missing'}`);
        console.log(`\n💡 Tip: Create .env.local file with your API keys\n`);
    });
}

startServer();
