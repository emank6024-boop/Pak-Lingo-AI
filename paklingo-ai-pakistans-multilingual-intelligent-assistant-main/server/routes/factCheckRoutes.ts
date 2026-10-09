import { Router, Request, Response } from 'express';
import { getGemini, callWithCandidateModels } from '../geminiService.js';
import { getGlobalLanguageDirective } from '../languageDirectives.js';

export const factCheckRouter = Router();

// Fact Checking & Hoax Verification
factCheckRouter.post('/api/fact-check', async (req: Request, res: Response) => {
  const { text, claim, url, imageBase64, mimeType, language = 'en' } = req.body;
  const inputClaim = (claim || text || '').trim();
  if (!inputClaim && !url && !imageBase64) {
    return res.status(400).json({ error: 'Please provide a claim, message text, link, or image to verify.' });
  }
  const ai = getGemini();
  if (!ai) {
    return res.status(503).json({ error: 'AI_UNAVAILABLE', message: 'Gemini API not configured.' });
  }

  const systemInstruction = `You are the PakLingo AI Senior Fact-Checking & Misinformation Analyst for Pakistan.
Your role is to rigorously evaluate viral messages, claims, WhatsApp forwards, political declarations, public holiday rumours, banking notices, and civic scheme circulars.
Apply OSINT methodology, forensic linguistic analysis, and authoritative Pakistani sources (Federal & Provincial official gazettes, State Bank of Pakistan, PTA, PEMRA, BISP, NADRA, Supreme Court, FBISE/BISE boards).

OUTPUT FORMAT:
Respond with valid JSON only:
{
  "verdict": "VERIFIED_TRUE" | "MISLEADING_MANIPULATED" | "FALSE_HOAX" | "UNSUBSTANTIATED_RUMOR" | "MALICIOUS_PHISHING",
  "verdictTitle": "Short punchy badge (e.g. '🚨 Confirmed Hoax / Scam' or '✅ Verified Authentic')",
  "confidence": 88,
  "summary": "Clear, direct 2-3 sentence verdict explaining whether this claim is true, false, or misleading.",
  "evidence": [
    "Key factual point 1 with authoritative reference",
    "Key factual point 2 explaining discrepancies or verification check",
    "Key factual point 3 on actual status"
  ],
  "redFlags": [
    "Specific signs of manipulation, urgent unverified claims, or spoofing"
  ],
  "verificationAdvice": "Actionable instructions for citizens (e.g. check official website, don't click shortlink, do not share OTP).",
  "officialSource": "Relevant official authority name and portal (e.g. State Bank of Pakistan at www.sbp.org.pk)"
}

Language Requirement:
${getGlobalLanguageDirective(language)}
Ensure all JSON string values (verdictTitle, summary, evidence, redFlags, verificationAdvice) are written in the requested language.`;

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
          text: `Inspect this circular/screenshot for authenticity. Claim / Context: "${inputClaim}". URL: "${url || 'None'}"`,
        },
      ];
    } else {
      contents = `Evaluate this viral message/claim:\nClaim/Text: "${inputClaim}"\nAssociated URL: "${url || 'None'}"`;
    }

    const response = await callWithCandidateModels(
      'Fact Check',
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
    const rawConf = typeof parsed.confidence === 'number' ? parsed.confidence : 80;
    const isTrue = parsed.verdict === 'VERIFIED_TRUE';
    const credibilityScore = typeof parsed.credibilityScore === 'number'
      ? parsed.credibilityScore
      : (isTrue ? rawConf : Math.max(10, 100 - rawConf));

    return res.json({
      ...parsed,
      credibilityScore,
      confidence: rawConf,
      recommendedAction: parsed.recommendedAction || parsed.verificationAdvice || 'Cross-check with verified official gazettes before sharing.',
      verificationAdvice: parsed.verificationAdvice || parsed.recommendedAction || 'Cross-check with verified official gazettes before sharing.',
    });
  } catch (err: any) {
    console.error('Fact Check Error:', err);
    return res.status(500).json({
      error: 'Unable to complete fact check right now.',
      verdict: 'UNSUBSTANTIATED_RUMOR',
      verdictTitle: '⚠️ Verification Notice',
      confidence: 75,
      summary: 'Analysis could not be verified automatically. Treat unverified viral claims and shortlinks with extreme caution.',
      evidence: ['Official notification could not be confirmed via public gazettes.'],
      redFlags: ['Unverified digital transmission lacking official press release.'],
      verificationAdvice: 'Do not forward unverified messages or enter credentials on third-party links.',
      officialSource: 'Check official departmental web portals directly.'
    });
  }
});
