# Superteam Academy — Frontend MVP

Production-ready MVP frontend for the Superteam Academy platform — a gamified learning management system (LMS) designed to onboard and educate Solana developers through interactive courses, coding challenges, and on-chain credential integration.

This implementation provides a scalable, modular frontend architecture ready to integrate with the Superteam Academy Anchor program for XP tokens, credentials, and achievements.

Live Demo:
[https://solana-academy-pro-learn.vercel.app/]

---

# Overview

Superteam Academy is an interactive education platform for Solana developers, combining structured courses, coding challenges, and gamification to create an engaging learning experience.

This frontend MVP enables users to:

* Browse and explore courses
* View lessons and complete coding challenges
* Track XP and level progression
* View dashboard and learning progress
* Manage user profile and credentials (integration-ready)

The architecture is designed with clean abstractions to support seamless integration with on-chain Solana programs.

---

# Tech Stack

Frontend Framework

* React
* Vite

Language

* TypeScript (strict mode)

Styling and UI

* Tailwind CSS
* shadcn/ui component system

State and Architecture

* Modular component-based architecture
* Service abstraction layer for future on-chain integration

Deployment

* Vercel

Development Tools

* Node.js
* npm

---

# Project Structure

```bash
app/
  src/
    components/     # Reusable UI components
    pages/          # Application pages
    test/           # Set up
    hooks/          # Custom React hooks
    utils/          # Utility functions
  public/           # Static assets
  package.json
  vite.config.ts
```

---

# Local Development Setup

## Prerequisites

Install the following:

* Node.js (v18 or later recommended)
* npm or yarn

Check version:

```bash
node -v
npm -v
```

---

## Installation

Clone the repository:

```bash
git clone https://github.com/Lishguy/solana-academy-pro.git
```

Navigate to the frontend folder:

```bash
cd solana-academy-pro
```

Install dependencies:

```bash
npm install
```

---

## Run Development Server

Start the local development server:

```bash
npm run dev
```

Application will run at:

```bash
http://localhost:5173
```

---

# Environment Variables

Create a `.env` file inside `/app`:

```bash
touch .env
```

Example environment variables:

```env
VITE_APP_NAME=Solana-Academy-Pro
VITE_ENV=development
```

Optional (for analytics / integrations):

```env
VITE_GA_ID=your_google_analytics_id
VITE_SENTRY_DSN=your_sentry_dsn
```

---

# Build for Production

To build the application:

```bash
npm run build
```

To preview production build:

```bash
npm run dev
```

---

# Deployment

This project is deployed using Vercel.

Production deployment:
[https://solana-academy-pro-learn.vercel.app/]

To deploy manually:

```bash
npm run build
```

Then deploy the `/dist` folder to:

* Vercel (recommended)
* Netlify
* or any static hosting provider

---

# Gamification System (Integration-Ready)

The frontend includes a gamification architecture compatible with the Superteam Academy on-chain program.

Implemented:

* XP tracking interface
* Level calculation logic
* Progress tracking system
* Credential display architecture

Ready for integration with:

* Solana Token-2022 XP tokens
* Metaplex credential NFTs
* Achievement system
* Leaderboard indexing

---

# Architecture Design

Key principles:

* Modular architecture
* Clean separation of concerns
* Service abstraction layer
* On-chain integration readiness
* Scalable and maintainable structure

This ensures seamless future integration with the Anchor program located in:

```bash
/onchain-academy
```

---

# Implemented MVP Features

* Landing page
* Course catalog
* Course detail pages
* Lesson viewer
* Challenge interface with code editor
* User dashboard with XP tracking
* User profile page
* Gamification system (stub integration-ready)
* Responsive modern UI

---

# Performance and Optimization

Optimized for:

* Fast load times
* Efficient rendering
* Responsive layout
* Production-ready build optimization

---

# Contribution

This frontend implementation is submitted as part of the Superteam Academy bounty and integrated into the monorepo structure under:

```bash
/app
```

---

# Author

Michael
Frontend Developer — Web3 Builder

---

# License

Open-source and available under the MIT License.

---


