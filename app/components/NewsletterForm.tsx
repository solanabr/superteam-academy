'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Mail, ArrowRight, CheckCircle } from 'lucide-react';

export default function NewsletterForm() {
  const t = useTranslations('footer');
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
      <div className="flex items-center gap-3 flex-1">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-900/50 shrink-0">
          <Mail className="h-5 w-5 text-purple-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">{t('newsletter_title')}</h3>
          <p className="text-xs text-gray-400">{t('newsletter_desc')}</p>
        </div>
      </div>
      {subscribed ? (
        <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
          <CheckCircle className="h-4 w-4" />
          {t('newsletter_thanks')}
        </div>
      ) : (
        <form
          onSubmit={(e) => { e.preventDefault(); if (email) setSubscribed(true); }}
          className="flex gap-2 w-full sm:w-auto"
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t('newsletter_placeholder')}
            required
            className="flex-1 sm:w-56 rounded-xl border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-200 placeholder:text-gray-600 focus:border-purple-600 focus:outline-none focus:ring-1 focus:ring-purple-600"
          />
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:from-purple-500 hover:to-indigo-500 transition-all shrink-0"
          >
            {t('newsletter_button')}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </form>
      )}
    </div>
  );
}
