export function formatUSD(amount) {
  const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

  return formatter.format(amount)
};

export function formatNumber(amount, opts={}) {
  return new Intl.NumberFormat(undefined, opts).format(amount);
};

export function formatTokenAmount(amount, decimals) {
  const wholeTokens = amount/10**decimals;

  return formatNumber(
    wholeTokens,
    { maximumSignificantDigits: String(amount).length }
  );
}
