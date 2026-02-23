# Customization Guide

Theme Customization

Theme is controlled using Tailwind CSS.

Location:

tailwind.config.js

You can customize:

colors

fonts

spacing

dark mode

Example:

colors: {
  primary: "#14F195"
}

---

# Dark Mode

Dark mode is supported via Tailwind.

Can be extended using:

class="dark"

---

# Adding Languages (i18n)

To add new language:

Step 1: Create translation file

Example:

src/i18n/en.json
src/i18n/es.json
src/i18n/pt.json

Step 2: Add language switcher component

Step 3: Load correct translation based on user preference

---

# Extending Gamification System

Gamification logic exists in:

src/services/

You can extend:

* XP rewards
* Achievement logic
* Leaderboard system

Future integration will connect to Solana on-chain program.

---

# Adding New Courses

Use CMS to add courses.

Frontend automatically renders new courses.

No code changes required.

---

# Deployment Customization

Deployment config located in:

vite.config.ts

Supports deployment to:

* Vercel
* Netlify
* Static hosting

---

# Summary

The system is designed for easy customization, scalability, and integration.