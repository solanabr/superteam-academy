# SolLearn API (Backend)

The SolLearn API is the backend infrastructure powering Osmos Academy, a decentralized learning platform built on Solana. It serves as the primary data and business layer, bridging the frontend Next.js application, the Sanity CMS, and the Solana blockchain.

## 🚀 Tech Stack

- **Framework**: [Express.js](https://expressjs.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Database**: [MongoDB](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/)
- **Authentication**: JWT & OAuth (Google/GitHub)
- **Web3 Integration**: `@solana/web3.js`, `@solana/spl-token`
- **Documentation**: Swagger UI (`swagger-jsdoc`, `swagger-ui-express`)

## 🛠️ Local Development Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Copy the `.env.example` file to `.env` (or whatever naming convention is used locally):
```bash
cp .env.example .env
```
Ensure you have configured the essential environment variables, particularly:
- `MONGO_URI`: Connection string to your MongoDB instance.
- Authentication secrets (JWT, Google/GitHub client details).
- Solana RPC URLs and associated credentials dynamically used by the app.

### 3. Run the Development Server
```bash
npm run dev
```
By default, the API will run on `http://localhost:5050`.

### 4. API Documentation
Swagger documentation is automatically generated and accessible in development mode.
Open [http://localhost:5050/api/v1/sollearn/api-docs](http://localhost:5050/api/v1/sollearn/api-docs) in your browser to explore the available endpoints, parameters, and responses.

## 🗄️ Database Seeding

On initial startup, the backend automatically runs a seed script (`seedAchievementTypes()`) to initialize default Gamification parameters (Achievement Types) in MongoDB. This process safely upserts the required records without duplicating them.
