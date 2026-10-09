import { Router, Request, Response } from 'express';
import { getGemini, callWithCandidateModels } from '../geminiService.js';
import { getGlobalLanguageDirective } from '../languageDirectives.js';

export const medicalRouter = Router();

// Helper for Medical Language Prompting
export function getMedicalLanguageInstruction(lang?: string): string {
  const baseDirective = getGlobalLanguageDirective(lang || 'ur');
  return `${baseDirective}
ADDITIONAL MEDICAL INSTRUCTION:
Provide empathetic, clear public health advice. You may include common clinical or pharmaceutical terms in English in parentheses where helpful for patient safety and clarity. Always prioritize user safety and mention emergency contact 1122 for life-threatening symptoms.`;
}

// Medical Assistant 1: Ask a Health Question
medicalRouter.post('/api/medical/ask', async (req: Request, res: Response) => {
  const { question, language = 'en' } = req.body;
  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'Question is required.' });
  }

  const ai = getGemini();
  if (!ai) {
    return res.status(503).json({ error: 'AI_UNAVAILABLE', message: 'Gemini API not configured.' });
  }

  const systemInstruction = `You are the PakLingo AI Medical Assistant providing public health education for Pakistani citizens.
CRITICAL MEDICAL EDUCATION MANDATES:
1. Explain the health topic, disease, or medical question in simple, patient-friendly, non-jargon language.
2. Provide general educational information, NOT a definitive personal diagnosis or prescription.
3. Outline common physiological mechanisms, typical symptoms/signs, and general non-medicinal supportive care.
4. Strongly encourage consultation with a qualified healthcare professional (MBBS doctor, specialist, or clinic) for personalized diagnosis and clinical treatment.
5. ALWAYS conclude with this exact notice:
"Notice: Educational information — not a diagnosis or a substitute for a healthcare professional."
${getMedicalLanguageInstruction(language)}`;

  const prompt = `Health Question: "${question}"`;

  try {
    const response = await callWithCandidateModels(
      'Medical Ask Question',
      (modelName) =>
        ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: { systemInstruction },
        }),
      22000
    );
    const answer = response.text || '';
    if (answer) {
      return res.json({ answer, text: answer, guidance: answer });
    }
    return res.status(503).json({ error: 'Unable to process health question right now.' });
  } catch (err: any) {
    console.error('Medical Ask Error:', err?.message || err);
    return res.status(503).json({ error: 'Unable to process health question right now.' });
  }
});

// Medical Assistant 2: Explain Symptoms
medicalRouter.post('/api/medical/symptoms', async (req: Request, res: Response) => {
  const { symptoms, language = 'en' } = req.body;
  if (!symptoms || typeof symptoms !== 'string') {
    return res.status(400).json({ error: 'Symptoms description is required.' });
  }

  const ai = getGemini();
  if (!ai) {
    return res.status(503).json({ error: 'AI_UNAVAILABLE', message: 'Gemini API not configured.' });
  }

  const systemInstruction = `You are the PakLingo AI Medical Assistant specializing in symptom education and triage awareness for Pakistani citizens.
CRITICAL SAFETY & EDUCATIONAL MANDATES:
1. URGENT EMERGENCY CHECK: If the described symptoms indicate a potential life-threatening emergency (e.g. severe crushing chest pain, radiating arm/jaw pain, acute shortness of breath, sudden facial droop, slurred speech or one-sided weakness, severe uncontrolled bleeding, sudden loss of consciousness, poisoning, acute head trauma, or anaphylactic allergic swelling):
   - Start immediately with: "🚨 **URGENT EMERGENCY ALERT:** The symptoms described may require immediate emergency attention."
   - Instruct the user to call Rescue 1122 or Edhi 115 immediately or visit the nearest hospital emergency department (ER/Trauma Centre).
2. POSSIBLE GENERAL CATEGORIES: For non-emergency symptoms, explain possible general categories or causes without claiming certainty. Emphasize that clinical evaluation and laboratory tests (CBC, imaging, etc.) are needed for actual diagnosis.
3. PAKISTAN-SPECIFIC CAUTIONS: If fever or body aches are reported, warn against taking NSAIDs (Aspirin, Disprin, Brufen) due to risk of haemorrhage in suspected Dengue, malaria, or viral fevers. Paracetamol is the standard safe fever reducer within recommended limits.
4. SUPPORTIVE NON-PHARMACEUTICAL CARE: Outline supportive home care (hydration with ORS, clean water, rest, cool compress, light diet).
5. RED FLAGS & WHEN TO SEEK URGENT MEDICAL HELP: List specific warning signs that necessitate in-person doctor evaluation.
6. ALWAYS conclude with:
"Notice: Educational information — not a diagnosis or a substitute for a healthcare professional."
${getMedicalLanguageInstruction(language)}`;

  const prompt = `Reported Symptoms: "${symptoms}"`;

  try {
    const response = await callWithCandidateModels(
      'Medical Explain Symptoms',
      (modelName) =>
        ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: { systemInstruction },
        }),
      22000
    );
    const result = response.text || '';
    if (result) {
      return res.json({ result, triageResult: result, guidance: result, text: result, explanation: result });
    }
    return res.status(503).json({ error: 'Unable to analyze symptoms right now.' });
  } catch (err: any) {
    console.error('Medical Symptoms Error:', err?.message || err);
    return res.status(503).json({ error: 'Unable to analyze symptoms right now.' });
  }
});

// Backward compatibility for existing triage endpoint
medicalRouter.post('/api/medical/triage', async (req: Request, res: Response) => {
  const { symptoms, language = 'ur' } = req.body;
  if (!symptoms || typeof symptoms !== 'string') {
    return res.status(400).json({ error: 'Symptoms are required.' });
  }

  const ai = getGemini();
  if (!ai) {
    return res.status(503).json({ error: 'AI_UNAVAILABLE', message: 'Gemini API not configured.' });
  }

  const systemInstruction = `You are the PakLingo Medical Assistant, providing general health education and awareness for citizens in Pakistan.
MANDATORY SAFETY GUARDRAILS:
1. If the symptoms indicate a medical emergency (e.g., severe chest pain, shortness of breath, sudden numbness, severe trauma, poisoning), prominently state an URGENT EMERGENCY ALERT at the top and advise calling Rescue 1122 or visiting an emergency room immediately.
2. For non-emergencies, provide general educational information on possible causes and supportive home care.
3. In Pakistan, remind citizens to avoid NSAIDs (aspirin, brufen) if dengue fever is suspected.
4. Always conclude with: "Notice: Educational information — not a diagnosis or a substitute for a healthcare professional."
${getMedicalLanguageInstruction(language)}`;

  const prompt = `Patient/User reported symptoms: "${symptoms}"`;

  try {
    const response = await callWithCandidateModels(
      'Medical Triage',
      (modelName) =>
        ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: { systemInstruction },
        }),
      20000
    );
    const triageResult = response.text || '';
    if (triageResult) {
      return res.json({ triageResult, result: triageResult });
    }
    return res.status(503).json({ error: 'Unable to analyze health symptoms right now.' });
  } catch (err: any) {
    return res.status(503).json({ error: 'Unable to analyze health symptoms right now.' });
  }
});

// Medical Assistant 3: Medicine Information
medicalRouter.post('/api/medical/medicine-info', async (req: Request, res: Response) => {
  const { medicineName, language = 'en' } = req.body;
  if (!medicineName || typeof medicineName !== 'string') {
    return res.status(400).json({ error: 'Medicine name is required.' });
  }

  const ai = getGemini();
  if (!ai) {
    return res.status(503).json({ error: 'AI_UNAVAILABLE', message: 'Gemini API not configured.' });
  }

  const systemInstruction = `You are the PakLingo AI Medical Assistant providing educational drug information for medicines in Pakistan.
CRITICAL PHARMACEUTICAL SAFETY MANDATES:
1. Provide the generic active ingredient, drug class, and therapeutic category (e.g. Paracetamol - Analgesic/Antipyretic).
2. Explain its general purpose: What conditions it is commonly used or prescribed for in plain, patient-friendly language.
3. General Precautions: Common administration rules (with or without food, adequate water, storage conditions, precautions during pregnancy or in liver/kidney conditions).
4. Common Side Effects to monitor.
5. STRICT MEDICAL GUARDRAILS:
   - DO NOT prescribe medicines, recommend personal dosages, or tell users to start/stop prescription medication.
   - Encourage checking the packaging leaflet and consulting a licensed doctor or pharmacist.
6. ALWAYS conclude with:
"Notice: Educational information — not a diagnosis or a substitute for a healthcare professional."
${getMedicalLanguageInstruction(language)}`;

  const prompt = `Medicine Name or Brand: "${medicineName}"`;

  try {
    const response = await callWithCandidateModels(
      'Medical Medicine Info',
      (modelName) =>
        ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: { systemInstruction },
        }),
      22000
    );
    const info = response.text || '';
    if (info) {
      return res.json({ info, text: info });
    }
    return res.status(503).json({ error: 'Unable to fetch medicine information right now.' });
  } catch (err: any) {
    console.error('Medicine Info Error:', err?.message || err);
    return res.status(503).json({ error: 'Unable to fetch medicine information right now.' });
  }
});

// Medical Assistant 4: Prescription Explanation (Supports text and base64 images)
medicalRouter.post('/api/medical/prescription', async (req: Request, res: Response) => {
  const { prescriptionText, imageBase64, mimeType, notes, language = 'en' } = req.body;
  if (!prescriptionText && !imageBase64) {
    return res.status(400).json({ error: 'Prescription text or an image is required.' });
  }

  const ai = getGemini();
  if (!ai) {
    return res.status(503).json({ error: 'AI_UNAVAILABLE', message: 'Gemini API not configured.' });
  }

  const systemInstruction = `You are the PakLingo Medical Prescription Reading Assistant.
CRITICAL PRESCRIPTION READING MANDATES:
1. Explain medical terminology, abbreviations, and Latin dosage notations in simple language:
   - Form: Tab (Tablet / گولی), Cap (Capsule), Syr (Syrup / شربت), Inj (Injection), Oint (Ointment / مرہم).
   - Frequency: OD/QD (Once daily / دن میں ایک بار), BD/BID (Twice daily / دن میں دو بار), TDS/TID (Three times daily / دن میں تین بار), QID (4 times daily), PRN/SOS (As needed / ضرورت پڑنے پر).
   - Timing: AC (Before meals / کھانے سے پہلے), PC (After meals / کھانے کے بعد), HS (At bedtime / رات کو سونے سے پہلے), PO (By mouth / منہ کے ذریعے).
2. Explain the general educational purpose of each identified medicine in plain words.
3. STRICT SAFETY RULES:
   - DO NOT alter prescriptions, change dosages, or recommend stopping or starting treatments.
   - DO NOT invent missing, cut-off, or illegible information.
   - If handwriting or text is ambiguous, explicitly state: "This text is unclear or ambiguous; you must verify it directly with your doctor or pharmacist before taking any medication."
4. ALWAYS conclude with:
"Notice: Educational information — not a diagnosis or a substitute for a healthcare professional."
${getMedicalLanguageInstruction(language)}`;

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
          text: `Please read and explain this prescription or medical slip.\nAdditional patient notes: "${notes || ''}"`,
        },
      ];
    } else {
      contents = `Please explain the following prescription text or doctor's notes:\n"""\n${prescriptionText}\n"""\nAdditional notes: "${notes || ''}"`;
    }

    const response = await callWithCandidateModels(
      'Medical Prescription Explain',
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
    return res.status(503).json({ error: 'Unable to explain prescription right now.' });
  } catch (err: any) {
    console.error('Prescription Explain Error:', err?.message || err);
    return res.status(503).json({ error: 'Unable to explain prescription right now.' });
  }
});

// Medical Assistant 5: Preventive Health
medicalRouter.post('/api/medical/preventive', async (req: Request, res: Response) => {
  const { topic, question, language = 'en' } = req.body;
  const ai = getGemini();
  if (!ai) {
    return res.status(503).json({ error: 'AI_UNAVAILABLE', message: 'Gemini API not configured.' });
  }

  const systemInstruction = `You are the PakLingo Preventive Health Specialist for Pakistan.
Provide general educational information about healthy habits, prevention, and routine care:
1. Practical, evidence-based preventive measures tailored to Pakistan's conditions (e.g. Dengue vector control, heatwave survival, water boiling/purification against typhoid and Hepatitis A/E, winter smog protection, maternal and child nutrition, cardiovascular and diabetes lifestyle management).
2. Pakistan National Immunization Programme (EPI) vaccination schedule awareness.
3. Avoid personalized medical claims or prescribing treatments.
4. Encourage routine wellness checkups and healthy lifestyle choices.
5. ALWAYS conclude with:
"Notice: Educational information — not a diagnosis or a substitute for a healthcare professional."
${getMedicalLanguageInstruction(language)}`;

  const prompt = `Preventive Health Topic: "${topic || 'General Preventive Health in Pakistan'}"\nUser Question / Focus: "${question || 'Key healthy habits and preventive steps'}"`;

  try {
    const response = await callWithCandidateModels(
      'Medical Preventive Health',
      (modelName) =>
        ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: { systemInstruction },
        }),
      22000
    );
    const guidance = response.text || '';
    if (guidance) {
      return res.json({ guidance });
    }
    return res.status(503).json({ error: 'Unable to generate preventive health guidance right now.' });
  } catch (err: any) {
    console.error('Preventive Health Error:', err?.message || err);
    return res.status(503).json({ error: 'Unable to generate preventive health guidance right now.' });
  }
});
