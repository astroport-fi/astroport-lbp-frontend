export function formatUSD(amount) {
  const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

  return formatter.format(amount)
};

export function formatNumber(amount) {
  return new Intl.NumberFormat().format(amount);
};
