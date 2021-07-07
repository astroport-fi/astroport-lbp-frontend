/**
 * Calculates the current token price given pool sizes and weights
 *
 * @param {Int} ustPoolSize
 * @param {Int} tokenPoolSize
 * @param {Dec} ustWeight
 * @param {Dec} tokenWeight
 * @returns {Dec} Price
 */
export function calcPrice({ ustPoolSize, tokenPoolSize, ustWeight, tokenWeight }) {
  return ustPoolSize.div(ustWeight).div(
    tokenPoolSize.div(tokenWeight)
  )
}
