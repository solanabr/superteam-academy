import { hasLocale } from 'next-intl'
import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale

  const [homeMessages, coursesMessages, dashboardMessages, leaderboardMessages, loginMessages] =
    await Promise.all([
      import(`../messages/${locale}/home.json`).then((m) => m.default),
      import(`../messages/${locale}/courses.json`).then((m) => m.default),
      import(`../messages/${locale}/dashboard.json`).then((m) => m.default),
      import(`../messages/${locale}/leaderboard.json`).then((m) => m.default),
      import(`../messages/${locale}/login.json`).then((m) => m.default),
    ])

  return {
    locale,
    messages: {
      home: homeMessages,
      courses: coursesMessages,
      dashboard: dashboardMessages,
      leaderboard: leaderboardMessages,
      login: loginMessages,
    },
  }
})
