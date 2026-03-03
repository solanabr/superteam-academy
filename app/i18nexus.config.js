/** @type {import('i18nexus-cli').Config} */
module.exports = {
    apiKey: process.env.I18NEXUS_API_KEY,
    path: './context/i18n/messages/{{lng}}.json',
    locales: ['en', 'pt-BR', 'es'],
};
