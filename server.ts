import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const MODEL_ID = 'gemini-4-hydrogen';

function createGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, hasKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY') });
  });

  app.post('/api/gemini/cravings', async (req, res) => {
    const ai = createGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: 'GEMINI_API_KEY is not configured in Settings > Secrets.',
      });
      return;
    }

    const seedNote = typeof req.body?.morningMood === 'string' ? req.body.morningMood.slice(0, 120) : 'Sunday morning in Androon Lahore';

    try {
      const response = await ai.models.generateContent({
        model: MODEL_ID,
        contents: `Generate a warm, fun, kid-friendly Androon Lahore morning family craving for breakfast.
Context: ${seedNote}.
Pick one preferred Nashta dish ID from: ["anda-half-fry", "anda-full-fry", "masala-omelette", "lahori-channay", "halwa-poori", "bong-paye"].
Pick one preferred Chai ID from: ["doodh-patti", "karak-chai", "ilaichi-chai", "kashmiri-chai"].
Pick who is craving it from: ["Dadi", "Abbu", "Ammi", "Chotu"].
Write a lively 1-2 sentence morning note mixing friendly Roman Urdu + English (e.g., kites on the rooftop, morning breeze near Bhati Gate, Sunday dastarkhwan excitement) and a short 1-sentence cooking tip for kids aged 9-16.`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              requester: { type: Type.STRING },
              dishId: { type: Type.STRING },
              chaiId: { type: Type.STRING },
              headline: { type: Type.STRING },
              romanUrduNote: { type: Type.STRING },
              englishMeaning: { type: Type.STRING },
              cookingTip: { type: Type.STRING },
            },
            required: ['requester', 'dishId', 'chaiId', 'headline', 'romanUrduNote', 'englishMeaning', 'cookingTip'],
          },
        },
      });

      const raw = (response.text ?? '{}').trim();
      const parsed = JSON.parse(raw);
      res.json(parsed);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate morning craving';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/gemini/verdict', async (req, res) => {
    const ai = createGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: 'GEMINI_API_KEY is not configured in Settings > Secrets.',
      });
      return;
    }

    const payload = req.body ?? {};
    const dishName = String(payload.dishName ?? 'Lahori Nashta').slice(0, 80);
    const dishState = String(payload.dishState ?? 'golden').slice(0, 40);
    const garnishAdded = Boolean(payload.garnishAdded);
    const chaiName = String(payload.chaiName ?? 'Doodh Patti').slice(0, 60);
    const chaiAccuracy = String(payload.chaiAccuracy ?? 'balanced').slice(0, 40);
    const boilSaved = Boolean(payload.boilSaved);
    const phaintiCount = Number(payload.phaintiCount ?? 0);
    const extrasServed = Array.isArray(payload.extrasServed)
      ? payload.extrasServed.slice(0, 4).map((x: unknown) => String(x)).join(', ')
      : 'none';
    const cravingMatched = Boolean(payload.cravingMatched);

    try {
      const response = await ai.models.generateContent({
        model: MODEL_ID,
        contents: `You are writing warm, expressive comic-book speech bubbles for a Pakistani family in Androon Lahore tasting morning breakfast at their dastarkhwan!
Player's cooked breakfast details:
- Dish: ${dishName} (doneness: ${dishState}, Nani Ka Secret Garnish added: ${garnishAdded})
- Chai: ${chaiName} (sugar/patti balance: ${chaiAccuracy}, boil-over saved: ${boilSaved}, phainti ladle aerations: ${phaintiCount})
- Extra hospitality items served at table: ${extrasServed || 'none'}
- Matched family's morning craving: ${cravingMatched}

Write a short, punchy comic-book reaction for EACH of the 4 family members:
1. Dadi (gentle, traditional, loves good aroma, Nani's garnish, and proper phainti)
2. Abbu (enthusiastic Lahori foodie, comments on crispy/fluffy texture, channay/paye richness, or strong karak chai)
3. Ammi (warm, encouraging, notices careful heat control and clean cooking)
4. Chotu (playful 9-year-old brother, excited about runny yolk / puffy poori / rosy pink Kashmiri chai / achar!)

Keep each Roman Urdu line under 16 words, authentic and kid-friendly, plus a concise natural English translation.`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reactions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    speaker: { type: Type.STRING },
                    mood: { type: Type.STRING },
                    romanUrdu: { type: Type.STRING },
                    english: { type: Type.STRING },
                  },
                  required: ['speaker', 'mood', 'romanUrdu', 'english'],
                },
              },
              chefTitle: { type: Type.STRING },
              summaryNote: { type: Type.STRING },
            },
            required: ['reactions', 'chefTitle', 'summaryNote'],
          },
        },
      });

      const raw = (response.text ?? '{}').trim();
      const parsed = JSON.parse(raw);
      res.json(parsed);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate family verdict';
      res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Lahori Nashta server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server failed to start:', err);
  process.exit(1);
});
