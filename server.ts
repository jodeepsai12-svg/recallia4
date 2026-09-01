import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

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
    timestamp: new Date().toISOString(),
  });
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
  try {
    const { message, selectedLanguage = 'en', history = [], screenContext = {} } = req.body;

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const ai = getGenAI();

    // Fallback response generator if Gemini key is missing or call fails
    const createFallbackResponse = (userText: string, currentLang: string) => {
      const lower = userText.toLowerCase();
      let detectedLang = currentLang;
      let reply = '';
      let suggestedAction: string | null = null;

      if (lower.includes('picture') || lower.includes('photo') || lower.includes('ছৱি') || lower.includes('तस्बिर')) {
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

    if (!ai) {
      const fallback = createFallbackResponse(message, selectedLanguage);
      res.json(fallback);
      return;
    }

    const systemInstruction = `
You are Recallia AI, an advanced, deeply compassionate, highly capable conversational AI companion powered by Google Gemini (similar to Gemini and ChatGPT). You are integrated into Recallia, a cognitive wellness web platform designed for elderly users and their families in North-Eastern India and beyond.

${NE_LANGUAGES_INFO}

YOUR CAPABILITIES AS A GEN-AI COMPANION (Like ChatGPT / Gemini):
1. GENERAL KNOWLEDGE & CONVERSATION:
   - You can answer ANY question the user asks: science, daily life, history, cooking, gentle exercise, healthy habits, weather, nature, plants, traditional folklore, and pleasant friendly conversation.
   - You are a warm, polite, and patient companion who speaks with elder-friendly respect and positivity.

2. NORTH-EASTERN INDIA CULTURAL & LINGUISTIC EXPERTISE:
   - You understand and can naturally converse in 8 North-Eastern Indian languages (Assamese, Nyishi, Meitei/Manipuri, Khasi, Mizo, Ao, Nepali, Kokborok) as well as English.
   - You know soothing folk tales, festivals (Bihu, Losar, Chapchar Kut, Wangala, Hornbill, Nongkrem, etc.), tea gardens, hills, traditional crafts, and peaceful regional stories.
   - Always detect the language of the user's message and respond in that EXACT same language with correct native script or orthography. If not specified, use the user's active language (${selectedLanguage}).

3. COGNITIVE WELLNESS & RECALLIA GUIDE:
   - If asked about memory, brain wellness, or the app:
     * Picture Recall (visual memory of everyday items like tea kettle, bell, lantern, spectacles)
     * Sequence Memory (glowing colored tile patterns)
     * Object Association (verbal & conceptual pairing)
     * Story Recall (peaceful short stories and questions)
     * Caregiver Portal (non-diagnostic wellness trends and reports)
   - You provide gentle encouragement. You never make intimidating clinical claims or medical diagnoses.

4. STRUCTURED IN-APP ACTIONS:
   If the user asks to start a game or perform an in-app action, set the "action" field:
   - "play_picture_recall"
   - "play_sequence_memory"
   - "play_object_association"
   - "play_story_recall"
   - "open_caregiver"
   - "open_settings"
   - "change_lang_as" | "change_lang_nyi" | "change_lang_mni" | "change_lang_kha" | "change_lang_lus" | "change_lang_ao" | "change_lang_ne" | "change_lang_kok" | "change_lang_en"
   - null (if it is general conversation or advice)

FORMATTING & VOICE:
- Structure answers clearly with short, easy-to-read sentences or clean bullet points so elderly readers can digest them easily.
- Provide a clean "spokenScript" (plain text suitable for Text-to-Speech audio readout).

OUTPUT FORMAT:
Respond strictly in valid JSON matching this schema:
{
  "reply": "Rich, formatted conversational answer in detected language",
  "detectedLanguage": "one of: 'as' | 'nyi' | 'mni' | 'kha' | 'lus' | 'ao' | 'ne' | 'kok' | 'en'",
  "action": "action_code_string or null",
  "spokenScript": "Clean plain text version for voice synthesis (no asterisks or special markdown)"
}
`;

    // Construct conversation history
    const conversationHistory = history.map((item: { role: string; content: string }) => `${item.role === 'user' ? 'User' : 'Assistant'}: ${item.content}`).join('\n');

    const prompt = `
${conversationHistory ? `Recent Conversation:\n${conversationHistory}\n` : ''}
Current User Message: "${message}"

Respond with JSON only.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.4,
      },
    });

    const responseText = response.text ? response.text.trim() : '';
    try {
      const parsed = JSON.parse(responseText);
      res.json({
        reply: parsed.reply || "I'm here to help you with your daily cognitive exercises.",
        detectedLanguage: parsed.detectedLanguage || selectedLanguage,
        action: parsed.action || null,
        spokenScript: parsed.spokenScript || parsed.reply || '',
      });
    } catch {
      res.json(createFallbackResponse(message, selectedLanguage));
    }
  } catch (error: unknown) {
    console.error('Error in /api/assistant/chat:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: 'Failed to process voice assistant request',
      details: errorMessage,
    });
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
