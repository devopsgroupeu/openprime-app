// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import "@testing-library/jest-dom";
import { vi } from "vitest";
import { server } from "./mocks/server";

// Polyfill for TextEncoder/TextDecoder (required by react-router in Node.js environment)
import { TextEncoder, TextDecoder } from "node:util";

globalThis.TextEncoder = TextEncoder;
globalThis.TextDecoder = TextDecoder;

// jsdom doesn't implement scrollIntoView (used by chat/list auto-scroll effects)
Element.prototype.scrollIntoView = vi.fn();

// Mock localStorage
const localStorageMock = (function () {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    key: vi.fn((index) => Object.keys(store)[index] || null),
    length: 0,
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// MSW intercepts network calls and serves fixtures (see src/mocks/handlers.js),
// replacing the old hand-rolled global fetch stub.
beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock Keycloak globally to avoid constructor errors in ESM
vi.mock("keycloak-js", () => {
  const KeycloakMock = function () {
    return {
      init: vi.fn(() => Promise.resolve(false)),
      authenticated: false,
      login: vi.fn(),
      logout: vi.fn(),
      register: vi.fn(),
      token: "mock-token",
      refreshToken: "mock-refresh-token",
      idToken: "mock-id-token",
      tokenParsed: {},
      refreshTokenParsed: {},
      idTokenParsed: {},
      updateToken: vi.fn(() => Promise.resolve(false)),
    };
  };
  return {
    default: KeycloakMock,
  };
});
