// Returns the current UST exchange rate in USD
async function fetchUSTExchangeRate() {
  const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=terrausd&vs_currencies=usd');
  const { terrausd: { usd } } = await response.json();

  return usd;
};

export default fetchUSTExchangeRate;
