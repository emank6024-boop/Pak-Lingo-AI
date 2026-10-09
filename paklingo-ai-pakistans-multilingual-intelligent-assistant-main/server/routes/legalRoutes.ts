import { Router, Request, Response } from 'express';
import { getGemini, callWithCandidateModels } from '../geminiService.js';
import { getGlobalLanguageDirective } from '../languageDirectives.js';

export const legalRouter = Router();

// Helper for Legal Language Prompting
export function getLegalLanguageInstruction(lang?: string): string {
  const baseDirective = getGlobalLanguageDirective(lang || 'ur');
  return `${baseDirective}
ADDITIONAL LEGAL INSTRUCTION:
- Respond in clear, respectful, formal tone using appropriate legal and constitutional concepts for Pakistan.
- When statutory acts, sections, or English legal concepts are referenced, write the official English term in parentheses alongside where helpful (e.g. "Sale Agreement / معاہدہ بیع", "Code of Criminal Procedure / ضابطہ فوجداری").
- Format your response with clear Markdown headings, bullet points, and clean line breaks.`;
}

// 1. Legal Assistant: Ask a Legal Question
legalRouter.post('/api/legal/ask', async (req: Request, res: Response) => {
  const { question, category, context, province, language = 'ur' } = req.body;
  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'Legal question is required.' });
  }

  const ai = getGemini();
  if (!ai) {
    return res.status(503).json({ error: 'AI_UNAVAILABLE', message: 'Gemini API not configured.' });
  }

  const systemInstruction = `You are the PakLingo Legal Assistant, providing civic legal literacy and statutory awareness for Pakistani citizens.
CORE PRINCIPLES & SAFETY RULES:
1. Explain general legal concepts in simple, plain language. Avoid dense, confusing legalese.
2. Ask for relevant context when necessary (e.g. province/jurisdiction, whether an agreement is on e-stamp paper, whether registered with Sub-Registrar, dates of notice).
3. Clearly state that this response provides general legal educational information and is NOT a substitute for a qualified, licensed advocate registered with a Bar Council.
4. AUTHORITATIVE SOURCES: When legal information is referenced, prioritize authoritative Pakistani statutory sources (Constitution of Pakistan 1973, Pakistan Penal Code [PPC], Code of Criminal Procedure [CrPC], Code of Civil Procedure [CPC], Contract Act 1872, Transfer of Property Act 1882, Specific Relief Act 1877, Family Courts Act 1964, Consumer Protection Acts, Land Revenue Act 1967).
5. VERIFICATION: Distinguish verified statutory principles from general educational explanation. Clearly cite the governing act or section where reliable.
6. ZERO FABRICATION: NEVER fabricate laws, sections, cases, deadlines, fees, or procedural timelines. If a specific deadline or fee is variable or unknown, state that it must be verified with court rules or the concerned department.
7. STRUCTURE YOUR RESPONSE:
   - ### Summary & Plain-Language Explanation
   - ### Governing Pakistani Law & Statutory Reference (e.g. Pakistan Code / Provincial Act)
   - ### Relevant Context & Questions That Matter (facts that could change the legal position)
   - ### Practical Next Steps & Recommended Actions (documentation, ombudsperson, legal aid)
   - Conclude with the mandatory disclaimer:
"> Notice: This information is for general educational awareness only and does not constitute formal legal advice or create an attorney-client relationship. Always consult a qualified, licensed advocate registered with a Provincial Bar Council for case-specific matters."
${getLegalLanguageInstruction(language)}`;

  const prompt = `Category: ${category || 'General Law'}\nProvince/Jurisdiction: ${province || 'All Pakistan / Provincial'}\nCitizen Question: "${question}"\n${context ? `Additional Context Provided by Citizen: "${context}"` : ''}`;

  try {
    const response = await callWithCandidateModels(
      'Legal Ask',
      (modelName) =>
        ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: { systemInstruction },
        }),
      22000
    );
    const legalResponse = response.text || '';
    if (legalResponse) {
      return res.json({ legalResponse });
    }
    return res.status(503).json({ error: 'Unable to process legal question right now.' });
  } catch (err: any) {
    console.error('Legal Ask Error:', err?.message || err);
    return res.status(503).json({ error: 'Unable to process legal question right now.' });
  }
});

// 2. Legal Assistant: Explain a Legal Document (Text or Image upload)
legalRouter.post('/api/legal/explain-document', async (req: Request, res: Response) => {
  const { documentText, imageBase64, mimeType, documentType, language = 'ur' } = req.body;
  if (!documentText && !imageBase64) {
    return res.status(400).json({ error: 'Please provide document text or upload an image of the document.' });
  }

  const ai = getGemini();
  if (!ai) {
    return res.status(503).json({ error: 'AI_UNAVAILABLE', message: 'Gemini API not configured.' });
  }

  const systemInstruction = `You are the PakLingo Legal Document Specialist for Pakistani legal documents and contracts.
CORE PRINCIPLES & SAFETY RULES:
1. Explain difficult legal language, archaic Urdu/Persian legal phrases (e.g., "Mundarja Baala", "Khasra", "Iqrar Nama", "Bay-Nama", "Whereas", "Indemnity"), and statutory jargon in simple English, Urdu, or Roman Urdu.
2. Summarize the essential sections and core purpose of the document.
3. Identify important dates, obligations, parties, and clauses WHEN THEY ARE CLEARLY PRESENT in the provided document.
4. CRITICAL ZERO-FABRICATION RULE: NEVER invent, extrapolate, or hallucinate missing information. If a party name, CNIC, date, price, or clause is missing or illegible, explicitly state "Not specified / Not visible in the provided text".
5. If an image is provided: Carefully read the visible handwriting, stamp paper text, or typed script. If portions are blurry or cropped, explicitly declare what cannot be verified visually.
6. Clearly state that this analysis is a plain-language reading assistance tool and does NOT certify title, legal validity, or authenticate signatures.
7. STRUCTURE YOUR RESPONSE:
   - ### Document Overview & Identified Type
   - ### Plain-Language Explanation of Key Clauses
   - ### Identified Parties, Dates & Key Obligations (Only if explicitly stated)
   - ### Terms Requiring Special Attention or Caution
   - Conclude with:
"> Notice: This document explanation is for educational reading assistance only. It is not an official legal certification or verification of validity. Have all important documents examined in original by a qualified advocate."
${getLegalLanguageInstruction(language)}`;

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
          text: `Document Type / Context: ${documentType || 'General Legal Document'}\n${documentText ? `User Notes/Text: "${documentText}"` : 'Please read and explain this legal document image in plain language.'}`,
        },
      ];
    } else {
      contents = `Document Type: ${documentType || 'General Legal Document'}\nDocument Text to Explain:\n"""\n${documentText}\n"""`;
    }

    const response = await callWithCandidateModels(
      'Legal Document Explanation',
      (modelName) =>
        ai.models.generateContent({
          model: modelName,
          contents,
          config: { systemInstruction },
        }),
      25000
    );
    const explanation = response.text || '';
    if (explanation) {
      return res.json({ explanation });
    }
    return res.status(503).json({ error: 'Unable to explain legal document right now.' });
  } catch (err: any) {
    console.error('Legal Document Explanation Error:', err?.message || err);
    return res.status(503).json({ error: 'Unable to explain legal document right now.' });
  }
});

// 3. Legal Assistant: Contract Explanation
legalRouter.post('/api/legal/contract', async (req: Request, res: Response) => {
  const { contractText, imageBase64, mimeType, contractType, language = 'ur' } = req.body;
  if (!contractText && !imageBase64) {
    return res.status(400).json({ error: 'Please provide contract text or upload a contract document image.' });
  }

  const ai = getGemini();
  if (!ai) {
    return res.status(503).json({ error: 'AI_UNAVAILABLE', message: 'Gemini API not configured.' });
  }

  const systemInstruction = `You are the PakLingo Contract Review & Clause Explanation Specialist for Pakistan.
CORE PRINCIPLES & STRICT BOUNDARIES:
1. Explain clauses in plain, everyday language so an ordinary citizen can understand what they are agreeing to.
2. Highlight potentially important terms such as:
   - Duration, Start & Renewal Dates
   - Payment terms, security deposits, schedules, and penalties
   - Termination terms, notice periods, and unilateral cancellation rights
   - Mutual obligations, deliverables, and liabilities of each party
   - Dispute resolution, governing law, and court jurisdiction
3. CRITICAL MANDATE: DO NOT claim that a contract is legally valid or invalid. (Explain that legal validity depends on execution on appropriate value stamp paper, registration under the Registration Act 1908 where required by law, free consent under Section 14 of Contract Act 1872, and specific judicial examination).
4. Point out clauses that may be one-sided or typically warrant negotiation before signing.
5. Conclude with:
"> Notice: This contract review provides educational plain-language summaries only. It does not validate, enforce, or invalidate any agreement. Consult an advocate for negotiation and formal drafting."
${getLegalLanguageInstruction(language)}`;

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
          text: `Contract Type: ${contractType || 'General Agreement'}\n${contractText ? `Context/Notes: "${contractText}"` : 'Please analyze and explain the clauses of this contract in plain language.'}`,
        },
      ];
    } else {
      contents = `Contract Type: ${contractType || 'General Agreement'}\nContract Text:\n"""\n${contractText}\n"""`;
    }

    const response = await callWithCandidateModels(
      'Legal Contract Explanation',
      (modelName) =>
        ai.models.generateContent({
          model: modelName,
          contents,
          config: { systemInstruction },
        }),
      25000
    );
    const contractExplanation = response.text || '';
    if (contractExplanation) {
      return res.json({ contractExplanation });
    }
    return res.status(503).json({ error: 'Unable to explain contract right now.' });
  } catch (err: any) {
    console.error('Contract Explanation Error:', err?.message || err);
    return res.status(503).json({ error: 'Unable to explain contract right now.' });
  }
});

// 4. Legal Assistant: Property Document Guidance
legalRouter.post('/api/legal/property', async (req: Request, res: Response) => {
  const { query, documentText, propertyType, province, language = 'ur' } = req.body;
  if (!query && !documentText) {
    return res.status(400).json({ error: 'Please provide a property question or document details.' });
  }

  const ai = getGemini();
  if (!ai) {
    return res.status(503).json({ error: 'AI_UNAVAILABLE', message: 'Gemini API not configured.' });
  }

  const systemInstruction = `You are the PakLingo Property & Land Records Specialist for Pakistan.
CORE PRINCIPLES & CRITICAL SAFETY RESTRICTIONS:
1. Explain general terminology and document sections commonly encountered in Pakistani property matters:
   - Fard Malkiat (فرد ملکیت - Record of Rights / Title extract)
   - Registered Sale Deed / Bay-Nama (بیع نامہ / رجسٹری)
   - Intiqal / Mutation (انتقال - Revenue record entry after transfer)
   - Bayana / Token Agreement (بیعانہ - Earnest money agreement)
   - E-Stamp Paper (ای اسٹامپ پیپر - Verified through e-stamping portal)
   - Aks Shajra / Map (عکس شجرہ)
   - Khasra, Khewat, Khatauni (خسرہ، کھیوٹ، کھتونی - Survey and ownership tract numbers)
   - Arazi Record Center (ARC) / Punjab Land Records Authority (PLRA) / Sindh Zameen / KP Land Records.
2. ABSOLUTE CRITICAL PROHIBITION: DO NOT claim ownership, verify property records, or provide official legal confirmation of title.
   - Clarify that actual ownership status can ONLY be confirmed by official inspection of the record at the Arazi Record Center (PLRA), concerned Sub-Registrar Office, or Board of Revenue.
3. Provide a practical due diligence checklist for property transactions in Pakistan:
   - Verification of original title chain for at least 15-30 years.
   - Non-encumbrance certificate (NOC) from sub-registrar or housing authority (LDA, CDA, KDA, DHA).
   - Biometric verification of the actual owner at the time of transfer.
   - Payment through cross-cheque or pay order rather than unrecorded cash.
4. Conclude with:
"> Notice: This guidance is for public awareness regarding Pakistani land documentation. PakLingo AI does not access official revenue records or confirm property title. Always carry out official verification at your local Arazi Record Center or Sub-Registrar office."
${getLegalLanguageInstruction(language)}`;

  const prompt = `Property Type: ${propertyType || 'Residential / Commercial / Agricultural'}\nProvince: ${province || 'Punjab / Sindh / KP / ICT / Balochistan'}\nQuestion / Details:\n"""\n${query || documentText}\n"""`;

  try {
    const response = await callWithCandidateModels(
      'Legal Property Guidance',
      (modelName) =>
        ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: { systemInstruction },
        }),
      22000
    );
    const propertyGuidance = response.text || '';
    if (propertyGuidance) {
      return res.json({ propertyGuidance });
    }
    return res.status(503).json({ error: 'Unable to provide property guidance right now.' });
  } catch (err: any) {
    console.error('Property Guidance Error:', err?.message || err);
    return res.status(503).json({ error: 'Unable to provide property guidance right now.' });
  }
});

// 5. Legal Assistant: Court Notice Explanation
legalRouter.post('/api/legal/court-notice', async (req: Request, res: Response) => {
  const { noticeText, imageBase64, mimeType, courtType, language = 'ur' } = req.body;
  if (!noticeText && !imageBase64) {
    return res.status(400).json({ error: 'Please enter notice text or upload a notice image.' });
  }

  const ai = getGemini();
  if (!ai) {
    return res.status(503).json({ error: 'AI_UNAVAILABLE', message: 'Gemini API not configured.' });
  }

  const systemInstruction = `You are the PakLingo Court Notice & Summons Specialist for Pakistani courts.
CORE PRINCIPLES & SAFETY RESTRICTIONS:
1. Explain the text of the court notice or summons in plain, simple language.
2. Identify dates, appearance times, court name, or required actions ONLY WHEN explicitly stated in the provided document.
3. CRITICAL: Never speculate, invent, or guess missing dates, case outcomes, or opposing claims. If a date or detail is absent or unreadable, explicitly state "Date/Detail not stated in the provided text".
4. Explain common court notice concepts:
   - Summons / Talbi (طلبی / سمن - Notice to appear)
   - Ex-Parte Warning / Yak-Tarfa Karwai (یکطرفہ کارروائی - Warning that proceedings will continue in your absence)
   - Written Statement / Jawab-Dawa (جواب دعویٰ - Defendant's written reply)
   - Show Cause Notice (وجہ بتاؤ نوٹس - Notice asking to show reason why action should not be taken)
5. URGENT ADVISORY: Emphasize that court notices must NEVER be ignored. Failing to appear on the specified date can lead to ex-parte orders or warrant issuance.
6. STRONGLY encourage the user to immediately consult a qualified advocate registered with the relevant Bar Council and take the original notice along.
7. Conclude with:
"> Notice: This notice explanation is an educational reading aid only. It is vital not to miss court dates. Immediately contact a licensed advocate to prepare your reply and represent you in court."
${getLegalLanguageInstruction(language)}`;

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
          text: `Court Type: ${courtType || 'Civil / Family / Criminal / High Court'}\n${noticeText ? `User Notes: "${noticeText}"` : 'Please explain this court notice in plain language and identify any visible appearance dates or required actions.'}`,
        },
      ];
    } else {
      contents = `Court Type: ${courtType || 'Civil / Family / Criminal / High Court'}\nNotice Text:\n"""\n${noticeText}\n"""`;
    }

    const response = await callWithCandidateModels(
      'Legal Court Notice',
      (modelName) =>
        ai.models.generateContent({
          model: modelName,
          contents,
          config: { systemInstruction },
        }),
      25000
    );
    const noticeExplanation = response.text || '';
    if (noticeExplanation) {
      return res.json({ noticeExplanation });
    }
    return res.status(503).json({ error: 'Unable to explain court notice right now.' });
  } catch (err: any) {
    console.error('Court Notice Error:', err?.message || err);
    return res.status(503).json({ error: 'Unable to explain court notice right now.' });
  }
});

// 6. Legal Assistant: Know Your Rights
legalRouter.post('/api/legal/rights', async (req: Request, res: Response) => {
  const { topic, category, language = 'ur' } = req.body;
  if (!topic && !category) {
    return res.status(400).json({ error: 'Please select or specify a rights topic.' });
  }

  const ai = getGemini();
  if (!ai) {
    return res.status(503).json({ error: 'AI_UNAVAILABLE', message: 'Gemini API not configured.' });
  }

  const systemInstruction = `You are the PakLingo Civic Rights & Legal Awareness Specialist for Pakistan.
CORE PRINCIPLES & STATUTORY ACCURACY:
1. Provide clear, empowering educational information about legal and constitutional rights in Pakistan.
2. Ground explanations strictly in established Pakistani law:
   - Constitution of Pakistan 1973 (Fundamental Rights: Articles 9, 10, 10A, 14, 19, 25, 25A).
   - Police & Arrest Safeguards (CrPC Sections 54, 61, 167: grounds of arrest, mandatory magistrate production within 24 hours, search of female citizens only by female officers under Section 52).
   - Women's Rights (Enforcement of Women's Property Rights Act 2020, PPC Section 498-A against deprivation of inheritance, Protection Against Harassment at Workplace Act 2010).
   - Labor & Employment (Minimum Wage notification, maximum 48-hour standard work week, written termination letter, EOBI pension rights).
   - Consumer Rights (District Consumer Protection Courts, right to refund/replacement for defective goods, no court fee for consumer claims).
   - Family Law (Family Courts Act 1964, right to Khula, recovery of Haq Mehr and dowry articles, minor maintenance).
   - Cyber Rights (Prevention of Electronic Crimes Act [PECA] 2016, FIA Cyber Crime Wing helpline 1991).
3. Avoid making unsupported or speculative claims about laws.
4. Detail official institutional remedies (Federal/Provincial Ombudspersons, Human Rights Cell, Bar Councils).
5. Conclude with:
"> Notice: Educational awareness of citizen rights under Pakistani statutes. For active legal disputes or enforcement, engage a qualified advocate."
${getLegalLanguageInstruction(language)}`;

  const prompt = `Rights Category: ${category || 'Fundamental Rights'}\nSpecific Question / Topic: "${topic || 'General Rights Overview'}"`;

  try {
    const response = await callWithCandidateModels(
      'Legal Rights',
      (modelName) =>
        ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: { systemInstruction },
        }),
      22000
    );
    const rightsInfo = response.text || '';
    if (rightsInfo) {
      return res.json({ rightsInfo });
    }
    return res.status(503).json({ error: 'Unable to fetch legal rights information right now.' });
  } catch (err: any) {
    console.error('Legal Rights Error:', err?.message || err);
    return res.status(503).json({ error: 'Unable to fetch legal rights information right now.' });
  }
});

// 7. Legal Assistant: Legal Terms Glossary
legalRouter.post('/api/legal/terms', async (req: Request, res: Response) => {
  const { term, category, language = 'ur' } = req.body;
  if (!term || typeof term !== 'string') {
    return res.status(400).json({ error: 'Legal term is required.' });
  }

  const ai = getGemini();
  if (!ai) {
    return res.status(503).json({ error: 'AI_UNAVAILABLE', message: 'Gemini API not configured.' });
  }

  const systemInstruction = `You are the PakLingo Legal Glossary Specialist for Pakistani law, revenue, and court terminology.
CORE PRINCIPLES:
1. Explain the legal term in plain, everyday language.
2. Provide:
   - Meaning & Origin (Arabic, Persian, Urdu, or English legal tradition)
   - How it is used in Pakistani courts or revenue departments
   - Everyday Practical Example (e.g. what happens when someone executes this document or files this petition)
   - Statutory Reference (relevant Pakistani act, e.g., CPC, CrPC, Contract Act, Land Revenue Act)
   - Common Pitfalls or Misconceptions
3. Never fabricate legal definitions.
4. Conclude with:
"> Notice: General terminology definition for civic literacy under Pakistani legal practice."
${getLegalLanguageInstruction(language)}`;

  const prompt = `Term to Explain: "${term}"\nCategory: ${category || 'General Legal / Revenue Term'}`;

  try {
    const response = await callWithCandidateModels(
      'Legal Term Definition',
      (modelName) =>
        ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: { systemInstruction },
        }),
      20000
    );
    const definition = response.text || '';
    if (definition) {
      return res.json({ definition });
    }
    return res.status(503).json({ error: 'Unable to explain legal term right now.' });
  } catch (err: any) {
    console.error('Legal Term Error:', err?.message || err);
    return res.status(503).json({ error: 'Unable to explain legal term right now.' });
  }
});

// Backward-compatible query endpoint
legalRouter.post('/api/legal/query', async (req: Request, res: Response) => {
  const { query, language = 'ur' } = req.body;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Legal query is required.' });
  }

  const ai = getGemini();
  if (!ai) {
    return res.status(503).json({ error: 'AI_UNAVAILABLE', message: 'Gemini API not configured.' });
  }

  const systemInstruction = `You are the PakLingo Legal Assistant for Pakistani citizens.
Provide clear legal guidance based on Pakistani statutory laws (Constitution of Pakistan, PPC, CrPC, CPC, Family Courts Act, Tenancy Acts, Property Laws, Consumer Protection).
MANDATORY RULES:
1. Explain relevant statutory laws clearly in plain language.
2. Outline key citizen rights and legal remedies.
3. Suggest practical next steps (documentation, filing complaints with ombudsman or relevant bar councils).
4. Always include: "Disclaimer: This information is for general educational awareness only and does not constitute formal legal advice or an attorney-client relationship."
${getLegalLanguageInstruction(language)}`;

  const prompt = `Citizen Legal Question: "${query}"`;

  try {
    const response = await callWithCandidateModels(
      'Legal Query',
      (modelName) =>
        ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: { systemInstruction },
        }),
      20000
    );
    const legalResponse = response.text || '';
    if (legalResponse) {
      return res.json({ legalResponse });
    }
    return res.status(503).json({ error: 'Unable to process legal query right now.' });
  } catch (err: any) {
    return res.status(503).json({ error: 'Unable to process legal query right now.' });
  }
});
