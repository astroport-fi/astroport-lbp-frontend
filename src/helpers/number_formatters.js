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
  const formatter = new Intl.NumberFormat(undefined, { maximumSignificantDigits: String(amount).length });
  const parts = formatter.formatToParts(parseFloat(tokens.toString()));

  if(parts[parts.length-1].type === 'fraction') {
    parts[parts.length-1].value = tokens.toFixed(decimals).split('.')[1];
  }

  return parts.map(part => part.value).join('');
}

export function dropInsignificantZeroes(numString) {
  return numString.replace(/(\.\d*?)0*$/, '$1').replace(/\.$/, '');
}
