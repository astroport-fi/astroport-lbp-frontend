import fetchUSTExchangeRate from '../../services/fetch_ust_exchange_rate';

describe('fetchUSTExchangeRate', () => {
  beforeEach(() => {
    fetch.resetMocks();
  })

  it('fetches UST exchange rate from coingecko and returns price', async () => {
    fetch.mockResponseOnce(JSON.stringify({
      terrausd: {
        usd: 1.01
      }
    }));

    expect(await fetchUSTExchangeRate()).toEqual(1.01);

    expect(fetch.mock.calls.length).toEqual(1)
    expect(fetch.mock.calls[0][0]).toEqual(
      'https://api.coingecko.com/api/v3/simple/price?ids=terrausd&vs_currencies=usd'
    )
  })
});
