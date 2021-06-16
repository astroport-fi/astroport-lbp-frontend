import { dateString, timeAndDateString, durationString } from '../../helpers/time_formatters';

describe('dateString', () => {
  it('returns DD-MM-YYYY date string for given Date', () => {
    expect(dateString(new Date(2021, 6, 4))).toEqual('04-07-2021');
  })
});


describe('timeAndDateString', () => {
  it('returns HH:MM (UTC) DD-MM-YYYY formatted date and time string for given ms since epoch', () => {
    const date = new Date(2021, 9, 1, 14, 7)

    expect(timeAndDateString(date.getTime())).toEqual('14:07 (UTC) 01-10-2021');
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
