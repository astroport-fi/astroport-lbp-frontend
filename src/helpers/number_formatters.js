import { Dec } from '@terra-money/terra.js';

export function formatUSD(amount) {
  const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

  return formatter.format(amount)
};

export function formatNumber(amount, opts={}) {
  return new Intl.NumberFormat(undefined, opts).format(amount);
};

export function formatTokenAmount(amount, decimals) {
  const tokens = Dec.withPrec(amount, decimals);

  return formatNumber(
    parseFloat(tokens.toString()),
    { maximumSignificantDigits: String(amount).length }
  );
}
