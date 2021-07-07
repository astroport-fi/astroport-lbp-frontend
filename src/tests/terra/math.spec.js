import { calcPrice } from '../../terra/math';
import { Int, Dec } from '@terra-money/terra.js';

describe('calcPrice', () => {
  it('calculates current token price based on pool sizes and weights', () => {
    const price = calcPrice({
      ustPoolSize: new Int(50_000_000),
      tokenPoolSize: new Int(2_450_000_000),
      ustWeight: new Dec(5.8),
      tokenWeight: new Dec(94.2)
    });

    expect(price.toFixed(4)).toEqual('0.3315');
  });
});
