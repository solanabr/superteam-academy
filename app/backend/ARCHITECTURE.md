# Backend Architecture

This document describes the structure, data flow, and key components of the SolLearn Express backend application.

## 📂 Directory Structure

The project follows a standard Model-Route-Controller pattern tailored for a TypeScript Express API.

```text
backend/
├── src/
│   ├── controllers/      # Request handling & orchestrating responses
│   ├── middlewares/      # Intercepting requests (Auth, Rate Limiting, Error Handling)
│   ├── models/           # Mongoose schemas (e.g., User, Course, Milestone, Lesson)
│   ├── routes/           # Express Routers mapping endpoints to controllers
│   ├── services/         # Core business logic, Solana interactions, & API integrations
│   ├── server.ts         # Application entry point, setup, & middleware configuration
│   ├── seed.ts           # Database seeding scripts for initial data setup
│   └── swagger.ts        # Swagger (OpenAPI) configuration and specification
└── public/               # Served static assets
```

## 🏗️ System Architecture & Data Flow

### 1. Request Handling Lifecycle
- **Routes Layer**: Incoming requests map to specific RESTful endpoints in `src/routes/`.
- **Middleware Layer**: Requests dynamically pass through global middlewares (`cors`, `helmet`, `mongoSanitize`, `rateLimit`) and route-specific ones (e.g., authentication checks).
- **Controller Layer**: The controllers in `src/controllers/` parse the request payloads, call the appropriate service functions, and format the final JSON responses.
- **Service & Model Layer**: Services (`src/services/`) execute the heavy lifting (business rules, RPC calls, Sanity fetches) and utilize Mongoose models (`src/models/`) to read/write state persistently in MongoDB.

### 2. MongoDB as the Primary Data Store
While content originates from the Sanity Headless CMS, the SolLearn backend relies on **MongoDB** as its primary operational database.
This architecture allows for:
- Fast query performance, filtering, and full-text searches.
- Highly relational operations mapping user profiles and progression states (completions, XP) strictly to the curriculum content.

### 3. Security & Stability
- **Rate Limiting**: Applied globally (e.g., 200 req/min/IP via `generalLimiter`) to prevent brute force and DDoS attacks.
- **Sanitization**: Uses `express-mongo-sanitize` to block NoSQL injection vectors.
- **Headers Protection**: `helmet` dynamically injects secure HTTP headers.

### 4. Smart Contract Proxies
To streamline frontend complexities, the backend serves as a relayer or data provider for Solana interactions:
- Handling the off-chain verification logic for course completions.
- Supplying metadata for Soulbound Tokens (cNFTs) generated when users claim their XP rewards upon passing code challenges.
