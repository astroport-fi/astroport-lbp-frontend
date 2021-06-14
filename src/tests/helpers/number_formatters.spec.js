import { formatUSD, formatNumber } from '../../helpers/number_formatters';

describe('formatUSD', () => {
  it('formats given number as USD currency rounded to the nearest penny', () => {
    expect(formatUSD(42123.777)).toEqual('$42,123.78');
  });
});

describe('formatNumber', () => {
  it("formats given number in user's locale", () => {
    const germanLocale = Intl.NumberFormat('de-DE');

    const intlSpy = jest
      .spyOn(Intl, 'NumberFormat')
      .mockImplementation(() => germanLocale);

    expect(formatNumber(42123.777)).toEqual('42.123,777');

    intlSpy.mockRestore();
  });
});
