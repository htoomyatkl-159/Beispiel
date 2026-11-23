import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import my from './locales/my.json';

let saved = 'en';
try { saved = (localStorage.getItem('beispiel-language') ?? localStorage.getItem('resonance-language')) === 'my' ? 'my' : 'en'; } catch { /* retain an existing language preference */ }
void i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, my: { translation: my } },
  lng: saved, fallbackLng: 'en', interpolation: { escapeValue: false },
});
i18n.on('languageChanged', (language) => {
  document.documentElement.lang = language;
  try { localStorage.setItem('beispiel-language', language); } catch { /* optional preference */ }
});
document.documentElement.lang = saved;
export default i18n;
