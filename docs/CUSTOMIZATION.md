# Customizing On-chain Academy

On-chain Academy is designed to be fully white-labeled and tailored to your specific developer ecosystem or DAO.

## Design System

The platform uses **Tailwind CSS** combined with CSS variables for its design system. To change the visual identity of the platform, you simply need to modify `index.css` and your `tailwind.config.ts`.

### 1. Colors
The default theme uses a dark aesthetic with neon green accents ("Solana Green").
Open `app/src/app/[locale]/globals.css` (or `index.css`) to adjust root CSS variables:

```css
:root {
  --background: 240 10% 3.9%; /* Brand dark void */
  --foreground: 0 0% 98%;

  /* Primary Accent - change this to your brand color */
  --primary: 154 90% 51%; /* Default: Solana Green #14F195 */
  --primary-foreground: 240 5.9% 10%;
  
  /* Secondary Accents */
  --secondary: 240 3.7% 15.9%;
  --secondary-foreground: 0 0% 98%;
}
```

### 2. Typography
The platform uses the `font-display` utility class for headers and `font-sans` for body text. Update your Google Fonts imports in the layout file and map them in `tailwind.config.ts`:

```javascript
theme: {
  extend: {
    fontFamily: {
      sans: ['Inter', ...defaultTheme.fontFamily.sans],
      display: ['Clash Display', ...defaultTheme.fontFamily.sans],
    },
  },
}
```

## Smart Contract Configurations

To align the on-chain gamification with your ecosystem, update the Anchor program configurations.

### 1. Program ID
If you deploy your own instance of the `onchain-academy` program, update the `declare_id!` macro in `onchain-academy/programs/onchain-academy/src/lib.rs` and the frontend `IDL` configurations.

### 2. Cooldowns & Limits
By default, the `close_enrollment` instruction enforces a 24-hour unenrollment cooldown if a course is not completed. You can modify this in `close_enrollment.rs`:
```rust
require!(elapsed > 86400, AcademyError::UnenrollCooldown); // Change 86400 to your desired TTL
```

### 3. XP Token Metadata
When the admin initializes the Config PDA, you provide the name, symbol, and URI for the SPL Token-2022 XP token. If you want a custom ticker (e.g., "$ECO-XP"), you set this during the initialization transaction via the CLI script located in `scripts/initialize.ts`.

## Localization

On-chain Academy uses `next-intl` for seamless multi-language support.
1. Add new language JSON dictionaries in `messages/`.
2. Update the `routing.ts` i18n configuration to include your new supported locales.
3. The platform automatically negotiates the preferred language via Next.js middleware.
