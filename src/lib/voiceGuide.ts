import type { SupportedLanguageCode } from '@/i18n/types';

export type VoiceAnnouncementKey =
  | 'welcome_home'
  | 'language_selected'
  | 'signin_success'
  | 'signup_success'
  | 'signout_success'
  | 'start_picture_recall'
  | 'start_sequence_memory'
  | 'start_object_association'
  | 'start_story_recall'
  | 'game_completed'
  | 'open_caregiver'
  | 'back_to_dashboard'
  | 'open_settings'
  | 'error_occurred'
  | 'mic_listening'
  | 'mic_clarification'
  | 'emergency_activated'
  | 'emergency_sent'
  | 'emergency_cancelled';

export const VOICE_ANNOUNCEMENTS: Record<SupportedLanguageCode, Record<VoiceAnnouncementKey, string>> = {
  // Assamese (অসমীয়া)
  as: {
    welcome_home: 'ৰিকলিয়ালৈ স্বাগতম। আপোনাৰ আজিৰ মগজুৰ কাৰ্যকলাপ আৰম্ভ কৰোঁ আহক।',
    language_selected: 'আপুনি অসমীয়া ভাষা বাছনি কৰিছে। এতিয়া সকলো নিৰ্দেশনা আৰু ভয়েচ সহায় অসমীয়াত উপলব্ধ হ’ব।',
    signin_success: 'আপুনি সফলতাৰে প্ৰৱেশ কৰিছে। আপোনাৰ কাৰ্যকলাপবোৰ সাজু আছে।',
    signup_success: 'আপোনাৰ নতুন একাউণ্ট খোলা হ’ল। ৰিকলিয়ালৈ আদৰণি!',
    signout_success: 'আপুনি সফলভাৱে প্ৰস্থান কৰিলে। শুভ দিন!',
    start_picture_recall: 'ছৱি মনত ৰখা খেল আৰম্ভ হৈছে। পৰ্দাত থকা ছৱিবোৰ মনোযোগেৰে চাওক।',
    start_sequence_memory: 'ক্ৰম স্মৃতি কাৰ্যকলাপ আৰম্ভ হৈছে। ৰংবোৰৰ জ্বলি উঠা ক্ৰমটো মনত ৰাখক।',
    start_object_association: 'শব্দ সম্পৰ্ক কাৰ্যকলাপ আৰম্ভ হৈছে। সঠিক মিল থকা বস্তুটো বাছক।',
    start_story_recall: 'সাধু পঢ়া আৰু স্মৃতি কাৰ্যকলাপ আৰম্ভ হৈছে। সাধুটো শান্তভাৱে পঢ়ক।',
    game_completed: 'বহুত ভাল! আপুনি আজিৰ কাৰ্যকলাপ সফলতাৰে সম্পূৰ্ণ কৰিলে।',
    open_caregiver: 'অভিভাৱক পৰ্টেল মুকলি কৰা হৈছে। আপোনাৰ সাপ্তাহিক অগ্ৰগতি চাওক।',
    back_to_dashboard: 'কাৰ্যকলাপৰ মূল পৃষ্ঠালৈ উভতি আহিলোঁ।',
    open_settings: 'ভাষা আৰু ভয়েচ ছেটিংছ মুকলি কৰা হৈছে।',
    error_occurred: 'এক আসোঁৱাহ ঘটিছে। অনুগ্ৰহ কৰি আকৌ এবাৰ চেষ্টা কৰক।',
    mic_listening: 'মই শুনি আছোঁ। অনুগ্ৰহ কৰি কওক...',
    mic_clarification: 'মই বুজিব পৰা নাই। অনুগ্ৰহ কৰি আকৌ এবাৰ স্পষ্টকৈ কওক।',
    emergency_activated: 'জৰুৰীকালীন সাহায্য সক্ৰিয় হৈছে। আপোনাৰ অভিভাৱকৰ বাবে বাৰ্তা কওক।',
    emergency_sent: 'আপোনাৰ জৰুৰী বাৰ্তা অভিভাৱকলৈ প্ৰেৰণ কৰা হ’ল। শান্ত হৈ থাকক, সহায় আহি আছে।',
    emergency_cancelled: 'জৰুৰীকালীন সাহায্য বাতিল কৰা হৈছে।',
  },

  // Nyishi
  nyi: {
    welcome_home: 'Recallia haam ayiko do. Tani nyir gam kumtolo.',
    language_selected: 'Nyishi agom no soodelo. Nyishi agom ho gumchi gumna doolo.',
    signin_success: 'Aying loge login polo. Nyir gam paalo.',
    signup_success: 'Aying account aamolo. Recallia lo aying!',
    signout_success: 'Sign out polo. Haam doolangka!',
    start_picture_recall: 'Picture Recall gam chukrilo. Chobi haam kapaalangka.',
    start_sequence_memory: 'Sequence Memory gam chukrilo. Ring nam aam minolo.',
    start_object_association: 'Object Association gam chukrilo. Saai nolo.',
    start_story_recall: 'Story Recall gam chukrilo. Thawnthu aam porilangka.',
    game_completed: 'Nyir gam aam tancholo! Akam ayiko do.',
    open_caregiver: 'Caregiver Portal kapaalangka. Weekly progress kapaalangka.',
    back_to_dashboard: 'Main dashboard lo girkolo.',
    open_settings: 'Settings khololo.',
    error_occurred: 'Error dulolo. Agolo try khlailangka.',
    mic_listening: 'Ngo tatdo. Gamlanka...',
    mic_clarification: 'Ngo tatpaama. Agolo gamlanka.',
    emergency_activated: 'Emergency assistance chukrilo. Caregiver lo agom gamlanka.',
    emergency_sent: 'Emergency agom caregiver lo lapaalo. Haam doolangka, aying paalo.',
    emergency_cancelled: 'Emergency assistance cancel polo.',
  },

  // Meitei / Manipuri (ꯃꯤꯇꯩ ꯂꯣꯟ)
  mni: {
    welcome_home: 'ꯔꯤꯀꯣꯂꯤꯌꯥꯗꯥ ꯇꯔꯥꯝꯅꯥ ꯑꯣꯛꯆꯔꯤ꯫ ꯑꯩꯈꯣꯏ ꯉꯁꯤꯒꯤ ꯊꯕꯛ ꯍꯧꯔꯁꯤ꯫',
    language_selected: 'ꯅꯈꯣꯏꯅꯥ ꯃꯤꯇꯩ ꯂꯣꯟ ꯈꯜꯂꯦ꯫ ꯍꯧꯖꯤꯛ ꯃꯤꯇꯩ ꯂꯣꯟꯗꯥ ꯄꯥꯎꯇꯥꯛ ꯐꯪꯒꯅꯤ꯫',
    signin_success: 'ꯅꯈꯣꯏ ꯃꯥꯌꯄꯥꯛꯅꯥ ꯁꯥꯏꯟ ꯏꯟ ꯇꯧꯔꯦ꯫',
    signup_success: 'ꯑꯅꯧꯕꯥ ꯑꯦꯀꯥꯎꯟꯠ ꯁꯦꯃꯈ꯭ꯔꯦ꯫ ꯔꯤꯀꯣꯂꯤꯌꯥꯗꯥ ꯇꯔꯥꯝꯅꯥ ꯑꯣꯛꯆꯔꯤ!',
    signout_success: 'ꯁꯥꯏꯟ ꯑꯥꯎꯠ ꯇꯧꯔꯦ꯫ ꯅꯨꯡꯉꯥꯏꯕꯥ ꯅꯨꯃꯤꯠ ꯑꯣꯏꯔꯁꯅꯨ!',
    start_picture_recall: 'ꯃꯤꯇꯩ ꯐꯣꯇꯣ ꯅꯤꯡꯁꯤꯡꯕꯥ ꯃꯁꯥꯟꯅꯥ ꯍꯧꯔꯦ꯫',
    start_sequence_memory: 'ꯃꯆꯨꯒꯤ ꯄꯔꯦꯡ ꯅꯤꯡꯁꯤꯡꯕꯥ ꯃꯁꯥꯟꯅꯥ ꯍꯧꯔꯦ꯫',
    start_object_association: 'ꯋꯥꯍꯩ ꯃꯔꯤ ꯃꯁꯥꯟꯅꯥ ꯍꯧꯔꯦ꯫',
    start_story_recall: 'ꯋꯥꯔꯤ ꯄꯥꯕꯥ ꯑꯃꯁꯨꯡ ꯅꯤꯡꯁꯤꯡꯕꯥ ꯍꯧꯔꯦ꯫',
    game_completed: 'ꯌꯥꯝꯅꯥ ꯐꯔꯦ! ꯉꯁꯤꯒꯤ ꯃꯁꯥꯟꯅꯥ ꯃꯄꯨꯡ ꯐꯥꯔꯦ꯫',
    open_caregiver: 'ꯀꯦꯌꯔꯒꯤꯚꯔ ꯄꯣꯔꯇꯦꯜ ꯍꯥꯡꯗꯣꯛꯂꯦ꯫',
    back_to_dashboard: 'ꯃꯔꯨꯑꯣꯏꯕꯥ ꯂꯃꯥꯏꯗꯥ ꯍꯜꯂꯛꯂꯦ꯫',
    open_settings: 'ꯁꯦꯇꯤꯡꯁ ꯍꯥꯡꯗꯣꯛꯂꯦ꯫',
    error_occurred: 'ꯑꯁꯣꯌꯕꯥ ꯑꯃꯥ ꯣꯛꯂꯦ꯫ ꯑꯃꯨꯛ ꯍꯟꯅꯥ ꯍꯣꯠꯅꯕꯤꯌꯨ꯫',
    mic_listening: 'ꯑꯩꯍꯥꯛ ꯇꯥꯔꯤ꯫ ꯍꯥꯏꯕꯤꯌꯨ...',
    mic_clarification: 'ꯑꯩꯍꯥꯛꯅꯥ ꯇꯥꯕꯥ ꯉꯃꯈꯤꯗꯦ꯫ ꯑꯃꯨꯛ ꯍꯟꯅꯥ ꯍꯥꯏꯕꯤꯌꯨ꯫',
    emergency_activated: 'ꯑꯀꯅꯕꯥ ꯃꯇꯦꯡ ꯍꯧꯔꯦ꯫ ꯀꯦꯌꯔꯒꯤꯚꯔꯒꯤꯗꯃꯛ ꯋꯥ ꯍꯥꯏꯕꯤꯌꯨ꯫',
    emergency_sent: 'ꯅꯈꯣꯏꯒꯤ ꯄꯥꯎ ꯀꯦꯌꯔꯒꯤꯚꯔꯗꯥ ꯊꯥꯈ꯭ꯔꯦ꯫ ꯅꯨꯡꯉꯥꯏꯅꯥ ꯂꯩꯕꯤꯌꯨ꯫',
    emergency_cancelled: 'ꯑꯀꯅꯕꯥ ꯃꯇꯦꯡ ꯂꯦꯞꯈ꯭ꯔꯦ꯫',
  },

  // Khasi
  kha: {
    welcome_home: 'Sngewbha ban wan sha Recallia. To ngin sdang ia ki kam kiba mynta ka sngi.',
    language_selected: 'Phi la jied ia ka ktien Khasi. Baroh ki jingbatai kin long ha ka ktien Khasi.',
    signin_success: 'Phi la rung shapoh bha.',
    signup_success: 'La thaw ia ka account bathymmai.',
    signout_success: 'Phi la mih noh. Khublei shibun!',
    start_picture_recall: 'Ka jingpynkynmaw dur ka la sdang. Peit bha ia ki dur.',
    start_sequence_memory: 'Ka jingpynkynmaw ryngkat rynmaw ka la sdang.',
    start_object_association: 'Ka jingiadei jong ki tiar ka la sdang.',
    start_story_recall: 'Ka jingpule puriskam ka la sdang. Pule suk suk.',
    game_completed: 'Kaba bha shibun! Phi la pyndep ia ka kam.',
    open_caregiver: 'Ka Caregiver Portal ka la plie.',
    back_to_dashboard: 'La leit phai sha ka dashboard.',
    open_settings: 'La plie ia ki Settings.',
    error_occurred: 'Don jingbakla. Sngewbha ban pyrshang biang.',
    mic_listening: 'Nga dang sngap. Sngewbha ban kren...',
    mic_clarification: 'Nga khlem sngewthuh bha. Sngewbha ban kren biang.',
    emergency_activated: 'Ka jingiarap kyrkieh ka la sdang. Kren ia ka jingthoh sha u nongsumar.',
    emergency_sent: 'La phah ia ka khubor sha u nongsumar. Kynmaw ban shongsuk.',
    emergency_cancelled: 'La pynsangeh ia ka jingiarap kyrkieh.',
  },

  // Mizo (Mizo ṭawng)
  lus: {
    welcome_home: 'Recallia ah kan lo lawm a che. Vawiin thluak sawizawina i ṭan ang u.',
    language_selected: 'Mizo ṭawng i thlang e. Kaihhruaina zawng zawng Mizo ṭawngin a awm ang.',
    signin_success: 'Hlawhtling takin i lut ta e.',
    signup_success: 'Account thar i siam ta. Recallia ah kan lo lawm a che!',
    signout_success: 'I chhuak ta. Ni hman nuam le!',
    start_picture_recall: 'Thlalak hriatreng game a inṭan e. Thlalakte uluk takin en rawh le.',
    start_sequence_memory: 'Indawt dan hriatreng game a inṭan e.',
    start_object_association: 'Thil inhmeh zawn game a inṭan e.',
    start_story_recall: 'Thawnthu hriatreng game a inṭan e. Dam takin chhiar rawh le.',
    game_completed: 'I ti ṭha lutuk e! Vawiin hun i zo ta.',
    open_caregiver: 'Enkawltu phek i hawng ta e.',
    back_to_dashboard: 'Phek pui lamah kan kir leh ta e.',
    open_settings: 'Settings i hawng ta e.',
    error_occurred: 'Dik lo a awm tlat mai. Khawngaihin han tum nawn leh teh.',
    mic_listening: 'Ka ngaithla e. Han sawi rawh le...',
    mic_clarification: 'Ka hre chiang thei mai lo. Khawngaihin han sawi nawn leh teh.',
    emergency_activated: 'Ṭanpui ngaihna a inṭan e. Enkawltu tan thuchah han sawi rawh le.',
    emergency_sent: 'I thuchah chu enkawltu hnenah thawn a ni ta e. Lo hahdam rawh le.',
    emergency_cancelled: 'Ṭanpui ngaihna sut a ni e.',
  },

  // Ao (Ao Naga)
  ao: {
    welcome_home: 'Recallia nung pela agizüker. Tanü asoshi shisatsü asaya tenzükdi.',
    language_selected: 'Ao oshi shimtetogo. Oset ajak Ao oshi nung angutsü.',
    signin_success: 'Kanga junga login süogo.',
    signup_success: 'Account tasenbo yangluogo. Recallia nung pelaa agizüker!',
    signout_success: 'Sign out süogo. Anogo tajung ka agitsü sarasademtsür!',
    start_picture_recall: 'Noksa bilemtetba asaya tenzükogo. Noksa junga reprangang.',
    start_sequence_memory: 'Teshimtetba bilemtetba asaya tenzükogo.',
    start_object_association: 'Oset medemer asaya tenzükogo.',
    start_story_recall: 'Otsü züngba aser bilemtetba asaya tenzükogo.',
    game_completed: 'Kanga junga tembangogo! Tanü mapa atalokogo.',
    open_caregiver: 'Caregiver Portal lapokogo.',
    back_to_dashboard: 'Main dashboard-i shilogo.',
    open_settings: 'Settings lapokogo.',
    error_occurred: 'Tai adokogo. Maneni mepishi-a asadangang.',
    mic_listening: 'Ni angaa lir. Jembirang...',
    mic_clarification: 'Ni mebilemtet. Mepishir tanaben jembirang.',
    emergency_activated: 'Emergency yariba tenzükogo. Caregiver asoshi o jembirang.',
    emergency_sent: 'Emergency o caregiver dangi yokogo. Shisabulua teti aliba agi tajung.',
    emergency_cancelled: 'Emergency yariba anendaktsüogo.',
  },

  // Nepali (नेपाली)
  ne: {
    welcome_home: 'रिकलियामा स्वागत छ। आजको मानसिक स्वास्थ्य अभ्यास सुरु गरौं।',
    language_selected: 'तपाईंले नेपाली भाषा रोज्नुभएको छ। अब सबै निर्देशनहरू नेपालीमा सुन्न पाइनेछ।',
    signin_success: 'तपाईं सफलतापूर्वक प्रवेश गर्नुभएको छ।',
    signup_success: 'नयाँ खाता सिर्जना भयो। रिकलियामा हार्दिक स्वागत छ!',
    signout_success: 'तपाईं बाहिर निस्कनुभएको छ। शुभ दिन!',
    start_picture_recall: 'तस्बिर स्मरण अभ्यास सुरु भयो। स्क्रिनमा रहेका तस्बिरहरू ध्यानपूर्वक हेर्नुहोस्।',
    start_sequence_memory: 'क्रम स्मरण अभ्यास सुरु भयो। चम्किने रङहरूको क्रम याद राख्नुहोस्।',
    start_object_association: 'शब्द सम्बन्ध अभ्यास सुरु भयो। सही मिल्दो विकल्प छान्नुहोस्।',
    start_story_recall: 'कथा स्मरण अभ्यास सुरु भयो। कथा शान्तपूर्वक पढ्नुहोस्।',
    game_completed: 'धेरै राम्रो! तपाईंले आजको अभ्यास सफलतापूर्वक पूरा गर्नुभयो।',
    open_caregiver: 'हेरचाहकर्ता पोर्टल खोलिएको छ। आफ्नो साप्ताहिक प्रगति हेर्नुहोस्।',
    back_to_dashboard: 'मुख्य पृष्ठमा फर्कियौं।',
    open_settings: 'भाषा तथा आवाज सेटिङ्स खोलिएको छ।',
    error_occurred: 'त्रुटि भयो। कृपया फेरि प्रयास गर्नुहोस्।',
    mic_listening: 'म सुन्दै छु। कृपया बोल्नुहोस्...',
    mic_clarification: 'मैले बुझ्न सकिनँ। कृपया फेरि स्पष्ट रूपमा बोल्नुहोस्।',
    emergency_activated: 'आपतकालीन सहायता सक्रिय भयो। आफ्नो हेरचाहकर्ताका लागि सन्देश बोल्नुहोस्।',
    emergency_sent: 'तपाईंको आपतकालीन सन्देश हेरचाहकर्तालाई पठाइयो। शान्त रहनुहोस्, सहायता आउँदैछ।',
    emergency_cancelled: 'आपतकालीन सहायता रद्द गरियो।',
  },

  // Kokborok (ককবরক)
  kok: {
    welcome_home: 'Recallia o khulumkha. Tini no brain activity chengnai.',
    language_selected: 'Kokborok kokno seichha. Tei kokborok kok tei voice support mannai.',
    signin_success: 'Kahmkhe sign in khlaikha.',
    signup_success: 'Ktal account bngkha. Recallia o khulumkha!',
    signout_success: 'Sign out khlaikha. Sal kaham!',
    start_picture_recall: 'Noksa uanama game chengkha. Noksano kahmkhe nai.',
    start_sequence_memory: 'Sequence memory game chengkha.',
    start_object_association: 'Object association game chengkha.',
    start_story_recall: 'Kokboma uanama game chengkha. Poridi.',
    game_completed: 'Belai kaham! Tini no activity pai-kha.',
    open_caregiver: 'Caregiver Portal phaikha.',
    back_to_dashboard: 'Main dashboard o thangkha.',
    open_settings: 'Settings phaikha.',
    error_occurred: 'Gorom khlaikha. Apsa try khlaidi.',
    mic_listening: 'Ang khnakha. Saidi...',
    mic_clarification: 'Ang bujiya manliya. Apsa kahmkhe saidi.',
    emergency_activated: 'Emergency assistance chengkha. Caregiver ni bagwi kok saidi.',
    emergency_sent: 'Emergency message caregiver no rwkha. Kahmkhe tongdi, help phainai.',
    emergency_cancelled: 'Emergency cancel khlaikha.',
  },

  // English
  en: {
    welcome_home: "Welcome to Recallia. Let's begin today's gentle cognitive activities.",
    language_selected: 'You have selected English. All voice guidance and instructions will be in English.',
    signin_success: 'You have successfully signed in. Your activities are ready.',
    signup_success: 'Account created successfully. Welcome to Recallia!',
    signout_success: 'You have signed out. Have a wonderful day!',
    start_picture_recall: 'Picture Recall started. Memorize the objects shown on screen.',
    start_sequence_memory: 'Sequence Memory started. Watch the glowing pattern carefully.',
    start_object_association: 'Object Association started. Select the item that best connects with the prompt.',
    start_story_recall: 'Story Recall started. Read the narrative at your own gentle pace.',
    game_completed: 'Well done! You have completed this cognitive activity.',
    open_caregiver: 'Caregiver Portal opened. Reviewing weekly cognitive engagement and progress.',
    back_to_dashboard: 'Returned to main activities.',
    open_settings: 'Language and voice settings opened.',
    error_occurred: 'An error occurred. Please try again.',
    mic_listening: "I am listening. Please speak...",
    mic_clarification: "I didn't catch that clearly. Please speak again or ask a question.",
    emergency_activated: 'Emergency assistance activated. Please record your message for your caregiver now.',
    emergency_sent: 'Your emergency message has been sent to your caregiver. Please stay calm, help is on the way.',
    emergency_cancelled: 'Emergency assistance alert cancelled.',
  },
};

// Map languages to preferred speech synthesis BCP-47 fallback chains
export const BCP47_VOICE_MAP: Record<SupportedLanguageCode, string[]> = {
  as: ['as-IN', 'as', 'bn-IN', 'bn-BD', 'bn'],
  ne: ['ne-NP', 'ne-IN', 'ne', 'hi-IN', 'hi'],
  mni: ['mni-Mtei', 'mni-IN', 'mni', 'bn-IN', 'hi-IN'],
  kok: ['trp-IN', 'kok-IN', 'bn-IN', 'bn-BD', 'hi-IN'],
  kha: ['kha-IN', 'en-IN', 'en-GB', 'en-US'],
  lus: ['lus-IN', 'en-IN', 'en-GB', 'en-US'],
  nyi: ['njz-IN', 'en-IN', 'en-GB', 'hi-IN'],
  ao: ['njo-IN', 'en-IN', 'en-GB', 'en-US'],
  en: ['en-IN', 'en-US', 'en-GB'],
};

export function findVoiceForLanguage(lang: SupportedLanguageCode): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const candidateLocales = BCP47_VOICE_MAP[lang] || ['en-US'];

  // Priority 1: Exact or prefix match with candidate locales
  for (const locale of candidateLocales) {
    const match = voices.find((v) => {
      const vLang = v.lang.toLowerCase().replace('_', '-');
      const target = locale.toLowerCase();
      return vLang === target || vLang.startsWith(target.split('-')[0]);
    });
    if (match) return match;
  }

  // Priority 2: For Latin-based NE languages or English, fallback to Indian English voice
  if (['en', 'kha', 'lus', 'nyi', 'ao'].includes(lang)) {
    const indianVoice = voices.find((v) => v.lang.toLowerCase().includes('in') || v.lang.toLowerCase().startsWith('en'));
    if (indianVoice) return indianVoice;
    return voices[0] || null;
  }

  // For non-Latin Indic scripts (as, ne, mni, kok), DO NOT return an English voice!
  // Returning null lets SpeechSynthesisUtterance rely on utterance.lang so the OS
  // handles native Indic font synthesis rather than garbling it with an English voice.
  return null;
}
