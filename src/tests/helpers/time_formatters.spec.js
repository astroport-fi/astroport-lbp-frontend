import { dateString, timeAndDateString, durationString } from '../../helpers/time_formatters';

describe('dateString', () => {
  it('returns locale-specific date string for given Date', () => {
    const date = new Date(Date.UTC(2021, 6, 4, 12));

    const enUSFormattedDate = date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'America/New_York'
    });

    const toLocaleStringSpy = jest.spyOn(date, 'toLocaleString');
    toLocaleStringSpy.mockReturnValue(enUSFormattedDate);

    expect(dateString(date)).toEqual('07/04/2021');
  })
});

describe('timeAndDateString', () => {
  it('returns locale-specific formatted date and time string for given ms since epoch', () => {
    const timestamp = Date.UTC(2021, 9, 1, 18, 7);

    const enUSFormattedDate = new Date(timestamp).toLocaleString('en-US', {
      timeZoneName: 'short',
      hour: '2-digit',
      minute: '2-digit',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'America/New_York'
    });

    const toLocaleStringSpy = jest.spyOn(Date.prototype, 'toLocaleString');
    toLocaleStringSpy.mockReturnValue(enUSFormattedDate);

    expect(timeAndDateString(timestamp)).toEqual('10/01/2021, 02:07 PM EDT');
  })
});

describe('durationString', () => {
  it('returns duration string with days, hours, and minutes for given number of seconds', () => {
    expect(durationString(7 * 24 * 60 * 60 + 3 * 60 * 60 + 42 * 60)).toEqual('7d : 3h : 42m');
  });

  it('returns string with 0d when seconds are less than 1 day', () => {
    expect(durationString(7 * 60 * 60 + 1 * 60)).toEqual('0d : 7h : 1m');
  });

  it('returns string with 0d and 0m when seconds are less than 1 hour', () => {
    expect(durationString(59 * 60)).toEqual('0d : 0h : 59m');
  });

  it('returns 1m when seconds are exactly 60', () => {
    expect(durationString(60)).toEqual('0d : 0h : 1m');
  });

  it('returns < 1m when seconds are less than 60', () => {
    expect(durationString(59)).toEqual('< 1m');
  });
});
