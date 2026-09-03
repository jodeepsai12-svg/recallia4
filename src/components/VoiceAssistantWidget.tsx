import { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  X,
  ArrowLeft,
  Brain,
  Send,
  RotateCcw,
  Languages,
  User,
  HelpCircle,
  PlayCircle,
  BarChart2,
  Copy,
  Check,
  BookOpen,
  HeartHandshake,
  Bot,
  Clock,
  Calendar,
} from 'lucide-react';
import { useVoice } from '@/context/VoiceContext';
import { useI18n, LANGUAGES, type SupportedLanguageCode } from '@/i18n';

export function VoiceAssistantWidget() {
  const {
    isAssistantOpen,
    setAssistantOpen,
    isListening,
    isSpeaking,
    transcript,
    assistantMessages,
    isProcessingAI,
    detectedLanguage,
    sendMessageToAssistant,
    startVoiceAssistantListening,
    stopVoiceAssistantListening,
    speak,
    stopSpeaking,
    clearMessages,
    isVoiceGuideEnabled,
    setVoiceGuideEnabled,
  } = useVoice();

  const { language, setLanguage } = useI18n();
  const [textInput, setTextInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Live real-time Indian Standard Time (IST) for senior orientation
  const [istTimeStr, setIstTimeStr] = useState(() => {
    return new Date().toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  });
  const [istDateStr, setIstDateStr] = useState(() => {
    return new Date().toLocaleDateString('en-IN', {
      timeZone: 'Asia/Kolkata',
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setIstTimeStr(
        now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        })
      );
      setIstDateStr(
        now.toLocaleDateString('en-IN', {
          timeZone: 'Asia/Kolkata',
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      );
    };
    const interval = setInterval(updateTime, 5000);
    return () => clearInterval(interval);
  }, []);

  // Strictly use user's chosen language metadata
  const activeLangMeta =
    LANGUAGES.find((l) => l.code === language) ||
    LANGUAGES.find((l) => l.code === detectedLanguage) ||
    LANGUAGES[0];

  useEffect(() => {
    if (isAssistantOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [assistantMessages, isAssistantOpen, isListening, isProcessingAI]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!textInput.trim() || isProcessingAI) return;
    const msg = textInput.trim();
    setTextInput('');
    sendMessageToAssistant(msg);
  };

  const handleQuickPrompt = (promptText: string) => {
    sendMessageToAssistant(promptText);
  };

  const handleCopy = (text: string, id: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Language specific prompt suggestions strictly in the chosen language
  const getPromptSuggestions = () => {
    switch (language) {
      case 'as':
        return [
          { text: 'আজি কি বাৰ আৰু কিমান তাৰিখ?', icon: Clock, label: 'তাৰিখ আৰু বাৰ' },
          { text: 'মোক অসমৰ এখন শান্ত লোককথা শুনাওক', icon: BookOpen, label: 'শান্ত লোককথা' },
          { text: 'ছৱি মনত ৰখা খেল আৰম্ভ কৰক', icon: PlayCircle, label: 'ছৱি মনত ৰখা খেল' },
          { text: 'মগজু সজীৱ ৰখাৰ বাবে তিনিটা পৰামৰ্শ দিয়ক', icon: Sparkles, label: 'জ্ঞান পৰামৰ্শ' },
          { text: 'মোৰ সাপ্তাহিক অগ্ৰগতিৰ প্ৰতিবেদন দেখুৱাওক', icon: BarChart2, label: 'প্ৰতিবেদন' },
        ];
      case 'ne':
        return [
          { text: 'आज के बार, कति गते र कति बज्यो?', icon: Clock, label: 'मिति र समय' },
          { text: 'मलाई एउटा शान्त परम्परागत कथा सुनाउनुहोस्', icon: BookOpen, label: 'शान्त कथा' },
          { text: 'तस्बिर स्मरण अभ्यास सुरु गर्नुहोस्', icon: PlayCircle, label: 'तस्बिर अभ्यास' },
          { text: 'मानसिक स्वास्थ्यका लागि ३ वटा उपयोगी सुझाव दिनुहोस्', icon: Sparkles, label: 'सुझावहरू' },
          { text: 'मेरो प्रगति रिपोर्ट देखाउनुहोस्', icon: BarChart2, label: 'प्रगति रिपोर्ट' },
        ];
      case 'mni':
        return [
          { text: 'ꯑꯩꯈꯣꯏ ꯁꯥꯟꯇꯤ ꯑꯣꯏꯕꯥ ꯋꯥꯔꯤ ꯑꯃꯥ ꯇꯥꯁꯤ', icon: BookOpen, label: 'ꯁꯥꯟꯇꯤ ꯋꯥꯔꯤ' },
          { text: 'ꯃꯤꯇꯩ ꯐꯣꯇꯣ ꯅꯤꯡꯁꯤꯡꯕꯥ ꯃꯁꯥꯟꯅꯥ ꯍꯧꯕꯤꯌꯨ', icon: PlayCircle, label: 'ꯐꯣꯇꯣ ꯃꯁꯥꯟꯅꯥ' },
          { text: 'ꯅꯤꯡꯁꯤꯡ ꯂꯧꯁꯤꯡ ꯐꯒꯠꯍꯟꯅꯕꯥ ꯄꯥꯎꯇꯥꯛ ꯄꯤꯕꯤꯌꯨ', icon: Sparkles, label: 'ꯄꯥꯎꯇꯥꯛ' },
          { text: 'ꯑꯩꯒꯤ ꯄ꯭ꯔꯣꯒ꯭ꯔꯦꯁ ꯌꯦꯡꯕꯤꯌꯨ', icon: BarChart2, label: 'ꯄ꯭ꯔꯣꯒ꯭ꯔꯦꯁ' },
        ];
      case 'kha':
        return [
          { text: 'Iathuh ha nga ia kawei ka puriskam kaba sngewtynnat', icon: BookOpen, label: 'Puriskam' },
          { text: 'Sdang ia ka jingleh dur kynmaw', icon: PlayCircle, label: 'Dur Kynmaw' },
          { text: 'Ai 3 tylli ki jingbthah na ka bynta ka jingmut jingpyrkhat', icon: Sparkles, label: 'Jingbthah' },
          { text: 'Pyni ia ka report jong nga', icon: BarChart2, label: 'Report' },
        ];
      case 'lus':
        return [
          { text: 'Mizo thawnthu ngaihnawm tak min hrilh teh', icon: BookOpen, label: 'Mizo Thawnthu' },
          { text: 'Thlalak hriatpuina game i ṭan ang u', icon: PlayCircle, label: 'Thlalak Game' },
          { text: 'Thluak hriselna atan thurawn 3 min pe teh', icon: Sparkles, label: 'Thurawn' },
          { text: 'Ka hmasawnna report min en tir rawh', icon: BarChart2, label: 'Progress Report' },
        ];
      case 'kok':
        return [
          { text: 'Angno kaisa kaham kokthum saikhlai', icon: BookOpen, label: 'Kaham Kokthum' },
          { text: 'Nokhar photo kiphil activity chengdi', icon: PlayCircle, label: 'Photo Activity' },
          { text: 'Kwplai tongo bagwi chubani kok saidi', icon: Sparkles, label: 'Chubani Kok' },
          { text: 'Ani progress report nukhudi', icon: BarChart2, label: 'Progress Report' },
        ];
      case 'nyi':
        return [
          { text: 'Ngo no haam nyir gam kumtolo', icon: BookOpen, label: 'Kumtolo' },
          { text: 'Photo recall nyir gam aitsüdi', icon: PlayCircle, label: 'Photo Activity' },
          { text: 'Haam nyir gam chuba paalo', icon: Sparkles, label: 'Chuba' },
          { text: 'Report nukhudi', icon: BarChart2, label: 'Report' },
        ];
      case 'ao':
        return [
          { text: 'Ni den asaya ka asayatsü aitsüdi', icon: BookOpen, label: 'Oshi Otsü' },
          { text: 'Noksa kilem asaya tenzükdi', icon: PlayCircle, label: 'Noksa Asaya' },
          { text: 'Shisatsü tajung ka ashiang', icon: Sparkles, label: 'Shisatsü' },
          { text: 'Ni asoshi report sayuang', icon: BarChart2, label: 'Report' },
        ];
      default:
        return [
          { text: "What is today's date, day, and time in India?", icon: Clock, label: 'Time & Date (IST)' },
          { text: 'Tell me a peaceful folk story from Northeast India', icon: BookOpen, label: 'Peaceful Folk Story' },
          { text: 'Give me 3 gentle tips to keep my memory sharp today', icon: Sparkles, label: 'Daily Brain Wellness' },
          { text: 'Start Picture Recall game', icon: PlayCircle, label: 'Play Picture Recall' },
          { text: 'Show my caregiver progress overview', icon: BarChart2, label: 'Caregiver Report' },
          { text: 'Guide me through a simple 2-minute calming breathing exercise', icon: HeartHandshake, label: 'Calming Breathing' },
          { text: 'How do I play the Sequence Memory game?', icon: HelpCircle, label: 'Game Instructions' },
        ];
    }
  };

  const emptyStateTitles: Record<SupportedLanguageCode, { title: string; subtitle: string; placeholder: string }> = {
    as: {
      title: 'মোক কিবা সোধক বা পৰামৰ্শ বাছক',
      subtitle: 'আপোনাৰ নিৰ্বাচিত অসমীয়া ভাষাত মই সাধু কʼব পাৰোঁ, খেল বুজাব পাৰোঁ আৰু আপোনাক সহায় কৰিব পাৰোঁ।',
      placeholder: 'অসমীয়াত যিকোনো প্ৰশ্ন সোধক...',
    },
    ne: {
      title: 'मलाई केही सोध्नुहोस् वा सुझाव रोज्नुहोस्',
      subtitle: 'तपाईंको रोजिएको नेपाली भाषामा म कथा सुनाउन, खेल बुझाउन र मद्दत गर्न सक्छु।',
      placeholder: 'नेपालीमा जे पनि सोध्नुहोस्...',
    },
    mni: {
      title: 'ꯑꯩꯉꯣꯟꯗꯥ ꯍꯪꯕꯤꯌꯨ',
      subtitle: 'ꯅꯍꯥꯛꯅꯥ ꯈꯅꯕꯤꯔꯕꯥ ꯃꯤꯇꯩ ꯂꯣꯟꯗꯥ ꯋꯥꯔꯤ ꯇꯥꯕꯤꯌꯨ ꯑꯃꯁꯨꯡ ꯃꯁꯥꯟꯅꯥ ꯍꯧꯕꯤꯌꯨ꯫',
      placeholder: 'ꯃꯤꯇꯩ ꯂꯣꯟꯗꯥ ꯍꯪꯕꯤꯌꯨ...',
    },
    kha: {
      title: 'Kylli ia nga ne jied ia ki jingbthah',
      subtitle: 'Ha ka ktien Khasi kaba phi la jied, nga lah ban iathuhkhana bad iarap ia phi.',
      placeholder: 'Kylli ha ka ktien Khasi...',
    },
    lus: {
      title: 'Min zawt rawh le',
      subtitle: 'Mizo ṭawnga thawnthu sawi leh game hrilhfiah hi ka inpeih reng e.',
      placeholder: 'Mizo ṭawngin min zawt rawh...',
    },
    kok: {
      title: 'Angno kaisa sungdi',
      subtitle: 'Kokborok kokbai kokthum saikhlai no manai.',
      placeholder: 'Kokborok bai sungdi...',
    },
    nyi: {
      title: 'Ngo no haam nyir gam kumtolo',
      subtitle: 'Nyishi agom nyir gam chuba paalo.',
      placeholder: 'Nyishi agom haam...',
    },
    ao: {
      title: 'Ni den asüngdangang',
      subtitle: 'Ao oshi nung otsü aser asaya kilemtsü lir.',
      placeholder: 'Ao oshi nung asüngdangang...',
    },
    en: {
      title: 'Ask me anything or tap a prompt',
      subtitle: 'Powered by Gemini AI. I can tell soothing stories, answer questions, or guide cognitive wellness in your chosen language.',
      placeholder: 'Ask Gemini anything in English...',
    },
  };

  const emptyState = emptyStateTitles[language] || emptyStateTitles.en;

  return (
    <>
      {/* Floating Trigger Button */}
      {!isAssistantOpen && (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
          {/* Active Voice Guide Pill */}
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-teal-200 bg-white/95 px-3.5 py-1.5 shadow-md backdrop-blur text-xs font-semibold text-teal-900">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isSpeaking ? 'bg-amber-400 opacity-75' : 'bg-teal-400 opacity-75'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isSpeaking ? 'bg-amber-500' : 'bg-teal-600'}`}></span>
            </span>
            <span>{isSpeaking ? 'Speaking...' : `AI Assistant: ${activeLangMeta.nativeName}`}</span>
          </div>

          <button
            onClick={() => setAssistantOpen(true)}
            className="group relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-teal-700 to-teal-600 text-white shadow-xl shadow-teal-900/25 transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-teal-300"
            title="Open Gemini AI Assistant"
            aria-label="Open Gemini AI Assistant"
          >
            {isSpeaking ? (
              <Volume2 className="h-7 w-7 animate-pulse text-amber-200" />
            ) : isListening ? (
              <Mic className="h-7 w-7 animate-bounce text-red-200" />
            ) : (
              <Sparkles className="h-7 w-7 transition-transform group-hover:rotate-12" />
            )}
            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 border-2 border-white"></span>
            </span>
          </button>
        </div>
      )}

      {/* Expandable Voice Assistant Modal / Bottom Sheet */}
      {isAssistantOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 p-0 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="flex h-[92vh] sm:h-[700px] w-full max-w-2xl flex-col rounded-t-3xl sm:rounded-3xl border border-teal-100 bg-white shadow-2xl overflow-hidden">
            {/* Modal Header — Elder-Friendly with Large Back Button & Logo Button */}
            <div className="flex items-center justify-between border-b border-teal-800/30 bg-gradient-to-r from-teal-900 via-teal-800 to-teal-900 px-3.5 sm:px-6 py-3 sm:py-3.5 text-white">
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Large Elder-Friendly Back Button */}
                <button
                  onClick={() => {
                    stopSpeaking();
                    stopVoiceAssistantListening();
                    setAssistantOpen(false);
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl bg-white/20 hover:bg-white/30 active:scale-95 px-3.5 sm:px-4 py-2.5 text-base sm:text-lg font-bold text-white border border-white/30 shadow-sm transition-all focus:outline-none focus:ring-4 focus:ring-teal-300"
                  title="Go Back"
                  aria-label="Go Back"
                >
                  <ArrowLeft className="h-5 w-5 sm:h-6 sm:w-6 stroke-[2.5]" />
                  <span>Back</span>
                </button>

                {/* Large Logo Button */}
                <button
                  onClick={() => {
                    stopSpeaking();
                    stopVoiceAssistantListening();
                    setAssistantOpen(false);
                  }}
                  className="flex items-center gap-2.5 rounded-2xl px-2.5 sm:px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/15 transition-all text-left group"
                  title="Recallia Logo - Tap to close"
                  aria-label="Recallia Logo"
                >
                  <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-teal-500 shadow-md group-hover:bg-teal-400 transition-colors shrink-0">
                    <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-white" strokeWidth={2.5} />
                  </div>
                  <div className="hidden min-[480px]:block">
                    <div className="flex items-center gap-1.5">
                      <span className="font-display text-base sm:text-lg font-bold tracking-tight text-white leading-tight">
                        Recallia
                      </span>
                      <span className="rounded-full bg-teal-400/30 px-1.5 py-0.5 text-[10px] font-semibold text-teal-100 border border-teal-300/40">
                        AI
                      </span>
                    </div>
                    <p className="text-[11px] text-teal-200 leading-none">
                      Voice &amp; Text Assistant
                    </p>
                  </div>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* Voice Guide Mute/Unmute toggle */}
                <button
                  onClick={() => {
                    if (isSpeaking) stopSpeaking();
                    setVoiceGuideEnabled(!isVoiceGuideEnabled);
                  }}
                  className={`flex items-center gap-1.5 rounded-2xl px-3 py-2 text-xs sm:text-sm font-semibold transition-colors ${
                    isVoiceGuideEnabled
                      ? 'bg-white/20 text-white hover:bg-white/30'
                      : 'bg-red-500/30 text-red-100 hover:bg-red-500/40'
                  }`}
                  title={isVoiceGuideEnabled ? 'Mute AI Voice' : 'Unmute AI Voice'}
                  aria-label={isVoiceGuideEnabled ? 'Mute AI Voice' : 'Unmute AI Voice'}
                >
                  {isVoiceGuideEnabled ? (
                    <>
                      <Volume2 className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="hidden md:inline">Sound</span>
                    </>
                  ) : (
                    <>
                      <VolumeX className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span className="hidden md:inline">Muted</span>
                    </>
                  )}
                </button>

                {/* Close Button */}
                <button
                  onClick={() => {
                    stopSpeaking();
                    stopVoiceAssistantListening();
                    setAssistantOpen(false);
                  }}
                  className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-white transition-colors"
                  title="Close Assistant"
                  aria-label="Close Assistant"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Language Bar & Status Pill */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 sm:px-6 py-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <Languages className="h-3.5 w-3.5 text-teal-600" />
                <span>Active Language: <strong>{activeLangMeta.name} ({activeLangMeta.nativeName})</strong></span>
              </div>
              <div className="flex items-center gap-3">
                {isSpeaking && (
                  <span className="inline-flex items-center gap-1 text-amber-700 font-bold animate-pulse">
                    <Volume2 className="h-3.5 w-3.5" /> Speaking aloud
                  </span>
                )}
                {isListening && (
                  <span className="inline-flex items-center gap-1 text-red-600 font-bold animate-pulse">
                    <span className="h-2 w-2 rounded-full bg-red-500"></span> Listening
                  </span>
                )}
                {assistantMessages.length > 0 && (
                  <button
                    onClick={clearMessages}
                    className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 font-medium transition-colors"
                    title="Clear history"
                  >
                    <RotateCcw className="h-3 w-3" /> Clear Chat
                  </button>
                )}
              </div>
            </div>

            {/* Live Indian Standard Time (IST) & Date Bar for Elder Orientation */}
            <div className="flex items-center justify-between border-b border-teal-100 bg-teal-50/80 px-5 sm:px-6 py-1.5 text-xs text-teal-900">
              <div className="flex items-center gap-1.5 font-semibold">
                <Clock className="h-3.5 w-3.5 text-teal-700" />
                <span>India (IST): <strong>{istTimeStr}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 text-teal-800 font-medium">
                <Calendar className="h-3.5 w-3.5 text-teal-600" />
                <span>{istDateStr}</span>
              </div>
            </div>

            {/* Messages Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gradient-to-b from-slate-50/50 via-white to-slate-50/30">
              {assistantMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-teal-50 text-teal-700 mb-3 ring-8 ring-teal-50/60 shadow-sm">
                    <Bot className="h-8 w-8" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-1">
                    {emptyState.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 max-w-md mb-6 leading-relaxed">
                    {emptyState.subtitle}
                  </p>

                  {/* Suggested quick chips */}
                  <div className="w-full max-w-lg space-y-2">
                    <div className="text-left text-xs font-bold text-teal-800 uppercase tracking-wider px-1">
                      Recommended Prompts
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {getPromptSuggestions().map((p, idx) => {
                        const Icon = p.icon;
                        return (
                          <button
                            key={idx}
                            onClick={() => handleQuickPrompt(p.text)}
                            className="flex items-center gap-2.5 rounded-2xl border border-teal-100 bg-white p-3 text-left text-xs sm:text-sm font-semibold text-teal-950 transition-all hover:bg-teal-50 hover:border-teal-300 hover:shadow-soft active:scale-[0.98]"
                          >
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
                              <Icon className="h-4 w-4" />
                            </div>
                            <span className="line-clamp-2 leading-tight">{p.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                assistantMessages.map((msg) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isUser && (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-teal-100 text-teal-900 text-xs font-bold mt-1 shadow-xs">
                          <Sparkles className="h-4 w-4 text-teal-700" />
                        </div>
                      )}
                      <div
                        className={`max-w-[90%] sm:max-w-[85%] rounded-3xl px-5 sm:px-6 py-4 shadow-sm ${
                          isUser
                            ? 'bg-teal-700 text-white rounded-br-sm'
                            : 'bg-white text-slate-900 border border-teal-100/90 rounded-bl-sm shadow-soft'
                        }`}
                      >
                        {isUser ? (
                          <p className="text-base sm:text-lg whitespace-pre-wrap leading-relaxed text-white font-medium">
                            {msg.text}
                          </p>
                        ) : (
                          <div className="elder-markdown-content text-base sm:text-lg leading-relaxed text-slate-900 font-normal">
                            <Markdown
                              components={{
                                p: ({ children }) => (
                                  <p className="mb-3.5 last:mb-0 leading-relaxed text-slate-900">
                                    {children}
                                  </p>
                                ),
                                strong: ({ children }) => (
                                  <strong className="font-bold text-teal-950">
                                    {children}
                                  </strong>
                                ),
                                ul: ({ children }) => (
                                  <ul className="my-3 space-y-2.5 list-disc pl-5 marker:text-teal-600 text-slate-800">
                                    {children}
                                  </ul>
                                ),
                                ol: ({ children }) => (
                                  <ol className="my-3 space-y-2.5 list-decimal pl-5 marker:text-teal-700 font-medium text-slate-800">
                                    {children}
                                  </ol>
                                ),
                                li: ({ children }) => (
                                  <li className="leading-relaxed pl-1">
                                    {children}
                                  </li>
                                ),
                                h1: ({ children }) => (
                                  <h1 className="text-xl font-bold text-teal-950 mt-2 mb-2">
                                    {children}
                                  </h1>
                                ),
                                h2: ({ children }) => (
                                  <h2 className="text-lg font-bold text-teal-950 mt-2 mb-1.5">
                                    {children}
                                  </h2>
                                ),
                                h3: ({ children }) => (
                                  <h3 className="text-base font-bold text-teal-950 mt-1.5 mb-1">
                                    {children}
                                  </h3>
                                ),
                              }}
                            >
                              {msg.text}
                            </Markdown>
                          </div>
                        )}
                        <div className={`mt-3 pt-2.5 border-t flex items-center justify-between gap-3 text-xs ${
                          isUser ? 'border-teal-600/60 text-teal-200' : 'border-slate-100 text-slate-500'
                        }`}>
                          <span className="font-medium">{msg.timestamp}</span>

                          {!isUser && (
                            <div className="flex items-center gap-2">
                              {/* Copy response */}
                              <button
                                onClick={() => handleCopy(msg.text, msg.id)}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 transition-colors min-h-[32px]"
                                title="Copy answer"
                              >
                                {copiedId === msg.id ? (
                                  <>
                                    <Check className="h-3.5 w-3.5 text-teal-600" /> Copied
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3.5 w-3.5" /> Copy
                                  </>
                                )}
                              </button>

                              {/* Replay voice readout */}
                              <button
                                onClick={() => speak(msg.text, msg.language)}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 px-2.5 py-1 text-xs font-semibold text-teal-900 transition-colors min-h-[32px]"
                                title="Read answer aloud"
                              >
                                <Volume2 className="h-3.5 w-3.5 text-teal-700" /> Listen Aloud
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      {isUser && (
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-slate-200 text-slate-700 text-xs font-bold mt-1 shadow-xs">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {/* Live Listening Transcript Bubble */}
              {isListening && (
                <div className="flex items-center gap-3 justify-start animate-in fade-in duration-150">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-600 animate-pulse">
                    <Mic className="h-4 w-4" />
                  </div>
                  <div className="rounded-3xl rounded-bl-sm border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-900 shadow-sm">
                    <div className="flex items-center gap-2 font-bold text-xs text-red-700 mb-1">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                      </span>
                      Listening in {activeLangMeta.name} ({activeLangMeta.nativeName})...
                    </div>
                    <p className="italic text-slate-700">{transcript || 'Listening to your voice...'}</p>
                  </div>
                </div>
              )}

              {/* AI Processing Bubble */}
              {isProcessingAI && (
                <div className="flex items-center gap-3 justify-start animate-in fade-in duration-150">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-teal-100 text-teal-800">
                    <Sparkles className="h-4 w-4 animate-spin text-teal-700" />
                  </div>
                  <div className="rounded-3xl rounded-bl-sm border border-teal-200 bg-teal-50/70 px-4 py-3 text-xs font-bold text-teal-900 shadow-sm flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-600"></span>
                    </span>
                    Generating response with Gemini AI...
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Input & Voice Controller */}
            <div className="border-t border-slate-100 bg-white p-4">
              {/* Voice Visualizer Wave when active */}
              {(isListening || isSpeaking) && (
                <div className="mb-3 flex items-center justify-center gap-1.5 py-1">
                  {[40, 75, 100, 60, 90, 45, 80, 50, 95, 30].map((h, i) => (
                    <div
                      key={i}
                      className={`w-1.5 rounded-full transition-all duration-150 ${
                        isListening
                          ? 'bg-red-500 animate-pulse'
                          : 'bg-teal-600 animate-pulse'
                      }`}
                      style={{
                        height: `${Math.max(10, Math.sin(Date.now() / 200 + i) * h * 0.4 + 16)}px`,
                        animationDelay: `${i * 70}ms`,
                      }}
                    />
                  ))}
                  <span className="ml-2 text-xs font-bold text-slate-600">
                    {isListening ? 'Listening to voice...' : 'Speaking aloud...'}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2.5">
                {/* Microphone Toggle Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (isListening) {
                      stopVoiceAssistantListening();
                    } else {
                      startVoiceAssistantListening();
                    }
                  }}
                  className={`flex h-13 w-13 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl font-bold transition-all shadow-md active:scale-95 ${
                    isListening
                      ? 'bg-red-500 text-white ring-4 ring-red-200 animate-pulse'
                      : 'bg-teal-50 text-teal-900 border border-teal-200 hover:bg-teal-100 hover:border-teal-300'
                  }`}
                  title={isListening ? 'Stop Listening' : 'Tap & Speak in your language'}
                >
                  {isListening ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6 text-teal-700" />}
                </button>

                {/* Text Form */}
                <form onSubmit={handleSend} className="flex flex-1 items-center gap-2">
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder={emptyState.placeholder}
                    disabled={isProcessingAI || isListening}
                    className="h-13 sm:h-14 flex-1 rounded-2xl border border-slate-300 bg-slate-50 px-4 sm:px-5 text-base sm:text-lg text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-100 disabled:opacity-50"
                  />
                  <button
                    type="submit"
                    disabled={!textInput.trim() || isProcessingAI}
                    className="flex h-13 w-13 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-teal-700 text-white font-bold transition-all hover:bg-teal-800 disabled:opacity-40 disabled:hover:bg-teal-700 active:scale-95 shadow-sm"
                    title="Send message"
                  >
                    <Send className="h-5 w-5" />
                  </button>
                </form>
              </div>

              {/* Language Switcher Quick Dropdown */}
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span className="text-[11px] font-medium text-slate-600">8 NE Languages Supported</span>
                <select
                  value={language}
                  onChange={(e) => {
                    const newLang = e.target.value as SupportedLanguageCode;
                    setLanguage(newLang);
                    const announceMap: Record<SupportedLanguageCode, string> = {
                      as: 'আপুনি অসমীয়া ভাষা বাছনি কৰিছে।',
                      ne: 'तपाईंले नेपाली भाषा रोज्नुभएको छ।',
                      mni: 'ꯅꯍꯥꯛꯅꯥ ꯃꯤꯇꯩ ꯂꯣꯟ ꯈꯟꯈ꯭ꯔꯦ꯫',
                      kha: 'Phi la jied ia ka ktien Khasi.',
                      lus: 'Mizo ṭawng i thlang e.',
                      kok: 'Nung Kokborok kok thlangkha.',
                      nyi: 'No Nyishi agom thlangpa.',
                      ao: 'Na Ao oshi shimogo.',
                      en: 'You have selected English.',
                    };
                    speak(
                      announceMap[newLang] || `Language changed to ${LANGUAGES.find((l) => l.code === newLang)?.name}`,
                      newLang
                    );
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-teal-900 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name} ({l.nativeName})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
