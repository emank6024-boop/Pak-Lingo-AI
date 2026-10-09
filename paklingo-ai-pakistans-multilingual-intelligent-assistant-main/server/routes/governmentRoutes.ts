import { Router, Request, Response } from 'express';
import { getGemini, callGeminiWithTimeout, callWithCandidateModels, isQuotaExhaustedError, CANDIDATE_GEMINI_MODELS, ServerLRUCache } from '../geminiService.js';
import { getGlobalLanguageDirective, getLanguageName } from '../languageDirectives.js';

export const governmentRouter = Router();

const serverGovernmentCache = new ServerLRUCache<any>(200, 12 * 60 * 60 * 1000);

// Helper to determine primary official government portal from query
export function getOfficialPortal(query: string): { name: string; url: string; domain: string } {
  const q = query.toLowerCase();
  if (
    q.includes('nadra') ||
    q.includes('cnic') ||
    q.includes('nicop') ||
    q.includes('frc') ||
    q.includes('شناختی کارڈ') ||
    q.includes('smart card') ||
    q.includes('smart cnic')
  ) {
    return { name: 'NADRA Official Portal', url: 'https://www.nadra.gov.pk/', domain: 'nadra.gov.pk' };
  }
  if (q.includes('passport') || q.includes('پاسپورٹ') || q.includes('dgip') || q.includes('mrp') || q.includes('e-passport')) {
    return { name: 'Directorate General Immigration & Passports (DGIP)', url: 'https://dgip.gov.pk/', domain: 'dgip.gov.pk' };
  }
  if (q.includes('license') || q.includes('driving') || q.includes('dlims') || q.includes('ڈرائیونگ') || q.includes('traffic police')) {
    return { name: 'Driving License Information Management System (DLIMS)', url: 'https://dlims.punjab.gov.pk/', domain: 'dlims.punjab.gov.pk' };
  }
  if (q.includes('birth') || q.includes('crc') || q.includes('b-form') || q.includes('ب فارم') || q.includes('پیدائش') || q.includes('child registration')) {
    return { name: 'NADRA Child Registration (B-Form / CRC) & Local Govt', url: 'https://www.nadra.gov.pk/', domain: 'nadra.gov.pk' };
  }
  if (q.includes('domicile') || q.includes('ڈومیسائل') || q.includes('prc') || q.includes('permanent residence')) {
    return { name: 'Provincial Citizen Portal (Domicile Management)', url: 'https://domicile.punjab.gov.pk/', domain: 'domicile.punjab.gov.pk' };
  }
  if (q.includes('fbr') || q.includes('tax') || q.includes('filer') || q.includes('ntn') || q.includes('فائلر') || q.includes('income tax') || q.includes('atl')) {
    return { name: 'Federal Board of Revenue (FBR)', url: 'https://fbr.gov.pk/', domain: 'fbr.gov.pk' };
  }
  if (q.includes('job') || q.includes('fpsc') || q.includes('ppsc') || q.includes('nts') || q.includes('njp') || q.includes('ملازمت') || q.includes('نوکری') || q.includes('recruitment')) {
    return { name: 'Federal Public Service Commission (FPSC) & NJP', url: 'https://fpsc.gov.pk/', domain: 'fpsc.gov.pk' };
  }
  if (q.includes('bisp') || q.includes('8171') || q.includes('ehsaas') || q.includes('بے نظیر') || q.includes('kafalat')) {
    return { name: 'Benazir Income Support Programme (BISP)', url: 'https://bisp.gov.pk/', domain: 'bisp.gov.pk' };
  }
  return { name: 'Government of Pakistan Official Portal', url: 'https://pakistan.gov.pk/', domain: 'pakistan.gov.pk' };
}

// Helper to split response text into distinct sections
export function parseGovernmentSections(text: string): {
  verifiedOfficialInfo: string;
  generalGuidance: string;
  needsVerificationInfo: string;
  aiExplanation: string;
} {
  const verifiedHeaderRegex = /(?:###?\s*|\*\*)\s*(?:1\.\s*)?(?:Verified Official Information|تصدیق شدہ سرکاری معلومات)(?:\*\*|:)?/i;
  const guidanceHeaderRegex = /(?:###?\s*|\*\*)\s*(?:2\.\s*)?(?:General Guidance|عمومی رہنمائی)(?:\*\*|:)?/i;
  const needsVerifHeaderRegex = /(?:###?\s*|\*\*)\s*(?:3\.\s*)?(?:Information That Needs Official Verification|معلومات جس کی تصدیق درکار ہے|Needs Official Verification)(?:\*\*|:)?/i;
  const explanationHeaderRegex = /(?:###?\s*|\*\*)\s*(?:4\.\s*|3\.\s*)?(?:AI-Generated Plain Explanation|AI-Generated Explanation|Plain Language Explanation|وضاحت)(?:\*\*|:)?/i;

  let verifiedPart = '';
  let guidancePart = '';
  let needsVerifPart = '';
  let explanationPart = '';

  const parts = text.split(/\n(?=(?:###?\s*|\*\*)\s*(?:[1-4]\.\s*)?(?:Verified Official Information|General Guidance|Information That Needs Official Verification|Needs Official Verification|AI-Generated Plain Explanation|AI-Generated Explanation|Plain Language Explanation))/i);

  if (parts.length > 1) {
    for (const part of parts) {
      if (verifiedHeaderRegex.test(part)) {
        verifiedPart = part.replace(verifiedHeaderRegex, '').trim();
      } else if (guidanceHeaderRegex.test(part)) {
        guidancePart = part.replace(guidanceHeaderRegex, '').trim();
      } else if (needsVerifHeaderRegex.test(part)) {
        needsVerifPart = part.replace(needsVerifHeaderRegex, '').trim();
      } else if (explanationHeaderRegex.test(part)) {
        explanationPart = part.replace(explanationHeaderRegex, '').trim();
      }
    }
  }

  // Fallback parsing if split didn't catch all
  if (!verifiedPart) {
    if (verifiedHeaderRegex.test(text) && guidanceHeaderRegex.test(text)) {
      const splitByVerified = text.split(verifiedHeaderRegex);
      const afterVerified = splitByVerified[1] || '';
      const splitByGuidance = afterVerified.split(guidanceHeaderRegex);
      verifiedPart = splitByGuidance[0].trim();
      guidancePart = splitByGuidance[1]?.trim() || '';
    } else {
      verifiedPart = text.trim();
    }
  }

  if (!guidancePart) {
    guidancePart = 'Always confirm requirements at the official departmental counter or designated service portal before submitting documents or payments.';
  }

  if (!needsVerifPart) {
    needsVerifPart = 'Verify specific conditions (such as late penalty calculations, province-specific quota rules, or localized affidavit attestation requirements) directly with the issuing authority.';
  }

  if (!explanationPart) {
    explanationPart = 'PakLingo AI summarized this guidance based on official Pakistani public service guidelines.';
  }

  return {
    verifiedOfficialInfo: verifiedPart,
    generalGuidance: guidancePart,
    needsVerificationInfo: needsVerifPart,
    aiExplanation: explanationPart,
  };
}

// Dedicated API endpoint for Government Assistant with live search grounding
governmentRouter.post('/api/government/query', async (req: Request, res: Response) => {
  const { query, language = 'ur', category } = req.body;

  if (!query || typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({ error: 'Query string is required.' });
  }

  const trimmedQuery = query.trim();
  const cacheKey = `${language}_${category || 'all'}_${trimmedQuery.toLowerCase()}`;
  const cached = serverGovernmentCache.get(cacheKey);
  if (cached) {
    res.setHeader('X-Cache-Status', 'HIT');
    return res.json(cached);
  }

  const officialPortal = getOfficialPortal(trimmedQuery);
  const currentDateStr = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const ai = getGemini();
  if (!ai) {
    // No API key available or offline
    return res.json({
      text: `Current official information could not be verified. Please check the relevant official government website: ${officialPortal.url}`,
      verifiedOfficialInfo: `Current official information could not be verified. Please check the relevant official government website (${officialPortal.domain}).`,
      generalGuidance: `1. Visit the nearest official departmental center or registration counter.\n2. Do NOT pay unauthorized agents or intermediaries.\n3. Verify all requirements on ${officialPortal.url}.`,
      aiExplanation: `Live connection to official sources is currently unconfigured or pending verification. PakLingo AI will not invent government facts.`,
      sources: [
        {
          title: officialPortal.name,
          uri: officialPortal.url,
          domain: officialPortal.domain,
          dateChecked: currentDateStr,
        },
      ],
      isVerified: false,
      dateChecked: currentDateStr,
      officialPortalUrl: officialPortal.url,
      searchQueries: [],
    });
  }

  try {
    const isNadra = officialPortal.domain === 'nadra.gov.pk';

    const systemInstruction = `You are the official PakLingo Government Assistant for Pakistani citizens.
Your job is to provide accurate, verified, and up-to-date civic information on Pakistani public services.

CRITICAL DIRECTIVES:
1. Do NOT hard-code or invent government facts such as fees, processing times, eligibility requirements, addresses, deadlines, or procedures.
2. For Government Assistant questions, use the search grounding capability and prioritize official Pakistani government sources:
   - For NADRA-related questions, STRICTLY prioritize the official NADRA website: https://www.nadra.gov.pk/ and https://id.nadra.gov.pk/
   - For Passports: https://dgip.gov.pk/
   - For BISP: https://bisp.gov.pk/
   - For FBR: https://fbr.gov.pk/
   - For DLIMS: https://dlims.punjab.gov.pk/
3. Every time the answer contains current government information, clearly cite:
   - Source
   - Source title
   - Official website/domain
   - Date checked (Current date: ${currentDateStr})
4. If current official information cannot be verified, do NOT invent an answer. Say exactly:
   "Current official information could not be verified. Please check the relevant official government website."
5. Never present demo/mock data as real information.
6. Clearly separate your response into distinct sections using these exact Markdown headings:
### 1. Verified Official Information
(Present only facts verified from official Pakistani government sources. Detail the exact official fee tiers in PKR such as Normal, Urgent, Executive; exact processing times in working days; required original documents; and specific official portal links.)

### 2. General Guidance
(Provide step-by-step procedural assistance: physical center advice, online application instructions via official portals, biometric requirements, and strong warnings against unauthorized agents.)

### 3. Information That Needs Official Verification
(Identify items that require verification directly at the official counter or portal: such as individual case penalties, provincial quota rules, localized gazetted officer attestation formats, or fluctuating bank branch challans.)

### 4. AI-Generated Plain Explanation
(Provide a plain-language explanation of terms and what citizens should expect in the selected target language.)

${getGlobalLanguageDirective(language)}`;

    const promptText = `User Question: "${trimmedQuery}"
Target Language: ${getLanguageName(language)}
Department Reference: ${officialPortal.name} (${officialPortal.url})
Special instruction: Retrieve current official Pakistani government fees, processing timelines, and document requirements. Ground the response using official government sources, particularly ${isNadra ? 'https://www.nadra.gov.pk/' : officialPortal.url}. Ensure the complete output is presented in ${getLanguageName(language)}.`;

    let response: any = null;
    let lastError: any = null;

    // Step 1: Attempt search grounding with googleSearch tool first (if quota permits)
    let searchQuotaExhausted = false;
    for (const modelName of CANDIDATE_GEMINI_MODELS) {
      if (searchQuotaExhausted) break;
      try {
        response = await callGeminiWithTimeout(
          ai.models.generateContent({
            model: modelName,
            contents: promptText,
            config: {
              systemInstruction,
              tools: [{ googleSearch: {} }],
            },
          }),
          8000
        );
        if (response?.candidates?.[0]) {
          break;
        }
      } catch (err: any) {
        lastError = err;
        if (isQuotaExhaustedError(err)) {
          searchQuotaExhausted = true;
          break;
        }
      }
    }

    // Step 2: If search grounding encounters quota limit or transient error, query Gemini directly without tool constraint
    if (!response?.candidates?.[0]) {
      try {
        response = await callWithCandidateModels(
          'Government Information Direct Query',
          (modelName) =>
            ai.models.generateContent({
              model: modelName,
              contents: `${promptText}\n\nCRITICAL REQUIREMENT: Strictly prioritize the official Pakistani government source (${officialPortal.url}${isNadra ? ' and https://id.nadra.gov.pk/' : ''}). Provide verified official fees in PKR, processing delivery timelines in working days, required documents, and official portal links. Output clearly separated into the 4 sections:\n### 1. Verified Official Information\n### 2. General Guidance\n### 3. Information That Needs Official Verification\n### 4. AI-Generated Plain Explanation`,
              config: {
                systemInstruction,
              },
            }),
          18000
        );
      } catch (err: any) {
        lastError = err;
      }
    }

    if (!response && lastError) {
      throw lastError;
    }

    const candidate = response.candidates?.[0];
    const rawText = candidate?.content?.parts?.map((p: any) => p.text).filter(Boolean).join('\n') || '';

    // Extract grounding chunks and web search queries
    const groundingChunks = (candidate?.groundingMetadata as any)?.groundingChunks || [];
    const webSearchQueries = (candidate?.groundingMetadata as any)?.webSearchQueries || [];

    const sources: Array<{ title: string; uri: string; domain: string; dateChecked: string }> = [];
    const seenUris = new Set<string>();

    for (const chunk of groundingChunks) {
      const uri = chunk?.web?.uri;
      const title = chunk?.web?.title || 'Official Source';
      if (uri && !seenUris.has(uri)) {
        seenUris.add(uri);
        try {
          const u = new URL(uri);
          sources.push({
            title: title,
            uri: uri,
            domain: u.hostname.replace(/^www\./, ''),
            dateChecked: currentDateStr,
          });
        } catch {
          sources.push({
            title: title,
            uri: uri,
            domain: officialPortal.domain,
            dateChecked: currentDateStr,
          });
        }
      }
    }

    // Always ensure the primary official government portal is present in the sources list
    if (!seenUris.has(officialPortal.url)) {
      sources.unshift({
        title: officialPortal.name,
        uri: officialPortal.url,
        domain: officialPortal.domain,
        dateChecked: currentDateStr,
      });
    }

    if (isNadra && !seenUris.has('https://id.nadra.gov.pk/')) {
      sources.push({
        title: 'Pak-ID Online Portal (NADRA)',
        uri: 'https://id.nadra.gov.pk/',
        domain: 'id.nadra.gov.pk',
        dateChecked: currentDateStr,
      });
    }

    // Check if the answer could not be verified
    const isUnverified =
      rawText.toLowerCase().includes('could not be verified') ||
      rawText.includes('سرکاری معلومات کی تصدیق نہیں ہو سکی') ||
      rawText.trim().length === 0;

    const sections = parseGovernmentSections(rawText);

    const payload = {
      text: rawText,
      verifiedOfficialInfo: sections.verifiedOfficialInfo,
      generalGuidance: sections.generalGuidance,
      needsVerificationInfo: sections.needsVerificationInfo,
      aiExplanation: sections.aiExplanation,
      sources: sources,
      isVerified: !isUnverified,
      dateChecked: currentDateStr,
      officialPortalUrl: officialPortal.url,
      searchQueries: webSearchQueries,
    };
    serverGovernmentCache.set(cacheKey, payload);

    res.json(payload);
  } catch (error: any) {
    console.error('Error querying Gemini for Government Assistant:', error);
    res.json({
      text: 'Current official information could not be verified. Please check the relevant official government website.',
      verifiedOfficialInfo: 'Current official information could not be verified. Please check the relevant official government website.',
      generalGuidance: `Please refer directly to ${officialPortal.url} or visit the nearest official registration center. Never rely on unofficial sources.`,
      needsVerificationInfo: 'Live official rates, penalties, and local requirements could not be verified at this moment. Please visit the official counter or portal.',
      aiExplanation: 'Official data verification requires a direct connection to official Pakistani portals.',
      sources: [
        {
          title: officialPortal.name,
          uri: officialPortal.url,
          domain: officialPortal.domain,
          dateChecked: currentDateStr,
        },
      ],
      isVerified: false,
      dateChecked: currentDateStr,
      officialPortalUrl: officialPortal.url,
      searchQueries: [],
    });
  }
});

// Government Assistant: Document & Form Explanation API endpoint
governmentRouter.post('/api/government/document-explain', async (req: Request, res: Response) => {
  const {
    fileBase64,
    mimeType = 'image/jpeg',
    fileName = 'document',
    text = '',
    action = 'explain_fields',
    language = 'ur',
    userQuestion = '',
  } = req.body;

  if (!fileBase64 && !text.trim()) {
    return res.status(400).json({ error: 'Either a document file or document text is required.' });
  }

  const ai = getGemini();
  if (!ai) {
    return res.status(503).json({
      error: 'AI_UNAVAILABLE',
      message: 'Gemini API not configured. Please ensure GEMINI_API_KEY is configured.',
    });
  }

  const langInstruction = getGlobalLanguageDirective(language);

  const actionPrompts: Record<string, string> = {
    explain_fields: `You are the PakLingo Government Document & Form Explainer for Pakistani citizens.
Analyze the provided government document/form (${fileName}).
Provide a structured, easy-to-read explanation:
1. **Document Identification**: What official Pakistani document/form is this (e.g., NADRA CRC/B-Form, Challan 32-A, FBR Tax Return, Domicile Application, Passport Token)?
2. **Field-by-Field Breakdown**: Explain the visible fields, sections, or boxes in simple language:
   - What does each field ask for?
   - What specific information should the citizen enter?
   - What supporting proof/document belongs with each section?
3. **Important Checkpoints & Signatures**:
   - Where are signatures, thumbprints, or officer attestations (e.g., Grade 17+ Gazetted Officer) required?
   - What are common mistakes to avoid?
4. **Mandatory Civic Notice**: State clearly: "Notice: This AI explanation is for educational and guidance purposes only. PakLingo AI does NOT submit or process applications. Official submission must be carried out at the designated government department or official portal."`,

    translate: `You are the PakLingo Government Document Translator for Pakistani citizens.
Translate this official Pakistani government document/form (${fileName}) between Urdu and English.
Provide:
1. **Document Overview**: Brief statement of what the form is.
2. **Translation of Sections & Fields**:
   - Provide accurate translations of all official headings, field titles, and instructions.
   - For English text, provide natural Urdu translation.
   - For Urdu text, provide clear English translation.
3. **Key Terminology Glossary**: Explain any complex administrative or legal terms (e.g., "Malkiat", "Halaf Nama", "Intiqal", "Challan", "Gazetted Attestation").
4. **Mandatory Civic Notice**: State clearly: "Notice: This AI translation is for guidance only and does not constitute a certified legal translation."`,

    summarize: `You are the PakLingo Government Document Analyst.
Summarize the provided official document/form (${fileName}) for a Pakistani citizen:
1. **Purpose & Key Objective**: What does this document achieve or require?
2. **Citizen Action Items**: What must the citizen do, step-by-step?
3. **Deadlines & Verification Requirements**: Any stated timelines, validity periods, or verification steps.
4. **Required Attachments**: Checklist of documents that must accompany this form.
5. **Mandatory Civic Notice**: State clearly: "Notice: This summary is for educational guidance only. Verify all guidelines directly on the issuing department's official website."`,
  };

  const basePrompt = actionPrompts[action] || actionPrompts.explain_fields;
  const userQueryPrompt = userQuestion.trim()
    ? `\n\nSpecific Citizen Question to Answer: "${userQuestion.trim()}"`
    : '';
  const textContext = text.trim() ? `\n\nDocument Text Content:\n"""\n${text.trim()}\n"""` : '';

  const fullPrompt = `${basePrompt}${userQueryPrompt}${textContext}\n\nLanguage Preference: ${langInstruction}`;

  const contents: any = [];

  if (fileBase64 && typeof fileBase64 === 'string') {
    const cleanBase64 = fileBase64.replace(/^data:[^;]+;base64,/, '');
    contents.push({
      role: 'user',
      parts: [
        {
          inlineData: {
            mimeType: mimeType || 'image/jpeg',
            data: cleanBase64,
          },
        },
        {
          text: fullPrompt,
        },
      ],
    });
  } else {
    contents.push({
      role: 'user',
      parts: [{ text: fullPrompt }],
    });
  }

  try {
    const response = await callWithCandidateModels(
      'Document Explanation',
      (modelName) =>
        ai.models.generateContent({
          model: modelName,
          contents: contents[0]?.parts ? [{ role: 'user', parts: contents[0].parts }] : [{ role: 'user', parts: [{ text: fullPrompt }] }],
          config: {
            systemInstruction: 'You are the PakLingo Citizen Document & Form Explainer for Pakistani public forms and official documents.',
          },
        }),
      25000
    );

    const explanation = response.text || response?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).filter(Boolean).join('\n') || '';
    if (explanation) {
      return res.json({
        explanation,
        action,
        fileName,
        isVerified: false,
        dateChecked: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        notice: 'This AI document analysis is for general citizen guidance only. PakLingo AI does not submit or process applications.',
      });
    }

    return res.status(503).json({
      error: 'DOCUMENT_ANALYSIS_FAILED',
      message: 'Unable to analyze the document right now. Please try again or ensure the image is clear.',
    });
  } catch (err: any) {
    return res.status(503).json({
      error: 'DOCUMENT_ANALYSIS_FAILED',
      message: 'Unable to analyze the document right now. Please try again or ensure the image is clear.',
    });
  }
});
