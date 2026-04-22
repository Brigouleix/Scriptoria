import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['fr', 'en', 'es', 'nl', 'it', 'ht', 'de'],
  defaultLocale: 'fr',
  localePrefix: 'never',
  localeDetection: true,
})
