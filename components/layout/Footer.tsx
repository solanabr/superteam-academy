'use client'

import React from 'react'
import { useI18n } from '@/lib/hooks/useI18n'

export function Footer() {
  const { t } = useI18n()

  return (
    <footer className="bg-gray-50 dark:bg-terminal-bg border-t border-gray-200 dark:border-terminal-border mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-bold text-neon-cyan font-display mb-4">Superteam</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {t('footer.tagline')}
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-neon-cyan font-semibold mb-4">{t('nav.courses')}</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <a href="#" className="hover:text-neon-cyan transition-colors">
                  {t('footer.allCourses')}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-neon-cyan transition-colors">
                  {t('footer.learningPaths')}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-neon-cyan transition-colors">
                  {t('footer.certifications')}
                </a>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="text-neon-cyan font-semibold mb-4">{t('footer.community')}</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <a href="#" className="hover:text-neon-cyan transition-colors">
                  Discord
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-neon-cyan transition-colors">
                  Twitter
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-neon-cyan transition-colors">
                  GitHub
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-neon-cyan font-semibold mb-4">{t('footer.legal')}</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li>
                <a href="#" className="hover:text-neon-cyan transition-colors">
                  {t('footer.terms')}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-neon-cyan transition-colors">
                  {t('footer.privacy')}
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-neon-cyan transition-colors">
                  {t('footer.contact')}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-terminal-border pt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>{t('footer.copyright')}</p>
        </div>
      </div>
    </footer>
  )
}
