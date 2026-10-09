import { Router, Request, Response } from 'express';
import { getGemini, callWithCandidateModels } from '../geminiService.js';
import { getGlobalLanguageDirective } from '../languageDirectives.js';

export const pslRouter = Router();

// Pakistan Sign Language (PSL) Sentence & Concept Breakdown
pslRouter.post('/api/psl/breakdown', async (req: Request, res: Response) => {
  const rawText = req.body.text || req.body.sentence || req.body.input || '';
  const text = typeof rawText === 'string' ? rawText.trim() : '';
  const { language = 'ur' } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text or sentence is required for Pakistan Sign Language breakdown.' });
  }
  const ai = getGemini();
  if (!ai) {
    return res.status(503).json({ error: 'AI_UNAVAILABLE', message: 'Gemini API not configured.' });
  }

  const meaningHeader = language === 'ur'
    ? 'اس سائن کا مطلب:'
    : (language === 'roman_ur' || language === 'roman')
      ? 'Is sign ka matlab:'
      : 'Meaning of this sign / phrase:';

  const systemInstruction = `You are the PakLingo Pakistan Sign Language (PSL / پاکستانی اشاروں کی زبان) Accessibility Master and Deaf Reach Educator.
Given an English, Urdu, or Roman Urdu word or sentence (e.g. "Assalam o Alaikum", "How are you?", "My name is Ali", "Shukriya", "Water", "Hospital"), break it down accurately into standardized Pakistani Sign Language (PSL) conventions (as documented by FESF / Deaf Reach Pakistan and Pakistan Association of the Deaf - PAD).

LANGUAGE INSTRUCTION:
${getGlobalLanguageDirective(language)}

CRITICAL RESPONSE RULES:
1. Provide the exact PSL grammatical gloss sequence.
2. In "meaning", clearly explain what this word or sentence signifies in daily communication.
3. For each constituent sign or concept in the phrase, provide precise physical execution details:
   - "word": English name of concept
   - "urdu": Urdu script equivalent
   - "handShape": Clear physical hand shape description (e.g. "Flat open hand", "Index finger pointing", "Fist with thumb up")
   - "location": Placement relative to body (e.g. "Chest level / Heart", "Near chin", "Forehead")
   - "movement": Motion path and dynamics (e.g. "Arc smoothly outward toward listener", "Double tap chin")
   - "facialExpression": Non-manual markers (e.g. "Warm smile with respectful eye contact", "Eyebrows raised for question")
   - "instruction": Clear, step-by-step guidance on how to perform this sign accurately.
4. Set "meaningHeader" to "${meaningHeader}".

OUTPUT FORMAT (Respond with valid JSON only):
{
  "originalText": "${text.replace(/"/g, '')}",
  "meaningHeader": "${meaningHeader}",
  "meaning": "Clear, direct meaning and contextual explanation in the requested language.",
  "pslGloss": "Capitalized PSL Gloss Order (e.g. [ASSALAM-O-ALAIKUM] or [NAME] [ME] [ALI])",
  "urduGloss": "اردو اشاروں کی ترتیب",
  "explanation": "Linguistic and visual explanation of this sign or phrase in PSL.",
  "signs": [
    {
      "word": "Concept word",
      "urdu": "اردو لفظ",
      "handShape": "Hand shape description",
      "location": "Body location",
      "movement": "Specific dynamic motion",
      "facialExpression": "Facial cue",
      "instruction": "Step-by-step physical instruction.",
      "culturalNote": "PSL cultural or regional note."
    }
  ],
  "practiceTip": "Helpful tip for signing smoothly and naturally."
}`;

  try {
    const response = await callWithCandidateModels(
      'PSL Breakdown',
      (modelName) =>
        ai.models.generateContent({
          model: modelName,
          contents: `Translate and break down into Pakistan Sign Language (PSL):\n"${text}"`,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
          },
        }),
      22000
    );

    const parsed = JSON.parse(response.text || '{}');
    const normalizedSigns = (parsed.signs || parsed.tokens || []).map((s: any) => ({
      word: s.word || s.token || text,
      token: s.word || s.token || text,
      urdu: s.urdu || text,
      handShape: s.handShape || s.handMovement || 'Comfortable signing hand position',
      handMovement: s.handMovement || s.movement || 'Gentle forward movement',
      movement: s.movement || s.handMovement || 'Gentle forward movement',
      location: s.location || 'Chest level in signing space',
      facialExpression: s.facialExpression || 'Natural engaged expression',
      instruction: s.instruction || s.description || 'Position hand comfortably and perform the sign facing your conversational partner.',
      description: s.instruction || s.description || 'Position hand comfortably and perform the sign facing your conversational partner.',
      culturalNote: s.culturalNote || 'PSL standard sign according to Deaf Reach Pakistan.',
    }));

    return res.json({
      originalText: parsed.originalText || text,
      sentence: parsed.originalText || text,
      meaningHeader: parsed.meaningHeader || meaningHeader,
      meaning: parsed.meaning || parsed.explanation || `Pakistan Sign Language guide for "${text}".`,
      pslGloss: parsed.pslGloss || `[${text.toUpperCase()}]`,
      urduGloss: parsed.urduGloss || text,
      explanation: parsed.explanation || parsed.meaning || 'PSL utilizes spatial grammar and visual handshape positioning.',
      grammaticalNotes: parsed.explanation || 'PSL visual grammar',
      signs: normalizedSigns,
      tokens: normalizedSigns,
      practiceTip: parsed.practiceTip || 'Keep your shoulders relaxed and maintain expressive eye contact while signing.',
      success: true,
    });
  } catch (err: any) {
    console.error('PSL Breakdown Error:', err);
    return res.status(500).json({
      error: 'Unable to generate PSL breakdown.',
      originalText: text,
      sentence: text,
      meaningHeader,
      meaning: `Pakistan Sign Language expression for "${text}".`,
      pslGloss: `[${text.toUpperCase()}]`,
      urduGloss: text,
      explanation: 'PSL utilizes visual spatial grammar with expressive facial markers.',
      grammaticalNotes: 'PSL visual grammar',
      signs: [
        {
          word: text,
          token: text,
          urdu: text,
          handShape: 'Open dominant hand with palm facing comfortably forward',
          handMovement: 'Smooth outward movement toward conversation partner',
          movement: 'Smooth outward movement toward conversation partner',
          location: 'Chest level in comfortable signing space',
          facialExpression: 'Engaged, supportive eye contact',
          instruction: 'Position your hand at chest level and form the gesture smoothly facing your conversation partner.',
          description: 'Position your hand at chest level and form the gesture smoothly facing your conversation partner.',
          culturalNote: 'PSL signs emphasize clear two-handed symmetry and distinct facial cues.'
        }
      ],
      tokens: [
        {
          token: text,
          urdu: text,
          handMovement: 'Smooth outward movement toward conversation partner',
          facialExpression: 'Engaged, supportive eye contact',
          description: 'Position your hand at chest level and form the gesture smoothly facing your conversation partner.'
        }
      ],
      practiceTip: 'Keep your shoulders relaxed and maintain expressive eye contact while signing.'
    });
  }
});

// Pakistan Sign Language (PSL) Real Vision & Image Gesture Recognition
pslRouter.post('/api/psl/analyze-sign', async (req: Request, res: Response) => {
  const { imageBase64, mimeType = 'image/jpeg', language = 'ur', notes } = req.body;

  if (!imageBase64 || typeof imageBase64 !== 'string') {
    return res.status(400).json({ error: 'Image is required for sign recognition.' });
  }

  const ai = getGemini();
  if (!ai) {
    return res.status(503).json({ error: 'AI_UNAVAILABLE', message: 'Gemini API not configured.' });
  }

  const cleanBase64 = imageBase64.replace(/^data:image\/[a-z0-9+.-]+;base64,/, '');
  const meaningHeader = language === 'ur'
    ? 'اس سائن کا مطلب:'
    : (language === 'roman_ur' || language === 'roman')
      ? 'Is sign ka matlab:'
      : 'Meaning of this sign:';

  const systemInstruction = `You are the PakLingo Pakistan Sign Language (PSL / پاکستانی اشاروں کی زبان) Vision & Gesture Interpreter.
You analyze photographs and webcam snapshots containing hand gestures, signs, or fingerspelling used in Pakistan Sign Language (PSL conventions by Deaf Reach / FESF, Pakistan Association of the Deaf - PAD, and National Institute of Special Education - NISE).

CRITICAL HONESTY & ACCURACY MANDATES:
1. CAREFUL VISUAL INSPECTION:
   - Carefully inspect the hand shape, finger configurations, thumb position, palm orientation, and location relative to the body/face/chest.
2. CONFIDENT IDENTIFICATION:
   - If the hand gesture matches a recognized PSL sign (e.g. Salam/Hello, Thank You, Water, Food, Help, Yes, No, Family, Doctor, Numbers, or Urdu/English fingerspelling letters):
     - Set "identified": true
     - "signName": Name of the sign in English and Urdu (e.g. "Assalam o Alaikum (السلام علیکم)")
     - "meaningHeader": "${meaningHeader}"
     - "meaning": Direct, clear explanation of the sign's meaning and when it is used.
     - "gestureDescription": Physical details of how the hand is shaped and oriented in the image.
     - "usageContext": Cultural and everyday communication context in Pakistan.
     - "confidence": "High" or "Medium"
3. UNIDENTIFIABLE OR UNCLEAR GESTURES:
   - If the image is blurry, poorly lit, fingers are cut off, ambiguous, or NOT a recognizable PSL sign:
     - DO NOT INVENT A FAKE MEANING.
     - Set "identified": false
     - "signName": "Unidentified / غیر واضح اشارہ"
     - "meaningHeader": "${meaningHeader}"
     - "meaning": Honestly state that the sign could not be identified with confidence.
       * If Urdu: "یہ اشارہ واضح طور پر شناخت نہیں ہو سکا۔ تصویر میں انگلیاں یا زاویہ پوری طرح واضح نہیں ہیں یا یہ معیاری پی ایس ایل اشارہ نہیں۔"
       * If English: "This sign could not be confidently identified. The hand gesture or finger positions are unclear in the image."
       * If Roman Urdu: "Yeh sign wazeh tor par identify nahi ho saka. Haath ki ungliyan ya angle saaf nahi hain."
     - "tips": Give practical guidance to the user (e.g. hold hand steady at chest level, ensure good lighting, show all active fingers).
     - "confidence": "Uncertain"
4. LANGUAGE REQUIREMENT:
${getGlobalLanguageDirective(language)}
Ensure all explanations and guidance are delivered in the requested language.

OUTPUT FORMAT (JSON only):
{
  "identified": true,
  "signName": "Concept name in Urdu & English",
  "meaningHeader": "${meaningHeader}",
  "meaning": "Concise statement of what this gesture means",
  "gestureDescription": "Physical analysis of observed handshape, fingers, and orientation",
  "usageContext": "How this sign is used in Pakistani Deaf community",
  "confidence": "High" | "Medium" | "Uncertain",
  "tips": "Tips for clearer signing or retaking photo",
  "fullExplanation": "Comprehensive markdown explanation starting with header"
}`;

  try {
    const contents = [
      {
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: cleanBase64,
        },
      },
      {
        text: `Analyze this image containing a Pakistan Sign Language (PSL) gesture. Identify what sign is shown and explain its meaning.\nUser notes/context: "${notes || 'Identify this sign'}"`,
      },
    ];

    const response = await callWithCandidateModels(
      'PSL Vision Gesture Analysis',
      (modelName) =>
        ai.models.generateContent({
          model: modelName,
          contents,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
          },
        }),
      25000
    );

    const parsed = JSON.parse(response.text || '{}');
    const resultMeaning = parsed.meaning || (parsed.identified ? `Pakistan Sign Language gesture for ${parsed.signName}.` : 'This sign could not be confidently identified.');

    return res.json({
      identified: parsed.identified ?? true,
      signName: parsed.signName || 'Observed Gesture',
      meaningHeader: parsed.meaningHeader || meaningHeader,
      meaning: resultMeaning,
      gestureDescription: parsed.gestureDescription || 'Hand gesture captured and analyzed with computer vision.',
      usageContext: parsed.usageContext || 'Standard Pakistan Sign Language (PSL) communication.',
      confidence: parsed.confidence || 'Medium',
      tips: parsed.tips || 'Hold hand at chest or facial level with clear finger separation for optimal recognition.',
      fullExplanation: parsed.fullExplanation || `### ${meaningHeader}\n\n**${parsed.signName || 'Sign'}**\n\n${resultMeaning}`,
      success: true,
    });
  } catch (err: any) {
    console.error('PSL Vision Analysis Error:', err?.message || err);
    return res.status(503).json({
      error: 'Unable to analyze sign image right now. Please ensure your image is clear and retry.',
    });
  }
});
