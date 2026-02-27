// app/src/i18n/navigation.ts
import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

// Экспортируем "умные" версии стандартных хуков и компонентов Next.js
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);