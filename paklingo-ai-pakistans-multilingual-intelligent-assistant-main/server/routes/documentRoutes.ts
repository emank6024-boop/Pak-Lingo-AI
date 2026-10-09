import { Router, Request, Response } from 'express';
import { getGemini, callWithCandidateModels } from '../geminiService.js';

export const documentRouter = Router();

// Document Intelligence & Bilingual OCR
documentRouter.post('/api/documents/process', async (req: Request, res: Response) => {
  const { imageBase64, documentText, mimeType, task = 'all' } = req.body;
  const targetLang = req.body.targetLanguage || req.body.targetLang || 'ur';
  if (!imageBase64 && !documentText) {
    return res.status(400).json({ error: 'Please upload a document image or provide document text.' });
  }

  const ai = getGemini();
  if (!ai) {
    return res.status(503).json({ error: 'AI_UNAVAILABLE', message: 'Gemini API not configured.' });
  }

  const systemInstruction = `You are the PakLingo Bilingual Document Intelligence & Civic OCR Engine for Pakistan.
Your mission is to read, transcribe, analyze, and interpret Pakistani institutional documents (NADRA CNIC/NICOP, BISP cards, WAPDA/LESCO/K-Electric utility bills, SNGPL gas bills, land revenue Fard-e-Malkiyat, domicile certificates, court affidavits, stamped stamp papers, university degrees, and hospital slips).

CRITICAL ACCURACY RULES:
1. Extract text with high optical fidelity in both English and Urdu/Nastaliq script.
2. Structure the document type, reference numbers, parties involved, dates, and amounts clearly.
3. Provide an executive summary of rights, deadlines, due amounts, and civic obligations.
4. Translate summary and key points to ${targetLang === 'ur' ? 'Urdu' : targetLang === 'en' ? 'English' : targetLang}.

OUTPUT FORMAT:
Respond with valid JSON only:
{
  "documentType": "Identified official document category (e.g. 'Electricity Consumer Bill' or 'Land Ownership Record')",
  "extractedText": "Complete, faithfully extracted text of the document preserving line breaks and original terms.",
  "summary": "Structured markdown summary with bullet points: Document Type, Issuer, Key Reference/ID, Financial or Legal Implications, Deadlines/Due Dates.",
  "keyFields": [
    { "label": "Document Type", "value": "..." },
    { "label": "Reference / Registration No", "value": "..." },
    { "label": "Issued To / Consumer", "value": "..." },
    { "label": "Issuing Authority", "value": "..." },
    { "label": "Amount / Legal Status", "value": "..." },
    { "label": "Due Date / Validity", "value": "..." }
  ],
  "translatedSummary": "Full translation of the executive summary into the requested target language.",
  "translatedText": "Full translation of the document text into the requested target language."
}`;

  try {
    let contents: any;
    if (imageBase64 && typeof imageBase64 === 'string') {
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-z0-9+.-]+;base64,/, '');
      contents = [
        {
          inlineData: {
            mimeType: mimeType || 'image/jpeg',
            data: cleanBase64,
          },
        },
        {
          text: `Perform full OCR transcription, structural analysis, and civic summary for this Pakistani document. Target language for summary: ${targetLang}.`,
        },
      ];
    } else {
      contents = `Analyze and extract key information from this document text:\n"""\n${documentText}\n"""\nTask requested: ${task}. Target language: ${targetLang}.`;
    }

    const response = await callWithCandidateModels(
      'Document Intelligence',
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
    const extractedText = parsed.extractedText || documentText || '';
    const summary = parsed.summary || '';
    const translatedText = parsed.translatedText || parsed.translatedSummary || parsed.summary || '';

    return res.json({
      ...parsed,
      extractedText,
      summary,
      translatedText,
      result: task === 'translate' ? translatedText : (task === 'summarize' ? summary : extractedText),
    });
  } catch (err: any) {
    console.error('Document Process Error:', err);
    return res.status(500).json({
      error: 'Document analysis could not be completed.',
      documentType: 'Institutional Document',
      extractedText: documentText || 'Text extraction could not be parsed from image.',
      summary: '• **Status:** Manual review required.\n• **Note:** Ensure document image is well-lit and unobstructed.',
      keyFields: [{ label: 'Status', value: 'Pending verification' }],
      translatedSummary: 'دستاویز کی مکمل تفہیم کے لیے واضح تصویر درکار ہے۔'
    });
  }
});
