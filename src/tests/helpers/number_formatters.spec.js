import { formatUSD, formatNumber, formatTokenAmount } from '../../helpers/number_formatters';

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

describe('formatTokenAmount', () => {
  it("formats given number of tokens as number of whole tokens as formatted string with all decimals", () => {
    const germanLocale = Intl.NumberFormat('de-DE', { maximumSignificantDigits: 12 });

    const intlSpy = jest
      .spyOn(Intl, 'NumberFormat')
      .mockImplementation(() => germanLocale);

    expect(formatTokenAmount(999999999999, 6)).toEqual('999.999,999999');

    expect(intlSpy).toHaveBeenCalledWith(undefined, { maximumSignificantDigits: 12 });

    intlSpy.mockRestore();
  });
});
