let envNetworks = {};

if(process.env.NODE_ENV !== 'production') {
  const envConfig = require(`./environments/${process.env.NODE_ENV}.js`);
  envNetworks = envConfig.networks;
}

export const networks = {
  mainnet: {
    lcdURL: 'https://lcd.terra.dev',
    chainID: 'columbus-5',
    factoryContractAddress: '', // TBD
    gasPrices: { uusd: 0.15 }
  },
  testnet: {
    lcdURL: 'https://bombay-lcd.terra.dev',
    chainID: 'bombay-12',
    factoryContractAddress: 'terra1y358sk0fcdc8zkhrwwrwkaph93jmw5kctvn6fw',
    gasPrices: { uusd: 0.15 },
    allowedPairContracts: [
      'terra1ttz2s465khrrmv2ck2ct4v9cqhx4f3h7kgqmrq', // FOO
      'terra1yw6mwa4nz38zaacd7kzxy79h9rndpud0dvzxm3',  // TESTA
      'terra139ch6l8n9vvcrs64mpfvcjmtptxtklapn7xmlv', // TESTC
    ]
  },
  ...envNetworks
};

export const defaultNetwork = networks[process.env.REACT_APP_DEFAULT_NETWORK];
