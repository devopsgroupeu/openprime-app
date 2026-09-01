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
    // A getter, not a literal 0: with a hardcoded zero any code that walks
    // storage via length/key() sees an empty store no matter what is in it,
    // and its tests pass while doing nothing.
    get length() {
      return Object.keys(store).length;
    },
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

// --- Runtime catalog: tests run against the HYDRATED registry ----------------
//
// OP-208. Without this, every suite asserted against the static service config
// and the flag-on path was covered by nothing — so a catalog that could not
// actually stand in for aws.js would have passed CI.
//
// It earned its keep immediately: it found that the catalog carried no
// validation for services.vpc.cidr, i.e. hydrating dropped the only check on a
// VPC network range, and it did so in the same window as the backend removing
// its own CIDR validator. Neither catalog gate could see it.
//
// The fixture is the same document Injecto extracts from the templates repo,
// so "the tests pass hydrated" means the real catalog can stand in.
import catalogFixture from "./mocks/catalog.json";
import { hydrateServicesConfig } from "./config/servicesConfig";

hydrateServicesConfig(catalogFixture);
