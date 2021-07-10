import { Dec } from '@terra-money/terra.js';
import { NATIVE_TOKEN_DECIMALS } from '../constants';

/**
 * Calculates the current token price given pool sizes and weights
 *
 * @param {Int} ustPoolSize
 * @param {Int} tokenPoolSize
 * @param {Dec} ustWeight
 * @param {Dec} tokenWeight
 * @param {number} tokenDecimals
 * @returns {Dec} Price
 */
export function calcPrice({ ustPoolSize, tokenPoolSize, ustWeight, tokenWeight, tokenDecimals }) {
  return Dec.withPrec(ustPoolSize, NATIVE_TOKEN_DECIMALS).div(ustWeight).div(
    Dec.withPrec(tokenPoolSize, tokenDecimals).div(tokenWeight)
  )
}
