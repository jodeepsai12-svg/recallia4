import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import twilio from 'twilio';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Lazy initialization of Twilio client
let twilioClient: twilio.Twilio | null = null;
function getTwilio(): twilio.Twilio | null {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) {
    return null;
  }
  if (!twilioClient) {
    twilioClient = twilio(accountSid, authToken);
  }
  return twilioClient;
}

// Lazy initialization of Gemini client
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY environment variable is not set. AI features will use rule-based fallback responses.');
    return null;
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    hasTwilioKey: Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
    timestamp: new Date().toISOString(),
  });
});

// Emergency SMS Dispatch Endpoint
app.post('/api/emergency/send-sms', async (req, res) => {
  try {
    const {
      toPhone,
      participantName = 'Senior Participant',
      messageText = 'Emergency assistance requested.',
      audioUrl,
      tags = [],
      alertId,
    } = req.body;

    if (!toPhone) {
      res.status(400).json({
        success: false,
        error: 'Caregiver phone number is required.',
      });
      return;
    }

    const twilio = getTwilio();
    const fromPhone = process.env.TWILIO_PHONE_NUMBER;

    const formattedMessage = `🚨 RECALLIA EMERGENCY ALERT 🚨\n\nParticipant: ${participantName}\nNeed: ${messageText}\n${
      tags.length > 0 ? `Tags: ${tags.join(', ')}\n` : ''
    }${audioUrl ? `Voice Note: ${audioUrl}\n` : ''}Time: ${new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })}\n\nPlease check the Recallia Caregiver Portal or contact your loved one immediately.`;

    if (twilio && fromPhone) {
      try {
        const twilioRes = await twilio.messages.create({
          body: formattedMessage,
          from: fromPhone,
          to: toPhone,
        });

        console.log(`[Twilio SMS] Emergency SMS dispatched successfully to ${toPhone}. SID: ${twilioRes.sid}`);
        res.json({
          success: true,
          smsDelivered: true,
          sid: twilioRes.sid,
          status: twilioRes.status,
          alertId,
        });
        return;
      } catch (twilioErr) {
        console.error('[Twilio SMS Error]:', twilioErr);
        res.json({
          success: true,
          smsDelivered: false,
          error: twilioErr instanceof Error ? twilioErr.message : 'Twilio dispatch failed',
          note: 'Alert saved in Firestore database. Live SMS delivery encountered an error.',
          alertId,
        });
        return;
      }
    }

    // Twilio credentials not configured in environment
    console.log(`[Emergency Notification] Alert for ${participantName} to ${toPhone}: ${messageText} (Twilio credentials not configured in .env)`);
    res.json({
      success: true,
      smsDelivered: false,
      note: 'Alert stored in Firebase Firestore. To enable real cellular SMS sending, configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in settings.',
      alertId,
    });
  } catch (err) {
    console.error('Error in /api/emergency/send-sms:', err);
    res.status(500).json({
      success: false,
      error: err instanceof Error ? err.message : 'Internal server error while processing emergency alert',
    });
  }
});

const LANGUAGES_CONFIG: Record<string, { name: string; nativeName: string; script: string; greeting: string; helpPrompt: string }> = {
  as: {
    name: 'Assamese',
    nativeName: 'অসমীয়া',
    script: 'Assamese script (অসমীয়া লিপি)',
    greeting: 'নমস্কাৰ! মই আপোনাৰ ৰিকলিয়া ভয়েচ সহায়ক। আপুনি আজি কি খেল খেলিব বিচাৰে—ছৱি মনত ৰখা, ক্ৰম স্মৃতি, শব্দ সম্পৰ্ক, নে সাধু পঢ়া?',
    helpPrompt: 'মই আপোনাক সহায় কৰিবলৈ সাজু আছোঁ। আহক আমি কাৰ্যকলাপ আৰম্ভ কৰোঁ।',
  },
  ne: {
    name: 'Nepali',
    nativeName: 'नेपाली',
    script: 'Devanagari script (देवनागरी लिपि)',
    greeting: 'नमस्ते! म तपाईंको रिकलिया भ्वाइस सहायक हुँ। आज तपाईं कुन अभ्यास गर्न चाहनुहुन्छ?',
    helpPrompt: 'म तपाईंलाई मद्दत गर्न तयार छु। आउनुहोस् गतिविधि सुरु गरौं।',
  },
  mni: {
    name: 'Meitei / Manipuri',
    nativeName: 'ꯃꯤꯇꯩ ꯂꯣꯟ',
    script: 'Meetei Mayek script (ꯃꯤꯇꯩ ꯃꯌꯦꯛ)',
    greeting: 'ꯈꯨꯔꯨꯝꯖꯔꯤ! ꯑꯩꯍꯥꯛ ꯔꯤꯀꯣꯂꯤꯌꯥ ꯚꯣꯏꯁ ꯑꯦꯁꯤꯁꯇꯦꯟꯇꯅꯤ꯫ ꯅꯈꯣꯏꯅꯥ ꯑꯍꯨꯝꯊꯣꯛꯄꯥ ꯊꯕꯛ ꯇꯧꯕꯥ ꯄꯥꯝꯕ꯭ꯔꯥ?',
    helpPrompt: 'ꯑꯩꯍꯥꯛ ꯅꯈꯣꯏꯕꯨ ꯃꯇꯦꯡ ꯄꯥꯡꯂꯒꯦ꯫ ꯑꯩꯈꯣꯏ ꯉꯁꯤꯒꯤ ꯊꯕꯛ ꯍꯧꯔꯁꯤ꯫',
  },
  kha: {
    name: 'Khasi',
    nativeName: 'Khasi',
    script: 'Khasi orthography',
    greeting: 'Khublei! Nga dei ka Voice Assistant jong ka Recallia. Kiei kiba phi kwah ban leh mynta ka sngi?',
    helpPrompt: 'Nga la kloi ban iarap ia phi. To ngin sdang ia ki kam kiba mynta ka sngi.',
  },
  lus: {
    name: 'Mizo',
    nativeName: 'Mizo ṭawng',
    script: 'Mizo orthography',
    greeting: 'Chibai! Recallia Voice Assistant ka ni e. Vawiin ah eng game nge kan khelh ang?',
    helpPrompt: 'Puih che ka inpeih reng e. Vawiin thluak sawizawina i ṭan ang u.',
  },
  kok: {
    name: 'Kokborok',
    nativeName: 'ককবরক',
    script: 'Kokborok script',
    greeting: 'Khulumkha! Ang Recallia Voice Assistant. Tini nung bahno activity khlai no manai?',
    helpPrompt: 'Ang nungno chubano manai. Kahmkhe tongdi, chini activity chengno.',
  },
  nyi: {
    name: 'Nyishi',
    nativeName: 'Nyishi',
    script: 'Nyishi orthography',
    greeting: 'Aying! Ngo Recallia Voice Assistant. Ngo no haam nyir gam kumtolo?',
    helpPrompt: 'Ngo no haam nyir gam kumtolo. Tani nyir gam kumtolo.',
  },
  ao: {
    name: 'Ao Naga',
    nativeName: 'Ao',
    script: 'Ao orthography',
    greeting: 'Salam! Ni Recallia Voice Assistant. Tanü na kechi asaya asayatsü memelunger?',
    helpPrompt: 'Ni ne den yariteptsü renema lir. Asaya asayatsü aitsüdi.',
  },
  en: {
    name: 'English',
    nativeName: 'English',
    script: 'English',
    greeting: 'Hello! I am your Recallia Voice Assistant. How can I guide you today? You can ask me to start any cognitive activity, explain game rules, or open your caregiver progress report.',
    helpPrompt: "I'm ready to help you with that. Let's proceed with your activity.",
  },
};

// Multilingual Conversational Voice Assistant
app.post('/api/assistant/chat', async (req, res) => {
  // Setup Server-Sent Events headers for immediate token streaming
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = (data: Record<string, unknown>) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const { message, selectedLanguage = 'en', history = [] } = req.body;

    if (!message || typeof message !== 'string') {
      sendEvent({ error: 'Message is required' });
      res.end();
      return;
    }

    const ai = getGenAI();
    const targetLang = LANGUAGES_CONFIG[selectedLanguage] || LANGUAGES_CONFIG['en'];

    // Fallback response generator in strictly the chosen language
    const createFallbackResponse = (userText: string, langCode: string) => {
      const lower = userText.toLowerCase();
      let suggestedAction: string | null = null;

      if (lower.includes('my memories') || lower.includes('personal memory') || lower.includes('personal memories') || lower.includes('স্মৃতি') || lower.includes('यादहरू')) {
        suggestedAction = 'play_my_memories';
      } else if (lower.includes('picture') || lower.includes('photo') || lower.includes('ছৱি') || lower.includes('तस्बिर') || lower.includes('dur')) {
        suggestedAction = 'play_picture_recall';
      } else if (lower.includes('sequence') || lower.includes('order') || lower.includes('ক্ৰম') || lower.includes('क्रम')) {
        suggestedAction = 'play_sequence_memory';
      } else if (lower.includes('object') || lower.includes('word') || lower.includes('বস্তু') || lower.includes('शब्द') || lower.includes('tiar')) {
        suggestedAction = 'play_object_association';
      } else if (lower.includes('story') || lower.includes('সাধু') || lower.includes('कथा') || lower.includes('thawnthu') || lower.includes('puriskam')) {
        suggestedAction = 'play_story_recall';
      } else if (lower.includes('caregiver') || lower.includes('report') || lower.includes('অভিভাৱক') || lower.includes('हेरचाह') || lower.includes('enkawltu')) {
        suggestedAction = 'open_caregiver';
      }

      const cfg = LANGUAGES_CONFIG[langCode] || LANGUAGES_CONFIG['en'];
      const reply = suggestedAction ? cfg.helpPrompt : cfg.greeting;

      return {
        reply,
        detectedLanguage: langCode,
        action: suggestedAction,
        spokenScript: reply,
      };
    };

    // Check user intent for quick actions
    const lowerMessage = message.toLowerCase();
    let detectedAction: string | null = null;

    if (lowerMessage.includes('my memories') || lowerMessage.includes('personal memory') || lowerMessage.includes('personal memories') || lowerMessage.includes('স্মৃতি') || lowerMessage.includes('यादहरू')) {
      detectedAction = 'play_my_memories';
    } else if (lowerMessage.includes('picture') || lowerMessage.includes('photo') || lowerMessage.includes('ছৱি') || lowerMessage.includes('तस्बिर') || lowerMessage.includes('dur')) {
      detectedAction = 'play_picture_recall';
    } else if (lowerMessage.includes('sequence') || lowerMessage.includes('order') || lowerMessage.includes('ক্ৰম') || lowerMessage.includes('क्रम')) {
      detectedAction = 'play_sequence_memory';
    } else if (lowerMessage.includes('object') || lowerMessage.includes('word') || lowerMessage.includes('বস্তু') || lowerMessage.includes('शब्द') || lowerMessage.includes('tiar')) {
      detectedAction = 'play_object_association';
    } else if (lowerMessage.includes('story') || lowerMessage.includes('সাধু') || lowerMessage.includes('कथा') || lowerMessage.includes('thawnthu') || lowerMessage.includes('puriskam')) {
      detectedAction = 'play_story_recall';
    } else if (lowerMessage.includes('caregiver') || lowerMessage.includes('report') || lowerMessage.includes('অভিভাৱক') || lowerMessage.includes('हेरचाह') || lowerMessage.includes('enkawltu')) {
      detectedAction = 'open_caregiver';
    }

    if (!ai) {
      const fallback = createFallbackResponse(message, selectedLanguage);
      sendEvent({ text: fallback.reply, action: fallback.action, detectedLanguage: selectedLanguage, done: true });
      res.end();
      return;
    }

    const systemInstruction = `
You are Recallia AI, a deeply compassionate, respectful, elder-friendly conversational AI companion powered by Google Gemini. You are integrated into Recallia, a cognitive wellness web platform designed for elderly users and their families in North-Eastern India.

🚨 ABSOLUTE MANDATORY DIRECTIVE — STRICT LANGUAGE ENFORCEMENT:
The user has CHOSEN the language: "${targetLang.name} (${targetLang.nativeName})", language code: "${selectedLanguage}".
1. You MUST formulate your ENTIRE response STRICTLY AND ONLY in "${targetLang.name} (${targetLang.nativeName})" using authentic ${targetLang.script}.
2. DO NOT write your response in English, Hindi, or any other language, unless the chosen language IS English.
3. Even if the user types or speaks to you in English or another language, or asks questions about words in another language, you MUST respond 100% in "${targetLang.name} (${targetLang.nativeName})".
4. Never switch languages mid-sentence or provide dual-language translations.
5. If the user asks general questions (weather, family, gardening, traditional stories, cooking, peaceful memories, cognitive health), answer completely in "${targetLang.name} (${targetLang.nativeName})".

CARE & TONE:
- Speak with warm, reassuring, gentle respect suitable for beloved grandparents and elders.
- Keep sentences clear, peaceful, and concise. Avoid dense medical jargon or scary diagnostic claims.
`;

    // Construct conversation history
    const conversationHistory = history
      .map((item: { role: string; content: string }) => `${item.role === 'user' ? 'User' : 'Assistant'}: ${item.content}`)
      .join('\n');

    const prompt = `${conversationHistory ? `Recent Conversation History:\n${conversationHistory}\n\n` : ''}User Message: ${message}\n\n[STRICT LANGUAGE DIRECTIVE: Respond completely and exclusively in ${targetLang.name} (${targetLang.nativeName}). Do not write in any other language.]`;

    // Stream with fast Gemini Flash models
    const modelsToTry = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-3.8-flash'];
    let streamedSuccessfully = false;

    for (const modelName of modelsToTry) {
      try {
        const streamPromise = ai.models.generateContentStream({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction,
            temperature: 0.3,
          },
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout on model ${modelName}`)), 6000)
        );

        const responseStream = await Promise.race([streamPromise, timeoutPromise]);

        for await (const chunk of responseStream) {
          const text = chunk.text;
          if (text) {
            streamedSuccessfully = true;
            sendEvent({ text });
          }
        }

        if (streamedSuccessfully) {
          break;
        }
      } catch (streamErr) {
        console.warn(`Model ${modelName} streaming failed, trying generateContent fallback:`, streamErr instanceof Error ? streamErr.message : streamErr);
        try {
          const genPromise = ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              systemInstruction,
              temperature: 0.3,
            },
          });
          const genTimeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout on generateContent ${modelName}`)), 4000)
          );
          const res = await Promise.race([genPromise, genTimeout]);
          if (res?.text) {
            streamedSuccessfully = true;
            sendEvent({ text: res.text.trim() });
            break;
          }
        } catch (modelErr) {
          console.warn(`Model ${modelName} call failed:`, modelErr instanceof Error ? modelErr.message : modelErr);
        }
      }
    }

    if (!streamedSuccessfully) {
      const fallback = createFallbackResponse(message, selectedLanguage);
      sendEvent({ text: fallback.reply });
      if (fallback.action && !detectedAction) {
        detectedAction = fallback.action;
      }
    }

    // Send final completion event with action and language metadata strictly matching chosen language
    sendEvent({
      done: true,
      action: detectedAction,
      detectedLanguage: selectedLanguage,
    });
    res.end();
  } catch (error: unknown) {
    console.error('Error in /api/assistant/chat (gracefully recovering with fallback):', error);
    const { selectedLanguage = 'en' } = req.body || {};
    const cfg = LANGUAGES_CONFIG[selectedLanguage] || LANGUAGES_CONFIG['en'];

    sendEvent({
      text: cfg.greeting,
      done: true,
      action: null,
      detectedLanguage: selectedLanguage,
    });
    res.end();
  }
});

// Start server with Vite middleware
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Express v5 compatible catch-all
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Recallia full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
