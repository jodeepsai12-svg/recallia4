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
    console.warn('GEMINI_API_KEY environment variable is not set.');
    return null;
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey,
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

// Real-time Indian Standard Time (IST) helper
function getIndianTimeDetails() {
  const now = new Date();

  // Format explicitly for Asia/Kolkata (IST = UTC+5:30, no DST)
  const istDateLong = now.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const istTime12 = now.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const istTimeWithSeconds = now.toLocaleTimeString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const istDayOfWeek = now.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
  });

  const istDayOfMonth = now.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
  });

  const istMonthName = now.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    month: 'long',
  });

  const istYear = now.toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
  });

  // Localized days of week for Indian languages
  const assameseDays: Record<string, string> = {
    Sunday: 'দেওবাৰ (Deobar)',
    Monday: 'সোমবাৰ (Xombar)',
    Tuesday: 'মঙলবাৰ (Mongolbar)',
    Wednesday: 'বুধবাৰ (Budhbar)',
    Thursday: 'বৃহস্পতিবাৰ (Brihospotibar)',
    Friday: 'শুকুৰবাৰ (Xukurbar)',
    Saturday: 'শনিবাৰ (Xonibar)',
  };

  const nepaliDays: Record<string, string> = {
    Sunday: 'आइतबार (Aaitabar)',
    Monday: 'सोमबार (Sombar)',
    Tuesday: 'मंगलबार (Mangalbar)',
    Wednesday: 'बुधबार (Budhabar)',
    Thursday: 'बिहीबार (Bihibar)',
    Friday: 'शुक्रबार (Shukrabar)',
    Saturday: 'शनिबार (Shanibar)',
  };

  return {
    dateLong: istDateLong,
    time12: istTime12,
    timeWithSeconds: istTimeWithSeconds,
    dayOfWeek: istDayOfWeek,
    dayOfMonth: istDayOfMonth,
    monthName: istMonthName,
    year: istYear,
    formattedDate: `${istDayOfMonth} ${istMonthName} ${istYear}`,
    asDay: assameseDays[istDayOfWeek] || istDayOfWeek,
    neDay: nepaliDays[istDayOfWeek] || istDayOfWeek,
  };
}

// Intelligent intent detector for in-app autonomous navigation actions
function detectActionFromText(text: string): string | null {
  const lower = text.toLowerCase().trim();

  // 1. Language changes
  if (lower.includes('assamese') || lower.includes('অসমীয়া')) return 'change_lang_as';
  if (lower.includes('nepali') || lower.includes('नेपाली')) return 'change_lang_ne';
  if (lower.includes('manipuri') || lower.includes('meitei') || lower.includes('মৈতৈ')) return 'change_lang_mni';
  if (lower.includes('khasi')) return 'change_lang_kha';
  if (lower.includes('mizo')) return 'change_lang_lus';
  if (lower.includes('kokborok')) return 'change_lang_kok';
  if (lower.includes('nyishi')) return 'change_lang_nyi';
  if (lower.includes('ao naga') || lower.includes('ao language')) return 'change_lang_ao';
  if (lower.includes('english') || lower.includes('speak english')) return 'change_lang_en';

  // 2. Open recommended game / general game request
  const isGeneralGameRequest =
    /(?:open|play|start|launch|recommend|suggest|run)\s+(?:a\s+|the\s+|any\s+|some\s+)?game/i.test(lower) ||
    /(?:let'?s|can we|i want to|wanna)\s+play/i.test(lower) ||
    lower === 'play' || lower === 'game' || lower === 'play game' || lower === 'start game' ||
    lower.includes('open a game') || lower.includes('play a game') || lower.includes('start a game') ||
    lower.includes('recommend a game') || lower.includes('suggest a game') || lower.includes('open game');

  // 3. Specific games
  if (lower.includes('my memories') || lower.includes('personal memory') || lower.includes('personal memories') || lower.includes('family photos') || lower.includes('স্মৃতি') || lower.includes('यादहरू')) {
    return 'play_my_memories';
  }
  if (lower.includes('picture recall') || lower.includes('picture') || lower.includes('photo') || lower.includes('ছৱি') || lower.includes('तस्बिर') || lower.includes('visual memory') || lower.includes('dur')) {
    return 'play_picture_recall';
  }
  if (lower.includes('sequence memory') || lower.includes('sequence') || lower.includes('pattern') || lower.includes('ক্ৰম') || lower.includes('क्रम')) {
    return 'play_sequence_memory';
  }
  if (lower.includes('object association') || lower.includes('object') || lower.includes('association') || lower.includes('pairing') || lower.includes('বস্তু') || lower.includes('शब्द') || lower.includes('tiar')) {
    return 'play_object_association';
  }
  if (lower.includes('story recall') || lower.includes('story') || lower.includes('folktale') || lower.includes('tale') || lower.includes('সাধু') || lower.includes('कथा') || lower.includes('thawnthu')) {
    return 'play_story_recall';
  }

  // If general game was asked, return play_recommended_game
  if (isGeneralGameRequest) {
    return 'play_recommended_game';
  }

  // 4. Caregiver / Reports
  if (lower.includes('caregiver') || lower.includes('report') || lower.includes('family portal') || lower.includes('streak') || lower.includes('progress') || lower.includes('অভিভাৱক') || lower.includes('हेरचाह') || lower.includes('enkawltu')) {
    return 'open_caregiver';
  }

  // 5. Settings
  if (lower.includes('settings') || lower.includes('setting') || lower.includes('preferences') || lower.includes('নিয়ন্ত্ৰণ') || lower.includes('सेटिङ')) {
    return 'open_settings';
  }

  // 6. Home / Dashboard
  if (lower.includes('home') || lower.includes('dashboard') || lower.includes('main menu') || lower.includes('exit game') || lower.includes('back to home') || lower.includes('go back')) {
    return 'back_to_dashboard';
  }

  // 7. Breathing / Relaxation
  if (lower.includes('breathe') || lower.includes('breathing') || lower.includes('relax') || lower.includes('calm down') || lower.includes('উশাহ') || lower.includes('साँस')) {
    return 'start_breathing';
  }

  return null;
}

// Real-time IST API endpoint for client widgets and components
app.get('/api/time/ist', (req, res) => {
  const ist = getIndianTimeDetails();
  res.json({
    ...ist,
    timezone: 'Asia/Kolkata',
    utcOffset: '+05:30',
  });
});

// Circuit-breaker for models returning 429 Resource Exhausted / Rate Limit
const modelCooldownMap = new Map<string, number>();

function isModelInCooldown(modelName: string): boolean {
  const expiry = modelCooldownMap.get(modelName);
  if (!expiry) return false;
  if (Date.now() > expiry) {
    modelCooldownMap.delete(modelName);
    return false;
  }
  return true;
}

function setModelCooldown(modelName: string, cooldownMs = 180_000): void {
  modelCooldownMap.set(modelName, Date.now() + cooldownMs);
}

// Multilingual Conversational Voice Assistant
app.post('/api/assistant/chat', async (req, res) => {
  // Setup Server-Sent Events headers for immediate token streaming with zero proxy buffering
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
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

    // Pre-detect intent for in-app actions
    let detectedAction = detectActionFromText(message);

    // Fallback response generator in case of network outages or missing keys
    const createFallbackResponse = (userText: string, langCode: string) => {
      const lower = userText.toLowerCase().trim();
      const action = detectActionFromText(userText);
      let reply = '';

      if (action === 'play_recommended_game') {
        reply = langCode === 'en'
          ? "I recommend our gentle 'Picture Recall' activity, which is wonderful for calm visual focus. Opening it for you now!"
          : (LANGUAGES_CONFIG[langCode] || LANGUAGES_CONFIG['en']).helpPrompt;
      } else if (action === 'play_picture_recall') {
        reply = langCode === 'en'
          ? "Starting 'Picture Recall' for you. Look at the serene scene, take your time, and enjoy the gentle details."
          : (LANGUAGES_CONFIG[langCode] || LANGUAGES_CONFIG['en']).helpPrompt;
      } else if (action === 'play_sequence_memory') {
        reply = langCode === 'en'
          ? "Starting 'Sequence Memory'. Watch the glowing patterns at your own relaxed pace and tap them in order."
          : (LANGUAGES_CONFIG[langCode] || LANGUAGES_CONFIG['en']).helpPrompt;
      } else if (action === 'play_object_association') {
        reply = langCode === 'en'
          ? "Starting 'Object Association'. Connect familiar everyday items together to keep your mind sharp."
          : (LANGUAGES_CONFIG[langCode] || LANGUAGES_CONFIG['en']).helpPrompt;
      } else if (action === 'play_story_recall') {
        reply = langCode === 'en'
          ? "Opening 'Story Recall'. Enjoy a peaceful traditional tale and answer gentle questions about what happened."
          : (LANGUAGES_CONFIG[langCode] || LANGUAGES_CONFIG['en']).helpPrompt;
      } else if (action === 'play_my_memories') {
        reply = langCode === 'en'
          ? "Opening your personalized 'My Memories' activity where you can revisit cherished family moments and photos."
          : (LANGUAGES_CONFIG[langCode] || LANGUAGES_CONFIG['en']).helpPrompt;
      } else if (action === 'open_caregiver') {
        reply = langCode === 'en'
          ? "Opening your Caregiver & Family portal so you or your loved ones can review your gentle activity streaks and wellness progress."
          : (LANGUAGES_CONFIG[langCode] || LANGUAGES_CONFIG['en']).helpPrompt;
      } else if (action === 'open_settings') {
        reply = langCode === 'en'
          ? "Opening your **Language and Sound Settings** now."
          : (LANGUAGES_CONFIG[langCode] || LANGUAGES_CONFIG['en']).helpPrompt;
      } else if (action === 'start_breathing') {
        reply = langCode === 'en'
          ? "Let's take a calm, peaceful moment together:\n\n- **Breathe in gently** through your nose for 4 counts.\n- **Hold softly and comfortably** for 4 counts.\n- **Breathe out slowly** through your mouth for 4 counts.\n\nYou are doing wonderfully."
          : (LANGUAGES_CONFIG[langCode] || LANGUAGES_CONFIG['en']).helpPrompt;
      } else if (action === 'back_to_dashboard') {
        reply = langCode === 'en'
          ? "Taking you back to your **Home Dashboard**."
          : (LANGUAGES_CONFIG[langCode] || LANGUAGES_CONFIG['en']).greeting;
      }

      // Check for Indian Time, Date, and Day queries
      const isTimeQuery = /(?:what(?:'s| is)? (?:the )?(?:current )?time|what time is it|time now|time in india|current time|current ist|কিমান বাজিছে|कति बज्यो|samay|समय|সময়|kya time|time please|^time$)/i.test(lower);
      const isDateQuery = /(?:what(?:'s| is)? (?:today'?s? )?date|what date is it|what date is today|date today|date in india|today'?s date|কিমান তাৰিখ|कति गते|कति मिति|tarikh|तारीख|তারিখ|date please|^date$)/i.test(lower);
      const isDayQuery = /(?:what(?:'s| is)? (?:today'?s? )?day|what day is (?:it|today)|which day is today|day today|today is what day|কি বাৰ|के बार|din hai|दिन हो|day of the week|is today (?:monday|tuesday|wednesday|thursday|friday|saturday|sunday))/i.test(lower);

      if (!reply && (isTimeQuery || isDateQuery || isDayQuery)) {
        const ist = getIndianTimeDetails();
        if (langCode === 'as') {
          if (isTimeQuery && !isDateQuery && !isDayQuery) {
            reply = `ভাৰতৰ বৰ্তমান সময় হৈছে **${ist.time12}** (Indian Standard Time, IST)।`;
          } else if (isDayQuery && !isDateQuery && !isTimeQuery) {
            reply = `আজি হৈছে **${ist.asDay}**।`;
          } else if (isDateQuery && !isTimeQuery) {
            reply = `আজিৰ তাৰিখ হৈছে **${ist.asDay}**, **${ist.dayOfMonth} ${ist.monthName} ${ist.year}**।`;
          } else {
            reply = `ভাৰতত বৰ্তমান সময় হৈছে **${ist.time12}** (IST)।\n\nআজি হৈছে **${ist.asDay}**, **${ist.dayOfMonth} ${ist.monthName} ${ist.year}**।`;
          }
        } else if (langCode === 'ne') {
          if (isTimeQuery && !isDateQuery && !isDayQuery) {
            reply = `भारतमा अहिलेको समय **${ist.time12}** (Indian Standard Time, IST) भएको छ।`;
          } else if (isDayQuery && !isDateQuery && !isTimeQuery) {
            reply = `आज **${ist.neDay}** हो।`;
          } else if (isDateQuery && !isTimeQuery) {
            reply = `आजको मिति **${ist.neDay}**, **${ist.dayOfMonth} ${ist.monthName} ${ist.year}** हो।`;
          } else {
            reply = `भारतमा अहिलेको समय **${ist.time12}** (IST) भएको छ।\n\nआज **${ist.neDay}**, **${ist.dayOfMonth} ${ist.monthName} ${ist.year}** हो।`;
          }
        } else {
          // English and other languages
          if (isTimeQuery && !isDateQuery && !isDayQuery) {
            reply = `The current time in India is **${ist.time12}** (Indian Standard Time, IST).`;
          } else if (isDayQuery && !isDateQuery && !isTimeQuery) {
            reply = `Today is **${ist.dayOfWeek}** (${ist.formattedDate}).`;
          } else if (isDateQuery && !isTimeQuery) {
            reply = `Today's date in India is **${ist.dayOfWeek}**, **${ist.formattedDate}**.`;
          } else {
            reply = `The current time in India is **${ist.time12}** (Indian Standard Time, IST).\n\nToday is **${ist.dayOfWeek}**, **${ist.formattedDate}**.`;
          }
        }
      }

      // Check for simple basic arithmetic if user asks math questions
      if (!reply) {
        const mathMatch = lower.match(/(?:what is|calculate|solve|how much is)?\s*(\d+)\s*([+\-*xX/])\s*(\d+)/);
        if (mathMatch) {
          const num1 = parseInt(mathMatch[1], 10);
          const op = mathMatch[2];
          const num2 = parseInt(mathMatch[3], 10);
          let result = 0;
          if (op === '+') result = num1 + num2;
          else if (op === '-') result = num1 - num2;
          else if (op === '*' || op === 'x' || op === 'X') result = num1 * num2;
          else if (op === '/' && num2 !== 0) result = Math.round((num1 / num2) * 100) / 100;
          reply = langCode === 'en'
            ? `The answer is **${result}**.\n\n- Calculation: **${num1} ${op} ${num2} = ${result}**`
            : `${result}`;
        }
      }

      // Check for general wellness tips
      if (!reply && (lower.includes('memory') || lower.includes('brain') || lower.includes('sharp') || lower.includes('health') || lower.includes('tip'))) {
        reply = langCode === 'en'
          ? "Here are three gentle tips to keep your mind and spirit feeling wonderful today:\n\n- **Stay Hydrated**: Enjoy a warm glass of water or gentle herbal tea.\n- **Gentle Brain Play**: Spend 5–10 minutes with **Picture Recall** or a simple puzzle.\n- **Connect Warmly**: Take a short, restful walk or share a fond story with a loved one."
          : (LANGUAGES_CONFIG[langCode] || LANGUAGES_CONFIG['en']).helpPrompt;
      }

      if (!reply) {
        const cfg = LANGUAGES_CONFIG[langCode] || LANGUAGES_CONFIG['en'];
        reply = cfg.greeting;
      }

      return {
        reply,
        detectedLanguage: langCode,
        action,
        spokenScript: reply,
      };
    };

    if (!ai) {
      const fallback = createFallbackResponse(message, selectedLanguage);
      sendEvent({ text: fallback.reply, action: fallback.action, detectedLanguage: selectedLanguage, done: true });
      res.end();
      return;
    }

    const ist = getIndianTimeDetails();

    const systemInstruction = `
You are Recallia AI Companion, an intelligent, deeply knowledgeable, and 100% factually accurate conversational assistant powered by Google Gemini, designed specifically for elderly individuals, seniors, and their families in India.

🚨 STRICT TIME, DATE, AND DAY USAGE RULE:
- NEVER mention or volunteer the current time, date, or day of the week unless the user explicitly asks for it!
- Do not greet with the time or date. If the user did not ask about the time, date, or day, do NOT state or include it in your response.
- Only when specifically asked for time, date, or day, provide the exact, accurate Indian Standard Time (IST) details.

👵 ELDER-FRIENDLY TONE & FORMATTING (STRICT MANDATES):
1. Speak with Patient Warmth & Dignified Respect:
   - Always communicate with patient warmth, dignified respect, and genuine kindness, as you would speak to a revered elder or beloved grandparent.
   - Be calm, reassuring, supportive, and respectful. Never sound condescending, hurried, or robotic.

2. Concise, Simple, and Comfortable to Read:
   - Keep sentences concise, simple, and comfortable to read.
   - Strictly avoid dense jargon, technical buzzwords, or heavy walls of text.
   - Keep paragraphs short (1 to 2 sentences per paragraph).

3. Clean Bullet Points, Bold Key Phrases & Generous Spacing:
   - Use **bold key phrases** for essential names, dates, times, and important ideas so elders can easily scan without straining their eyes.
   - When explaining concepts, giving advice, or listing options, ALWAYS use clean, short bullet points:
     - **Key Idea**: Simple, direct explanation.
   - Provide generous line spacing between paragraphs and bullet points (use double line breaks \n\n) to eliminate visual clutter.

🎯 UNCOMPROMISING FACTUAL ACCURACY & SPEED:
1. Precision & Truthfulness: Provide strictly accurate, factual, verified information across all topics (science, health, daily living, history, geography, mathematics, cooking, literature, nature, and cognitive wellness).
2. Never Hallucinate: If asked for a calculation, provide the exact mathematical answer. If asked about a historical event or capital, provide the verified factual answer.

🤖 AUTONOMOUS IN-APP ACTION EXECUTION RULES:
- ONLY output an action tag if the user EXPLICITLY asks to open, play, start, navigate, change, or relax/breathe in the app.
- For all factual, informational, mathematical, historical, scientific, or general conversational questions, answer directly and accurately, and DO NOT output any action tag!
- When user asks to open or play a game in general (e.g. "open a game", "play a game", "start a game", "recommend a game", "let's play"), recommend Picture Recall (or Sequence Memory), explain why warmly in 1 short sentence, and append [[ACTION:play_recommended_game]]!

At the very end of your response (only when an action was asked for), output:
[[ACTION:action_name]]

Valid action_names:
- [[ACTION:play_recommended_game]] -> When user asks to open/play/recommend a game in general.
- [[ACTION:play_picture_recall]] -> When user asks for Picture Recall or visual memory game.
- [[ACTION:play_sequence_memory]] -> When user asks for Sequence Memory or pattern game.
- [[ACTION:play_object_association]] -> When user asks for Object Association or word pairing game.
- [[ACTION:play_story_recall]] -> When user asks for Story Recall or traditional tale game.
- [[ACTION:play_my_memories]] -> When user asks for My Memories or personal family photos.
- [[ACTION:open_caregiver]] -> When user asks for caregiver portal, streaks, or progress report.
- [[ACTION:open_settings]] -> When user asks to open settings or language options.
- [[ACTION:back_to_dashboard]] -> When user asks to go home, dashboard, or exit/back.
- [[ACTION:start_breathing]] -> When user asks to breathe, relax, or calm down.
- [[ACTION:change_lang_as]] -> Switch language to Assamese.
- [[ACTION:change_lang_ne]] -> Switch language to Nepali.
- [[ACTION:change_lang_en]] -> Switch language to English.

🌐 LANGUAGE DIRECTIVE:
Chosen language: "${targetLang.name} (${targetLang.nativeName})", code: "${selectedLanguage}".
- If English ("en"), respond in fluent, articulate, elder-friendly English.
- If North-Eastern Indian language (${targetLang.name}), respond in authentic ${targetLang.name} using authentic ${targetLang.script}.
`;

    // Construct conversation history
    const conversationHistory = history
      .slice(-4)
      .map((item: { role: string; content: string }) => `${item.role === 'user' ? 'User' : 'Assistant'}: ${item.content}`)
      .join('\n');

    // Check if user is asking for time, date, or day of the week
    const isAskingForTimeOrDate = 
      (/(?:time|date|\bday\b|weekday|clock|hour|\byear\b|\bmonth\b|কিমান বাজিছে|कति बज्यो|কিমান তাৰিখ|कति गते|कति मिति|কি বাৰ|के बार|samay|समय|সময়|tarikh|तारीख|তারিখ)/i.test(message) &&
       /(?:what|which|tell|current|now|is it|is today|please|kya|कति|কি|के|কত|batao|kobo|भन्नुहोस्|\?)/i.test(message)) ||
      /^(?:time|date|day|clock|samay|tarikh)(?:\s+(?:now|today|please|in india))?$/i.test(message.trim()) ||
      /(?:what time|what date|what day|which day|date today|time today|time now|time in india|today'?s date|today'?s day|is today (?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)|what year|current ist)/i.test(message);

    const clockContext = isAskingForTimeOrDate
      ? `[USER ASKED FOR TIME/DATE/DAY - LIVE REAL-TIME CLOCK IN INDIA (IST, UTC+05:30): Current Time: ${ist.time12} (IST) | Day: ${ist.dayOfWeek} (Assamese: ${ist.asDay}, Nepali: ${ist.neDay}) | Date: ${ist.formattedDate} (${ist.dateLong}) | Year: ${ist.year}. Provide this exact, correct information directly to the user in a warm, elder-friendly tone.]\n\n`
      : `[IMPORTANT DIRECTIVE: The user did NOT ask about the time, date, or day. Strictly DO NOT mention, include, or greet with the current time, date, or day in your response. Answer the user's message directly.]\n\n`;

    const prompt = `${clockContext}${conversationHistory ? `Recent Conversation History:\n${conversationHistory}\n\n` : ''}User Message: ${message}

[RESPONSE MANDATES:
1. Speak with patient warmth, dignified respect, and high visual clarity.
2. Keep sentences concise, simple, and comfortable to read. Avoid dense jargon, technical terms, or large blocks of text.
3. Use clean bullet points, bold key phrases, and generous line spacing to reduce eye strain.
4. DO NOT mention the time, date, or day unless the user explicitly asked for it in their query.
5. If an in-app action was requested, output [[ACTION:...]] at the very end.]`;

    // Multi-tier model cascade prioritizing healthy quota and low latency:
    // 1. gemini-3.1-flash-lite (fast, high throughput, generous free tier limits)
    // 2. gemini-3.6-flash (recommended primary flash model)
    // 3. gemini-3.5-flash (reliable secondary flash model)
    // 4. gemini-3.8-flash (last resort, guarded against 429 quota exhaustion)
    const allCandidateModels = [
      'gemini-3.1-flash-lite',
      'gemini-3.6-flash',
      'gemini-3.5-flash',
      'gemini-3.8-flash',
    ];
    let modelsToTry = allCandidateModels.filter((m) => !isModelInCooldown(m));
    if (modelsToTry.length === 0) {
      modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.6-flash'];
    }

    let streamedSuccessfully = false;
    let fullResponseText = '';

    for (const modelName of modelsToTry) {
      try {
        const streamPromise = ai.models.generateContentStream({
          model: modelName,
          contents: prompt,
          config: {
            systemInstruction,
            temperature: 0.2,
          },
        });

        // 12-second generous streaming timeout for reliable connection
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout on model ${modelName}`)), 12000)
        );

        const responseStream = await Promise.race([streamPromise, timeoutPromise]);

        for await (const chunk of responseStream) {
          const text = chunk.text;
          if (text) {
            streamedSuccessfully = true;
            fullResponseText += text;
            // Clean action tag from streaming chunk so user sees natural clean text
            const cleanChunk = text.replace(/\[\[ACTION:[^\]]+\]\]/g, '');
            if (cleanChunk) {
              sendEvent({ text: cleanChunk });
            }
          }
        }

        if (streamedSuccessfully) {
          break;
        }
      } catch (streamErr: unknown) {
        const errMsg = streamErr instanceof Error ? streamErr.message : String(streamErr);
        const is429 = errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED') || (streamErr as { status?: number })?.status === 429;
        
        if (is429) {
          setModelCooldown(modelName, 300_000); // 5-minute cooldown for rate-limited models
          console.warn(`[AI Assistant] Model ${modelName} exceeded quota (429). Placed on cooldown, switching to next model.`);
        } else {
          console.warn(`[AI Assistant] Model ${modelName} stream notice: ${errMsg.substring(0, 100)}`);
        }

        // If not 429, attempt single-turn generateContent fallback
        if (!is429) {
          try {
            const genPromise = ai.models.generateContent({
              model: modelName,
              contents: prompt,
              config: {
                systemInstruction,
                temperature: 0.2,
              },
            });
            const genTimeout = new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error(`Timeout on generateContent ${modelName}`)), 8000)
            );
            const res = await Promise.race([genPromise, genTimeout]);
            if (res?.text) {
              streamedSuccessfully = true;
              fullResponseText = res.text.trim();
              const cleanText = fullResponseText.replace(/\[\[ACTION:[^\]]+\]\]/g, '').trim();
              sendEvent({ text: cleanText });
              break;
            }
          } catch (modelErr: unknown) {
            const fbMsg = modelErr instanceof Error ? modelErr.message : String(modelErr);
            if (fbMsg.includes('429') || fbMsg.includes('RESOURCE_EXHAUSTED')) {
              setModelCooldown(modelName, 300_000);
              console.warn(`[AI Assistant] Model ${modelName} fallback exceeded quota (429). Placed on cooldown.`);
            }
          }
        }
      }
    }

    // Extract any model-generated action tag
    const actionMatch = fullResponseText.match(/\[\[ACTION:([a-zA-Z0-9_-]+)\]\]/);
    if (actionMatch) {
      const userLower = message.toLowerCase();
      const hasActionKeyword = /(open|play|start|launch|recommend|suggest|run|breathe|relax|setting|caregiver|report|streak|home|dashboard|game|activity|switch|change|অসমীয়া|নেपाली)/i.test(userLower);
      if (hasActionKeyword || detectedAction) {
        detectedAction = actionMatch[1];
      }
    }

    if (!streamedSuccessfully) {
      const fallback = createFallbackResponse(message, selectedLanguage);
      sendEvent({ text: fallback.reply });
      if (fallback.action && !detectedAction) {
        detectedAction = fallback.action;
      }
    }

    // Signal completion with detected/model-generated action
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
