import { Router, Request, Response } from 'express';
import { getGemini, callWithCandidateModels } from '../geminiService.js';
import { getGlobalLanguageDirective } from '../languageDirectives.js';

export const farmerRouter = Router();

// Helper for Farmer Language Prompting
export function getFarmerLanguageInstruction(lang?: string): string {
  const baseDirective = getGlobalLanguageDirective(lang || 'ur');
  return `${baseDirective}
ADDITIONAL AGRICULTURAL INSTRUCTION:
- Speak in warm, respectful, practical terminology familiar to Pakistani farmers (zamindars/kisaan).
- Where technical agricultural terms, pesticide chemicals, or seed varieties are mentioned, include the common local Pakistani market name alongside in parentheses (e.g. "DAP / ڈی اے پی", "Urea / یوریا", "Kisan Card / کسان کارڈ", "Pesticide Spray / کیڑے مار اسپرے").
- Structure responses clearly with bullet points, actionable steps, and dosage warnings.`;
}

// 1. Farmer Assistant: Ask an Agricultural Question
farmerRouter.post('/api/farmer/ask', async (req: Request, res: Response) => {
  const { question, crop, province, season, language = 'ur' } = req.body;
  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'Agricultural question is required.' });
  }

  const ai = getGemini();
  if (!ai) {
    return res.status(503).json({ error: 'AI_UNAVAILABLE', message: 'Gemini API not configured.' });
  }

  const systemInstruction = `You are the PakLingo Agri Advisor (کسان مشیر), an expert agricultural scientist and field advisor for Pakistani farmers.
CORE ADVISORY PRINCIPLES:
1. Provide practical, clear, actionable agricultural guidance tailored to Pakistani agro-ecological zones (Indus plains, canal-fed areas, Barani rainfed tracts, arid/coastal, Northern hills).
2. Incorporate local farming practices and current season context (Rabi vs Kharif).
3. Emphasize integrated pest management (IPM), soil health, efficient water use (drip, laser leveling, alternate furrow irrigation), and safe chemical handling.
4. If recommending pesticides or fertilizers, provide general approved active ingredients and dosages with safety warnings.
5. Emphasize: "Consult your local Agriculture Extension Officer (محکمہ زراعت توسیع) or verified field specialist before large-scale pesticide applications."
${getFarmerLanguageInstruction(language)}`;

  const prompt = `Crop: ${crop || 'General / Multi-crop'}\nProvince/Zone: ${province || 'Punjab / Sindh / KP / Balochistan'}\nSeason: ${season || 'Current Season'}\nFarmer Question: "${question}"`;

  try {
    const response = await callWithCandidateModels(
      'Farmer Ask',
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
      return res.json({ answer });
    }
    return res.status(503).json({ error: 'Unable to process farming question right now.' });
  } catch (err: any) {
    console.error('Farmer Ask Error:', err?.message || err);
    return res.status(503).json({ error: 'Unable to process farming question right now.' });
  }
});

// 2. Farmer Assistant: Disease & Crop Health Analysis (Text or Image)
farmerRouter.post('/api/farmer/disease-analysis', async (req: Request, res: Response) => {
  const { symptoms, imageBase64, mimeType, crop, plantPart, language = 'ur' } = req.body;
  if (!symptoms && !imageBase64) {
    return res.status(400).json({ error: 'Please provide symptom details or upload a crop photo.' });
  }

  const ai = getGemini();
  if (!ai) {
    return res.status(503).json({ error: 'AI_UNAVAILABLE', message: 'Gemini API not configured.' });
  }

  const systemInstruction = `You are the PakLingo Crop Disease & Plant Pathology Specialist for Pakistan.
CORE DIAGNOSTIC PRINCIPLES:
1. Carefully inspect the crop symptoms (discoloration, spots, wilting, curling, rust, smut, blight, chewing marks, whitefly honey-dew, stunting).
2. Identify likely disease or pest candidate(s) common in Pakistan (e.g. Cotton Leaf Curl Virus [CLCuV], Pink Bollworm, Wheat Rust [Yellow/Brown], Rice Blast, Citrus Canker, Sugarcane Red Rot, Tomato Early Blight).
3. If an image is provided: Examine leaf, stem, or fruit visually. If the image is blurry, partially obscured, or inconclusive, note the uncertainty clearly.
4. Provide structured, practical treatment steps:
   - Immediate cultural/mechanical control (destroying affected debris, pruning, drainage)
   - Biological / Organic remedies where feasible (neem extract, beneficial insects)
   - Chemical options (approved fungicides/insecticides with proper dilution, e.g. ml per 100L water / acre)
   - Protective gear warnings (mask, gloves, spraying downwind, not spraying during peak noon heat)
5. Conclude with:
"> Reminder: Verify severe infestations with your local district Agriculture Extension officer (زراعت توسیع) before mass chemical spraying."
${getFarmerLanguageInstruction(language)}`;

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
          text: `Crop: ${crop || 'Not specified'}\nAffected Part: ${plantPart || 'Leaves / Whole Plant'}\nFarmer Description: "${symptoms || 'Please identify the disease or pest visible on this plant and provide treatment remedies.'}"`,
        },
      ];
    } else {
      contents = `Crop: ${crop || 'Not specified'}\nAffected Part: ${plantPart || 'Leaves / Whole Plant'}\nFarmer Symptom Description:\n"""\n${symptoms}\n"""`;
    }

    const response = await callWithCandidateModels(
      'Farmer Disease Analysis',
      (modelName) =>
        ai.models.generateContent({
          model: modelName,
          contents,
          config: { systemInstruction },
        }),
      25000
    );
    const analysis = response.text || '';
    if (analysis) {
      return res.json({ analysis });
    }
    return res.status(503).json({ error: 'Unable to analyze crop health right now.' });
  } catch (err: any) {
    console.error('Farmer Disease Analysis Error:', err?.message || err);
    return res.status(503).json({ error: 'Unable to analyze crop health right now.' });
  }
});

// 3. Farmer Assistant: Crop Care Guide
farmerRouter.post('/api/farmer/crop-care', async (req: Request, res: Response) => {
  const { crop, stage, province, soilType, language = 'ur' } = req.body;
  if (!crop || typeof crop !== 'string') {
    return res.status(400).json({ error: 'Crop name is required.' });
  }

  const ai = getGemini();
  if (!ai) {
    return res.status(503).json({ error: 'AI_UNAVAILABLE', message: 'Gemini API not configured.' });
  }

  const systemInstruction = `You are the PakLingo Agronomy Specialist for Pakistani crops.
Produce a comprehensive, step-by-step crop care guide for the specified growth stage:
1. **Stage Overview**: What the plant is doing at this stage (e.g. Germination, Tillering, Vegetative, Flowering/Booting, Grain Filling, Maturity/Harvest).
2. **Irrigation Schedule**: Water requirements, sensitive critical periods (e.g. crown root initiation in wheat, flowering in cotton), canal vs tube-well considerations.
3. **Nutrient Management**: Recommended fertilizer split doses for this stage (Urea, DAP, Potash, Zinc, Boron).
4. **Weed & Pest Watch**: Crucial weeds or pests to scout for right now.
5. **Weather Hazards**: Protection against high winds, heat spells, frost, or waterlogging.
${getFarmerLanguageInstruction(language)}`;

  const prompt = `Crop: ${crop}\nGrowth Stage: ${stage || 'Full Season Overview'}\nProvince: ${province || 'Punjab / Sindh / KP / Balochistan'}\nSoil Type: ${soilType || 'Loam / Sandy Loam'}`;

  try {
    const response = await callWithCandidateModels(
      'Farmer Crop Care',
      (modelName) =>
        ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: { systemInstruction },
        }),
      22000
    );
    const careGuide = response.text || '';
    if (careGuide) {
      return res.json({ careGuide });
    }
    return res.status(503).json({ error: 'Unable to generate crop care guide right now.' });
  } catch (err: any) {
    console.error('Crop Care Error:', err?.message || err);
    return res.status(503).json({ error: 'Unable to generate crop care guide right now.' });
  }
});

// 4. Farmer Assistant: Pest Information
farmerRouter.post('/api/farmer/pest-info', async (req: Request, res: Response) => {
  const { pestName, crop, language = 'ur' } = req.body;
  if (!pestName || typeof pestName !== 'string') {
    return res.status(400).json({ error: 'Pest name is required.' });
  }

  const ai = getGemini();
  if (!ai) {
    return res.status(503).json({ error: 'AI_UNAVAILABLE', message: 'Gemini API not configured.' });
  }

  const systemInstruction = `You are the PakLingo Agricultural Entomologist for Pakistani field and horticultural crops.
Provide a clear pest management profile:
1. **Identification**: How to recognize the pest (nymph, adult, damage pattern on leaves/bolls/roots).
2. **Economic Threshold Level (ETL)**: When spraying is actually warranted vs when natural predators can handle it.
3. **Cultural & Mechanical Control**: Light traps, yellow sticky cards, pheromone traps, removing alternate weed hosts.
4. **Chemical Control**: Recommended safe chemical options, effective spray timing (early morning or late evening), and resistance management (rotating chemistries).
5. **Safety Measures**: Operator safety during spraying.
${getFarmerLanguageInstruction(language)}`;

  const prompt = `Pest: "${pestName}"\nAffected Crop: "${crop || 'General'}"`;

  try {
    const response = await callWithCandidateModels(
      'Farmer Pest Info',
      (modelName) =>
        ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: { systemInstruction },
        }),
      22000
    );
    const pestInfo = response.text || '';
    if (pestInfo) {
      return res.json({ pestInfo });
    }
    return res.status(503).json({ error: 'Unable to fetch pest information right now.' });
  } catch (err: any) {
    console.error('Pest Info Error:', err?.message || err);
    return res.status(503).json({ error: 'Unable to fetch pest information right now.' });
  }
});

// 5. Farmer Assistant: Fertilizer Calculator & Guidance
farmerRouter.post('/api/farmer/fertilizer', async (req: Request, res: Response) => {
  const { crop, acreage = 1, soilType, previousCrop, budget, language = 'ur' } = req.body;
  if (!crop || typeof crop !== 'string') {
    return res.status(400).json({ error: 'Crop name is required.' });
  }

  const ai = getGemini();
  if (!ai) {
    return res.status(503).json({ error: 'AI_UNAVAILABLE', message: 'Gemini API not configured.' });
  }

  const systemInstruction = `You are the PakLingo Soil Fertility & Fertilizer Specialist for Pakistan.
Calculate and explain a balanced fertilizer plan for the given acreage in Pakistan:
1. **Estimated Bag Count per Acre**:
   - DAP (50 kg bags) at sowing
   - Urea (50 kg bags) split into recommended timings (1st water, 2nd water)
   - Potash (SOP / MOP) for disease resistance and grain size
   - Micronutrients (Zinc Sulphate 33% or 21%, Boron)
2. **Timing of Application**: Exact growth stage for each application.
3. **Efficiency Advice**: How to prevent nitrogen volatilization/loss (irrigation immediately after broadcast, deep banding of phosphorus).
4. **Organic & Bio-fertilizer Integration**: Farmyard manure (FYM), green manuring, humic acid to reduce synthetic costs.
5. Approximate market guidance (noting prices fluctuate per season).
${getFarmerLanguageInstruction(language)}`;

  const prompt = `Crop: ${crop}\nTotal Area: ${acreage} Acre(s)\nSoil Type: ${soilType || 'Medium Loam'}\nPrevious Crop: ${previousCrop || 'Fallow / Wheat'}\nBudget Consideration: ${budget || 'Standard'}`;

  try {
    const response = await callWithCandidateModels(
      'Farmer Fertilizer',
      (modelName) =>
        ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: { systemInstruction },
        }),
      22000
    );
    const plan = response.text || '';
    if (plan) {
      return res.json({ plan });
    }
    return res.status(503).json({ error: 'Unable to calculate fertilizer plan right now.' });
  } catch (err: any) {
    console.error('Fertilizer Error:', err?.message || err);
    return res.status(503).json({ error: 'Unable to calculate fertilizer plan right now.' });
  }
});

// 6. Farmer Assistant: Weather-based Farm Guidance
farmerRouter.post('/api/farmer/weather-guidance', async (req: Request, res: Response) => {
  const { city, crop, forecastNotes, language = 'ur' } = req.body;
  if (!city || typeof city !== 'string') {
    return res.status(400).json({ error: 'City or district is required.' });
  }

  const ai = getGemini();
  if (!ai) {
    return res.status(503).json({ error: 'AI_UNAVAILABLE', message: 'Gemini API not configured.' });
  }

  const systemInstruction = `You are the PakLingo Agro-Meteorology Specialist for Pakistan.
Provide actionable farm operations advice based on current seasonal patterns and weather considerations:
1. **Irrigation Advisory**: Whether to irrigate or hold back based on rain / canal roster.
2. **Spraying Conditions**: Wind speed guidelines (do not spray if wind > 10-12 km/h), rain wash-off warnings.
3. **Harvesting & Post-Harvest Drying**: Safe threshing and storage precautions (protecting grain from moisture to avoid aflatoxin).
4. **Extreme Weather Preparedness**: Heatwaves (Hawa-e-Loo), frost (Pala) in winter, localized hail or waterlogging.
${getFarmerLanguageInstruction(language)}`;

  const prompt = `District/City: ${city}\nCrop of Interest: ${crop || 'Major Crops in District'}\nReported Conditions: "${forecastNotes || 'General seasonal forecast'}"`;

  try {
    const response = await callWithCandidateModels(
      'Farmer Weather',
      (modelName) =>
        ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: { systemInstruction },
        }),
      20000
    );
    const guidance = response.text || '';
    if (guidance) {
      return res.json({ guidance });
    }
    return res.status(503).json({ error: 'Unable to provide weather guidance right now.' });
  } catch (err: any) {
    console.error('Weather Guidance Error:', err?.message || err);
    return res.status(503).json({ error: 'Unable to provide weather guidance right now.' });
  }
});

// 7. Farmer Assistant: Government Schemes & Subsidies
farmerRouter.post('/api/farmer/schemes', async (req: Request, res: Response) => {
  const { province, query, language = 'ur' } = req.body;

  const ai = getGemini();
  if (!ai) {
    return res.status(503).json({ error: 'AI_UNAVAILABLE', message: 'Gemini API not configured.' });
  }

  const systemInstruction = `You are the PakLingo Agri-Finance & Public Schemes Specialist for Pakistani farmers.
Provide verified educational details about government farmer initiatives and subsidies in Pakistan:
1. **Key Active Programs**:
   - Punjab Kisan Card / Chief Minister Kisan Card (interest-free production loans up to Rs 150,000 via digital wallet)
   - Green Tractor Scheme (subsidized tractors)
   - Solar Tube-well Conversion Programs (subsidy models)
   - Certified Seed & Fertilizer Subsidies (scratch card schemes via 8070 / Agriculture departments)
   - Sindh Hari Card / Farmers Welfare initiatives
   - ZTBL (Zarai Taraqiati Bank Limited) Agricultural Credit & passbook loans
2. **Eligibility Criteria**: Land ownership (fard) vs tenant (muzara) verification, CNIC registration in Land Records.
3. **Application Steps**: Where to register (Khidmat Markaz, Agriculture Extension Office, online portals).
4. **Fraud Alert**: Warn farmers NEVER to pay private middle-men or fake agents for government subsidies.
${getFarmerLanguageInstruction(language)}`;

  const prompt = `Province: ${province || 'Punjab / Sindh / KP / Balochistan'}\nSpecific Question: "${query || 'Overview of current official agricultural subsidies and Kisan Card'}"`;

  try {
    const response = await callWithCandidateModels(
      'Farmer Schemes',
      (modelName) =>
        ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: { systemInstruction },
        }),
      22000
    );
    const schemesInfo = response.text || '';
    if (schemesInfo) {
      return res.json({ schemesInfo });
    }
    return res.status(503).json({ error: 'Unable to fetch schemes information right now.' });
  } catch (err: any) {
    console.error('Schemes Error:', err?.message || err);
    return res.status(503).json({ error: 'Unable to fetch schemes information right now.' });
  }
});

// 8. Farmer Assistant: Mandi & Market Intelligence
farmerRouter.post('/api/farmer/market-info', async (req: Request, res: Response) => {
  const { crop, mandi, province, language = 'ur' } = req.body;
  if (!crop || typeof crop !== 'string') {
    return res.status(400).json({ error: 'Crop name is required.' });
  }

  const ai = getGemini();
  if (!ai) {
    return res.status(503).json({ error: 'AI_UNAVAILABLE', message: 'Gemini API not configured.' });
  }

  const systemInstruction = `You are the PakLingo Agricultural Economics & Mandi Specialist for Pakistan.
Provide market intelligence and value-realization guidance:
1. **Pricing Factors**: How moisture content, impurities/foreign matter, grain color, and grading determine price per Maund (40 kg).
2. **Government Support Price**: Mention official support price mechanisms (e.g. Wheat minimum support price, Sugarcane indicative price) where set by federal/provincial governments.
3. **Mandi Operations**: Understanding Arthi / commission agents, toll taxes, official market committee rates (Qeemat Punjab app / market committee boards).
4. **Post-Harvest Storage Strategy**: When to sell immediately vs when hermetic bags/silos make economic sense.
5. **Direct Selling Opportunities**: Selling directly to flour mills, ginners, or modern retail to bypass middle-man margins.
${getFarmerLanguageInstruction(language)}`;

  const prompt = `Crop: ${crop}\nMandi / District: ${mandi || 'Major Punjab / Sindh grain markets'}\nProvince: ${province || 'Pakistan'}`;

  try {
    const response = await callWithCandidateModels(
      'Farmer Mandi',
      (modelName) =>
        ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: { systemInstruction },
        }),
      20000
    );
    const marketGuidance = response.text || '';
    if (marketGuidance) {
      return res.json({ marketGuidance });
    }
    return res.status(503).json({ error: 'Unable to fetch market guidance right now.' });
  } catch (err: any) {
    console.error('Mandi Error:', err?.message || err);
    return res.status(503).json({ error: 'Unable to fetch market guidance right now.' });
  }
});

// Backward-compatible query endpoint
farmerRouter.post('/api/farmer/advisory', async (req: Request, res: Response) => {
  const { query, language = 'ur' } = req.body;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Advisory query is required.' });
  }

  const ai = getGemini();
  if (!ai) {
    return res.status(503).json({ error: 'AI_UNAVAILABLE', message: 'Gemini API not configured.' });
  }

  const systemInstruction = `You are the PakLingo Agri Advisor (کسان مشیر), providing expert farming and agricultural advice for Pakistani farmers.
Provide actionable guidance on crops (wheat, cotton, rice, sugarcane, maize, vegetables), seasonal care, fertilizers, integrated pest management, and water conservation in Pakistan.
${getFarmerLanguageInstruction(language)}`;

  const prompt = `Farmer Question: "${query}"`;

  try {
    const response = await callWithCandidateModels(
      'Farmer Advisory',
      (modelName) =>
        ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: { systemInstruction },
        }),
      20000
    );
    const advice = response.text || '';
    if (advice) {
      return res.json({ advice });
    }
    return res.status(503).json({ error: 'Unable to process farming advisory right now.' });
  } catch (err: any) {
    return res.status(503).json({ error: 'Unable to process farming advisory right now.' });
  }
});
