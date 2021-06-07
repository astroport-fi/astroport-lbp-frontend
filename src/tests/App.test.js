import { render, screen } from '@testing-library/react';
import App from '../components/App';

test('renders token sale page', () => {
  render(<App />);
  const linkElement = screen.getByText(/foo token sale/i);
  expect(linkElement).toBeInTheDocument();
});
