import { Router, Request, Response } from 'express';
import { Modality } from '@google/genai';
import { getGemini, callGeminiWithTimeout, isQuotaExhaustedError } from '../geminiService.js';

export const ttsRouter = Router();

// Helper: Convert 16-bit linear PCM buffer to standard WAV format
export function pcmToWav(pcmBuffer: Buffer, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Buffer {
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmBuffer.length;
  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // Linear PCM
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}

// In-memory cache for synthesized audio to prevent duplicate API calls and preserve rate limits
const ttsAudioCache = new Map<string, { audioBase64: string; mimeType: string; timestamp: number }>();

// PakLingo AI Text-to-Speech Engine Status & Voices
ttsRouter.get('/api/tts/status', (req: Request, res: Response) => {
  const hasKey = !!process.env.GEMINI_API_KEY;
  res.json({
    geminiTTSAvailable: hasKey,
    hasGeminiKey: hasKey,
    voices: [
      { id: 'Kore', name: 'Kore (Natural & Clear - Recommended)', gender: 'Female' },
      { id: 'Zephyr', name: 'Zephyr (Warm & Expressive)', gender: 'Female' },
      { id: 'Puck', name: 'Puck (Friendly & Engaging)', gender: 'Male' },
      { id: 'Fenrir', name: 'Fenrir (Deep & Professional)', gender: 'Male' },
      { id: 'Charon', name: 'Charon (Calm & Informative)', gender: 'Male' },
    ],
  });
});

// PakLingo AI Text-to-Speech Generation Endpoint
ttsRouter.post('/api/tts', async (req: Request, res: Response) => {
  const { text, language = 'ur', voice = 'Kore' } = req.body;
  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Text is required for TTS synthesis.' });
  }

  const trimmedText = text.trim();
  // Safe limit per synthesis chunk
  const safeText = trimmedText.slice(0, 1200);

  const cacheKey = `${language}_${voice}_${safeText}`;
  const cached = ttsAudioCache.get(cacheKey);
  if (cached) {
    return res.json({
      success: true,
      audioBase64: cached.audioBase64,
      mimeType: cached.mimeType,
      provider: 'gemini-tts-cached',
      language,
      voice,
    });
  }

  const ai = getGemini();
  if (!ai) {
    return res.status(503).json({
      success: false,
      error: 'AI_UNAVAILABLE',
      message: 'Gemini API not configured. Falling back to browser speech synthesis.',
      fallbackToBrowser: true,
    });
  }

  const validVoices = ['Kore', 'Zephyr', 'Puck', 'Fenrir', 'Charon'];
  const chosenVoice = validVoices.includes(voice) ? voice : 'Kore';

  try {
    const response = await callGeminiWithTimeout(
      ai.models.generateContent({
        model: 'gemini-3.1-flash-tts-preview',
        contents: [{ parts: [{ text: safeText }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: chosenVoice },
            },
          },
        },
      }),
      22000
    );

    const inlineData = response?.candidates?.[0]?.content?.parts?.[0]?.inlineData;
    if (!inlineData?.data) {
      return res.status(503).json({
        success: false,
        error: 'NO_AUDIO_GENERATED',
        message: 'No audio data returned by TTS model.',
        fallbackToBrowser: true,
      });
    }

    const rawPcm = Buffer.from(inlineData.data, 'base64');
    const wavBuffer = pcmToWav(rawPcm, 24000, 1, 16);
    const audioBase64 = wavBuffer.toString('base64');
    const mimeType = 'audio/wav';

    if (ttsAudioCache.size > 200) {
      const oldestKey = ttsAudioCache.keys().next().value;
      if (oldestKey) ttsAudioCache.delete(oldestKey);
    }
    ttsAudioCache.set(cacheKey, { audioBase64, mimeType, timestamp: Date.now() });

    return res.json({
      success: true,
      audioBase64,
      mimeType,
      provider: 'gemini-tts',
      language,
      voice: chosenVoice,
    });
  } catch (err: any) {
    console.error('Gemini TTS error:', err?.message || err);
    const isQuota = isQuotaExhaustedError(err);
    return res.status(isQuota ? 429 : 503).json({
      success: false,
      error: isQuota ? 'QUOTA_EXHAUSTED' : 'TTS_SERVICE_ERROR',
      message: isQuota
        ? 'Gemini TTS rate limit reached. Falling back to local speech synthesis.'
        : 'Gemini TTS temporarily unavailable. Falling back to local speech synthesis.',
      fallbackToBrowser: true,
    });
  }
});
