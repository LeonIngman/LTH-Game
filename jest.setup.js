import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "util";

// Polyfill for Node.js environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock fetch for Node.js environment
global.fetch = jest.fn();

// Mock Request and Response for API routes
global.Request = jest.fn().mockImplementation((url, init) => ({
  url,
  method: init?.method || "GET",
  headers: init?.headers || {},
  body: init?.body,
  json: jest.fn().mockResolvedValue({}),
}));

global.Response = jest.fn().mockImplementation((body, init) => ({
  status: init?.status || 200,
  headers: init?.headers || {},
  json: jest.fn().mockResolvedValue(JSON.parse(body)),
  text: jest.fn().mockResolvedValue(body),
}));

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    };
  },
  useSearchParams() {
    return {
      get: jest.fn(() => null),
    };
  },
  usePathname() {
    return "";
  },
}));

// Mock next/headers for API routes
jest.mock("next/headers", () => ({
  cookies: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
  })),
}));

// Global test timeout
jest.setTimeout(10000);

// Mock environment variables
process.env.NODE_ENV = "test";
process.env.NEXTAUTH_SECRET = "test-secret";
process.env.DATABASE_URL = "postgresql://test@localhost:5432/test_db";
