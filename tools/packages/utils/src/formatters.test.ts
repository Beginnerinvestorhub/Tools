import { formatCurrency } from './formatters';

describe('formatCurrency', () => {
  it('formats numbers as USD', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
  });
});
