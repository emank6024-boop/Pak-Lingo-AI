import { Router, Request, Response } from 'express';
import { getGemini, callWithCandidateModels, ServerLRUCache } from '../geminiService.js';
import { getLanguageName } from '../languageDirectives.js';

export const translateRouter = Router();

const serverTranslationCache = new ServerLRUCache<any>(300, 24 * 60 * 60 * 1000);

// Live Translator endpoint
translateRouter.post('/api/translate', async (req: Request, res: Response) => {
  const { text, sourceLang = 'en', targetLang = 'ur' } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Text is required.' });
  }

  const cacheKey = `${sourceLang}_${targetLang}_${text.trim().toLowerCase()}`;
  const cached = serverTranslationCache.get(cacheKey);
  if (cached) {
    res.setHeader('X-Cache-Status', 'HIT');
    return res.json(cached);
  }

  const ai = getGemini();
  if (!ai) {
    return res.status(503).json({ error: 'AI_UNAVAILABLE', message: 'Gemini API not configured.' });
  }

  const sLang = getLanguageName(sourceLang);
  const tLang = getLanguageName(targetLang);

  const prompt = `You are the PakLingo Multilingual Translation Engine for Pakistan.
Translate the following text accurately, preserving nuance and natural cultural idiom.
Source Language: ${sLang}
Target Language: ${tLang}
Input text: "${text}"

Respond in valid JSON format only:
{
  "translatedText": "Exact translation in the target script/language",
  "phoneticText": "Romanized pronunciation / phonetic transliteration in Latin letters"
}`;

  try {
    const response = await callWithCandidateModels(
      'Live Translate',
      (modelName) =>
        ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        }),
      20000
    );

    const parsed = JSON.parse(response.text || '{}');
    if (parsed.translatedText) {
      const translationResult = {
        translatedText: parsed.translatedText,
        phoneticText: parsed.phoneticText || parsed.translatedText,
      };
      serverTranslationCache.set(cacheKey, translationResult);
      return res.json(translationResult);
    }
    return res.status(503).json({ error: 'Translation could not be completed.' });
  } catch (err: any) {
    return res.status(503).json({ error: 'Translation could not be completed.' });
  }
});
