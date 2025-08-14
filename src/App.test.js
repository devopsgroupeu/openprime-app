import { render, screen } from '@testing-library/react';
import App from './App';

test('renders OpenPrime application', () => {
  render(<App />);
  const titleElement = screen.getByText(/Deploy Anywhere with OpenPrime/i);
  expect(titleElement).toBeInTheDocument();
});
