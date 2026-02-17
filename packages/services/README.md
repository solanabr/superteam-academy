# @superteam/services

A comprehensive service abstraction layer for the Superteam Academy platform, providing real-world implementations for learning progress tracking, credential management, leaderboards, analytics, and authentication.

## Features

- **Learning Progress Service**: Tracks learner progress on Solana blockchain
- **Credential Service**: Issues and manages MPL Core-based credentials
- **Leaderboard Service**: Database-backed leaderboard with real-time rankings
- **Analytics Service**: Google Analytics 4 integration for event tracking
- **Auth Linking Service**: OAuth and wallet linking via better-auth

## Installation

```bash
pnpm add @superteam/services
```

## Quick Start

```typescript
import {
  ServiceFactory,
  ServiceConfig,
  getLearningProgressService,
  getCredentialService
} from "@superteam/services";
import { Connection, PublicKey } from "@solana/web3.js";

// Configure services
const config: ServiceConfig = {
  environment: 'development',
  solana: {
    connection: new Connection('https://api.devnet.solana.com'),
    programId: new PublicKey('3YchgRgR65gdRqgTZTM5qQXqtTZn5Kt2i6FPnZVu34Qb'),
    wallet: yourWalletAdapter
  },
  analytics: {
    measurementId: 'GA_MEASUREMENT_ID'
  },
  auth: {
    betterAuth: yourBetterAuthInstance
  },
  database: {
    url: 'postgresql://localhost:5432/superteam_academy'
  }
};

// Initialize factory
ServiceFactory.initialize(config);

// Use services
const learningService = getLearningProgressService();
const progress = await learningService.getLearnerProgress('user123');
```

## Service Implementations

### LearningProgressService (Solana-based)

Tracks learner progress directly on the Solana blockchain using PDAs:

```typescript
const progress = await learningService.getLearnerProgress('user123');
const completion = await learningService.completeLesson('enrollmentId:learnerId', 0);
```

### CredentialService (MPL Core)

Issues upgradeable credentials as NFTs on Solana:

```typescript
const credential = await credentialService.issueCredential({
  learnerId: 'user123',
  trackId: 1,
  level: 1
});
```

### LeaderboardService (Database)

Real-time leaderboard with database persistence:

```typescript
const leaderboard = await leaderboardService.getLeaderboard({ limit: 10 });
const userRank = await leaderboardService.getUserRank('user123');
```

### AnalyticsService (Google Analytics 4)

Event tracking and user analytics:

```typescript
await analyticsService.trackEvent({
  name: 'course_completed',
  userId: 'user123',
  value: 500
});
```

### AuthLinkingService (better-auth)

OAuth and wallet linking:

```typescript
const result = await authService.linkOAuthAccount(
  'user123',
  'google',
  'authorization_code'
);
```

## Architecture

The service layer follows these principles:

- **Interface-based design**: All services implement well-defined interfaces
- **Dependency injection**: Services are configured via the ServiceFactory
- **Environment-aware**: Different implementations for development/staging/production
- **Error handling**: Comprehensive error handling with typed error responses
- **Caching**: Built-in caching interfaces for performance optimization

## Development

### Building

```bash
pnpm build
```

### Testing

```bash
pnpm test
```

### Adding New Services

1. Define the service interface in `src/interfaces/`
2. Implement the service in `src/impl/`
3. Add the service to the ServiceFactory
4. Update exports in `src/index.ts`

## Migration from Stubs

The package includes both real implementations and stub versions for development. To migrate:

1. Update your ServiceConfig with real service dependencies
2. Replace stub service imports with real service imports
3. Ensure all required dependencies are configured

## Dependencies

- `@solana/web3.js`: Solana blockchain interaction
- `@coral-xyz/anchor`: Anchor framework for Solana programs
- `@superteam/solana`: Shared Solana utilities
- `@superteam/anchor`: Program type definitions
- `axios`: HTTP client for external APIs

## License

ISC
