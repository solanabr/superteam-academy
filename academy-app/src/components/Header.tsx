'use client'

import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { Button } from '~/components/ui/button'

import { ChevronDown } from 'lucide-react'

import ThemeToggle from "./ThemeToggle";
import { useChangeLocale } from '~/hooks/use-change-locale';


export default function Header() {

   const { locale, setLocale } = useChangeLocale()

   return (
      <header className="w-full border-b border-gray-200 dark:border-gray-800">
         <div className="md:max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16" >
               <div className="flex-1 flex justify-start">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-background">
                     Superteam Academy
                  </h1>
               </div>
               <div className="md:hidden">
                  <ThemeToggle />
               </div>
               <div className="hidden md:flex items-center gap-x-4">
                  <LocaleDropdown setLocale={setLocale} locale={locale} />
                  <ThemeToggle />
               </div>
            </div>
         </div>
      </header>
   )
}

const LocaleDropdown = ({ setLocale, locale }: { locale: string, setLocale: (locale: string) => void }) => {

   const locales = [{ locale: 'en', name: 'english' }, { locale: 'es', name: 'Spanish' }, { locale: 'pt', name: 'Portugese' }]

   return (
      <DropdownMenu>
         <DropdownMenuTrigger asChild>
            <Button variant="ghost" className='dark:text-background font-bold uppercase'>
               <span className="tracking-wide">SITE LANGUAGE: {locales.find(v => v.locale === locale)?.name}</span>
               <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
         </DropdownMenuTrigger>
         <DropdownMenuContent>
            {
               locales.map(locale => (
                  <DropdownMenuItem className='capitalize' onClick={() => setLocale(locale.locale)}>{locale.name}</DropdownMenuItem>
               ))
            }
         </DropdownMenuContent>
      </DropdownMenu>
   )
}