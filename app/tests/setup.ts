import '@testing-library/jest-dom/vitest';

// Mock server-only for test environment
import { vi } from 'vitest';
vi.mock('server-only', () => ({}));
