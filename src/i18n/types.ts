// Translation key types — all app strings are keyed here.
// Each language file provides every key in this interface.

export interface Translations {
  // Language selection screen
  languageSelect: {
    title: string;
    welcome: string;
    chooseLanguage: string;
    subtitle: string;
    continue: string;
    selectLanguage: string;
    selectedBadge: string;
    stateLabel: string;
  };

  // Language names
  languages: Record<string, string>;

  // Landing page
  landing: {
    signIn: string;
    getStarted: string;
    badge: string;
    heroTitle: string;
    heroText: string;
    ctaPrimary: string;
    ctaSecondary: string;
    heroNote: string;
    todayActivity: string;
    todayActivityMeta: string;
    memoryMatch: string;
    memoryMatchDesc: string;
    recommendedNote: string;
    featuresTitle: string;
    featuresText: string;
    featureMemoryTitle: string;
    featureMemoryText: string;
    featureLanguageTitle: string;
    featureLanguageText: string;
    featureProblemTitle: string;
    featureProblemText: string;
    howItWorksTitle: string;
    step1Title: string;
    step1Text: string;
    step2Title: string;
    step2Text: string;
    step3Title: string;
    step3Text: string;
    ctaTitle: string;
    ctaText: string;
    ctaButton: string;
    footerDisclaimer: string;
  };

  // Auth page
  auth: {
    back: string;
    signUpTitle: string;
    signInTitle: string;
    signUpSubtitle: string;
    signInSubtitle: string;
    emailLabel: string;
    emailPlaceholder: string;
    passwordLabel: string;
    passwordPlaceholder: string;
    submitSignUp: string;
    submitSignIn: string;
    submitting: string;
    haveAccount: string;
    noAccount: string;
    signInLink: string;
    createLink: string;
    disclaimer: string;
  };

  // Dashboard
  dashboard: {
    loadingActivities: string;
    signOut: string;
    settings: string;
    greetingMorning: string;
    greetingAfternoon: string;
    greetingEvening: string;
    greetingSubtitle: string;
    todaysActivity: string;
    minutes: string;
    recommendedNote: string;
    startActivity: string;
    continue: string;
    doneTryAnother: string;
    saving: string;
    yourProgress: string;
    doneToday: string;
    todaysCompletion: string;
    activeDaysThisWeek: string;
    todaysCompleted: string;
    noCompletedTitle: string;
    noCompletedText: string;
    completedAt: string;
    activity: string;
    recommendedForYou: string;
    startActivityBtn: string;
    cognitiveActivities: string;
    sessionSingular: string;
    sessionPlural: string;
    avg: string;
    disclaimer: string;
    changeLanguage: string;
    currentLanguage: string;
  };

  // Difficulty labels & trends
  difficulty: {
    gentle: string;
    moderate: string;
    challenging: string;
    steppingUp: string;
    easingBack: string;
    steady: string;
    level: string;
  };

  // Game player
  gamePlayer: {
    activities: string;
    signOut: string;
    howToPlay: string;
    start: string;
    begin: string;
    minutes: string;
    wellDone: string;
    youCompleted: string;
    score: string;
    accuracy: string;
    mistakes: string;
    responseTime: string;
    playAgain: string;
    nextActivity: string;
    savingResults: string;
    playInstructions: string;
  };

  // Picture Recall game
  pictureRecall: {
    title: string;
    tagline: string;
    description: string;
    memorizeObjects: string;
    startingIn: string;
    whichObjects: string;
    tapRemember: string;
    done: string;
    correct: string;
    wasShown: string;
    wasNotShown: string;
    items: Record<string, string>;
    instructions: {
      step1: string;
      step2: string;
      step3: string;
      step4: string;
      tip: string;
      audioText: string;
    };
  };

  // Sequence Memory game
  sequenceMemory: {
    title: string;
    tagline: string;
    description: string;
    watchSequence: string;
    rememberOrder: string;
    yourTurn: string;
    step: string;
    of: string;
    sequenceComplete: string;
    mistakeSingular: string;
    mistakePlural: string;
    mistakesSoFar: string;
    instructions: {
      step1: string;
      step2: string;
      step3: string;
      step4: string;
      tip: string;
      audioText: string;
    };
  };

  // Object Association game
  objectAssociation: {
    title: string;
    tagline: string;
    description: string;
    question: string;
    of: string;
    questions: { prompt: string; options: string[] }[];
    instructions: {
      step1: string;
      step2: string;
      step3: string;
      step4: string;
      tip: string;
      audioText: string;
    };
  };

  // Story Recall game
  storyRecall: {
    title: string;
    tagline: string;
    description: string;
    readCarefully: string;
    readyForQuestions: string;
    question: string;
    of: string;
    stories: { title: string; text: string; questions: { question: string; options: string[] }[] }[];
    instructions: {
      step1: string;
      step2: string;
      step3: string;
      step4: string;
      tip: string;
      audioText: string;
    };
  };

  // Settings
  settings: {
    title: string;
    back: string;
    language: string;
    languageDescription: string;
    changeLanguage: string;
    close: string;
  };

  // Common
  common: {
    back: string;
    cancel: string;
    confirm: string;
    select: string;
    close: string;
  };
}

export type SupportedLanguageCode = 'as' | 'nyi' | 'mni' | 'kha' | 'lus' | 'ao' | 'ne' | 'kok' | 'en';

export interface LanguageMeta {
  code: SupportedLanguageCode;
  state: string;
  name: string;        // English name
  nativeName: string;  // Name in native script/orthography
  scriptDisplay: string;
  bcp47: string;
}

export const LANGUAGES: LanguageMeta[] = [
  { code: 'as', state: 'Assam', name: 'Assamese', nativeName: 'অসমীয়া', scriptDisplay: 'Assam — Assamese (অসমীয়া)', bcp47: 'as-IN' },
  { code: 'nyi', state: 'Arunachal Pradesh', name: 'Nyishi', nativeName: 'Nyishi', scriptDisplay: 'Arunachal Pradesh — Nyishi', bcp47: 'njz-IN' },
  { code: 'mni', state: 'Manipur', name: 'Meitei', nativeName: 'ꯃꯤꯇꯩ ꯂꯣꯟ', scriptDisplay: 'Manipur — Meitei (ꯃꯤꯇꯩ ꯂꯣꯟ)', bcp47: 'mni-Mtei' },
  { code: 'kha', state: 'Meghalaya', name: 'Khasi', nativeName: 'Khasi', scriptDisplay: 'Meghalaya — Khasi', bcp47: 'kha-IN' },
  { code: 'lus', state: 'Mizoram', name: 'Mizo', nativeName: 'Mizo ṭawng', scriptDisplay: 'Mizoram — Mizo (Mizo ṭawng)', bcp47: 'lus-IN' },
  { code: 'ao', state: 'Nagaland', name: 'Ao', nativeName: 'Ao', scriptDisplay: 'Nagaland — Ao', bcp47: 'njo-IN' },
  { code: 'ne', state: 'Sikkim', name: 'Nepali', nativeName: 'नेपाली', scriptDisplay: 'Sikkim — Nepali (नेपाली)', bcp47: 'ne-NP' },
  { code: 'kok', state: 'Tripura', name: 'Kokborok', nativeName: 'ককবরক', scriptDisplay: 'Tripura — Kokborok (ককবরক)', bcp47: 'trp-IN' },
  { code: 'en', state: 'General', name: 'English', nativeName: 'English', scriptDisplay: 'English', bcp47: 'en-US' },
];
