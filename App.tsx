import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, type CameraType, useCameraPermissions } from 'expo-camera';
import * as MailComposer from 'expo-mail-composer';
import * as Speech from 'expo-speech';
import { StatusBar } from 'expo-status-bar';
import {
  loadTravelPlacesFromDatabase,
  travelPlaceSeeds,
  type PlaceImageKey,
  type StoredTravelPlace,
} from './src/data/placeStore';
import {
  ArrowLeft,
  Bell,
  BookOpen,
  Bookmark,
  Bot,
  CalendarCheck,
  Camera,
  CircleCheck,
  CircleDollarSign,
  CloudSun,
  Check,
  ChevronRight,
  Clock,
  Coffee,
  Compass,
  DollarSign,
  Download,
  FileText,
  Filter,
  Globe,
  Heart,
  History as HistoryIcon,
  Home,
  Info,
  Languages,
  LogOut,
  Mail,
  Map as MapIcon,
  MapPin,
  MessageCircle,
  Mic,
  Mountain,
  Navigation,
  Newspaper,
  ExternalLink,
  NotebookPen,
  Phone,
  Plane,
  PartyPopper,
  Plus,
  QrCode,
  Radio,
  RefreshCw,
  Search as SearchIcon,
  Send,
  Settings as SettingsIcon,
  Share2,
  ShieldAlert,
  ShoppingBag,
  ScanLine,
  Sparkles,
  Star,
  StickyNote,
  Trash2,
  TreePine,
  Type,
  User,
  UserCircle,
  Utensils,
  Video,
  Volume2,
  Waves,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Image,
  ImageSourcePropType,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { MockLiveCallRepository } from './src/features/live-preview/repositories/MockLiveCallRepository';
import { MockLivePreviewRepository } from './src/features/live-preview/repositories/MockLivePreviewRepository';
import { MockPaymentEscrowRepository } from './src/features/live-preview/repositories/MockPaymentEscrowRepository';
import { MockWalletRepository } from './src/features/wallet/repositories/MockWalletRepository';
import { WalletService } from './src/features/wallet/services/WalletService';
import type { WalletBalance } from './src/features/wallet/types';
import { fetchWordPressPosts, fetchWpConfigFromSheet, fetchWpConfigsFromSheet, fetchWordPressPostsFromConfigs, type WpArticle, type WpSheetConfig, DEFAULT_WP_URL, normalizeWpUrl } from './src/services/wordpress';
import { BroadcastJobNotificationService } from './src/features/notifications/services/JobNotificationService';
import { DemoGooglePlayBillingProvider, GooglePlayBillingProvider } from './src/features/payments/services/GooglePlayBillingProvider';
import { LiveCallService, LiveKitCallProviderAdapter } from './src/features/live-preview/services/LiveCallService';
import { LivePreviewService } from './src/features/live-preview/services/LivePreviewService';
import { PaymentEscrowService } from './src/features/live-preview/services/PaymentEscrowService';
import {
  LiveCallRoomScreen,
} from './src/features/live-preview/screens/LiveCallRoomScreen';
import {
  LivePreviewCompletionScreen,
} from './src/features/live-preview/screens/LivePreviewCompletionScreen';
import {
  LivePreviewRequestScreen,
  type LivePreviewPlaceSummary,
} from './src/features/live-preview/screens/LivePreviewRequestScreen';
import {
  LivePreviewWaitingScreen,
} from './src/features/live-preview/screens/LivePreviewWaitingScreen';
import {
  LivePreviewStatus,
  type LivePreviewActor,
  type LivePreviewActorRole,
  type LivePreviewRequest,
} from './src/features/live-preview/types';
import { MockLocalHelperRepository } from './src/features/local-helper/repositories/MockLocalHelperRepository';
import { LocalHelperService } from './src/features/local-helper/services/LocalHelperService';
import { analyzeTravelImage, type VisionAnalysis, type VisionAnalysisMode } from './src/features/ai/services/visionApi';
import { askTravelAi } from './src/features/ai/services/chatApi';
import { useAppLocation, type AppCoordinates, type AppLocationPermission } from './src/features/location/use-app-location';
import {
  LocalHelperEarningsScreen,
} from './src/features/local-helper/screens/LocalHelperEarningsScreen';
import {
  LocalHelperJobDetailScreen,
} from './src/features/local-helper/screens/LocalHelperJobDetailScreen';
import {
  LocalHelperJobsScreen,
} from './src/features/local-helper/screens/LocalHelperJobsScreen';
import {
  LocalHelperOnboardingScreen,
} from './src/features/local-helper/screens/LocalHelperOnboardingScreen';
import type {
  LocalHelperEarning,
  LocalHelperJob,
  LocalHelperProfile,
  SaveLocalHelperProfileInput,
} from './src/features/local-helper/types';
import { QrLoginScanner } from './src/features/account/components/QrLoginScanner';
import {
  approveQrLoginSession,
  createQrLoginSession,
  parseQrLoginPayload,
  pollQrLoginSession,
  verifyQrWebSession,
  type QrLoginPollResult,
  type QrLoginSession,
  type QrLoginUser,
} from './src/features/account/services/qrLogin';
import { qrLoginDataUrl } from './src/features/account/services/qrImage';
import { requestQrScannerPermission } from './src/features/account/services/qrScanner';
import {
  accountAuthErrorMessage,
  configureAccountAuth,
  getAccountIdToken,
  observeAccountAuth,
  signInWithGoogleAccount,
  signOutAccount,
  type AccountAuthUser,
} from './src/features/account/services/firebaseAccount';
import { getOrCreateGuestSession, getStoredGuestSession, type GuestSession } from './src/features/account/services/guest-session';
import { AppLanguageProvider, translateStaticText, useTranslatedData } from './src/lib/translation';
import {
  PlaceRealityCard,
  RealityActionButtons,
  RealityScoreCard,
  TravelDecisionCard,
} from './src/features/reality-layer/components/RealityLayerCards';
import { buildDemoRealityLayer } from './src/features/reality-layer/services/demoRealityLayer';
import type { TranslationLanguageCode } from './src/lib/translation/language';
import { getDistanceKm, roundDistanceKm } from './src/lib/location/distance';
import { MemberVideoCallScreen } from './src/features/member-calls/screens/MemberVideoCallScreen';
import { getMemberSocialOverview, registerMemberPushToken } from './src/features/member-calls/services/member-social-api';
import { initializeMemberNotifications, listenForMemberNotificationPress, showMemberNotification, type MemberNotification } from './src/features/member-calls/services/member-notifications';
import { CallTone } from './src/features/member-calls/components/CallTone';
import { LiveTeamScreen } from './src/features/live-team/screens/live-team-screen';
import { normalizeLiveTeamCode } from './src/features/live-team/services/live-team-code';

/* ============================================================
 *  Domain types
 * ============================================================ */

type BaseLocale = 'en' | 'vi';
type Locale = TranslationLanguageCode;
type Language =
  | 'English'
  | 'Vietnamese'
  | 'Korean'
  | 'Japanese'
  | 'Chinese'
  | 'Chinese Traditional'
  | 'Thai'
  | 'French'
  | 'German'
  | 'Spanish';
type Purpose =
  | 'Travel'
  | 'Sightseeing'
  | 'Food & Culinary'
  | 'Culture & History'
  | 'Văn hóa'
  | 'Khác';
type City =
  | 'TP. Hồ Chí Minh'
  | 'Hà Nội'
  | 'Đà Nẵng'
  | 'Hội An'
  | 'Huế'
  | 'Hạ Long'
  | 'Nha Trang'
  | 'Đà Lạt'
  | 'Ninh Bình'
  | 'Sa Pa'
  | 'Quảng Bình'
  | 'Phú Quốc'
  | 'Mũi Né'
  | 'Cần Thơ'
  | 'Quy Nhơn'
  | 'Hà Giang'
  | 'Vũng Tàu'
  | 'Other';

type TabId =
  | 'home'
  | 'trips'
  | 'saved'
  | 'notifications'
  | 'currency'
  | 'nearby'
  | 'explore'
  | 'place_detail'
  | 'food'
  | 'food_detail'
  | 'culture'
  | 'phrases'
  | 'emergency'
  | 'ai'
  | 'itinerary_preview'
  | 'itinerary_email'
  | 'itinerary_pdf'
  | 'favorites'
  | 'history'
  | 'account'
  | 'search'
  | 'settings'
  | 'language'
  | 'filter'
  | 'map'
  | 'offline'
  | 'member_video_call'
  | 'live_team'
  | 'live_preview_request'
  | 'live_preview_waiting'
  | 'live_call_room'
  | 'live_preview_completion'
  | 'local_helper_onboarding'
  | 'local_helper_jobs'
  | 'local_helper_job_detail'
  | 'local_helper_earnings';

type SavedItemType = 'place' | 'food' | 'phrase' | 'culture';

type UserProfile = {
  language: Language;
  purpose: Purpose;
  currentCity: City;
  selectedCities?: City[];
  tripDays: number;
};

type Place = {
  id: string;
  name: string;
  city: City;
  category: string;
  description: string;
  history: string;
  bestTime: string;
  ticketPrice: string;
  openHours: string;
  lat: number;
  lng: number;
  tags: string[];
  whyGo: string;
  travelTip: string;
  image: ImageSourcePropType;
};

type Food = {
  id: string;
  name: string;
  englishName: string;
  region: string;
  ingredients: string[];
  spicyLevel: number;
  priceRange: string;
  allergens: string[];
  howToOrder: string;
  pronunciation: string;
  image: ImageSourcePropType;
};

type CultureTopic = {
  id: string;
  title: string;
  category: string;
  explanation: string;
  dos: string[];
  donts: string[];
};

type Phrase = {
  id: string;
  situation: string;
  english: string;
  vietnamese: string;
  pronunciation: string;
  difficulty: 'easy' | 'medium';
};

type ChatMessage = {
  id: string;
  from: 'user' | 'assistant';
  text: string;
};

type SavedItem = {
  id: string;
  type: SavedItemType;
};

type GoogleUser = {
  id: string;
  email: string;
  name: string;
  givenName?: string;
  picture?: string;
  verifiedEmail: boolean;
};

type AuthSessionState = {
  provider: 'google';
  user: GoogleUser;
  signedInAt: string;
  lastSeenAt: string;
};

type ActivityHistoryType =
  | 'app'
  | 'auth'
  | 'profile'
  | 'navigation'
  | 'search'
  | 'filter'
  | 'content'
  | 'favorite'
  | 'ai'
  | 'itinerary'
  | 'email'
  | 'settings';

type ActivityHistoryEntry = {
  id: string;
  type: ActivityHistoryType;
  title: string;
  detail?: string;
  timestamp: string;
};

type ItineraryConfirmation = {
  id: string;
  title: string;
  prompt: string;
  body: string;
  city: City;
  days: number;
  style: TripStyle;
  createdAt: string;
};

type SettingsState = {
  themeMode: 'light' | 'dark';
  notificationsEnabled: boolean;
  measurementUnit: 'metric' | 'imperial';
  fontScale: number;
  appVersion: string;
  wpNewsUrl: string;
};

type RecentSearch = {
  id: string;
  query: string;
  timestamp: string;
};

const SETTINGS_VERSION = '1.0.0';

const PROFILE_KEY = 'vinago-plus-profile';
const FAVORITES_KEY = 'vinago-plus-favorites';
const QR_WEB_SESSION_KEY = 'vinago-plus-web-qr-session';
const ACTIVITY_HISTORY_KEY = 'vinago-plus-activity-history';
const ANALYTICS_QUEUE_KEY = 'vinago-plus-analytics-queue';
const RECENT_SEARCHES_KEY = 'vinago-plus-recent-searches';
const SETTINGS_KEY = 'vinago-plus-settings';
const LEGACY_AUTH_SESSION_KEY = 'vinago-plus-auth-session';
const LOCATION_PROMPT_DISMISSED_KEY = 'vinago-plus-location-prompt-dismissed';

const ACTIVITY_HISTORY_LIMIT = 80;
const RECENT_SEARCHES_LIMIT = 8;
const FIREBASE_WEB_CLIENT_ID =
  '959396812028-5uedsvgcclv8ngjs97enll5tlmld45oa.apps.googleusercontent.com';

const googleAccountAuthConfig = {
  // iOS reads CLIENT_ID from GoogleService-Info.plist. The web client ID here is
  // the Firebase server client, not the browser login flow.
  googleServicePlistPath: 'GoogleService-Info',
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() || FIREBASE_WEB_CLIENT_ID,
};

configureAccountAuth(googleAccountAuthConfig);

const itineraryEmailEndpoint = process.env.EXPO_PUBLIC_ITINERARY_EMAIL_ENDPOINT;
const privacyPolicyUrl =
  process.env.EXPO_PUBLIC_PRIVACY_POLICY_URL ?? 'https://vinago.aiautotool.com/privacy-policy';

const livePreviewRepository = new MockLivePreviewRepository();
const liveCallRepository = new MockLiveCallRepository();
const paymentEscrowRepository = new MockPaymentEscrowRepository();
const walletRepository = new MockWalletRepository();
const walletService = new WalletService(walletRepository);
const livePreviewPaymentProvider = process.env.EXPO_PUBLIC_ENABLE_REAL_GOOGLE_PLAY_BILLING === 'true'
  ? new GooglePlayBillingProvider()
  : new DemoGooglePlayBillingProvider();
const jobNotificationService = new BroadcastJobNotificationService();
const localHelperRepository = new MockLocalHelperRepository(livePreviewRepository);
const liveCallService = new LiveCallService(liveCallRepository, new LiveKitCallProviderAdapter());
const paymentEscrowService = new PaymentEscrowService(livePreviewRepository, paymentEscrowRepository, walletService);
const livePreviewService = new LivePreviewService(
  livePreviewRepository,
  localHelperRepository,
  paymentEscrowService,
  liveCallService,
  jobNotificationService,
);
const localHelperService = new LocalHelperService(localHelperRepository, livePreviewService);

const analyticsConfig = {
  propertyName: 'vinago-e7476',
  propertyId: '542368554',
  streamId: '15118007638',
  measurementId: process.env.EXPO_PUBLIC_GA_MEASUREMENT_ID,
};
const analyticsSessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

type AnalyticsValue = string | number | boolean | null;
type AnalyticsParams = Record<string, AnalyticsValue | undefined>;
type AnalyticsEventName =
  | 'app_opened'
  | 'onboarding_started'
  | 'onboarding_completed'
  | 'profile_reset'
  | 'language_selected'
  | 'purpose_selected'
  | 'city_selected'
  | 'trip_days_selected'
  | 'screen_view'
  | 'tab_opened'
  | 'search_submitted'
  | 'filter_changed'
  | 'place_opened'
  | 'food_opened'
  | 'favorite_added'
  | 'favorite_removed'
  | 'ai_question_submitted'
  | 'itinerary_generated'
  | 'itinerary_saved'
  | 'itinerary_exported'
  | 'google_sign_in_started'
  | 'google_sign_in_completed'
  | 'google_sign_in_failed'
  | 'google_signed_out'
  | 'activity_history_cleared'
  | 'recent_search_cleared'
  | 'settings_changed'
  | 'offline_mode_viewed'
  | 'itinerary_email_requested'
  | 'itinerary_email_sent'
  | 'itinerary_email_failed';

type AnalyticsPayload = {
  eventName: AnalyticsEventName;
  params: Record<string, AnalyticsValue>;
  timestamp: string;
};

const languages: Language[] = [
  'Vietnamese',
  'English',
  'Korean',
  'Japanese',
  'Chinese',
  'Chinese Traditional',
  'Thai',
  'French',
  'German',
  'Spanish',
];
const localeByLanguage: Record<Language, Locale> = {
  'Chinese Traditional': 'zh-TW',
  Chinese: 'zh-CN',
  English: 'en',
  French: 'fr',
  German: 'de',
  Japanese: 'ja',
  Korean: 'ko',
  Spanish: 'es',
  Thai: 'th',
  Vietnamese: 'vi',
};
const languageLabels: Record<Language, string> = {
  'Chinese Traditional': '繁體中文',
  Chinese: '中文',
  English: 'English',
  French: 'Français',
  German: 'Deutsch',
  Japanese: '日本語',
  Korean: '한국어',
  Spanish: 'Español',
  Thai: 'ไทย',
  Vietnamese: 'Tiếng Việt',
};

const languageNativeNames: Record<Language, string> = {
  'Chinese Traditional': '繁體中文',
  Chinese: '简体中文',
  English: 'English',
  French: 'Français',
  German: 'Deutsch',
  Japanese: '日本語',
  Korean: '한국어',
  Spanish: 'Español',
  Thai: 'ไทย',
  Vietnamese: 'Tiếng Việt',
};

const guestModeLabels: Record<Language, string> = {
  English: 'Guest mode · No sign-in required',
  Vietnamese: 'Chế độ Guest · Không cần đăng nhập',
  Korean: '게스트 모드 · 로그인 불필요',
  Japanese: 'ゲストモード · ログイン不要',
  Chinese: '访客模式 · 无需登录',
  'Chinese Traditional': '訪客模式 · 無需登入',
  Thai: 'โหมดผู้เยี่ยมชม · ไม่ต้องเข้าสู่ระบบ',
  French: 'Mode invité · Connexion non requise',
  German: 'Gastmodus · Keine Anmeldung erforderlich',
  Spanish: 'Modo invitado · No requiere inicio de sesión',
};

const languageSecondaryNames: Record<Language, string> = {
  'Chinese Traditional': 'Chinese Traditional',
  Chinese: 'Chinese Simplified',
  English: 'English',
  French: 'French',
  German: 'German',
  Japanese: 'Japanese',
  Korean: 'Korean',
  Spanish: 'Spanish',
  Thai: 'Thai',
  Vietnamese: 'Vietnamese',
};

const languageFlags: Record<Language, string> = {
  'Chinese Traditional': '🇹🇼',
  Chinese: '🇨🇳',
  English: '🇬🇧',
  French: '🇫🇷',
  German: '🇩🇪',
  Japanese: '🇯🇵',
  Korean: '🇰🇷',
  Spanish: '🇪🇸',
  Thai: '🇹🇭',
  Vietnamese: '🇻🇳',
};

const purposes: Purpose[] = [
  'Travel',
  'Sightseeing',
  'Food & Culinary',
  'Culture & History',
  'Văn hóa',
  'Khác',
];

const purposeIcons: Record<Purpose, typeof Compass> = {
  Travel: Plane,
  Sightseeing: Compass,
  'Food & Culinary': Utensils,
  'Culture & History': TreePine,
  'Văn hóa': BookOpen,
  Khác: Sparkles,
};

// Re-export alias to avoid TS resolution order issues in this single file.

const cities: City[] = [
  'TP. Hồ Chí Minh',
  'Hà Nội',
  'Đà Nẵng',
  'Hội An',
  'Huế',
  'Hạ Long',
  'Nha Trang',
  'Đà Lạt',
  'Ninh Bình',
  'Sa Pa',
  'Quảng Bình',
  'Phú Quốc',
  'Mũi Né',
  'Cần Thơ',
  'Quy Nhơn',
  'Hà Giang',
  'Vũng Tàu',
  'Other',
];

const onboardingCities: City[] = [
  'TP. Hồ Chí Minh',
  'Hà Nội',
  'Đà Nẵng',
  'Hội An',
  'Huế',
  'Hạ Long',
  'Nha Trang',
  'Đà Lạt',
  'Ninh Bình',
  'Sa Pa',
  'Quảng Bình',
  'Phú Quốc',
  'Mũi Né',
  'Cần Thơ',
  'Quy Nhơn',
  'Hà Giang',
  'Vũng Tàu',
  'Other',
];

const defaultProfile: UserProfile = {
  language: 'English',
  purpose: 'Travel',
  currentCity: 'TP. Hồ Chí Minh',
  selectedCities: ['TP. Hồ Chí Minh'],
  tripDays: 3,
};

const defaultSettings: SettingsState = {
  themeMode: 'light',
  notificationsEnabled: true,
  measurementUnit: 'metric',
  fontScale: 1,
  appVersion: SETTINGS_VERSION,
  wpNewsUrl: DEFAULT_WP_URL,
};

/* ============================================================
 *  Translations
 * ============================================================ */

const translations = {
  en: {
    'app.name': 'Vinago+',
    'app.tagline': 'Your Vietnam Adventure',
    'app.companion': 'Vinago+ AI Travel Companion',
    'loading.title': 'Vinago+',

    /* Onboarding */
    'onboarding.welcomeTitle': 'Welcome to Vietnam! 🇻🇳',
    'onboarding.welcomeSubtitle': 'Explore. Taste. Experience.',
    'onboarding.alreadyHaveAccount': 'I already have an account',
    'onboarding.heroSubtitle':
      'Discover. Savor. Learn. Connect — all in one powerful travel companion.',
    'onboarding.chooseLanguage': 'Choose your language',
    'onboarding.continue': 'Continue',
    'onboarding.purposeTitle': "What's the purpose of your trip?",
    'onboarding.cityTitle': 'Which cities will you visit?',
    'onboarding.daysTitle': 'How many days are you staying?',
    'onboarding.tripDays': 'days',
    'onboarding.start': 'Start exploring',

    /* Bottom nav */
    'nav.explore': 'Explore',
    'nav.favorites': 'Favorites',
    'nav.trips': 'Trips',
    'nav.saved': 'Saved',
    'nav.ai': 'AI',
    'nav.history': 'History',
    'nav.account': 'Account',
    'memberCall.nav': 'Chat',
    'liveTeam.nav': 'Live Team',

    /* Top bar */
    'topbar.welcomeBack': 'Welcome back',
    'topbar.search': 'Search',

    /* Search */
    'search.title': 'Search',
    'search.placeholder': 'Search or ask AI...',
    'search.recent': 'Recent searches',
    'search.suggestions': 'Suggestions',
    'search.popularPlaces': 'Popular places',
    'search.popularFoods': 'Popular foods',
    'search.allResults': 'All results',
    'search.noResults': 'No results found',
    'search.noResultsBody': 'Try a different keyword.',
    'search.clearAll': 'Clear all',
    'search.related': 'Related',

    /* Home */
    'home.greeting': 'Good evening',
    'home.discoverTitle': 'Where do you want to go today?',
    'home.catalogTitle': 'Vietnam guide',
    'home.catalogPlaces': 'places',
    'home.catalogCities': 'cities',
    'home.catalogSaved': 'ready offline',
    'home.searchPlaceholder': 'Search anything or ask AI...',
    'home.quick.all': 'All',
    'home.quick.food': 'Food',
    'home.quick.stay': 'Nature',
    'home.quick.transport': 'History',
    'home.popularTitle': 'Popular destinations',
    'home.popularViewAll': 'View all',
    'home.experiencesTitle': 'Travel experiences you may enjoy',
    'home.nearbyTitle': 'Travel experiences you may enjoy',
    'home.selectedCities': 'Selected cities',
    'home.toolsTitle': 'Travel tools',
    'home.tool.explore': 'Places',
    'home.tool.food': 'Food',
    'home.tool.culture': 'Culture',
    'home.tool.phrases': 'Phrases',
    'home.tool.emergency': 'Emergency',
    'home.tool.ai': 'AI plan',
    'home.tool.map': 'Map',
    'home.tool.offline': 'Offline',
    'home.tool.nearby': 'Nearby',
    'home.tool.translate': 'Translate',
    'home.tool.currency': 'Currency',
    'home.tool.weather': 'Weather',

    /* Explore / Place */
    'explore.title': 'Destinations',
    'explore.countLabel': 'places available',
    'explore.allCities': 'All',
    'explore.viewAll': 'View all',
    'explore.noResults': 'No places match your filters',
    'explore.noResultsBody': 'Try a different city or category.',
    'place.aboutTitle': 'About',
    'place.whyGoTitle': 'Why visit',
    'place.tipsTitle': 'Travel tips',
    'place.bestTime': 'Best time',
    'place.ticket': 'Ticket',
    'place.openHours': 'Open hours',
    'place.tagsTitle': 'Tags',
    'place.askAi': 'Ask AI',
    'place.save': 'Save to favorites',
    'place.saved': 'Saved',
    'place.coordinates': 'Coordinates',
    'place.openInMaps': 'Open in Maps',

    /* Food */
    'food.title': 'Food',
    'food.all': 'All',
    'food.popular': 'Popular',
    'food.regional': 'Regional',
    'food.specialties': 'Specialties',
    'food.aboutTitle': 'About',
    'food.ingredientsTitle': 'Ingredients',
    'food.allergensTitle': 'Contains',
    'food.orderingTitle': 'How to order',
    'food.spice': 'Spice',
    'food.region': 'Region',
    'food.price': 'Price',
    'food.pronunciation': 'Pronunciation',
    'food.spicyLevel': 'Spice level',
    'food.askSpicy': 'Is it spicy?',
    'food.howToOrder': 'How to order?',

    /* Culture */
    'culture.title': 'Dos & Don’ts',
    'culture.do': 'Do',
    'culture.avoid': "Don't",
    'culture.eyebrow': 'Culture guide',

    /* Phrases */
    'phrases.title': 'Survival phrases',
    'phrases.all': 'All',
    'phrases.eyebrow': 'Survival Vietnamese',
    'phrases.audioSample': 'Audio sample',
    'phrases.tabAll': 'All',
    'phrases.tabGreetings': 'Greetings',
    'phrases.tabFood': 'Food',
    'phrases.tabEmergency': 'Emergency',
    'phrases.tabDirections': 'Directions',
    'phrases.tabShopping': 'Shopping',
    'emergency.title': 'Emergency numbers',
    'emergency.subtitle': 'Important numbers in Vietnam',
    'emergency.touristPolice': 'Tourist Police',
    'emergency.touristHotline': 'Tourist Hotline',

    /* AI / Itinerary */
    'ai.title': 'Vinago+ AI',
    'ai.online': 'Online',
    'ai.placeholder': 'Ask anything...',
    'ai.itineraryBuilder': 'Itinerary builder',
    'ai.itinerarySubtitle':
      'Tell me where you are going and how many days you have, I will create a smart plan.',
    'ai.buildItinerary': 'Build itinerary',
    'ai.previewTitle': 'Your itinerary',
    'ai.previewSubtitle': 'Review and save to favorites or send by email.',
    'ai.day': 'Day',
    'ai.save': 'Save',
    'ai.sendEmail': 'Send email',
    'ai.emailFormTitle': 'Send itinerary by email',
    'ai.emailFormSubtitle': 'The email will be sent to the address of your Google account.',
    'ai.emailIntro': 'Send your itinerary to yourself or a travel partner.',
    'ai.emailRecipient': 'Recipient email',
    'ai.emailSubject': 'Email subject',
    'ai.emailBody': 'Email content',
    'ai.emailSend': 'Send',
    'ai.exportPdf': 'Export PDF',
    'ai.pdfPreviewTitle': 'Itinerary PDF preview',
    'ai.pdfPreviewSubtitle': 'Review the content before exporting.',
    'ai.pdfExport': 'Export PDF',
    'ai.pdfShare': 'Share',
    'ai.emailRequired': 'Please sign in with Google before sending the email.',
    'ai.emailUnavailable': 'No email client is available on this device.',
    'ai.emailSent': 'Itinerary email sent successfully.',
    'ai.emailFailed': 'Could not send the email. Please try again later.',
    'common.askAi': 'Ask AI',

    /* Favorites */
    'favorites.title': 'Favorites',
    'favorites.tabs.all': 'All',
    'favorites.tabs.places': 'Places',
    'favorites.tabs.food': 'Food',
    'favorites.tabs.phrases': 'Phrases',
    'favorites.empty.title': 'No favorites yet',
    'favorites.empty.body': 'Tap the heart on a place, dish or phrase to add it here.',

    /* History */
    'history.title': 'Activity history',
    'history.subtitle': 'Recent actions on this device',
    'history.today': 'Today',
    'history.earlier': 'Earlier',
    'history.empty.title': 'No activity yet',
    'history.empty.body': 'Your recent actions will show up here.',
    'history.clear': 'Clear all',

    /* Account / Profile */
    'account.title': 'Account',
    'account.accountInfo': 'Account information',
    'account.displayName': 'Display name',
    'account.email': 'Email',
    'account.memberSince': 'Member since',
    'account.languageSection': 'Language & region',
    'account.settings': 'Settings',
    'account.privacy': 'Privacy policy',
    'account.support': 'Support center',
    'account.terms': 'Terms of use',
    'account.signOut': 'Sign out',
    'account.notSignedIn.title': 'Not signed in',
    'account.notSignedIn.body': 'Sign in with Google to sync your favorites and itinerary emails.',
    'account.signIn': 'Sign in with Google',
    'account.signedInAs': 'Signed in as',
    'account.verification': 'Verification',
    'account.verified': 'Verified',
    'account.unverified': 'Unverified',
    'account.qrWebTitle': 'Sign in with the mobile app',
    'account.qrWebBody': 'Open Vinago+ on your phone, sign in with Google, then scan this QR code.',
    'account.qrWaiting': 'Waiting for the mobile app to scan...',
    'account.qrExpired': 'QR login expired. Creating a new code...',
    'account.qrCreateFailed': 'Could not create a QR login code.',
    'account.qrCheckFailed': 'Could not check QR login status.',
    'account.qrRefresh': 'Create a new QR code',
    'account.qrRefreshing': 'Creating QR...',
    'account.qrScanWeb': 'Scan web login QR',
    'account.qrApproving': 'Approving QR...',
    'account.qrMobileReady': 'Scan the QR code on the web account screen.',
    'account.qrMobileSignedIn': 'Web login approved. Return to the browser to continue.',
    'account.qrMobileNeedLogin': 'Sign in with Google on this app before scanning a web login QR.',
    'account.qrMobileNeedToken': 'Please sign in with Google again before scanning. The saved session is missing a fresh Google token.',
    'account.qrCameraDenied': 'Camera permission is required to scan the web login QR.',

    /* Settings */
    'settings.title': 'Settings',
    'settings.notifications.title': 'Notifications',
    'settings.notifications.body': 'Receive travel tips and reminders',
    'settings.theme.title': 'Theme',
    'settings.theme.body': 'Light mode',
    'settings.units.title': 'Measurement units',
    'settings.units.body': 'Distance, weight, temperature',
    'settings.font.title': 'Font size',
    'settings.font.body': 'Adjust text size for readability',
    'settings.language.title': 'App language',
    'settings.language.body': 'Choose the language used in the app',
    'settings.version.title': 'App version',
    'settings.version.body': SETTINGS_VERSION,
    'settings.value.light': 'Light',
    'settings.value.dark': 'Dark',
    'settings.value.metric': 'Metric (km, °C)',
    'settings.value.imperial': 'Imperial (mi, °F)',

    /* Language screen */
    'language.title': 'Language support',
    'language.subtitle': 'Choose the language used across the app.',
    'language.done': 'Done',

    /* Filter modal */
    'filter.title': 'Filter',
    'filter.city': 'City',
    'filter.category': 'Category',
    'filter.priceRange': 'Price range',
    'filter.rating': 'Rating',
    'filter.apply': 'Apply',
    'filter.reset': 'Reset',
    'filter.results': '120 results',
    'filter.price.vnd': '0 VND — 1,000,000+ VND',
    'filter.rating.four': '4 stars & up',

    /* Offline */
    'offline.title': 'You are offline',
    'offline.subtitle':
      'Some features may not be available until you reconnect.',
    'offline.cached': 'Cached content available',
    'offline.retry': 'Retry connection',
    'offline.map': 'Maps',
    'offline.taxi': 'Taxi booking',
    'offline.liveChat': 'Live chat',
    'offline.retryCta': 'Try again',

    /* Map */
    'map.title': 'Map view',
    'map.subtitle': 'Tap a pin to see details.',
    'map.openExternal': 'Open in Maps',
    'map.loading': 'Loading OpenStreetMap...',
    'map.unavailable': 'Could not load OpenStreetMap. Open the location externally.',
    'map.attribution': '© OpenStreetMap contributors',

    /* Auth */
    'auth.signIn': 'Continue with Google',
    'auth.signingIn': 'Opening Google...',
    'auth.signOut': 'Sign out',
  },
  vi: {
    'app.name': 'Vinago+',
    'app.tagline': 'Cuộc phiêu lưu Việt Nam của bạn',
    'app.companion': 'Trợ lý du lịch AI Vinago+',
    'loading.title': 'Vinago+',

    'onboarding.welcomeTitle': 'Chào mừng đến với Việt Nam! 🇻🇳',
    'onboarding.welcomeSubtitle': 'Khám phá. Trải nghiệm. Yêu thương.',
    'onboarding.alreadyHaveAccount': 'Tôi đã có tài khoản',
    'onboarding.heroSubtitle':
      'Khám phá. Thưởng thức. Học hỏi. Kết nối — tất cả trong một trợ lý du lịch mạnh mẽ.',
    'onboarding.chooseLanguage': 'Chọn ngôn ngữ của bạn',
    'onboarding.continue': 'Tiếp tục',
    'onboarding.purposeTitle': 'Mục đích chuyến đi của bạn là gì?',
    'onboarding.cityTitle': 'Bạn sẽ đến thăm những thành phố nào?',
    'onboarding.daysTitle': 'Bạn dự định ở bao nhiêu ngày?',
    'onboarding.tripDays': 'ngày / days',
    'onboarding.start': 'Bắt đầu',

    'nav.explore': 'Khám phá',
    'nav.favorites': 'Yêu thích',
    'nav.trips': 'Chuyến đi',
    'nav.saved': 'Đã lưu',
    'nav.ai': 'AI',
    'nav.history': 'Lịch sử',
    'nav.account': 'Tài khoản',
    'memberCall.nav': 'Chat',
    'liveTeam.nav': 'Đội du lịch',

    'topbar.welcomeBack': 'Chào mừng trở lại',
    'topbar.search': 'Tìm kiếm',

    'search.title': 'Tìm kiếm',
    'search.placeholder': 'Tìm kiếm hoặc hỏi AI...',
    'search.recent': 'Tìm kiếm gần đây',
    'search.suggestions': 'Gợi ý',
    'search.popularPlaces': 'Địa điểm phổ biến',
    'search.popularFoods': 'Món ăn phổ biến',
    'search.allResults': 'Tất cả kết quả',
    'search.noResults': 'Không tìm thấy kết quả',
    'search.noResultsBody': 'Hãy thử một từ khóa khác.',
    'search.clearAll': 'Xóa tất cả',
    'search.related': 'Liên quan',

    'home.greeting': 'Chào buổi tối',
    'home.discoverTitle': 'Hôm nay bạn muốn đi đâu?',
    'home.catalogTitle': 'Cẩm nang Việt Nam',
    'home.catalogPlaces': 'địa điểm',
    'home.catalogCities': 'thành phố',
    'home.catalogSaved': 'sẵn sàng offline',
    'home.searchPlaceholder': 'Tìm bất cứ điều gì hoặc hỏi AI...',
    'home.quick.all': 'Tất cả',
    'home.quick.food': 'Món ăn',
    'home.quick.stay': 'Thiên nhiên',
    'home.quick.transport': 'Lịch sử',
    'home.popularTitle': 'Địa điểm nổi bật',
    'home.popularViewAll': 'Xem tất cả',
    'home.experiencesTitle': 'Trải nghiệm không thể bỏ lỡ',
    'home.nearbyTitle': 'Trải nghiệm không thể bỏ lỡ',
    'home.selectedCities': 'Thành phố đã chọn',
    'home.toolsTitle': 'Công cụ du lịch',
    'home.tool.explore': 'Địa điểm',
    'home.tool.food': 'Món ăn',
    'home.tool.culture': 'Văn hóa',
    'home.tool.phrases': 'Câu giao tiếp',
    'home.tool.emergency': 'Khẩn cấp',
    'home.tool.ai': 'AI lịch trình',
    'home.tool.map': 'Bản đồ',
    'home.tool.offline': 'Ngoại tuyến',
    'home.tool.nearby': 'Gần đây',
    'home.tool.translate': 'Dịch',
    'home.tool.currency': 'Tiền tệ',
    'home.tool.weather': 'Thời tiết',
    'home.newsTitle': 'Tin tức & Cập nhật',
    'home.newsSubtitle': 'Cập nhật từ WordPress (aiautotool.com)',
    'home.newsConfig': 'Cấu hình URL',
    'home.newsRefresh': 'Làm mới',

    'explore.title': 'Địa điểm',
    'explore.countLabel': 'địa điểm phù hợp',
    'explore.allCities': 'Tất cả',
    'explore.viewAll': 'Xem tất cả',
    'explore.noResults': 'Không có địa điểm phù hợp',
    'explore.noResultsBody': 'Hãy thử thành phố hoặc danh mục khác.',
    'place.aboutTitle': 'Giới thiệu',
    'place.whyGoTitle': 'Vì sao nên đến',
    'place.tipsTitle': 'Mẹo du lịch',
    'place.bestTime': 'Thời điểm đẹp nhất',
    'place.ticket': 'Giá vé',
    'place.openHours': 'Giờ mở cửa',
    'place.tagsTitle': 'Thẻ',
    'place.askAi': 'Hỏi AI',
    'place.save': 'Lưu vào yêu thích',
    'place.saved': 'Đã lưu',
    'place.coordinates': 'Tọa độ',
    'place.openInMaps': 'Mở trong bản đồ',

    'food.title': 'Món ăn',
    'food.all': 'Tất cả',
    'food.popular': 'Phổ biến',
    'food.regional': 'Vùng miền',
    'food.specialties': 'Đặc sản',
    'food.aboutTitle': 'Giới thiệu',
    'food.ingredientsTitle': 'Thành phần',
    'food.allergensTitle': 'Có chứa',
    'food.orderingTitle': 'Cách gọi món',
    'food.spice': 'Độ cay',
    'food.region': 'Vùng miền',
    'food.price': 'Giá',
    'food.pronunciation': 'Phát âm',
    'food.spicyLevel': 'Độ cay',
    'food.askSpicy': 'Có cay không?',
    'food.howToOrder': 'Cách gọi món?',

    'culture.title': 'Nên & Không nên',
    'culture.do': 'Nên',
    'culture.avoid': 'Không nên',
    'culture.eyebrow': 'Hướng dẫn văn hóa',

    'phrases.title': 'Câu giao tiếp',
    'phrases.all': 'Tất cả',
    'phrases.eyebrow': 'Tiếng Việt sinh tồn',
    'phrases.audioSample': 'Âm thanh mẫu',
    'phrases.tabAll': 'Tất cả',
    'phrases.tabGreetings': 'Xin chào',
    'phrases.tabFood': 'Món ăn',
    'phrases.tabEmergency': 'Khẩn cấp',
    'phrases.tabDirections': 'Chỉ đường',
    'phrases.tabShopping': 'Mua sắm',
    'emergency.title': 'Số điện thoại khẩn cấp',
    'emergency.subtitle': 'Các số quan trọng tại Việt Nam',
    'emergency.touristPolice': 'Cảnh sát du lịch',
    'emergency.touristHotline': 'Tổng đài du lịch',

    'ai.title': 'Vinago+ AI',
    'ai.online': 'Trực tuyến',
    'ai.placeholder': 'Hỏi bất cứ điều gì...',
    'ai.itineraryBuilder': 'Lập lịch trình',
    'ai.itinerarySubtitle':
      'Nói cho tôi nơi bạn đến và số ngày, tôi sẽ tạo một kế hoạch thông minh.',
    'ai.buildItinerary': 'Lên lịch trình',
    'ai.previewTitle': 'Lịch trình của bạn',
    'ai.previewSubtitle': 'Xem lại và lưu vào yêu thích hoặc gửi qua email.',
    'ai.day': 'Ngày',
    'ai.save': 'Lưu',
    'ai.sendEmail': 'Gửi email',
    'ai.emailFormTitle': 'Gửi lịch trình qua email',
    'ai.emailFormSubtitle': 'Email sẽ được gửi đến địa chỉ tài khoản Google của bạn.',
    'ai.emailIntro': 'Gửi lịch trình cho bạn hoặc người đồng hành.',
    'ai.emailRecipient': 'Email người nhận',
    'ai.emailSubject': 'Tiêu đề email',
    'ai.emailBody': 'Nội dung email',
    'ai.emailSend': 'Gửi email',
    'ai.exportPdf': 'Xuất PDF',
    'ai.pdfPreviewTitle': 'Xem trước lịch trình PDF',
    'ai.pdfPreviewSubtitle': 'Xem lại nội dung trước khi xuất.',
    'ai.pdfExport': 'Tải PDF',
    'ai.pdfShare': 'Chia sẻ',
    'ai.emailRequired': 'Vui lòng đăng nhập Google trước khi gửi email.',
    'ai.emailUnavailable': 'Thiết bị chưa có ứng dụng email khả dụng.',
    'ai.emailSent': 'Đã gửi email lịch trình thành công.',
    'ai.emailFailed': 'Chưa gửi được email. Vui lòng thử lại sau.',
    'common.askAi': 'Hỏi AI',

    'favorites.title': 'Yêu thích',
    'favorites.tabs.all': 'Tất cả',
    'favorites.tabs.places': 'Địa điểm',
    'favorites.tabs.food': 'Món ăn',
    'favorites.tabs.phrases': 'Câu giao tiếp',
    'favorites.empty.title': 'Chưa có mục yêu thích',
    'favorites.empty.body': 'Nhấn vào biểu tượng trái tim để thêm địa điểm, món ăn hoặc câu giao tiếp.',

    'history.title': 'Lịch sử hoạt động',
    'history.subtitle': 'Các thao tác gần đây trên thiết bị này',
    'history.today': 'Hôm nay',
    'history.earlier': 'Trước đó',
    'history.empty.title': 'Chưa có hoạt động',
    'history.empty.body': 'Các thao tác gần đây của bạn sẽ hiển thị ở đây.',
    'history.clear': 'Xóa tất cả',

    'account.title': 'Tài khoản',
    'account.accountInfo': 'Thông tin tài khoản',
    'account.displayName': 'Tên hiển thị',
    'account.email': 'Email',
    'account.memberSince': 'Thành viên từ',
    'account.languageSection': 'Ngôn ngữ & khu vực',
    'account.settings': 'Cài đặt',
    'account.privacy': 'Chính sách bảo mật',
    'account.support': 'Trung tâm hỗ trợ',
    'account.terms': 'Điều khoản sử dụng',
    'account.signOut': 'Đăng xuất',
    'account.notSignedIn.title': 'Chưa đăng nhập',
    'account.notSignedIn.body': 'Đăng nhập bằng Google để đồng bộ yêu thích và email lịch trình.',
    'account.signIn': 'Đăng nhập với Google',
    'account.signedInAs': 'Đã đăng nhập',
    'account.verification': 'Xác minh',
    'account.verified': 'Đã xác minh',
    'account.unverified': 'Chưa xác minh',
    'account.qrWebTitle': 'Đăng nhập bằng app mobile',
    'account.qrWebBody': 'Mở Vinago+ trên điện thoại, đăng nhập Google, rồi quét mã QR này.',
    'account.qrWaiting': 'Đang chờ app mobile quét mã QR...',
    'account.qrExpired': 'Mã QR đã hết hạn. Đang tạo mã mới...',
    'account.qrCreateFailed': 'Chưa thể tạo mã QR đăng nhập.',
    'account.qrCheckFailed': 'Chưa thể kiểm tra trạng thái đăng nhập QR.',
    'account.qrRefresh': 'Tạo mã QR mới',
    'account.qrRefreshing': 'Đang tạo QR...',
    'account.qrScanWeb': 'Quét QR đăng nhập web',
    'account.qrApproving': 'Đang xác nhận QR...',
    'account.qrMobileReady': 'Quét mã QR trên màn hình tài khoản web.',
    'account.qrMobileSignedIn': 'Đã xác nhận đăng nhập web. Quay lại trình duyệt để tiếp tục.',
    'account.qrMobileNeedLogin': 'Hãy đăng nhập Google trên app trước khi quét QR đăng nhập web.',
    'account.qrMobileNeedToken': 'Vui lòng đăng nhập Google lại trước khi quét. Phiên đã lưu không còn Google token mới.',
    'account.qrCameraDenied': 'Cần quyền camera để quét QR đăng nhập web.',

    'settings.title': 'Cài đặt',
    'settings.notifications.title': 'Thông báo',
    'settings.notifications.body': 'Nhận mẹo du lịch và lời nhắc',
    'settings.theme.title': 'Giao diện',
    'settings.theme.body': 'Chế độ sáng',
    'settings.units.title': 'Đơn vị đo',
    'settings.units.body': 'Khoảng cách, trọng lượng, nhiệt độ',
    'settings.font.title': 'Cỡ chữ',
    'settings.font.body': 'Điều chỉnh kích thước chữ',
    'settings.language.title': 'Ngôn ngữ ứng dụng',
    'settings.language.body': 'Chọn ngôn ngữ dùng trong ứng dụng',
    'settings.version.title': 'Phiên bản',
    'settings.version.body': SETTINGS_VERSION,
    'settings.value.light': 'Sáng',
    'settings.value.dark': 'Tối',
    'settings.value.metric': 'Hệ mét (km, °C)',
    'settings.value.imperial': 'Hệ Anh (mi, °F)',

    'language.title': 'Ngôn ngữ',
    'language.subtitle': 'Chọn ngôn ngữ sử dụng trong ứng dụng.',
    'language.done': 'Xong',

    'filter.title': 'Bộ lọc',
    'filter.city': 'Thành phố',
    'filter.category': 'Danh mục',
    'filter.priceRange': 'Khoảng giá',
    'filter.rating': 'Đánh giá',
    'filter.apply': 'Áp dụng',
    'filter.reset': 'Xóa tất cả',
    'filter.results': '120 kết quả',
    'filter.price.vnd': '0 VND — 1.000.000+ VND',
    'filter.rating.four': '4 sao trở lên',

    'offline.title': 'Bạn đang ở chế độ ngoại tuyến',
    'offline.subtitle': 'Một số tính năng có thể không khả dụng cho đến khi bạn kết nối lại.',
    'offline.cached': 'Có nội dung đã lưu',
    'offline.retry': 'Thử kết nối lại',
    'offline.map': 'Bản đồ',
    'offline.taxi': 'Đặt taxi',
    'offline.liveChat': 'Trò chuyện trực tiếp',
    'offline.retryCta': 'Thử lại kết nối',

    'map.title': 'Chế độ bản đồ',
    'map.subtitle': 'Nhấn vào ghim để xem chi tiết.',
    'map.openExternal': 'Mở trong bản đồ',
    'map.loading': 'Đang tải OpenStreetMap...',
    'map.unavailable': 'Chưa tải được OpenStreetMap. Hãy mở vị trí bằng bản đồ ngoài.',
    'map.attribution': '© OpenStreetMap contributors',

    'auth.signIn': 'Tiếp tục với Google',
    'auth.signingIn': 'Đang mở Google...',
    'auth.signOut': 'Đăng xuất',
  },
} as Record<BaseLocale, Record<string, string>>;

type TranslationKey = keyof typeof translations.en;
type Translations = Record<string, string>;

function getLocale(language: Language): Locale {
  return localeByLanguage[language] ?? 'en';
}

function translate(locale: Locale, key: TranslationKey): string {
  const baseDictionary = locale === 'vi' || locale === 'en' ? translations[locale] : undefined;
  const direct = baseDictionary?.[key];
  if (direct) return direct;

  const vietnameseSource = translations.vi[key];
  if (vietnameseSource) {
    return translateStaticText(vietnameseSource, locale, translations.en[key]);
  }

  return translations.en[key] ?? (key as string);
}

/* ============================================================
 *  Static catalogs
 * ============================================================ */

const placeImages: Record<PlaceImageKey, ImageSourcePropType> = {
  benThanhMarket: require('./assets/photos/ben-thanh-market.jpg'),
  caiRangFloatingMarket: require('./assets/photos/cai-rang-floating-market.jpg'),
  haLongBay: require('./assets/photos/ha-long-bay.jpg'),
  hoanKiemLake: require('./assets/photos/hoan-kiem-lake.jpg'),
  hoiAnAncientTown: require('./assets/photos/hoi-an-ancient-town.jpg'),
  hueImperialCity: require('./assets/photos/hue-imperial-city.jpg'),
  myKheBeach: require('./assets/photos/my-khe-beach.jpg'),
  phongNhaCave: require('./assets/photos/phong-nha-cave.jpg'),
  phuQuocBeach: require('./assets/photos/phu-quoc-beach.jpg'),
};

const places: Place[] = createPlaceModels(travelPlaceSeeds);

function createPlaceModels(records: StoredTravelPlace[]): Place[] {
  return records
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((record) => ({
      id: record.id,
      name: record.name,
      city: toCity(record.city),
      category: record.category,
      description: record.description,
      history: record.history,
      bestTime: record.bestTime,
      ticketPrice: record.ticketPrice,
      openHours: record.openHours,
      lat: record.lat,
      lng: record.lng,
      tags: record.tags,
      whyGo: record.whyGo,
      travelTip: record.travelTip,
      image: record.imageUrl
        ? { uri: record.imageUrl }
        : placeImages[record.imageKey] ?? placeImages.haLongBay,
    }));
}

function toCity(value: string): City {
  return cities.includes(value as City) ? (value as City) : 'Other';
}

const foods: Food[] = [
  {
    id: 'pho',
    name: 'Phở bò',
    englishName: 'Beef noodle soup',
    region: 'Hà Nội',
    ingredients: ['Bánh phở', 'Thịt bò', 'Hành', 'Nước dùng xương'],
    spicyLevel: 1,
    priceRange: '30,000 - 60,000 VND',
    allergens: ['Bò', 'Nước mắm'],
    howToOrder: 'Cho tôi một tô phở bò',
    pronunciation: 'phuh baw',
    image: require('./assets/photos/pho.jpg'),
  },
  {
    id: 'banh_mi',
    name: 'Bánh mì Hội An',
    englishName: 'Baguette sandwich',
    region: 'Hội An',
    ingredients: ['Bánh mì', 'Pate', 'Đồ chua', 'Rau thơm', 'Thịt'],
    spicyLevel: 1,
    priceRange: '20,000 - 45,000 VND',
    allergens: ['Gluten', 'Thịt heo', 'Nước mắm'],
    howToOrder: 'Cho tôi một ổ bánh mì không cay',
    pronunciation: 'bahn mee',
    image: require('./assets/photos/banh-mi.jpg'),
  },
  {
    id: 'bun_bo_hue',
    name: 'Bún bò Huế',
    englishName: 'Hue spicy beef noodle soup',
    region: 'Huế',
    ingredients: ['Bún', 'Thịt bò', 'Sả', 'Ớt'],
    spicyLevel: 3,
    priceRange: '45,000 - 85,000 VND',
    allergens: ['Bò', 'Nước mắm'],
    howToOrder: 'Cho tôi một tô bún bò Huế ít cay',
    pronunciation: 'boon baw hway',
    image: require('./assets/photos/pho.jpg'),
  },
  {
    id: 'com_tam',
    name: 'Cơm tấm Sài Gòn',
    englishName: 'Broken rice with grilled pork',
    region: 'TP. Hồ Chí Minh',
    ingredients: ['Cơm tấm', 'Sườn nướng', 'Bì', 'Chả', 'Trứng'],
    spicyLevel: 1,
    priceRange: '35,000 - 70,000 VND',
    allergens: ['Thịt heo', 'Nước mắm', 'Trứng'],
    howToOrder: 'Cho tôi một đĩa cơm tấm sườn bì chả',
    pronunciation: 'kuhm tam',
    image: require('./assets/photos/banh-mi.jpg'),
  },
  {
    id: 'bun_cha',
    name: 'Bún chả Hà Nội',
    englishName: 'Grilled pork with rice noodles',
    region: 'Hà Nội',
    ingredients: ['Bún', 'Thịt heo nướng', 'Nước mắm chua ngọt'],
    spicyLevel: 1,
    priceRange: '40,000 - 80,000 VND',
    allergens: ['Thịt heo', 'Nước mắm'],
    howToOrder: 'Cho tôi một suất bún chả',
    pronunciation: 'boon cha',
    image: require('./assets/photos/pho.jpg'),
  },
  {
    id: 'cao_lau',
    name: 'Cao lầu Hội An',
    englishName: 'Cao lau noodles',
    region: 'Hội An',
    ingredients: ['Mì cao lầu', 'Thịt heo', 'Rau sống'],
    spicyLevel: 0,
    priceRange: '35,000 - 60,000 VND',
    allergens: ['Gluten', 'Thịt heo'],
    howToOrder: 'Cho tôi một tô cao lầu',
    pronunciation: 'cow lao',
    image: require('./assets/photos/banh-mi.jpg'),
  },
  {
    id: 'mi_quang',
    name: 'Mì Quảng',
    englishName: 'Quang noodles',
    region: 'Đà Nẵng',
    ingredients: ['Mì Quảng', 'Tôm', 'Thịt heo', 'Đậu phộng'],
    spicyLevel: 1,
    priceRange: '35,000 - 70,000 VND',
    allergens: ['Tôm', 'Đậu phộng'],
    howToOrder: 'Cho tôi một tô mì Quảng',
    pronunciation: 'mee kwang',
    image: require('./assets/photos/pho.jpg'),
  },
  {
    id: 'goi_cuon',
    name: 'Gỏi cuốn',
    englishName: 'Fresh spring rolls',
    region: 'TP. Hồ Chí Minh',
    ingredients: ['Bánh tráng', 'Tôm', 'Thịt heo', 'Bún', 'Rau'],
    spicyLevel: 0,
    priceRange: '15,000 - 35,000 VND / cuốn',
    allergens: ['Tôm', 'Thịt heo', 'Gluten'],
    howToOrder: 'Cho tôi hai phần gỏi cuốn',
    pronunciation: 'goy kwun',
    image: require('./assets/photos/banh-mi.jpg'),
  },
  {
    id: 'ca_phe_sua_da',
    name: 'Cà phê sữa đá',
    englishName: 'Vietnamese iced milk coffee',
    region: 'TP. Hồ Chí Minh',
    ingredients: ['Cà phê Robusta', 'Sữa đặc', 'Đá'],
    spicyLevel: 0,
    priceRange: '20,000 - 50,000 VND',
    allergens: ['Sữa'],
    howToOrder: 'Cho tôi một ly cà phê sữa đá',
    pronunciation: 'ka fay sua da',
    image: require('./assets/photos/banh-mi.jpg'),
  },
];

const cultureTopics: CultureTopic[] = [
  {
    id: 'temple_rules',
    title: 'Nên: Cuối với và giữ thái đoan thành kính',
    category: 'Tôn giáo',
    explanation:
      'Người Việt rất coi trọng nơi tôn nghiêm. Giữ thái độ lễ phép và tôn trọng giúp bạn tạo ấn tượng tốt với người bản địa.',
    dos: ['Mặc lịch sự khi vào chùa', 'Tháo mũ trong khu vực thờ cúng', 'Nói nhỏ'],
    donts: [
      'Không nên: Chỉ trỏ bằng ngón tay',
      'Sử dụng ngón tay chỉ bức tượng được coi là bất kính, đặc biệt đối với tượng Phật.',
    ],
  },
  {
    id: 'traffic_culture',
    title: 'An toàn giao thông khi đi bộ',
    category: 'Đô thị',
    explanation:
      'Giao thông Việt Nam có vẻ hỗn loạn nhưng thực tế rất có quy luật. Đi bộ đều và chậm là chìa khóa.',
    dos: ['Bước đều khi qua đường', 'Dùng vạch sang đường khi có'],
    donts: ['Đừng dừng đột ngột giữa làn đường', 'Đừng chạy qua đường'],
  },
  {
    id: 'bargaining',
    title: 'Mặc cả ở chợ',
    category: 'Mua sắm',
    explanation:
      'Mặc cả phổ biến ở chợ truyền thống, đặc biệt với quà lưu niệm. Không phổ biến ở siêu thị, quán cà phê hay nhà hàng.',
    dos: ['Hỏi giá trước', 'Giữ thái độ thân thiện'],
    donts: ['Đừng mặc cả sau khi đã đồng ý mua', 'Đừng mặc cả nếu bạn không quan tâm'],
  },
  {
    id: 'coffee_culture',
    title: 'Văn hóa cà phê',
    category: 'Ẩm thực',
    explanation:
      'Quán cà phê là không gian xã hội cho làm việc, hẹn hò, họp mặt và trò chuyện chậm.',
    dos: ['Thử cà phê sữa đá', 'Thong thả tận hưởng'],
    donts: ['Đừng kỳ vọng quán nào cũng yên tĩnh', 'Đừng giục phục vụ'],
  },
];

const phrases: Phrase[] = [
  { id: 'hello', situation: 'Greetings', english: 'Hello', vietnamese: 'Xin chào', pronunciation: 'sin chow', difficulty: 'easy' },
  { id: 'thanks', situation: 'Greetings', english: 'Thank you', vietnamese: 'Cảm ơn', pronunciation: 'kahm uhn', difficulty: 'easy' },
  { id: 'sorry', situation: 'Greetings', english: 'Sorry', vietnamese: 'Xin lỗi', pronunciation: 'sin loy', difficulty: 'easy' },
  { id: 'how_much', situation: 'Shopping', english: "How much?", vietnamese: 'Bao nhiêu tiền?', pronunciation: 'bao nyew tyen', difficulty: 'easy' },
  { id: 'too_expensive', situation: 'Shopping', english: 'Too expensive!', vietnamese: 'Mắc quá!', pronunciation: 'mak wa', difficulty: 'easy' },
  { id: 'not_spicy', situation: 'Food', english: 'Not spicy, please.', vietnamese: 'Không cay.', pronunciation: 'khom kai', difficulty: 'easy' },
  { id: 'delicious', situation: 'Food', english: 'Delicious!', vietnamese: 'Ngon quá!', pronunciation: 'ngon wa', difficulty: 'easy' },
  { id: 'check_please', situation: 'Food', english: 'Check, please.', vietnamese: 'Tính tiền.', pronunciation: 'tin tyen', difficulty: 'easy' },
  { id: 'where_is', situation: 'Directions', english: 'Where is...?', vietnamese: 'Ở đâu...?', pronunciation: 'uh dow', difficulty: 'easy' },
  { id: 'go_straight', situation: 'Directions', english: 'Go straight.', vietnamese: 'Đi thẳng.', pronunciation: 'dee tang', difficulty: 'easy' },
  { id: 'turn_left', situation: 'Directions', english: 'Turn left.', vietnamese: 'Quẹo trái.', pronunciation: 'kweo chai', difficulty: 'easy' },
  { id: 'turn_right', situation: 'Directions', english: 'Turn right.', vietnamese: 'Quẹo phải.', pronunciation: 'kweo fai', difficulty: 'easy' },
  { id: 'help', situation: 'Emergency', english: 'Help!', vietnamese: 'Cứu tôi!', pronunciation: 'kuh toy', difficulty: 'easy' },
  { id: 'call_police', situation: 'Emergency', english: 'Call the police.', vietnamese: 'Gọi cảnh sát.', pronunciation: 'goy kang sat', difficulty: 'easy' },
  { id: 'hospital', situation: 'Emergency', english: 'I need a hospital.', vietnamese: 'Tôi cần bệnh viện.', pronunciation: 'toy kun beng nyen', difficulty: 'easy' },
];

const emergencyCards = [
  { id: 'national_sos', titleKey: 'Khẩn cấp quốc gia', phone: '112', phrase: 'Tôi cần giúp đỡ khẩn cấp.' },
  { id: 'police', titleKey: 'Cảnh sát', phone: '113', phrase: 'Cho tôi gọi cảnh sát.' },
  { id: 'fire', titleKey: 'Cứu hỏa', phone: '114', phrase: 'Có cháy, giúp tôi.' },
  { id: 'ambulance', titleKey: 'Cấp cứu', phone: '115', phrase: 'Tôi cần xe cấp cứu.' },
  { id: 'tourist_police', titleKey: 'Cảnh sát du lịch', phone: '1800 6118', phrase: '' },
  { id: 'tourist_hotline', titleKey: 'Đường dây nóng du lịch', phone: '0588 247 247', phrase: '' },
  { id: 'embassy', titleKey: 'Hỗ trợ đại sứ quán', phone: '112', phrase: 'Tôi bị mất hộ chiếu.' },
  { id: 'taxi', titleKey: 'Taxi an toàn', phone: '1055', phrase: 'Vui lòng gọi taxi giúp tôi.' },
] as const;

const tripStyles = ['Budget', 'Luxury', 'Family', 'Solo', 'Backpacker'] as const;
type TripStyle = (typeof tripStyles)[number];

const bottomTabItems: { id: TabId; labelKey: TranslationKey; icon: typeof Home }[] = [
  { id: 'home', labelKey: 'nav.explore' as TranslationKey, icon: Home },
  { id: 'trips', labelKey: 'nav.trips' as TranslationKey, icon: Plane },
  { id: 'ai', labelKey: 'nav.ai' as TranslationKey, icon: Sparkles },
  { id: 'saved', labelKey: 'nav.favorites', icon: Heart },
  { id: 'account', labelKey: 'nav.account' as TranslationKey, icon: User },
];

const featureShortcuts: { id: TabId; labelKey: TranslationKey; icon: typeof Home }[] = [
  { id: 'live_team', labelKey: 'liveTeam.nav', icon: Radio },
  { id: 'nearby', labelKey: 'home.tool.nearby', icon: Navigation },
  { id: 'phrases', labelKey: 'home.tool.translate', icon: Languages },
  { id: 'emergency', labelKey: 'home.tool.emergency', icon: Phone },
  { id: 'member_video_call', labelKey: 'memberCall.nav', icon: MessageCircle },
  { id: 'map', labelKey: 'home.tool.map', icon: MapIcon },
  { id: 'offline', labelKey: 'home.tool.offline', icon: WifiOff },
  { id: 'currency', labelKey: 'home.tool.currency', icon: CircleDollarSign },
];

const quickQuestions = [
  'Tôi nên đi đâu ở Đà Nẵng 2 ngày?',
  'Bánh mì có cay không?',
  'Làm sao qua đường ở Hà Nội?',
  'Kể về Chợ Bến Thành',
];

const popularPlaceIds = [
  'ha_long_bay',
  'ninh_binh',
  'hoi_an',
  'phu_quoc',
  'phong_nha',
  'can_tho',
  'ba_na_hills',
  'ben_thanh',
  'mui_ne',
];
const popularFoodIds = ['pho', 'banh_mi', 'bun_cha', 'com_tam', 'bun_bo_hue'];

/* ============================================================
 *  Pure helpers
 * ============================================================ */

const aiLanguageCopy: Record<Locale, { welcome: string; unavailable: string; listening: string }> = {
  en: {
    welcome: "Hi! I'm Vinago+ AI, ready to help you explore Vietnam. Where would you like to go today?",
    unavailable: 'The AI service is temporarily unavailable. Please try again shortly.',
    listening: 'Vinago+ AI is preparing an answer…',
  },
  vi: {
    welcome: 'Chào bạn! Tôi là Vinago+ AI, sẵn sàng giúp bạn khám phá Việt Nam. Bạn muốn đi đâu hôm nay?',
    unavailable: 'Dịch vụ AI đang tạm thời gián đoạn. Vui lòng thử lại sau ít phút.',
    listening: 'Vinago+ AI đang chuẩn bị câu trả lời…',
  },
  ko: {
    welcome: '안녕하세요! Vinago+ AI입니다. 베트남 여행을 도와드릴게요. 오늘 어디로 가고 싶으신가요?',
    unavailable: 'AI 서비스를 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.',
    listening: 'Vinago+ AI가 답변을 준비하고 있습니다…',
  },
  ja: {
    welcome: 'こんにちは！Vinago+ AIです。ベトナム旅行をお手伝いします。今日はどこへ行きたいですか？',
    unavailable: 'AIサービスは一時的に利用できません。しばらくしてからもう一度お試しください。',
    listening: 'Vinago+ AIが回答を準備しています…',
  },
  'zh-CN': {
    welcome: '您好！我是 Vinago+ AI，很高兴帮助您探索越南。今天想去哪里？',
    unavailable: 'AI 服务暂时不可用，请稍后再试。',
    listening: 'Vinago+ AI 正在准备回答…',
  },
  'zh-TW': {
    welcome: '您好！我是 Vinago+ AI，很高興協助您探索越南。今天想去哪裡？',
    unavailable: 'AI 服務暫時無法使用，請稍後再試。',
    listening: 'Vinago+ AI 正在準備回答…',
  },
  th: {
    welcome: 'สวัสดี! ฉันคือ Vinago+ AI พร้อมช่วยคุณเที่ยวเวียดนาม วันนี้อยากไปที่ไหน?',
    unavailable: 'บริการ AI ไม่พร้อมใช้งานชั่วคราว โปรดลองอีกครั้งในภายหลัง',
    listening: 'Vinago+ AI กำลังเตรียมคำตอบ…',
  },
  fr: {
    welcome: 'Bonjour ! Je suis Vinago+ AI, prêt à vous aider à découvrir le Vietnam. Où souhaitez-vous aller aujourd’hui ?',
    unavailable: 'Le service d’IA est temporairement indisponible. Veuillez réessayer dans quelques instants.',
    listening: 'Vinago+ AI prépare une réponse…',
  },
  de: {
    welcome: 'Hallo! Ich bin Vinago+ AI und helfe dir, Vietnam zu entdecken. Wohin möchtest du heute reisen?',
    unavailable: 'Der KI-Dienst ist vorübergehend nicht verfügbar. Bitte versuche es später erneut.',
    listening: 'Vinago+ AI bereitet eine Antwort vor…',
  },
  es: {
    welcome: '¡Hola! Soy Vinago+ AI y estoy listo para ayudarte a descubrir Vietnam. ¿Adónde te gustaría ir hoy?',
    unavailable: 'El servicio de IA no está disponible temporalmente. Inténtalo de nuevo en unos minutos.',
    listening: 'Vinago+ AI está preparando una respuesta…',
  },
};

const aiSpeechLocales: Record<Locale, string> = {
  en: 'en-US', vi: 'vi-VN', ko: 'ko-KR', ja: 'ja-JP', 'zh-CN': 'zh-CN', 'zh-TW': 'zh-TW',
  th: 'th-TH', fr: 'fr-FR', de: 'de-DE', es: 'es-ES',
};

function getWelcomeMessage(locale: Locale): string {
  return aiLanguageCopy[locale].welcome;
}

function getTodayCopy(city: City, locale: Locale): string {
  if (locale === 'vi') {
    if (city === 'Hà Nội') return 'Hôm nay ở Hà Nội — phở, phố cổ và cà phê trứng đang chờ bạn.';
    if (city === 'TP. Hồ Chí Minh') return 'Hôm nay ở Sài Gòn — bánh mì, cà phê sữa đá và phố đêm Bùi Viện.';
    if (city === 'Đà Nẵng') return 'Hôm nay ở Đà Nẵng — biển Mỹ Khê, Bà Nà Hills và mì Quảng.';
    return 'Hôm nay ở Việt Nam — hàng nghìn trải nghiệm đang chờ bạn.';
  }
  if (city === 'Hà Nội') return 'Today in Hanoi — pho, the Old Quarter and egg coffee are waiting for you.';
  if (city === 'TP. Hồ Chí Minh') return 'Today in Ho Chi Minh City — banh mi, iced milk coffee and Bui Vien night street.';
  if (city === 'Đà Nẵng') return 'Today in Da Nang — My Khe beach, Ba Na Hills and mi Quang.';
  return 'Today in Vietnam — thousands of experiences are waiting for you.';
}

function getExperienceSubtitle(city: City, locale: Locale): string {
  if (locale === 'vi') {
    return `Gợi ý cho ${city}`;
  }
  return `Recommendations for ${city}`;
}

function getSelectedCities(profile: UserProfile): City[] {
  const selected =
    profile.selectedCities?.filter((city): city is City => cities.includes(city as City)) ?? [];
  const unique = Array.from(new Set(selected));
  const fallbackCity = cities.includes(profile.currentCity) ? profile.currentCity : defaultProfile.currentCity;
  return unique.length > 0 ? unique : [fallbackCity];
}

function normalizeProfile(profile: UserProfile): UserProfile {
  const selectedCities = getSelectedCities(profile);
  return {
    ...profile,
    selectedCities,
    currentCity: selectedCities[0] ?? profile.currentCity,
  };
}

function getSelectedCitiesLabel(profile: UserProfile): string {
  const selected = getSelectedCities(profile);
  if (selected.length <= 2) return selected.join(', ');
  return `${selected.slice(0, 2).join(', ')} +${selected.length - 2}`;
}

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

function toggleProfileCity(profile: UserProfile, city: City): UserProfile {
  const current = getSelectedCities(profile);
  const exists = current.includes(city);
  const nextCities = exists
    ? current.filter((item) => item !== city)
    : [...current, city];
  const safeCities = nextCities.length > 0 ? nextCities : [city];
  return {
    ...profile,
    selectedCities: safeCities,
    currentCity: safeCities[0],
  };
}

function getEmailDomain(email: string): string {
  return email.split('@')[1] ?? '';
}

function authSessionFromQrUser(user: QrLoginUser, signedInAt = new Date().toISOString()): AuthSessionState {
  return {
    lastSeenAt: signedInAt,
    provider: 'google',
    signedInAt,
    user: {
      email: user.email,
      givenName: user.givenName,
      id: user.id,
      name: user.name,
      picture: user.picture,
      verifiedEmail: user.verifiedEmail,
    },
  };
}

function authSessionFromAccountUser(
  user: AccountAuthUser,
  signedInAt = new Date().toISOString(),
  lastSeenAt = new Date().toISOString(),
): AuthSessionState {
  return {
    lastSeenAt,
    provider: 'google',
    signedInAt,
    user,
  };
}

function buildAiAnswer(
  question: string,
  profile: UserProfile,
  tripDays: number,
  tripStyle: TripStyle,
  locale: Locale,
  placeItems: Place[] = places,
): string {
  const normalized = normalizeSearchText(question);
  const matchedPlace = placeItems.find((place) => {
    const placeName = normalizeSearchText(place.name);
    const placeText = normalizeSearchText(`${place.name} ${place.city} ${place.category} ${place.tags.join(' ')}`);
    return normalized.includes(placeName) || (normalized.length >= 3 && placeText.includes(normalized));
  });
  const matchedFood = foods.find((food) => {
    const foodText = normalizeSearchText(`${food.name} ${food.englishName} ${food.region}`);
    return normalized.length >= 3 && foodText.includes(normalized);
  });

  if (matchedPlace) {
    if (locale === 'vi') {
      return `${matchedPlace.name} ở ${matchedPlace.city}. ${matchedPlace.description} Thời điểm nên đi: ${matchedPlace.bestTime}. Mẹo thực tế: ${matchedPlace.travelTip}`;
    }
    return `${matchedPlace.name} is in ${matchedPlace.city}. ${matchedPlace.description} Best time: ${matchedPlace.bestTime}. Practical tip: ${matchedPlace.travelTip}`;
  }

  if (matchedFood) {
    const spice = matchedFood.spicyLevel === 0 ? 'not spicy' : matchedFood.spicyLevel === 1 ? 'usually mild' : 'often spicy';
    if (locale === 'vi') {
      const spiceVi = matchedFood.spicyLevel === 0 ? 'không cay' : matchedFood.spicyLevel === 1 ? 'thường cay nhẹ' : 'thường khá cay';
      return `${matchedFood.name} là ${matchedFood.englishName}. Món này ${spiceVi}, giá khoảng ${matchedFood.priceRange}. Cách gọi: ${matchedFood.howToOrder}.`;
    }
    return `${matchedFood.name} is ${matchedFood.englishName}. This dish is ${spice}, around ${matchedFood.priceRange}. How to order: ${matchedFood.howToOrder}.`;
  }

  if (/(cross|traffic|street|qua duong)/.test(normalized)) {
    return locale === 'vi'
      ? 'Khi qua đường ở Việt Nam, hãy bước đều, đi chậm, và tránh dừng đột ngột. Tài xế thường giảm tốc khi thấy bạn đã bắt đầu qua đường.'
      : 'When crossing streets in Vietnam, walk steadily, slowly, and avoid sudden stops. Drivers usually slow down once they see you commit to crossing.';
  }

  if (/(temple|pagoda|chua)/.test(normalized)) {
    return locale === 'vi'
      ? 'Khi vào chùa, hãy mặc lịch sự, nói nhỏ và tháo mũ. Không chỉ trỏ vào tượng hoặc chạm vào đồ lễ.'
      : 'When visiting temples, dress modestly, speak softly, and remove your hat. Do not point at statues or touch offerings.';
  }

  if (/(bargain|mac ca|price|gia)/.test(normalized)) {
    return locale === 'vi'
      ? 'Mặc cả phổ biến ở chợ truyền thống nhưng không phổ biến ở siêu thị, quán cà phê hay nhà hàng. Hãy giữ thái độ thân thiện.'
      : 'Bargaining is common in traditional markets, but not in malls, cafes or restaurants. Keep the tone friendly.';
  }

  if (/(itinerary|行程|lich trinh|plan|ke hoach|days|ngay)/.test(normalized)) {
    const days = tripDays;
    const city = getSelectedCitiesLabel(profile);
    if (locale === 'vi') {
      return `Lịch trình ${days} ngày tại ${city} (phong cách ${tripStyle}):\n\nNgày 1: Khám phá trung tâm, ăn sáng đặc sản địa phương, tham quan điểm nổi bật.\nNgày 2: Trải nghiệm văn hóa, thử món mới, dạo phố cổ.\n\nLưu ý: Mang theo nước, giày thoải mái và bản đồ offline.`;
    }
    return `${days} day ${tripStyle} itinerary for ${city}:\n\nDay 1: Explore the city center, try a local breakfast and visit a top attraction.\nDay 2: Immerse in culture, try a new dish and walk the old quarter.\n\nTip: Bring water, comfortable shoes and an offline map.`;
  }

  if (/(translate|dich|번역)/.test(normalized)) {
    return locale === 'vi'
      ? 'Tôi có thể dịch câu ngắn sang tiếng Việt. Hãy thử:\n- "Hello" → "Xin chào"\n- "Thank you" → "Cảm ơn"\n- "How much?" → "Bao nhiêu tiền?"'
      : 'I can translate short phrases to Vietnamese. Try:\n- "Hello" → "Xin chào"\n- "Thank you" → "Cảm ơn"\n- "How much?" → "Bao nhiêu tiền?"';
  }

  if (/(hello|hi|chao|xin chao)/.test(normalized)) {
    return locale === 'vi'
      ? 'Chào bạn! Tôi có thể giúp gì cho chuyến đi của bạn?'
      : 'Hello! How can I help with your trip?';
  }

  return getWelcomeMessage(locale);
}

function buildItineraryPreview(itinerary: ItineraryConfirmation, locale: Locale): string {
  if (locale === 'vi') {
    return [
      `LỊCH TRÌNH ${itinerary.days}N ${itinerary.city.toUpperCase()} - VINAGO+`,
      '',
      `Ngày 1: Khám phá ${itinerary.city}`,
      '  - 08:00 Ăn sáng đặc sản địa phương',
      '  - 10:30 Bảo tàng / di tích lịch sử',
      '  - 12:30 Ăn trưa tại quán địa phương',
      '  - 14:00 Dạo bộ khu trung tâm',
      '  - 17:00 Cà phê và ngắm hoàng hôn',
      '',
      itinerary.days > 1 ? `Ngày 2: Trải nghiệm văn hóa & ẩm thực` : '',
      itinerary.days > 1 ? '  - 08:00 Chợ địa phương' : '',
      itinerary.days > 1 ? '  - 10:00 Làng nghề truyền thống' : '',
      itinerary.days > 1 ? '  - 12:00 Ăn trưa với món đặc sản' : '',
      itinerary.days > 1 ? '  - 15:00 Khu phố cổ' : '',
      '',
      `Vinago+ - Your Vietnam Adventure`,
    ].filter(Boolean).join('\n');
  }
  return [
    `ITINERARY ${itinerary.days}D ${itinerary.city.toUpperCase()} - VINAGO+`,
    '',
    `Day 1: Explore ${itinerary.city}`,
    '  - 08:00 Local breakfast specialty',
    '  - 10:30 Museum / historical site',
    '  - 12:30 Lunch at a local restaurant',
    '  - 14:00 Walk around the city center',
    '  - 17:00 Coffee and sunset view',
    '',
    itinerary.days > 1 ? `Day 2: Culture & culinary experience` : '',
    itinerary.days > 1 ? '  - 08:00 Local market' : '',
    itinerary.days > 1 ? '  - 10:00 Traditional craft village' : '',
    itinerary.days > 1 ? '  - 12:00 Regional lunch specialty' : '',
    itinerary.days > 1 ? '  - 15:00 Old quarter walk' : '',
    '',
    'Vinago+ - Your Vietnam Adventure',
  ].filter(Boolean).join('\n');
}

function buildPlainTextEmail(
  payload: { to?: string; name?: string; itinerary?: ItineraryConfirmation; profile?: UserProfile },
  fallbackEmail: string,
): string {
  const name = payload.name || fallbackEmail;
  const itinerary = payload.itinerary;
  const profile = payload.profile;
  return [
    `Hi ${name},`,
    '',
    `Here is your Vinago+ itinerary confirmation for ${itinerary?.city ?? profile?.currentCity ?? 'Vietnam'}.`,
    '',
    `Plan: ${itinerary?.title ?? 'Itinerary'}`,
    `Purpose: ${profile?.purpose ?? 'Travel'}`,
    `Language: ${profile?.language ?? 'English'}`,
    `Created: ${itinerary?.createdAt ?? new Date().toISOString()}`,
    '',
    itinerary?.body ?? '',
    '',
    'Have a great trip,',
    'Vinago+',
  ].join('\n');
}

function formatHistoryTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return timestamp;
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatAccountMonth(timestamp?: string): string {
  if (!timestamp) return '—';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, {
    month: 'short',
    year: 'numeric',
  });
}

function isToday(timestamp: string): boolean {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function createItineraryConfirmation(
  prompt: string,
  profile: UserProfile,
  tripDays: number,
  tripStyle: TripStyle,
  locale: Locale,
  placeItems: Place[] = places,
): ItineraryConfirmation {
  const body = buildAiAnswer(prompt, profile, tripDays, tripStyle, locale, placeItems);
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: `${tripDays} day ${tripStyle} itinerary`,
    prompt,
    body,
    city: profile.currentCity,
    days: tripDays,
    style: tripStyle,
    createdAt: new Date().toISOString(),
  };
}

function buildItineraryEmailBody(
  recipientName: string,
  itinerary: ItineraryConfirmation,
  profile: UserProfile,
): string {
  return [
    `Hi ${recipientName || 'traveler'},`,
    '',
    `Here is your Vinago+ itinerary confirmation for ${getSelectedCitiesLabel(profile)}.`,
    '',
    `Plan: ${itinerary.title}`,
    `Purpose: ${profile.purpose}`,
    `Language: ${profile.language}`,
    `Created: ${formatHistoryTimestamp(itinerary.createdAt)}`,
    '',
    itinerary.body,
    '',
    'Have a great trip,',
    'Vinago+',
  ].join('\n');
}

function openInMaps(place: Place): void {
  const url =
    Platform.OS === 'ios'
      ? `maps:0,0?q=${encodeURIComponent(place.name)}@${place.lat},${place.lng}`
      : Platform.OS === 'android'
        ? `geo:${place.lat},${place.lng}?q=${encodeURIComponent(place.name)}`
        : `https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lng}#map=16/${place.lat}/${place.lng}`;
  void Linking.openURL(url).catch(() => {
    void Linking.openURL(
      `https://www.openstreetmap.org/?mlat=${place.lat}&mlon=${place.lng}#map=16/${place.lat}/${place.lng}`,
    );
  });
}

function escapeHtml(value?: string): string {
  return (value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildOpenStreetMapHtml({
  lat,
  lng,
  zoom,
  title,
  subtitle,
  attribution,
  loading,
  unavailable,
}: {
  lat: number;
  lng: number;
  zoom: number;
  title?: string;
  subtitle?: string;
  attribution: string;
  loading: string;
  unavailable: string;
}) {
  const popup = title
    ? `<strong>${escapeHtml(title)}</strong>${subtitle ? `<br />${escapeHtml(subtitle)}` : ''}`
    : '';
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <style>
      html, body, #map { height: 100%; margin: 0; padding: 0; }
      body { background: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      #status { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: #64748b; font-weight: 700; text-align: center; padding: 24px; z-index: 1; }
      .leaflet-container { font: inherit; }
    </style>
  </head>
  <body>
    <div id="map"><div id="status">${escapeHtml(loading)}</div></div>
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <script>
      (function () {
        try {
          var lat = ${lat};
          var lng = ${lng};
          var zoom = ${zoom};
          var map = L.map('map', { zoomControl: true, attributionControl: true }).setView([lat, lng], zoom);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '${escapeHtml(attribution)}'
          }).addTo(map);
          ${title ? `L.marker([lat, lng]).addTo(map).bindPopup('${popup}').openPopup();` : ''}
          var status = document.getElementById('status');
          if (status) status.remove();
        } catch (error) {
          var status = document.getElementById('status');
          if (status) status.textContent = '${escapeHtml(unavailable)}';
        }
      })();
    </script>
  </body>
</html>`;
}

/* ============================================================
 *  Analytics helpers
 * ============================================================ */

async function trackEvent(
  eventName: AnalyticsEventName,
  params: AnalyticsParams = {},
  profile?: UserProfile | null,
) {
  const sanitizedParams = sanitizeAnalyticsParams({
    ...params,
    app_name: 'Vinago+',
    platform: Platform.OS,
    session_id: analyticsSessionId,
    locale: profile ? getLocale(profile.language) : undefined,
    language: profile?.language,
    current_city: profile?.currentCity,
    purpose: profile?.purpose,
    trip_days: profile?.tripDays,
    ga_property_id: analyticsConfig.propertyId,
    ga_stream_id: analyticsConfig.streamId,
  });
  const payload: AnalyticsPayload = {
    eventName,
    params: sanitizedParams,
    timestamp: new Date().toISOString(),
  };
  if (sendGoogleAnalyticsEvent(payload)) return;
  await enqueueAnalyticsEvent(payload);
}

function sendGoogleAnalyticsEvent(payload: AnalyticsPayload): boolean {
  if (Platform.OS !== 'web' || !analyticsConfig.measurementId?.startsWith('G-')) return false;
  const windowRef = (globalThis as any).window as
    | (Window & { gtag?: (...args: unknown[]) => void })
    | undefined;
  if (!windowRef?.gtag) return false;
  windowRef.gtag('event', payload.eventName, { ...payload.params, event_timestamp: payload.timestamp });
  return true;
}

async function enqueueAnalyticsEvent(payload: AnalyticsPayload) {
  try {
    const storedQueue = await AsyncStorage.getItem(ANALYTICS_QUEUE_KEY);
    const queue = storedQueue ? (JSON.parse(storedQueue) as AnalyticsPayload[]) : [];
    queue.push(payload);
    await AsyncStorage.setItem(ANALYTICS_QUEUE_KEY, JSON.stringify(queue.slice(-100)));
  } catch {
    /* never interrupt travel workflow */
  }
}

function sanitizeAnalyticsParams(params: AnalyticsParams): Record<string, AnalyticsValue> {
  return Object.entries(params).reduce<Record<string, AnalyticsValue>>((result, [key, value]) => {
    if (value !== undefined) result[key] = value;
    return result;
  }, {});
}

function initializeGoogleAnalytics() {
  if (Platform.OS !== 'web' || !analyticsConfig.measurementId) return;
  if (!analyticsConfig.measurementId.startsWith('G-')) {
    console.warn(
      `Google Analytics measurement ID is missing or invalid. Property ${analyticsConfig.propertyName} (${analyticsConfig.propertyId}), stream ${analyticsConfig.streamId} needs an EXPO_PUBLIC_GA_MEASUREMENT_ID value like G-XXXXXXXXXX.`,
    );
    return;
  }
  const documentRef = (globalThis as any).document;
  const windowRef = (globalThis as any).window as
    | (Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void })
    | undefined;
  if (!documentRef || !windowRef || documentRef.getElementById('vinago-ga4')) return;
  const script = documentRef.createElement('script');
  script.id = 'vinago-ga4';
  script.async = true;
  script.src = `https://www.googletemagager.com/gtag/js?id=${analyticsConfig.measurementId}`;
  documentRef.head.appendChild(script);
  windowRef.dataLayer = windowRef.dataLayer ?? [];
  windowRef.gtag = (...args: unknown[]) => {
    windowRef.dataLayer?.push(args);
  };
  windowRef.gtag('js', new Date());
  windowRef.gtag('config', analyticsConfig.measurementId, {
    app_name: 'Vinago+',
    send_page_view: false,
    property_id: analyticsConfig.propertyId,
    stream_id: analyticsConfig.streamId,
  });
}

/* ============================================================
 *  Design tokens
 * ============================================================ */

const colors = {
  background: '#ffffff',
  backgroundAlt: '#fff5f5',
  surface: '#ffffff',
  surfaceAlt: '#fff0f0',
  text: '#1a1a1a',
  muted: '#7a7a7a',
  primary: '#da251d',
  primaryDark: '#a31810',
  primarySoft: '#fdebea',
  border: '#ececec',
  accent: '#ffd23f',
  success: '#1e8e3e',
  warning: '#b45309',
  shadow: 'rgba(218, 37, 29, 0.12)',
};

const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
};

const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

/* ============================================================
 *  Shared UI primitives
 * ============================================================ */

function Panel({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[styles.panel, style]}>{children}</View>;
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.sectionTitleWrap}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function ChoiceChip({
  label,
  active,
  onPress,
  leading,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  leading?: React.ReactNode;
}) {
  return (
    <Pressable
      style={[styles.choiceChip, active && styles.choiceChipActive]}
      onPress={onPress}
    >
      {leading ? <View style={styles.choiceChipLeading}>{leading}</View> : null}
      <Text style={[styles.choiceChipText, active && styles.choiceChipTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function ChipGrid({ children }: { children: React.ReactNode }) {
  return <View style={styles.chipGrid}>{children}</View>;
}

function PrimaryButton({
  label,
  onPress,
  icon: Icon,
  disabled,
  variant = 'primary',
}: {
  label: string;
  onPress: () => void;
  icon?: typeof Home;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.primaryButton,
        variant === 'secondary' && styles.primaryButtonSecondary,
        variant === 'ghost' && styles.primaryButtonGhost,
        disabled && styles.disabledButton,
      ]}
    >
      {Icon ? <Icon color={variant === 'primary' ? colors.surface : colors.primary} size={18} /> : null}
      <Text
        style={[
          styles.primaryButtonText,
          variant !== 'primary' && styles.primaryButtonTextAlt,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function IconButton({
  icon: Icon,
  onPress,
  color = colors.text,
  size = 20,
  style,
  accessibilityLabel,
}: {
  icon: typeof Home;
  onPress: () => void;
  color?: string;
  size?: number;
  style?: object;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable accessibilityLabel={accessibilityLabel} onPress={onPress} style={[styles.iconButton, style]}>
      <Icon color={color} size={size} />
    </Pressable>
  );
}

function LocationPermissionModal({
  visible,
  permission,
  canAskAgain,
  isLocating,
  cityLabel,
  error,
  isVietnamese,
  onAllow,
  onNotNow,
  onOpenSettings,
}: {
  visible: boolean;
  permission: AppLocationPermission;
  canAskAgain: boolean;
  isLocating: boolean;
  cityLabel: string | null;
  error: string | null;
  isVietnamese: boolean;
  onAllow: () => void;
  onNotNow: () => void;
  onOpenSettings: () => void;
}) {
  const needsSettings = permission === 'denied' && !canAskAgain;
  const title = cityLabel
    ? (isVietnamese ? `Vị trí hiện tại: ${cityLabel}` : `Current location: ${cityLabel}`)
    : (isVietnamese ? 'Cho phép Vinago+ dùng vị trí?' : 'Allow Vinago+ to use your location?');

  return (
    <Modal animationType="fade" onRequestClose={onNotNow} transparent visible={visible}>
      <View style={styles.locationPermissionBackdrop}>
        <Pressable accessibilityLabel="Close location permission" onPress={onNotNow} style={styles.locationPermissionDismiss} />
        <View style={styles.locationPermissionCard}>
          <View style={styles.locationPermissionIcon}><Navigation color={colors.surface} size={27} /></View>
          <Text style={styles.locationPermissionTitle}>{title}</Text>
          <Text style={styles.locationPermissionBody}>
            {isVietnamese
              ? 'Vị trí giúp Vinago+ cá nhân hóa các tính năng cần khoảng cách thực tế.'
              : 'Your location helps Vinago+ personalize features that depend on real distance.'}
          </Text>
          <View style={styles.locationPermissionUses}>
            {[
              isVietnamese ? 'Địa điểm gần bạn và chỉ đường' : 'Nearby places and directions',
              isVietnamese ? 'Thời tiết, cảnh báo an toàn và giá địa phương' : 'Weather, safety alerts and local prices',
              isVietnamese ? 'Gợi ý AI và công việc Local Helper gần đó' : 'AI suggestions and nearby Local Helper jobs',
            ].map((label) => (
              <View key={label} style={styles.locationPermissionUseRow}>
                <CircleCheck color={colors.success} size={17} />
                <Text style={styles.locationPermissionUseText}>{label}</Text>
              </View>
            ))}
          </View>
          <View style={styles.locationPermissionPrivacy}>
            <ShieldAlert color={colors.primary} size={17} />
            <Text style={styles.locationPermissionPrivacyText}>
              {isVietnamese
                ? 'Các tính năng trên chỉ dùng vị trí khi app đang mở. Live Team chỉ chia sẻ vị trí nền sau khi bạn chủ động bật “Chia sẻ GPS”.'
                : 'These features use location only while the app is open. Live Team shares background location only after you turn on “Share GPS”.'}
            </Text>
          </View>
          {error ? <Text style={styles.locationPermissionError}>{error}</Text> : null}
          <Pressable
            accessibilityRole="button"
            disabled={isLocating}
            onPress={needsSettings ? onOpenSettings : onAllow}
            style={[styles.locationPermissionPrimary, isLocating && styles.disabledButton]}
          >
            {isLocating ? <ActivityIndicator color={colors.surface} size="small" /> : <MapPin color={colors.surface} size={19} />}
            <Text style={styles.locationPermissionPrimaryText}>
              {needsSettings
                ? (isVietnamese ? 'Mở Cài đặt' : 'Open Settings')
                : (isVietnamese ? 'Cho phép vị trí' : 'Allow location')}
            </Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onNotNow} style={styles.locationPermissionSecondary}>
            <Text style={styles.locationPermissionSecondaryText}>{isVietnamese ? 'Để sau' : 'Not now'}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function HeaderBar({
  title,
  subtitle,
  onBack,
  trailing,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  trailing?: React.ReactNode;
}) {
  return (
    <View style={styles.headerBar}>
      {onBack ? (
        <IconButton icon={ArrowLeft} onPress={onBack} style={styles.headerBack} />
      ) : null}
      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>{title}</Text>
        {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
      </View>
      {trailing ? <View style={styles.headerTrailing}>{trailing}</View> : null}
    </View>
  );
}

function EmptyState({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Home;
  title: string;
  body: string;
}) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}>
        <Icon color={colors.primary} size={28} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
    </View>
  );
}

function LogoMark() {
  return (
    <View style={styles.logoMark}>
      <Sparkles color={colors.surface} size={22} />
    </View>
  );
}

function BrandHeader({ subtitle }: { subtitle?: string }) {
  return (
    <View style={styles.brandHeader}>
      <View style={styles.brandRow}>
        <LogoMark />
        <View>
          <Text style={styles.brandTitle}>VINAGO+</Text>
          {subtitle ? <Text style={styles.brandSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>
    </View>
  );
}

/* ============================================================
 *  Screens
 * ============================================================ */

function OnboardingScreen({
  draftProfile,
  setDraftProfile,
  onSave,
  t,
}: {
  draftProfile: UserProfile;
  setDraftProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  onSave: () => void;
  t: (key: TranslationKey) => string;
}) {
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4>(0);
  const isWelcome = step === 0;
  const isLanguage = step === 1;
  const isPurpose = step === 2;
  const isCity = step === 3;
  const isDays = step === 4;
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.onboardingScroll}>
        <BrandHeader subtitle={t('app.tagline')} />
        {isWelcome ? (
          <View style={styles.welcomeHero}>
            <Image
              source={require('./assets/photos/hoan-kiem-lake.jpg')}
              style={styles.welcomeHeroImage}
            />
            <View style={styles.welcomeHeroOverlay} />
            <View style={styles.welcomeHeroContent}>
              <Text style={styles.welcomeTitle}>{t('onboarding.welcomeTitle')}</Text>
              <Text style={styles.welcomeSubtitle}>{t('onboarding.welcomeSubtitle')}</Text>
              <Text style={styles.welcomeCopy}>{t('onboarding.heroSubtitle')}</Text>
              <Pressable
                style={styles.welcomePrimary}
                onPress={() => setStep(1)}
              >
                <Text style={styles.welcomePrimaryText}>{t('onboarding.start')}</Text>
                <ChevronRight color={colors.surface} size={18} />
              </Pressable>
              <Pressable
                style={styles.welcomeSecondary}
                onPress={() => setStep(1)}
              >
                <Text style={styles.welcomeSecondaryText}>
                  {t('onboarding.alreadyHaveAccount')}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {isLanguage ? (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>{t('onboarding.chooseLanguage')}</Text>
            <Text style={styles.stepSubtitle}>{t('onboarding.heroSubtitle')}</Text>
            <View style={styles.languageList}>
              {languages.map((language) => (
                <Pressable
                  key={language}
                  style={[
                    styles.languageRow,
                    draftProfile.language === language && styles.languageRowActive,
                  ]}
                  onPress={() => setDraftProfile((d) => ({ ...d, language }))}
                >
                  <View style={styles.languageFlag}>
                    <Text style={styles.languageFlagText}>{languageFlags[language]}</Text>
                  </View>
                  <View style={styles.languageTextStack}>
                    <Text style={styles.languageLabel}>{languageNativeNames[language]}</Text>
                    <Text style={styles.languageSubLabel}>{languageSecondaryNames[language]}</Text>
                  </View>
                  {draftProfile.language === language ? (
                    <Check color={colors.primary} size={20} />
                  ) : null}
                </Pressable>
              ))}
            </View>
            <PrimaryButton
              label={t('onboarding.continue')}
              onPress={() => setStep(2)}
              icon={ChevronRight}
            />
          </View>
        ) : null}

        {isPurpose ? (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>{t('onboarding.purposeTitle')}</Text>
            <ChipGrid>
              {purposes.map((purpose) => {
                const Icon = purposeIcons[purpose];
                return (
                  <ChoiceChip
                    key={purpose}
                    label={purpose}
                    active={draftProfile.purpose === purpose}
                    onPress={() => setDraftProfile((d) => ({ ...d, purpose }))}
                    leading={<Icon color={draftProfile.purpose === purpose ? colors.surface : colors.primary} size={16} />}
                  />
                );
              })}
            </ChipGrid>
            <PrimaryButton
              label={t('onboarding.continue')}
              onPress={() => setStep(3)}
              icon={ChevronRight}
            />
          </View>
        ) : null}

        {isCity ? (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>{t('onboarding.cityTitle')}</Text>
            <Text style={styles.stepSubtitle}>{getSelectedCitiesLabel(draftProfile)}</Text>
            <View style={styles.cityList}>
              {onboardingCities.map((city) => (
                <ChoiceChip
                  key={city}
                  label={city}
                  active={getSelectedCities(draftProfile).includes(city)}
                  onPress={() => setDraftProfile((d) => toggleProfileCity(d, city))}
                />
              ))}
            </View>
            <PrimaryButton
              label={t('onboarding.continue')}
              onPress={() => setStep(4)}
              icon={ChevronRight}
            />
          </View>
        ) : null}

        {isDays ? (
          <View style={styles.stepCard}>
            <Text style={styles.stepTitle}>{t('onboarding.daysTitle')}</Text>
            <View style={styles.tripDaysPicker}>
              <Pressable
                style={styles.dayAdjustButton}
                onPress={() =>
                  setDraftProfile((d) => ({ ...d, tripDays: Math.max(1, d.tripDays - 1) }))
                }
              >
                <Text style={styles.dayAdjustText}>-</Text>
              </Pressable>
              <View style={styles.dayNumberWrap}>
                <Text style={styles.dayNumber}>{draftProfile.tripDays}</Text>
                <Text style={styles.dayNumberLabel}>{t('onboarding.tripDays')}</Text>
              </View>
              <Pressable
                style={styles.dayAdjustButton}
                onPress={() =>
                  setDraftProfile((d) => ({ ...d, tripDays: Math.min(14, d.tripDays + 1) }))
                }
              >
                <Text style={styles.dayAdjustText}>+</Text>
              </Pressable>
            </View>
            <View style={styles.daysRow}>
              {[1, 2, 3, 5].map((n) => (
                <Pressable
                  key={n}
                  style={[
                    styles.dayStepper,
                    draftProfile.tripDays === n && styles.dayStepperActive,
                  ]}
                  onPress={() => setDraftProfile((d) => ({ ...d, tripDays: n }))}
                >
                  <Text
                    style={[
                      styles.dayStepperText,
                      draftProfile.tripDays === n && styles.dayStepperTextActive,
                    ]}
                  >
                    {n}
                  </Text>
                </Pressable>
              ))}
            </View>
            <PrimaryButton label={t('onboarding.start')} onPress={onSave} />
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ============================================================
 *  WordPress News Section & Reader Components
 * ============================================================ */

function WordPressNewsSection({
  wpNewsUrl,
  onOpenArticle,
  onOpenConfig,
}: {
  wpNewsUrl: string;
  onOpenArticle: (article: WpArticle) => void;
  onOpenConfig: () => void;
}) {
  const [configs, setConfigs] = useState<WpSheetConfig[]>([]);
  const [selectedSiteIndex, setSelectedSiteIndex] = useState<number>(-1); // -1 for All
  const [articles, setArticles] = useState<WpArticle[]>([]);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadNews = useCallback(
    async (targetPage: number = 1, siteIdx: number = selectedSiteIndex, existingConfigs?: WpSheetConfig[]) => {
      if (targetPage === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setErrorMsg(null);

      let activeConfigs = existingConfigs || configs;
      if (targetPage === 1 && activeConfigs.length === 0) {
        activeConfigs = await fetchWpConfigsFromSheet();
        setConfigs(activeConfigs);
      }

      try {
        let fetchedArticles: WpArticle[] = [];
        let moreAvailable = false;

        if (siteIdx === -1) {
          // Fetch merged posts from all Google Sheet sites
          const res = await fetchWordPressPostsFromConfigs(activeConfigs, targetPage, 6);
          fetchedArticles = res.articles;
          moreAvailable = res.hasMore;
        } else {
          // Fetch posts from selected site
          const cfg = activeConfigs[siteIdx] || { siteUrl: wpNewsUrl || DEFAULT_WP_URL, categories: 'Soft' };
          const res = await fetchWordPressPosts(cfg.siteUrl, 8, cfg.categories, targetPage);
          fetchedArticles = res.articles;
          moreAvailable = res.hasMore ?? false;
          if (res.error && targetPage === 1) {
            setErrorMsg(res.error);
          }
        }

        if (targetPage === 1) {
          setArticles(fetchedArticles);
        } else {
          setArticles((prev) => {
            const existingIds = new Set(prev.map((a) => a.id));
            const newItems = fetchedArticles.filter((a) => !existingIds.has(a.id));
            return [...prev, ...newItems];
          });
        }
        setHasMore(moreAvailable);
        setPage(targetPage);
      } catch {
        if (targetPage === 1) {
          setErrorMsg('Không thể tải bài viết');
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [configs, selectedSiteIndex, wpNewsUrl]
  );

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const fetchedConfigs = await fetchWpConfigsFromSheet();
      setConfigs(fetchedConfigs);
      await loadNews(1, -1, fetchedConfigs);
    })();
  }, []);

  const handleSelectTab = (idx: number) => {
    setSelectedSiteIndex(idx);
    void loadNews(1, idx);
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      void loadNews(page + 1);
    }
  };

  return (
    <View style={styles.v2Section}>
      <View style={styles.homeSectionHeader}>
        <View style={styles.flexOne}>
          <View style={styles.newsTitleRow}>
            <View style={styles.newsTitleIconWrap}>
              <Newspaper color={colors.primary} size={18} />
            </View>
            <Text style={styles.homeSectionTitle}>📰 Tin tức & Cập nhật</Text>
          </View>
          <Text style={styles.newsSubtext} numberOfLines={1}>
            Cập nhật thông tin công nghệ & du lịch mới nhất
          </Text>
        </View>
        <View style={styles.newsHeaderActions}>
          <Pressable accessibilityLabel="Làm mới tin tức" style={styles.newsIconButton} onPress={() => loadNews(1)}>
            <RefreshCw color={colors.primary} size={15} />
          </Pressable>
        </View>
      </View>

      {/* Multi-site Category Filter Chips */}
      {configs.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.newsTabsRail}>
          <Pressable
            style={[styles.newsTabChip, selectedSiteIndex === -1 && styles.newsTabChipActive]}
            onPress={() => handleSelectTab(-1)}
          >
            <Text style={[styles.newsTabChipText, selectedSiteIndex === -1 && styles.newsTabChipTextActive]}>
              Tất cả nguồn ({configs.length})
            </Text>
          </Pressable>
          {configs.map((cfg, idx) => {
            const domainLabel = cfg.siteUrl.replace(/^https?:\/\//i, '').replace(/\/+$/, '').replace(/^www\./i, '');
            return (
              <Pressable
                key={`${cfg.siteUrl}-${idx}`}
                style={[styles.newsTabChip, selectedSiteIndex === idx && styles.newsTabChipActive]}
                onPress={() => handleSelectTab(idx)}
              >
                <Text style={[styles.newsTabChipText, selectedSiteIndex === idx && styles.newsTabChipTextActive]}>
                  {cfg.categories ? `${cfg.categories} · ` : ''}{domainLabel}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      {errorMsg ? (
        <View style={styles.newsErrorBanner}>
          <Info color="#92400e" size={15} />
          <Text style={styles.newsErrorText}>{errorMsg}. Đang dùng bài viết mẫu.</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.newsLoadingRail}>
          <ActivityIndicator color={colors.primary} size="small" />
          <Text style={styles.newsLoadingText}>Đang tải bài viết mới nhất...</Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.v2CardRail}>
          {articles.map((item) => (
            <Pressable key={item.id} style={styles.v2NewsCard} onPress={() => onOpenArticle(item)}>
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.v2NewsImage}
                defaultSource={require('./assets/photos/ha-long-bay.jpg')}
              />
              <View style={styles.v2NewsBadge}>
                <Text style={styles.v2NewsBadgeText}>{item.category}</Text>
              </View>
              <View style={styles.v2NewsBody}>
                <Text style={styles.v2NewsTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.v2NewsExcerpt} numberOfLines={2}>{item.excerpt}</Text>
                <View style={styles.v2NewsMetaRow}>
                  <View style={styles.v2NewsMetaItem}>
                    <Clock color={colors.muted} size={12} />
                    <Text style={styles.v2NewsMetaText}>{item.date}</Text>
                  </View>
                  <Text style={styles.v2NewsReadTime}>{item.readTime}</Text>
                </View>
              </View>
            </Pressable>
          ))}

          {/* Next Page / Load More Card */}
          {hasMore ? (
            <Pressable
              style={styles.newsLoadMoreCard}
              onPress={handleLoadMore}
              disabled={loadingMore}
            >
              {loadingMore ? (
                <ActivityIndicator color={colors.primary} size="small" />
              ) : (
                <>
                  <View style={styles.newsLoadMoreIconCircle}>
                    <ChevronRight color={colors.primary} size={22} />
                  </View>
                  <Text style={styles.newsLoadMoreTitle}>Trang tiếp theo</Text>
                  <Text style={styles.newsLoadMoreSub}>Tải thêm bài viết ➔</Text>
                </>
              )}
            </Pressable>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

function NewsDetailModal({
  article,
  onClose,
}: {
  article: WpArticle | null;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [viewMode, setViewMode] = useState<'reader' | 'web'>('reader');

  if (!article) return null;

  const handleOpenBrowser = () => {
    if (article.link) {
      void Linking.openURL(article.link);
    }
  };

  return (
    <Modal animationType="slide" transparent={false} visible={article !== null} onRequestClose={onClose}>
      <View style={[styles.newsModalSafeArea, { paddingTop: Math.max(insets.top, 44) }]}>
        <View style={styles.newsModalHeader}>
          <Pressable accessibilityLabel="Đóng tin tức" style={styles.newsModalCloseBtn} onPress={onClose}>
            <ArrowLeft color={colors.text} size={22} />
          </Pressable>
          <View style={styles.newsModalTabSwitcher}>
            <Pressable
              style={[styles.newsModalTab, viewMode === 'reader' && styles.newsModalTabActive]}
              onPress={() => setViewMode('reader')}
            >
              <Text style={[styles.newsModalTabText, viewMode === 'reader' && styles.newsModalTabTextActive]}>Đọc nhanh</Text>
            </Pressable>
            <Pressable
              style={[styles.newsModalTab, viewMode === 'web' && styles.newsModalTabActive]}
              onPress={() => setViewMode('web')}
            >
              <Text style={[styles.newsModalTabText, viewMode === 'web' && styles.newsModalTabTextActive]}>Trình duyệt</Text>
            </Pressable>
          </View>
          <Pressable accessibilityLabel="Mở trên trình duyệt ngoài" style={styles.newsModalCloseBtn} onPress={handleOpenBrowser}>
            <ExternalLink color={colors.primary} size={20} />
          </Pressable>
        </View>

        {viewMode === 'reader' ? (
          <ScrollView contentContainerStyle={styles.newsReaderContent} showsVerticalScrollIndicator={false}>
            <Image source={{ uri: article.imageUrl }} style={styles.newsReaderHeroImg} />
            <View style={styles.newsReaderCategoryWrap}>
              <Text style={styles.newsReaderCategory}>{article.category}</Text>
              <Text style={styles.newsReaderDot}>•</Text>
              <Text style={styles.newsReaderReadTime}>{article.readTime}</Text>
            </View>
            <Text style={styles.newsReaderTitle}>{article.title}</Text>
            <View style={styles.newsReaderMetaRow}>
              <User color={colors.muted} size={14} />
              <Text style={styles.newsReaderMetaText}>{article.author}</Text>
              <Text style={styles.newsReaderDot}>•</Text>
              <Clock color={colors.muted} size={14} />
              <Text style={styles.newsReaderMetaText}>{article.date}</Text>
            </View>
            <View style={styles.newsReaderDivider} />
            <Text style={styles.newsReaderBody}>{article.content}</Text>

            <Pressable style={styles.newsReaderCtaBtn} onPress={handleOpenBrowser}>
              <Globe color={colors.surface} size={18} />
              <Text style={styles.newsReaderCtaText}>Xem bài viết gốc trên Web</Text>
              <ExternalLink color={colors.surface} size={16} />
            </Pressable>
          </ScrollView>
        ) : (
          <View style={styles.flexOne}>
            <WebView
              source={{ uri: article.link }}
              startInLoadingState
              renderLoading={() => (
                <View style={styles.newsWebLoading}>
                  <ActivityIndicator color={colors.primary} size="large" />
                </View>
              )}
            />
          </View>
        )}
      </View>
    </Modal>
  );
}

function WpUrlConfigModal({
  visible,
  currentUrl,
  onSave,
  onClose,
}: {
  visible: boolean;
  currentUrl: string;
  onSave: (url: string) => void;
  onClose: () => void;
}) {
  const [inputUrl, setInputUrl] = useState(currentUrl);
  const [isSyncing, setIsSyncing] = useState(false);
  const [sheetCategory, setSheetCategory] = useState<string>('');

  useEffect(() => {
    if (visible) {
      setInputUrl(currentUrl);
    }
  }, [visible, currentUrl]);

  const handleSyncSheet = async () => {
    setIsSyncing(true);
    const sheetConfig = await fetchWpConfigFromSheet();
    if (sheetConfig.siteUrl) {
      setInputUrl(sheetConfig.siteUrl);
      setSheetCategory(sheetConfig.categories);
    }
    setIsSyncing(false);
  };

  const handleOpenSheetLink = () => {
    void Linking.openURL('https://docs.google.com/spreadsheets/d/1SDTIcToGLww8beiHeyN71p30qVN3ZqjO6pvsJK0Nsh8/edit?gid=0#gid=0');
  };

  const handleSave = () => {
    const normalized = normalizeWpUrl(inputUrl);
    onSave(normalized);
    onClose();
  };

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.wpConfigModalBox} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalHeaderRow}>
            <View style={styles.newsTitleRow}>
              <Newspaper color={colors.primary} size={20} />
              <Text style={styles.modalHeaderTitle}>Cấu hình WordPress News</Text>
            </View>
            <Pressable onPress={onClose}><X color={colors.muted} size={20} /></Pressable>
          </View>

          <Text style={styles.wpConfigDesc}>
            Cấu hình được tự động lấy từ Google Sheet công khai hoặc bạn có thể đồng bộ/thay đổi thủ công bên dưới.
          </Text>

          <View style={styles.wpSheetBox}>
            <View style={styles.wpSheetHeaderRow}>
              <Text style={styles.wpSheetTitle}>📊 Google Sheet Cấu Hình:</Text>
              <Pressable style={styles.wpSheetLinkBtn} onPress={handleOpenSheetLink}>
                <Text style={styles.wpSheetLinkText}>Mở Google Sheet ↗</Text>
              </Pressable>
            </View>
            <Pressable style={styles.wpSyncSheetBtn} onPress={handleSyncSheet} disabled={isSyncing}>
              <RefreshCw color={colors.primary} size={14} />
              <Text style={styles.wpSyncSheetBtnText}>
                {isSyncing ? 'Đang đọc Google Sheet...' : 'Lấy URL & Danh mục từ Google Sheet'}
              </Text>
            </Pressable>
            {sheetCategory ? (
              <Text style={styles.wpSheetCategoryNotice}>
                Chuyên mục Google Sheet: <Text style={{ fontWeight: '700', color: colors.primary }}>{sheetCategory}</Text>
              </Text>
            ) : null}
          </View>

          <Text style={styles.wpConfigLabel}>URL Trang Web WordPress:</Text>
          <TextInput
            style={styles.wpConfigInput}
            value={inputUrl}
            onChangeText={setInputUrl}
            placeholder="https://aiautotool.com"
            placeholderTextColor={colors.muted}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />

          <View style={styles.wpPresetRow}>
            <Text style={styles.wpPresetLabel}>Mẫu mặc định:</Text>
            <Pressable style={styles.wpPresetChip} onPress={() => setInputUrl(DEFAULT_WP_URL)}>
              <Text style={styles.wpPresetChipText}>https://aiautotool.com</Text>
            </Pressable>
          </View>

          <View style={styles.wpModalActions}>
            <Pressable style={styles.wpCancelBtn} onPress={onClose}>
              <Text style={styles.wpCancelText}>Hủy</Text>
            </Pressable>
            <Pressable style={styles.wpSaveBtn} onPress={handleSave}>
              <Check color={colors.surface} size={16} />
              <Text style={styles.wpSaveText}>Lưu & Cập nhật</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function HomeScreen({
  profile,
  locationLabel,
  locationPermission,
  locationLoading,
  recentSearches,
  popularPlaces,
  nearbyPlaces,
  popularFoods,
  placesCount,
  citiesCount,
  onOpenSearch,
  onOpenPlace,
  onOpenFood,
  onOpenFilter,
  onOpenTab,
  isFavorite,
  onToggleFavorite,
  onRequestLocation,
  t,
  wpNewsUrl,
  onOpenArticle,
  onOpenWpConfig,
}: {
  profile: UserProfile;
  locationLabel: string | null;
  locationPermission: AppLocationPermission;
  locationLoading: boolean;
  recentSearches: RecentSearch[];
  popularPlaces: Place[];
  nearbyPlaces: Place[];
  popularFoods: Food[];
  placesCount: number;
  citiesCount: number;
  onOpenSearch: () => void;
  onOpenPlace: (id: string) => void;
  onOpenFood: (id: string) => void;
  onOpenFilter: () => void;
  onOpenTab: (tab: TabId) => void;
  isFavorite: (type: SavedItemType, id: string) => boolean;
  onToggleFavorite: (type: SavedItemType, id: string) => void;
  onRequestLocation: () => void;
  t: (key: TranslationKey) => string;
  wpNewsUrl: string;
  onOpenArticle: (article: WpArticle) => void;
  onOpenWpConfig: () => void;
}) {
  const { data: translatedPlaces } = useTranslatedData(popularPlaces);
  const { data: translatedFoods } = useTranslatedData(popularFoods);
  const { data: translatedNearbyPlaces } = useTranslatedData(nearbyPlaces);
  const categories: { label: string; icon: typeof Home; target: TabId }[] = [
    { label: 'Beaches', icon: Waves, target: 'explore' },
    { label: 'Mountains', icon: Mountain, target: 'explore' },
    { label: 'Cities', icon: MapPin, target: 'explore' },
    { label: 'Food', icon: Utensils, target: 'food' },
    { label: 'Culture', icon: BookOpen, target: 'culture' },
    { label: 'Festival', icon: PartyPopper, target: 'explore' },
    { label: 'Shopping', icon: ShoppingBag, target: 'explore' },
    { label: 'Photo spots', icon: Camera, target: 'explore' },
  ];

  const PlaceCard = ({ place }: { place: Place }) => (
    <Pressable style={styles.v2PlaceCard} onPress={() => onOpenPlace(place.id)}>
      <Image source={place.image} style={styles.v2PlaceImage} />
      <Pressable
        accessibilityLabel={`Save ${place.name}`}
        style={styles.v2SaveButton}
        onPress={() => onToggleFavorite('place', place.id)}
      >
        <Heart
          color={isFavorite('place', place.id) ? colors.primary : colors.surface}
          fill={isFavorite('place', place.id) ? colors.primary : 'transparent'}
          size={18}
        />
      </Pressable>
      <View style={styles.v2PlaceBody}>
        <Text style={styles.v2PlaceName} numberOfLines={1}>{place.name}</Text>
        <View style={styles.v2MetaRow}>
          <Star color={colors.accent} fill={colors.accent} size={13} />
          <Text style={styles.v2MetaText}>4.8</Text>
          <Text style={styles.v2OpenText}>Open</Text>
        </View>
        <Text style={styles.v2PlaceSub} numberOfLines={1}>📍 {place.city} · {place.category}</Text>
      </View>
    </Pressable>
  );

  return (
    <ScrollView contentContainerStyle={styles.v2HomeContent} showsVerticalScrollIndicator={false}>
      <View style={styles.v2Hero}>
        <View style={styles.homeTopRow}>
          <View style={styles.flexOne}>
            <Text style={styles.v2Greeting}>{t('home.greeting')} 👋</Text>
            <Text style={styles.v2HeroTitle}>{t('home.discoverTitle')}</Text>
          </View>
          <IconButton accessibilityLabel="Open travel alerts" icon={Bell} onPress={() => onOpenTab('notifications')} style={styles.v2Bell} />
        </View>
        <View style={styles.v2SearchWrap}>
          <Pressable style={styles.v2SearchMain} onPress={onOpenSearch}>
            <SearchIcon color={colors.muted} size={19} />
            <Text style={styles.homeSearchText}>{t('home.searchPlaceholder')}</Text>
          </Pressable>
          <Pressable accessibilityLabel="Open AI voice assistant" style={styles.v2SearchAction} onPress={() => onOpenTab('ai')}><Mic color={colors.primary} size={20} /></Pressable>
          <Pressable accessibilityLabel="Open AI camera" style={styles.v2SearchAction} onPress={() => onOpenTab('ai')}><Camera color={colors.primary} size={20} /></Pressable>
        </View>
        <Pressable accessibilityRole="button" onPress={onRequestLocation} style={styles.homeLocationPill}>
          {locationLoading ? <ActivityIndicator color={colors.primary} size="small" /> : <MapPin color={colors.primary} size={16} />}
          <Text style={styles.homeLocationText} numberOfLines={1}>
            {locationPermission === 'granted'
              ? (locationLabel || 'Current location')
              : 'Use my current location'}
          </Text>
          {locationPermission === 'granted' ? <RefreshCw color={colors.primary} size={14} /> : <ChevronRight color={colors.primary} size={15} />}
        </Pressable>
        <Pressable style={styles.v2AskAi} onPress={() => onOpenTab('ai')}>
          <Sparkles color={colors.surface} size={17} />
          <Text style={styles.v2AskAiText}>Ask Vinago+ AI</Text>
          <ChevronRight color={colors.surface} size={17} />
        </Pressable>
      </View>

      <View style={styles.v2Section}>
        <Text style={styles.homeSectionTitle}>{t('home.toolsTitle')}</Text>
        <View style={styles.v2QuickActions}>
          {featureShortcuts.slice(0, 4).map((shortcut, index) => {
            const Icon = shortcut.icon;
            return (
              <Pressable key={`${shortcut.labelKey}-${index}`} style={styles.v2QuickItem} onPress={() => onOpenTab(shortcut.id)}>
                <View style={styles.v2QuickIcon}><Icon color={colors.primary} size={21} /></View>
                <Text style={styles.v2QuickLabel}>{t(shortcut.labelKey)}</Text>
              </Pressable>
            );
          })}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.v2MoreTools}>
          {featureShortcuts.slice(4).map((shortcut, index) => {
            const Icon = shortcut.icon;
            return <Pressable key={`more-${shortcut.labelKey}-${index}`} style={styles.v2MoreToolChip} onPress={() => onOpenTab(shortcut.id)}><Icon color={colors.primary} size={17} /><Text style={styles.v2MoreToolText}>{t(shortcut.labelKey)}</Text></Pressable>;
          })}
        </ScrollView>
      </View>

      <View style={styles.v2Section}>
        <View style={styles.homeSectionHeader}>
          <Text style={styles.homeSectionTitle}>Explore by category</Text>
          <Pressable onPress={onOpenFilter}><Filter color={colors.primary} size={18} /></Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.v2CategoryRow}>
          {categories.map(({ label, icon: Icon, target }) => (
            <Pressable key={label} style={styles.v2Category} onPress={() => onOpenTab(target)}>
              <View style={styles.v2CategoryIcon}><Icon color={colors.primary} size={21} /></View>
              <Text style={styles.v2CategoryText}>{label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.v2Section}>
        <View style={styles.homeSectionHeader}>
          <Text style={styles.homeSectionTitle}>🔥 Trending destinations</Text>
          <Pressable onPress={() => onOpenTab('explore')}><Text style={styles.homeSectionLink}>{t('home.popularViewAll')}</Text></Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.v2CardRail}>
          {translatedPlaces.slice(0, 5).map((place) => <PlaceCard key={place.id} place={place} />)}
        </ScrollView>
      </View>

      <WordPressNewsSection
        wpNewsUrl={wpNewsUrl}
        onOpenArticle={onOpenArticle}
        onOpenConfig={onOpenWpConfig}
      />

      <View style={styles.v2Section}>
        <View style={styles.homeSectionHeader}>
          <Text style={styles.homeSectionTitle}>💎 Hidden gems near {locationLabel || (profile.currentCity === 'Other' ? 'you' : profile.currentCity)}</Text>
          <Pressable accessibilityLabel="Refresh nearby places" onPress={onRequestLocation}><Navigation color={colors.primary} size={18} /></Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.v2CardRail}>
          {translatedNearbyPlaces.slice(0, 5).map((place) => <PlaceCard key={`nearby-${place.id}`} place={place} />)}
        </ScrollView>
      </View>

      <View style={styles.v2Section}>
        <Text style={styles.homeSectionTitle}>🍜 Must eat</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.v2FoodRail}>
          {translatedFoods.slice(0, 5).map((food) => (
            <Pressable key={food.id} style={styles.v2FoodCard} onPress={() => onOpenFood(food.id)}>
              <Image source={food.image} style={styles.v2FoodImage} />
              <Text style={styles.v2PlaceName} numberOfLines={1}>{food.name}</Text>
              <Text style={styles.v2PlaceSub}>{food.region} · ⭐ 4.9</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <Pressable style={styles.v2EventBanner} onPress={() => onOpenTab('explore')}>
        <View style={styles.v2EventIcon}><PartyPopper color={colors.primary} size={24} /></View>
        <View style={styles.flexOne}>
          <Text style={styles.v2EventTitle}>Events nearby</Text>
          <Text style={styles.v2PlaceSub}>Discover festivals and local experiences this week</Text>
        </View>
        <ChevronRight color={colors.primary} size={20} />
      </Pressable>

      {recentSearches.length > 0 ? <Text style={styles.v2RecentHint}>Recent: {recentSearches[0].query}</Text> : null}
    </ScrollView>
  );
}

function ExploreScreen({
  places: items,
  selectedCity,
  selectedProfileCities,
  availableCities,
  onCityChange,
  onOpenPlace,
  onOpenFilter,
  onOpenSearch,
  t,
}: {
  places: Place[];
  selectedCity: City | 'All';
  selectedProfileCities: City[];
  availableCities: City[];
  onCityChange: (city: City | 'All') => void;
  onOpenPlace: (id: string) => void;
  onOpenFilter: () => void;
  onOpenSearch: () => void;
  t: (key: TranslationKey) => string;
}) {
  const cityTabs: (City | 'All')[] = [
    'All',
    ...selectedProfileCities.filter((city) => availableCities.includes(city)),
    ...availableCities.filter((city) => !selectedProfileCities.includes(city)),
  ];
  const { data: translatedItems } = useTranslatedData(items);
  return (
    <View style={styles.flexOne}>
      <View style={styles.exploreTopRow}>
        <View>
          <Text style={styles.exploreTitle}>{t('explore.title')}</Text>
          <Text style={styles.exploreSubtitle}>
            {items.length} {t('explore.countLabel')}
          </Text>
        </View>
        <View style={styles.rowGap}>
          <IconButton icon={Filter} onPress={onOpenFilter} />
          <IconButton icon={SearchIcon} onPress={onOpenSearch} />
        </View>
      </View>
      <View style={styles.exploreCityRail}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.exploreCityScroll}
          contentContainerStyle={styles.exploreCityRow}
        >
          {cityTabs.map((city) => (
            <Pressable
              key={city}
              style={[styles.exploreCityTab, selectedCity === city && styles.exploreCityTabActive]}
              onPress={() => onCityChange(city)}
            >
              <Text
                style={[
                  styles.exploreCityTabText,
                  selectedCity === city && styles.exploreCityTabTextActive,
                ]}
              >
                {city === 'All' ? t('explore.allCities') : city}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      <ScrollView contentContainerStyle={styles.exploreList} showsVerticalScrollIndicator={false}>
        {translatedItems.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title={t('explore.noResults')}
            body={t('explore.noResultsBody')}
          />
        ) : (
          translatedItems.map((place) => (
            <Pressable
              key={place.id}
              style={styles.exploreListCard}
              onPress={() => onOpenPlace(place.id)}
            >
              <Image source={place.image} style={styles.exploreListImage} />
              <View style={styles.exploreListBody}>
                <Text style={styles.exploreListName}>{place.name}</Text>
                <Text style={styles.exploreListSub}>
                  {place.city} · {place.category}
                </Text>
                <View style={styles.exploreListRating}>
                  <Star color={colors.accent} fill={colors.accent} size={12} />
                  <Text style={styles.exploreListRatingText}>4.7 (210)</Text>
                </View>
              </View>
              <Heart color={colors.muted} size={18} />
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function NearbyScreen({
  places: items,
  coordinates,
  locationLabel,
  permission,
  isLocating,
  error,
  onRequestLocation,
  onOpenPlace,
  t,
}: {
  places: Place[];
  coordinates: AppCoordinates | null;
  locationLabel: string | null;
  permission: AppLocationPermission;
  isLocating: boolean;
  error: string | null;
  onRequestLocation: () => void;
  onOpenPlace: (id: string) => void;
  t: (key: TranslationKey) => string;
}) {
  const [radiusKm, setRadiusKm] = useState<5 | 20 | 50 | 0>(20);
  const isVietnamese = t('home.tool.nearby') === 'Gần đây';
  const placesWithDistance = useMemo(() => {
    if (!coordinates) return [];
    return items
      .map((place) => ({
        place,
        distanceKm: getDistanceKm(coordinates, { lat: place.lat, lng: place.lng }),
      }))
      .sort((first, second) => first.distanceKm - second.distanceKm);
  }, [coordinates, items]);
  const visiblePlaces = radiusKm === 0
    ? placesWithDistance.slice(0, 20)
    : placesWithDistance.filter((item) => item.distanceKm <= radiusKm).slice(0, 20);
  const { data: translatedItems } = useTranslatedData(visiblePlaces.map((item) => item.place));

  if (!coordinates) {
    return (
      <ScrollView contentContainerStyle={styles.nearbyEmptyContent} showsVerticalScrollIndicator={false}>
        <View style={styles.nearbyEmptyIcon}><Navigation color={colors.primary} size={34} /></View>
        <Text style={styles.nearbyEmptyTitle}>{isVietnamese ? 'Khám phá địa điểm xung quanh bạn' : 'Discover places around you'}</Text>
        <Text style={styles.nearbyEmptyBody}>
          {isVietnamese
            ? 'Bật vị trí để xem địa điểm gần nhất, khoảng cách thực tế và chỉ đường từ vị trí hiện tại.'
            : 'Turn on location to see the nearest places, real distance and directions from where you are.'}
        </Text>
        {error ? <Text style={styles.locationPermissionError}>{error}</Text> : null}
        <Pressable disabled={isLocating} onPress={onRequestLocation} style={[styles.nearbyLocationButton, isLocating && styles.disabledButton]}>
          {isLocating ? <ActivityIndicator color={colors.surface} size="small" /> : <MapPin color={colors.surface} size={19} />}
          <Text style={styles.nearbyLocationButtonText}>
            {permission === 'denied'
              ? (isVietnamese ? 'Cấp lại quyền vị trí' : 'Enable location permission')
              : (isVietnamese ? 'Dùng vị trí hiện tại' : 'Use current location')}
          </Text>
        </Pressable>
        <View style={styles.locationPermissionPrivacy}>
          <ShieldAlert color={colors.primary} size={17} />
          <Text style={styles.locationPermissionPrivacyText}>
            {isVietnamese
              ? 'Tính năng này chỉ dùng vị trí khi app đang mở. Live Team chỉ chia sẻ vị trí nền sau khi bạn chủ động bật “Chia sẻ GPS”.'
              : 'This feature uses location only while the app is open. Live Team shares background location only after you turn on “Share GPS”.'}
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.flexOne}>
      <View style={styles.nearbyHeader}>
        <View style={styles.nearbyLocationRow}>
          <View style={styles.nearbyGpsDot} />
          <View style={styles.flexOne}>
            <Text style={styles.nearbyEyebrow}>{isVietnamese ? 'VỊ TRÍ GPS HIỆN TẠI' : 'CURRENT GPS LOCATION'}</Text>
            <Text style={styles.nearbyLocationName} numberOfLines={1}>{locationLabel || `${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`}</Text>
          </View>
          <Pressable accessibilityLabel="Refresh current location" disabled={isLocating} onPress={onRequestLocation} style={styles.nearbyRefreshButton}>
            {isLocating ? <ActivityIndicator color={colors.primary} size="small" /> : <RefreshCw color={colors.primary} size={18} />}
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.nearbyRadiusRow}>
          {([5, 20, 50, 0] as const).map((radius) => (
            <Pressable key={radius} onPress={() => setRadiusKm(radius)} style={[styles.nearbyRadiusChip, radiusKm === radius && styles.nearbyRadiusChipActive]}>
              <Text style={[styles.nearbyRadiusText, radiusKm === radius && styles.nearbyRadiusTextActive]}>{radius === 0 ? (isVietnamese ? 'Gần nhất' : 'Nearest') : `${radius} km`}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <Text style={styles.nearbyResultCount}>
          {visiblePlaces.length} {isVietnamese ? 'địa điểm trong phạm vi đã chọn' : 'places in the selected radius'}
        </Text>
      </View>
      <ScrollView contentContainerStyle={styles.nearbyList} showsVerticalScrollIndicator={false}>
        {visiblePlaces.length === 0 ? (
          <View style={styles.nearbyNoResults}>
            <MapPin color={colors.muted} size={30} />
            <Text style={styles.nearbyEmptyTitle}>{isVietnamese ? 'Chưa có địa điểm trong phạm vi này' : 'No places in this radius yet'}</Text>
            <Text style={styles.nearbyEmptyBody}>{isVietnamese ? 'Hãy chọn bán kính lớn hơn hoặc mục Gần nhất.' : 'Choose a larger radius or select Nearest.'}</Text>
          </View>
        ) : visiblePlaces.map(({ place, distanceKm }, index) => {
          const translatedPlace = translatedItems[index] ?? place;
          return (
            <Pressable key={place.id} onPress={() => onOpenPlace(place.id)} style={styles.nearbyPlaceCard}>
              <Image source={place.image} style={styles.nearbyPlaceImage} />
              <View style={styles.nearbyPlaceBody}>
                <Text style={styles.nearbyPlaceName} numberOfLines={1}>{translatedPlace.name}</Text>
                <Text style={styles.nearbyPlaceMeta} numberOfLines={1}>{translatedPlace.city} · {translatedPlace.category}</Text>
                <View style={styles.nearbyDistanceRow}>
                  <Navigation color={colors.primary} size={14} />
                  <Text style={styles.nearbyDistanceText}>{roundDistanceKm(distanceKm).toLocaleString()} km</Text>
                  <Text style={styles.nearbyDistanceHint}>{isVietnamese ? 'từ vị trí của bạn' : 'from your location'}</Text>
                </View>
              </View>
              <ChevronRight color={colors.muted} size={19} />
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function PlaceDetailScreen({
  place,
  isFavorite,
  onToggleFavorite,
  onBack,
  onOpenMap,
  onAskAi,
  onOpenLivePreview,
  t,
}: {
  place: Place;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onBack: () => void;
  onOpenMap: () => void;
  onAskAi: () => void;
  onOpenLivePreview: () => void;
  t: (key: TranslationKey) => string;
}) {
  const { data: translatedPlace } = useTranslatedData(place);
  const realityLayer = useMemo(
    () => buildDemoRealityLayer({ id: place.id, name: translatedPlace.name, lat: place.lat, lng: place.lng }),
    [place.id, place.lat, place.lng, translatedPlace.name],
  );
  return (
    <ScrollView contentContainerStyle={styles.placeDetailContent} showsVerticalScrollIndicator={false}>
      <View style={styles.placeDetailImageWrap}>
        <Image source={place.image} style={styles.placeDetailImage} />
        <View style={styles.placeDetailOverlay} />
        <View style={styles.placeDetailTopBar}>
          <IconButton
            icon={ArrowLeft}
            onPress={onBack}
            color={colors.surface}
            style={styles.placeDetailBack}
          />
          <Pressable
            onPress={onToggleFavorite}
            style={styles.placeDetailSave}
          >
            <Heart
              color={isFavorite ? colors.surface : colors.surface}
              fill={isFavorite ? colors.primary : 'transparent'}
              size={20}
            />
          </Pressable>
        </View>
      </View>
      <View style={styles.placeDetailBody}>
        <Text style={styles.placeDetailName}>{translatedPlace.name}</Text>
        <Text style={styles.placeDetailSub}>
          {translatedPlace.city} · {translatedPlace.category}
        </Text>
        <View style={styles.ratingRow}>
          <Star color={colors.accent} fill={colors.accent} size={14} />
          <Text style={styles.ratingText}>4.8 (212 đánh giá)</Text>
        </View>
        <SectionTitle title={t('place.aboutTitle')} />
        <Text style={styles.bodyText}>{translatedPlace.description}</Text>
        <SectionTitle title={t('place.whyGoTitle')} />
        <Text style={styles.bodyText}>{translatedPlace.whyGo}</Text>
        <SectionTitle title={t('place.tagsTitle')} />
        <View style={styles.tagRow}>
          {translatedPlace.tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
        <SectionTitle title={t('place.tipsTitle')} />
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('place.bestTime')}</Text>
            <Text style={styles.infoValue}>{translatedPlace.bestTime}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('place.ticket')}</Text>
            <Text style={styles.infoValue}>{translatedPlace.ticketPrice}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('place.openHours')}</Text>
            <Text style={styles.infoValue}>{translatedPlace.openHours}</Text>
          </View>
        </View>
        <Pressable style={styles.mapPreview} onPress={onOpenMap}>
          <View style={styles.mapPinRow}>
            <MapPin color={colors.primary} size={16} />
            <Text style={styles.mapPinText}>
              {place.lat.toFixed(3)}, {place.lng.toFixed(3)}
            </Text>
          </View>
          <Text style={styles.mapOpenLink}>{t('place.openInMaps')}</Text>
        </Pressable>
        <PlaceRealityCard status={realityLayer.status} />
        <TravelDecisionCard decision={realityLayer.decision} />
        <RealityActionButtons onLivePreview={onOpenLivePreview} />
        <RealityScoreCard score={realityLayer.score} />
        <PrimaryButton
          label={isFavorite ? t('place.saved') : t('place.save')}
          onPress={onToggleFavorite}
          icon={Heart}
        />
        <Pressable style={styles.askAiButton} onPress={onAskAi}>
          <Bot color={colors.primary} size={18} />
          <Text style={styles.askAiText}>{t('place.askAi')}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function TranslatedLivePreviewRequestScreen({
  place,
  isSubmitting,
  errorMessage,
  onPayAndRequest,
  onBack,
}: {
  place: LivePreviewPlaceSummary;
  isSubmitting: boolean;
  errorMessage: string | null;
  onPayAndRequest: (input: { requestedLanguage: string; note: string }) => void;
  onBack: () => void;
}) {
  const { data: translatedPlace } = useTranslatedData(place);

  return (
    <LivePreviewRequestScreen
      place={translatedPlace}
      isSubmitting={isSubmitting}
      errorMessage={errorMessage}
      onPayAndRequest={onPayAndRequest}
      onBack={onBack}
    />
  );
}

function TranslatedLivePreviewWaitingScreen({
  request,
  role,
  errorMessage,
  onRefresh,
  onJoinCall,
  onCancel,
  onOpenCompletion,
}: {
  request: LivePreviewRequest | null;
  role: LivePreviewActorRole;
  errorMessage: string | null;
  onRefresh: () => void;
  onJoinCall: () => void;
  onCancel: () => void;
  onOpenCompletion: () => void;
}) {
  const placeCopy = useMemo(
    () => (request ? { name: request.placeName, city: request.city } : null),
    [request],
  );
  const { data: translatedPlaceCopy } = useTranslatedData(placeCopy);
  const translatedRequest =
    request && translatedPlaceCopy
      ? {
          ...request,
          placeName: translatedPlaceCopy.name,
          city: translatedPlaceCopy.city,
        }
      : request;

  return (
    <LivePreviewWaitingScreen
      request={translatedRequest}
      role={role}
      errorMessage={errorMessage}
      onRefresh={onRefresh}
      onJoinCall={onJoinCall}
      onCancel={onCancel}
      onOpenCompletion={onOpenCompletion}
    />
  );
}

function FoodScreen({
  foods: items,
  onOpenFood,
  onOpenSearch,
  t,
}: {
  foods: Food[];
  onOpenFood: (id: string) => void;
  onOpenSearch: () => void;
  t: (key: TranslationKey) => string;
}) {
  const [tab, setTab] = useState<'all' | 'pho' | 'bun' | 'specialties'>('all');
  const tabs = [
    { id: 'all' as const, label: t('food.all') },
    { id: 'pho' as const, label: 'Phở & Bún' },
    { id: 'bun' as const, label: t('food.regional') },
    { id: 'specialties' as const, label: t('food.specialties') },
  ];
  const filtered = useMemo(() => {
    if (tab === 'all') return items;
    if (tab === 'pho') return items.filter((f) => /phở|bún/i.test(f.name));
    if (tab === 'bun') return items.filter((f) => /Bún|Cơm|Mì/.test(f.name));
    return items.filter((f) => /Hội An|Đà Nẵng|Huế/.test(f.region));
  }, [tab, items]);
  const { data: translatedFoods } = useTranslatedData(filtered);

  return (
    <View style={styles.flexOne}>
      <View style={styles.foodTopRow}>
        <Text style={styles.exploreTitle}>{t('food.title')}</Text>
        <IconButton icon={SearchIcon} onPress={onOpenSearch} />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.exploreCityScroll}
        contentContainerStyle={styles.exploreCityRow}
      >
        {tabs.map((tt) => (
          <Pressable
            key={tt.id}
            style={[styles.exploreCityTab, tab === tt.id && styles.exploreCityTabActive]}
            onPress={() => setTab(tt.id)}
          >
            <Text
              style={[
                styles.exploreCityTabText,
                tab === tt.id && styles.exploreCityTabTextActive,
              ]}
            >
              {tt.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <ScrollView contentContainerStyle={styles.foodList} showsVerticalScrollIndicator={false}>
        {translatedFoods.map((food) => (
          <Pressable
            key={food.id}
            style={styles.foodListCard}
            onPress={() => onOpenFood(food.id)}
          >
            <Image source={food.image} style={styles.foodListImage} />
            <View style={styles.foodListBody}>
              <Text style={styles.foodListName}>{food.name}</Text>
              <Text style={styles.foodListSub}>{food.englishName}</Text>
              <Text style={styles.foodListRegion}>{food.region}</Text>
              <View style={styles.foodListRating}>
                <Star color={colors.accent} fill={colors.accent} size={12} />
                <Text style={styles.foodListRatingText}>
                  {food.spicyLevel >= 2 ? '4.7' : '4.9'} (210)
                </Text>
              </View>
            </View>
            <Heart color={food.spicyLevel >= 2 ? colors.primary : colors.muted} size={18} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function FoodDetailScreen({
  food,
  isFavorite,
  onToggleFavorite,
  onBack,
  onAskAi,
  t,
}: {
  food: Food;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onBack: () => void;
  onAskAi: () => void;
  t: (key: TranslationKey) => string;
}) {
  const { data: translatedFood } = useTranslatedData(food);
  return (
    <ScrollView contentContainerStyle={styles.placeDetailContent} showsVerticalScrollIndicator={false}>
      <View style={styles.foodDetailHero}>
        <Image source={food.image} style={styles.placeDetailImage} />
        <View style={styles.placeDetailOverlay} />
        <View style={styles.placeDetailTopBar}>
          <IconButton
            icon={ArrowLeft}
            onPress={onBack}
            color={colors.surface}
            style={styles.placeDetailBack}
          />
        </View>
      </View>
      <View style={styles.placeDetailBody}>
        <Text style={styles.placeDetailName}>{translatedFood.name}</Text>
        <Text style={styles.placeDetailSub}>{translatedFood.englishName}</Text>
        <View style={styles.ratingRow}>
          <Star color={colors.accent} fill={colors.accent} size={14} />
          <Text style={styles.ratingText}>4.8 (212 đánh giá)</Text>
        </View>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('food.region')}</Text>
            <Text style={styles.infoValue}>{translatedFood.region}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('food.spice')}</Text>
            <Text style={styles.infoValue}>
              {food.spicyLevel === 0 ? '—' : `${food.spicyLevel}/3`}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('food.price')}</Text>
            <Text style={styles.infoValue}>{translatedFood.priceRange}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('food.pronunciation')}</Text>
            <Text style={styles.infoValue}>{food.pronunciation}</Text>
          </View>
        </View>
        <SectionTitle title={t('food.ingredientsTitle')} />
        <Text style={styles.bodyText}>{translatedFood.ingredients.join(', ')}</Text>
        {translatedFood.allergens.length > 0 ? (
          <>
            <SectionTitle title={t('food.allergensTitle')} />
            <View style={styles.warningBox}>
              <ShieldAlert color={colors.warning} size={18} />
              <Text style={styles.warningText}>{translatedFood.allergens.join(', ')}</Text>
            </View>
          </>
        ) : null}
        <SectionTitle title={t('food.orderingTitle')} />
        <View style={styles.phraseCard}>
          <Text style={styles.phraseEnglish}>{translatedFood.howToOrder}</Text>
          <Text style={styles.phraseVietnamese}>{food.howToOrder}</Text>
          <Text style={styles.phrasePronunciation}>{food.pronunciation}</Text>
        </View>
        <PrimaryButton
          label={isFavorite ? t('place.saved') : t('place.save')}
          onPress={onToggleFavorite}
          icon={Heart}
        />
        <Pressable style={styles.askAiButton} onPress={onAskAi}>
          <Bot color={colors.primary} size={18} />
          <Text style={styles.askAiText}>{t('food.askSpicy')}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function CultureScreen({
  topics,
  isFavorite,
  onToggleFavorite,
  onAskAi,
  t,
}: {
  topics: CultureTopic[];
  isFavorite: (type: SavedItemType, id: string) => boolean;
  onToggleFavorite: (type: SavedItemType, id: string) => void;
  onAskAi: () => void;
  t: (key: TranslationKey) => string;
}) {
  const [filter, setFilter] = useState<'all' | 'do' | 'dont'>('all');
  const visibleTopics = topics.filter((_, idx) => {
    if (filter === 'all') return true;
    if (filter === 'do') return idx % 2 === 0;
    return idx % 2 === 1;
  });
  const { data: translatedVisibleTopics } = useTranslatedData(visibleTopics);
  return (
    <ScrollView contentContainerStyle={styles.cultureContent} showsVerticalScrollIndicator={false}>
      <View style={styles.cultureHeader}>
        <Text style={styles.cultureEyebrow}>{t('culture.eyebrow')}</Text>
        <Text style={styles.exploreTitle}>{t('culture.title')}</Text>
      </View>
      <View style={styles.cultureTabs}>
        {[
          { id: 'all' as const, label: t('home.quick.all') },
          { id: 'do' as const, label: t('culture.do') },
          { id: 'dont' as const, label: t('culture.avoid') },
        ].map((item) => (
          <Pressable
            key={item.id}
            style={[styles.exploreCityTab, filter === item.id && styles.exploreCityTabActive]}
            onPress={() => setFilter(item.id)}
          >
            <Text
              style={[
                styles.exploreCityTabText,
                filter === item.id && styles.exploreCityTabTextActive,
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
      {translatedVisibleTopics.map((topic, idx) => {
        const originalIndex = topics.findIndex((item) => item.id === topic.id);
        const isDo = originalIndex % 2 === 0;
        return (
          <View key={topic.id} style={styles.cultureCard}>
            <View style={styles.cultureBadgeRow}>
              <View
                style={[
                  styles.cultureBadge,
                  isDo ? styles.cultureBadgeDo : styles.cultureBadgeDont,
                ]}
              >
                {isDo ? (
                  <Check color={colors.success} size={14} />
                ) : (
                  <X color={colors.primary} size={14} />
                )}
                <Text
                  style={[
                    styles.cultureBadgeText,
                    isDo ? styles.cultureBadgeTextDo : styles.cultureBadgeTextDont,
                  ]}
                >
                  {isDo ? t('culture.do') : t('culture.avoid')}
                </Text>
              </View>
            </View>
            <Text style={styles.cultureTitle}>{topic.title}</Text>
            <Text style={styles.bodyText}>{topic.explanation}</Text>
            <View style={styles.cultureRow}>
              {isDo ? (
                <Pressable
                  onPress={() => onToggleFavorite('culture', topic.id)}
                  style={styles.cultureSave}
                >
                  <Heart
                    color={isFavorite('culture', topic.id) ? colors.primary : colors.muted}
                    fill={isFavorite('culture', topic.id) ? colors.primary : 'transparent'}
                    size={16}
                  />
                </Pressable>
              ) : null}
            </View>
          </View>
        );
      })}
      <Pressable style={styles.askAiButton} onPress={onAskAi}>
        <Bot color={colors.primary} size={18} />
        <Text style={styles.askAiText}>{t('common.askAi')}</Text>
      </Pressable>
    </ScrollView>
  );
}

function PhrasesScreen({
  phrases: items,
  isFavorite,
  onToggleFavorite,
  t,
}: {
  phrases: Phrase[];
  isFavorite: (type: SavedItemType, id: string) => boolean;
  onToggleFavorite: (type: SavedItemType, id: string) => void;
  t: (key: TranslationKey) => string;
}) {
  const [tab, setTab] = useState<string>('All');
  const tabs = [
    { id: 'All', label: t('phrases.tabAll') },
    { id: 'Greetings', label: t('phrases.tabGreetings') },
    { id: 'Food', label: t('phrases.tabFood') },
    { id: 'Emergency', label: t('phrases.tabEmergency') },
    { id: 'Directions', label: t('phrases.tabDirections') },
    { id: 'Shopping', label: t('phrases.tabShopping') },
  ];
  const filtered = tab === 'All' ? items : items.filter((p) => p.situation === tab);
  const { data: translatedPhrases } = useTranslatedData(filtered);
  const speakPhrase = async (phrase: Phrase) => {
    await Speech.stop();
    Speech.speak(phrase.vietnamese, {
      language: 'vi-VN',
      pitch: 1,
      rate: Platform.OS === 'ios' ? 0.48 : 0.8,
    });
  };

  return (
    <View style={styles.flexOne}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.exploreCityScroll}
        contentContainerStyle={styles.exploreCityRow}
      >
        {tabs.map((tt) => (
          <Pressable
            key={tt.id}
            style={[styles.exploreCityTab, tab === tt.id && styles.exploreCityTabActive]}
            onPress={() => setTab(tt.id)}
          >
            <Text
              style={[
                styles.exploreCityTabText,
                tab === tt.id && styles.exploreCityTabTextActive,
              ]}
            >
              {tt.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <ScrollView contentContainerStyle={styles.phraseList} showsVerticalScrollIndicator={false}>
        {translatedPhrases.map((phrase) => {
          const sourcePhrase = filtered.find((item) => item.id === phrase.id) ?? phrase;
          const translatedMeaning =
            phrase.vietnamese === sourcePhrase.vietnamese ? sourcePhrase.english : phrase.vietnamese;
          const saved = isFavorite('phrase', phrase.id);
          return (
            <View key={phrase.id} style={styles.phraseRow}>
              <View style={styles.flexOne}>
                <Text style={styles.phraseEnglish}>{translatedMeaning}</Text>
                <Text style={styles.phraseVietnamese}>{sourcePhrase.vietnamese}</Text>
                <Text style={styles.phrasePronunciation}>{sourcePhrase.pronunciation}</Text>
              </View>
              <View style={styles.rowGap}>
                <Pressable
                  accessibilityLabel={`${t('phrases.audioSample')}: ${sourcePhrase.vietnamese}`}
                  accessibilityRole="button"
                  style={styles.phraseAudioButton}
                  onPress={() => {
                    void speakPhrase(sourcePhrase);
                  }}
                >
                  <Volume2 color={colors.primary} size={18} />
                </Pressable>
                <Pressable onPress={() => onToggleFavorite('phrase', phrase.id)}>
                  <Heart
                    color={saved ? colors.primary : colors.muted}
                    fill={saved ? colors.primary : 'transparent'}
                    size={18}
                  />
                </Pressable>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function EmergencyScreen({ t }: { t: (key: TranslationKey) => string }) {
  const { data: translatedEmergencyCards } = useTranslatedData(emergencyCards);

  return (
    <ScrollView contentContainerStyle={styles.emergencyContent} showsVerticalScrollIndicator={false}>
      {translatedEmergencyCards.map((card) => {
        const sourceCard = emergencyCards.find((item) => item.id === card.id) ?? card;
        return (
          <View key={card.id} style={styles.emergencyRow}>
            <View style={styles.emergencyIcon}>
              {card.id === 'police' || card.id === 'tourist_police' ? (
                <ShieldAlert color={colors.primary} size={22} />
              ) : card.id === 'fire' ? (
                <Sparkles color={colors.primary} size={22} />
              ) : card.id === 'ambulance' ? (
                <Plus color={colors.primary} size={22} />
              ) : (
                <Phone color={colors.primary} size={22} />
              )}
            </View>
            <View style={styles.flexOne}>
              <Text style={styles.emergencyName}>{card.titleKey}</Text>
              {sourceCard.phrase ? (
                <>
                  <Text style={styles.emergencyPhrase}>{card.phrase}</Text>
                  {card.phrase !== sourceCard.phrase ? (
                    <Text style={styles.phraseVietnamese}>{sourceCard.phrase}</Text>
                  ) : null}
                </>
              ) : null}
            </View>
            <Text style={styles.emergencyPhone}>{card.phone}</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

function NotificationsScreen() {
  const alerts = [
    { id: 'weather', title: 'Weather alert', body: 'A short rain shower is expected at 16:30. Move the beach visit to sunset.', icon: CloudSun, tone: '#fff7ed' },
    { id: 'event', title: 'Festival nearby', body: 'A local cultural performance starts 1.2 km away tonight.', icon: PartyPopper, tone: '#fff0f0' },
    { id: 'trip', title: 'Trip reminder', body: 'Your museum visit starts in 45 minutes. Allow 15 minutes for travel.', icon: CalendarCheck, tone: '#eff6ff' },
    { id: 'safety', title: 'Safety update', body: 'Keep valuables secure in busy market areas and use licensed taxis.', icon: ShieldAlert, tone: '#fef2f2' },
  ];
  return (
    <ScrollView contentContainerStyle={styles.notificationsContent} showsVerticalScrollIndicator={false}>
      <View style={styles.savedHubHeader}><Text style={styles.exploreTitle}>Travel alerts</Text><Text style={styles.exploreSubtitle}>Weather, events, safety and trip reminders</Text></View>
      {alerts.map(({ id, title, body, icon: Icon, tone }) => (
        <View key={id} style={[styles.notificationCard, { backgroundColor: tone }]}>
          <View style={styles.v2QuickIcon}><Icon color={colors.primary} size={21} /></View>
          <View style={styles.flexOne}><Text style={styles.timelineTitle}>{title}</Text><Text style={styles.v2PlaceSub}>{body}</Text></View>
        </View>
      ))}
    </ScrollView>
  );
}

function FavoritesScreen({
  records,
  onOpenPlace,
  onOpenFood,
  t,
}: {
  records: {
    key: string;
    type: SavedItemType;
    id: string;
    title: string;
    subtitle: string;
    image?: ImageSourcePropType;
  }[];
  onOpenPlace: (id: string) => void;
  onOpenFood: (id: string) => void;
  t: (key: TranslationKey) => string;
}) {
  const [tab, setTab] = useState<'all' | 'place' | 'food' | 'phrase'>('all');
  const filtered = tab === 'all' ? records : records.filter((r) => r.type === tab);
  const { data: translatedRecords } = useTranslatedData(filtered);
  const tabs: { id: typeof tab; label: string }[] = [
    { id: 'all', label: t('favorites.tabs.all') },
    { id: 'place', label: t('favorites.tabs.places') },
    { id: 'food', label: t('favorites.tabs.food') },
    { id: 'phrase', label: t('favorites.tabs.phrases') },
  ];
  return (
    <View style={styles.flexOne}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.exploreCityScroll}
        contentContainerStyle={styles.exploreCityRow}
      >
        {tabs.map((tt) => (
          <Pressable
            key={tt.id}
            style={[styles.exploreCityTab, tab === tt.id && styles.exploreCityTabActive]}
            onPress={() => setTab(tt.id)}
          >
            <Text
              style={[
                styles.exploreCityTabText,
                tab === tt.id && styles.exploreCityTabTextActive,
              ]}
            >
              {tt.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <ScrollView contentContainerStyle={styles.favoritesList} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <EmptyState
            icon={Heart}
            title={t('favorites.empty.title')}
            body={t('favorites.empty.body')}
          />
        ) : (
          translatedRecords.map((record) => (
            <Pressable
              key={record.key}
              style={styles.favoriteRow}
              onPress={() => {
                if (record.type === 'place') onOpenPlace(record.id);
                if (record.type === 'food') onOpenFood(record.id);
              }}
            >
              {record.image ? (
                <Image source={record.image} style={styles.favoriteImage} />
              ) : (
                <View style={styles.favoriteFallbackIcon}>
                  <Heart color={colors.primary} size={20} />
                </View>
              )}
              <View style={styles.flexOne}>
                <Text style={styles.favoriteName}>{record.title}</Text>
                <Text style={styles.favoriteSub}>{record.subtitle}</Text>
                <View style={styles.ratingRow}>
                  <Star color={colors.accent} fill={colors.accent} size={12} />
                  <Text style={styles.ratingText}>4.8</Text>
                </View>
              </View>
              <Trash2 color={colors.muted} size={18} />
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

type TripHubTab = 'itinerary' | 'visited' | 'expense' | 'notes';

function TripsScreen({
  profile,
  itinerary,
  onCreatePlan,
  onOpenMap,
}: {
  profile: UserProfile;
  itinerary: ItineraryConfirmation | null;
  onCreatePlan: () => void;
  onOpenMap: () => void;
}) {
  const [tab, setTab] = useState<TripHubTab>('itinerary');
  const [checked, setChecked] = useState<Record<string, boolean>>({ breakfast: true });
  const [expense, setExpense] = useState('');
  const [expenses, setExpenses] = useState<{ id: string; label: string; amount: number }[]>([
    { id: 'hotel', label: 'Hotel', amount: 1200000 },
    { id: 'food', label: 'Food & coffee', amount: 460000 },
  ]);
  const [note, setNote] = useState('Try the local night market after 7 PM.');
  const city = profile.currentCity === 'Other' ? 'Đà Nẵng' : profile.currentCity;
  const timeline = [
    { id: 'breakfast', time: '08:00', title: 'Vietnamese breakfast', icon: Coffee },
    { id: 'museum', time: '10:00', title: 'Museum & culture walk', icon: BookOpen },
    { id: 'lunch', time: '13:00', title: 'Local lunch', icon: Utensils },
    { id: 'beach', time: '16:00', title: 'Beach sunset', icon: Waves },
    { id: 'market', time: '20:00', title: 'Night market', icon: ShoppingBag },
  ];
  const tabs: { id: TripHubTab; label: string; icon: typeof Home }[] = [
    { id: 'itinerary', label: 'Itinerary', icon: CalendarCheck },
    { id: 'visited', label: 'Visited', icon: CircleCheck },
    { id: 'expense', label: 'Expense', icon: CircleDollarSign },
    { id: 'notes', label: 'Notes', icon: NotebookPen },
  ];
  const total = expenses.reduce((sum, item) => sum + item.amount, 0);

  return (
    <ScrollView contentContainerStyle={styles.tripContent} showsVerticalScrollIndicator={false}>
      <View style={styles.tripHero}>
        <View style={styles.tripHeroTop}>
          <View>
            <Text style={styles.tripEyebrow}>UPCOMING TRIP</Text>
            <Text style={styles.tripTitle}>{city}</Text>
            <Text style={styles.tripDates}>{profile.tripDays} days · Starts soon</Text>
          </View>
          <View style={styles.weatherPill}><CloudSun color={colors.warning} size={22} /><Text style={styles.weatherTemp}>29°</Text></View>
        </View>
        <View style={styles.tripProgressTrack}><View style={[styles.tripProgressFill, { width: '35%' }]} /></View>
        <Text style={styles.tripProgressText}>Day 1 of {profile.tripDays} · 2 activities completed</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tripTabRow}>
        {tabs.map(({ id, label, icon: Icon }) => (
          <Pressable key={id} style={[styles.tripTab, tab === id && styles.tripTabActive]} onPress={() => setTab(id)}>
            <Icon color={tab === id ? colors.surface : colors.muted} size={16} />
            <Text style={[styles.tripTabText, tab === id && styles.tripTabTextActive]}>{label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {tab === 'itinerary' ? (
        <View style={styles.tripSection}>
          <View style={styles.homeSectionHeader}><Text style={styles.homeSectionTitle}>Today · Day 1</Text><Pressable onPress={onOpenMap}><Text style={styles.homeSectionLink}>View map</Text></Pressable></View>
          {timeline.map(({ id, time, title, icon: Icon }, index) => (
            <Pressable key={id} style={styles.timelineRow} onPress={() => setChecked((current) => ({ ...current, [id]: !current[id] }))}>
              <View style={styles.timelineTimeWrap}><Text style={styles.timelineTime}>{time}</Text>{index < timeline.length - 1 ? <View style={styles.timelineLine} /> : null}</View>
              <View style={[styles.timelineIcon, checked[id] && styles.timelineIconDone]}><Icon color={checked[id] ? colors.surface : colors.primary} size={18} /></View>
              <View style={styles.flexOne}><Text style={[styles.timelineTitle, checked[id] && styles.timelineTitleDone]}>{title}</Text><Text style={styles.v2PlaceSub}>{index % 2 === 0 ? '45 min · Near you' : '1 hr 30 min'}</Text></View>
              {checked[id] ? <CircleCheck color={colors.success} size={20} /> : <View style={styles.checkCircle} />}
            </Pressable>
          ))}
          {itinerary ? <Panel><Text style={styles.tripPanelTitle}>AI itinerary ready</Text><Text style={styles.v2PlaceSub}>{itinerary.title}</Text></Panel> : <PrimaryButton label="Create with AI Planner" onPress={onCreatePlan} icon={Sparkles} />}
        </View>
      ) : null}

      {tab === 'visited' ? (
        <View style={styles.tripSection}>
          <Text style={styles.homeSectionTitle}>Visited places</Text>
          {timeline.filter((item) => checked[item.id]).map(({ id, title, icon: Icon }) => <View key={id} style={styles.tripListRow}><View style={styles.v2QuickIcon}><Icon color={colors.primary} size={20} /></View><View style={styles.flexOne}><Text style={styles.timelineTitle}>{title}</Text><Text style={styles.v2PlaceSub}>{city} · Today</Text></View><CircleCheck color={colors.success} size={22} /></View>)}
        </View>
      ) : null}

      {tab === 'expense' ? (
        <View style={styles.tripSection}>
          <View style={styles.expenseTotal}><Text style={styles.tripEyebrow}>TRIP SPEND</Text><Text style={styles.expenseAmount}>{total.toLocaleString('vi-VN')} ₫</Text><Text style={styles.v2PlaceSub}>Budget used · 42%</Text></View>
          {expenses.map((item) => <View key={item.id} style={styles.tripListRow}><View style={styles.v2QuickIcon}><CircleDollarSign color={colors.primary} size={20} /></View><Text style={[styles.timelineTitle, styles.flexOne]}>{item.label}</Text><Text style={styles.expenseRowAmount}>{item.amount.toLocaleString('vi-VN')} ₫</Text></View>)}
          <View style={styles.expenseInputRow}><TextInput value={expense} onChangeText={setExpense} keyboardType="numeric" placeholder="New expense (VND)" placeholderTextColor={colors.muted} style={styles.expenseInput} /><Pressable style={styles.expenseAdd} onPress={() => { const amount = Number(expense.replace(/\D/g, '')); if (amount > 0) { setExpenses((current) => [...current, { id: `${Date.now()}`, label: 'Other', amount }]); setExpense(''); } }}><Plus color={colors.surface} size={20} /></Pressable></View>
        </View>
      ) : null}

      {tab === 'notes' ? (
        <View style={styles.tripSection}><Text style={styles.homeSectionTitle}>Trip notes</Text><TextInput multiline value={note} onChangeText={setNote} placeholder="Add ideas, booking codes or reminders..." placeholderTextColor={colors.muted} style={styles.tripNoteInput} /><Text style={styles.v2PlaceSub}>Saved automatically on this device.</Text></View>
      ) : null}
    </ScrollView>
  );
}

function SavedHubScreen({
  records,
  history,
  recentSearches,
  onOpenPlace,
  onOpenFood,
  onClearHistory,
  t,
}: {
  records: Parameters<typeof FavoritesScreen>[0]['records'];
  history: ActivityHistoryEntry[];
  recentSearches: RecentSearch[];
  onOpenPlace: (id: string) => void;
  onOpenFood: (id: string) => void;
  onClearHistory: () => void;
  t: (key: TranslationKey) => string;
}) {
  const [tab, setTab] = useState<'saved' | 'history' | 'searches'>('saved');
  return (
    <View style={styles.flexOne}>
      <View style={styles.savedHubHeader}><Text style={styles.exploreTitle}>Saved</Text><Text style={styles.exploreSubtitle}>Your places, foods, trips and activity</Text></View>
      <View style={styles.savedHubTabs}>
        {[{ id: 'saved', label: 'Favorites' }, { id: 'history', label: 'History' }, { id: 'searches', label: 'Recent search' }].map((item) => <Pressable key={item.id} style={[styles.savedHubTab, tab === item.id && styles.savedHubTabActive]} onPress={() => setTab(item.id as typeof tab)}><Text style={[styles.savedHubTabText, tab === item.id && styles.savedHubTabTextActive]}>{item.label}</Text></Pressable>)}
      </View>
      {tab === 'saved' ? <FavoritesScreen records={records} onOpenPlace={onOpenPlace} onOpenFood={onOpenFood} t={t} /> : null}
      {tab === 'history' ? <HistoryScreen entries={history} onClear={onClearHistory} t={t} /> : null}
      {tab === 'searches' ? <ScrollView contentContainerStyle={styles.favoritesList}>{recentSearches.length ? recentSearches.map((item) => <View key={item.id} style={styles.tripListRow}><View style={styles.v2QuickIcon}><SearchIcon color={colors.primary} size={19} /></View><View style={styles.flexOne}><Text style={styles.timelineTitle}>{item.query}</Text><Text style={styles.v2PlaceSub}>{formatHistoryTimestamp(item.timestamp)}</Text></View></View>) : <EmptyState icon={SearchIcon} title="No recent searches" body="Your searches and AI requests will appear here." />}</ScrollView> : null}
    </View>
  );
}

function HistoryScreen({
  entries,
  onClear,
  t,
}: {
  entries: ActivityHistoryEntry[];
  onClear: () => void;
  t: (key: TranslationKey) => string;
}) {
  const grouped = useMemo(() => {
    const today: ActivityHistoryEntry[] = [];
    const earlier: ActivityHistoryEntry[] = [];
    for (const e of entries) {
      if (isToday(e.timestamp)) today.push(e);
      else earlier.push(e);
    }
    return { today, earlier };
  }, [entries]);

  return (
    <View style={styles.flexOne}>
      {entries.length > 0 ? (
        <View style={styles.historyTopRow}>
          <Text style={styles.historySubtitle}>{t('history.subtitle')}</Text>
          <Pressable onPress={onClear}>
            <Text style={styles.historyClear}>{t('history.clear')}</Text>
          </Pressable>
        </View>
      ) : null}
      <ScrollView contentContainerStyle={styles.historyList} showsVerticalScrollIndicator={false}>
        {entries.length === 0 ? (
          <EmptyState
            icon={HistoryIcon}
            title={t('history.empty.title')}
            body={t('history.empty.body')}
          />
        ) : (
          <>
            {grouped.today.length > 0 ? (
              <View>
                <Text style={styles.historyGroup}>{t('history.today')}</Text>
                {grouped.today.map((entry) => (
                  <View key={entry.id} style={styles.historyRow}>
                    <View style={styles.historyIcon}>
                      <HistoryIcon color={colors.primary} size={16} />
                    </View>
                    <View style={styles.flexOne}>
                      <Text style={styles.historyTitle}>{entry.title}</Text>
                      {entry.detail ? (
                        <Text style={styles.historyDetail}>{entry.detail}</Text>
                      ) : null}
                    </View>
                    <Text style={styles.historyTime}>
                      {formatHistoryTimestamp(entry.timestamp)}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
            {grouped.earlier.length > 0 ? (
              <View>
                <Text style={styles.historyGroup}>{t('history.earlier')}</Text>
                {grouped.earlier.map((entry) => (
                  <View key={entry.id} style={styles.historyRow}>
                    <View style={styles.historyIcon}>
                      <HistoryIcon color={colors.primary} size={16} />
                    </View>
                    <View style={styles.flexOne}>
                      <Text style={styles.historyTitle}>{entry.title}</Text>
                      {entry.detail ? (
                        <Text style={styles.historyDetail}>{entry.detail}</Text>
                      ) : null}
                    </View>
                    <Text style={styles.historyTime}>
                      {formatHistoryTimestamp(entry.timestamp)}
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}
            <Pressable style={styles.historyClearButton} onPress={onClear}>
              <Text style={styles.historyClearButtonText}>{t('history.clear')}</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function AccountScreen({
  authSession,
  guestSession,
  settings,
  currentLanguage,
  qrBusy,
  qrImageUri,
  qrMobileStatus,
  qrStatusText,
  scannerBusy,
  onSignIn,
  onSignOut,
  onOpenQrScanner,
  onOpenSettings,
  onOpenLanguage,
  onOpenPrivacyPolicy,
  onOpenMemberVideoCall,
  onOpenLiveTeam,
  onOpenLocalHelperOnboarding,
  onOpenLocalHelperJobs,
  onOpenLocalHelperEarnings,
  onRefreshQrLogin,
  isGoogleAuthPending,
  canSignInWithGoogle,
  t,
}: {
  authSession: AuthSessionState | null;
  guestSession: GuestSession | null;
  settings: SettingsState;
  currentLanguage: Language;
  qrBusy: boolean;
  qrImageUri: string | null;
  qrMobileStatus: string | null;
  qrStatusText: string;
  scannerBusy: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
  onOpenQrScanner: () => void;
  onOpenSettings: () => void;
  onOpenLanguage: () => void;
  onOpenPrivacyPolicy: () => void;
  onOpenMemberVideoCall: () => void;
  onOpenLiveTeam: () => void;
  onOpenLocalHelperOnboarding: () => void;
  onOpenLocalHelperJobs: () => void;
  onOpenLocalHelperEarnings: () => void;
  onRefreshQrLogin: () => void;
  isGoogleAuthPending: boolean;
  canSignInWithGoogle: boolean;
  t: (key: TranslationKey) => string;
}) {
  const isWeb = Platform.OS === 'web';
  const VerificationIcon = authSession?.user.verifiedEmail ? Check : ShieldAlert;

  return (
    <ScrollView contentContainerStyle={styles.accountContent} showsVerticalScrollIndicator={false}>
      {authSession ? (
        <View style={styles.accountHeader}>
          <View style={styles.accountAvatar}>
            {authSession.user.picture ? (
              <Image
                source={{ uri: authSession.user.picture }}
                style={styles.accountAvatarImage}
              />
            ) : (
              <User color={colors.primary} size={32} />
            )}
          </View>
          <Text style={styles.accountName}>{authSession.user.name}</Text>
          <Text style={styles.accountEmail}>{authSession.user.email}</Text>
          {!isWeb ? (
            <View style={styles.qrMobilePanel}>
              <PrimaryButton
                label={scannerBusy ? t('account.qrApproving') : t('account.qrScanWeb')}
                onPress={onOpenQrScanner}
                disabled={scannerBusy}
                icon={ScanLine}
              />
              {qrMobileStatus ? (
                <Text style={styles.qrStatusText}>{qrMobileStatus}</Text>
              ) : null}
            </View>
          ) : null}
        </View>
      ) : (
        <View style={styles.accountHeader}>
          <View style={styles.accountAvatar}>
            <User color={colors.primary} size={32} />
          </View>
          <Text style={styles.accountName}>{guestSession?.user.name ?? t('account.notSignedIn.title')}</Text>
          <Text style={styles.accountEmail}>{guestSession ? guestModeLabels[currentLanguage] : t('account.notSignedIn.body')}</Text>
          <PrimaryButton
            label={isGoogleAuthPending ? t('auth.signingIn') : t('account.signIn')}
            onPress={onSignIn}
            disabled={!canSignInWithGoogle || isGoogleAuthPending}
            icon={User}
          />
          {isWeb ? (
            <View style={styles.qrLoginPanel}>
              <View style={styles.qrPanelHeader}>
                <QrCode color={colors.primary} size={20} />
                <View style={styles.qrPanelCopy}>
                  <Text style={styles.qrPanelTitle}>{t('account.qrWebTitle')}</Text>
                  <Text style={styles.qrPanelBody}>{t('account.qrWebBody')}</Text>
                </View>
              </View>
              <View style={styles.qrImageFrame}>
                {qrImageUri ? (
                  <Image source={{ uri: qrImageUri }} style={styles.qrImage} />
                ) : (
                  <ActivityIndicator color={colors.primary} />
                )}
              </View>
              <Text style={styles.qrStatusText}>
                {qrStatusText || t('account.qrWaiting')}
              </Text>
              <PrimaryButton
                label={qrBusy ? t('account.qrRefreshing') : t('account.qrRefresh')}
                onPress={onRefreshQrLogin}
                disabled={qrBusy}
                icon={RefreshCw}
                variant="secondary"
              />
            </View>
          ) : null}
        </View>
      )}

      <View style={styles.accountSection}>
        <Text style={styles.accountSectionTitle}>{t('account.accountInfo')}</Text>
        <View style={styles.accountRow}>
          <Text style={styles.accountRowLabel}>{t('account.displayName')}</Text>
          <Text style={styles.accountRowValue}>
            {authSession?.user.name ?? guestSession?.user.name ?? 'Guest'}
          </Text>
          <ChevronRight color={colors.muted} size={18} />
        </View>
        <View style={styles.accountRow}>
          <Text style={styles.accountRowLabel}>{t('account.email')}</Text>
          <Text style={styles.accountRowValue}>
            {authSession?.user.email ?? (guestSession ? guestModeLabels[currentLanguage] : '—')}
          </Text>
          <ChevronRight color={colors.muted} size={18} />
        </View>
        <View style={styles.accountRow}>
          <VerificationIcon
            color={authSession?.user.verifiedEmail ? colors.primary : colors.muted}
            size={20}
          />
          <Text style={styles.accountRowLabel}>{t('account.verification')}</Text>
          <Text style={styles.accountRowValue}>
            {authSession
              ? authSession.user.verifiedEmail
                ? t('account.verified')
                : t('account.unverified')
              : '—'}
          </Text>
          <ChevronRight color={colors.muted} size={18} />
        </View>
        <View style={styles.accountRow}>
          <Text style={styles.accountRowLabel}>{t('account.memberSince')}</Text>
          <Text style={styles.accountRowValue}>
            {formatAccountMonth(authSession?.signedInAt)}
          </Text>
          <ChevronRight color={colors.muted} size={18} />
        </View>
      </View>

      <View style={styles.accountSection}>
        <Text style={styles.accountSectionTitle}>{t('account.languageSection')}</Text>
        <Pressable style={styles.accountRow} onPress={onOpenLanguage}>
          <Globe color={colors.primary} size={20} />
          <Text style={styles.accountRowLabel}>{t('settings.language.title')}</Text>
          <Text style={styles.accountRowValue}>{languageNativeNames[currentLanguage]}</Text>
          <ChevronRight color={colors.muted} size={18} />
        </Pressable>
      </View>

      <View style={styles.accountSection}>
        <Pressable style={styles.accountRow} onPress={onOpenLiveTeam}>
          <Radio color={colors.primary} size={20} />
          <Text style={styles.accountRowLabel}>Live Team · Thoại & GPS</Text>
          <ChevronRight color={colors.muted} size={18} />
        </Pressable>
        <Pressable style={styles.accountRow} onPress={onOpenMemberVideoCall}>
          <MessageCircle color={colors.primary} size={20} />
          <Text style={styles.accountRowLabel}>Chat và gọi miễn phí</Text>
          <ChevronRight color={colors.muted} size={18} />
        </Pressable>
        <Pressable style={styles.accountRow} onPress={onOpenSettings}>
          <SettingsIcon color={colors.primary} size={20} />
          <Text style={styles.accountRowLabel}>{t('account.settings')}</Text>
          <ChevronRight color={colors.muted} size={18} />
        </Pressable>
        <Pressable style={styles.accountRow} onPress={onOpenLocalHelperOnboarding}>
          <UserCircle color={colors.primary} size={20} />
          <Text style={styles.accountRowLabel}>Become a Local Helper</Text>
          <ChevronRight color={colors.muted} size={18} />
        </Pressable>
        <Pressable style={styles.accountRow} onPress={onOpenLocalHelperJobs}>
          <MapPin color={colors.primary} size={20} />
          <Text style={styles.accountRowLabel}>Local Helper Jobs</Text>
          <ChevronRight color={colors.muted} size={18} />
        </Pressable>
        <Pressable style={styles.accountRow} onPress={onOpenLocalHelperEarnings}>
          <DollarSign color={colors.primary} size={20} />
          <Text style={styles.accountRowLabel}>Earnings</Text>
          <ChevronRight color={colors.muted} size={18} />
        </Pressable>
        <Pressable style={styles.accountRow} onPress={onOpenPrivacyPolicy}>
          <Info color={colors.primary} size={20} />
          <Text style={styles.accountRowLabel}>{t('account.privacy')}</Text>
          <ChevronRight color={colors.muted} size={18} />
        </Pressable>
        <Pressable style={styles.accountRow}>
          <MessageCircle color={colors.primary} size={20} />
          <Text style={styles.accountRowLabel}>{t('account.support')}</Text>
          <ChevronRight color={colors.muted} size={18} />
        </Pressable>
        <Pressable style={styles.accountRow}>
          <FileText color={colors.primary} size={20} />
          <Text style={styles.accountRowLabel}>{t('account.terms')}</Text>
          <ChevronRight color={colors.muted} size={18} />
        </Pressable>
      </View>

      {authSession ? (
        <Pressable style={styles.signOutButton} onPress={onSignOut}>
          <LogOut color={colors.primary} size={18} />
          <Text style={styles.signOutText}>{t('account.signOut')}</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

function SearchScreen({
  places: placeItems,
  recentSearches,
  userCoordinates,
  onSubmitSearch,
  onClearRecent,
  onOpenPlace,
  onOpenFood,
  onOpenMap,
  t,
}: {
  places: Place[];
  recentSearches: RecentSearch[];
  userCoordinates: AppCoordinates | null;
  onSubmitSearch: (query: string) => void;
  onClearRecent: () => void;
  onOpenPlace: (id: string) => void;
  onOpenFood: (id: string) => void;
  onOpenMap: () => void;
  t: (key: TranslationKey) => string;
}) {
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'popular' | 'nature' | 'culture' | 'food'>('all');
  const isCompact = width < 720;
  const categoryFilters: { id: typeof activeCategory; label: string; icon: typeof MapPin }[] = [
    { id: 'all', label: t('explore.allCities'), icon: Compass },
    { id: 'popular', label: t('search.popularPlaces'), icon: Star },
    { id: 'nature', label: t('home.quick.stay'), icon: Mountain },
    { id: 'culture', label: t('home.tool.culture'), icon: BookOpen },
    { id: 'food', label: t('home.tool.food'), icon: Utensils },
  ];
  const results = useMemo(() => {
    const q = normalizeSearchText(query.trim());
    const popularIds = new Set(popularPlaceIds);
    const categoryMatches = (place: Place) => {
      const haystack = normalizeSearchText(`${place.category} ${place.tags.join(' ')}`);
      if (activeCategory === 'popular') return popularIds.has(place.id);
      if (activeCategory === 'nature') return /bien|bai|vinh|nui|hang|dao|rung|thac|nature|beach|mountain|cave|island|bay/.test(haystack);
      if (activeCategory === 'culture') return /van hoa|di san|di tich|lich su|ton giao|heritage|culture|history|temple|pagoda/.test(haystack);
      return true;
    };
    const matchingPlaces = placeItems
      .filter((place) => categoryMatches(place))
      .filter((place) => q.length === 0 || normalizeSearchText(`${place.name} ${place.city} ${place.category} ${place.tags.join(' ')}`).includes(q))
      .map((place) => ({
        place,
        distanceKm: userCoordinates ? getDistanceKm(userCoordinates, { lat: place.lat, lng: place.lng }) : null,
      }))
      .sort((a, b) => {
        if (q.length === 0 && activeCategory === 'all') return Number(popularIds.has(b.place.id)) - Number(popularIds.has(a.place.id));
        if (q.length > 0) {
          const relevance = (place: Place) => {
            const name = normalizeSearchText(place.name);
            if (name === q) return 3;
            if (name.startsWith(q)) return 2;
            if (name.includes(q)) return 1;
            return 0;
          };
          const relevanceDifference = relevance(b.place) - relevance(a.place);
          if (relevanceDifference !== 0) return relevanceDifference;
        }
        const popularityDifference = Number(popularIds.has(b.place.id)) - Number(popularIds.has(a.place.id));
        if (popularityDifference !== 0) return popularityDifference;
        if (a.distanceKm !== null && b.distanceKm !== null) return a.distanceKm - b.distanceKm;
        return a.place.name.localeCompare(b.place.name);
      })
      .slice(0, q.length === 0 && activeCategory === 'all' ? 12 : 40);
    return {
      places: matchingPlaces.map(({ place }) => place),
      distances: new Map(matchingPlaces.map(({ place, distanceKm }) => [place.id, distanceKm])),
      foods: activeCategory === 'food' || activeCategory === 'all'
        ? foods.filter((f) =>
            normalizeSearchText(`${f.name} ${f.englishName} ${f.region}`).includes(q),
          ).slice(0, q.length === 0 ? 5 : 20)
        : [],
    };
  }, [activeCategory, placeItems, query, userCoordinates]);
  const { data: translatedResultPlaces } = useTranslatedData(results.places);
  const { data: translatedResultFoods } = useTranslatedData(results.foods);

  const submitLocalSearch = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    if (results.places[0]) return onOpenPlace(results.places[0].id);
    if (results.foods[0]) return onOpenFood(results.foods[0].id);
    onSubmitSearch(trimmed);
  };

  return (
    <View style={styles.searchScreen}>
      <View style={styles.searchHero}>
        <View style={styles.searchInput}>
          <SearchIcon color={colors.text} size={20} />
          <TextInput
            value={query}
            onChangeText={(value) => { setQuery(value); if (value.trim()) setActiveCategory('all'); }}
            placeholder={t('search.placeholder')}
            placeholderTextColor={colors.muted}
            style={styles.searchInputField}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={submitLocalSearch}
          />
          {query.length > 0 ? (
            <Pressable accessibilityLabel="Clear search" hitSlop={10} onPress={() => setQuery('')}>
              <X color={colors.muted} size={18} />
            </Pressable>
          ) : null}
        </View>
        <ScrollView horizontal contentContainerStyle={styles.searchCategoryRow} showsHorizontalScrollIndicator={false}>
          {categoryFilters.map(({ id, label, icon: Icon }) => (
            <Pressable key={id} style={[styles.searchCategoryChip, activeCategory === id && styles.searchCategoryChipActive]} onPress={() => { setActiveCategory(id); if (id !== 'all') setQuery(''); }}>
              <Icon color={activeCategory === id ? colors.surface : colors.text} size={16} />
              <Text style={[styles.searchCategoryText, activeCategory === id && styles.searchCategoryTextActive]}>{label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
      <ScrollView contentContainerStyle={styles.searchContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.searchMapBanner, !isCompact && styles.searchMapBannerWide]}>
          <View style={styles.searchMapIcon}><MapIcon color={colors.primary} size={22} /></View>
          <View style={styles.flexOne}>
            <Text style={styles.searchMapTitle}>{t('map.title')}</Text>
            <Text style={styles.searchMapBody}>{userCoordinates ? `${t('home.tool.nearby')} · ${results.places.length} ${t('home.catalogPlaces')}` : t('map.subtitle')}</Text>
          </View>
          <Pressable style={styles.searchMapButton} onPress={onOpenMap}>
            <Text style={styles.searchMapButtonText}>{t('home.tool.map')}</Text>
            <ChevronRight color={colors.surface} size={16} />
          </Pressable>
        </View>

        {query.trim().length === 0 && activeCategory === 'all' && recentSearches.length > 0 ? (
          <View style={styles.searchSection}>
            <View style={styles.searchSectionHeader}>
              <Text style={styles.searchSectionTitle}>{t('search.recent')}</Text>
              <Pressable onPress={onClearRecent}>
                <Text style={styles.searchSectionLink}>{t('search.clearAll')}</Text>
              </Pressable>
            </View>
            <View style={styles.recentChipWrap}>
              {recentSearches.map((s) => (
                <Pressable
                  key={s.id}
                  style={styles.recentChip}
                  onPress={() => setQuery(s.query)}
                >
                  <Clock color={colors.muted} size={13} />
                  <Text style={styles.recentChipText}>{s.query}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        <View style={styles.searchSection}>
          <View style={styles.searchResultsHeader}>
            <View>
              <Text style={styles.searchSectionTitle}>{query.trim() ? t('search.allResults') : t('home.popularTitle')}</Text>
              <Text style={styles.searchResultCount}>{results.places.length} {t('home.catalogPlaces')}{results.foods.length ? ` · ${results.foods.length} ${t('home.tool.food')}` : ''}</Text>
            </View>
            <View style={styles.searchSortPill}><Navigation color={colors.primary} size={14} /><Text style={styles.searchSortText}>{userCoordinates ? t('home.tool.nearby') : t('search.related')}</Text></View>
          </View>
          {results.places.length === 0 && results.foods.length === 0 ? (
            <EmptyState
              icon={SearchIcon}
              title={t('search.noResults')}
              body={t('search.noResultsBody')}
            />
          ) : (
            <>
                {results.places.length > 0 ? (
                  <View style={styles.searchResultList}>
                    {translatedResultPlaces.map((place) => (
                      <Pressable
                        key={place.id}
                        style={[styles.searchResultRow, !isCompact && styles.searchResultRowWide]}
                        onPress={() => onOpenPlace(place.id)}
                      >
                        <Image source={place.image} style={styles.searchResultImage} />
                        <View style={styles.searchResultCopy}>
                          <Text numberOfLines={1} style={styles.searchResultName}>{place.name}</Text>
                          <View style={styles.searchRatingRow}><Text style={styles.searchRatingText}>4.8</Text><Star color="#f59e0b" fill="#f59e0b" size={14} /><Text style={styles.searchReviewText}>· {place.category}</Text></View>
                          <Text numberOfLines={1} style={styles.searchResultMeta}>{place.city}{results.distances.get(place.id) !== null && results.distances.get(place.id) !== undefined ? ` · ${roundDistanceKm(results.distances.get(place.id) as number)} km` : ''}</Text>
                          <Text numberOfLines={1} style={styles.searchOpenText}>{place.openHours}</Text>
                        </View>
                        <View style={styles.searchResultAction}><MapPin color={colors.primary} size={19} /></View>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
                {results.foods.length > 0 ? (
                  <View style={styles.searchResultList}>
                    <Text style={styles.searchSubsectionTitle}>{t('search.popularFoods')}</Text>
                    {translatedResultFoods.map((food) => (
                      <Pressable
                        key={food.id}
                        style={styles.searchResultRow}
                        onPress={() => onOpenFood(food.id)}
                      >
                        <Image source={food.image} style={styles.searchResultImage} />
                        <View style={styles.searchResultCopy}>
                          <Text numberOfLines={1} style={styles.searchResultName}>{food.name}</Text>
                          <View style={styles.searchRatingRow}><Text style={styles.searchRatingText}>4.7</Text><Star color="#f59e0b" fill="#f59e0b" size={14} /><Text style={styles.searchReviewText}>· {food.region}</Text></View>
                          <Text numberOfLines={1} style={styles.searchResultMeta}>{food.englishName}</Text>
                          <Text style={styles.searchOpenText}>{food.priceRange}</Text>
                        </View>
                        <View style={styles.searchResultAction}><Utensils color={colors.primary} size={18} /></View>
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </>
            )}
        </View>
      </ScrollView>
    </View>
  );
}

function SettingsScreen({
  settings,
  onUpdateSettings,
  onBack,
  t,
  onOpenWpConfig,
}: {
  settings: SettingsState;
  onUpdateSettings: (patch: Partial<SettingsState>) => void;
  onBack: () => void;
  t: (key: TranslationKey) => string;
  onOpenWpConfig?: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.settingsContent} showsVerticalScrollIndicator={false}>
      <View style={styles.settingsRow}>
        <View style={styles.flexOne}>
          <Text style={styles.settingsRowTitle}>{t('settings.notifications.title')}</Text>
          <Text style={styles.settingsRowBody}>{t('settings.notifications.body')}</Text>
        </View>
        <Switch
          value={settings.notificationsEnabled}
          onValueChange={(v) => onUpdateSettings({ notificationsEnabled: v })}
          trackColor={{ true: colors.primary, false: colors.border }}
        />
      </View>
      <Pressable
        style={styles.settingsRow}
        onPress={() =>
          onUpdateSettings({ themeMode: settings.themeMode === 'light' ? 'dark' : 'light' })
        }
      >
        <View style={styles.flexOne}>
          <Text style={styles.settingsRowTitle}>{t('settings.theme.title')}</Text>
          <Text style={styles.settingsRowBody}>
            {settings.themeMode === 'light' ? t('settings.value.light') : t('settings.value.dark')}
          </Text>
        </View>
        <Switch
          value={settings.themeMode === 'dark'}
          onValueChange={(v) => onUpdateSettings({ themeMode: v ? 'dark' : 'light' })}
          trackColor={{ true: colors.primary, false: colors.border }}
        />
      </Pressable>
      <Pressable
        style={styles.settingsRow}
        onPress={() =>
          onUpdateSettings({
            measurementUnit: settings.measurementUnit === 'metric' ? 'imperial' : 'metric',
          })
        }
      >
        <View style={styles.flexOne}>
          <Text style={styles.settingsRowTitle}>{t('settings.units.title')}</Text>
          <Text style={styles.settingsRowBody}>
            {settings.measurementUnit === 'metric'
              ? t('settings.value.metric')
              : t('settings.value.imperial')}
          </Text>
        </View>
        <Switch
          value={settings.measurementUnit === 'imperial'}
          onValueChange={(v) =>
            onUpdateSettings({ measurementUnit: v ? 'imperial' : 'metric' })
          }
          trackColor={{ true: colors.primary, false: colors.border }}
        />
      </Pressable>
      <View style={styles.settingsRow}>
        <View style={styles.flexOne}>
          <Text style={styles.settingsRowTitle}>{t('settings.font.title')}</Text>
          <Text style={styles.settingsRowBody}>{t('settings.font.body')}</Text>
          <View style={styles.fontScaleRow}>
            <Type color={colors.muted} size={14} />
            <View style={styles.fontScaleBar}>
              {[0.85, 0.95, 1, 1.1, 1.2].map((scale) => (
                <Pressable
                  key={scale}
                  style={[
                    styles.fontScaleDot,
                    Math.abs(settings.fontScale - scale) < 0.05 && styles.fontScaleDotActive,
                  ]}
                  onPress={() => onUpdateSettings({ fontScale: scale })}
                />
              ))}
            </View>
            <Type color={colors.text} size={22} />
          </View>
        </View>
      </View>
      <Pressable
        style={styles.settingsRow}
        onPress={() => onOpenWpConfig && onOpenWpConfig()}
      >
        <View style={styles.flexOne}>
          <Text style={styles.settingsRowTitle}>📰 Nguồn tin tức WordPress</Text>
          <Text style={styles.settingsRowBody} numberOfLines={1}>
            {settings.wpNewsUrl || DEFAULT_WP_URL}
          </Text>
        </View>
        <ChevronRight color={colors.muted} size={18} />
      </Pressable>
      <View style={styles.settingsRow}>
        <View style={styles.flexOne}>
          <Text style={styles.settingsRowTitle}>{t('settings.version.title')}</Text>
          <Text style={styles.settingsRowBody}>{t('settings.version.body')}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

function LanguageScreen({
  current,
  onSelect,
  onBack,
  t,
}: {
  current: Language;
  onSelect: (language: Language) => void;
  onBack: () => void;
  t: (key: TranslationKey) => string;
}) {
  return (
    <View style={styles.flexOne}>
      <View style={styles.languageHeader}>
        <Text style={styles.exploreTitle}>{t('language.title')}</Text>
        <Text style={styles.exploreSubtitle}>{t('language.subtitle')}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.languageList} showsVerticalScrollIndicator={false}>
        {languages.map((language) => (
          <Pressable
            key={language}
            style={[
              styles.languageRow,
              current === language && styles.languageRowActive,
            ]}
            onPress={() => onSelect(language)}
          >
            <View style={styles.languageFlag}>
              <Text style={styles.languageFlagText}>{languageFlags[language]}</Text>
            </View>
            <View style={styles.languageTextStack}>
              <Text style={styles.languageLabel}>{languageNativeNames[language]}</Text>
              <Text style={styles.languageSubLabel}>{languageSecondaryNames[language]}</Text>
            </View>
            {current === language ? <Check color={colors.primary} size={20} /> : null}
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.languageFooter}>
        <PrimaryButton label={t('language.done')} onPress={onBack} />
      </View>
    </View>
  );
}

function FilterScreen({
  onApply,
  onReset,
  onBack,
  t,
}: {
  onApply: () => void;
  onReset: () => void;
  onBack: () => void;
  t: (key: TranslationKey) => string;
}) {
  const [city, setCity] = useState<City | 'All'>('All');
  const [minRating, setMinRating] = useState(0);
  return (
    <View style={styles.flexOne}>
      <View style={styles.filterHeader}>
        <Pressable onPress={onBack}>
          <Text style={styles.filterBack}>{t('filter.title')}</Text>
        </Pressable>
        <Text style={styles.filterResults}>{t('filter.results')}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.filterContent} showsVerticalScrollIndicator={false}>
        <SectionTitle title={t('filter.city')} />
        <ChipGrid>
          {(['All', ...onboardingCities] as const).map((c) => (
            <ChoiceChip
              key={c}
              label={c === 'All' ? t('explore.allCities') : c}
              active={city === c}
              onPress={() => setCity(c)}
            />
          ))}
        </ChipGrid>
        <SectionTitle title={t('filter.category')} />
        <ChipGrid>
          {['All', 'Bay', 'Mountain', 'Heritage', 'Beach', 'Island', 'Cave'].map((c) => (
            <ChoiceChip key={c} label={c} active={false} onPress={() => {}} />
          ))}
        </ChipGrid>
        <SectionTitle title={t('filter.priceRange')} />
        <View style={styles.priceRow}>
          <Text style={styles.priceLabel}>0 VND</Text>
          <View style={styles.priceBar} />
          <Text style={styles.priceLabel}>1,000,000+ VND</Text>
        </View>
        <SectionTitle title={t('filter.rating')} />
        <View style={styles.ratingRow}>
          {[0, 3, 4].map((n) => (
            <Pressable
              key={n}
              style={[styles.ratingPill, minRating === n && styles.ratingPillActive]}
              onPress={() => setMinRating(n)}
            >
              <Text
                style={[
                  styles.ratingPillText,
                  minRating === n && styles.ratingPillTextActive,
                ]}
              >
                {n === 0 ? 'Tất cả' : `${n} sao trở lên`}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
      <View style={styles.filterFooter}>
        <Pressable style={styles.filterResetButton} onPress={onReset}>
          <Text style={styles.filterResetText}>{t('filter.reset')}</Text>
        </Pressable>
        <PrimaryButton label={t('filter.apply')} onPress={onApply} />
      </View>
    </View>
  );
}

const banknotePalette: Record<number, { background: string; accent: string; label: string }> = {
  1000: { background: '#d7c6ad', accent: '#755b3d', label: 'One thousand' },
  2000: { background: '#d9b998', accent: '#7f4f2d', label: 'Two thousand' },
  5000: { background: '#9ec8ba', accent: '#245f51', label: 'Five thousand' },
  10000: { background: '#e4bf9b', accent: '#8a4e20', label: 'Ten thousand' },
  20000: { background: '#c3a9d8', accent: '#5e3a78', label: 'Twenty thousand' },
  50000: { background: '#d8a9b4', accent: '#7e3348', label: 'Fifty thousand' },
  100000: { background: '#b7d5a2', accent: '#3f6f2e', label: 'One hundred thousand' },
  200000: { background: '#d7b78d', accent: '#765022', label: 'Two hundred thousand' },
  500000: { background: '#a8c9c4', accent: '#275f59', label: 'Five hundred thousand' },
};

const banknoteImages: Record<number, ImageSourcePropType> = {
  1000: require('./assets/currency/vnd-1000-both-hd.webp'),
  2000: require('./assets/currency/vnd-2000-both-hd.webp'),
  5000: require('./assets/currency/vnd-5000-both-hd.webp'),
  10000: require('./assets/currency/vnd-10000-both-hd.webp'),
  20000: require('./assets/currency/vnd-20000-both-hd.webp'),
  50000: require('./assets/currency/vnd-50000-both-hd.webp'),
  100000: require('./assets/currency/vnd-100000-both-hd.webp'),
  200000: require('./assets/currency/vnd-200000-both-hd.webp'),
  500000: require('./assets/currency/vnd-500000-both-hd.webp'),
};

function BanknoteVisual({ value, onPress }: { value: number; onPress: () => void }) {
  return (
    <Pressable
      accessibilityLabel={`View ${value.toLocaleString('vi-VN')} đồng larger`}
      onPress={onPress}
      style={styles.banknoteImageFrame}
    >
      <Image
        accessibilityLabel={`${value.toLocaleString('vi-VN')} đồng, front and back`}
        source={banknoteImages[value]}
        style={styles.banknoteImage}
        resizeMode="contain"
      />
      <View style={styles.banknoteZoomHint}><SearchIcon color={colors.surface} size={14} /><Text style={styles.banknoteZoomText}>Tap to enlarge</Text></View>
    </Pressable>
  );
}

function CurrencyScreen({ profile, locationLabel }: { profile: UserProfile; locationLabel: string | null }) {
  const [currency, setCurrency] = useState<'USD' | 'EUR' | 'GBP' | 'AUD' | 'JPY' | 'KRW' | 'CNY' | 'THB'>('USD');
  const [amount, setAmount] = useState('10');
  const [priceTab, setPriceTab] = useState<'all' | 'transport' | 'food' | 'stay' | 'connect'>('all');
  const [selectedBanknote, setSelectedBanknote] = useState<number | null>(null);
  const rates = { USD: 26300, EUR: 30500, GBP: 35200, AUD: 17300, JPY: 178, KRW: 19, CNY: 3660, THB: 815 } as const;
  const parsedAmount = Number(amount.replace(',', '.')) || 0;
  const converted = Math.round(parsedAmount * rates[currency]);
  const city = locationLabel || (profile.currentCity === 'Other' ? 'TP. Hồ Chí Minh' : profile.currentCity);
  const normalizedCity = normalizeSearchText(city);
  const cityFactor = ['phu quoc', 'hoi an', 'nha trang', 'da nang'].some((item) => normalizedCity.includes(item))
    ? 1.12
    : ['ho chi minh', 'ha noi'].some((item) => normalizedCity.includes(item))
      ? 1
      : 0.92;
  const compactVnd = (value: number) => value >= 1000000
    ? `${(value / 1000000).toLocaleString('en-US', { maximumFractionDigits: 2 })}m`
    : `${Math.round(value / 1000)}k`;
  const price = (min: number, max: number) => `${compactVnd(min * cityFactor)}–${compactVnd(max * cityFactor)} ₫`;
  const services: { id: string; category: typeof priceTab; title: string; detail: string; value: string; icon: typeof Home; source: string }[] = [
    { id: 'grabcar', category: 'transport', title: 'GrabCar · first 2 km', detail: '+ 9.8k/km and time fee; platform fee may apply', value: '28.5k ₫', icon: Navigation, source: 'Grab Vietnam' },
    { id: 'grabbike', category: 'transport', title: 'GrabBike · first 2 km', detail: '+ 4.2k/km and time fee; 3k platform fee', value: '12.3k ₫', icon: Navigation, source: 'Grab Vietnam' },
    { id: 'taxi-airport', category: 'transport', title: 'Airport taxi', detail: city === 'TP. Hồ Chí Minh' ? 'Tân Sơn Nhất ↔ central districts' : 'Typical airport transfer; check final app fare', value: city === 'TP. Hồ Chí Minh' ? '120k–170k ₫' : price(140000, 330000), icon: Plane, source: 'Vietnam Tourism' },
    { id: 'motorbike', category: 'transport', title: 'Motorbike rental · per day', detail: 'Helmet normally included; check licence and insurance', value: price(155000, 315000), icon: Navigation, source: 'Vietnam Tourism' },
    { id: 'esim10', category: 'connect', title: 'Tourist eSIM · 10 days', detail: '50 GB + 70 domestic minutes', value: '150k ₫', icon: Wifi, source: 'MobiFone Travel' },
    { id: 'esim30', category: 'connect', title: 'Tourist eSIM · 30 days', detail: '150 GB + 200 domestic minutes', value: '250k ₫', icon: Wifi, source: 'MobiFone Travel' },
    { id: 'streetfood', category: 'food', title: 'Street food / local dish', detail: 'Bánh mì, cơm, noodles or market snack', value: price(20000, 75000), icon: Utensils, source: 'Vietnam Travel Budget 2026' },
    { id: 'localmeal', category: 'food', title: 'Local restaurant meal', detail: 'Sit-down meal, usually per person', value: price(80000, 210000), icon: Utensils, source: 'Vietnam Travel Budget 2026' },
    { id: 'coffee', category: 'food', title: 'Vietnamese coffee', detail: 'Street stall to modern local café', value: price(15000, 65000), icon: Coffee, source: 'Vietnam Travel Budget 2026' },
    { id: 'hostel', category: 'stay', title: 'Hostel dorm · per night', detail: `Typical range in ${city}`, value: price(130000, 315000), icon: Home, source: 'Vietnam Travel Budget 2026' },
    { id: 'private', category: 'stay', title: 'Guesthouse/private room', detail: `Air-con and Wi-Fi in ${city}`, value: price(390000, 1050000), icon: Home, source: 'Vietnam Travel Budget 2026' },
    { id: 'hotel3', category: 'stay', title: '3-star hotel · per night', detail: `Average booking range in ${city}`, value: price(920000, 1840000), icon: Home, source: 'Vietnam Travel Budget 2026' },
  ];
  const filteredServices = priceTab === 'all' ? services : services.filter((item) => item.category === priceTab);

  return (
    <ScrollView contentContainerStyle={styles.currencyContent} showsVerticalScrollIndicator={false}>
      <View style={styles.currencyHero}>
        <Text style={styles.currencyEyebrow}>VIETNAMESE ĐỒNG · VND</Text>
        <Text style={styles.currencyTitle}>Money made simple</Text>
        <Text style={styles.currencySubtitle}>Recognise banknotes, convert quickly and know a fair price before paying.</Text>
      </View>

      <View style={styles.currencySection}>
        <View style={styles.homeSectionHeader}><Text style={styles.homeSectionTitle}>Quick converter</Text><Text style={styles.currencyUpdated}>13 Jul 2026</Text></View>
        <View style={styles.converterCard}>
          <View style={styles.converterInputRow}>
            <TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" style={styles.converterInput} accessibilityLabel="Foreign currency amount" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.currencyCodeRow}>
              {(Object.keys(rates) as (keyof typeof rates)[]).map((code) => <Pressable key={code} style={[styles.currencyCode, currency === code && styles.currencyCodeActive]} onPress={() => setCurrency(code)}><Text style={[styles.currencyCodeText, currency === code && styles.currencyCodeTextActive]}>{code}</Text></Pressable>)}
            </ScrollView>
          </View>
          <Text style={styles.converterEquals}>=</Text>
          <Text style={styles.converterResult}>{converted.toLocaleString('vi-VN')} ₫</Text>
          <Text style={styles.converterRate}>Estimate: 1 {currency} ≈ {rates[currency].toLocaleString('vi-VN')} ₫ · Compare the exchange counter's buy rate.</Text>
        </View>
      </View>

      <View style={styles.currencySection}>
        <Text style={styles.homeSectionTitle}>Common banknotes</Text>
        <Text style={styles.currencySectionHint}>Front and back photo guide — verify the printed denomination before paying.</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.banknoteRail}>
          {Object.keys(banknotePalette).map((value) => <View key={value} style={styles.banknoteCard}><BanknoteVisual value={Number(value)} onPress={() => setSelectedBanknote(Number(value))} /><Text style={styles.banknoteCardValue}>{Number(value).toLocaleString('vi-VN')} đồng</Text></View>)}
        </ScrollView>
      </View>

      <View style={styles.moneyTipCard}>
        <View style={styles.v2QuickIcon}><Info color={colors.primary} size={21} /></View>
        <View style={styles.flexOne}><Text style={styles.timelineTitle}>The “drop three zeros” trick</Text><Text style={styles.currencySectionHint}>50,000₫ → think “50”. 200,000₫ → “200”. A price written as 120k means 120,000₫. Dots and commas are often thousand separators in Vietnam.</Text></View>
      </View>

      <View style={styles.currencySection}>
        <View style={styles.priceCityHeader}><View><Text style={styles.homeSectionTitle}>Typical prices near you</Text><Text style={styles.currencySectionHint}>{city} · indicative range, July 2026</Text></View><View style={styles.cityPricePill}><MapPin color={colors.primary} size={15} /><Text style={styles.cityPriceText}>{city}</Text></View></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.priceTabRow}>
          {([{ id: 'all', label: 'All' }, { id: 'transport', label: 'Transport' }, { id: 'food', label: 'Food' }, { id: 'stay', label: 'Stay' }, { id: 'connect', label: '4G / SIM' }] as const).map((item) => <Pressable key={item.id} style={[styles.priceTab, priceTab === item.id && styles.priceTabActive]} onPress={() => setPriceTab(item.id)}><Text style={[styles.priceTabText, priceTab === item.id && styles.priceTabTextActive]}>{item.label}</Text></Pressable>)}
        </ScrollView>
        <View style={styles.priceList}>
          {filteredServices.map(({ id, title, detail, value, icon: Icon, source }) => <View key={id} style={styles.priceRowCard}><View style={styles.v2QuickIcon}><Icon color={colors.primary} size={20} /></View><View style={styles.flexOne}><Text style={styles.priceTitle}>{title}</Text><Text style={styles.priceDetail}>{detail}</Text><Text style={styles.priceSource}>Source: {source}</Text></View><Text style={styles.priceValue}>{value}</Text></View>)}
        </View>
      </View>

      <View style={styles.currencySafetyCard}><ShieldAlert color={colors.warning} size={21} /><View style={styles.flexOne}><Text style={styles.timelineTitle}>Pay safely</Text><Text style={styles.currencySectionHint}>Confirm taxi/app fare before riding, count change carefully, avoid damaged notes and use licensed exchange counters. Dynamic ride prices can rise during rain and peak hours.</Text></View></View>
      <Modal
        animationType="fade"
        onRequestClose={() => setSelectedBanknote(null)}
        transparent
        visible={selectedBanknote !== null}
      >
        <View style={styles.banknoteModalBackdrop}>
          <Pressable accessibilityLabel="Close banknote preview" onPress={() => setSelectedBanknote(null)} style={styles.banknoteModalClose}><X color={colors.surface} size={24} /></Pressable>
          {selectedBanknote !== null ? (
            <>
              <Image accessibilityLabel={`${selectedBanknote.toLocaleString('vi-VN')} đồng enlarged`} source={banknoteImages[selectedBanknote]} style={styles.banknoteModalImage} resizeMode="contain" />
              <Text style={styles.banknoteModalTitle}>{selectedBanknote.toLocaleString('vi-VN')} đồng</Text>
              <Text style={styles.banknoteModalHint}>Front and back · tap × to close</Text>
            </>
          ) : null}
        </View>
      </Modal>
    </ScrollView>
  );
}

function OfflineScreen({ onRetry, t }: { onRetry: () => void; t: (key: TranslationKey) => string }) {
  return (
    <ScrollView contentContainerStyle={styles.offlineContent} showsVerticalScrollIndicator={false}>
      <View style={styles.offlineHero}>
        <View style={styles.offlineIcon}>
          <WifiOff color={colors.primary} size={36} />
        </View>
        <Text style={styles.offlineTitle}>{t('offline.title')}</Text>
        <Text style={styles.offlineSubtitle}>{t('offline.subtitle')}</Text>
      </View>
      <View style={styles.offlineCard}>
        <Text style={styles.offlineCardTitle}>Downloaded cities & packs</Text>
        <View style={styles.offlineItem}>
          <Check color={colors.success} size={18} />
          <Text style={styles.offlineItemText}>Hồ Chí Minh City guide · 48 MB</Text>
        </View>
        <View style={styles.offlineItem}>
          <Check color={colors.success} size={18} />
          <Text style={styles.offlineItemText}>Offline map & saved places</Text>
        </View>
        <View style={styles.offlineItem}>
          <Check color={colors.success} size={18} />
          <Text style={styles.offlineItemText}>Vietnamese phrase & translator pack</Text>
        </View>
        <View style={styles.offlineItem}>
          <Check color={colors.success} size={18} />
          <Text style={styles.offlineItemText}>Emergency guide & SOS translations</Text>
        </View>
      </View>
      <View style={styles.offlineCard}>
        <Text style={styles.offlineCardTitle}>Khả dụng khi có mạng</Text>
        <View style={styles.offlineItem}>
          <Wifi color={colors.muted} size={18} />
          <Text style={styles.offlineItemText}>{t('offline.map')}</Text>
        </View>
        <View style={styles.offlineItem}>
          <Wifi color={colors.muted} size={18} />
          <Text style={styles.offlineItemText}>{t('offline.taxi')}</Text>
        </View>
        <View style={styles.offlineItem}>
          <Wifi color={colors.muted} size={18} />
          <Text style={styles.offlineItemText}>{t('offline.liveChat')}</Text>
        </View>
      </View>
      <PrimaryButton label={t('offline.retryCta')} onPress={onRetry} icon={Wifi} />
    </ScrollView>
  );
}

function MapScreen({
  place,
  userCoordinates,
  locationLabel,
  onBack,
  t,
}: {
  place: Place | null;
  userCoordinates: AppCoordinates | null;
  locationLabel: string | null;
  onBack: () => void;
  t: (key: TranslationKey) => string;
}) {
  const { data: translatedPlace } = useTranslatedData(place);
  const center = place
    ? { lat: place.lat, lng: place.lng }
    : userCoordinates
      ? { lat: userCoordinates.lat, lng: userCoordinates.lng }
      : { lat: 16.054, lng: 108.202 };
  const zoom = place || userCoordinates ? 14 : 5;
  const mapHtml = buildOpenStreetMapHtml({
    lat: center.lat,
    lng: center.lng,
    zoom,
    title: translatedPlace?.name || locationLabel || (userCoordinates ? 'Current location' : undefined),
    subtitle: translatedPlace?.category || (userCoordinates ? 'You are here' : undefined),
    attribution: t('map.attribution'),
    loading: t('map.loading'),
    unavailable: t('map.unavailable'),
  });

  return (
    <View style={styles.flexOne}>
      <View style={styles.mapHeader}>
        <IconButton icon={ArrowLeft} onPress={onBack} style={styles.headerBack} />
        <Text style={styles.mapHeaderTitle}>{t('map.title')}</Text>
      </View>
      <View style={styles.mapCanvasWrap}>
        {Platform.OS === 'web' ? (
          <iframe
            title={t('map.title')}
            srcDoc={mapHtml}
            style={styles.mapIframe}
          />
        ) : (
          <WebView
            originWhitelist={['*']}
            source={{ html: mapHtml }}
            style={styles.mapCanvas}
            javaScriptEnabled
            domStorageEnabled
          />
        )}
        <View style={styles.mapSheet}>
          {place && translatedPlace ? (
            <View style={styles.mapSheetContent}>
              <View style={styles.mapPin}><MapPin color={colors.primary} size={20} /></View>
              <View style={styles.flexOne}>
                <Text style={styles.mapPinName}>{translatedPlace.name}</Text>
                <Text style={styles.mapPinSub}>{place.lat.toFixed(3)}, {place.lng.toFixed(3)}</Text>
              </View>
              <Pressable style={styles.mapOpenButton} onPress={() => openInMaps(place)}>
                <Text style={styles.mapOpenText}>{t('map.openExternal')}</Text>
                <ChevronRight color={colors.surface} size={16} />
              </Pressable>
            </View>
          ) : userCoordinates ? (
            <View style={styles.mapSheetContent}>
              <View style={styles.mapPin}><Navigation color={colors.primary} size={20} /></View>
              <View style={styles.flexOne}>
                <Text style={styles.mapPinName}>{locationLabel || 'Current location'}</Text>
                <Text style={styles.mapPinSub}>{userCoordinates.lat.toFixed(4)}, {userCoordinates.lng.toFixed(4)}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.mapSubtitle}>{t('map.subtitle')}</Text>
          )}
        </View>
      </View>
    </View>
  );
}

function AiScreen({
  messages,
  chatInput,
  onChangeInput,
  onAsk,
  onBuildItinerary,
  tripDays,
  tripStyle,
  onChangeTripDays,
  onChangeTripStyle,
  currentCity,
  currentLanguage,
  locale,
  isReplying,
  t,
}: {
  messages: ChatMessage[];
  chatInput: string;
  onChangeInput: (text: string) => void;
  onAsk: (q: string) => Promise<string | null>;
  onBuildItinerary: () => void;
  tripDays: number;
  tripStyle: TripStyle;
  onChangeTripDays: (d: number) => void;
  onChangeTripStyle: (s: TripStyle) => void;
  currentCity: string;
  currentLanguage: Language;
  locale: Locale;
  isReplying: boolean;
  t: (key: TranslationKey) => string;
}) {
  type AiFeatureId = 'chat' | 'planner' | 'voice' | 'camera' | 'ocr' | 'expense' | 'weather' | 'safety' | 'local';
  const isVietnamese = locale === 'vi';
  const city = currentCity === 'Other' ? 'Đà Nẵng' : currentCity;
  const [selectedFeature, setSelectedFeature] = useState<AiFeatureId | null>(null);
  const [featureInput, setFeatureInput] = useState('');
  const [voiceActive, setVoiceActive] = useState(false);
  const [scanMode, setScanMode] = useState<'food' | 'landmark' | 'sign'>('food');
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [cameraFacing, setCameraFacing] = useState<CameraType>('back');
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
  const [visionAnalysis, setVisionAnalysis] = useState<VisionAnalysis | null>(null);
  const [visionLoading, setVisionLoading] = useState(false);
  const [visionError, setVisionError] = useState<string | null>(null);
  const [expenseInput, setExpenseInput] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Food');
  const [aiExpenses, setAiExpenses] = useState([
    { id: 'stay', label: 'Hotel', amount: 1200000 },
    { id: 'meal', label: 'Food', amount: 460000 },
  ]);
  const [featureResult, setFeatureResult] = useState<string | null>(null);
  const [isFeatureReplying, setIsFeatureReplying] = useState(false);

  const features: { id: AiFeatureId; title: string; description: string; icon: typeof Home; color: string; tint: string }[] = [
    { id: 'chat', title: 'AI Chat', description: isVietnamese ? 'Hỏi đáp về Việt Nam' : 'Ask anything about Vietnam', icon: MessageCircle, color: '#7c3aed', tint: '#f3e8ff' },
    { id: 'planner', title: 'AI Planner', description: isVietnamese ? 'Lịch trình theo ngân sách' : 'Plan around your budget', icon: CalendarCheck, color: '#2563eb', tint: '#dbeafe' },
    { id: 'voice', title: 'AI Voice', description: isVietnamese ? 'Hội thoại bằng giọng nói' : 'Hands-free conversation', icon: Mic, color: '#db2777', tint: '#fce7f3' },
    { id: 'camera', title: 'AI Camera', description: isVietnamese ? 'Nhận diện món ăn, địa danh' : 'Identify food and landmarks', icon: Camera, color: '#0891b2', tint: '#cffafe' },
    { id: 'ocr', title: 'OCR Translate', description: isVietnamese ? 'Dịch menu, biển hiệu, hóa đơn' : 'Translate menus and receipts', icon: ScanLine, color: '#ea580c', tint: '#ffedd5' },
    { id: 'expense', title: 'AI Expense', description: isVietnamese ? 'Theo dõi và phân tích chi phí' : 'Track and explain spending', icon: CircleDollarSign, color: '#16a34a', tint: '#dcfce7' },
    { id: 'weather', title: 'Weather Advisor', description: isVietnamese ? 'Điều chỉnh lịch theo thời tiết' : 'Weather-aware trip changes', icon: CloudSun, color: '#ca8a04', tint: '#fef9c3' },
    { id: 'safety', title: 'AI Safety', description: isVietnamese ? 'Cảnh báo và hỗ trợ khẩn cấp' : 'Alerts and emergency guidance', icon: ShieldAlert, color: '#dc2626', tint: '#fee2e2' },
    { id: 'local', title: 'AI Local Guide', description: isVietnamese ? 'Trải nghiệm như người bản địa' : 'Explore like a local', icon: Compass, color: '#0f766e', tint: '#ccfbf1' },
  ];

  const selectedFeatureMeta = features.find((item) => item.id === selectedFeature) ?? null;
  const totalExpense = aiExpenses.reduce((sum, item) => sum + item.amount, 0);

  const runFeaturePrompt = async (prompt: string, speak = false) => {
    if (!prompt.trim() || isFeatureReplying) return;
    setIsFeatureReplying(true);
    setFeatureResult(null);
    try {
      const answer = await onAsk(prompt);
      setFeatureResult(answer);
      if (speak && answer) {
        Speech.stop();
        Speech.speak(answer, { language: aiSpeechLocales[locale], rate: 0.92 });
      }
    } finally {
      setIsFeatureReplying(false);
    }
  };

  const openFeature = (id: AiFeatureId) => {
    setFeatureResult(null);
    setVisionAnalysis(null);
    setVisionError(null);
    setCapturedImageUri(null);
    setCameraActive((id === 'camera' || id === 'ocr') && cameraPermission?.granted === true);
    setVoiceActive(false);
    setSelectedFeature(id);
  };

  const closeFeature = () => {
    Speech.stop();
    setVoiceActive(false);
    setCameraActive(false);
    setSelectedFeature(null);
  };

  const startVisionCamera = async () => {
    setVisionError(null);
    setVisionAnalysis(null);
    setCapturedImageUri(null);
    if (cameraPermission?.granted) {
      setCameraActive(true);
      return;
    }
    const permission = await requestCameraPermission();
    if (permission.granted) {
      setCameraActive(true);
    } else {
      setVisionError(isVietnamese ? 'Cần quyền camera để chụp và phân tích ảnh.' : 'Camera permission is required to capture and analyze an image.');
    }
  };

  const captureAndAnalyze = async (mode: VisionAnalysisMode) => {
    if (!cameraRef.current || visionLoading) return;
    setVisionLoading(true);
    setVisionError(null);
    setVisionAnalysis(null);
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.55 });
      if (!photo?.base64) throw new Error(isVietnamese ? 'Không đọc được dữ liệu ảnh.' : 'The captured image data is unavailable.');
      setCapturedImageUri(photo.uri);
      setCameraActive(false);
      const analysis = await analyzeTravelImage({
        imageBase64: photo.base64,
        mimeType: 'image/jpeg',
        mode,
        locale,
        city,
      });
      setVisionAnalysis(analysis);
    } catch (error) {
      setCameraActive(false);
      setVisionError(error instanceof Error ? error.message : (isVietnamese ? 'Không thể phân tích ảnh.' : 'Could not analyze this image.'));
    } finally {
      setVisionLoading(false);
    }
  };

  const renderVisionResult = () => {
    if (visionLoading) {
      return <View style={styles.aiVisionLoading}><ActivityIndicator color={colors.primary} /><Text style={styles.timelineTitle}>{isVietnamese ? 'Gemini đang phân tích ảnh…' : 'Gemini is analyzing the image…'}</Text></View>;
    }
    if (visionError) {
      return <View style={styles.aiVisionError}><Info color="#dc2626" size={19} /><Text selectable style={styles.aiResultText}>{visionError}</Text></View>;
    }
    if (!visionAnalysis) return null;
    return (
      <View style={styles.aiVisionResult}>
        <View style={styles.aiVisionResultHeader}>
          <View style={styles.flexOne}><Text selectable style={styles.aiFeatureLead}>{visionAnalysis.title}</Text><Text style={styles.v2PlaceSub}>{visionAnalysis.model ?? 'Gemini'} · {isVietnamese ? 'độ tin cậy' : 'confidence'}: {visionAnalysis.confidence}</Text></View>
          <CircleCheck color={colors.success} size={22} />
        </View>
        {visionAnalysis.summary ? <Text selectable style={styles.aiVisionSummary}>{visionAnalysis.summary}</Text> : null}
        {visionAnalysis.extractedText ? <View style={styles.aiVisionSection}><Text style={styles.aiFeatureLabel}>OCR</Text><Text selectable style={styles.aiVisionText}>{visionAnalysis.extractedText}</Text></View> : null}
        {visionAnalysis.translation ? <View style={styles.aiVisionSection}><Text style={styles.aiFeatureLabel}>{isVietnamese ? 'Bản dịch' : 'Translation'}</Text><Text selectable style={styles.aiVisionText}>{visionAnalysis.translation}</Text></View> : null}
        {visionAnalysis.priceHint ? <View style={styles.aiInsightCard}><CircleDollarSign color="#16a34a" size={19} /><Text selectable style={styles.aiResultText}>{visionAnalysis.priceHint}</Text></View> : null}
        {visionAnalysis.safetyNote ? <View style={styles.aiSafetyAlert}><ShieldAlert color="#dc2626" size={19} /><Text selectable style={styles.aiResultText}>{visionAnalysis.safetyNote}</Text></View> : null}
      </View>
    );
  };

  const renderVisionCamera = (mode: VisionAnalysisMode) => (
    <View style={styles.aiFeatureBody}>
      {cameraActive && cameraPermission?.granted ? (
        <View style={styles.aiLiveCameraWrap}>
          <CameraView ref={cameraRef} active facing={cameraFacing} mirror={cameraFacing === 'front'} style={styles.aiLiveCamera} />
          <View pointerEvents="none" style={styles.aiCameraGuide}><ScanLine color={colors.surface} size={58} /><Text style={styles.aiCameraHint}>{isVietnamese ? 'Giữ ảnh rõ nét và đủ sáng' : 'Keep the image sharp and well lit'}</Text></View>
          <View style={styles.aiCameraControls}>
            <Pressable accessibilityLabel={isVietnamese ? 'Đổi camera' : 'Flip camera'} accessibilityRole="button" style={styles.aiCameraControlButton} onPress={() => setCameraFacing((current) => current === 'back' ? 'front' : 'back')}><RefreshCw color={colors.surface} size={20} /></Pressable>
            <Pressable accessibilityLabel={isVietnamese ? 'Chụp và phân tích' : 'Capture and analyze'} accessibilityRole="button" disabled={visionLoading} style={styles.aiCameraShutter} onPress={() => void captureAndAnalyze(mode)}><View style={styles.aiCameraShutterCore} /></Pressable>
            <Pressable accessibilityLabel={isVietnamese ? 'Đóng camera' : 'Close camera'} accessibilityRole="button" style={styles.aiCameraControlButton} onPress={() => setCameraActive(false)}><X color={colors.surface} size={21} /></Pressable>
          </View>
        </View>
      ) : capturedImageUri ? (
        <Image source={{ uri: capturedImageUri }} style={styles.aiCapturedImage} resizeMode="cover" />
      ) : (
        <View style={styles.aiCameraPreview}><Camera color={colors.surface} size={48} /><Text style={styles.aiCameraHint}>{isVietnamese ? 'Ảnh chỉ được gửi khi bạn bấm chụp' : 'The image is sent only after you capture it'}</Text></View>
      )}
      {!cameraActive ? <PrimaryButton label={capturedImageUri ? (isVietnamese ? 'Chụp ảnh khác' : 'Retake photo') : (isVietnamese ? 'Mở camera' : 'Open camera')} icon={Camera} onPress={() => void startVisionCamera()} /> : null}
      {renderVisionResult()}
      <Text style={styles.aiPrivacyNote}>{isVietnamese ? 'Ảnh được gửi qua kết nối HTTPS tới Gemini để phân tích và không được lưu trong ứng dụng.' : 'The image is sent to Gemini over HTTPS for analysis and is not stored by the app.'}</Text>
    </View>
  );

  const renderFeatureContent = () => {
    if (selectedFeature === 'chat') {
      return (
        <View style={styles.aiFeatureBody}>
          <Text style={styles.aiFeatureLead}>{isVietnamese ? 'Bạn muốn biết gì về Việt Nam?' : 'What would you like to know about Vietnam?'}</Text>
          <View style={styles.aiPromptWrap}>
            {[
              isVietnamese ? '3 ngày ở TP.HCM nên đi đâu?' : 'What should I do in HCMC for 3 days?',
              isVietnamese ? 'Món nào không cay?' : 'Which local dishes are not spicy?',
              isVietnamese ? 'Cách đi sân bay tiết kiệm?' : 'What is the cheapest airport route?',
            ].map((prompt) => <Pressable accessibilityRole="button" key={prompt} style={styles.aiPromptChip} onPress={() => runFeaturePrompt(prompt)}><Text style={styles.aiPromptText}>{prompt}</Text></Pressable>)}
          </View>
          <TextInput value={featureInput} onChangeText={setFeatureInput} placeholder={isVietnamese ? 'Nhập câu hỏi...' : 'Type your question...'} placeholderTextColor={colors.muted} style={styles.aiFeatureInput} returnKeyType="send" onSubmitEditing={() => runFeaturePrompt(featureInput)} />
          <PrimaryButton label={isVietnamese ? 'Hỏi AI' : 'Ask AI'} icon={Send} onPress={() => runFeaturePrompt(featureInput)} />
        </View>
      );
    }
    if (selectedFeature === 'planner') {
      return (
        <View style={styles.aiFeatureBody}>
          <View style={styles.aiInsightCard}><CalendarCheck color="#2563eb" size={22} /><View style={styles.flexOne}><Text style={styles.timelineTitle}>{city} · {tripDays} {isVietnamese ? 'ngày' : 'days'}</Text><Text style={styles.v2PlaceSub}>{tripStyle} · {isVietnamese ? 'ước tính 1,8–3,2 triệu ₫' : 'estimated 1.8M–3.2M ₫'}</Text></View></View>
          <Text style={styles.aiFeatureLabel}>{isVietnamese ? 'Số ngày' : 'Trip length'}</Text>
          <View style={styles.aiPromptWrap}>{[1, 2, 3, 5].map((day) => <Pressable key={day} style={[styles.aiPromptChip, tripDays === day && styles.aiPromptChipActive]} onPress={() => onChangeTripDays(day)}><Text style={[styles.aiPromptText, tripDays === day && styles.aiPromptTextActive]}>{day} {isVietnamese ? 'ngày' : 'days'}</Text></Pressable>)}</View>
          <Text style={styles.aiFeatureLabel}>{isVietnamese ? 'Phong cách' : 'Travel style'}</Text>
          <View style={styles.aiPromptWrap}>{tripStyles.map((style) => <Pressable key={style} style={[styles.aiPromptChip, tripStyle === style && styles.aiPromptChipActive]} onPress={() => onChangeTripStyle(style)}><Text style={[styles.aiPromptText, tripStyle === style && styles.aiPromptTextActive]}>{style}</Text></Pressable>)}</View>
          <PrimaryButton label={isVietnamese ? 'Tạo lịch trình thông minh' : 'Build smart itinerary'} icon={Sparkles} onPress={() => { closeFeature(); onBuildItinerary(); }} />
        </View>
      );
    }
    if (selectedFeature === 'voice') {
      return (
        <View style={[styles.aiFeatureBody, styles.aiVoiceBody]}>
          <View style={[styles.aiVoiceOrbLarge, voiceActive && styles.aiVoiceOrbListening]}><Mic color={colors.surface} size={38} /></View>
          <Text style={styles.aiFeatureLead}>{voiceActive ? (isVietnamese ? 'Đang nghe… chạm để hoàn tất' : 'Listening… tap to finish') : (isVietnamese ? 'Chạm để bắt đầu hội thoại' : 'Tap to start a conversation')}</Text>
          <Text style={styles.aiFeatureCaption}>{isVietnamese ? 'Có thể hỏi đường, món ăn, giá cả hoặc văn hóa.' : 'Ask about directions, food, prices or culture.'}</Text>
          <Pressable accessibilityRole="button" style={[styles.aiVoiceStart, voiceActive && styles.aiVoiceStop]} onPress={() => {
            if (!voiceActive) { setVoiceActive(true); setFeatureResult(null); return; }
            setVoiceActive(false);
            runFeaturePrompt(isVietnamese ? `Gợi ý một trải nghiệm thú vị gần tôi ở ${city}` : `Suggest an interesting experience near me in ${city}`, true);
          }}><Text style={styles.aiVoiceStartText}>{voiceActive ? (isVietnamese ? 'Hoàn tất' : 'Finish') : (isVietnamese ? 'Bắt đầu nói' : 'Start speaking')}</Text></Pressable>
        </View>
      );
    }
    if (selectedFeature === 'camera') {
      const labels = { food: isVietnamese ? 'Món ăn' : 'Food', landmark: isVietnamese ? 'Địa danh' : 'Landmark', sign: isVietnamese ? 'Biển báo' : 'Sign' };
      return (
        <View style={styles.aiFeatureBody}>
          <View style={styles.aiPromptWrap}>{(Object.keys(labels) as (keyof typeof labels)[]).map((mode) => <Pressable key={mode} style={[styles.aiPromptChip, scanMode === mode && styles.aiPromptChipActive]} onPress={() => setScanMode(mode)}><Text style={[styles.aiPromptText, scanMode === mode && styles.aiPromptTextActive]}>{labels[mode]}</Text></Pressable>)}</View>
          {renderVisionCamera(scanMode)}
        </View>
      );
    }
    if (selectedFeature === 'ocr') {
      return (
        <View style={styles.aiFeatureBody}>
          <Text style={styles.aiFeatureLead}>{isVietnamese ? 'Quét và dịch nội dung tiếng Việt' : 'Scan and translate Vietnamese text'}</Text>
          <Text style={styles.aiFeatureCaption}>{isVietnamese ? 'Chụp menu, biển hiệu hoặc hóa đơn. AI sẽ giữ nguyên giá và tổng tiền khi trích xuất.' : 'Capture a menu, sign or receipt. AI preserves printed prices and totals while extracting text.'}</Text>
          {renderVisionCamera('ocr')}
        </View>
      );
    }
    if (selectedFeature === 'expense') {
      return (
        <View style={styles.aiFeatureBody}>
          <View style={styles.aiExpenseSummary}><Text style={styles.tripEyebrow}>{isVietnamese ? 'TỔNG CHUYẾN ĐI' : 'TRIP TOTAL'}</Text><Text selectable style={styles.aiExpenseTotal}>{totalExpense.toLocaleString('vi-VN')} ₫</Text><Text style={styles.v2PlaceSub}>{isVietnamese ? 'AI: Chi phí lưu trú chiếm tỷ trọng cao nhất.' : 'AI: Accommodation is your largest category.'}</Text></View>
          <View style={styles.aiPromptWrap}>{['Food', 'Transport', 'Stay', 'Other'].map((category) => <Pressable key={category} style={[styles.aiPromptChip, expenseCategory === category && styles.aiPromptChipActive]} onPress={() => setExpenseCategory(category)}><Text style={[styles.aiPromptText, expenseCategory === category && styles.aiPromptTextActive]}>{category}</Text></Pressable>)}</View>
          <View style={styles.expenseInputRow}><TextInput value={expenseInput} onChangeText={setExpenseInput} keyboardType="numeric" placeholder={isVietnamese ? 'Số tiền (VND)' : 'Amount (VND)'} placeholderTextColor={colors.muted} style={styles.expenseInput} /><Pressable accessibilityLabel={isVietnamese ? 'Thêm chi phí' : 'Add expense'} accessibilityRole="button" style={styles.expenseAdd} onPress={() => { const amount = Number(expenseInput.replace(/\D/g, '')); if (amount > 0) { setAiExpenses((current) => [...current, { id: `${Date.now()}`, label: expenseCategory, amount }]); setExpenseInput(''); } }}><Plus color={colors.surface} size={20} /></Pressable></View>
          {aiExpenses.slice(-3).map((item) => <View key={item.id} style={styles.aiExpenseRow}><Text style={[styles.timelineTitle, styles.flexOne]}>{item.label}</Text><Text selectable style={styles.expenseRowAmount}>{item.amount.toLocaleString('vi-VN')} ₫</Text></View>)}
        </View>
      );
    }
    if (selectedFeature === 'weather') {
      return (
        <View style={styles.aiFeatureBody}>
          <View style={styles.aiWeatherHero}><CloudSun color="#ca8a04" size={34} /><View><Text style={styles.aiFeatureLead}>{city} · 29°C</Text><Text style={styles.v2PlaceSub}>{isVietnamese ? 'Mưa ngắn lúc 16:30 · độ tin cậy 78%' : 'Short rain at 16:30 · 78% confidence'}</Text></View></View>
          {[['09:00', isVietnamese ? 'Tham quan ngoài trời · thời tiết tốt' : 'Outdoor sightseeing · good weather'], ['16:30', isVietnamese ? 'Đổi sang bảo tàng hoặc quán cà phê' : 'Switch to a museum or café'], ['18:15', isVietnamese ? 'Dời ngắm hoàng hôn sau cơn mưa' : 'Move sunset viewing until after rain']].map(([time, text]) => <View key={time} style={styles.aiAdviceRow}><Text style={styles.timelineTime}>{time}</Text><Text style={[styles.timelineTitle, styles.flexOne]}>{text}</Text></View>)}
          <PrimaryButton label={isVietnamese ? 'Nhờ AI tối ưu lịch hôm nay' : 'Optimize today’s plan'} icon={Sparkles} onPress={() => runFeaturePrompt(isVietnamese ? `Điều chỉnh lịch trình hôm nay ở ${city} vì có mưa lúc 16:30` : `Adjust today's ${city} itinerary because rain is expected at 16:30`)} />
        </View>
      );
    }
    if (selectedFeature === 'safety') {
      return (
        <View style={styles.aiFeatureBody}>
          <View style={styles.aiSafetyAlert}><ShieldAlert color="#dc2626" size={23} /><View style={styles.flexOne}><Text style={styles.timelineTitle}>{isVietnamese ? 'Mức cảnh báo: Bình thường' : 'Alert level: Normal'}</Text><Text style={styles.v2PlaceSub}>{isVietnamese ? 'Giữ đồ có giá trị cẩn thận ở khu chợ đông người.' : 'Keep valuables secure in crowded market areas.'}</Text></View></View>
          <View style={styles.aiEmergencyGrid}>{[['113', isVietnamese ? 'Công an' : 'Police'], ['114', isVietnamese ? 'Cứu hỏa' : 'Fire'], ['115', isVietnamese ? 'Cấp cứu' : 'Ambulance']].map(([number, label]) => <View key={number} style={styles.aiEmergencyCard}><Text selectable style={styles.aiEmergencyNumber}>{number}</Text><Text style={styles.v2PlaceSub}>{label}</Text></View>)}</View>
          <PrimaryButton label={isVietnamese ? 'Hướng dẫn an toàn theo vị trí' : 'Get location safety guidance'} icon={ShieldAlert} onPress={() => runFeaturePrompt(isVietnamese ? `Cho tôi hướng dẫn an toàn khi đi du lịch tại ${city}` : `Give me practical safety guidance for travelling in ${city}`)} />
        </View>
      );
    }
    return (
      <View style={styles.aiFeatureBody}>
        <Text style={styles.aiFeatureLead}>{isVietnamese ? `Khám phá ${city} như người bản địa` : `Experience ${city} like a local`}</Text>
        {[
          { title: isVietnamese ? 'Cà phê buổi sáng trong hẻm' : 'Morning alley coffee', detail: isVietnamese ? '07:00 · ít khách du lịch · 25k–45k ₫' : '07:00 · fewer tourists · 25k–45k ₫', icon: Coffee },
          { title: isVietnamese ? 'Chợ địa phương giờ tan tầm' : 'Local market at rush hour', detail: isVietnamese ? '17:30 · đồ ăn đường phố · mang tiền lẻ' : '17:30 · street food · carry small notes', icon: ShoppingBag },
          { title: isVietnamese ? 'Đi bộ khu phố cũ buổi tối' : 'Evening old-quarter walk', detail: isVietnamese ? '19:30 · nhịp sống địa phương · miễn phí' : '19:30 · local atmosphere · free', icon: Navigation },
        ].map(({ title, detail, icon: Icon }) => <Pressable key={title} style={styles.aiLocalRow} onPress={() => runFeaturePrompt(isVietnamese ? `Hãy hướng dẫn chi tiết trải nghiệm: ${title} ở ${city}` : `Give me a detailed local guide for: ${title} in ${city}`)}><View style={styles.v2QuickIcon}><Icon color={colors.primary} size={19} /></View><View style={styles.flexOne}><Text style={styles.timelineTitle}>{title}</Text><Text style={styles.v2PlaceSub}>{detail}</Text></View><ChevronRight color={colors.muted} size={18} /></Pressable>)}
      </View>
    );
  };

  return (
    <View style={styles.flexOne}>
      <View style={styles.aiHeader}>
        <Text style={styles.exploreTitle}>{t('ai.title')}</Text>
        <View style={styles.onlineRow}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineText}>{t('ai.online')}</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.aiContent} showsVerticalScrollIndicator={false}>
        <View style={styles.aiWelcomeCard}>
          <View style={styles.aiOrb}><Sparkles color={colors.surface} size={26} /></View>
          <View style={styles.flexOne}>
            <Text style={styles.aiWelcomeTitle}>{getWelcomeMessage(locale)}</Text>
            <Text style={styles.aiItinerarySubtitle}>{languageNativeNames[currentLanguage]} · Vinago+ AI</Text>
          </View>
        </View>

        <View style={styles.aiToolkitHeader}>
          <View><Text style={styles.homeSectionTitle}>AI Toolkit</Text><Text style={styles.v2PlaceSub}>{isVietnamese ? '9 công cụ đồng hành trong suốt chuyến đi' : '9 smart tools for every part of your trip'}</Text></View>
          <View style={styles.aiToolkitCount}><Text style={styles.aiToolkitCountText}>9</Text></View>
        </View>
        <View style={styles.aiFeatureGrid}>
          {features.map(({ id, title, description, icon: Icon, color, tint }) => (
            <Pressable accessibilityLabel={`${title}: ${description}`} accessibilityRole="button" key={id} style={styles.aiFeatureCard} onPress={() => openFeature(id)}>
              <View style={[styles.aiFeatureIcon, { backgroundColor: tint }]}><Icon color={color} size={22} /></View>
              <Text style={styles.aiFeatureCardTitle}>{title}</Text>
              <Text style={styles.aiFeatureCardDescription}>{description}</Text>
              <View style={styles.aiFeatureOpen}><Text style={styles.aiFeatureOpenText}>{isVietnamese ? 'Mở' : 'Open'}</Text><ChevronRight color={colors.primary} size={14} /></View>
            </Pressable>
          ))}
        </View>

        <View style={styles.aiItineraryCard}>
          <Text style={styles.aiItineraryTitle}>{t('ai.itineraryBuilder')}</Text>
          <Text style={styles.aiItinerarySubtitle}>{t('ai.itinerarySubtitle')}</Text>
          <View style={styles.aiDayRow}>
            {[1, 2, 3, 5].map((n) => (
              <Pressable
                key={n}
                style={[styles.aiDayChip, tripDays === n && styles.aiDayChipActive]}
                onPress={() => onChangeTripDays(n)}
              >
                <Text
                  style={[
                    styles.aiDayChipText,
                    tripDays === n && styles.aiDayChipTextActive,
                  ]}
                >
                  {n} {t('onboarding.tripDays')}
                </Text>
              </Pressable>
            ))}
          </View>
          <ChipGrid>
            {tripStyles.map((style) => (
              <ChoiceChip
                key={style}
                label={style}
                active={tripStyle === style}
                onPress={() => onChangeTripStyle(style)}
              />
            ))}
          </ChipGrid>
          <PrimaryButton
            label={t('ai.buildItinerary')}
            onPress={onBuildItinerary}
            icon={Sparkles}
          />
        </View>

        {messages.length > 0 ? (
          <View style={styles.chatList}>
            {messages.map((m) => (
              <View
                key={m.id}
                style={[
                  styles.chatBubble,
                  m.from === 'user' ? styles.chatBubbleUser : styles.chatBubbleAssistant,
                ]}
              >
                <Text
                  style={[
                    styles.chatText,
                    m.from === 'user' ? styles.chatTextUser : styles.chatTextAssistant,
                  ]}
                >
                  {m.text}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
        {isReplying ? (
          <View style={[styles.chatBubble, styles.chatBubbleAssistant, styles.aiReplyingBubble]}>
            <ActivityIndicator color={colors.primary} size="small" />
            <Text style={styles.chatTextAssistant}>{aiLanguageCopy[locale].listening}</Text>
          </View>
        ) : null}
      </ScrollView>
      <View style={styles.aiInputRow}>
        <Pressable accessibilityLabel="Open AI Voice" accessibilityRole="button" style={styles.aiVoiceButton} onPress={() => openFeature('voice')}><Mic color={colors.primary} size={20} /></Pressable>
        <View style={styles.aiInputField}>
          <TextInput
            value={chatInput}
            onChangeText={onChangeInput}
            placeholder={t('ai.placeholder')}
            placeholderTextColor={colors.muted}
            style={styles.aiInput}
            returnKeyType="send"
            onSubmitEditing={() => { void onAsk(chatInput); }}
          />
        </View>
        <Pressable
          style={styles.aiSendButton}
          disabled={isReplying}
          onPress={() => { void onAsk(chatInput); }}
        >
          <Send color={colors.surface} size={18} />
        </Pressable>
      </View>
      <Modal animationType="slide" transparent visible={selectedFeature !== null} onRequestClose={closeFeature}>
        <View style={styles.aiFeatureModalBackdrop}>
          <Pressable accessibilityLabel={isVietnamese ? 'Đóng công cụ AI' : 'Close AI tool'} accessibilityRole="button" style={styles.aiFeatureModalDismiss} onPress={closeFeature} />
          <View style={styles.aiFeatureSheet}>
            <View style={styles.aiFeatureHandle} />
            <View style={styles.aiFeatureSheetHeader}>
              {selectedFeatureMeta ? <View style={[styles.aiFeatureIcon, { backgroundColor: selectedFeatureMeta.tint }]}><selectedFeatureMeta.icon color={selectedFeatureMeta.color} size={23} /></View> : null}
              <View style={styles.flexOne}><Text style={styles.aiFeatureSheetTitle}>{selectedFeatureMeta?.title}</Text><Text style={styles.v2PlaceSub}>{selectedFeatureMeta?.description}</Text></View>
              <Pressable accessibilityLabel={isVietnamese ? 'Đóng' : 'Close'} accessibilityRole="button" style={styles.aiFeatureClose} onPress={closeFeature}><X color={colors.text} size={20} /></Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.aiFeatureSheetScroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {renderFeatureContent()}
              {featureResult ? <View style={styles.aiResultCard}><Sparkles color={colors.primary} size={19} /><Text selectable style={styles.aiResultText}>{featureResult}</Text></View> : null}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ItineraryPreviewScreen({
  itinerary,
  onSave,
  onSendEmail,
  onExportPdf,
  onBack,
  t,
}: {
  itinerary: ItineraryConfirmation;
  onSave: () => void;
  onSendEmail: () => void;
  onExportPdf: () => void;
  onBack: () => void;
  t: (key: TranslationKey) => string;
}) {
  return (
    <ScrollView contentContainerStyle={styles.itineraryPreview} showsVerticalScrollIndicator={false}>
      <View style={styles.itineraryPreviewHero}>
        <Text style={styles.itineraryPreviewTitle}>{t('ai.previewTitle')}</Text>
        <Text style={styles.itineraryPreviewSubtitle}>{t('ai.previewSubtitle')}</Text>
        <View style={styles.itineraryPreviewChipRow}>
          <View style={styles.itineraryPreviewChip}>
            <Text style={styles.itineraryPreviewChipText}>
              {itinerary.days} {t('onboarding.tripDays')} · {itinerary.city}
            </Text>
          </View>
          <View style={styles.itineraryPreviewChip}>
            <Text style={styles.itineraryPreviewChipText}>{itinerary.style}</Text>
          </View>
        </View>
      </View>
      <View style={styles.itineraryBody}>
        <Text style={styles.itineraryBodyText}>{buildItineraryPreview(itinerary, 'vi')}</Text>
      </View>
      <View style={styles.itineraryActions}>
        <Pressable style={styles.itineraryActionSecondary} onPress={onSave}>
          <Bookmark color={colors.primary} size={18} />
          <Text style={styles.itineraryActionText}>{t('ai.save')}</Text>
        </Pressable>
        <Pressable style={styles.itineraryActionPrimary} onPress={onSendEmail}>
          <Mail color={colors.surface} size={18} />
          <Text style={[styles.itineraryActionText, styles.itineraryActionTextPrimary]}>
            {t('ai.sendEmail')}
          </Text>
        </Pressable>
      </View>
      <Pressable style={styles.itineraryExport} onPress={onExportPdf}>
        <Download color={colors.primary} size={18} />
        <Text style={styles.itineraryExportText}>{t('ai.exportPdf')}</Text>
      </Pressable>
    </ScrollView>
  );
}

function ItineraryEmailScreen({
  itinerary,
  recipient,
  subject,
  body,
  onChangeRecipient,
  onChangeSubject,
  onChangeBody,
  onSend,
  t,
}: {
  itinerary: ItineraryConfirmation;
  recipient: string;
  subject: string;
  body: string;
  onChangeRecipient: (value: string) => void;
  onChangeSubject: (value: string) => void;
  onChangeBody: (value: string) => void;
  onSend: () => void;
  t: (key: TranslationKey) => string;
}) {
  return (
    <ScrollView contentContainerStyle={styles.emailFormContent} showsVerticalScrollIndicator={false}>
      <View style={styles.emailHero}>
        <View style={styles.emailEnvelope}>
          <Mail color={colors.primary} size={42} />
        </View>
        <Text style={styles.emailHeroTitle}>{t('ai.emailFormTitle')}</Text>
        <Text style={styles.emailHeroSubtitle}>{t('ai.emailIntro')}</Text>
      </View>
      <View style={styles.emailFieldGroup}>
        <Text style={styles.emailLabel}>{t('ai.emailRecipient')}</Text>
        <TextInput
          value={recipient}
          onChangeText={onChangeRecipient}
          placeholder="example@email.com"
          placeholderTextColor={colors.muted}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.emailInput}
        />
      </View>
      <View style={styles.emailFieldGroup}>
        <Text style={styles.emailLabel}>{t('ai.emailSubject')}</Text>
        <TextInput
          value={subject}
          onChangeText={onChangeSubject}
          placeholder={`Vinago+ itinerary: ${itinerary.city}`}
          placeholderTextColor={colors.muted}
          style={styles.emailInput}
        />
      </View>
      <View style={styles.emailFieldGroup}>
        <Text style={styles.emailLabel}>{t('ai.emailBody')}</Text>
        <TextInput
          value={body}
          onChangeText={onChangeBody}
          placeholder={buildItineraryPreview(itinerary, 'vi')}
          placeholderTextColor={colors.muted}
          style={[styles.emailInput, styles.emailBodyInput]}
          multiline
          textAlignVertical="top"
        />
      </View>
      <PrimaryButton label={t('ai.emailSend')} onPress={onSend} icon={Send} />
    </ScrollView>
  );
}

function ItineraryPdfScreen({
  itinerary,
  onShare,
  onExport,
  onBack,
  t,
}: {
  itinerary: ItineraryConfirmation;
  onShare: () => void;
  onExport: () => void;
  onBack: () => void;
  t: (key: TranslationKey) => string;
}) {
  return (
    <ScrollView contentContainerStyle={styles.itineraryPdf} showsVerticalScrollIndicator={false}>
      <View style={styles.itineraryPdfHeader}>
        <Text style={styles.itineraryPdfTitle}>
          LỊCH TRÌNH {itinerary.days}N {itinerary.city.toUpperCase()}
        </Text>
        <Text style={styles.itineraryPdfSubtitle}>Vinago+ - Your Vietnam Adventure</Text>
      </View>
      <View style={styles.itineraryPdfBody}>
        <Text style={styles.itineraryPdfBodyText}>
          {buildItineraryPreview(itinerary, 'vi')}
        </Text>
      </View>
      <View style={styles.itineraryPdfActions}>
        <Pressable style={styles.itineraryPdfShare} onPress={onShare}>
          <Share2 color={colors.primary} size={18} />
          <Text style={styles.itineraryPdfShareText}>{t('ai.pdfShare')}</Text>
        </Pressable>
        <PrimaryButton label={t('ai.pdfExport')} onPress={onExport} icon={Download} />
      </View>
    </ScrollView>
  );
}

/* ============================================================
 *  Main App
 * ============================================================ */

export default function App() {
  return (
    <SafeAreaProvider>
      <TravelApp />
    </SafeAreaProvider>
  );
}

function TravelApp() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const appLocation = useAppLocation();
  const isWide = width >= 900;
  const mobileBottomInset = isWide ? 0 : Math.max(insets.bottom, 0);
  const bottomNavHeight = 64 + mobileBottomInset;
  const emailStatusBottom = isWide ? 16 : bottomNavHeight + 12;
  const [isBooting, setIsBooting] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [draftProfile, setDraftProfile] = useState<UserProfile>(defaultProfile);
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [pendingLiveTeamCode, setPendingLiveTeamCode] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState<City | 'All'>('All');
  const [placesCatalog, setPlacesCatalog] = useState<Place[]>(places);
  const [selectedPlaceId, setSelectedPlaceId] = useState(places[0].id);
  const [selectedFoodId, setSelectedFoodId] = useState(foods[0].id);
  const [favorites, setFavorites] = useState<SavedItem[]>([]);
  const [authSession, setAuthSession] = useState<AuthSessionState | null>(null);
  const [guestSession, setGuestSession] = useState<GuestSession | null>(() => getStoredGuestSession());
  const [activityHistory, setActivityHistory] = useState<ActivityHistoryEntry[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [isGoogleAuthPending, setIsGoogleAuthPending] = useState(false);
  const [qrSession, setQrSession] = useState<QrLoginSession | null>(null);
  const [qrImageUri, setQrImageUri] = useState<string | null>(null);
  const [qrBusy, setQrBusy] = useState(false);
  const [qrStatusText, setQrStatusText] = useState('');
  const [qrMobileStatus, setQrMobileStatus] = useState<string | null>(null);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scannerBusy, setScannerBusy] = useState(false);
  const [lastItinerary, setLastItinerary] = useState<ItineraryConfirmation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isAiReplying, setIsAiReplying] = useState(false);
  const [tripDays, setTripDays] = useState(2);
  const [tripStyle, setTripStyle] = useState<TripStyle>('Budget');
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [emailRecipient, setEmailRecipient] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [pendingPlaceId, setPendingPlaceId] = useState<string | null>(null);
  const [placeReturnTab, setPlaceReturnTab] = useState<TabId>('explore');
  const [pendingFoodId, setPendingFoodId] = useState<string | null>(null);
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);
  const [isPlacesDatabaseReady, setIsPlacesDatabaseReady] = useState(false);
  const [livePreviewRequest, setLivePreviewRequest] = useState<LivePreviewRequest | null>(null);
  const [livePreviewRole, setLivePreviewRole] = useState<LivePreviewActorRole>('traveler');
  const [livePreviewError, setLivePreviewError] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<WalletBalance | null>(null);
  const [isWalletTopUpSubmitting, setIsWalletTopUpSubmitting] = useState(false);
  const [isLivePreviewSubmitting, setIsLivePreviewSubmitting] = useState(false);
  const [localHelperProfile, setLocalHelperProfile] = useState<LocalHelperProfile | null>(null);
  const [localHelperJobs, setLocalHelperJobs] = useState<LocalHelperJob[]>([]);
  const [selectedLocalHelperJob, setSelectedLocalHelperJob] = useState<LocalHelperJob | null>(null);
  const [localHelperEarnings, setLocalHelperEarnings] = useState<LocalHelperEarning[]>([]);
  const [locationPromptVisible, setLocationPromptVisible] = useState(false);
  const [locationPromptChecked, setLocationPromptChecked] = useState(false);
  const [memberAlert, setMemberAlert] = useState<MemberNotification | null>(null);
  const [pendingChatFriendId, setPendingChatFriendId] = useState<string | null>(null);
  const [memberChatOpen, setMemberChatOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<WpArticle | null>(null);
  const [wpConfigModalVisible, setWpConfigModalVisible] = useState(false);
  const didTrackAppOpenRef = useRef(false);
  const didTrackOnboardingRef = useRef(false);
  const previousScreenRef = useRef<TabId | null>(null);
  const guestUserIdRef = useRef(`guest_${Math.random().toString(36).slice(2, 10)}`);
  const scannedQrRef = useRef<string | null>(null);
  const seenMemberCallRef = useRef<string | null>(null);
  const seenMemberMessageRef = useRef<string | null>(null);
  const seenLiveTeamInviteRef = useRef<string | null>(null);
  const hasRemoteMemberPushRef = useRef(false);

  const currentProfile = profile ?? draftProfile;
  const locale = getLocale(currentProfile.language);
  const t = (key: TranslationKey): string => translate(locale, key);
  const currentUserId = authSession?.user.id ?? guestSession?.user.id ?? guestUserIdRef.current;
  const currentUserName = authSession?.user.name ?? guestSession?.user.name ?? 'Guest traveler';
  const currentUserEmail = authSession?.user.email ?? '';

  useEffect(() => {
    if (authSession) return;
    let active = true;
    void getOrCreateGuestSession().then((session) => { if (active) setGuestSession(session); }).catch(() => {});
    return () => { active = false; };
  }, [authSession]);

  useEffect(() => {
    const openLiveTeamLink = (url: string | null) => {
      if (!url || !/live-team\//i.test(url)) return;
      const code = normalizeLiveTeamCode(url);
      if (code.length !== 10) return;
      setPendingLiveTeamCode(code);
      setActiveTab('live_team');
    };
    void Linking.getInitialURL().then(openLiveTeamLink);
    const subscription = Linking.addEventListener('url', ({ url }) => openLiveTeamLink(url));
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if ((authSession || guestSession) && pendingLiveTeamCode) setActiveTab('live_team');
  }, [authSession, guestSession, pendingLiveTeamCode]);

  const openMemberNotification = useCallback((notification: MemberNotification) => {
    if (notification.kind === 'live-team') {
      setMemberAlert(null);
      setActiveTab('live_team');
      return;
    }
    setPendingChatFriendId(notification.kind === 'chat' ? notification.friendId ?? null : null);
    setMemberAlert(null);
    setActiveTab('member_video_call');
  }, []);
  const handleMemberChatVisibilityChange = useCallback((visible: boolean) => setMemberChatOpen(visible), []);

  useEffect(() => {
    if ((!authSession && !guestSession) || !settings.notificationsEnabled) return;
    let active = true;
    const startedAt = Date.now();
    void initializeMemberNotifications().then(async (pushToken) => {
      if (!pushToken) return;
      await registerMemberPushToken(pushToken);
      hasRemoteMemberPushRef.current = true;
    }).catch(() => {});
    const stopListening = listenForMemberNotificationPress(openMemberNotification);
    const pollMemberAlerts = async () => {
      try {
        const overview = await getMemberSocialOverview();
        if (!active) return;
        const incomingCall = overview.incomingCall;
        if (incomingCall && incomingCall.roomCode !== seenMemberCallRef.current) {
          seenMemberCallRef.current = incomingCall.roomCode;
          const callAlert: MemberNotification = {
            kind: 'call',
            title: incomingCall.mode === 'audio' ? 'Cuộc gọi thoại đến' : 'Cuộc gọi video đến',
            body: `${incomingCall.caller.name} đang gọi cho bạn`,
            friendId: incomingCall.caller.id,
            roomCode: incomingCall.roomCode,
          };
          setMemberAlert(callAlert);
          if (!hasRemoteMemberPushRef.current) void showMemberNotification(callAlert);
        }
        const latestMessage = overview.latestIncomingMessage;
        if (latestMessage && latestMessage.id !== seenMemberMessageRef.current) {
          seenMemberMessageRef.current = latestMessage.id;
          if (latestMessage.createdAt >= startedAt - 2_000) {
            const chatAlert: MemberNotification = {
              kind: 'chat',
              title: `Tin nhắn từ ${latestMessage.sender.name}`,
              body: latestMessage.text,
              friendId: latestMessage.sender.id,
            };
            setMemberAlert(chatAlert);
            if (!hasRemoteMemberPushRef.current) void showMemberNotification(chatAlert);
          }
        }
        const liveTeamInvite = overview.incomingLiveTeamInvite;
        if (liveTeamInvite && liveTeamInvite.roomCode !== seenLiveTeamInviteRef.current) {
          seenLiveTeamInviteRef.current = liveTeamInvite.roomCode;
          const liveTeamAlert: MemberNotification = { kind: 'live-team', title: `Lời mời vào ${liveTeamInvite.teamName}`, body: `${liveTeamInvite.inviter.name} mời bạn tham gia Live Team`, friendId: liveTeamInvite.inviter.id, roomCode: liveTeamInvite.roomCode };
          setMemberAlert(liveTeamAlert);
          if (!hasRemoteMemberPushRef.current) void showMemberNotification(liveTeamAlert);
        }
      } catch {
        // The next polling interval retries automatically.
      }
    };
    void pollMemberAlerts();
    const timer = setInterval(() => { void pollMemberAlerts(); }, 10_000);
    return () => { active = false; clearInterval(timer); stopListening(); };
  }, [authSession?.user.id, guestSession?.user.id, openMemberNotification, settings.notificationsEnabled]);

  useEffect(() => {
    if (!memberAlert) return;
    const timer = setTimeout(() => setMemberAlert(null), memberAlert.kind === 'call' ? 12_000 : 6_000);
    return () => clearTimeout(timer);
  }, [memberAlert]);

  const recordActivity = (type: ActivityHistoryType, title: string, detail?: string) => {
    setActivityHistory((current) =>
      [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          type,
          title,
          detail,
          timestamp: new Date().toISOString(),
        },
        ...current,
      ].slice(0, ACTIVITY_HISTORY_LIMIT),
    );
  };

  const recordSearch = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setRecentSearches((current) => {
      const filtered = current.filter((s) => s.query.toLowerCase() !== trimmed.toLowerCase());
      const next: RecentSearch[] = [
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          query: trimmed,
          timestamp: new Date().toISOString(),
        },
        ...filtered,
      ].slice(0, RECENT_SEARCHES_LIMIT);
      void AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
      return next;
    });
  };

  async function refreshQrLoginSession() {
    if (Platform.OS !== 'web' || authSession) return;

    setQrBusy(true);
    try {
      const nextSession = await createQrLoginSession();
      const imageUri = await qrLoginDataUrl(nextSession.qrData);
      setQrSession(nextSession);
      setQrImageUri(imageUri);
      setQrStatusText(t('account.qrWaiting'));
    } catch (error) {
      setQrStatusText(error instanceof Error ? error.message : t('account.qrCreateFailed'));
      setQrSession(null);
      setQrImageUri(null);
    } finally {
      setQrBusy(false);
    }
  }

  async function getFreshAccountIdToken(interactive = false) {
    if (Platform.OS === 'web') return null;
    return getAccountIdToken(interactive);
  }

  async function saveApprovedQrWebSession(
    result: Extract<QrLoginPollResult, { status: 'approved' }>,
  ) {
    await AsyncStorage.setItem(QR_WEB_SESSION_KEY, result.sessionToken);
    const now = new Date().toISOString();
    setAuthSession(authSessionFromQrUser(result.user, now));
    setQrSession(null);
    setQrImageUri(null);
    setQrStatusText('');
    setEmailStatus(null);
    recordActivity('auth', 'Signed in with mobile QR', result.user.email);
  }

  useEffect(() => {
    let isMounted = true;

    const loadPlacesCatalog = async () => {
      try {
        const records = await loadTravelPlacesFromDatabase();
        if (isMounted && records.length > 0) {
          setPlacesCatalog(createPlaceModels(records));
        }
      } catch {
        if (isMounted) {
          setPlacesCatalog(places);
        }
      } finally {
        if (isMounted) {
          setIsPlacesDatabaseReady(true);
        }
      }
    };

    void loadPlacesCatalog();
    return () => {
      isMounted = false;
    };
  }, []);

  /* boot */
  useEffect(() => {
    const loadLocalState = async () => {
      try {
        const [
          storedProfile,
          storedFavorites,
          storedActivity,
          storedRecent,
          storedSettings,
          storedQrWebSession,
        ] =
          await Promise.all([
            AsyncStorage.getItem(PROFILE_KEY),
            AsyncStorage.getItem(FAVORITES_KEY),
            AsyncStorage.getItem(ACTIVITY_HISTORY_KEY),
            AsyncStorage.getItem(RECENT_SEARCHES_KEY),
            AsyncStorage.getItem(SETTINGS_KEY),
            AsyncStorage.getItem(QR_WEB_SESSION_KEY),
          ]);

        if (storedProfile) {
          const parsed = normalizeProfile(JSON.parse(storedProfile) as UserProfile);
          setProfile(parsed);
          setDraftProfile(parsed);
          setSelectedCity(parsed.currentCity);
        }
        if (storedFavorites) setFavorites(JSON.parse(storedFavorites) as SavedItem[]);
        if (Platform.OS !== 'web') void AsyncStorage.removeItem(LEGACY_AUTH_SESSION_KEY);
        if (storedActivity) setActivityHistory(JSON.parse(storedActivity) as ActivityHistoryEntry[]);
        if (storedRecent) setRecentSearches(JSON.parse(storedRecent) as RecentSearch[]);
        if (storedSettings) setSettings({ ...defaultSettings, ...(JSON.parse(storedSettings) as SettingsState) });
        if (Platform.OS === 'web' && storedQrWebSession) {
          try {
            const verified = await verifyQrWebSession(storedQrWebSession);
            setAuthSession(authSessionFromQrUser(verified.user));
          } catch {
            setAuthSession(null);
            await AsyncStorage.multiRemove([QR_WEB_SESSION_KEY, LEGACY_AUTH_SESSION_KEY]);
          }
        }
      } catch {
        setProfile(null);
      } finally {
        setIsBooting(false);
      }
    };
    void loadLocalState();
  }, []);

  useEffect(() => { void AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites)); }, [favorites]);
  useEffect(() => {
    if (Platform.OS === 'web') return undefined;

    return observeAccountAuth((accountUser) => {
      if (!accountUser) {
        setAuthSession(null);
        return;
      }

      const now = new Date().toISOString();
      setAuthSession((current) => {
        const signedInAt =
          current?.provider === 'google' && current.user.id === accountUser.id
            ? current.signedInAt
            : now;
        return authSessionFromAccountUser(accountUser, signedInAt, now);
      });
      setQrMobileStatus(null);
      setEmailStatus(null);
    });
  }, []);
  useEffect(() => {
    let isMounted = true;
    const loadHelperProfile = async () => {
      const helperProfile = await localHelperService.getProfile(currentUserId);
      if (isMounted) setLocalHelperProfile(helperProfile);
    };
    void loadHelperProfile();
    return () => {
      isMounted = false;
    };
  }, [currentUserId]);
  useEffect(() => {
    if (isBooting) return;
    void AsyncStorage.removeItem(LEGACY_AUTH_SESSION_KEY);
  }, [isBooting]);
  useEffect(() => {
    if (isBooting) return;
    void AsyncStorage.setItem(ACTIVITY_HISTORY_KEY, JSON.stringify(activityHistory));
  }, [activityHistory, isBooting]);
  useEffect(() => { void AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }, [settings]);

  useEffect(() => {
    if (isBooting || !profile || locationPromptChecked || appLocation.permission === 'checking') return;
    setLocationPromptChecked(true);
    if (appLocation.permission === 'granted') return;
    void AsyncStorage.getItem(LOCATION_PROMPT_DISMISSED_KEY).then((dismissed) => {
      if (dismissed !== '1') setLocationPromptVisible(true);
    });
  }, [appLocation.permission, isBooting, locationPromptChecked, profile]);

  useEffect(() => {
    if (appLocation.permission === 'granted') setLocationPromptVisible(false);
  }, [appLocation.permission]);

  useEffect(() => { initializeGoogleAnalytics(); }, []);

  useEffect(() => {
    if (isBooting || didTrackAppOpenRef.current) return;
    didTrackAppOpenRef.current = true;
    void trackEvent('app_opened', { ga_measurement_configured: Boolean(analyticsConfig.measurementId?.startsWith('G-')) }, currentProfile);
  }, [isBooting, currentProfile]);

  useEffect(() => {
    if (isBooting || profile || didTrackOnboardingRef.current) return;
    didTrackOnboardingRef.current = true;
    void trackEvent('onboarding_started', { screen_name: 'onboarding' }, draftProfile);
  }, [draftProfile, isBooting, profile]);

  useEffect(() => {
    if (isBooting || !profile || previousScreenRef.current === activeTab) return;
    previousScreenRef.current = activeTab;
    void trackEvent('screen_view', { screen_name: activeTab }, profile);
  }, [activeTab, isBooting, profile]);

  useEffect(() => {
    setMessages((current) =>
      current.length === 0
        ? [{ id: 'welcome', from: 'assistant', text: getWelcomeMessage(locale) }]
        : current.map((m) =>
            m.id === 'welcome' ? { ...m, text: getWelcomeMessage(locale) } : m,
          ),
    );
  }, [locale]);

  useEffect(() => {
    if (Platform.OS !== 'web' || isBooting || authSession) return undefined;
    void refreshQrLoginSession();
    return undefined;
  }, [authSession, isBooting]);

  useEffect(() => {
    if (Platform.OS !== 'web' || !qrSession || authSession) return undefined;

    let cancelled = false;
    const poll = async () => {
      try {
        const result = await pollQrLoginSession(qrSession.sessionId, qrSession.pollToken);
        if (cancelled) return;

        if (result.status === 'approved') {
          await saveApprovedQrWebSession(result);
          return;
        }

        if (result.status === 'expired') {
          setQrStatusText(t('account.qrExpired'));
          setQrSession(null);
          setQrImageUri(null);
          await refreshQrLoginSession();
          return;
        }

        setQrStatusText(t('account.qrWaiting'));
      } catch (error) {
        if (!cancelled) {
          setQrStatusText(error instanceof Error ? error.message : t('account.qrCheckFailed'));
        }
      }
    };

    const timer = setInterval(() => {
      void poll();
    }, 2000);
    void poll();

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [authSession, qrSession]);

  /* derived data */
  const selectedPlace = placesCatalog.find((p) => p.id === selectedPlaceId) ?? placesCatalog[0] ?? places[0];
  const selectedFood = foods.find((f) => f.id === selectedFoodId) ?? foods[0];
  const searchNeedle = normalizeSearchText(searchTerm.trim());
  const selectedProfileCities = useMemo(
    () => getSelectedCities(currentProfile),
    [currentProfile],
  );
  const selectedProfileCitySet = useMemo(
    () => new Set(selectedProfileCities),
    [selectedProfileCities],
  );
  const availablePlaceCities = useMemo(
    () =>
      cities.filter(
        (city) => city !== 'Other' && placesCatalog.some((place) => place.city === city),
      ),
    [placesCatalog],
  );
  const filteredPlaces = useMemo(() => {
    return placesCatalog.filter((place) => {
      const matchesCity =
        selectedCity === 'All'
          ? true
          : place.city === selectedCity;
      const matchesSearch =
        searchNeedle.length === 0 ||
        normalizeSearchText(`${place.name} ${place.city} ${place.category} ${place.tags.join(' ')}`)
          .includes(searchNeedle);
      return matchesCity && matchesSearch;
    });
  }, [placesCatalog, selectedCity, searchNeedle]);

  const favoriteRecords = useMemo(() => {
    return favorites
      .map((favorite) => {
        if (favorite.type === 'place') {
          const item = placesCatalog.find((p) => p.id === favorite.id);
          return item ? { key: `${favorite.type}-${favorite.id}`, type: favorite.type, id: favorite.id, title: item.name, subtitle: item.city, image: item.image } : null;
        }
        if (favorite.type === 'food') {
          const item = foods.find((f) => f.id === favorite.id);
          return item ? { key: `${favorite.type}-${favorite.id}`, type: favorite.type, id: favorite.id, title: item.name, subtitle: item.englishName, image: item.image } : null;
        }
        if (favorite.type === 'phrase') {
          const item = phrases.find((p) => p.id === favorite.id);
          return item ? { key: `${favorite.type}-${favorite.id}`, type: favorite.type, id: favorite.id, title: item.english, subtitle: item.vietnamese } : null;
        }
        const item = cultureTopics.find((c) => c.id === favorite.id);
        return item ? { key: `${favorite.type}-${favorite.id}`, type: favorite.type, id: favorite.id, title: item.title, subtitle: item.category } : null;
      })
      .filter(Boolean) as {
        key: string;
        type: SavedItemType;
        id: string;
        title: string;
        subtitle: string;
        image?: ImageSourcePropType;
      }[];
  }, [favorites, placesCatalog]);

  const popularPlaces = useMemo(() => {
    const preferredPlaces = popularPlaceIds
      .map((id) => placesCatalog.find((place) => place.id === id))
      .filter((place): place is Place => Boolean(place));
    const remainingPlaces = placesCatalog.filter(
      (place) => !preferredPlaces.some((preferredPlace) => preferredPlace.id === place.id),
    );
    return [...preferredPlaces, ...remainingPlaces].slice(0, 8);
  }, [placesCatalog]);
  const nearbyPlaces = useMemo(() => {
    if (appLocation.coordinates) {
      return [...placesCatalog]
        .sort((first, second) => (
          getDistanceKm(appLocation.coordinates!, { lat: first.lat, lng: first.lng })
          - getDistanceKm(appLocation.coordinates!, { lat: second.lat, lng: second.lng })
        ))
        .slice(0, 5);
    }
    const selectedPlaces = placesCatalog.filter((place) => selectedProfileCitySet.has(place.city));
    return (selectedPlaces.length > 0 ? selectedPlaces : popularPlaces).slice(0, 4);
  }, [appLocation.coordinates, placesCatalog, popularPlaces, selectedProfileCitySet]);
  const popularFoods = useMemo(
    () => popularFoodIds.map((id) => foods.find((f) => f.id === id)).filter(Boolean) as Food[],
    [],
  );

  /* handlers */
  const saveProfile = () => {
    const profileToSave = normalizeProfile(draftProfile);
    void AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profileToSave));
    setProfile(profileToSave);
    setDraftProfile(profileToSave);
    setSelectedCity(profileToSave.currentCity);
    setActiveTab('home');
    recordActivity('profile', 'Completed travel profile', `${getSelectedCitiesLabel(profileToSave)} · ${profileToSave.tripDays} days`);
    void trackEvent('onboarding_completed', { screen_name: 'onboarding', selected_cities: getSelectedCitiesLabel(profileToSave) }, profileToSave);
  };

  const resetOnboarding = () => {
    void AsyncStorage.removeItem(PROFILE_KEY);
    setProfile(null);
    setDraftProfile({ ...defaultProfile, language: settings.themeMode === 'dark' ? defaultProfile.language : defaultProfile.language });
    didTrackOnboardingRef.current = false;
    previousScreenRef.current = null;
    recordActivity('profile', 'Opened profile settings', 'Language, purpose, city, and trip days');
    void trackEvent('profile_reset', { source: 'language_profile_button' }, currentProfile);
    setActiveTab('home');
  };

  const isFavorite = (type: SavedItemType, id: string) =>
    favorites.some((favorite) => favorite.type === type && favorite.id === id);

  const toggleFavorite = (type: SavedItemType, id: string) => {
    const wasFavorite = isFavorite(type, id);
    setFavorites((current) => {
      if (current.some((favorite) => favorite.type === type && favorite.id === id)) {
        return current.filter((favorite) => favorite.type !== type || favorite.id !== id);
      }
      return [...current, { type, id }];
    });
    recordActivity('favorite', wasFavorite ? 'Removed favorite' : 'Saved favorite', `${type}: ${id}`);
    void trackEvent(wasFavorite ? 'favorite_removed' : 'favorite_added', { item_type: type, item_id: id }, currentProfile);
  };

  const signInWithGoogle = async () => {
    if (isGoogleAuthPending) return;
    if (Platform.OS === 'web') return;

    setIsGoogleAuthPending(true);
    recordActivity('auth', 'Started Google sign-in', Platform.OS);
    void trackEvent('google_sign_in_started', {
      source_screen: activeTab,
      redirect_uri: 'firebase_google_sign_in',
    }, currentProfile);

    try {
      const accountUser = await signInWithGoogleAccount();
      if (!accountUser) {
        setIsGoogleAuthPending(false);
        return;
      }

      const now = new Date().toISOString();
      setAuthSession(authSessionFromAccountUser(accountUser, now));
      setQrMobileStatus(null);
      setEmailStatus(null);
      void AsyncStorage.removeItem(QR_WEB_SESSION_KEY);
      recordActivity('auth', 'Signed in with Google', accountUser.email);
      void trackEvent('google_sign_in_completed', {
        source_screen: activeTab,
        email_domain: getEmailDomain(accountUser.email),
        verified_email: accountUser.verifiedEmail,
      }, currentProfile);
    } catch (error) {
      const message = accountAuthErrorMessage(error);
      setQrMobileStatus(message);
      recordActivity('auth', 'Google sign-in failed', message);
      void trackEvent('google_sign_in_failed', { error_code: 'firebase_google_sign_in_failed', source_screen: activeTab }, currentProfile);
    } finally {
      setIsGoogleAuthPending(false);
    }
  };

  const signOutGoogle = () => {
    const email = authSession?.user.email;
    setAuthSession(null);
    setQrSession(null);
    setQrImageUri(null);
    setQrStatusText('');
    setQrMobileStatus(null);
    setEmailStatus(null);
    void AsyncStorage.removeItem(QR_WEB_SESSION_KEY);
    void signOutAccount().catch(() => undefined);
    recordActivity('auth', 'Signed out of Google', email);
    void trackEvent('google_signed_out', { source_screen: activeTab, email_domain: email ? getEmailDomain(email) : undefined }, currentProfile);
  };

  const openQrScanner = async () => {
    if (Platform.OS === 'web') return;

    let token: string | null = null;
    try {
      token = await getFreshAccountIdToken(true);
    } catch (error) {
      setQrMobileStatus(accountAuthErrorMessage(error));
      return;
    }

    if (!authSession) {
      setQrMobileStatus(t('account.qrMobileNeedLogin'));
      return;
    }
    if (!token) {
      setQrMobileStatus(t('account.qrMobileNeedToken'));
      return;
    }

    const granted = await requestQrScannerPermission();
    if (!granted) {
      setQrMobileStatus(t('account.qrCameraDenied'));
      return;
    }

    scannedQrRef.current = null;
    setQrMobileStatus(t('account.qrMobileReady'));
    setScannerVisible(true);
  };

  const handleQrScanned = async (data: string) => {
    if (scannerBusy || scannedQrRef.current === data) return;
    scannedQrRef.current = data;
    setScannerBusy(true);

    try {
      const idToken = await getFreshAccountIdToken(true);
      if (!idToken) {
        throw new Error(t('account.qrMobileNeedToken'));
      }
      const payload = parseQrLoginPayload(data);
      await approveQrLoginSession(payload, idToken);
      setScannerVisible(false);
      setQrMobileStatus(t('account.qrMobileSignedIn'));
      recordActivity('auth', 'Approved web QR login', authSession?.user.email);
    } catch (error) {
      scannedQrRef.current = null;
      setScannerVisible(false);
      setQrMobileStatus(error instanceof Error ? error.message : t('account.qrCheckFailed'));
    } finally {
      setScannerBusy(false);
    }
  };

  const clearActivityHistory = () => {
    setActivityHistory([]);
    void AsyncStorage.removeItem(ACTIVITY_HISTORY_KEY);
    void trackEvent('activity_history_cleared', { source_screen: activeTab }, currentProfile);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    void AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
    void trackEvent('recent_search_cleared', { source_screen: activeTab }, currentProfile);
  };

  const askAi = async (question: string): Promise<string | null> => {
    const trimmed = question.trim();
    if (!trimmed) return null;
    const requestId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setMessages((current) => [
      ...current,
      { id: `${requestId}-user`, from: 'user', text: trimmed },
    ]);
    setChatInput('');
    setIsAiReplying(true);
    recordActivity('ai', 'Asked AI', trimmed);
    void trackEvent('ai_question_submitted', { question_length: trimmed.length, response_locale: locale, source_screen: activeTab, trip_style: tripStyle }, currentProfile);
    try {
      const result = await askTravelAi({
        question: trimmed,
        locale,
        language: currentProfile.language,
        city: appLocation.cityLabel || getSelectedCitiesLabel(currentProfile),
        tripDays,
        tripStyle,
      });
      setMessages((current) => [
        ...current,
        { id: `${requestId}-assistant`, from: 'assistant', text: result.answer },
      ]);
      return result.answer;
    } catch {
      const fallback = locale === 'vi' || locale === 'en'
        ? buildAiAnswer(trimmed, currentProfile, tripDays, tripStyle, locale, placesCatalog)
        : aiLanguageCopy[locale].unavailable;
      setMessages((current) => [
        ...current,
        { id: `${requestId}-assistant`, from: 'assistant', text: fallback },
      ]);
      return fallback;
    } finally {
      setIsAiReplying(false);
    }
  };

  const submitSearch = (query: string) => {
    const trimmed = query.trim();
    recordSearch(trimmed);
    recordActivity('search', 'Searched app content', trimmed || 'Empty query');
    void trackEvent('search_submitted', { query_length: trimmed.length, source_screen: activeTab, query_language: locale }, currentProfile);
    if (trimmed.length > 0) {
      void askAi(trimmed);
      setActiveTab('ai');
    }
  };

  const changeTab = (tab: TabId) => {
    if (tab === 'nearby' && !appLocation.coordinates) setLocationPromptVisible(true);
    setActiveTab(tab);
    recordActivity('navigation', `Opened ${tab}`, `From ${activeTab}`);
    void trackEvent('tab_opened', { tab_id: tab, source_screen: activeTab }, currentProfile);
  };

  const requestAppLocation = async () => {
    const coordinates = await appLocation.requestLocation();
    if (coordinates) {
      setLocationPromptVisible(false);
      void AsyncStorage.removeItem(LOCATION_PROMPT_DISMISSED_KEY);
      recordActivity('settings', 'Enabled current location', appLocation.cityLabel || `${coordinates.lat.toFixed(3)}, ${coordinates.lng.toFixed(3)}`);
    }
    return coordinates;
  };

  const openLocationPrompt = () => {
    if (appLocation.permission === 'granted') {
      void appLocation.refreshLocation();
      return;
    }
    setLocationPromptVisible(true);
  };

  const dismissLocationPrompt = () => {
    setLocationPromptVisible(false);
    void AsyncStorage.setItem(LOCATION_PROMPT_DISMISSED_KEY, '1');
  };

  const openTabFromHome = (tab: TabId) => {
    if (tab === 'explore') {
      setSelectedCity('All');
    }
    if (tab === 'nearby' && !appLocation.coordinates) {
      setLocationPromptVisible(true);
    }
    if (tab === 'map') {
      setPendingPlaceId(null);
      if (!appLocation.coordinates) setLocationPromptVisible(true);
    }
    changeTab(tab);
  };

  const changeExploreCity = (city: City | 'All') => {
    setSelectedCity(city);
    recordActivity('filter', 'Changed city filter', city);
    void trackEvent('filter_changed', { filter_name: 'city', filter_value: city, source_screen: 'explore' }, currentProfile);
  };

  const openPlace = (id: string, sourceScreen: TabId) => {
    setSelectedPlaceId(id);
    setPendingPlaceId(id);
    setPlaceReturnTab(sourceScreen);
    setActiveTab('place_detail');
    const item = placesCatalog.find((p) => p.id === id);
    recordActivity('content', 'Opened place', item ? `${item.name} · ${item.city}` : id);
    void trackEvent('place_opened', { place_id: id, place_name: item?.name, place_city: item?.city, place_category: item?.category, source_screen: sourceScreen }, currentProfile);
  };

  const openFood = (id: string) => {
    setSelectedFoodId(id);
    setPendingFoodId(id);
    setActiveTab('food_detail');
    const item = foods.find((f) => f.id === id);
    recordActivity('content', 'Opened food guide', item ? `${item.name} · ${item.englishName}` : id);
    void trackEvent('food_opened', { food_id: id, food_name: item?.name, food_region: item?.region, source_screen: 'food' }, currentProfile);
  };

  const openMap = () => {
    setActiveTab('map');
    recordActivity('navigation', 'Opened map view', selectedPlace?.name);
    void trackEvent('screen_view', { screen_name: 'map' }, currentProfile);
  };

  const getTravelerActor = (): LivePreviewActor => ({
    id: currentUserId,
    name: currentUserName,
    role: 'traveler',
  });

  const getHelperActor = (): LivePreviewActor => ({
    id: currentUserId,
    name: localHelperProfile?.fullName ?? currentUserName,
    role: 'helper',
  });

  const openLivePreviewRequest = () => {
    setLivePreviewError(null);
    setLivePreviewRole('traveler');
    setActiveTab('live_preview_request');
    recordActivity('navigation', 'Opened live preview request', selectedPlace.name);
  };

  const refreshWalletBalance = async () => {
    try {
      const balance = await walletService.getBalance(currentUserId);
      setWalletBalance(balance);
    } catch (error) {
      setLivePreviewError(error instanceof Error ? error.message : 'Could not refresh wallet balance');
    }
  };

  const topUpWallet = async (amountCents: number) => {
    setIsWalletTopUpSubmitting(true);
    setLivePreviewError(null);
    try {
      const balance = await walletService.topUp(currentUserId, amountCents);
      setWalletBalance(balance);
      recordActivity('content', 'Topped up wallet', `$${(amountCents / 100).toFixed(2)}`);
    } catch (error) {
      setLivePreviewError(error instanceof Error ? error.message : 'Could not top up wallet');
    } finally {
      setIsWalletTopUpSubmitting(false);
    }
  };

  const createLivePreviewRequest = async (input: { requestedLanguage: string; note: string }) => {
    setIsLivePreviewSubmitting(true);
    setLivePreviewError(null);
    const traveler = getTravelerActor();
    try {
      const purchase = await livePreviewPaymentProvider.purchaseLivePreviewSession();
      const request = await livePreviewService.createGooglePlayPaidRequest(
        {
          placeId: selectedPlace.id,
          placeName: selectedPlace.name,
          city: selectedPlace.city,
          lat: selectedPlace.lat,
          lng: selectedPlace.lng,
          travelerId: traveler.id,
          travelerName: traveler.name,
          requestedLanguage: input.requestedLanguage,
          note: input.note,
        },
        traveler,
        purchase,
      );
      setLivePreviewRequest(request);
      setLivePreviewRole('traveler');
      setActiveTab('live_preview_waiting');
      await refreshWalletBalance();
      recordActivity('content', 'Requested live preview', `${request.placeName} · escrowed`);
    } catch (error) {
      setLivePreviewError(error instanceof Error ? error.message : 'Could not create live preview request');
    } finally {
      setIsLivePreviewSubmitting(false);
    }
  };

  const refreshLivePreviewRequest = async () => {
    if (!livePreviewRequest) return;
    setLivePreviewError(null);
    try {
      const request = await livePreviewService.getRequest(livePreviewRequest.id);
      if (request) setLivePreviewRequest(request);
    } catch (error) {
      setLivePreviewError(error instanceof Error ? error.message : 'Could not refresh request');
    }
  };

  const joinLivePreviewCall = async () => {
    if (!livePreviewRequest) return;
    setLivePreviewError(null);
    try {
      const actor = livePreviewRole === 'helper' ? getHelperActor() : getTravelerActor();
      const request = await livePreviewService.startCall(livePreviewRequest.id, actor);
      setLivePreviewRequest(request);
      setActiveTab('live_call_room');
    } catch (error) {
      setLivePreviewError(error instanceof Error ? error.message : 'Could not join live call');
    }
  };

  const endLivePreviewCall = async (durationSeconds: number) => {
    if (!livePreviewRequest) return;
    setLivePreviewError(null);
    try {
      const actor = livePreviewRole === 'helper' ? getHelperActor() : getTravelerActor();
      const request = await livePreviewService.endCall(livePreviewRequest.id, actor, durationSeconds);
      setLivePreviewRequest(request);
      setActiveTab('live_preview_completion');
      void refreshLocalHelperEarnings();
    } catch (error) {
      setLivePreviewError(error instanceof Error ? error.message : 'Could not end live call');
    }
  };

  const confirmLivePreviewCompletion = async () => {
    if (!livePreviewRequest) return;
    setLivePreviewError(null);
    try {
      const request = await livePreviewService.confirmCompletion(livePreviewRequest.id, getTravelerActor());
      setLivePreviewRequest(request);
      recordActivity('content', 'Confirmed live preview completion', request.placeName);
      void refreshLocalHelperEarnings();
      await refreshWalletBalance();
    } catch (error) {
      setLivePreviewError(error instanceof Error ? error.message : 'Could not confirm completion');
    }
  };

  const disputeLivePreviewRequest = async () => {
    if (!livePreviewRequest) return;
    setLivePreviewError(null);
    try {
      const request = await livePreviewService.disputeRequest(livePreviewRequest.id, getTravelerActor());
      setLivePreviewRequest(request);
      recordActivity('content', 'Disputed live preview', request.placeName);
      void refreshLocalHelperEarnings();
    } catch (error) {
      setLivePreviewError(error instanceof Error ? error.message : 'Could not report problem');
    }
  };

  const cancelLivePreviewRequest = async () => {
    if (!livePreviewRequest) return;
    setLivePreviewError(null);
    try {
      const request = await livePreviewService.cancelRequest(livePreviewRequest.id, getTravelerActor());
      setLivePreviewRequest(request);
      recordActivity('content', 'Cancelled live preview', request.placeName);
      await refreshWalletBalance();
    } catch (error) {
      setLivePreviewError(error instanceof Error ? error.message : 'Could not cancel request');
    }
  };

  const saveLivePreviewRating = (rating: number, comment: string) => {
    if (!livePreviewRequest) return;
    recordActivity('content', 'Rated local helper', `${livePreviewRequest.placeName} · ${rating}/5 ${comment.trim()}`);
    setEmailStatus('Thanks for rating your local helper.');
  };

  const saveLocalHelperProfile = async (input: SaveLocalHelperProfileInput) => {
    setLivePreviewError(null);
    try {
      const helperProfile = await localHelperService.saveProfile({
        ...input,
        userId: currentUserId,
        email: input.email || currentUserEmail,
      });
      setLocalHelperProfile(helperProfile);
      recordActivity('profile', 'Saved local helper profile', helperProfile.city);
    } catch (error) {
      setLivePreviewError(error instanceof Error ? error.message : 'Could not save helper profile');
      throw error;
    }
  };

  const setLocalHelperOnline = async (input: {
    isOnline: boolean;
    currentLat: number | null;
    currentLng: number | null;
  }) => {
    setLivePreviewError(null);
    try {
      const helperProfile = await localHelperService.setOnline({
        userId: currentUserId,
        isOnline: input.isOnline,
        currentLat: input.currentLat,
        currentLng: input.currentLng,
      });
      setLocalHelperProfile(helperProfile);
      recordActivity('profile', input.isOnline ? 'Enabled local helper mode' : 'Disabled local helper mode', helperProfile.city);
      if (input.isOnline) {
        const jobs = await localHelperService.listNearbyJobs(helperProfile.userId);
        setLocalHelperJobs(jobs);
      }
    } catch (error) {
      setLivePreviewError(error instanceof Error ? error.message : 'Could not update helper status');
      throw error;
    }
  };

  const refreshLocalHelperJobs = async (profileOverride?: LocalHelperProfile | null) => {
    const helperProfile = profileOverride ?? localHelperProfile;
    setLivePreviewError(null);
    if (!helperProfile) {
      setLocalHelperJobs([]);
      return;
    }
    try {
      const jobs = await localHelperService.listNearbyJobs(helperProfile.userId);
      setLocalHelperJobs(jobs);
    } catch (error) {
      setLivePreviewError(error instanceof Error ? error.message : 'Could not load helper jobs');
    }
  };

  const openLocalHelperJobs = () => {
    setActiveTab('local_helper_jobs');
    void refreshLocalHelperJobs();
  };

  const acceptLocalHelperJob = async (job: LocalHelperJob) => {
    if (!localHelperProfile) {
      setLivePreviewError('Create a helper profile before accepting jobs');
      setActiveTab('local_helper_onboarding');
      return;
    }

    setLivePreviewError(null);
    try {
      const request = await localHelperService.acceptJob(job.request.id, localHelperProfile);
      const acceptedJob = { ...job, request };
      setSelectedLocalHelperJob(acceptedJob);
      setLivePreviewRequest(request);
      setLivePreviewRole('helper');
      setActiveTab('local_helper_job_detail');
      await refreshLocalHelperJobs(localHelperProfile);
      recordActivity('content', 'Accepted live preview job', request.placeName);
    } catch (error) {
      setLivePreviewError(error instanceof Error ? error.message : 'Could not accept job');
    }
  };

  const openLocalHelperJobDetail = (job: LocalHelperJob) => {
    setSelectedLocalHelperJob(job);
    setLivePreviewRequest(job.request);
    setLivePreviewRole('helper');
    setActiveTab('local_helper_job_detail');
  };

  const joinLocalHelperJobCall = async () => {
    const request = selectedLocalHelperJob?.request ?? livePreviewRequest;
    if (!request) return;
    setLivePreviewError(null);
    setLivePreviewRole('helper');
    try {
      const updatedRequest = await livePreviewService.startCall(request.id, getHelperActor());
      setLivePreviewRequest(updatedRequest);
      setSelectedLocalHelperJob((current) =>
        current && current.request.id === updatedRequest.id
          ? { ...current, request: updatedRequest }
          : current,
      );
      setActiveTab('live_call_room');
    } catch (error) {
      setLivePreviewError(error instanceof Error ? error.message : 'Could not join live call');
    }
  };

  const refreshLocalHelperEarnings = async () => {
    setLivePreviewError(null);
    if (!localHelperProfile) {
      setLocalHelperEarnings([]);
      return;
    }
    try {
      const earnings = await localHelperService.listEarnings(localHelperProfile.userId);
      setLocalHelperEarnings(earnings);
    } catch (error) {
      setLivePreviewError(error instanceof Error ? error.message : 'Could not load earnings');
    }
  };

  const openLocalHelperEarnings = () => {
    setActiveTab('local_helper_earnings');
    void refreshLocalHelperEarnings();
  };

  const buildItinerary = () => {
    const selectedCitiesLabel = getSelectedCitiesLabel(currentProfile);
    const prompt = `Create a ${tripDays} day ${tripStyle} itinerary for ${selectedCitiesLabel}.`;
    const itinerary = createItineraryConfirmation(prompt, currentProfile, tripDays, tripStyle, locale, placesCatalog);
    setLastItinerary(itinerary);
    setEmailRecipient(authSession?.user.email ?? '');
    setEmailSubject(`Lịch trình ${itinerary.days}N ${selectedCitiesLabel} - Vinago+`);
    setEmailBody(buildItineraryPreview(itinerary, locale));
    setMessages((current) => [
      ...current,
      { id: `${Date.now()}-user`, from: 'user', text: prompt },
      { id: `${Date.now()}-assistant`, from: 'assistant', text: itinerary.body },
    ]);
    setActiveTab('itinerary_preview');
    recordActivity('itinerary', 'Generated itinerary', `${tripDays} days · ${tripStyle} · ${selectedCitiesLabel}`);
    void trackEvent('itinerary_generated', { trip_days: tripDays, trip_style: tripStyle, current_city: currentProfile.currentCity, selected_cities: getSelectedCities(currentProfile).join(',') }, currentProfile);
  };

  const sendItineraryEmail = async () => {
    const itinerary = lastItinerary ?? createItineraryConfirmation(`Create a ${tripDays} day ${tripStyle} itinerary for ${getSelectedCitiesLabel(currentProfile)}.`, currentProfile, tripDays, tripStyle, locale, placesCatalog);
    setLastItinerary(itinerary);
    setEmailStatus(null);
    const recipient = emailRecipient.trim() || authSession?.user.email || '';
    if (!recipient) {
      setEmailStatus(t('ai.emailRequired'));
      return;
    }
    const subject = emailSubject.trim() || `Vinago+ itinerary confirmation: ${itinerary.title}`;
    const messageBody =
      emailBody.trim() || buildItineraryEmailBody(currentUserName, itinerary, currentProfile);
    recordActivity('email', 'Requested itinerary email', recipient);
    void trackEvent('itinerary_email_requested', { itinerary_days: itinerary.days, itinerary_style: itinerary.style, email_domain: getEmailDomain(recipient), delivery_mode: itineraryEmailEndpoint ? 'endpoint' : 'mail_composer' }, currentProfile);

    try {
      const endpointGoogleIdToken = itineraryEmailEndpoint
        ? await getFreshAccountIdToken(false)
        : null;
      if (itineraryEmailEndpoint && endpointGoogleIdToken) {
        const response = await fetch(itineraryEmailEndpoint, {
          method: 'POST',
          headers: { Authorization: `Bearer ${endpointGoogleIdToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: recipient,
            name: currentUserName,
            subject,
            body: messageBody,
            itinerary,
            profile: currentProfile,
          }),
        });
        if (!response.ok) throw new Error(`Email endpoint failed with ${response.status}`);
        setEmailStatus(t('ai.emailSent'));
        recordActivity('email', 'Sent itinerary confirmation', recipient);
        void trackEvent('itinerary_email_sent', { itinerary_days: itinerary.days, delivery_mode: 'endpoint', email_domain: getEmailDomain(recipient) }, currentProfile);
        return;
      }
      const isMailAvailable = await MailComposer.isAvailableAsync();
      if (!isMailAvailable) {
        setEmailStatus(t('ai.emailUnavailable'));
        recordActivity('email', 'Email composer unavailable', Platform.OS);
        return;
      }
      const mailResult = await MailComposer.composeAsync({
        recipients: [recipient],
        subject,
        body: messageBody,
      });
      setEmailStatus(t('ai.emailSent'));
      recordActivity('email', 'Opened itinerary email composer', mailResult.status);
      void trackEvent('itinerary_email_sent', { itinerary_days: itinerary.days, delivery_mode: 'mail_composer', composer_status: mailResult.status, email_domain: getEmailDomain(recipient) }, currentProfile);
    } catch {
      setEmailStatus(t('ai.emailFailed'));
      recordActivity('email', 'Itinerary email failed', recipient);
      void trackEvent('itinerary_email_failed', { itinerary_days: itinerary.days, email_domain: getEmailDomain(recipient) }, currentProfile);
    }
  };

  const updateSettings = (patch: Partial<SettingsState>) => {
    setSettings((current) => ({ ...current, ...patch }));
    recordActivity('settings', 'Changed settings', Object.keys(patch).join(','));
    void trackEvent('settings_changed', { keys: Object.keys(patch).join(',') }, currentProfile);
  };

  const selectLanguage = (language: Language) => {
    setDraftProfile((current) => ({ ...current, language }));
    void trackEvent('language_selected', { selected_language: language, selected_locale: getLocale(language), source_screen: profile ? 'profile_settings' : 'onboarding' }, { ...currentProfile, language });
    if (profile) {
      const next: UserProfile = { ...profile, language };
      setProfile(next);
      void AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(next));
    }
  };

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeScreen
            profile={currentProfile}
            locationLabel={appLocation.cityLabel}
            locationPermission={appLocation.permission}
            locationLoading={appLocation.isLocating}
            recentSearches={recentSearches}
            popularPlaces={popularPlaces}
            nearbyPlaces={nearbyPlaces}
            popularFoods={popularFoods}
            placesCount={placesCatalog.length}
            citiesCount={availablePlaceCities.length}
            onOpenSearch={() => setActiveTab('search')}
            onOpenPlace={(id) => openPlace(id, 'home')}
            onOpenFood={(id) => openFood(id)}
            onOpenFilter={() => setActiveTab('filter')}
            onOpenTab={openTabFromHome}
            isFavorite={isFavorite}
            onToggleFavorite={toggleFavorite}
            onRequestLocation={openLocationPrompt}
            t={t}
            wpNewsUrl={settings.wpNewsUrl || DEFAULT_WP_URL}
            onOpenArticle={(art) => setSelectedArticle(art)}
            onOpenWpConfig={() => setWpConfigModalVisible(true)}
          />
        );
      case 'trips':
        return (
          <TripsScreen
            profile={currentProfile}
            itinerary={lastItinerary}
            onCreatePlan={() => setActiveTab('ai')}
            onOpenMap={() => {
              setPendingPlaceId(null);
              if (!appLocation.coordinates) setLocationPromptVisible(true);
              setActiveTab('map');
            }}
          />
        );
      case 'saved':
        return (
          <SavedHubScreen
            records={favoriteRecords}
            history={activityHistory}
            recentSearches={recentSearches}
            onOpenPlace={(id) => openPlace(id, 'favorites')}
            onOpenFood={openFood}
            onClearHistory={clearActivityHistory}
            t={t}
          />
        );
      case 'notifications':
        return <NotificationsScreen />;
      case 'member_video_call':
        return (
          <MemberVideoCallScreen
            isSignedIn={Boolean(authSession || guestSession)}
            memberId={currentUserId}
            memberName={currentUserName}
            coordinates={appLocation.coordinates}
            locationPermission={appLocation.permission}
            isLocating={appLocation.isLocating}
            onRequestLocation={requestAppLocation}
            onOpenAccount={() => setActiveTab('account')}
            initialFriendId={pendingChatFriendId}
            onInitialFriendHandled={() => setPendingChatFriendId(null)}
            onChatVisibilityChange={handleMemberChatVisibilityChange}
          />
        );
      case 'live_team':
        return (
          <LiveTeamScreen
            isSignedIn={Boolean(authSession || guestSession)}
            memberId={currentUserId}
            memberName={currentUserName}
            initialCode={pendingLiveTeamCode}
            onInitialCodeHandled={() => setPendingLiveTeamCode(null)}
            onOpenAccount={() => setActiveTab('account')}
          />
        );
      case 'currency':
        return <CurrencyScreen profile={currentProfile} locationLabel={appLocation.cityLabel} />;
      case 'nearby':
        return (
          <NearbyScreen
            places={placesCatalog}
            coordinates={appLocation.coordinates}
            locationLabel={appLocation.cityLabel}
            permission={appLocation.permission}
            isLocating={appLocation.isLocating}
            error={appLocation.error}
            onRequestLocation={openLocationPrompt}
            onOpenPlace={(id) => openPlace(id, 'nearby')}
            t={t}
          />
        );
      case 'explore':
        return (
          <ExploreScreen
            places={filteredPlaces}
            selectedCity={selectedCity}
            selectedProfileCities={selectedProfileCities}
            availableCities={availablePlaceCities}
            onCityChange={changeExploreCity}
            onOpenPlace={(id) => openPlace(id, 'explore')}
            onOpenFilter={() => setActiveTab('filter')}
            onOpenSearch={() => setActiveTab('search')}
            t={t}
          />
        );
      case 'place_detail':
        return (
          <PlaceDetailScreen
            place={selectedPlace}
            isFavorite={isFavorite('place', selectedPlace.id)}
            onToggleFavorite={() => toggleFavorite('place', selectedPlace.id)}
            onBack={() => setActiveTab(placeReturnTab)}
            onOpenMap={openMap}
            onAskAi={() => {
              void askAi(`Tell me more about ${selectedPlace.name}`);
              setActiveTab('ai');
            }}
            onOpenLivePreview={openLivePreviewRequest}
            t={t}
          />
        );
      case 'live_preview_request':
        return (
          <TranslatedLivePreviewRequestScreen
            place={{
              id: selectedPlace.id,
              name: selectedPlace.name,
              city: selectedPlace.city,
              category: selectedPlace.category,
              description: selectedPlace.description,
              lat: selectedPlace.lat,
              lng: selectedPlace.lng,
            }}
            isSubmitting={isLivePreviewSubmitting}
            errorMessage={livePreviewError}
            onPayAndRequest={(input) => {
              void createLivePreviewRequest(input);
            }}
            onBack={() => setActiveTab('place_detail')}
          />
        );
      case 'live_preview_waiting':
        return (
          <TranslatedLivePreviewWaitingScreen
            request={livePreviewRequest}
            role={livePreviewRole}
            errorMessage={livePreviewError}
            onRefresh={() => {
              void refreshLivePreviewRequest();
            }}
            onJoinCall={() => {
              void joinLivePreviewCall();
            }}
            onCancel={() => {
              void cancelLivePreviewRequest();
            }}
            onOpenCompletion={() => setActiveTab('live_preview_completion')}
          />
        );
      case 'live_call_room':
        return livePreviewRequest ? (
          <LiveCallRoomScreen
            request={livePreviewRequest}
            role={livePreviewRole}
            onEndCall={(durationSeconds) => {
              void endLivePreviewCall(durationSeconds);
            }}
          />
        ) : null;
      case 'live_preview_completion':
        return livePreviewRequest ? (
          <LivePreviewCompletionScreen
            request={livePreviewRequest}
            role={livePreviewRole}
            errorMessage={livePreviewError}
            onConfirm={() => {
              void confirmLivePreviewCompletion();
            }}
            onDispute={() => {
              void disputeLivePreviewRequest();
            }}
            onRate={saveLivePreviewRating}
          />
        ) : null;
      case 'food_detail':
        return (
          <FoodDetailScreen
            food={selectedFood}
            isFavorite={isFavorite('food', selectedFood.id)}
            onToggleFavorite={() => toggleFavorite('food', selectedFood.id)}
            onBack={() => setActiveTab('food')}
            onAskAi={() => {
              void askAi(`Is ${selectedFood.name} spicy?`);
              setActiveTab('ai');
            }}
            t={t}
          />
        );
      case 'food':
        return (
          <FoodScreen
            foods={foods}
            onOpenFood={openFood}
            onOpenSearch={() => setActiveTab('search')}
            t={t}
          />
        );
      case 'culture':
        return (
          <CultureScreen
            topics={cultureTopics}
            isFavorite={isFavorite}
            onToggleFavorite={toggleFavorite}
            onAskAi={() => setActiveTab('ai')}
            t={t}
          />
        );
      case 'phrases':
        return (
          <PhrasesScreen
            phrases={phrases}
            isFavorite={isFavorite}
            onToggleFavorite={toggleFavorite}
            t={t}
          />
        );
      case 'emergency':
        return <EmergencyScreen t={t} />;
      case 'ai':
        return (
          <AiScreen
            messages={messages}
            chatInput={chatInput}
            onChangeInput={setChatInput}
            onAsk={(q) => askAi(q)}
            onBuildItinerary={buildItinerary}
            tripDays={tripDays}
            tripStyle={tripStyle}
            onChangeTripDays={setTripDays}
            onChangeTripStyle={setTripStyle}
            currentCity={appLocation.cityLabel || currentProfile.currentCity}
            currentLanguage={currentProfile.language}
            locale={locale}
            isReplying={isAiReplying}
            t={t}
          />
        );
      case 'itinerary_preview':
        return lastItinerary ? (
          <ItineraryPreviewScreen
            itinerary={lastItinerary}
            onSave={() => {
              recordActivity('itinerary', 'Saved itinerary', lastItinerary.title);
              void trackEvent('itinerary_saved', { itinerary_days: lastItinerary.days }, currentProfile);
            }}
            onSendEmail={() => {
              setEmailRecipient((current) => current || authSession?.user.email || '');
              setEmailSubject((current) => current || `Lịch trình ${lastItinerary.days}N ${lastItinerary.city} - Vinago+`);
              setEmailBody((current) => current || buildItineraryPreview(lastItinerary, locale));
              setActiveTab('itinerary_email');
            }}
            onExportPdf={() => {
              setActiveTab('itinerary_pdf');
              void trackEvent('itinerary_exported', { itinerary_days: lastItinerary.days, format: 'pdf_preview' }, currentProfile);
            }}
            onBack={() => setActiveTab('ai')}
            t={t}
          />
        ) : null;
      case 'itinerary_email':
        return lastItinerary ? (
          <ItineraryEmailScreen
            itinerary={lastItinerary}
            recipient={emailRecipient}
            subject={emailSubject}
            body={emailBody}
            onChangeRecipient={setEmailRecipient}
            onChangeSubject={setEmailSubject}
            onChangeBody={setEmailBody}
            onSend={sendItineraryEmail}
            t={t}
          />
        ) : null;
      case 'itinerary_pdf':
        return lastItinerary ? (
          <ItineraryPdfScreen
            itinerary={lastItinerary}
            onShare={() => {
              void Linking.openURL(`mailto:?subject=${encodeURIComponent('Vinago+ itinerary')}&body=${encodeURIComponent(buildItineraryPreview(lastItinerary, locale))}`);
            }}
            onExport={() => {
              setEmailStatus(t('ai.emailSent'));
              void trackEvent('itinerary_exported', { itinerary_days: lastItinerary.days, format: 'pdf_export' }, currentProfile);
            }}
            onBack={() => setActiveTab('itinerary_preview')}
            t={t}
          />
        ) : null;
      case 'map':
        return (
          <MapScreen
            place={pendingPlaceId ? selectedPlace : null}
            userCoordinates={appLocation.coordinates}
            locationLabel={appLocation.cityLabel}
            onBack={() => setActiveTab(pendingPlaceId ? 'place_detail' : 'home')}
            t={t}
          />
        );
      case 'favorites':
        return (
          <FavoritesScreen
            records={favoriteRecords}
            onOpenPlace={(id) => openPlace(id, 'favorites')}
            onOpenFood={(id) => openFood(id)}
            t={t}
          />
        );
      case 'history':
        return <HistoryScreen entries={activityHistory} onClear={clearActivityHistory} t={t} />;
      case 'account':
        return (
          <AccountScreen
            authSession={authSession}
            guestSession={guestSession}
            settings={settings}
            currentLanguage={currentProfile.language}
            qrBusy={qrBusy}
            qrImageUri={qrImageUri}
            qrMobileStatus={qrMobileStatus}
            qrStatusText={qrStatusText}
            scannerBusy={scannerBusy}
            onSignIn={signInWithGoogle}
            onSignOut={signOutGoogle}
            onOpenQrScanner={openQrScanner}
            onOpenSettings={() => setActiveTab('settings')}
            onOpenLanguage={() => setActiveTab('language')}
            onOpenPrivacyPolicy={() => {
              void Linking.openURL(privacyPolicyUrl);
            }}
            onOpenMemberVideoCall={() => setActiveTab('member_video_call')}
            onOpenLiveTeam={() => setActiveTab('live_team')}
            onOpenLocalHelperOnboarding={() => setActiveTab('local_helper_onboarding')}
            onOpenLocalHelperJobs={openLocalHelperJobs}
            onOpenLocalHelperEarnings={openLocalHelperEarnings}
            onRefreshQrLogin={() => void refreshQrLoginSession()}
            isGoogleAuthPending={isGoogleAuthPending}
            canSignInWithGoogle={Platform.OS !== 'web'}
            t={t}
          />
        );
      case 'local_helper_onboarding':
        return (
          <LocalHelperOnboardingScreen
            existingProfile={localHelperProfile}
            initialName={currentUserName}
            initialEmail={currentUserEmail}
            defaultCity={currentProfile.currentCity}
            errorMessage={livePreviewError}
            onSaveProfile={saveLocalHelperProfile}
            onSetOnline={setLocalHelperOnline}
            requestCurrentLocation={requestAppLocation}
          />
        );
      case 'local_helper_jobs':
        return (
          <LocalHelperJobsScreen
            profile={localHelperProfile}
            jobs={localHelperJobs}
            errorMessage={livePreviewError}
            onRefresh={() => {
              void refreshLocalHelperJobs();
            }}
            onOpenOnboarding={() => setActiveTab('local_helper_onboarding')}
            onOpenDetail={openLocalHelperJobDetail}
            onAccept={(job) => {
              void acceptLocalHelperJob(job);
            }}
          />
        );
      case 'local_helper_job_detail':
        return (
          <LocalHelperJobDetailScreen
            profile={localHelperProfile}
            job={selectedLocalHelperJob}
            errorMessage={livePreviewError}
            onAccept={(job) => {
              void acceptLocalHelperJob(job);
            }}
            onJoinCall={() => {
              void joinLocalHelperJobCall();
            }}
            onBack={openLocalHelperJobs}
          />
        );
      case 'local_helper_earnings':
        return (
          <LocalHelperEarningsScreen
            earnings={localHelperEarnings}
            errorMessage={livePreviewError}
            onRefresh={() => {
              void refreshLocalHelperEarnings();
            }}
            onOpenJobs={openLocalHelperJobs}
          />
        );
      case 'settings':
        return (
          <SettingsScreen
            settings={settings}
            onUpdateSettings={updateSettings}
            onBack={() => setActiveTab('account')}
            t={t}
            onOpenWpConfig={() => setWpConfigModalVisible(true)}
          />
        );
      case 'language':
        return (
          <LanguageScreen
            current={currentProfile.language}
            onSelect={selectLanguage}
            onBack={() => setActiveTab('account')}
            t={t}
          />
        );
      case 'search':
        return (
          <SearchScreen
            places={placesCatalog}
            recentSearches={recentSearches}
            userCoordinates={appLocation.coordinates}
            onSubmitSearch={submitSearch}
            onClearRecent={clearRecentSearches}
            onOpenPlace={(id) => openPlace(id, 'search')}
            onOpenFood={(id) => openFood(id)}
            onOpenMap={() => {
              setPendingPlaceId(null);
              if (!appLocation.coordinates) setLocationPromptVisible(true);
              setActiveTab('map');
            }}
            t={t}
          />
        );
      case 'filter':
        return (
          <FilterScreen
            onApply={() => {
              setActiveTab('explore');
            }}
            onReset={() => setSelectedCity('All')}
            onBack={() => setActiveTab('explore')}
            t={t}
          />
        );
      case 'offline':
        return (
          <OfflineScreen
            onRetry={() => {
              setShowOfflineBanner(false);
              setActiveTab('home');
              void trackEvent('screen_view', { screen_name: 'home' }, currentProfile);
            }}
            t={t}
          />
        );
      default:
        return null;
    }
  };

  /* render */
  if (isBooting || !isPlacesDatabaseReady) {
    return (
      <AppLanguageProvider language={currentProfile.language}>
        <SafeAreaView style={styles.safeArea}>
          <StatusBar style="dark" />
          <View style={styles.loadingWrap}>
            <Sparkles color={colors.primary} size={36} />
            <Text style={styles.loadingTitle}>{t('loading.title')}</Text>
          </View>
        </SafeAreaView>
      </AppLanguageProvider>
    );
  }

  if (!profile) {
    return (
      <AppLanguageProvider language={currentProfile.language}>
        <OnboardingScreen
          draftProfile={draftProfile}
          setDraftProfile={setDraftProfile}
          onSave={saveProfile}
          t={t}
        />
      </AppLanguageProvider>
    );
  }

  return (
    <AppLanguageProvider language={currentProfile.language}>
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        <StatusBar style="dark" />
        <View style={[styles.appShell, isWide && styles.appShellWide]}>
          {isWide ? (
            <View style={styles.sidebar}>
              <View style={styles.sidebarHeader}>
                <View style={styles.logoMark}><Sparkles color={colors.surface} size={20} /></View>
                <Text style={styles.sidebarTitle}>VINAGO+</Text>
              </View>
              {bottomTabItems.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <Pressable
                    key={`side-${tab.id}`}
                    style={[styles.sidebarTab, active && styles.sidebarTabActive]}
                    onPress={() => changeTab(tab.id)}
                  >
                    <Icon color={active ? colors.primary : colors.muted} size={20} />
                    <Text style={[styles.sidebarTabText, active && styles.sidebarTabTextActive]}>
                      {t(tab.labelKey)}
                    </Text>
                  </Pressable>
                );
              })}
              <View style={styles.sidebarDivider} />
              {featureShortcuts.map((tab, index) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <Pressable
                    key={`side-feature-${tab.labelKey}-${index}`}
                    style={[styles.sidebarTab, active && styles.sidebarTabActive]}
                    onPress={() => changeTab(tab.id)}
                  >
                    <Icon color={active ? colors.primary : colors.muted} size={20} />
                    <Text style={[styles.sidebarTabText, active && styles.sidebarTabTextActive]}>
                      {t(tab.labelKey)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
          <View style={[styles.mainPane, !isWide && { paddingBottom: activeTab === 'member_video_call' && memberChatOpen ? 0 : bottomNavHeight }]}>
            {isWide || !['home', 'trips', 'saved', 'ai', 'account', 'member_video_call', 'live_team'].includes(activeTab) ? <HeaderBar
              title={t('app.name')}
              subtitle={activeTab === 'home' ? t('home.discoverTitle') : undefined}
              onBack={
                [
                  'place_detail',
                  'food_detail',
                  'settings',
                  'language',
                  'search',
                  'filter',
                  'itinerary_preview',
                  'itinerary_email',
                  'itinerary_pdf',
                  'map',
                  'offline',
                  'notifications',
                  'currency',
                  'nearby',
                  'member_video_call',
                  'live_team',
                  'live_preview_request',
                  'live_preview_waiting',
                  'live_call_room',
                  'live_preview_completion',
                  'local_helper_onboarding',
                  'local_helper_jobs',
                  'local_helper_job_detail',
                  'local_helper_earnings',
                ].includes(activeTab)
                  ? () => {
                      if (activeTab === 'place_detail') setActiveTab('explore');
                      else if (activeTab === 'food_detail') setActiveTab('food');
                      else if (activeTab === 'search') setActiveTab('home');
                      else if (activeTab === 'itinerary_email') setActiveTab('itinerary_preview');
                      else if (activeTab === 'itinerary_pdf') setActiveTab('itinerary_preview');
                      else if (activeTab === 'itinerary_preview') setActiveTab('ai');
                      else if (activeTab === 'map') setActiveTab(pendingPlaceId ? 'place_detail' : 'home');
                      else if (activeTab === 'notifications') setActiveTab('home');
                      else if (activeTab === 'currency') setActiveTab('home');
                      else if (activeTab === 'nearby') setActiveTab('home');
                      else if (activeTab === 'member_video_call') setActiveTab('home');
                      else if (activeTab === 'live_team') setActiveTab('account');
                      else if (activeTab === 'live_preview_request') setActiveTab('place_detail');
                      else if (activeTab === 'live_preview_waiting') setActiveTab(livePreviewRole === 'helper' ? 'local_helper_jobs' : 'place_detail');
                      else if (activeTab === 'live_call_room') setActiveTab('live_preview_waiting');
                      else if (activeTab === 'live_preview_completion') setActiveTab('live_preview_waiting');
                      else if (activeTab === 'local_helper_job_detail') openLocalHelperJobs();
                      else if (activeTab === 'local_helper_onboarding' || activeTab === 'local_helper_jobs' || activeTab === 'local_helper_earnings') setActiveTab('account');
                      else setActiveTab('account');
                    }
                  : undefined
              }
            /> : null}
            {showOfflineBanner ? (
              <View style={styles.offlineBanner}>
                <WifiOff color={colors.primary} size={16} />
                <Text style={styles.offlineBannerText}>{t('offline.title')}</Text>
                <Pressable onPress={() => setShowOfflineBanner(false)}>
                  <X color={colors.muted} size={16} />
                </Pressable>
              </View>
            ) : null}
            {renderActiveScreen()}
            {!isWide && activeTab !== 'ai' && ['home', 'trips', 'saved', 'account', 'explore', 'food', 'culture'].includes(activeTab) ? (
              <Pressable accessibilityLabel="Open AI travel assistant" style={[styles.aiFloatingButton, { bottom: bottomNavHeight + 14 }]} onPress={() => changeTab('ai')}>
                <Sparkles color={colors.surface} size={24} />
              </Pressable>
            ) : null}
            {emailStatus ? (
              <View style={[styles.emailStatusBar, { bottom: emailStatusBottom }]}>
                <Text style={styles.emailStatusText}>{emailStatus}</Text>
                <Pressable onPress={() => setEmailStatus(null)}>
                  <X color={colors.muted} size={16} />
                </Pressable>
              </View>
            ) : null}
          </View>
        </View>
        <CallTone active={memberAlert?.kind === 'call'} variant="incoming" />
        {memberAlert ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => openMemberNotification(memberAlert)}
            style={[styles.memberAlert, memberAlert.kind === 'call' && styles.memberCallAlert]}
          >
            <View style={[styles.memberAlertIcon, memberAlert.kind === 'call' && styles.memberCallAlertIcon]}>
              {memberAlert.kind === 'call' ? <Phone color={colors.surface} size={21} /> : memberAlert.kind === 'live-team' ? <Radio color={colors.surface} size={21} /> : <MessageCircle color={colors.surface} size={21} />}
            </View>
            <View style={styles.memberAlertCopy}>
              <Text style={styles.memberAlertTitle}>{memberAlert.title}</Text>
              <Text numberOfLines={2} style={styles.memberAlertBody}>{memberAlert.body}</Text>
            </View>
            <Pressable accessibilityLabel="Đóng thông báo" style={styles.memberAlertClose} onPress={(event) => { event.stopPropagation(); setMemberAlert(null); }}><X color={colors.muted} size={17} /></Pressable>
          </Pressable>
        ) : null}
        {!isWide && !(activeTab === 'member_video_call' && memberChatOpen) ? (
          <BottomNav
            activeTab={activeTab}
            bottomInset={mobileBottomInset}
            onChange={changeTab}
            t={t}
          />
        ) : null}
        <QrLoginScanner
          body={t('account.qrMobileReady')}
          busy={scannerBusy}
          onClose={() => setScannerVisible(false)}
          onScanned={(data) => void handleQrScanned(data)}
          title={t('account.qrScanWeb')}
          visible={scannerVisible}
        />
        <LocationPermissionModal
          visible={locationPromptVisible}
          permission={appLocation.permission}
          canAskAgain={appLocation.canAskAgain}
          isLocating={appLocation.isLocating}
          cityLabel={appLocation.cityLabel}
          error={appLocation.error}
          isVietnamese={locale === 'vi'}
          onAllow={() => { void requestAppLocation(); }}
          onNotNow={dismissLocationPrompt}
          onOpenSettings={() => { void Linking.openSettings(); }}
        />
        <NewsDetailModal
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
        />
        <WpUrlConfigModal
          visible={wpConfigModalVisible}
          currentUrl={settings.wpNewsUrl || DEFAULT_WP_URL}
          onSave={(url) => updateSettings({ wpNewsUrl: url })}
          onClose={() => setWpConfigModalVisible(false)}
        />
      </SafeAreaView>
    </AppLanguageProvider>
  );
}

function BottomNav({
  activeTab,
  bottomInset,
  onChange,
  t,
}: {
  activeTab: TabId;
  bottomInset: number;
  onChange: (tab: TabId) => void;
  t: (key: TranslationKey) => string;
}) {
  const items = bottomTabItems.filter((tab, idx, arr) => arr.findIndex((t) => t.id === tab.id) === idx);
  return (
    <View
      style={[
        styles.bottomNav,
        {
          height: 64 + bottomInset,
          paddingBottom: bottomInset,
        },
      ]}
    >
      {items.map((tab) => {
        const Icon = tab.icon;
        const active = activeTab === tab.id;
        return (
          <Pressable
            key={tab.id}
            style={[styles.bottomNavItem, tab.id === 'ai' && styles.bottomNavAiItem]}
            onPress={() => onChange(tab.id)}
          >
            <View style={tab.id === 'ai' ? [styles.bottomNavAiIcon, active && styles.bottomNavAiIconActive] : undefined}>
              <Icon color={tab.id === 'ai' ? colors.surface : active ? colors.primary : colors.muted} size={tab.id === 'ai' ? 23 : 20} />
            </View>
            <Text style={[styles.bottomNavText, active && styles.bottomNavTextActive]}>
              {t(tab.labelKey)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ============================================================
 *  Styles
 * ============================================================ */

const styles = StyleSheet.create({
  flexOne: { flex: 1 },
  rowGap: { flexDirection: 'row', gap: 8, alignItems: 'center' },

  safeArea: { flex: 1, backgroundColor: colors.background },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingTitle: { color: colors.text, fontSize: 22, fontWeight: '800' },

  /* Brand */
  brandHeader: { paddingHorizontal: 16, paddingTop: 8 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logoMark: {
    height: 44, width: 44, borderRadius: 8, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  brandTitle: { color: colors.primary, fontSize: 22, fontWeight: '900', letterSpacing: 0.5 },
  brandSubtitle: { color: colors.muted, fontSize: 12, fontWeight: '700' },

  /* Onboarding */
  onboardingScroll: { padding: 16, gap: 16, paddingBottom: 48 },

  welcomeHero: {
    borderRadius: 16, overflow: 'hidden', minHeight: 420, justifyContent: 'flex-end',
    backgroundColor: colors.text,
  },
  welcomeHeroImage: { ...StyleSheet.absoluteFill, width: '100%', height: '100%' },
  welcomeHeroOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(20, 10, 10, 0.45)' },
  welcomeHeroContent: { padding: 24, gap: 12 },
  welcomeTitle: { color: colors.surface, fontSize: 28, fontWeight: '900', lineHeight: 36 },
  welcomeSubtitle: { color: '#fdebea', fontSize: 16, fontWeight: '700' },
  welcomeCopy: { color: '#fdebea', fontSize: 14, lineHeight: 22, fontWeight: '500' },
  welcomePrimary: {
    height: 48, borderRadius: 8, backgroundColor: colors.primary,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 8,
  },
  welcomePrimaryText: { color: colors.surface, fontWeight: '900', fontSize: 16 },
  welcomeSecondary: { alignItems: 'center', padding: 12 },
  welcomeSecondaryText: { color: colors.surface, fontWeight: '700' },

  stepCard: {
    backgroundColor: colors.surface, borderRadius: 16, padding: 20, gap: 14,
    borderWidth: 1, borderColor: colors.border,
  },
  stepTitle: { color: colors.text, fontSize: 20, fontWeight: '900' },
  stepSubtitle: { color: colors.muted, fontSize: 14, lineHeight: 20 },

  languageList: { gap: 10 },
  languageRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 12, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
  },
  languageRowActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  languageFlag: {
    width: 36, height: 36, borderRadius: 8, backgroundColor: colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  languageFlagText: { fontSize: 18 },
  languageTextStack: { flex: 1, gap: 2 },
  languageLabel: { color: colors.text, fontSize: 16, fontWeight: '800' },
  languageSubLabel: { color: colors.muted, fontSize: 12, fontWeight: '700' },

  tripDaysPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
  },
  dayAdjustButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayAdjustText: { color: colors.primary, fontSize: 24, fontWeight: '900' },
  dayNumberWrap: { alignItems: 'center', gap: 3 },
  dayNumber: { color: colors.text, fontSize: 34, fontWeight: '900' },
  dayNumberLabel: { color: colors.muted, fontSize: 12, fontWeight: '800' },

  daysRow: { flexDirection: 'row', gap: 10 },
  dayStepper: {
    flex: 1, height: 56, borderRadius: 12, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  dayStepperActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayStepperText: { color: colors.text, fontSize: 18, fontWeight: '900' },
  dayStepperTextActive: { color: colors.surface },
  cityList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  /* Header bar */
  headerBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingTop: 8, paddingBottom: 8,
    backgroundColor: colors.background,
  },
  headerBack: { backgroundColor: 'transparent' },
  headerCenter: { flex: 1 },
  headerTitle: { color: colors.text, fontSize: 18, fontWeight: '900' },
  headerSubtitle: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  headerTrailing: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerAction: {
    height: 36, width: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },

  iconButton: {
    height: 36, width: 36, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  disabledButton: { opacity: 0.5 },

  /* Bottom nav */
  bottomNav: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    minHeight: 64, backgroundColor: colors.surface,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    borderTopWidth: 1, borderTopColor: colors.border,
    shadowColor: colors.shadow, shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.6, shadowRadius: 12, elevation: 6,
  },
  bottomNavItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  bottomNavAiItem: { transform: [{ translateY: -8 }] },
  bottomNavAiIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#29110f', borderWidth: 3, borderColor: colors.surface },
  bottomNavAiIconActive: { backgroundColor: colors.primary },
  bottomNavText: { color: colors.muted, fontSize: 10, fontWeight: '800' },
  bottomNavTextActive: { color: colors.primary },

  /* Sidebar */
  appShell: { flex: 1 },
  appShellWide: { flexDirection: 'row' },
  sidebar: {
    width: 220, backgroundColor: colors.surface, borderRightWidth: 1,
    borderRightColor: colors.border, padding: 16, gap: 8,
  },
  sidebarHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  sidebarTitle: { color: colors.text, fontSize: 20, fontWeight: '900' },
  sidebarTab: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8,
  },
  sidebarTabActive: { backgroundColor: colors.primarySoft },
  sidebarTabText: { color: colors.muted, fontWeight: '700', fontSize: 14 },
  sidebarTabTextActive: { color: colors.primary, fontWeight: '900' },
  sidebarDivider: { height: 1, backgroundColor: colors.border, marginVertical: 8 },
  mainPane: { flex: 1 },
  memberAlert: { position: 'absolute', top: 10, left: 12, right: 12, zIndex: 100, minHeight: 72, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 11, borderRadius: 18, borderCurve: 'continuous', backgroundColor: colors.surface, borderWidth: 1, borderColor: '#fecaca', boxShadow: '0 10px 30px rgba(58,20,20,0.22)' },
  memberCallAlert: { borderColor: '#bbf7d0' },
  memberAlertIcon: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  memberCallAlertIcon: { backgroundColor: colors.success },
  memberAlertCopy: { flex: 1, gap: 3 },
  memberAlertTitle: { color: colors.text, fontSize: 14, fontWeight: '900' },
  memberAlertBody: { color: colors.muted, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  memberAlertClose: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.surfaceAlt },

  /* Home */
  homeContent: { padding: 16, gap: 18, paddingBottom: 96 },
  homeTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  homeGreeting: { color: colors.muted, fontSize: 14, fontWeight: '700' },
  homeDiscover: { color: colors.text, fontSize: 26, fontWeight: '900' },

  homeSearchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    height: 48, paddingHorizontal: 14, borderRadius: 8,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  homeSearchText: { flex: 1, color: colors.muted, fontSize: 14 },
  homeFilterButton: {
    height: 32, width: 32, borderRadius: 8, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },

  homeCatalogBand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  homeCatalogIcon: {
    width: 46,
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  homeCatalogBody: { flex: 1, gap: 2 },
  homeCatalogEyebrow: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  homeCatalogTitle: { color: colors.text, fontSize: 18, fontWeight: '900' },
  homeCatalogSub: { color: colors.muted, fontSize: 12, fontWeight: '700' },

  quickChipRow: { flexDirection: 'row', gap: 8 },
  homeQuickChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
    backgroundColor: colors.primarySoft,
  },
  homeQuickChipActive: { backgroundColor: colors.primary },
  homeQuickChipText: { color: colors.primary, fontWeight: '800', fontSize: 13 },
  homeQuickChipTextActive: { color: colors.surface },

  homeSection: { gap: 10 },
  homeSectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  homeSectionTitle: { color: colors.text, fontSize: 18, fontWeight: '900' },
  homeSectionSubtitle: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  homeSectionLink: { color: colors.primary, fontWeight: '800', fontSize: 13 },

  toolGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  toolTile: {
    width: '23%',
    minWidth: 72,
    minHeight: 76,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toolIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  toolLabel: { color: colors.text, fontSize: 11, fontWeight: '900', textAlign: 'center' },

  popularRow: { gap: 12, paddingRight: 4 },
  popularCard: { width: 200, gap: 8 },
  popularCardImage: { width: 200, height: 140, borderRadius: 12 },
  popularCardRating: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    position: 'absolute', top: 8, right: 8, paddingHorizontal: 6, paddingVertical: 3,
    borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.55)',
  },
  popularCardRatingText: { color: colors.surface, fontSize: 11, fontWeight: '800' },
  popularCardName: { color: colors.text, fontSize: 15, fontWeight: '900' },
  popularCardSub: { color: colors.muted, fontSize: 12, fontWeight: '700' },

  popularGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  popularGridCard: { width: '47%', gap: 6 },
  popularGridImage: { width: '100%', height: 120, borderRadius: 12 },
  popularGridName: { color: colors.text, fontSize: 14, fontWeight: '900' },
  popularGridSub: { color: colors.muted, fontSize: 12, fontWeight: '700' },

  recentChipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  recentChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  recentChipText: { color: colors.muted, fontSize: 12, fontWeight: '700' },

  /* Explore */
  exploreTopRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingTop: 8, paddingBottom: 4,
  },
  exploreTitle: { color: colors.text, fontSize: 22, fontWeight: '900' },
  exploreSubtitle: { color: colors.muted, fontSize: 13, fontWeight: '700' },

  exploreCityRail: { height: 54 },
  exploreCityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 54,
    paddingHorizontal: 12,
  },
  exploreCityScroll: { flexGrow: 0, height: 54, maxHeight: 56 },
  exploreCityTab: {
    height: 38, paddingHorizontal: 14, borderRadius: 8,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  exploreCityTabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  exploreCityTabText: { color: colors.muted, fontSize: 13, fontWeight: '800' },
  exploreCityTabTextActive: { color: colors.surface },

  exploreList: { padding: 12, gap: 12, paddingBottom: 96 },
  exploreListCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 10, borderRadius: 12, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
  },
  exploreListImage: { width: 86, height: 76, borderRadius: 10 },
  exploreListBody: { flex: 1, gap: 4 },
  exploreListName: { color: colors.text, fontSize: 16, fontWeight: '900' },
  exploreListSub: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  exploreListRating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  exploreListRatingText: { color: colors.muted, fontSize: 12, fontWeight: '700' },

  /* Nearby GPS */
  nearbyEmptyContent: { flexGrow: 1, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 14, backgroundColor: colors.background },
  nearbyEmptyIcon: { width: 76, height: 76, borderRadius: 26, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  nearbyEmptyTitle: { color: colors.text, fontSize: 20, lineHeight: 26, fontWeight: '900', textAlign: 'center' },
  nearbyEmptyBody: { maxWidth: 420, color: colors.muted, fontSize: 13, lineHeight: 20, fontWeight: '600', textAlign: 'center' },
  nearbyLocationButton: { width: '100%', maxWidth: 420, minHeight: 50, paddingHorizontal: 16, borderRadius: 16, borderCurve: 'continuous', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary },
  nearbyLocationButtonText: { color: colors.surface, fontSize: 14, fontWeight: '900' },
  nearbyHeader: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12, gap: 12, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  nearbyLocationRow: { minHeight: 64, padding: 12, borderRadius: 17, borderCurve: 'continuous', flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.primarySoft },
  nearbyGpsDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.success, borderWidth: 3, borderColor: '#bbf7d0' },
  nearbyEyebrow: { color: colors.primary, fontSize: 9, lineHeight: 13, fontWeight: '900', letterSpacing: 0.8 },
  nearbyLocationName: { color: colors.text, fontSize: 15, lineHeight: 21, fontWeight: '900' },
  nearbyRefreshButton: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  nearbyRadiusRow: { gap: 8, paddingRight: 12 },
  nearbyRadiusChip: { minWidth: 68, height: 36, paddingHorizontal: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border },
  nearbyRadiusChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  nearbyRadiusText: { color: colors.muted, fontSize: 11, fontWeight: '900' },
  nearbyRadiusTextActive: { color: colors.surface },
  nearbyResultCount: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  nearbyList: { padding: 14, gap: 10, paddingBottom: 110 },
  nearbyPlaceCard: { minHeight: 96, padding: 10, borderRadius: 17, borderCurve: 'continuous', flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, boxShadow: '0 4px 14px rgba(61,22,22,0.05)' },
  nearbyPlaceImage: { width: 88, height: 78, borderRadius: 13 },
  nearbyPlaceBody: { flex: 1, gap: 5 },
  nearbyPlaceName: { color: colors.text, fontSize: 15, lineHeight: 20, fontWeight: '900' },
  nearbyPlaceMeta: { color: colors.muted, fontSize: 11, lineHeight: 16, fontWeight: '700' },
  nearbyDistanceRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  nearbyDistanceText: { color: colors.primary, fontSize: 12, fontWeight: '900', fontVariant: ['tabular-nums'] },
  nearbyDistanceHint: { flexShrink: 1, color: colors.muted, fontSize: 10, fontWeight: '600' },
  nearbyNoResults: { minHeight: 300, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 9 },

  /* Place detail */
  placeDetailContent: { paddingBottom: 96 },
  placeDetailImageWrap: { height: 280, position: 'relative' },
  placeDetailImage: { width: '100%', height: '100%' },
  placeDetailOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.18)' },
  placeDetailTopBar: {
    position: 'absolute', top: 12, left: 12, right: 12,
    flexDirection: 'row', justifyContent: 'space-between',
  },
  placeDetailBack: { backgroundColor: 'rgba(0,0,0,0.35)' },
  placeDetailSave: {
    height: 40, width: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  placeDetailBody: { padding: 16, gap: 10 },
  placeDetailName: { color: colors.text, fontSize: 24, fontWeight: '900' },
  placeDetailSub: { color: colors.muted, fontSize: 14, fontWeight: '700' },
  foodDetailHero: { height: 280, position: 'relative' },

  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { color: colors.muted, fontSize: 12, fontWeight: '700' },

  bodyText: { color: colors.text, fontSize: 14, lineHeight: 21, fontWeight: '500' },
  sectionTitleWrap: { gap: 2, marginTop: 6 },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  sectionSubtitle: { color: colors.muted, fontSize: 13, fontWeight: '700' },

  panel: {
    backgroundColor: colors.surface, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: colors.border, gap: 8,
  },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
    backgroundColor: colors.primarySoft,
  },
  tagText: { color: colors.primary, fontSize: 12, fontWeight: '800' },

  infoCard: { gap: 8, padding: 12, borderRadius: 12, backgroundColor: colors.surfaceAlt },
  infoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  infoLabel: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  infoValue: { color: colors.text, fontSize: 14, fontWeight: '900' },

  mapPreview: {
    padding: 12, borderRadius: 12, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, gap: 4,
  },
  mapPinRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  mapPinText: { color: colors.text, fontSize: 13, fontWeight: '700' },
  mapOpenLink: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  livePreviewCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: '#f3c7c4',
  },
  livePreviewIcon: {
    height: 42,
    width: 42,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  livePreviewCopy: { flex: 1, gap: 2 },
  livePreviewTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  livePreviewBody: { color: colors.muted, fontSize: 12, fontWeight: '700' },

  warningBox: {
    flexDirection: 'row', gap: 8, alignItems: 'center', padding: 10,
    borderRadius: 10, backgroundColor: '#fff7ed',
  },
  warningText: { color: colors.warning, fontWeight: '800', fontSize: 13 },

  phraseCard: { padding: 12, borderRadius: 12, backgroundColor: colors.primarySoft, gap: 6 },
  phraseEnglish: { color: colors.muted, fontSize: 13 },
  phraseVietnamese: { color: colors.text, fontSize: 18, fontWeight: '900' },
  phrasePronunciation: { color: colors.primary, fontSize: 13, fontWeight: '800' },

  askAiButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderRadius: 8, backgroundColor: colors.primarySoft,
    borderWidth: 1, borderColor: colors.primary,
  },
  askAiText: { color: colors.primary, fontWeight: '900' },

  /* Food list */
  foodTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 4 },
  foodList: { padding: 12, gap: 12, paddingBottom: 96 },
  foodListCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 10, borderRadius: 12, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
  },
  foodListImage: { width: 86, height: 76, borderRadius: 10 },
  foodListBody: { flex: 1, gap: 4 },
  foodListName: { color: colors.text, fontSize: 16, fontWeight: '900' },
  foodListSub: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  foodListRegion: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  foodListRating: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  foodListRatingText: { color: colors.muted, fontSize: 12, fontWeight: '700' },

  /* Culture */
  cultureContent: { padding: 16, gap: 12, paddingBottom: 96 },
  cultureHeader: { alignItems: 'center', gap: 4, paddingVertical: 8 },
  cultureEyebrow: { color: colors.muted, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  cultureTabs: { flexDirection: 'row', gap: 8, justifyContent: 'center', flexWrap: 'wrap' },
  cultureCard: { padding: 14, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 6 },
  cultureBadgeRow: { flexDirection: 'row' },
  cultureBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  cultureBadgeDo: { backgroundColor: '#dcfce7' },
  cultureBadgeDont: { backgroundColor: colors.primarySoft },
  cultureBadgeText: { fontWeight: '900', fontSize: 12 },
  cultureBadgeTextDo: { color: colors.success },
  cultureBadgeTextDont: { color: colors.primary },
  cultureTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  cultureRow: { flexDirection: 'row', justifyContent: 'flex-end' },
  cultureSave: {
    height: 32, width: 32, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },

  /* Phrases */
  phraseList: { padding: 16, gap: 10, paddingBottom: 96 },
  phraseRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, borderRadius: 12, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
  },
  phraseAudioButton: {
    height: 32, width: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },

  /* Emergency */
  emergencyContent: { padding: 16, gap: 10, paddingBottom: 96 },
  emergencyRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 12, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
  },
  emergencyIcon: {
    height: 44, width: 44, borderRadius: 8, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  emergencyName: { color: colors.text, fontSize: 16, fontWeight: '900' },
  emergencyPhrase: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  emergencyPhone: { color: colors.primary, fontSize: 18, fontWeight: '900' },

  /* Favorites */
  favoritesList: { padding: 12, gap: 10, paddingBottom: 96 },
  favoriteRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, borderRadius: 12, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
  },
  favoriteImage: { width: 72, height: 64, borderRadius: 8 },
  favoriteFallbackIcon: {
    width: 72,
    height: 64,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  favoriteName: { color: colors.text, fontSize: 16, fontWeight: '900' },
  favoriteSub: { color: colors.muted, fontSize: 13, fontWeight: '700' },

  /* History */
  historyTopRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 8,
  },
  historySubtitle: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  historyClear: { color: colors.primary, fontSize: 13, fontWeight: '900' },
  historyList: { padding: 16, gap: 10, paddingBottom: 96 },
  historyGroup: { color: colors.muted, fontSize: 12, fontWeight: '900', textTransform: 'uppercase', marginTop: 8 },
  historyRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  historyIcon: {
    height: 32, width: 32, borderRadius: 8, backgroundColor: colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  historyTitle: { color: colors.text, fontWeight: '900', fontSize: 14 },
  historyDetail: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  historyTime: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  historyClearButton: {
    height: 44, borderRadius: 8, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center', marginTop: 12,
  },
  historyClearButtonText: { color: colors.primary, fontWeight: '900' },

  /* Account */
  accountContent: { padding: 16, gap: 16, paddingBottom: 96 },
  accountHeader: { alignItems: 'center', gap: 8, paddingVertical: 16 },
  accountAvatar: {
    height: 80, width: 80, borderRadius: 12, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  accountAvatarImage: { width: '100%', height: '100%' },
  accountName: { color: colors.text, fontSize: 20, fontWeight: '900' },
  accountEmail: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  qrMobilePanel: { width: '100%', gap: 8, marginTop: 8 },
  qrLoginPanel: {
    width: '100%',
    gap: 12,
    marginTop: 8,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  qrPanelHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  qrPanelCopy: { flex: 1, gap: 4 },
  qrPanelTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  qrPanelBody: { color: colors.muted, fontSize: 12, fontWeight: '700', lineHeight: 18 },
  qrImageFrame: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    height: 274,
    justifyContent: 'center',
    padding: 7,
    width: 274,
  },
  qrImage: { height: 260, width: 260 },
  qrStatusText: { color: colors.muted, fontSize: 12, fontWeight: '700', lineHeight: 18, textAlign: 'center' },

  accountSection: { gap: 6 },
  accountSectionTitle: { color: colors.muted, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  accountRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  accountRowLabel: { flex: 1, color: colors.text, fontSize: 14, fontWeight: '700' },
  accountRowValue: { color: colors.muted, fontSize: 13, fontWeight: '700' },

  signOutButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 14, borderRadius: 8, backgroundColor: colors.primarySoft,
    justifyContent: 'center',
  },
  signOutText: { color: colors.primary, fontWeight: '900' },

  /* Settings */
  settingsContent: { padding: 16, gap: 10, paddingBottom: 96 },
  settingsRow: {
    padding: 14, borderRadius: 12, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border, gap: 4,
  },
  settingsRowTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  settingsRowBody: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  fontScaleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  fontScaleBar: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  fontScaleDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.border },
  fontScaleDotActive: { backgroundColor: colors.primary, width: 18, height: 18, borderRadius: 9 },

  /* Language screen */
  languageHeader: { padding: 16, gap: 4 },
  languageFooter: { padding: 16, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },

  /* Search */
  searchScreen: { flex: 1, backgroundColor: '#f5f7f9' },
  searchHero: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10, gap: 12, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: '#e8eaed' },
  searchInput: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    minHeight: 54, paddingHorizontal: 16, borderRadius: 18, borderCurve: 'continuous',
    backgroundColor: colors.surface, boxShadow: '0 3px 14px rgba(15, 23, 42, 0.14)',
  },
  searchInputField: { flex: 1, color: colors.text, fontSize: 16, fontWeight: '700' },
  searchCategoryRow: { gap: 8, paddingRight: 12 },
  searchCategoryChip: { minHeight: 38, paddingHorizontal: 13, borderRadius: 19, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: colors.surface, borderWidth: 1, borderColor: '#dadce0' },
  searchCategoryChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  searchCategoryText: { color: colors.text, fontSize: 13, fontWeight: '800' },
  searchCategoryTextActive: { color: colors.surface },
  searchContent: { padding: 16, gap: 20, paddingBottom: 112, width: '100%', maxWidth: 980, alignSelf: 'center' },
  searchMapBanner: { minHeight: 84, padding: 14, borderRadius: 20, borderCurve: 'continuous', flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#eef5ff', borderWidth: 1, borderColor: '#d7e7ff' },
  searchMapBannerWide: { paddingHorizontal: 18 },
  searchMapIcon: { width: 48, height: 48, borderRadius: 16, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  searchMapTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  searchMapBody: { color: colors.muted, fontSize: 12, fontWeight: '700', paddingTop: 2 },
  searchMapButton: { minHeight: 42, paddingHorizontal: 13, borderRadius: 21, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primary },
  searchMapButtonText: { color: colors.surface, fontSize: 13, fontWeight: '900' },
  searchSectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  searchResultsHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 },
  searchSectionTitle: { color: colors.text, fontSize: 19, fontWeight: '900' },
  searchSectionLink: { color: colors.primary, fontWeight: '800' },
  searchSection: { gap: 12 },
  searchResultCount: { color: colors.muted, fontSize: 12, fontWeight: '700', paddingTop: 3 },
  searchSortPill: { minHeight: 32, paddingHorizontal: 10, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  searchSortText: { color: colors.primary, fontSize: 11, fontWeight: '900' },
  searchResultList: { gap: 10 },
  searchResultRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    minHeight: 112, padding: 10, borderRadius: 18, borderCurve: 'continuous', backgroundColor: colors.surface,
    borderWidth: 1, borderColor: '#e5e7eb', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.05)',
  },
  searchResultRowWide: { padding: 12 },
  searchResultImage: { width: 92, height: 92, borderRadius: 14, borderCurve: 'continuous' },
  searchResultCopy: { flex: 1, minWidth: 0, gap: 3 },
  searchResultName: { color: colors.text, fontSize: 16, fontWeight: '900' },
  searchRatingRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  searchRatingText: { color: '#9a6700', fontSize: 12, fontWeight: '900', fontVariant: ['tabular-nums'] },
  searchReviewText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  searchResultMeta: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  searchOpenText: { color: colors.success, fontSize: 12, fontWeight: '900' },
  searchResultAction: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  searchSubsectionTitle: { color: colors.text, fontSize: 16, fontWeight: '900', paddingTop: 8 },
  searchExampleList: { gap: 8 },
  searchExample: { minHeight: 44, paddingHorizontal: 12, borderRadius: 13, flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: colors.primarySoft },
  searchExampleText: { flex: 1, color: colors.text, fontSize: 13, fontWeight: '800' },

  /* Filter */
  filterHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  filterBack: { color: colors.primary, fontWeight: '900' },
  filterResults: { color: colors.muted, fontWeight: '700' },
  filterContent: { padding: 16, gap: 16, paddingBottom: 96 },
  filterFooter: {
    flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16,
    borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface,
  },
  filterResetButton: { paddingVertical: 12, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  filterResetText: { color: colors.muted, fontWeight: '900' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  priceLabel: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  priceBar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.border },
  ratingPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  ratingPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  ratingPillText: { color: colors.muted, fontSize: 13, fontWeight: '800' },
  ratingPillTextActive: { color: colors.surface },

  /* Chip primitives */
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choiceChip: {
    minHeight: 38, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  choiceChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  choiceChipLeading: {},
  choiceChipText: { color: colors.muted, fontSize: 13, fontWeight: '800' },
  choiceChipTextActive: { color: colors.surface },

  primaryButton: {
    height: 48, borderRadius: 8, backgroundColor: colors.primary,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  primaryButtonSecondary: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primary,
  },
  primaryButtonGhost: { backgroundColor: 'transparent' },
  primaryButtonText: { color: colors.surface, fontWeight: '900', fontSize: 15 },
  primaryButtonTextAlt: { color: colors.primary },

  /* Foreground location consent */
  locationPermissionBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(25,10,10,0.52)' },
  locationPermissionDismiss: { flex: 1 },
  locationPermissionCard: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 28, gap: 13, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderCurve: 'continuous', backgroundColor: colors.surface, boxShadow: '0 -10px 30px rgba(61,22,22,0.14)' },
  locationPermissionIcon: { width: 54, height: 54, borderRadius: 19, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  locationPermissionTitle: { color: colors.text, fontSize: 22, lineHeight: 28, fontWeight: '900' },
  locationPermissionBody: { color: colors.muted, fontSize: 13, lineHeight: 20, fontWeight: '600' },
  locationPermissionUses: { gap: 9, paddingVertical: 3 },
  locationPermissionUseRow: { minHeight: 28, flexDirection: 'row', alignItems: 'center', gap: 9 },
  locationPermissionUseText: { flex: 1, color: colors.text, fontSize: 13, lineHeight: 18, fontWeight: '700' },
  locationPermissionPrivacy: { padding: 12, flexDirection: 'row', alignItems: 'flex-start', gap: 9, borderRadius: 15, borderCurve: 'continuous', backgroundColor: colors.primarySoft },
  locationPermissionPrivacyText: { flex: 1, color: colors.text, fontSize: 11, lineHeight: 17, fontWeight: '700' },
  locationPermissionError: { color: '#b91c1c', fontSize: 11, lineHeight: 16, fontWeight: '700' },
  locationPermissionPrimary: { minHeight: 50, paddingHorizontal: 16, borderRadius: 16, borderCurve: 'continuous', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.primary },
  locationPermissionPrimaryText: { color: colors.surface, fontSize: 14, fontWeight: '900' },
  locationPermissionSecondary: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  locationPermissionSecondaryText: { color: colors.muted, fontSize: 13, fontWeight: '800' },

  /* Offline */
  offlineContent: { padding: 24, gap: 18, paddingBottom: 96 },
  offlineHero: { alignItems: 'center', gap: 8, paddingVertical: 24 },
  offlineIcon: {
    height: 96, width: 96, borderRadius: 24, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  offlineTitle: { color: colors.text, fontSize: 22, fontWeight: '900' },
  offlineSubtitle: { color: colors.muted, fontSize: 14, textAlign: 'center', fontWeight: '600' },
  offlineCard: { padding: 14, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 8 },
  offlineCardTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  offlineItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  offlineItemText: { color: colors.muted, fontSize: 13, fontWeight: '700' },

  offlineBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 12, marginBottom: 8, padding: 10, borderRadius: 8,
    backgroundColor: colors.primarySoft,
  },
  offlineBannerText: { flex: 1, color: colors.primary, fontWeight: '800', fontSize: 12 },

  /* Map */
  mapHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12 },
  mapHeaderTitle: { color: colors.text, fontSize: 18, fontWeight: '900' },
  mapSubtitle: { color: colors.muted, fontSize: 14, fontWeight: '700', textAlign: 'center' },
  mapCanvasWrap: { flex: 1, backgroundColor: colors.surfaceAlt },
  mapCanvas: { flex: 1, width: '100%', height: '100%' },
  mapIframe: { flex: 1, width: '100%', height: '100%', borderWidth: 0 },
  mapSheet: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mapSheetContent: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mapPin: {
    height: 44, width: 44, borderRadius: 8, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  mapPinName: { color: colors.text, fontSize: 16, fontWeight: '900' },
  mapPinSub: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  mapOpenButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8,
    backgroundColor: colors.primary,
  },
  mapOpenText: { color: colors.surface, fontWeight: '900' },

  /* AI */
  aiHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 8 },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success },
  onlineText: { color: colors.muted, fontSize: 12, fontWeight: '700' },

  aiContent: { padding: 16, gap: 14, paddingBottom: 96 },
  aiItineraryCard: { padding: 14, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 10 },
  aiItineraryTitle: { color: colors.text, fontSize: 18, fontWeight: '900' },
  aiItinerarySubtitle: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  aiDayRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  aiDayChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  aiDayChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  aiDayChipText: { color: colors.muted, fontWeight: '800' },
  aiDayChipTextActive: { color: colors.surface },

  chatList: { gap: 8 },
  chatBubble: { maxWidth: '88%', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  chatBubbleUser: { alignSelf: 'flex-end', backgroundColor: colors.primary },
  chatBubbleAssistant: { alignSelf: 'flex-start', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  chatText: { fontSize: 14, lineHeight: 20 },
  chatTextUser: { color: colors.surface, fontWeight: '700' },
  chatTextAssistant: { color: colors.text, fontWeight: '500' },

  aiInputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface,
  },
  aiInputField: {
    flex: 1, height: 48, paddingHorizontal: 12, borderRadius: 8,
    borderWidth: 1, borderColor: colors.border, justifyContent: 'center',
  },
  aiInput: { color: colors.text, fontSize: 15 },
  aiSendButton: {
    height: 48, width: 48, borderRadius: 8, backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },

  /* Itinerary preview */
  itineraryPreview: { padding: 16, gap: 12, paddingBottom: 96 },
  itineraryPreviewHero: {
    padding: 16, borderRadius: 12, backgroundColor: colors.primarySoft, gap: 8,
  },
  itineraryPreviewTitle: { color: colors.text, fontSize: 22, fontWeight: '900' },
  itineraryPreviewSubtitle: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  itineraryPreviewChipRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  itineraryPreviewChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: colors.surface },
  itineraryPreviewChipText: { color: colors.primary, fontWeight: '800', fontSize: 12 },
  itineraryBody: { padding: 14, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  itineraryBodyText: { color: colors.text, fontSize: 13, lineHeight: 20, fontWeight: '500' },
  itineraryActions: { flexDirection: 'row', gap: 10 },
  itineraryActionSecondary: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: 14, borderRadius: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primary,
  },
  itineraryActionPrimary: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: 14, borderRadius: 8, backgroundColor: colors.primary,
  },
  itineraryActionText: { color: colors.primary, fontWeight: '900' },
  itineraryActionTextPrimary: { color: colors.surface },
  itineraryExport: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.border,
  },
  itineraryExportText: { color: colors.primary, fontWeight: '900' },

  /* Email form */
  emailFormContent: { padding: 16, gap: 14, paddingBottom: 96 },
  emailHero: { alignItems: 'center', gap: 8, paddingVertical: 18 },
  emailEnvelope: {
    width: 112,
    height: 88,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  emailHeroTitle: { color: colors.text, fontSize: 20, fontWeight: '900', textAlign: 'center' },
  emailHeroSubtitle: { color: colors.muted, fontSize: 13, fontWeight: '700', textAlign: 'center' },
  emailFieldGroup: { gap: 6 },
  emailLabel: { color: colors.text, fontSize: 13, fontWeight: '900' },
  emailInput: {
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '600',
  },
  emailBodyInput: { minHeight: 122, lineHeight: 20 },

  /* PDF preview */
  itineraryPdf: { padding: 16, gap: 12, paddingBottom: 96 },
  itineraryPdfHeader: { alignItems: 'center', paddingVertical: 16, gap: 6 },
  itineraryPdfTitle: { color: colors.text, fontSize: 18, fontWeight: '900', textAlign: 'center' },
  itineraryPdfSubtitle: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  itineraryPdfBody: { padding: 16, borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  itineraryPdfBodyText: { color: colors.text, fontSize: 13, lineHeight: 20 },
  itineraryPdfActions: { flexDirection: 'row', gap: 10 },
  itineraryPdfShare: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: 12, borderRadius: 8, borderWidth: 1, borderColor: colors.primary,
  },
  itineraryPdfShareText: { color: colors.primary, fontWeight: '900' },

  emailStatusBar: {
    position: 'absolute', left: 12, right: 12, bottom: 88,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 10, borderRadius: 8, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
  },
  emailStatusText: { flex: 1, color: colors.text, fontSize: 12, fontWeight: '700' },

  /* Vinago+ v2 */
  v2HomeContent: { paddingBottom: 118, gap: 24, backgroundColor: '#fbfbfb' },
  v2Hero: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 20, gap: 14, backgroundColor: colors.surface },
  v2Greeting: { color: colors.muted, fontSize: 14, fontWeight: '800' },
  v2HeroTitle: { color: colors.text, fontSize: 27, lineHeight: 34, fontWeight: '900', maxWidth: 310 },
  v2Bell: { backgroundColor: colors.primarySoft },
  v2SearchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  v2SearchMain: { flex: 1, height: 50, flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 14, borderRadius: 16, backgroundColor: '#f5f5f5', borderWidth: 1, borderColor: colors.border },
  v2SearchAction: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  homeLocationPill: { alignSelf: 'flex-start', maxWidth: '100%', minHeight: 38, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 13, borderCurve: 'continuous', flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: colors.primarySoft },
  homeLocationText: { flexShrink: 1, color: colors.primary, fontSize: 12, lineHeight: 17, fontWeight: '900' },
  v2AskAi: { height: 44, paddingHorizontal: 15, borderRadius: 14, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', gap: 8 },
  v2AskAiText: { flex: 1, color: colors.surface, fontSize: 14, fontWeight: '900' },
  v2Section: { gap: 13, paddingHorizontal: 16 },
  v2QuickActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 7 },
  v2QuickItem: { flex: 1, alignItems: 'center', gap: 7 },
  v2QuickIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  v2QuickLabel: { color: colors.text, fontSize: 10, lineHeight: 14, fontWeight: '800', textAlign: 'center' },
  v2MoreTools: { gap: 8, paddingTop: 2, paddingRight: 12 },
  v2MoreToolChip: { height: 36, paddingHorizontal: 11, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  v2MoreToolText: { color: colors.text, fontSize: 11, fontWeight: '800' },
  v2CategoryRow: { gap: 10, paddingRight: 12 },
  v2Category: { width: 82, alignItems: 'center', gap: 7, padding: 10, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  v2CategoryIcon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff6f5' },
  v2CategoryText: { color: colors.text, fontSize: 11, fontWeight: '800', textAlign: 'center' },
  v2CardRail: { gap: 12, paddingRight: 16 },
  v2PlaceCard: { width: 226, overflow: 'hidden', borderRadius: 18, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  v2PlaceImage: { width: '100%', height: 142 },
  v2SaveButton: { position: 'absolute', top: 10, right: 10, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(20,20,20,0.55)' },
  v2PlaceBody: { padding: 12, gap: 6 },
  v2PlaceName: { color: colors.text, fontSize: 15, fontWeight: '900' },
  v2MetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  v2MetaText: { color: colors.text, fontSize: 12, fontWeight: '800' },
  v2OpenText: { color: colors.success, fontSize: 11, fontWeight: '900', marginLeft: 5 },
  v2PlaceSub: { color: colors.muted, fontSize: 12, lineHeight: 17, fontWeight: '600' },
  v2FoodRail: { gap: 12, paddingRight: 16 },
  v2FoodCard: { width: 150, gap: 5 },
  v2FoodImage: { width: 150, height: 108, borderRadius: 16 },
  v2EventBanner: { marginHorizontal: 16, padding: 14, borderRadius: 18, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.primarySoft },
  v2EventIcon: { width: 48, height: 48, borderRadius: 15, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  v2EventTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  v2RecentHint: { marginHorizontal: 16, color: colors.muted, fontSize: 12, fontWeight: '600' },
  aiFloatingButton: { position: 'absolute', right: 18, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, borderWidth: 4, borderColor: colors.surface, boxShadow: '0 8px 20px rgba(218,37,29,0.28)' },

  /* Trips */
  tripContent: { padding: 16, gap: 16, paddingBottom: 116, backgroundColor: '#fbfbfb' },
  tripHero: { padding: 18, gap: 12, borderRadius: 22, backgroundColor: '#29110f' },
  tripHeroTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  tripEyebrow: { color: '#d8a5a1', fontSize: 11, fontWeight: '900', letterSpacing: 1.1 },
  tripTitle: { color: colors.surface, fontSize: 28, lineHeight: 34, fontWeight: '900' },
  tripDates: { color: '#f1d9d7', fontSize: 13, fontWeight: '700' },
  weatherPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.12)' },
  weatherTemp: { color: colors.surface, fontSize: 17, fontWeight: '900' },
  tripProgressTrack: { height: 6, overflow: 'hidden', borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.18)' },
  tripProgressFill: { height: '100%', borderRadius: 3, backgroundColor: colors.accent },
  tripProgressText: { color: '#f1d9d7', fontSize: 11, fontWeight: '700' },
  tripTabRow: { gap: 8, paddingRight: 16 },
  tripTab: { height: 40, paddingHorizontal: 12, borderRadius: 13, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  tripTabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tripTabText: { color: colors.muted, fontSize: 12, fontWeight: '800' },
  tripTabTextActive: { color: colors.surface },
  tripSection: { gap: 12 },
  timelineRow: { minHeight: 70, flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  timelineTimeWrap: { width: 43, alignItems: 'center', gap: 6 },
  timelineTime: { color: colors.text, fontSize: 12, fontWeight: '900', fontVariant: ['tabular-nums'] },
  timelineLine: { width: 2, height: 32, backgroundColor: colors.border },
  timelineIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  timelineIconDone: { backgroundColor: colors.success },
  timelineTitle: { color: colors.text, fontSize: 14, lineHeight: 20, fontWeight: '900' },
  timelineTitleDone: { color: colors.muted, textDecorationLine: 'line-through' },
  checkCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.border },
  tripPanelTitle: { color: colors.text, fontSize: 15, fontWeight: '900' },
  tripListRow: { minHeight: 66, padding: 12, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  expenseTotal: { alignItems: 'center', gap: 5, padding: 20, borderRadius: 20, backgroundColor: '#29110f' },
  expenseAmount: { color: colors.surface, fontSize: 28, fontWeight: '900', fontVariant: ['tabular-nums'] },
  expenseRowAmount: { color: colors.text, fontSize: 13, fontWeight: '900', fontVariant: ['tabular-nums'] },
  expenseInputRow: { flexDirection: 'row', gap: 8 },
  expenseInput: { flex: 1, height: 48, paddingHorizontal: 14, borderRadius: 14, color: colors.text, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  expenseAdd: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: colors.primary },
  tripNoteInput: { minHeight: 170, padding: 14, borderRadius: 16, color: colors.text, textAlignVertical: 'top', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  savedHubHeader: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 10, gap: 3 },
  savedHubTabs: { flexDirection: 'row', gap: 7, paddingHorizontal: 16, paddingBottom: 8 },
  savedHubTab: { flex: 1, minHeight: 38, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, borderRadius: 12, backgroundColor: colors.surfaceAlt },
  savedHubTabActive: { backgroundColor: colors.primary },
  savedHubTabText: { color: colors.muted, fontSize: 11, fontWeight: '900', textAlign: 'center' },
  savedHubTabTextActive: { color: colors.surface },
  notificationsContent: { padding: 16, gap: 10, paddingBottom: 110 },
  notificationCard: { padding: 14, borderRadius: 17, flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderWidth: 1, borderColor: colors.border },

  /* Currency & local prices */
  currencyContent: { paddingBottom: 112, gap: 20, backgroundColor: '#fbfbfb' },
  currencyHero: { padding: 20, gap: 7, backgroundColor: '#29110f' },
  currencyEyebrow: { color: '#e8b7b2', fontSize: 11, fontWeight: '900', letterSpacing: 1.1 },
  currencyTitle: { color: colors.surface, fontSize: 27, fontWeight: '900' },
  currencySubtitle: { color: '#f1d9d7', fontSize: 13, lineHeight: 20, fontWeight: '600' },
  currencySection: { paddingHorizontal: 16, gap: 10 },
  currencyUpdated: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  currencySectionHint: { color: colors.muted, fontSize: 12, lineHeight: 18, fontWeight: '600' },
  converterCard: { padding: 15, gap: 9, borderRadius: 19, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  converterInputRow: { gap: 10 },
  converterInput: { height: 52, paddingHorizontal: 14, borderRadius: 14, color: colors.text, fontSize: 22, fontWeight: '900', fontVariant: ['tabular-nums'], backgroundColor: '#f6f6f6', borderWidth: 1, borderColor: colors.border },
  currencyCodeRow: { gap: 7, paddingRight: 8 },
  currencyCode: { minWidth: 52, height: 34, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: colors.surfaceAlt },
  currencyCodeActive: { backgroundColor: colors.primary },
  currencyCodeText: { color: colors.muted, fontSize: 11, fontWeight: '900' },
  currencyCodeTextActive: { color: colors.surface },
  converterEquals: { color: colors.muted, fontSize: 14, fontWeight: '900' },
  converterResult: { color: colors.primary, fontSize: 28, fontWeight: '900', fontVariant: ['tabular-nums'] },
  converterRate: { color: colors.muted, fontSize: 11, lineHeight: 16, fontWeight: '600' },
  banknoteRail: { gap: 12, paddingRight: 16 },
  banknoteCard: { width: 330, gap: 8 },
  banknoteImageFrame: { width: 330, height: 310, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: '#111111', borderWidth: 1, borderColor: colors.border },
  banknoteImage: { width: '100%', height: '100%' },
  banknoteZoomHint: { position: 'absolute', right: 10, bottom: 10, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.72)' },
  banknoteZoomText: { color: colors.surface, fontSize: 10, fontWeight: '900' },
  banknoteModalBackdrop: { flex: 1, paddingHorizontal: 12, paddingVertical: 56, alignItems: 'center', justifyContent: 'center', gap: 14, backgroundColor: 'rgba(0,0,0,0.96)' },
  banknoteModalClose: { position: 'absolute', top: 48, right: 18, width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.16)' },
  banknoteModalImage: { width: '100%', height: '72%' },
  banknoteModalTitle: { color: colors.surface, fontSize: 22, fontWeight: '900', fontVariant: ['tabular-nums'] },
  banknoteModalHint: { color: '#cfcfcf', fontSize: 12, fontWeight: '700' },
  banknote: { width: 238, height: 116, overflow: 'hidden', padding: 10, borderRadius: 12, borderWidth: 2, flexDirection: 'row', alignItems: 'center' },
  banknoteSeal: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 2, backgroundColor: 'rgba(255,255,255,0.28)' },
  banknoteSealText: { fontSize: 13, fontWeight: '900' },
  banknoteCenter: { flex: 1, alignItems: 'center', gap: 3 },
  banknoteCountry: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  banknoteValue: { fontSize: 24, fontWeight: '900', fontVariant: ['tabular-nums'] },
  banknoteLabel: { fontSize: 9, fontWeight: '800' },
  banknoteCorner: { fontSize: 22, fontWeight: '900' },
  banknotePattern: { position: 'absolute', right: -22, bottom: -35, width: 92, height: 92, borderRadius: 46, borderWidth: 8, opacity: 0.18 },
  banknoteCardValue: { color: colors.text, fontSize: 13, fontWeight: '900' },
  moneyTipCard: { marginHorizontal: 16, padding: 14, borderRadius: 17, flexDirection: 'row', alignItems: 'flex-start', gap: 11, backgroundColor: colors.primarySoft },
  priceCityHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  cityPricePill: { maxWidth: 145, paddingHorizontal: 9, paddingVertical: 7, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.primarySoft },
  cityPriceText: { flexShrink: 1, color: colors.primary, fontSize: 10, fontWeight: '900' },
  priceTabRow: { gap: 7, paddingRight: 12 },
  priceTab: { height: 36, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  priceTabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  priceTabText: { color: colors.muted, fontSize: 11, fontWeight: '900' },
  priceTabTextActive: { color: colors.surface },
  priceList: { gap: 8 },
  priceRowCard: { minHeight: 78, padding: 12, borderRadius: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  priceTitle: { color: colors.text, fontSize: 13, lineHeight: 18, fontWeight: '900' },
  priceDetail: { color: colors.muted, fontSize: 10, lineHeight: 15, fontWeight: '600' },
  priceSource: { color: colors.primary, fontSize: 9, lineHeight: 14, fontWeight: '700' },
  priceValue: { maxWidth: 90, color: colors.text, fontSize: 12, fontWeight: '900', textAlign: 'right', fontVariant: ['tabular-nums'] },
  currencySafetyCard: { marginHorizontal: 16, padding: 14, borderRadius: 17, flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#fed7aa' },

  /* AI v2 */
  aiWelcomeCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15, borderRadius: 18, backgroundColor: colors.primarySoft },
  aiOrb: { width: 50, height: 50, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  aiWelcomeTitle: { color: colors.text, fontSize: 18, fontWeight: '900' },
  aiToolRail: { gap: 9, paddingRight: 12 },
  aiToolCard: { width: 112, minHeight: 96, padding: 12, gap: 9, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  aiToolLabel: { color: colors.text, fontSize: 12, lineHeight: 16, fontWeight: '900' },
  aiModesRow: { flexDirection: 'row', gap: 10 },
  aiModeCard: { flex: 1, padding: 14, gap: 5, borderRadius: 17, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  aiModeTitle: { color: colors.text, fontSize: 14, fontWeight: '900' },
  aiVoiceButton: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft },
  aiToolkitHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  aiToolkitCount: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  aiToolkitCountText: { color: colors.surface, fontSize: 14, fontWeight: '900', fontVariant: ['tabular-nums'] },
  aiFeatureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  aiFeatureCard: { width: '48.4%', minHeight: 166, padding: 13, gap: 8, borderRadius: 18, borderCurve: 'continuous', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, boxShadow: '0 5px 18px rgba(61,22,22,0.06)' },
  aiFeatureIcon: { width: 42, height: 42, borderRadius: 14, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center' },
  aiFeatureCardTitle: { color: colors.text, fontSize: 14, lineHeight: 18, fontWeight: '900' },
  aiFeatureCardDescription: { minHeight: 34, color: colors.muted, fontSize: 11, lineHeight: 16, fontWeight: '600' },
  aiFeatureOpen: { paddingTop: 2, flexDirection: 'row', alignItems: 'center', gap: 3 },
  aiFeatureOpenText: { color: colors.primary, fontSize: 11, fontWeight: '900' },
  aiFeatureModalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(25,10,10,0.52)' },
  aiFeatureModalDismiss: { flex: 1 },
  aiFeatureSheet: { maxHeight: '86%', minHeight: 430, paddingTop: 8, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderCurve: 'continuous', backgroundColor: colors.background },
  aiFeatureHandle: { width: 42, height: 5, alignSelf: 'center', borderRadius: 99, backgroundColor: '#d1c5c5' },
  aiFeatureSheetHeader: { paddingHorizontal: 18, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 11, borderBottomWidth: 1, borderBottomColor: colors.border },
  aiFeatureSheetTitle: { color: colors.text, fontSize: 19, lineHeight: 24, fontWeight: '900' },
  aiFeatureClose: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  aiFeatureSheetScroll: { padding: 18, paddingBottom: 34 },
  aiFeatureBody: { gap: 13 },
  aiFeatureLead: { color: colors.text, fontSize: 17, lineHeight: 23, fontWeight: '900' },
  aiFeatureCaption: { color: colors.muted, fontSize: 12, lineHeight: 18, fontWeight: '600', textAlign: 'center' },
  aiFeatureLabel: { color: colors.text, fontSize: 12, lineHeight: 16, fontWeight: '900' },
  aiFeatureInput: { minHeight: 50, paddingHorizontal: 14, borderRadius: 15, borderCurve: 'continuous', color: colors.text, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, fontSize: 14, fontWeight: '700' },
  aiPromptWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  aiPromptChip: { minHeight: 38, paddingHorizontal: 12, paddingVertical: 9, justifyContent: 'center', borderRadius: 13, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  aiPromptChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  aiPromptText: { color: colors.text, fontSize: 11, lineHeight: 16, fontWeight: '800' },
  aiPromptTextActive: { color: colors.surface },
  aiInsightCard: { padding: 14, flexDirection: 'row', alignItems: 'center', gap: 11, borderRadius: 17, borderCurve: 'continuous', backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' },
  aiVoiceBody: { alignItems: 'center', paddingVertical: 12 },
  aiVoiceOrbLarge: { width: 96, height: 96, marginBottom: 8, borderRadius: 34, alignItems: 'center', justifyContent: 'center', backgroundColor: '#db2777', boxShadow: '0 10px 30px rgba(219,39,119,0.28)' },
  aiVoiceOrbListening: { backgroundColor: colors.primary, transform: [{ scale: 1.06 }] },
  aiVoiceStart: { minWidth: 170, minHeight: 48, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: '#db2777' },
  aiVoiceStop: { backgroundColor: colors.primary },
  aiVoiceStartText: { color: colors.surface, fontSize: 14, fontWeight: '900' },
  aiCameraPreview: { height: 210, alignItems: 'center', justifyContent: 'center', gap: 14, overflow: 'hidden', borderRadius: 22, borderCurve: 'continuous', backgroundColor: '#171717', borderWidth: 2, borderColor: '#67e8f9' },
  aiCameraHint: { color: colors.surface, fontSize: 12, fontWeight: '800' },
  aiLiveCameraWrap: { height: 360, overflow: 'hidden', borderRadius: 22, borderCurve: 'continuous', backgroundColor: '#050505' },
  aiLiveCamera: { flex: 1 },
  aiCameraGuide: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: 'rgba(0,0,0,0.08)' },
  aiCameraControls: { position: 'absolute', left: 18, right: 18, bottom: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  aiCameraControlButton: { width: 46, height: 46, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.58)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.45)' },
  aiCameraShutter: { width: 72, height: 72, borderRadius: 99, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.28)', borderWidth: 3, borderColor: colors.surface },
  aiCameraShutterCore: { width: 54, height: 54, borderRadius: 99, backgroundColor: colors.surface },
  aiCapturedImage: { width: '100%', height: 260, borderRadius: 22, borderCurve: 'continuous', backgroundColor: '#171717' },
  aiVisionLoading: { minHeight: 58, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 11, borderRadius: 16, backgroundColor: colors.primarySoft },
  aiVisionError: { padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 16, backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca' },
  aiVisionResult: { gap: 11, padding: 15, borderRadius: 19, borderCurve: 'continuous', backgroundColor: colors.surface, borderWidth: 1, borderColor: '#bbf7d0' },
  aiVisionResultHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  aiVisionSummary: { color: colors.text, fontSize: 13, lineHeight: 20, fontWeight: '700' },
  aiVisionSection: { gap: 5, padding: 12, borderRadius: 14, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  aiVisionText: { color: colors.text, fontSize: 12, lineHeight: 19, fontWeight: '700' },
  aiPrivacyNote: { color: colors.muted, fontSize: 10, lineHeight: 15, fontWeight: '600', textAlign: 'center' },
  aiResultCard: { padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 16, borderCurve: 'continuous', backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: '#fecaca' },
  aiReplyingBubble: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  aiResultText: { flex: 1, color: colors.text, fontSize: 12, lineHeight: 19, fontWeight: '700' },
  aiExpenseSummary: { padding: 16, gap: 4, borderRadius: 19, borderCurve: 'continuous', backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0' },
  aiExpenseTotal: { color: '#15803d', fontSize: 27, lineHeight: 34, fontWeight: '900', fontVariant: ['tabular-nums'] },
  aiExpenseRow: { minHeight: 48, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  aiWeatherHero: { padding: 15, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, borderCurve: 'continuous', backgroundColor: '#fefce8', borderWidth: 1, borderColor: '#fde68a' },
  aiAdviceRow: { minHeight: 54, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 15, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  aiSafetyAlert: { padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 11, borderRadius: 17, borderCurve: 'continuous', backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca' },
  aiEmergencyGrid: { flexDirection: 'row', gap: 8 },
  aiEmergencyCard: { flex: 1, paddingVertical: 14, alignItems: 'center', gap: 3, borderRadius: 15, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  aiEmergencyNumber: { color: '#dc2626', fontSize: 20, lineHeight: 25, fontWeight: '900', fontVariant: ['tabular-nums'] },
  aiLocalRow: { minHeight: 72, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },

  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  emptyIcon: {
    height: 64, width: 64, borderRadius: 16, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  emptyBody: { color: colors.muted, fontSize: 13, fontWeight: '600', textAlign: 'center' },

  // WordPress News Section & Modal Styles
  newsTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  newsTitleIconWrap: { width: 28, height: 28, borderRadius: 9, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  newsSubtext: { color: colors.muted, fontSize: 11, fontWeight: '600', marginTop: 2 },
  newsHeaderActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  newsIconButton: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  newsConfigChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primary + '30' },
  newsConfigChipText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  newsErrorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, marginHorizontal: 16, borderRadius: 12, backgroundColor: '#fef3c7', borderWidth: 1, borderColor: '#fde047' },
  newsErrorText: { color: '#92400e', fontSize: 12, fontWeight: '600', flex: 1 },
  newsLoadingRail: { paddingVertical: 24, alignItems: 'center', justifyContent: 'center', gap: 8 },
  newsLoadingText: { color: colors.muted, fontSize: 12, fontWeight: '600' },

  v2NewsCard: { width: 240, borderRadius: 18, borderCurve: 'continuous', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' },
  v2NewsImage: { width: '100%', height: 130, backgroundColor: colors.border },
  v2NewsBadge: { position: 'absolute', top: 10, left: 10, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.65)' },
  v2NewsBadgeText: { color: colors.surface, fontSize: 10, fontWeight: '800' },
  v2NewsBody: { padding: 12, gap: 6 },
  v2NewsTitle: { color: colors.text, fontSize: 14, lineHeight: 18, fontWeight: '800' },
  v2NewsExcerpt: { color: colors.muted, fontSize: 12, lineHeight: 16, fontWeight: '500' },
  v2NewsMetaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, paddingTop: 6, borderTopWidth: 1, borderTopColor: colors.border },
  v2NewsMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  v2NewsMetaText: { color: colors.muted, fontSize: 11, fontWeight: '600' },
  v2NewsReadTime: { color: colors.primary, fontSize: 11, fontWeight: '800' },

  newsModalSafeArea: { flex: 1, backgroundColor: colors.background },
  newsModalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.surface },
  newsModalCloseBtn: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  newsModalTabSwitcher: { flexDirection: 'row', backgroundColor: colors.background, borderRadius: 12, padding: 3, borderWidth: 1, borderColor: colors.border },
  newsModalTab: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 9 },
  newsModalTabActive: { backgroundColor: colors.primary },
  newsModalTabText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  newsModalTabTextActive: { color: colors.surface, fontWeight: '900' },

  newsReaderContent: { padding: 20, gap: 14 },
  newsReaderHeroImg: { width: '100%', height: 220, borderRadius: 18, borderCurve: 'continuous', backgroundColor: colors.border },
  newsReaderCategoryWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  newsReaderCategory: { color: colors.primary, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  newsReaderDot: { color: colors.muted, fontSize: 12 },
  newsReaderReadTime: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  newsReaderTitle: { color: colors.text, fontSize: 22, lineHeight: 28, fontWeight: '900' },
  newsReaderMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  newsReaderMetaText: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  newsReaderDivider: { height: 1, backgroundColor: colors.border, marginVertical: 4 },
  newsReaderBody: { color: colors.text, fontSize: 15, lineHeight: 24, fontWeight: '500' },
  newsReaderCtaBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, backgroundColor: colors.primary, marginTop: 12 },
  newsReaderCtaText: { color: colors.surface, fontSize: 14, fontWeight: '800' },
  newsWebLoading: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },

  wpConfigModalBox: { width: '90%', maxWidth: 440, padding: 20, borderRadius: 22, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, gap: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalHeaderTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  wpConfigDesc: { color: colors.muted, fontSize: 13, lineHeight: 18, fontWeight: '500' },
  wpSheetBox: { padding: 12, borderRadius: 14, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primary + '30', gap: 8 },
  wpSheetHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  wpSheetTitle: { color: colors.text, fontSize: 13, fontWeight: '800' },
  wpSheetLinkBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: colors.surface },
  wpSheetLinkText: { color: colors.primary, fontSize: 11, fontWeight: '700' },
  wpSyncSheetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 10, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  wpSyncSheetBtnText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  wpSheetCategoryNotice: { color: colors.muted, fontSize: 12, fontWeight: '600', marginTop: 2 },
  wpConfigLabel: { color: colors.text, fontSize: 13, fontWeight: '800' },
  wpConfigInput: { height: 48, paddingHorizontal: 14, borderRadius: 12, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, color: colors.text, fontSize: 14, fontWeight: '600' },
  wpPresetRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  wpPresetLabel: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  wpPresetChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primary + '30' },
  wpPresetChipText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  wpModalActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 10, marginTop: 6 },
  wpCancelBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  wpCancelText: { color: colors.text, fontSize: 13, fontWeight: '700' },
  wpSaveBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12, backgroundColor: colors.primary },
  wpSaveText: { color: colors.surface, fontSize: 13, fontWeight: '800' },

  newsTabsRail: { flexDirection: 'row', gap: 8, paddingHorizontal: 4, marginBottom: 12 },
  newsTabChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  newsTabChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  newsTabChipText: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  newsTabChipTextActive: { color: colors.surface, fontWeight: '800' },

  newsLoadMoreCard: { width: 140, minHeight: 210, padding: 14, borderRadius: 20, borderCurve: 'continuous', backgroundColor: colors.primarySoft, borderWidth: 1, borderColor: colors.primary + '30', alignItems: 'center', justifyContent: 'center', gap: 8 },
  newsLoadMoreIconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  newsLoadMoreTitle: { color: colors.text, fontSize: 13, fontWeight: '800', textAlign: 'center' },
  newsLoadMoreSub: { color: colors.primary, fontSize: 11, fontWeight: '700', textAlign: 'center' },
});
