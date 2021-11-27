let envNetworks = {};

if(process.env.NODE_ENV !== 'production') {
  const envConfig = require(`./environments/${process.env.NODE_ENV}.js`);
  envNetworks = envConfig.networks;
}

export const networks = {
  mainnet: {
    lcdURL: 'https://lcd.terra.dev',
    chainID: 'columbus-5',
    factoryContractAddress: '', // Fill in with your project's factory contract
    gasPrices: { uusd: 0.15 },
    allowedPairContracts: [
      // Fill in with your project's pair contract(s)
    ]
  },
  testnet: {
    lcdURL: 'https://bombay-lcd.terra.dev',
    chainID: 'bombay-12',
    factoryContractAddress: 'terra1nt459erudaug8d2vsqjmhv7zc9c9vmamj3esn9',
    gasPrices: { uusd: 0.15 },
    allowedPairContracts: [
      'terra1vmsnmx6q3amlhrkzy8yelefxdv572rw5m4qeec' // TESTA
    ]
  },
  ...envNetworks
};

export const defaultNetwork = networks[process.env.REACT_APP_DEFAULT_NETWORK];
