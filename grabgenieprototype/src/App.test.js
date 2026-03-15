import { render, screen } from '@testing-library/react';
import App from './App';

test('renders grab genie flow', () => {
  render(<App />);
  const heading = screen.getByText(/try grab genie/i);
  expect(heading).toBeInTheDocument();
});
