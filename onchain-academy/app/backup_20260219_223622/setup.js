const fs = require('fs');

const files = [
  {
    name: 'components.json',
    content: `{\n  "$schema": "https://ui.shadcn.com/schema.json",\n  "style": "default",\n  "rsc": true,\n  "tsx": true,\n  "tailwind": {\n    "config": "tailwind.config.js",\n    "css": "app/globals.css",\n    "baseColor": "slate",\n    "cssVariables": true\n  },\n  "aliases": {\n    "components": "@/components",\n    "utils": "@/lib/utils"\n  }\n}`
  },
  {
    name: 'vitest.config.ts',
    content: `import { defineConfig } from 'vitest/config';\nimport react from '@vitejs/plugin-react';\nimport path from 'path';\n\nexport default defineConfig({\n  plugins: [react()],\n  test: {\n    environment: 'jsdom',\n    setupFiles: ['./vitest.setup.ts'],\n    globals: true,\n  },\n  resolve: {\n    alias: {\n      '@': path.resolve(__dirname, './'),\n    },\n  },\n});`
  },
  {
    name: 'vitest.setup.ts',
    content: `import { expect, afterEach } from 'vitest';\nimport { cleanup } from '@testing-library/react';\nimport * as matchers from '@testing-library/jest-dom/matchers';\n\nexpect.extend(matchers);\n\nafterEach(() => {\n  cleanup();\n});`
  },
  {
    name: 'i18n.ts',
    content: `import { getRequestConfig } from 'next-intl/server';\nimport { notFound } from 'next/navigation';\n\nexport const locales = ['en', 'pt-br', 'es'] as const;\nexport type Locale = typeof locales[number];\n\nexport const defaultLocale: Locale = 'en';\n\nexport const localeNames: Record<Locale, string> = {\n  'en': 'English',\n  'pt-br': 'Português',\n  'es': 'Español',\n};\n\nexport default getRequestConfig(async ({ locale }) => {\n  if (!locales.includes(locale as Locale)) notFound();\n\n  return {\n    messages: (await import(\`./messages/\${locale}.json\`)).default\n  };\n});`
  },
  {
    name: '.env.local',
    content: `# Service Mode Configuration\nNEXT_PUBLIC_USE_MOCK_DATA=true\nNEXT_PUBLIC_USE_ON_CHAIN=false\n\n# Solana Network Configuration\nNEXT_PUBLIC_SOLANA_NETWORK=devnet\nNEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com\n\n# Program IDs\nNEXT_PUBLIC_PROGRAM_ID=11111111111111111111111111111111\nNEXT_PUBLIC_METADATA_PROGRAM_ID=metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s`
  },
  {
    name: '.env.example',
    content: `# Service Mode Configuration\nNEXT_PUBLIC_USE_MOCK_DATA=true\nNEXT_PUBLIC_USE_ON_CHAIN=false\n\n# Solana Network Configuration\nNEXT_PUBLIC_SOLANA_NETWORK=devnet\nNEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com\n\n# Program IDs\nNEXT_PUBLIC_PROGRAM_ID=11111111111111111111111111111111\nNEXT_PUBLIC_METADATA_PROGRAM_ID=metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s`
  }
];

files.forEach(f => {
  fs.writeFileSync(f.name, f.content);
  console.log('✅ Successfully created ' + f.name + ' with code inside!');
});