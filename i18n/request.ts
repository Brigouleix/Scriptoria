import { getRequestConfig } from 'next-intl/server'
import { cookies, headers } from 'next/headers'
import { routing } from './routing'

const LOCALES = routing.locales as readonly string[]

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const fromCookie = cookieStore.get('NEXT_LOCALE')?.value

  let locale: string = routing.defaultLocale

  if (fromCookie && LOCALES.includes(fromCookie)) {
    locale = fromCookie
  } else {
    const acceptLang = (await headers()).get('accept-language') ?? ''
    const detected = acceptLang.split(',')[0].split('-')[0].trim().toLowerCase()
    if (LOCALES.includes(detected)) locale = detected
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
