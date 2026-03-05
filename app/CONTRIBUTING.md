# Contributing to Superteam Academy

First off, thank you for considering contributing to Superteam Academy! It's people like you that make this open-source project such a great tool for learning and development in the Solana ecosystem.

## Where do I go from here?

If you've noticed a bug or have a request for a new feature, please [open an issue](https://github.com/exyreams/superteam-academy/issues). If you'd like to contribute code, you can do so by submitting a pull request.

## Local Development Setup

To get you set up locally to work on the project, you will need to clone the repository, install the dependencies, and configure the necessary environment variables.

### Prerequisites

You will need the following installed:
* [Node.js](https://nodejs.org/) (v20+ recommended)
* [Bun](https://bun.sh/) (Package manager)
* [Rust](https://www.rust-lang.org/) and [Cargo](https://doc.rust-lang.org/cargo/) (For Anchor/Solana development)
* [Solana CLI](https://docs.solanalabs.com/cli/install)
* [Anchor CLI](https://www.anchor-lang.com/docs/installation)

### 1. Clone the repository

```bash
git clone https://github.com/exyreams/superteam-academy.git
cd superteam-academy
```

### 2. Install Dependencies

We use `bun` for package management.

```bash
bun install
```

### 3. Environment Variables

Copy the example environment file and fill in your specific application secrets.

```bash
cp .env.example .env.local
```

Ensure you configure your internal keys including the `BACKEND_SIGNER_KEYPAIR` and `XP_MINT_KEYPAIR`, as noted in `.env.example`.

### 4. Database Setup

We use PostgreSQL with Drizzle ORM. Make sure you have a valid connection string in `DATABASE_URL` within your `.env.local` file.

To push the schema to your database:

```bash
bun run db:push
```

### 5. Running the Application

Start the local development server:

```bash
bun run dev
```

The application will be available at `http://localhost:3000`.

## Code Style and Linting

We use [Biome](https://biomejs.dev/) to format and lint our code.

* Check formatting and linting: `bun run check`
* Auto-fix errors and format: `bun run lint:fix` && `bun run format`
* Check TypeScript types: `bun run typecheck`

Please ensure your code passes the linting checks before submitting a pull request.

## Pull Request Process

1. Fork the repository and create your branch from `main`.
2. Ensure you have run formatting and typechecking.
3. If you've added code that should be tested, add tests.
4. Ensure the test suite passes.
5. Create a descriptive Pull Request detailing the changes you made and the issue it resolves.

## Getting Help

If you need help, feel free to ask questions in the issues or discussions tab. We appreciate your efforts and will do our best to assist you.
