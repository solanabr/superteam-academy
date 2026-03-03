import { hasLocale } from 'next-intl'
import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale

  const [homeMessages] = await Promise.all([
    import(`../messages/${locale}/home.json`).then((m) => m.default),
  ])

  return {
    locale,
    messages: {
      home: homeMessages,
    },
  }
})
