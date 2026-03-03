// Program configuration and types
export * from './constants';
export * from './types';
export * from './pda';
export * from './client';

// Re-export IDL for type generation
export { default as IDL } from './academy.json';
