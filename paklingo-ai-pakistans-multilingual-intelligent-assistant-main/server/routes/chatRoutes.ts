import { Router, Request, Response } from 'express';
import { getGemini, callWithCandidateModels } from '../geminiService.js';
import { getGlobalLanguageDirective, getLanguageName } from '../languageDirectives.js';

export const chatRouter = Router();

chatRouter.post('/api/chat', async (req: Request, res: Response) => {
  const { message, language = 'ur', history = [] } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required.' });
  }

  const query = message.trim();
  const ai = getGemini();

  if (!ai) {
    return res.status(503).json({
      error: 'AI_UNAVAILABLE',
      message: 'Gemini API key is not configured.',
    });
  }

  const selectedLangName = getLanguageName(language);

  // Build multi-turn conversational contents array for Gemini
  const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

  if (Array.isArray(history) && history.length > 0) {
    // Keep the most recent 20 turns for optimal context and latency
    const recentHistory = history.slice(-20);
    for (const item of recentHistory) {
      const text = typeof item.text === 'string' ? item.text.trim() : '';
      if (!text) continue;

      const role: 'user' | 'model' = item.role === 'user' ? 'user' : 'model';

      // Avoid starting the conversation contents with 'model'
      if (contents.length === 0 && role === 'model') {
        continue;
      }

      // Merge consecutive turns with the same role
      if (contents.length > 0 && contents[contents.length - 1].role === role) {
        contents[contents.length - 1].parts[0].text += `\n${text}`;
      } else {
        contents.push({ role, parts: [{ text }] });
      }
    }
  }

  // Append current user message
  if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
    contents[contents.length - 1].parts[0].text += `\n${query}`;
  } else {
    contents.push({ role: 'user', parts: [{ text: query }] });
  }

  const systemInstruction = `You are PakLingo AI, an intelligent, helpful, and culturally attuned multilingual conversational AI assistant built for the people of Pakistan.

Your expertise includes:
- Everyday conversation, polite Pakistani greetings, and general questions
- Education and academics (Matric, FSc, O/A Levels, science, mathematics, history, language learning)
- Public services and civic guidance (NADRA CNIC/NICOP, DGIP passports, BISP 8171, driving licenses, FBR tax)
- Health awareness, preventive care, first aid, and wellness education
- Agriculture, crops (wheat, cotton, rice, sugarcane, vegetables), pest management, and farming advice
- Legal awareness, constitutional rights, tenancy agreements, and citizen procedures
- Multilingual translation between English, Urdu, Roman Urdu, and regional languages (Punjabi, Sindhi, Pashto, Balochi, Saraiki, Hindko, Kashmiri, Brahui)

CRITICAL CONVERSATIONAL RULES:
1. NATURAL CONVERSATION & MEMORY:
   - Act as a true conversational companion. Remember and maintain context from earlier turns in the current chat session (e.g. if the user previously stated their name, location, crop, or topic, recall and refer back to it naturally).
2. CASUAL GREETINGS & SIMPLE INQUIRIES:
   - "Hi", "Hello", "Hey", "Salam", "AOA": Reply warmly, concisely, and naturally without unnecessary boilerplate (e.g., "Hello! How can I help you today?" or "وعلیکم السلام! میں آپ کی کیا مدد کر سکتا ہوں؟").
   - "How are you?" or "Kaise ho?": Respond warmly and politely (e.g. "I'm doing well, thank you! How are you, and how can I help you today?").
   - "Assalam o Alaikum" / "السلام علیکم": Reply with the courteous greeting ("Walaikum Assalam! ...") and ask how you can assist.
   - "What can you do?" / "Aap kya kar saktay hain?": Give a clear, helpful breakdown of your capabilities across education, public services, health, farming, legal information, and translation.
3. LANGUAGE & SCRIPT DIRECTIVE:
${getGlobalLanguageDirective(language)}
4. HONEST & GROUNDED INFORMATION:
   - Never invent government facts, fees, or deadlines. For civic procedures, reference official Pakistani portals (nadra.gov.pk, dgip.gov.pk, bisp.gov.pk, fbr.gov.pk).
5. FORMATTING:
   - Use clear markdown formatting (bullet points, bold text, short paragraphs) for readability.`;

  try {
    const response = await callWithCandidateModels(
      'General Chat (/api/chat)',
      (modelName) =>
        ai.models.generateContent({
          model: modelName,
          contents,
          config: {
            systemInstruction,
          },
        }),
      20000
    );

    const reply = response.text || response?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).filter(Boolean).join('\n') || '';

    if (!reply) {
      return res.status(503).json({
        error: 'AI_SERVICE_UNAVAILABLE',
        message: 'The AI model is currently unable to generate a response. Please try again.',
      });
    }

    return res.json({ reply, isGrounded: false, category: 'PakLingo AI' });
  } catch (err: any) {
    console.error('Chat endpoint error:', err?.message || err);
    return res.status(503).json({
      error: 'AI_SERVICE_UNAVAILABLE',
      message: 'The AI model is currently unable to generate a response. Please try again.',
    });
  }
});
