import { formatUSD, formatNumber, formatTokenAmount, dropInsignificantZeroes } from '../../helpers/number_formatters';

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

describe('dropInsignificantZeroes', () => {
  it('drops insignificant zeroes after the decimal', () => {
    expect(dropInsignificantZeroes('2000.123000')).toEqual('2000.123');
  });

  it('does not drop significant zeroes', () => {
    expect(dropInsignificantZeroes('2000.1203000')).toEqual('2000.1203');
  });

  it('does not drop zeroes at the end of an integer', () => {
    expect(dropInsignificantZeroes('2000')).toEqual('2000');
    expect(dropInsignificantZeroes('123')).toEqual('123');
  });

  it('returns decimal string if it does not contain insignificant zeroes', () => {
    expect(dropInsignificantZeroes('2000.123')).toEqual('2000.123');
    expect(dropInsignificantZeroes('123.456')).toEqual('123.456');
  });

  it('drops decimal when all zeroes are insignificant', () => {
    expect(dropInsignificantZeroes('2000.000')).toEqual('2000');
  });
});
