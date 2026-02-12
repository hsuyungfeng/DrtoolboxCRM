import { createI18n } from 'vue-i18n';
import zhTW from './locales/zh-TW.json';
import en from './locales/en.json';

// 定義支持的語言類型
export type Locale = 'zh-TW' | 'en';

// 創建 i18n 實例
const i18n = createI18n({
  legacy: false, // 使用 Composition API 模式
  locale: 'zh-TW', // 預設語言
  fallbackLocale: 'en', // 備用語言
  messages: {
    'zh-TW': zhTW,
    'en': en,
  },
  datetimeFormats: {
    'zh-TW': {
      short: {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      },
      long: {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
      },
    },
    'en': {
      short: {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      },
      long: {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long',
        hour: '2-digit',
        minute: '2-digit',
      },
    },
  },
  numberFormats: {
    'zh-TW': {
      currency: {
        style: 'currency',
        currency: 'TWD',
        currencyDisplay: 'symbol',
      },
      decimal: {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
    },
    'en': {
      currency: {
        style: 'currency',
        currency: 'USD',
        currencyDisplay: 'symbol',
      },
      decimal: {
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
    },
  },
});

// 語言切換函數
export function setLocale(locale: Locale) {
  i18n.global.locale.value = locale;
  localStorage.setItem('preferredLocale', locale);
}

// 初始化語言設置
const savedLocale = localStorage.getItem('preferredLocale') as Locale;
if (savedLocale && ['zh-TW', 'en'].includes(savedLocale)) {
  i18n.global.locale.value = savedLocale;
}

export default i18n;