// lib/i18n/server.ts
import { createInstance } from 'i18next';
import resourcesToBackend from 'i18next-resources-to-backend';

export const initI18nextServer = async (lng: string) => {
  let validLng = (lng && typeof lng === 'string' && (lng.length === 2 || lng.length === 5)) ? lng : 'en-US';
  if (validLng === 'V') validLng = 'en-US';

  const i18nInstance = createInstance();

  await i18nInstance
    .use(resourcesToBackend((language: string, namespace: string) => {
      return import(`@/public/locales/${language}/common.json`)
        .catch(() => import(`@/public/locales/en-US/common.json`));
    }))
    .init({
      lng: validLng,
      fallbackLng: 'en-US',
      supportedLngs: ['en-US', 'en-GB', 'fr', 'es', 'sw'],
      defaultNS: 'common',
      fallbackNS: 'common',
      interpolation: { escapeValue: false },
    });

  return i18nInstance;
};