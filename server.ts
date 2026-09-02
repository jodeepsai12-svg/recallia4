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

const NE_LANGUAGES_INFO = `
Supported North-Eastern Indian Languages & Dialects in Recallia:
1. Assamese (অসমীয়া) [code: 'as', BCP-47: 'as-IN', Assam]
2. Nyishi [code: 'nyi', BCP-47: 'njz-IN', Arunachal Pradesh]
3. Meitei / Manipuri (ꯃꯤꯇꯩ ꯂꯣꯟ / মৈতৈলোন্) [code: 'mni', BCP-47: 'mni-Mtei', Manipur]
4. Khasi [code: 'kha', BCP-47: 'kha-IN', Meghalaya]
5. Mizo (Mizo ṭawng) [code: 'lus', BCP-47: 'lus-IN', Mizoram]
6. Ao (Ao Naga) [code: 'ao', BCP-47: 'njo-IN', Nagaland]
7. Nepali (नेपाली) [code: 'ne', BCP-47: 'ne-NP', Sikkim]
8. Kokborok (ককবরক) [code: 'kok', BCP-47: 'trp-IN', Tripura]
9. English [code: 'en', BCP-47: 'en-US', General]
`;

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

    // Fallback response generator if Gemini key is missing or call fails
    const createFallbackResponse = (userText: string, currentLang: string) => {
      const lower = userText.toLowerCase();
      let detectedLang = currentLang;
      let reply = '';
      let suggestedAction: string | null = null;

      if (lower.includes('my memories') || lower.includes('personal memory') || lower.includes('personal memories') || lower.includes('স্মৃতি') || lower.includes('यादहरू')) {
        suggestedAction = 'play_my_memories';
      } else if (lower.includes('picture') || lower.includes('photo') || lower.includes('ছৱি') || lower.includes('तस्बिर')) {
        suggestedAction = 'play_picture_recall';
      } else if (lower.includes('sequence') || lower.includes('order') || lower.includes('ক্ৰম') || lower.includes('क्रम')) {
        suggestedAction = 'play_sequence_memory';
      } else if (lower.includes('object') || lower.includes('word') || lower.includes('বস্তু') || lower.includes('शब्द')) {
        suggestedAction = 'play_object_association';
      } else if (lower.includes('story') || lower.includes('সাধু') || lower.includes('कथा') || lower.includes('thawnthu')) {
        suggestedAction = 'play_story_recall';
      } else if (lower.includes('caregiver') || lower.includes('report') || lower.includes('অভিভাৱক') || lower.includes('हेरचाह')) {
        suggestedAction = 'open_caregiver';
      } else if (lower.includes('nepali') || lower.includes('नेपाली')) {
        suggestedAction = 'change_lang_ne';
        detectedLang = 'ne';
      } else if (lower.includes('assamese') || lower.includes('অসমীয়া')) {
        suggestedAction = 'change_lang_as';
        detectedLang = 'as';
      }

      // Greetings and general guidance in current language
      switch (detectedLang) {
        case 'as':
          reply = suggestedAction
            ? 'মই আপোনাক সহায় কৰিবলৈ সাজু আছোঁ। আহক আমি কাৰ্যকলাপ আৰম্ভ কৰোঁ।'
            : 'নমস্কাৰ! মই আপোনাৰ ৰিকলিয়া ভয়েচ সহায়ক। আপুনি আজি কি খেল খেলিব বিচাৰে—ছৱি মনত ৰখা, ক্ৰম স্মৃতি, শব্দ সম্পৰ্ক, নে সাধু পঢ়া?';
          break;
        case 'ne':
          reply = suggestedAction
            ? 'म तपाईंलाई मद्दत गर्न तयार छु। आउनुहोस् गतिविधि सुरु गरौं।'
            : 'नमस्ते! म तपाईंको रिकलिया भ्वाइस सहायक हुँ। आज तपाईं कुन अभ्यास गर्न चाहनुहुन्छ?';
          break;
        case 'mni':
          reply = 'ꯈꯨꯔꯨꯝꯖꯔꯤ! ꯑꯩꯍꯥꯛ ꯔꯤꯀꯣꯂꯤꯌꯥ ꯚꯣꯏꯁ ꯑꯦꯁꯤꯁꯇꯦꯟꯇꯅꯤ꯫ ꯅꯈꯣꯏꯅꯥ ꯑꯍꯨꯝꯊꯣꯛꯄꯥ ꯊꯕꯛ ꯇꯧꯕꯥ ꯄꯥꯝꯕ꯭ꯔꯥ?';
          break;
        case 'lus':
          reply = 'Chibai! Recallia Voice Assistant ka ni e. Vawiin ah eng game nge kan khelh ang?';
          break;
        case 'kha':
          reply = 'Khublei! Nga dei ka Voice Assistant jong ka Recallia. Kiei kiba phi kwah ban leh mynta ka sngi?';
          break;
        case 'kok':
          reply = 'Khulumkha! Ang Recallia Voice Assistant. Tini nung bahno activity khlai no manai?';
          break;
        case 'nyi':
          reply = 'Aying! Ngo Recallia Voice Assistant. Ngo no haam nyir gam kumtolo?';
          break;
        case 'ao':
          reply = 'Salam! Ni Recallia Voice Assistant. Tanü na kechi asaya asayatsü memelunger?';
          break;
        default:
          reply = suggestedAction
            ? "I'm ready to help you with that. Let's proceed with your activity."
            : "Hello! I am your Recallia Voice Assistant. How can I guide you today? You can ask me to start any cognitive activity, explain game rules, or open your caregiver progress report.";
      }

      return {
        reply,
        detectedLanguage: detectedLang,
        action: suggestedAction,
        spokenScript: reply,
      };
    };

    // Check user intent for quick actions
    const lowerMessage = message.toLowerCase();
    let detectedAction: string | null = null;
    let detectedLang = selectedLanguage;

    if (lowerMessage.includes('my memories') || lowerMessage.includes('personal memory') || lowerMessage.includes('personal memories') || lowerMessage.includes('স্মৃতি') || lowerMessage.includes('यादहरू')) {
      detectedAction = 'play_my_memories';
    } else if (lowerMessage.includes('picture') || lowerMessage.includes('photo') || lowerMessage.includes('ছৱি') || lowerMessage.includes('तस्बिर')) {
      detectedAction = 'play_picture_recall';
    } else if (lowerMessage.includes('sequence') || lowerMessage.includes('order') || lowerMessage.includes('ক্ৰম') || lowerMessage.includes('क्रम')) {
      detectedAction = 'play_sequence_memory';
    } else if (lowerMessage.includes('object') || lowerMessage.includes('word') || lowerMessage.includes('বস্তু') || lowerMessage.includes('शब्द')) {
      detectedAction = 'play_object_association';
    } else if (lowerMessage.includes('story') || lowerMessage.includes('সাধু') || lowerMessage.includes('कथा') || lowerMessage.includes('thawnthu')) {
      detectedAction = 'play_story_recall';
    } else if (lowerMessage.includes('caregiver') || lowerMessage.includes('report') || lowerMessage.includes('অভিভাৱক') || lowerMessage.includes('हेरचाह')) {
      detectedAction = 'open_caregiver';
    } else if (lowerMessage.includes('nepali') || lowerMessage.includes('नेपाली')) {
      detectedAction = 'change_lang_ne';
      detectedLang = 'ne';
    } else if (lowerMessage.includes('assamese') || lowerMessage.includes('অসমীয়া')) {
      detectedAction = 'change_lang_as';
      detectedLang = 'as';
    }

    if (!ai) {
      const fallback = createFallbackResponse(message, selectedLanguage);
      sendEvent({ text: fallback.reply, action: fallback.action, detectedLanguage: fallback.detectedLanguage, done: true });
      res.end();
      return;
    }

    const systemInstruction = `
You are Recallia AI, an advanced, deeply compassionate, highly capable conversational AI companion powered by Google Gemini. You are integrated into Recallia, a cognitive wellness web platform designed for elderly users and their families in North-Eastern India and beyond.

${NE_LANGUAGES_INFO}

YOUR CAPABILITIES AS A GEN-AI COMPANION (Like ChatGPT / Gemini):
1. GENERAL KNOWLEDGE & CONVERSATION:
   - You can answer ANY question the user asks: science, daily life, history, cooking, gentle exercise, healthy habits, brain wellness, weather, nature, plants, traditional folklore, and pleasant friendly conversation.
   - You are a warm, polite, and patient companion who speaks with elder-friendly respect and positivity.

2. NORTH-EASTERN INDIA CULTURAL & LINGUISTIC EXPERTISE:
   - You understand and can naturally converse in 8 North-Eastern Indian languages (Assamese, Nyishi, Meitei/Manipuri, Khasi, Mizo, Ao, Nepali, Kokborok) as well as English.
   - You know soothing folk tales, festivals (Bihu, Losar, Chapchar Kut, Wangala, Hornbill, Nongkrem, etc.), tea gardens, hills, traditional crafts, and peaceful regional stories.
   - Always detect the language of the user's message and respond in that EXACT same language with correct native script or orthography. If not specified, use the user's active language (${selectedLanguage}).

3. COGNITIVE WELLNESS & RECALLIA GUIDE:
   - If asked about memory, brain wellness, daily tips, or the app:
     * Picture Recall (visual memory of everyday items like tea kettle, bell, lantern, spectacles)
     * Sequence Memory (glowing colored tile patterns)
     * Object Association (verbal & conceptual pairing)
     * Story Recall (peaceful short stories and questions)
     * My Memories (gentle personal memories recall with familiar family names, places, and objects)
     * Caregiver Portal (non-diagnostic wellness trends and reports)
   - You provide gentle encouragement. You never make intimidating clinical claims or medical diagnoses.

FORMATTING & STYLE:
- Respond DIRECTLY in conversational natural text (do NOT wrap in JSON, do NOT use code fences).
- Format answers clearly with short, easy-to-read sentences or clean bullet points so elderly readers can digest them easily.
- Keep tone warm, encouraging, soothing, and clear.
`;

    // Construct conversation history
    const conversationHistory = history
      .map((item: { role: string; content: string }) => `${item.role === 'user' ? 'User' : 'Assistant'}: ${item.content}`)
      .join('\n');

    const prompt = conversationHistory
      ? `Recent Conversation:\n${conversationHistory}\n\nUser: ${message}`
      : message;

    // Stream with fast Gemini Flash models
    const modelsToTry = ['gemini-3.7-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest'];
    let streamedSuccessfully = false;

    for (const modelName of modelsToTry) {
      try {
        const streamPromise = ai.models.generateContentStream({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction,
            temperature: 0.4,
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
              temperature: 0.4,
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

    // Send final completion event with action and language metadata
    sendEvent({
      done: true,
      action: detectedAction,
      detectedLanguage: detectedLang,
    });
    res.end();
  } catch (error: unknown) {
    console.error('Error in /api/assistant/chat (gracefully recovering with fallback):', error);
    const { selectedLanguage = 'en' } = req.body || {};
    const fallbackText = selectedLanguage === 'as'
      ? 'নমস্কাৰ! মই আপোনাৰ ৰিকলিয়া ভয়েচ সহায়ক। মই আপোনাক সহায় কৰিবলৈ সাজু আছোঁ।'
      : selectedLanguage === 'ne'
      ? 'नमस्ते! म तपाईंको रिकलिया भ्वाइस सहायक हुँ। म तपाईंलाई मद्दत गर्न तयार छु।'
      : "Hello! I am your Recallia Voice Companion. I am here to guide and practice gentle memory activities with you.";

    sendEvent({
      text: fallbackText,
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
