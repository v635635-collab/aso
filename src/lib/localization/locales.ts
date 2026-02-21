export interface AppStoreLocale {
  code: string;
  name: string;
  nativeName: string;
  region?: string;
}

export const APP_STORE_LOCALES: AppStoreLocale[] = [
  { code: "en-US", name: "English (US)", nativeName: "English" },
  { code: "en-GB", name: "English (UK)", nativeName: "English", region: "GB" },
  { code: "ru", name: "Russian", nativeName: "Русский" },
  { code: "de-DE", name: "German", nativeName: "Deutsch" },
  { code: "fr-FR", name: "French", nativeName: "Français" },
  { code: "ja", name: "Japanese", nativeName: "日本語" },
  { code: "zh-Hans", name: "Chinese (Simplified)", nativeName: "简体中文" },
  { code: "zh-Hant", name: "Chinese (Traditional)", nativeName: "繁體中文" },
  { code: "ko", name: "Korean", nativeName: "한국어" },
  { code: "es-ES", name: "Spanish (Spain)", nativeName: "Español" },
  { code: "es-MX", name: "Spanish (Mexico)", nativeName: "Español (México)", region: "MX" },
  { code: "pt-BR", name: "Portuguese (Brazil)", nativeName: "Português (Brasil)" },
  { code: "pt-PT", name: "Portuguese (Portugal)", nativeName: "Português", region: "PT" },
  { code: "it", name: "Italian", nativeName: "Italiano" },
  { code: "nl-NL", name: "Dutch", nativeName: "Nederlands" },
  { code: "tr", name: "Turkish", nativeName: "Türkçe" },
  { code: "ar-SA", name: "Arabic", nativeName: "العربية" },
  { code: "th", name: "Thai", nativeName: "ไทย" },
  { code: "vi", name: "Vietnamese", nativeName: "Tiếng Việt" },
  { code: "id", name: "Indonesian", nativeName: "Bahasa Indonesia" },
];

export function getLocaleByCode(code: string): AppStoreLocale | undefined {
  return APP_STORE_LOCALES.find((l) => l.code === code);
}

export function getLocaleNames(codes: string[]): string[] {
  return codes.map(
    (code) => getLocaleByCode(code)?.name ?? code
  );
}
