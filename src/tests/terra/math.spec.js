import { calcPrice } from '../../terra/math';

describe('calcPrice', () => {
  it('calculates current token price based on pool sizes and weights', () => {
    const price = calcPrice({
      ustPoolSize: 50_000_000,
      tokenPoolSize: 2_450_000_000,
      ustWeight: 5.8,
      tokenWeight: 94.2
    });

    expect(Math.round(price*10000)/10000).toEqual(0.3315);
  });
});
