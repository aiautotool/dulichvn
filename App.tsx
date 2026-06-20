import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as MailComposer from 'expo-mail-composer';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import {
  ArrowLeft,
  Bell,
  BookOpen,
  Bookmark,
  Bot,
  CalendarCheck,
  Camera,
  Check,
  ChevronRight,
  Clock,
  Coffee,
  Compass,
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
  Phone,
  Plane,
  Plus,
  Search as SearchIcon,
  Send,
  Settings as SettingsIcon,
  Share2,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  Star,
  Trash2,
  TreePine,
  Type,
  User,
  UserCircle,
  Utensils,
  Volume2,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  ImageSourcePropType,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

WebBrowser.maybeCompleteAuthSession();

/* ============================================================
 *  Domain types
 * ============================================================ */

type Locale = 'en' | 'vi';
type Language = 'English' | 'Vietnamese';
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
  | 'Other';

type TabId =
  | 'home'
  | 'explore'
  | 'place_detail'
  | 'food'
  | 'food_detail'
  | 'culture'
  | 'phrases'
  | 'emergency'
  | 'ai'
  | 'itinerary_preview'
  | 'itinerary_pdf'
  | 'favorites'
  | 'history'
  | 'account'
  | 'search'
  | 'settings'
  | 'language'
  | 'filter'
  | 'map'
  | 'offline';

type SavedItemType = 'place' | 'food' | 'phrase' | 'culture';

type UserProfile = {
  language: Language;
  purpose: Purpose;
  currentCity: City;
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
};

type RecentSearch = {
  id: string;
  query: string;
  timestamp: string;
};

const SETTINGS_VERSION = '1.0.0';

const PROFILE_KEY = 'vinago-plus-profile';
const FAVORITES_KEY = 'vinago-plus-favorites';
const AUTH_SESSION_KEY = 'vinago-plus-auth-session';
const ACTIVITY_HISTORY_KEY = 'vinago-plus-activity-history';
const ANALYTICS_QUEUE_KEY = 'vinago-plus-analytics-queue';
const RECENT_SEARCHES_KEY = 'vinago-plus-recent-searches';
const SETTINGS_KEY = 'vinago-plus-settings';

const ACTIVITY_HISTORY_LIMIT = 80;
const RECENT_SEARCHES_LIMIT = 8;
const APP_SCHEME = 'vinagoplus';

const FIREBASE_ANDROID_CLIENT_ID =
  '959396812028-kebdshs109pum50s7of7eqe27odlgh3l.apps.googleusercontent.com';
const FIREBASE_WEB_CLIENT_ID =
  '959396812028-5uedsvgcclv8ngjs97enll5tlmld45oa.apps.googleusercontent.com';

const googleOAuthConfig = {
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? FIREBASE_WEB_CLIENT_ID,
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? FIREBASE_ANDROID_CLIENT_ID,
  iosClientId:
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ??
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ??
    FIREBASE_WEB_CLIENT_ID,
};

const itineraryEmailEndpoint = process.env.EXPO_PUBLIC_ITINERARY_EMAIL_ENDPOINT;

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

const languages: Language[] = ['English', 'Vietnamese'];
const localeByLanguage: Record<Language, Locale> = {
  English: 'en',
  Vietnamese: 'vi',
};
const languageLabels: Record<Language, string> = {
  English: 'English',
  Vietnamese: 'Tiếng Việt',
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
  'Other',
];

const onboardingCities: City[] = [
  'TP. Hồ Chí Minh',
  'Hà Nội',
  'Đà Nẵng',
  'Hội An',
  'Huế',
  'Nha Trang',
  'Đà Lạt',
  'Other',
];

const defaultProfile: UserProfile = {
  language: 'English',
  purpose: 'Travel',
  currentCity: 'TP. Hồ Chí Minh',
  tripDays: 3,
};

const defaultSettings: SettingsState = {
  themeMode: 'light',
  notificationsEnabled: true,
  measurementUnit: 'metric',
  fontScale: 1,
  appVersion: SETTINGS_VERSION,
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
    'onboarding.cityTitle': 'Which city will you visit?',
    'onboarding.daysTitle': 'How many days are you staying?',
    'onboarding.tripDays': 'days',
    'onboarding.start': 'Start exploring',

    /* Bottom nav */
    'nav.explore': 'Explore',
    'nav.favorites': 'Favorites',
    'nav.history': 'History',
    'nav.account': 'Account',

    /* Top bar */
    'topbar.welcomeBack': 'Welcome back',
    'topbar.search': 'Search',

    /* Search */
    'search.title': 'Search',
    'search.placeholder': 'Search places, food, phrases...',
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
    'home.greeting': 'Hello',
    'home.discoverTitle': 'Discover Vietnam',
    'home.searchPlaceholder': 'Search places, food, phrases...',
    'home.quick.all': 'All',
    'home.quick.food': 'Food',
    'home.quick.stay': 'Stay',
    'home.quick.transport': 'Transport',
    'home.popularTitle': 'Popular destinations',
    'home.popularViewAll': 'View all',
    'home.experiencesTitle': 'Travel experiences you may enjoy',
    'home.nearbyTitle': 'Travel experiences you may enjoy',

    /* Explore / Place */
    'explore.title': 'Destinations',
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
    'account.verified': 'Verified',
    'account.unverified': 'Unverified',

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
    'onboarding.cityTitle': 'Bạn sẽ đến thăm thành phố nào?',
    'onboarding.daysTitle': 'Bạn dự định ở bao nhiêu ngày?',
    'onboarding.tripDays': 'ngày / days',
    'onboarding.start': 'Bắt đầu',

    'nav.explore': 'Khám phá',
    'nav.favorites': 'Yêu thích',
    'nav.history': 'Lịch sử',
    'nav.account': 'Tài khoản',

    'topbar.welcomeBack': 'Chào mừng trở lại',
    'topbar.search': 'Tìm kiếm',

    'search.title': 'Tìm kiếm',
    'search.placeholder': 'Tìm địa điểm, món ăn, câu giao tiếp...',
    'search.recent': 'Tìm kiếm gần đây',
    'search.suggestions': 'Gợi ý',
    'search.popularPlaces': 'Địa điểm phổ biến',
    'search.popularFoods': 'Món ăn phổ biến',
    'search.allResults': 'Tất cả kết quả',
    'search.noResults': 'Không tìm thấy kết quả',
    'search.noResultsBody': 'Hãy thử một từ khóa khác.',
    'search.clearAll': 'Xóa tất cả',
    'search.related': 'Liên quan',

    'home.greeting': 'Xin chào',
    'home.discoverTitle': 'Khám phá Việt Nam',
    'home.searchPlaceholder': 'Tìm địa điểm, món ăn, câu giao tiếp...',
    'home.quick.all': 'Tất cả',
    'home.quick.food': 'Món ăn',
    'home.quick.stay': 'Lưu trú',
    'home.quick.transport': 'Di chuyển',
    'home.popularTitle': 'Địa điểm nổi bật',
    'home.popularViewAll': 'Xem tất cả',
    'home.experiencesTitle': 'Trải nghiệm không thể bỏ lỡ',
    'home.nearbyTitle': 'Trải nghiệm không thể bỏ lỡ',

    'explore.title': 'Địa điểm',
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
    'account.verified': 'Đã xác minh',
    'account.unverified': 'Chưa xác minh',

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

    'auth.signIn': 'Tiếp tục với Google',
    'auth.signingIn': 'Đang mở Google...',
    'auth.signOut': 'Đăng xuất',
  },
} as Record<Locale, Record<string, string>>;

type TranslationKey = keyof typeof translations.en;
type Translations = Record<string, string>;

function getLocale(language: Language): Locale {
  return localeByLanguage[language] ?? 'en';
}

function translate(locale: Locale, key: TranslationKey): string {
  const dictionary = translations[locale] as Record<string, string | undefined>;
  return dictionary[key] ?? translations.en[key] ?? (key as string);
}

/* ============================================================
 *  Static catalogs
 * ============================================================ */

const places: Place[] = [
  {
    id: 'ha_long_bay',
    name: 'Ha Long Bay',
    city: 'Hạ Long',
    category: 'Bay',
    description:
      'Vịnh Hạ Long — Di sản thiên nhiên thế giới UNESCO với hàng nghìn đảo đá vôi, hang động và làng chài nổi tiếng.',
    history:
      'Vịnh Hạ Long là một trong những địa danh tự nhiên nổi tiếng nhất Việt Nam, được UNESCO công nhận là Di sản Thiên nhiên Thế giới.',
    bestTime: 'Tháng 4 - Tháng 10',
    ticketPrice: 'Bao gồm vé tham quan: 1 - 2 triệu',
    openHours: 'Theo lịch tàu',
    lat: 20.91,
    lng: 107.183,
    tags: ['Di sản UNESCO', 'Đã lưu'],
    whyGo: 'Là cảnh quan biển đặc trưng của Việt Nam, lý tưởng cho du thuyền qua đêm hoặc trong ngày.',
    travelTip: 'Nên chọn tuyến Lan Hạ thay vì tuyến Hạ Long chính nếu muốn yên tĩnh hơn.',
    image: require('./assets/photos/ha-long-bay.jpg'),
  },
  {
    id: 'pho_co_hanoi',
    name: 'Hà Nội Phố Cổ',
    city: 'Hà Nội',
    category: 'Khu phố',
    description:
      'Phố cổ Hà Nội với 36 phố phường, ẩm thực đường phố và các cửa hàng thủ công truyền thống.',
    history: 'Khu phố cổ hình thành từ thế kỷ 11, gắn liền với các phường nghề truyền thống.',
    bestTime: 'Sáng sớm hoặc chiều tối',
    ticketPrice: 'Miễn phí',
    openHours: 'Cả ngày',
    lat: 21.035,
    lng: 105.852,
    tags: ['Ẩm thực', 'Đi bộ', 'Lịch sử'],
    whyGo: 'Cách trực tiếp nhất để cảm nhận nhịp sống thường ngày của Hà Nội.',
    travelTip: 'Dùng Hồ Gươm làm mốc định hướng vì các ngõ có thể gây rối.',
    image: require('./assets/photos/hoan-kiem-lake.jpg'),
  },
  {
    id: 'hoan_kiem_lake',
    name: 'Hồ Gươm',
    city: 'Hà Nội',
    category: 'Hồ',
    description: 'Trái tim của Hà Nội với Tháp Rùa, đền Ngọc Sơn và không gian đi bộ quanh hồ.',
    history: 'Gắn liền với truyền thuyết Lê Lợi trả gươm thần, là biểu tượng lịch sử của thủ đô.',
    bestTime: 'Sáng sớm hoặc chiều tối',
    ticketPrice: 'Miễn phí',
    openHours: 'Cả ngày',
    lat: 21.028,
    lng: 105.852,
    tags: ['Lịch sử', 'Đi bộ', 'Phố cổ'],
    whyGo: 'Điểm khởi đầu thuận tiện nhất để hiểu về trung tâm Hà Nội.',
    travelTip: 'Đi bộ quanh hồ theo chiều kim đồng hồ và thử cà phê trứng gần đó.',
    image: require('./assets/photos/hoan-kiem-lake.jpg'),
  },
  {
    id: 'hoi_an',
    name: 'Hội An',
    city: 'Hội An',
    category: 'Di sản',
    description: 'Phố cổ Hội An với đèn lồng, kiến trúc Pháp - Hoa - Việt và ẩm thực đặc sắc.',
    history: 'Thương cảng quốc tế từ thế kỷ 16-17, nay là Di sản UNESCO.',
    bestTime: 'Chiều tối khi đèn lồng lên',
    ticketPrice: 'Vé vào phố cổ',
    openHours: 'Cả ngày',
    lat: 15.8801,
    lng: 108.338,
    tags: ['Di sản UNESCO', 'Đèn lồng', 'Ẩm thực'],
    whyGo: 'Phố cổ ven sông đẹp nhất Việt Nam, đặc biệt về đêm.',
    travelTip: 'Mua vé tham quan các di tích trước 17h để tiết kiệm.',
    image: require('./assets/photos/hoi-an-ancient-town.jpg'),
  },
  {
    id: 'da_nang',
    name: 'Đà Nẵng',
    city: 'Đà Nẵng',
    category: 'Thành phố biển',
    description: 'Thành phố biển hiện đại với Bà Nà Hills, Ngũ Hành Sơn và bãi biển Mỹ Khê.',
    history: 'Từng là thương cảng nhỏ, nay là đô thị lớn nhất miền Trung.',
    bestTime: 'Tháng 3 - Tháng 8',
    ticketPrice: 'Miễn phí (vé Bà Nà riêng)',
    openHours: 'Cả ngày',
    lat: 16.054,
    lng: 108.202,
    tags: ['Biển', 'Hiện đại', 'Bà Nà'],
    whyGo: 'Kết hợp biển, núi và đô thị trong một thành phố.',
    travelTip: 'Thuê xe máy để khám phá Ngũ Hành Sơn và bãi biển.',
    image: require('./assets/photos/my-khe-beach.jpg'),
  },
  {
    id: 'ba_na_hills',
    name: 'Bà Nà Hills',
    city: 'Đà Nẵng',
    category: 'Khu du lịch',
    description: 'Khu nghỉ dưỡng trên núi với Cầu Vàng nổi tiếng, làng Pháp và khí hậu mát mẻ.',
    history: 'Được người Pháp phát hiện từ đầu thế kỷ 20, nay là điểm đến hàng đầu miền Trung.',
    bestTime: 'Sáng sớm để tránh đông',
    ticketPrice: '900.000 VND',
    openHours: '8:00 - 22:00',
    lat: 15.997,
    lng: 107.987,
    tags: ['Cầu Vàng', 'Núi', 'Làng Pháp'],
    whyGo: 'Trải nghiệm bốn mùa trong một ngày và Cầu Vàng biểu tượng.',
    travelTip: 'Đi cáp treo sớm để tránh xếp hàng.',
    image: require('./assets/photos/my-khe-beach.jpg'),
  },
  {
    id: 'hue',
    name: 'Huế',
    city: 'Huế',
    category: 'Di sản',
    description: 'Cố đô với Hoàng thành, lăng tẩm vua Nguyễn và sông Hương thơ mộng.',
    history: 'Kinh đô triều Nguyễn từ 1802 - 1945, là Di sản UNESCO.',
    bestTime: 'Sáng sớm',
    ticketPrice: 'Vé vào Hoàng thành',
    openHours: '7:00 - 17:30',
    lat: 16.469,
    lng: 107.578,
    tags: ['Di sản UNESCO', 'Hoàng gia', 'Lịch sử'],
    whyGo: 'Cần thiết để hiểu về Việt Nam hoàng gia và bản sắc miền Trung.',
    travelTip: 'Nên thuê hướng dẫn viên vì quần thể rất rộng.',
    image: require('./assets/photos/hue-imperial-city.jpg'),
  },
  {
    id: 'phu_quoc',
    name: 'Phú Quốc',
    city: 'TP. Hồ Chí Minh',
    category: 'Đảo',
    description: 'Đảo ngọc với bãi biển cát trắng, nước biển trong xanh và hoàng hôn đẹp nhất Việt Nam.',
    history: 'Đảo lớn nhất Việt Nam, thuộc tỉnh Kiên Giang.',
    bestTime: 'Tháng 11 - Tháng 4',
    ticketPrice: 'Miễn phí (vé tàu riêng)',
    openHours: 'Cả ngày',
    lat: 10.289,
    lng: 103.984,
    tags: ['Biển', 'Đảo', 'Hoàng hôn'],
    whyGo: 'Hoàng hôn đẹp nhất Việt Nam và resort đẳng cấp quốc tế.',
    travelTip: 'Đặt tàu trước vào mùa cao điểm.',
    image: require('./assets/photos/phu-quoc-beach.jpg'),
  },
  {
    id: 'ben_thanh',
    name: 'Chợ Bến Thành',
    city: 'TP. Hồ Chí Minh',
    category: 'Chợ',
    description: 'Chợ biểu tượng của Sài Gòn với đồ ăn địa phương, quà lưu niệm và vải vóc.',
    history: 'Tòa nhà chợ hiện tại mở cửa đầu thế kỷ 20, là biểu tượng dân sự của Sài Gòn.',
    bestTime: 'Sáng cho quầy ăn, chiều cho không khí',
    ticketPrice: 'Miễn phí',
    openHours: '7:00 - 19:00',
    lat: 10.772,
    lng: 106.698,
    tags: ['Mua sắm', 'Ẩm thực', 'Văn hóa'],
    whyGo: 'Cách gọn nhất để xem ẩm thực, vải vóc và quà lưu niệm trong một nơi.',
    travelTip: 'Mặc cả giá cho quà lưu niệm, không mặc cả ở quán ăn.',
    image: require('./assets/photos/ben-thanh-market.jpg'),
  },
  {
    id: 'sapa',
    name: 'Sa Pa',
    city: 'Hà Nội',
    category: 'Núi',
    description: 'Thị trấn cao nguyên với ruộng bậc thang, làng dân tộc và khí hậu mát mẻ.',
    history: 'Phát triển như một điểm nghỉ dưỡng vùng cao, nay là cửa ngõ vào văn hóa Tây Bắc.',
    bestTime: 'Tháng 9 (lúa chín) hoặc mùa xuân',
    ticketPrice: 'Phí làng/trekking khác nhau',
    openHours: 'Cả ngày',
    lat: 22.337,
    lng: 103.844,
    tags: ['Trekking', 'Ruộng bậc thang', 'Cao nguyên'],
    whyGo: 'Ruộng bậc thang nổi tiếng nhất Việt Nam và văn hóa dân tộc đa dạng.',
    travelTip: 'Mang áo ấm vì đêm có thể lạnh.',
    image: require('./assets/photos/hoan-kiem-lake.jpg'),
  },
  {
    id: 'ninh_binh',
    name: 'Ninh Bình',
    city: 'Hà Nội',
    category: 'Di sản',
    description: 'Quần thể danh thắng Tràng An, Tam Cốc và Bái Đính với núi đá vôi và sông nước.',
    history: 'Cố đô Hoa Lư thế kỷ 10, nay là Di sản UNESCO Tràng An.',
    bestTime: 'Mùa lúa hoặc sáng sớm',
    ticketPrice: 'Vé đò Tam Cốc',
    openHours: '7:00 - 17:00',
    lat: 20.253,
    lng: 105.918,
    tags: ['Di sản UNESCO', 'Đò', 'Núi đá vôi'],
    whyGo: 'Một trong những chuyến đi trong ngày đẹp nhất miền Bắc.',
    travelTip: 'Mang mũ và nước vì đò phơi nắng.',
    image: require('./assets/photos/ha-long-bay.jpg'),
  },
  {
    id: 'phong_nha',
    name: 'Phong Nha - Kẻ Bàng',
    city: 'TP. Hồ Chí Minh',
    category: 'Hang động',
    description: 'Vườn quốc gia với hệ thống hang động lớn nhất thế giới, Di sản UNESCO.',
    history: 'Được khám phá và bảo tồn từ thập niên 1990.',
    bestTime: 'Tháng 4 - Tháng 8',
    ticketPrice: 'Vé vào vườn quốc gia',
    openHours: '6:00 - 22:00',
    lat: 17.591,
    lng: 106.283,
    tags: ['Hang động', 'Di sản UNESCO', 'Thiên nhiên'],
    whyGo: 'Hệ thống hang động lớn nhất thế giới với nhiều tour khám phá.',
    travelTip: 'Đặt tour Sơn Đoòng trước ít nhất 6 tháng.',
    image: require('./assets/photos/phong-nha-cave.jpg'),
  },
  {
    id: 'mui_ne',
    name: 'Mũi Né',
    city: 'TP. Hồ Chí Minh',
    category: 'Biển',
    description: 'Đồi cát trắng, đồi cát đỏ, làng chài và resort ven biển.',
    history: 'Từ làng chài nhỏ thành khu du lịch biển nổi tiếng.',
    bestTime: 'Bình minh',
    ticketPrice: 'Phí tham quan',
    openHours: 'Cả ngày',
    lat: 10.933,
    lng: 108.287,
    tags: ['Đồi cát', 'Bình minh', 'Làng chài'],
    whyGo: 'Cảnh quan sa mạc hiếm hoi tại Việt Nam.',
    travelTip: 'Thỏa thuận giá xe jeep/ATV trước khi đi.',
    image: require('./assets/photos/my-khe-beach.jpg'),
  },
  {
    id: 'nha_trang',
    name: 'Nha Trang',
    city: 'Nha Trang',
    category: 'Biển',
    description: 'Thành phố biển với bãi cát dài, đảo Hòn Mun và các resort cao cấp.',
    history: 'Từng là thương cảng Cham Pa, nay là trung tâm du lịch biển.',
    bestTime: 'Tháng 2 - Tháng 9',
    ticketPrice: 'Miễn phí (vé tàu riêng)',
    openHours: 'Cả ngày',
    lat: 12.238,
    lng: 109.196,
    tags: ['Biển', 'Lặn biển', 'Đảo'],
    whyGo: 'Bãi biển đô thị đẹp nhất Việt Nam với nhiều hoạt động.',
    travelTip: 'Đi Hòn Mun để lặn san hô.',
    image: require('./assets/photos/my-khe-beach.jpg'),
  },
  {
    id: 'da_lat',
    name: 'Đà Lạt',
    city: 'Đà Lạt',
    category: 'Cao nguyên',
    description: 'Thành phố ngàn hoa với khí hậu mát mẻ, biệt thự Pháp và rừng thông.',
    history: 'Được người Pháp xây dựng từ đầu thế kỷ 20 làm nơi nghỉ dưỡng.',
    bestTime: 'Mùa khô (12 - 3)',
    ticketPrice: 'Miễn phí (vé tham quan riêng)',
    openHours: 'Cả ngày',
    lat: 11.94,
    lng: 108.458,
    tags: ['Hoa', 'Cao nguyên', 'Biệt thự Pháp'],
    whyGo: 'Khí hậu mát mẻ quanh năm và phong cảnh lãng mạn.',
    travelTip: 'Mang áo khoác dù đêm lạnh.',
    image: require('./assets/photos/hoan-kiem-lake.jpg'),
  },
  {
    id: 'can_tho',
    name: 'Cần Thơ - Chợ nổi Cái Răng',
    city: 'TP. Hồ Chí Minh',
    category: 'Chợ nổi',
    description: 'Chợ nổi lớn nhất ĐBSCL với ghe thuyền bán trái cây và ẩm thực đặc trưng.',
    history: 'Trung tâm của vùng Đồng bằng sông Cửu Long.',
    bestTime: 'Sáng sớm (5:00 - 7:00)',
    ticketPrice: 'Phí tham quan',
    openHours: 'Sáng sớm',
    lat: 10.05,
    lng: 105.78,
    tags: ['Chợ nổi', 'Sông nước', 'Ẩm thực'],
    whyGo: 'Trải nghiệm chợ nổi độc đáo trên sông.',
    travelTip: 'Đi sớm để thấy cảnh mua bán nhộn nhịp nhất.',
    image: require('./assets/photos/cai-rang-floating-market.jpg'),
  },
];

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
  { id: 'police', titleKey: 'Police', phone: '113', phrase: 'Cho tôi gọi cảnh sát.' },
  { id: 'fire', titleKey: 'Fire', phone: '114', phrase: 'Có cháy, giúp tôi.' },
  { id: 'ambulance', titleKey: 'Ambulance', phone: '115', phrase: 'Tôi cần xe cấp cứu.' },
  { id: 'tourist_police', titleKey: 'Tourist Police', phone: '1800 6118', phrase: '' },
  { id: 'tourist_hotline', titleKey: 'Tourist Hotline', phone: '0588 247 247', phrase: '' },
] as const;

const tripStyles = ['Culture + Food', 'Relaxed', 'Family', 'Business'] as const;
type TripStyle = (typeof tripStyles)[number];

const bottomTabItems: { id: TabId; labelKey: TranslationKey; icon: typeof Home }[] = [
  { id: 'home', labelKey: 'nav.explore' as TranslationKey, icon: Home },
  { id: 'favorites', labelKey: 'nav.favorites' as TranslationKey, icon: Heart },
  { id: 'history', labelKey: 'nav.history' as TranslationKey, icon: HistoryIcon },
  { id: 'account', labelKey: 'nav.account' as TranslationKey, icon: User },
];

const quickQuestions = [
  'Tôi nên đi đâu ở Đà Nẵng 2 ngày?',
  'Bánh mì có cay không?',
  'Làm sao qua đường ở Hà Nội?',
  'Kể về Chợ Bến Thành',
];

const popularPlaceIds = ['ha_long_bay', 'pho_co_hanoi', 'ba_na_hills', 'phu_quoc', 'ben_thanh', 'mui_ne'];
const popularFoodIds = ['pho', 'banh_mi', 'bun_cha', 'com_tam', 'bun_bo_hue'];

/* ============================================================
 *  Pure helpers
 * ============================================================ */

function getWelcomeMessage(locale: Locale): string {
  return locale === 'vi'
    ? 'Chào bạn! Tôi là Vinago+ AI, sẵn sàng giúp bạn khám phá Việt Nam. Bạn muốn đi đâu hôm nay?'
    : "Hi! I'm Vinago+ AI, ready to help you explore Vietnam. Where would you like to go today?";
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

function getEmailDomain(email: string): string {
  return email.split('@')[1] ?? '';
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const [, payload] = token.split('.');
    if (!payload) return {};
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function normalizeGoogleUser(raw: Record<string, unknown>): GoogleUser {
  const email = typeof raw.email === 'string' ? raw.email : '';
  return {
    id: typeof raw.sub === 'string' ? raw.sub : typeof raw.id === 'string' ? raw.id : email,
    email,
    name:
      typeof raw.name === 'string'
        ? raw.name
        : typeof raw.given_name === 'string'
          ? raw.given_name
          : email,
    givenName: typeof raw.given_name === 'string' ? raw.given_name : undefined,
    picture: typeof raw.picture === 'string' ? raw.picture : undefined,
    verifiedEmail: raw.email_verified === true,
  };
}

function buildAiAnswer(
  question: string,
  profile: UserProfile,
  tripDays: number,
  tripStyle: TripStyle,
  locale: Locale,
): string {
  const normalized = question.toLowerCase();
  const matchedPlace = places.find((place) => normalized.includes(place.name.toLowerCase()));
  const matchedFood = foods.find((food) => normalized.includes(food.name.toLowerCase()));

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

  if (/(cross|traffic|street)/.test(normalized)) {
    return locale === 'vi'
      ? 'Khi qua đường ở Việt Nam, hãy bước đều, đi chậm, và tránh dừng đột ngột. Tài xế thường giảm tốc khi thấy bạn đã bắt đầu qua đường.'
      : 'When crossing streets in Vietnam, walk steadily, slowly, and avoid sudden stops. Drivers usually slow down once they see you commit to crossing.';
  }

  if (/(temple|pagoda|chùa)/.test(normalized)) {
    return locale === 'vi'
      ? 'Khi vào chùa, hãy mặc lịch sự, nói nhỏ và tháo mũ. Không chỉ trỏ vào tượng hoặc chạm vào đồ lễ.'
      : 'When visiting temples, dress modestly, speak softly, and remove your hat. Do not point at statues or touch offerings.';
  }

  if (/(bargain|mặc cả|price|giá)/.test(normalized)) {
    return locale === 'vi'
      ? 'Mặc cả phổ biến ở chợ truyền thống nhưng không phổ biến ở siêu thị, quán cà phê hay nhà hàng. Hãy giữ thái độ thân thiện.'
      : 'Bargaining is common in traditional markets, but not in malls, cafes or restaurants. Keep the tone friendly.';
  }

  if (/(itinerary|行程|lịch trình|plan|kế hoạch|days|ngày)/.test(normalized)) {
    const days = tripDays;
    const city = profile.currentCity;
    if (locale === 'vi') {
      return `Lịch trình ${days} ngày tại ${city} (phong cách ${tripStyle}):\n\nNgày 1: Khám phá trung tâm, ăn sáng đặc sản địa phương, tham quan điểm nổi bật.\nNgày 2: Trải nghiệm văn hóa, thử món mới, dạo phố cổ.\n\nLưu ý: Mang theo nước, giày thoải mái và bản đồ offline.`;
    }
    return `${days} day ${tripStyle} itinerary for ${city}:\n\nDay 1: Explore the city center, try a local breakfast and visit a top attraction.\nDay 2: Immerse in culture, try a new dish and walk the old quarter.\n\nTip: Bring water, comfortable shoes and an offline map.`;
  }

  if (/(translate|dịch|번역)/.test(normalized)) {
    return locale === 'vi'
      ? 'Tôi có thể dịch câu ngắn sang tiếng Việt. Hãy thử:\n- "Hello" → "Xin chào"\n- "Thank you" → "Cảm ơn"\n- "How much?" → "Bao nhiêu tiền?"'
      : 'I can translate short phrases to Vietnamese. Try:\n- "Hello" → "Xin chào"\n- "Thank you" → "Cảm ơn"\n- "How much?" → "Bao nhiêu tiền?"';
  }

  if (/(hello|hi|chào|xin chào)/.test(normalized)) {
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
): ItineraryConfirmation {
  const body = buildAiAnswer(prompt, profile, tripDays, tripStyle, locale);
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
    `Here is your Vinago+ itinerary confirmation for ${profile.currentCity}.`,
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
      : `geo:${place.lat},${place.lng}?q=${encodeURIComponent(place.name)}`;
  void Linking.openURL(url).catch(() => {
    void Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`,
    );
  });
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
}: {
  icon: typeof Home;
  onPress: () => void;
  color?: string;
  size?: number;
  style?: object;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.iconButton, style]}>
      <Icon color={color} size={size} />
    </Pressable>
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
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const isWelcome = step === 0;
  const isLanguage = step === 1;
  const isPurpose = step === 2;
  const isCity = step === 3;
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
                    <Text style={styles.languageFlagText}>
                      {language === 'English' ? '🇬🇧' : '🇻🇳'}
                    </Text>
                  </View>
                  <Text style={styles.languageLabel}>{language}</Text>
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
              {purposes.map((purpose) => (
                <ChoiceChip
                  key={purpose}
                  label={purpose}
                  active={draftProfile.purpose === purpose}
                  onPress={() => setDraftProfile((d) => ({ ...d, purpose }))}
                />
              ))}
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
            <Text style={styles.stepSubtitle}>{t('onboarding.daysTitle')}</Text>
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
            <View style={styles.cityList}>
              {onboardingCities.map((city) => (
                <ChoiceChip
                  key={city}
                  label={city}
                  active={draftProfile.currentCity === city}
                  onPress={() => setDraftProfile((d) => ({ ...d, currentCity: city }))}
                />
              ))}
            </View>
            <PrimaryButton label={t('onboarding.start')} onPress={onSave} />
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function HomeScreen({
  profile,
  recentSearches,
  popularPlaces,
  popularFoods,
  onOpenSearch,
  onOpenPlace,
  onOpenFood,
  onOpenFilter,
  t,
}: {
  profile: UserProfile;
  recentSearches: RecentSearch[];
  popularPlaces: Place[];
  popularFoods: Food[];
  onOpenSearch: () => void;
  onOpenPlace: (id: string) => void;
  onOpenFood: (id: string) => void;
  onOpenFilter: () => void;
  t: (key: TranslationKey) => string;
}) {
  const [quickFilter, setQuickFilter] = useState<'all' | 'food' | 'stay' | 'transport'>('all');
  const filteredPlaces = useMemo(() => {
    if (quickFilter === 'food') return [];
    return popularPlaces;
  }, [quickFilter, popularPlaces]);
  const filteredFoods = useMemo(() => {
    if (quickFilter !== 'food') return [];
    return popularFoods;
  }, [quickFilter, popularFoods]);

  return (
    <ScrollView contentContainerStyle={styles.homeContent} showsVerticalScrollIndicator={false}>
      <View style={styles.homeTopRow}>
        <View>
          <Text style={styles.homeGreeting}>{t('home.greeting')} 👋</Text>
          <Text style={styles.homeDiscover}>{t('home.discoverTitle')}</Text>
        </View>
        <IconButton icon={Bell} onPress={() => {}} />
      </View>

      <Pressable style={styles.homeSearchRow} onPress={onOpenSearch}>
        <SearchIcon color={colors.muted} size={18} />
        <Text style={styles.homeSearchText}>{t('home.searchPlaceholder')}</Text>
        <Pressable style={styles.homeFilterButton} onPress={onOpenFilter}>
          <Filter color={colors.surface} size={16} />
        </Pressable>
      </Pressable>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickChipRow}
      >
        {[
          { id: 'all', label: t('home.quick.all'), icon: Compass },
          { id: 'food', label: t('home.quick.food'), icon: Utensils },
          { id: 'stay', label: t('home.quick.stay'), icon: ShoppingBag },
          { id: 'transport', label: t('home.quick.transport'), icon: Plane },
        ].map((chip) => {
          const Icon = chip.icon;
          const active = quickFilter === chip.id;
          return (
            <Pressable
              key={chip.id}
              style={[styles.homeQuickChip, active && styles.homeQuickChipActive]}
              onPress={() => setQuickFilter(chip.id as typeof quickFilter)}
            >
              <Icon color={active ? colors.surface : colors.primary} size={16} />
              <Text
                style={[
                  styles.homeQuickChipText,
                  active && styles.homeQuickChipTextActive,
                ]}
              >
                {chip.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {recentSearches.length > 0 ? (
        <View style={styles.homeSection}>
          <SectionTitle title={t('search.recent')} />
          <View style={styles.recentChipWrap}>
            {recentSearches.slice(0, 5).map((s) => (
              <View key={s.id} style={styles.recentChip}>
                <Clock color={colors.muted} size={13} />
                <Text style={styles.recentChipText}>{s.query}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <View style={styles.homeSection}>
        <View style={styles.homeSectionHeader}>
          <Text style={styles.homeSectionTitle}>{t('home.popularTitle')}</Text>
          <Pressable>
            <Text style={styles.homeSectionLink}>{t('home.popularViewAll')}</Text>
          </Pressable>
        </View>
        {quickFilter === 'food' ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.popularRow}
          >
            {filteredFoods.map((food) => (
              <Pressable
                key={food.id}
                style={styles.popularCard}
                onPress={() => onOpenFood(food.id)}
              >
                <Image source={food.image} style={styles.popularCardImage} />
                <View style={styles.popularCardRating}>
                  <Star color={colors.accent} fill={colors.accent} size={12} />
                  <Text style={styles.popularCardRatingText}>4.9 (210)</Text>
                </View>
                <Text style={styles.popularCardName}>{food.name}</Text>
                <Text style={styles.popularCardSub}>{food.region}</Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.popularGrid}>
            {filteredPlaces.map((place) => (
              <Pressable
                key={place.id}
                style={styles.popularGridCard}
                onPress={() => onOpenPlace(place.id)}
              >
                <Image source={place.image} style={styles.popularGridImage} />
                <Text style={styles.popularGridName}>{place.name}</Text>
                <Text style={styles.popularGridSub}>
                  {place.city} · {place.category}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      <View style={styles.homeSection}>
        <View style={styles.homeSectionHeader}>
          <Text style={styles.homeSectionTitle}>
            {profile.currentCity === 'Other'
              ? t('home.popularTitle')
              : t('home.nearbyTitle')}
          </Text>
        </View>
        <Text style={styles.homeSectionSubtitle}>
          {getExperienceSubtitle(profile.currentCity, getLocale(profile.language))}
        </Text>
        {popularPlaces.length > 0 ? (
          <View style={styles.popularGrid}>
            {popularPlaces.slice(0, 3).map((place) => (
              <Pressable
                key={`nearby-${place.id}`}
                style={styles.popularGridCard}
                onPress={() => onOpenPlace(place.id)}
              >
                <Image source={place.image} style={styles.popularGridImage} />
                <Text style={styles.popularGridName}>{place.name}</Text>
                <Text style={styles.popularGridSub}>
                  {place.city} · {place.category}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

function ExploreScreen({
  places: items,
  selectedCity,
  onCityChange,
  onOpenPlace,
  onOpenFilter,
  t,
}: {
  places: Place[];
  selectedCity: City | 'All';
  onCityChange: (city: City | 'All') => void;
  onOpenPlace: (id: string) => void;
  onOpenFilter: () => void;
  t: (key: TranslationKey) => string;
}) {
  const cityTabs: (City | 'All')[] = ['All', 'Hà Nội', 'Đà Nẵng', 'Hội An', 'Huế', 'Hạ Long', 'Nha Trang', 'Đà Lạt'];
  return (
    <View style={styles.flexOne}>
      <View style={styles.exploreTopRow}>
        <Text style={styles.exploreTitle}>{t('explore.title')}</Text>
        <View style={styles.rowGap}>
          <IconButton icon={Filter} onPress={onOpenFilter} />
          <IconButton icon={SearchIcon} onPress={() => {}} />
        </View>
      </View>
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
      <ScrollView contentContainerStyle={styles.exploreList} showsVerticalScrollIndicator={false}>
        {items.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title={t('explore.noResults')}
            body={t('explore.noResultsBody')}
          />
        ) : (
          items.map((place) => (
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

function PlaceDetailScreen({
  place,
  isFavorite,
  onToggleFavorite,
  onBack,
  onOpenMap,
  onAskAi,
  t,
}: {
  place: Place;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onBack: () => void;
  onOpenMap: () => void;
  onAskAi: () => void;
  t: (key: TranslationKey) => string;
}) {
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
        <Text style={styles.placeDetailName}>{place.name}</Text>
        <Text style={styles.placeDetailSub}>
          {place.city} · {place.category}
        </Text>
        <View style={styles.ratingRow}>
          <Star color={colors.accent} fill={colors.accent} size={14} />
          <Text style={styles.ratingText}>4.8 (212 đánh giá)</Text>
        </View>
        <SectionTitle title={t('place.aboutTitle')} />
        <Text style={styles.bodyText}>{place.description}</Text>
        <SectionTitle title={t('place.whyGoTitle')} />
        <Text style={styles.bodyText}>{place.whyGo}</Text>
        <SectionTitle title={t('place.tagsTitle')} />
        <View style={styles.tagRow}>
          {place.tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
        <SectionTitle title={t('place.tipsTitle')} />
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('place.bestTime')}</Text>
            <Text style={styles.infoValue}>{place.bestTime}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('place.ticket')}</Text>
            <Text style={styles.infoValue}>{place.ticketPrice}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('place.openHours')}</Text>
            <Text style={styles.infoValue}>{place.openHours}</Text>
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

function FoodScreen({
  foods: items,
  onOpenFood,
  t,
}: {
  foods: Food[];
  onOpenFood: (id: string) => void;
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

  return (
    <View style={styles.flexOne}>
      <View style={styles.foodTopRow}>
        <Text style={styles.exploreTitle}>{t('food.title')}</Text>
        <IconButton icon={SearchIcon} onPress={() => {}} />
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
        {filtered.map((food) => (
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
        <Text style={styles.placeDetailName}>{food.name}</Text>
        <Text style={styles.placeDetailSub}>{food.englishName}</Text>
        <View style={styles.ratingRow}>
          <Star color={colors.accent} fill={colors.accent} size={14} />
          <Text style={styles.ratingText}>4.8 (212 đánh giá)</Text>
        </View>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('food.region')}</Text>
            <Text style={styles.infoValue}>{food.region}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('food.spice')}</Text>
            <Text style={styles.infoValue}>
              {food.spicyLevel === 0 ? '—' : `${food.spicyLevel}/3`}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('food.price')}</Text>
            <Text style={styles.infoValue}>{food.priceRange}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>{t('food.pronunciation')}</Text>
            <Text style={styles.infoValue}>{food.pronunciation}</Text>
          </View>
        </View>
        <SectionTitle title={t('food.ingredientsTitle')} />
        <Text style={styles.bodyText}>{food.ingredients.join(', ')}</Text>
        {food.allergens.length > 0 ? (
          <>
            <SectionTitle title={t('food.allergensTitle')} />
            <View style={styles.warningBox}>
              <ShieldAlert color={colors.warning} size={18} />
              <Text style={styles.warningText}>{food.allergens.join(', ')}</Text>
            </View>
          </>
        ) : null}
        <SectionTitle title={t('food.orderingTitle')} />
        <View style={styles.phraseCard}>
          <Text style={styles.phraseEnglish}>{food.howToOrder}</Text>
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
  return (
    <ScrollView contentContainerStyle={styles.cultureContent} showsVerticalScrollIndicator={false}>
      {topics.map((topic, idx) => {
        const isDo = idx % 2 === 0;
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
  const tabs = ['All', 'Greetings', 'Food', 'Emergency', 'Directions', 'Shopping'];
  const filtered = tab === 'All' ? items : items.filter((p) => p.situation === tab);
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
            key={tt}
            style={[styles.exploreCityTab, tab === tt && styles.exploreCityTabActive]}
            onPress={() => setTab(tt)}
          >
            <Text
              style={[
                styles.exploreCityTabText,
                tab === tt && styles.exploreCityTabTextActive,
              ]}
            >
              {tt}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      <ScrollView contentContainerStyle={styles.phraseList} showsVerticalScrollIndicator={false}>
        {filtered.map((phrase) => {
          const saved = isFavorite('phrase', phrase.id);
          return (
            <View key={phrase.id} style={styles.phraseRow}>
              <View style={styles.flexOne}>
                <Text style={styles.phraseEnglish}>{phrase.english}</Text>
                <Text style={styles.phraseVietnamese}>{phrase.vietnamese}</Text>
                <Text style={styles.phrasePronunciation}>{phrase.pronunciation}</Text>
              </View>
              <View style={styles.rowGap}>
                <Pressable style={styles.phraseAudioButton}>
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
  return (
    <ScrollView contentContainerStyle={styles.emergencyContent} showsVerticalScrollIndicator={false}>
      {emergencyCards.map((card) => (
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
            {card.phrase ? <Text style={styles.emergencyPhrase}>{card.phrase}</Text> : null}
          </View>
          <Text style={styles.emergencyPhone}>{card.phone}</Text>
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
  records: { key: string; type: SavedItemType; id: string; title: string; subtitle: string }[];
  onOpenPlace: (id: string) => void;
  onOpenFood: (id: string) => void;
  t: (key: TranslationKey) => string;
}) {
  const [tab, setTab] = useState<'all' | 'place' | 'food' | 'phrase'>('all');
  const filtered = tab === 'all' ? records : records.filter((r) => r.type === tab);
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
          filtered.map((record) => (
            <Pressable
              key={record.key}
              style={styles.favoriteRow}
              onPress={() => {
                if (record.type === 'place') onOpenPlace(record.id);
                if (record.type === 'food') onOpenFood(record.id);
              }}
            >
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
  settings,
  onSignIn,
  onSignOut,
  onOpenSettings,
  onOpenLanguage,
  isGoogleAuthPending,
  canSignInWithGoogle,
  t,
}: {
  authSession: AuthSessionState | null;
  settings: SettingsState;
  onSignIn: () => void;
  onSignOut: () => void;
  onOpenSettings: () => void;
  onOpenLanguage: () => void;
  isGoogleAuthPending: boolean;
  canSignInWithGoogle: boolean;
  t: (key: TranslationKey) => string;
}) {
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
        </View>
      ) : (
        <View style={styles.accountHeader}>
          <View style={styles.accountAvatar}>
            <User color={colors.primary} size={32} />
          </View>
          <Text style={styles.accountName}>{t('account.notSignedIn.title')}</Text>
          <Text style={styles.accountEmail}>{t('account.notSignedIn.body')}</Text>
          <PrimaryButton
            label={isGoogleAuthPending ? t('auth.signingIn') : t('account.signIn')}
            onPress={onSignIn}
            disabled={!canSignInWithGoogle || isGoogleAuthPending}
            icon={User}
          />
        </View>
      )}

      <View style={styles.accountSection}>
        <Text style={styles.accountSectionTitle}>{t('account.accountInfo')}</Text>
        <View style={styles.accountRow}>
          <Text style={styles.accountRowLabel}>{t('account.displayName')}</Text>
          <Text style={styles.accountRowValue}>
            {authSession?.user.name ?? 'Guest'}
          </Text>
          <ChevronRight color={colors.muted} size={18} />
        </View>
        <View style={styles.accountRow}>
          <Text style={styles.accountRowLabel}>{t('account.email')}</Text>
          <Text style={styles.accountRowValue}>
            {authSession?.user.email ?? '—'}
          </Text>
          <ChevronRight color={colors.muted} size={18} />
        </View>
        <View style={styles.accountRow}>
          <Text style={styles.accountRowLabel}>{t('account.memberSince')}</Text>
          <Text style={styles.accountRowValue}>2026-01</Text>
          <ChevronRight color={colors.muted} size={18} />
        </View>
      </View>

      <View style={styles.accountSection}>
        <Text style={styles.accountSectionTitle}>{t('account.languageSection')}</Text>
        <Pressable style={styles.accountRow} onPress={onOpenLanguage}>
          <Globe color={colors.primary} size={20} />
          <Text style={styles.accountRowLabel}>{t('settings.language.title')}</Text>
          <Text style={styles.accountRowValue}>
            {settings.themeMode === 'light'
              ? t('settings.value.light')
              : t('settings.value.dark')}
          </Text>
          <ChevronRight color={colors.muted} size={18} />
        </Pressable>
      </View>

      <View style={styles.accountSection}>
        <Pressable style={styles.accountRow} onPress={onOpenSettings}>
          <SettingsIcon color={colors.primary} size={20} />
          <Text style={styles.accountRowLabel}>{t('account.settings')}</Text>
          <ChevronRight color={colors.muted} size={18} />
        </Pressable>
        <Pressable style={styles.accountRow}>
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
  recentSearches,
  onSubmitSearch,
  onClearRecent,
  onOpenPlace,
  onOpenFood,
  t,
}: {
  recentSearches: RecentSearch[];
  onSubmitSearch: (query: string) => void;
  onClearRecent: () => void;
  onOpenPlace: (id: string) => void;
  onOpenFood: (id: string) => void;
  t: (key: TranslationKey) => string;
}) {
  const [query, setQuery] = useState('');
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) {
      return { places: popularPlaceIds.map((id) => places.find((p) => p.id === id)).filter(Boolean) as Place[], foods: popularFoodIds.map((id) => foods.find((f) => f.id === id)).filter(Boolean) as Food[] };
    }
    return {
      places: places.filter((p) =>
        `${p.name} ${p.city} ${p.category} ${p.tags.join(' ')}`.toLowerCase().includes(q),
      ),
      foods: foods.filter((f) =>
        `${f.name} ${f.englishName} ${f.region}`.toLowerCase().includes(q),
      ),
    };
  }, [query]);

  return (
    <View style={styles.flexOne}>
      <View style={styles.searchTopRow}>
        <View style={styles.searchInput}>
          <SearchIcon color={colors.muted} size={18} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t('search.placeholder')}
            placeholderTextColor={colors.muted}
            style={styles.searchInputField}
            returnKeyType="search"
            onSubmitEditing={() => onSubmitSearch(query)}
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery('')}>
              <X color={colors.muted} size={18} />
            </Pressable>
          ) : null}
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.searchContent} showsVerticalScrollIndicator={false}>
        {query.trim().length === 0 && recentSearches.length > 0 ? (
          <View>
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
                  onPress={() => onSubmitSearch(s.query)}
                >
                  <Clock color={colors.muted} size={13} />
                  <Text style={styles.recentChipText}>{s.query}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {query.trim().length === 0 ? (
          <View style={styles.searchSection}>
            <Text style={styles.searchSectionTitle}>{t('search.suggestions')}</Text>
            <View style={styles.popularGrid}>
              {results.places.slice(0, 4).map((place) => (
                <Pressable
                  key={place.id}
                  style={styles.popularGridCard}
                  onPress={() => onOpenPlace(place.id)}
                >
                  <Image source={place.image} style={styles.popularGridImage} />
                  <Text style={styles.popularGridName}>{place.name}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          <View>
            {results.places.length === 0 && results.foods.length === 0 ? (
              <EmptyState
                icon={SearchIcon}
                title={t('search.noResults')}
                body={t('search.noResultsBody')}
              />
            ) : (
              <>
                {results.places.length > 0 ? (
                  <View>
                    <Text style={styles.searchSectionTitle}>
                      {t('search.popularPlaces')}
                    </Text>
                    {results.places.map((place) => (
                      <Pressable
                        key={place.id}
                        style={styles.searchResultRow}
                        onPress={() => onOpenPlace(place.id)}
                      >
                        <Image source={place.image} style={styles.searchResultImage} />
                        <View style={styles.flexOne}>
                          <Text style={styles.favoriteName}>{place.name}</Text>
                          <Text style={styles.favoriteSub}>{place.city}</Text>
                        </View>
                        <ChevronRight color={colors.muted} size={18} />
                      </Pressable>
                    ))}
                  </View>
                ) : null}
                {results.foods.length > 0 ? (
                  <View>
                    <Text style={styles.searchSectionTitle}>
                      {t('search.popularFoods')}
                    </Text>
                    {results.foods.map((food) => (
                      <Pressable
                        key={food.id}
                        style={styles.searchResultRow}
                        onPress={() => onOpenFood(food.id)}
                      >
                        <Image source={food.image} style={styles.searchResultImage} />
                        <View style={styles.flexOne}>
                          <Text style={styles.favoriteName}>{food.name}</Text>
                          <Text style={styles.favoriteSub}>{food.region}</Text>
                        </View>
                        <ChevronRight color={colors.muted} size={18} />
                      </Pressable>
                    ))}
                  </View>
                ) : null}
              </>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function SettingsScreen({
  settings,
  onUpdateSettings,
  onBack,
  t,
}: {
  settings: SettingsState;
  onUpdateSettings: (patch: Partial<SettingsState>) => void;
  onBack: () => void;
  t: (key: TranslationKey) => string;
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
              <Text style={styles.languageFlagText}>
                {language === 'English' ? '🇬🇧' : '🇻🇳'}
              </Text>
            </View>
            <Text style={styles.languageLabel}>{language}</Text>
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
        <Text style={styles.offlineCardTitle}>{t('offline.cached')}</Text>
        <View style={styles.offlineItem}>
          <Check color={colors.success} size={18} />
          <Text style={styles.offlineItemText}>Địa điểm đã xem</Text>
        </View>
        <View style={styles.offlineItem}>
          <Check color={colors.success} size={18} />
          <Text style={styles.offlineItemText}>Món ăn đã lưu</Text>
        </View>
        <View style={styles.offlineItem}>
          <Check color={colors.success} size={18} />
          <Text style={styles.offlineItemText}>Lịch trình đã tạo</Text>
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

function MapScreen({ place, onBack, t }: { place: Place | null; onBack: () => void; t: (key: TranslationKey) => string }) {
  return (
    <View style={styles.flexOne}>
      <View style={styles.mapHeader}>
        <IconButton icon={ArrowLeft} onPress={onBack} style={styles.headerBack} />
        <Text style={styles.mapHeaderTitle}>{t('map.title')}</Text>
      </View>
      <View style={styles.mapBody}>
        <View style={styles.mapPinStack}>
          {place ? (
            <>
              <View style={styles.mapPin}><MapPin color={colors.primary} size={20} /></View>
              <Text style={styles.mapPinName}>{place.name}</Text>
              <Text style={styles.mapPinSub}>{place.lat.toFixed(3)}, {place.lng.toFixed(3)}</Text>
              <Pressable style={styles.mapOpenButton} onPress={() => place && openInMaps(place)}>
                <Text style={styles.mapOpenText}>{t('map.openExternal')}</Text>
                <ChevronRight color={colors.surface} size={16} />
              </Pressable>
            </>
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
  t,
}: {
  messages: ChatMessage[];
  chatInput: string;
  onChangeInput: (text: string) => void;
  onAsk: (q: string) => void;
  onBuildItinerary: () => void;
  tripDays: number;
  tripStyle: TripStyle;
  onChangeTripDays: (d: number) => void;
  onChangeTripStyle: (s: TripStyle) => void;
  t: (key: TranslationKey) => string;
}) {
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
      </ScrollView>
      <View style={styles.aiInputRow}>
        <View style={styles.aiInputField}>
          <TextInput
            value={chatInput}
            onChangeText={onChangeInput}
            placeholder={t('ai.placeholder')}
            placeholderTextColor={colors.muted}
            style={styles.aiInput}
            returnKeyType="send"
            onSubmitEditing={() => onAsk(chatInput)}
          />
        </View>
        <Pressable
          style={styles.aiSendButton}
          onPress={() => onAsk(chatInput)}
        >
          <Send color={colors.surface} size={18} />
        </Pressable>
      </View>
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
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const [isBooting, setIsBooting] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [draftProfile, setDraftProfile] = useState<UserProfile>(defaultProfile);
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState<City | 'All'>('All');
  const [selectedPlaceId, setSelectedPlaceId] = useState(places[0].id);
  const [selectedFoodId, setSelectedFoodId] = useState(foods[0].id);
  const [favorites, setFavorites] = useState<SavedItem[]>([]);
  const [authSession, setAuthSession] = useState<AuthSessionState | null>(null);
  const [activityHistory, setActivityHistory] = useState<ActivityHistoryEntry[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [isGoogleAuthPending, setIsGoogleAuthPending] = useState(false);
  const [googleIdToken, setGoogleIdToken] = useState<string | null>(null);
  const [lastItinerary, setLastItinerary] = useState<ItineraryConfirmation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [tripDays, setTripDays] = useState(2);
  const [tripStyle, setTripStyle] = useState<TripStyle>('Culture + Food');
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [pendingPlaceId, setPendingPlaceId] = useState<string | null>(null);
  const [pendingFoodId, setPendingFoodId] = useState<string | null>(null);
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);
  const didTrackAppOpenRef = useRef(false);
  const didTrackOnboardingRef = useRef(false);
  const previousScreenRef = useRef<TabId | null>(null);
  const processedGoogleResponseRef = useRef<string | null>(null);

  const currentProfile = profile ?? draftProfile;
  const locale = getLocale(currentProfile.language);
  const t = (key: TranslationKey): string => translate(locale, key);

  const googleRedirectUri = AuthSession.makeRedirectUri({
    scheme: APP_SCHEME,
    path: 'oauthredirect',
    native: `${APP_SCHEME}:/oauthredirect`,
  });

  const [googleRequest, googleResponse, promptGoogleSignIn] = Google.useIdTokenAuthRequest({
    ...googleOAuthConfig,
    redirectUri: googleRedirectUri,
    selectAccount: true,
    scopes: ['openid', 'profile', 'email'],
  });

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

  /* boot */
  useEffect(() => {
    const loadLocalState = async () => {
      try {
        const [storedProfile, storedFavorites, storedAuthSession, storedActivity, storedRecent, storedSettings] =
          await Promise.all([
            AsyncStorage.getItem(PROFILE_KEY),
            AsyncStorage.getItem(FAVORITES_KEY),
            AsyncStorage.getItem(AUTH_SESSION_KEY),
            AsyncStorage.getItem(ACTIVITY_HISTORY_KEY),
            AsyncStorage.getItem(RECENT_SEARCHES_KEY),
            AsyncStorage.getItem(SETTINGS_KEY),
          ]);

        if (storedProfile) {
          const parsed = JSON.parse(storedProfile) as UserProfile;
          setProfile(parsed);
          setDraftProfile(parsed);
          setSelectedCity(parsed.currentCity);
        }
        if (storedFavorites) setFavorites(JSON.parse(storedFavorites) as SavedItem[]);
        if (storedAuthSession) {
          const parsedAuth = JSON.parse(storedAuthSession) as AuthSessionState;
          setAuthSession({ ...parsedAuth, lastSeenAt: new Date().toISOString() });
        }
        if (storedActivity) setActivityHistory(JSON.parse(storedActivity) as ActivityHistoryEntry[]);
        if (storedRecent) setRecentSearches(JSON.parse(storedRecent) as RecentSearch[]);
        if (storedSettings) setSettings({ ...defaultSettings, ...(JSON.parse(storedSettings) as SettingsState) });
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
    if (isBooting) return;
    if (authSession) {
      void AsyncStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(authSession));
    } else {
      void AsyncStorage.removeItem(AUTH_SESSION_KEY);
    }
  }, [authSession, isBooting]);
  useEffect(() => {
    if (isBooting) return;
    void AsyncStorage.setItem(ACTIVITY_HISTORY_KEY, JSON.stringify(activityHistory));
  }, [activityHistory, isBooting]);
  useEffect(() => { void AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }, [settings]);

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

  /* google sign-in response */
  useEffect(() => {
    if (!googleResponse) return;
    const fingerprint =
      googleResponse.type === 'success' || googleResponse.type === 'error'
        ? `${googleResponse.type}-${googleResponse.url ?? googleResponse.errorCode ?? ''}`
        : googleResponse.type;
    if (processedGoogleResponseRef.current === fingerprint) return;
    processedGoogleResponseRef.current = fingerprint;

    if (googleResponse.type !== 'success') {
      setIsGoogleAuthPending(false);
      if (googleResponse.type === 'error') {
        recordActivity('auth', 'Google sign-in failed', googleResponse.error?.message ?? 'Google returned an error.');
        void trackEvent('google_sign_in_failed', { error_code: googleResponse.errorCode, source_screen: activeTab }, currentProfile);
      }
      return;
    }

    const completeGoogleSignIn = async () => {
      const accessToken =
        googleResponse.authentication?.accessToken ?? googleResponse.params.access_token;
      const idToken =
        googleResponse.authentication?.idToken ?? googleResponse.params.id_token;

      if (!accessToken && !idToken) {
        setIsGoogleAuthPending(false);
        recordActivity('auth', 'Google sign-in failed', 'Google did not return an auth token.');
        void trackEvent('google_sign_in_failed', { error_code: 'missing_auth_token', source_screen: activeTab }, currentProfile);
        return;
      }

      try {
        const userInfo = idToken
          ? decodeJwtPayload(idToken)
          : await AuthSession.fetchUserInfoAsync(
              { accessToken: accessToken ?? '' },
              Google.discovery,
            );
        const googleUser = normalizeGoogleUser(userInfo);
        setGoogleIdToken(idToken ?? null);
        const now = new Date().toISOString();
        setAuthSession({ provider: 'google', user: googleUser, signedInAt: now, lastSeenAt: now });
        setEmailStatus(null);
        recordActivity('auth', 'Signed in with Google', googleUser.email);
        void trackEvent('google_sign_in_completed', { source_screen: activeTab, email_domain: getEmailDomain(googleUser.email), verified_email: googleUser.verifiedEmail }, currentProfile);
      } catch {
        recordActivity('auth', 'Google sign-in failed', 'Could not load the Google profile.');
        void trackEvent('google_sign_in_failed', { error_code: 'profile_fetch_failed', source_screen: activeTab }, currentProfile);
      } finally {
        setIsGoogleAuthPending(false);
      }
    };
    void completeGoogleSignIn();
  }, [activeTab, currentProfile, googleResponse]);

  /* derived data */
  const selectedPlace = places.find((p) => p.id === selectedPlaceId) ?? places[0];
  const selectedFood = foods.find((f) => f.id === selectedFoodId) ?? foods[0];
  const searchNeedle = searchTerm.trim().toLowerCase();
  const filteredPlaces = useMemo(() => {
    return places.filter((place) => {
      const matchesCity = selectedCity === 'All' || place.city === selectedCity;
      const matchesSearch =
        searchNeedle.length === 0 ||
        `${place.name} ${place.city} ${place.category} ${place.tags.join(' ')}`
          .toLowerCase()
          .includes(searchNeedle);
      return matchesCity && matchesSearch;
    });
  }, [selectedCity, searchNeedle]);

  const favoriteRecords = useMemo(() => {
    return favorites
      .map((favorite) => {
        if (favorite.type === 'place') {
          const item = places.find((p) => p.id === favorite.id);
          return item ? { key: `${favorite.type}-${favorite.id}`, type: favorite.type, id: favorite.id, title: item.name, subtitle: item.city } : null;
        }
        if (favorite.type === 'food') {
          const item = foods.find((f) => f.id === favorite.id);
          return item ? { key: `${favorite.type}-${favorite.id}`, type: favorite.type, id: favorite.id, title: item.name, subtitle: item.englishName } : null;
        }
        if (favorite.type === 'phrase') {
          const item = phrases.find((p) => p.id === favorite.id);
          return item ? { key: `${favorite.type}-${favorite.id}`, type: favorite.type, id: favorite.id, title: item.english, subtitle: item.vietnamese } : null;
        }
        const item = cultureTopics.find((c) => c.id === favorite.id);
        return item ? { key: `${favorite.type}-${favorite.id}`, type: favorite.type, id: favorite.id, title: item.title, subtitle: item.category } : null;
      })
      .filter(Boolean) as { key: string; type: SavedItemType; id: string; title: string; subtitle: string }[];
  }, [favorites]);

  const popularPlaces = useMemo(
    () => popularPlaceIds.map((id) => places.find((p) => p.id === id)).filter(Boolean) as Place[],
    [],
  );
  const popularFoods = useMemo(
    () => popularFoodIds.map((id) => foods.find((f) => f.id === id)).filter(Boolean) as Food[],
    [],
  );

  /* handlers */
  const saveProfile = () => {
    void AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(draftProfile));
    setProfile(draftProfile);
    setSelectedCity(draftProfile.currentCity);
    setActiveTab('home');
    recordActivity('profile', 'Completed travel profile', `${draftProfile.currentCity} · ${draftProfile.tripDays} days`);
    void trackEvent('onboarding_completed', { screen_name: 'onboarding' }, draftProfile);
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
    if (!googleRequest || isGoogleAuthPending) return;
    setIsGoogleAuthPending(true);
    recordActivity('auth', 'Started Google sign-in', Platform.OS);
    void trackEvent('google_sign_in_started', { source_screen: activeTab, redirect_uri: googleRedirectUri }, currentProfile);
    try {
      await promptGoogleSignIn();
    } catch {
      setIsGoogleAuthPending(false);
      recordActivity('auth', 'Google sign-in failed', 'Could not open the Google sign-in window.');
      void trackEvent('google_sign_in_failed', { error_code: 'prompt_failed', source_screen: activeTab }, currentProfile);
    }
  };

  const signOutGoogle = () => {
    const email = authSession?.user.email;
    setAuthSession(null);
    setGoogleIdToken(null);
    setEmailStatus(null);
    recordActivity('auth', 'Signed out of Google', email);
    void trackEvent('google_signed_out', { source_screen: activeTab, email_domain: email ? getEmailDomain(email) : undefined }, currentProfile);
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

  const askAi = (question: string): string | null => {
    const trimmed = question.trim();
    if (!trimmed) return null;
    const answer = buildAiAnswer(trimmed, currentProfile, tripDays, tripStyle, locale);
    setMessages((current) => [
      ...current,
      { id: `${Date.now()}-user`, from: 'user', text: trimmed },
      { id: `${Date.now()}-assistant`, from: 'assistant', text: answer },
    ]);
    setChatInput('');
    recordActivity('ai', 'Asked AI', trimmed);
    void trackEvent('ai_question_submitted', { question_length: trimmed.length, response_locale: locale, source_screen: activeTab, trip_style: tripStyle }, currentProfile);
    return answer;
  };

  const submitSearch = (query: string) => {
    const trimmed = query.trim();
    recordSearch(trimmed);
    recordActivity('search', 'Searched app content', trimmed || 'Empty query');
    void trackEvent('search_submitted', { query_length: trimmed.length, source_screen: activeTab, query_language: locale }, currentProfile);
    if (trimmed.length > 0) askAi(trimmed);
  };

  const changeTab = (tab: TabId) => {
    setActiveTab(tab);
    recordActivity('navigation', `Opened ${tab}`, `From ${activeTab}`);
    void trackEvent('tab_opened', { tab_id: tab, source_screen: activeTab }, currentProfile);
  };

  const changeExploreCity = (city: City | 'All') => {
    setSelectedCity(city);
    recordActivity('filter', 'Changed city filter', city);
    void trackEvent('filter_changed', { filter_name: 'city', filter_value: city, source_screen: 'explore' }, currentProfile);
  };

  const openPlace = (id: string, sourceScreen: TabId) => {
    setSelectedPlaceId(id);
    setPendingPlaceId(id);
    setActiveTab('place_detail');
    const item = places.find((p) => p.id === id);
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

  const buildItinerary = () => {
    const prompt = `Create a ${tripDays} day ${tripStyle} itinerary for ${currentProfile.currentCity}.`;
    const itinerary = createItineraryConfirmation(prompt, currentProfile, tripDays, tripStyle, locale);
    setLastItinerary(itinerary);
    setMessages((current) => [
      ...current,
      { id: `${Date.now()}-user`, from: 'user', text: prompt },
      { id: `${Date.now()}-assistant`, from: 'assistant', text: itinerary.body },
    ]);
    setActiveTab('itinerary_preview');
    recordActivity('itinerary', 'Generated itinerary', `${tripDays} days · ${tripStyle} · ${currentProfile.currentCity}`);
    void trackEvent('itinerary_generated', { trip_days: tripDays, trip_style: tripStyle, current_city: currentProfile.currentCity }, currentProfile);
  };

  const sendItineraryEmail = async () => {
    if (!authSession) {
      setEmailStatus(t('ai.emailRequired'));
      return;
    }
    const itinerary = lastItinerary ?? createItineraryConfirmation(`Create a ${tripDays} day ${tripStyle} itinerary for ${currentProfile.currentCity}.`, currentProfile, tripDays, tripStyle, locale);
    setLastItinerary(itinerary);
    setEmailStatus(null);
    recordActivity('email', 'Requested itinerary email', authSession.user.email);
    void trackEvent('itinerary_email_requested', { itinerary_days: itinerary.days, itinerary_style: itinerary.style, email_domain: getEmailDomain(authSession.user.email), delivery_mode: itineraryEmailEndpoint ? 'endpoint' : 'mail_composer' }, currentProfile);

    try {
      if (itineraryEmailEndpoint && googleIdToken) {
        const response = await fetch(itineraryEmailEndpoint, {
          method: 'POST',
          headers: { Authorization: `Bearer ${googleIdToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: authSession.user.email, name: authSession.user.name, itinerary, profile: currentProfile }),
        });
        if (!response.ok) throw new Error(`Email endpoint failed with ${response.status}`);
        setEmailStatus(t('ai.emailSent'));
        recordActivity('email', 'Sent itinerary confirmation', authSession.user.email);
        void trackEvent('itinerary_email_sent', { itinerary_days: itinerary.days, delivery_mode: 'endpoint', email_domain: getEmailDomain(authSession.user.email) }, currentProfile);
        return;
      }
      const isMailAvailable = await MailComposer.isAvailableAsync();
      if (!isMailAvailable) {
        setEmailStatus(t('ai.emailUnavailable'));
        recordActivity('email', 'Email composer unavailable', Platform.OS);
        return;
      }
      const mailResult = await MailComposer.composeAsync({
        recipients: [authSession.user.email],
        subject: `Vinago+ itinerary confirmation: ${itinerary.title}`,
        body: buildItineraryEmailBody(authSession.user.name, itinerary, currentProfile),
      });
      setEmailStatus(t('ai.emailSent'));
      recordActivity('email', 'Opened itinerary email composer', mailResult.status);
      void trackEvent('itinerary_email_sent', { itinerary_days: itinerary.days, delivery_mode: 'mail_composer', composer_status: mailResult.status, email_domain: getEmailDomain(authSession.user.email) }, currentProfile);
    } catch {
      setEmailStatus(t('ai.emailFailed'));
      recordActivity('email', 'Itinerary email failed', authSession.user.email);
      void trackEvent('itinerary_email_failed', { itinerary_days: itinerary.days, email_domain: getEmailDomain(authSession.user.email) }, currentProfile);
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
            recentSearches={recentSearches}
            popularPlaces={popularPlaces}
            popularFoods={popularFoods}
            onOpenSearch={() => setActiveTab('search')}
            onOpenPlace={(id) => openPlace(id, 'home')}
            onOpenFood={(id) => openFood(id)}
            onOpenFilter={() => setActiveTab('filter')}
            t={t}
          />
        );
      case 'explore':
        return (
          <ExploreScreen
            places={filteredPlaces}
            selectedCity={selectedCity}
            onCityChange={changeExploreCity}
            onOpenPlace={(id) => openPlace(id, 'explore')}
            onOpenFilter={() => setActiveTab('filter')}
            t={t}
          />
        );
      case 'place_detail':
        return (
          <PlaceDetailScreen
            place={selectedPlace}
            isFavorite={isFavorite('place', selectedPlace.id)}
            onToggleFavorite={() => toggleFavorite('place', selectedPlace.id)}
            onBack={() => setActiveTab('explore')}
            onOpenMap={openMap}
            onAskAi={() => {
              askAi(`Tell me more about ${selectedPlace.name}`);
              setActiveTab('ai');
            }}
            t={t}
          />
        );
      case 'food_detail':
        return (
          <FoodDetailScreen
            food={selectedFood}
            isFavorite={isFavorite('food', selectedFood.id)}
            onToggleFavorite={() => toggleFavorite('food', selectedFood.id)}
            onBack={() => setActiveTab('food')}
            onAskAi={() => {
              askAi(`Is ${selectedFood.name} spicy?`);
              setActiveTab('ai');
            }}
            t={t}
          />
        );
      case 'food':
        return <FoodScreen foods={popularFoods} onOpenFood={openFood} t={t} />;
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
            onSendEmail={sendItineraryEmail}
            onExportPdf={() => {
              setActiveTab('itinerary_pdf');
              void trackEvent('itinerary_exported', { itinerary_days: lastItinerary.days, format: 'pdf_preview' }, currentProfile);
            }}
            onBack={() => setActiveTab('ai')}
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
        return <MapScreen place={selectedPlace} onBack={() => setActiveTab(pendingPlaceId ? 'place_detail' : 'home')} t={t} />;
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
            settings={settings}
            onSignIn={signInWithGoogle}
            onSignOut={signOutGoogle}
            onOpenSettings={() => setActiveTab('settings')}
            onOpenLanguage={() => setActiveTab('language')}
            isGoogleAuthPending={isGoogleAuthPending}
            canSignInWithGoogle={Boolean(googleRequest)}
            t={t}
          />
        );
      case 'settings':
        return (
          <SettingsScreen
            settings={settings}
            onUpdateSettings={updateSettings}
            onBack={() => setActiveTab('account')}
            t={t}
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
            recentSearches={recentSearches}
            onSubmitSearch={submitSearch}
            onClearRecent={clearRecentSearches}
            onOpenPlace={(id) => openPlace(id, 'search')}
            onOpenFood={(id) => openFood(id)}
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
  if (isBooting) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <View style={styles.loadingWrap}>
          <Sparkles color={colors.primary} size={36} />
          <Text style={styles.loadingTitle}>{t('loading.title')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <OnboardingScreen
        draftProfile={draftProfile}
        setDraftProfile={setDraftProfile}
        onSave={saveProfile}
        t={t}
      />
    );
  }

  ;

  return (
    <SafeAreaView style={styles.safeArea}>
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
          </View>
        ) : null}
        <View style={styles.mainPane}>
          <HeaderBar
            title={t('app.name')}
            subtitle={activeTab === 'home' ? t('home.discoverTitle') : undefined}
            onBack={
              ['place_detail', 'food_detail', 'settings', 'language', 'search', 'filter', 'itinerary_preview', 'itinerary_pdf', 'map', 'offline'].includes(activeTab)
                ? () => {
                    if (activeTab === 'place_detail') setActiveTab('explore');
                    else if (activeTab === 'food_detail') setActiveTab('food');
                    else if (activeTab === 'search') setActiveTab('home');
                    else if (activeTab === 'itinerary_pdf') setActiveTab('itinerary_preview');
                    else if (activeTab === 'itinerary_preview') setActiveTab('ai');
                    else if (activeTab === 'map') setActiveTab(pendingPlaceId ? 'place_detail' : 'home');
                    else setActiveTab('account');
                  }
                : undefined
            }
            trailing={
              <View style={styles.headerActions}>
                <IconButton icon={SearchIcon} onPress={() => setActiveTab('search')} />
                <Pressable onPress={() => setShowOfflineBanner(true)} style={styles.headerAction}>
                  <Wifi color={colors.text} size={18} />
                </Pressable>
                <Pressable onPress={resetOnboarding} style={styles.headerAction}>
                  <Languages color={colors.text} size={18} />
                </Pressable>
              </View>
            }
          />
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
          {emailStatus ? (
            <View style={styles.emailStatusBar}>
              <Text style={styles.emailStatusText}>{emailStatus}</Text>
              <Pressable onPress={() => setEmailStatus(null)}>
                <X color={colors.muted} size={16} />
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>
      {!isWide ? <BottomNav activeTab={activeTab} onChange={changeTab} t={t} /> : null}
    </SafeAreaView>
  );
}

function BottomNav({
  activeTab,
  onChange,
  t,
}: {
  activeTab: TabId;
  onChange: (tab: TabId) => void;
  t: (key: TranslationKey) => string;
}) {
  const items = bottomTabItems.filter((tab, idx, arr) => arr.findIndex((t) => t.id === tab.id) === idx);
  return (
    <View style={styles.bottomNav}>
      {items.map((tab) => {
        const Icon = tab.icon;
        const active = activeTab === tab.id;
        return (
          <Pressable
            key={tab.id}
            style={styles.bottomNavItem}
            onPress={() => onChange(tab.id)}
          >
            <Icon color={active ? colors.primary : colors.muted} size={20} />
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
  languageLabel: { flex: 1, color: colors.text, fontSize: 16, fontWeight: '700' },

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
    position: 'absolute', left: 12, right: 12, bottom: 12,
    height: 64, borderRadius: 12, backgroundColor: colors.surface,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    borderWidth: 1, borderColor: colors.border,
    shadowColor: colors.shadow, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6, shadowRadius: 12, elevation: 6,
  },
  bottomNavItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
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
  mainPane: { flex: 1 },

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
    paddingHorizontal: 4, paddingTop: 8, paddingBottom: 4,
  },
  exploreTitle: { color: colors.text, fontSize: 22, fontWeight: '900' },
  exploreSubtitle: { color: colors.muted, fontSize: 13, fontWeight: '700' },

  exploreCityRow: { flexDirection: 'row', gap: 8, paddingVertical: 8 },
  exploreCityScroll: { flexGrow: 0, maxHeight: 56 },
  exploreCityTab: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
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
  searchTopRow: { padding: 12 },
  searchInput: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    height: 48, paddingHorizontal: 14, borderRadius: 8,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
  },
  searchInputField: { flex: 1, color: colors.text, fontSize: 15 },
  searchContent: { padding: 16, gap: 18, paddingBottom: 96 },
  searchSectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  searchSectionTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  searchSectionLink: { color: colors.primary, fontWeight: '800' },
  searchSection: { gap: 10 },
  searchResultRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 10, borderRadius: 10, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
  },
  searchResultImage: { width: 56, height: 56, borderRadius: 8 },

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
  mapSubtitle: { color: colors.muted, fontSize: 14, fontWeight: '700' },
  mapBody: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  mapPinStack: { alignItems: 'center', gap: 8 },
  mapPin: {
    height: 64, width: 64, borderRadius: 32, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  mapPinName: { color: colors.text, fontSize: 18, fontWeight: '900' },
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

  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  emptyIcon: {
    height: 64, width: 64, borderRadius: 16, backgroundColor: colors.primarySoft,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  emptyBody: { color: colors.muted, fontSize: 13, fontWeight: '600', textAlign: 'center' },
});
