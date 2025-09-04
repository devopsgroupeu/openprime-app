import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

// Mock Keycloak
jest.mock('keycloak-js', () => {
  return jest.fn(() => ({
    init: jest.fn(() => Promise.resolve(false)),
    authenticated: false,
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
    token: null,
    refreshToken: null,
    idToken: null,
    tokenParsed: null,
    refreshTokenParsed: null,
    idTokenParsed: null,
    updateToken: jest.fn(() => Promise.resolve(false)),
  }));
});

test('renders OpenPrime application loading state', async () => {
  render(<App />);

  // Initially should show authentication loading state
  expect(screen.getByText(/Initializing authentication/i)).toBeInTheDocument();

  // Wait for authentication to complete
  await waitFor(() => {
    expect(screen.queryByText(/Initializing authentication/i)).not.toBeInTheDocument();
  }, { timeout: 3000 });
});
