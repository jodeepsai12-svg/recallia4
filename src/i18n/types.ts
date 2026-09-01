// Translation key types — all app strings are keyed here.
// Each language file must provide every key in this interface.

export interface Translations {
  // Language selection screen
  languageSelect: {
    welcome: string;
    chooseLanguage: string;
    continue: string;
  };

  // Language names (shown in their own script)
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
  };

  // Difficulty labels
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

  // Settings page
  settings: {
    title: string;
    back: string;
    language: string;
    languageDescription: string;
    changeLanguage: string;
  };

  // General
  common: {
    back: string;
    cancel: string;
    confirm: string;
  };
}

// Supported languages metadata
export interface LanguageMeta {
  code: string;
  name: string;       // English name
  nativeName: string;  // Name in the language itself
  bcp47: string;       // BCP-47 tag for speech synthesis
}

export const LANGUAGES: LanguageMeta[] = [
  { code: 'en', name: 'English', nativeName: 'English', bcp47: 'en-US' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', bcp47: 'as-IN' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', bcp47: 'bn-IN' },
  { code: 'brx', name: 'Bodo', nativeName: 'बड़ो', bcp47: 'brx-IN' },
  { code: 'kha', name: 'Khasi', nativeName: 'Khasi', bcp47: 'kha-IN' },
  { code: 'gar', name: 'Garo', nativeName: 'A·chikku', bcp47: 'grt-IN' },
  { code: 'mni', name: 'Meitei (Manipuri)', nativeName: 'মৈতৈ লোন্', bcp47: 'mni-IN' },
  { code: 'lus', name: 'Mizo', nativeName: 'Mizo ṭawng', bcp47: 'lus-IN' },
  { code: 'kok', name: 'Kokborok', nativeName: 'ককবরক', bcp47: 'kok-IN' },
];
