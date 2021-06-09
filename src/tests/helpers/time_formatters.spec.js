import { dateString, timeAndDateString } from '../../helpers/time_formatters';

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