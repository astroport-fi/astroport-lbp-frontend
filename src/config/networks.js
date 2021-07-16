let envNetworks = {};

if(process.env.NODE_ENV !== 'production') {
  const envConfig = require(`./environments/${process.env.NODE_ENV}.js`);
  envNetworks = envConfig.networks;
}

export const networks = {
  mainnet: {
    lcdURL: 'https://lcd.terra.dev',
    chainID: 'columbus-4',
    factoryContractAddress: '', // TBD
    gasPrices: { uusd: 0.15 }
  },
  testnet: {
    lcdURL: 'https://tequila-lcd.terra.dev',
    chainID: 'tequila-0004',
    factoryContractAddress: 'terra1y358sk0fcdc8zkhrwwrwkaph93jmw5kctvn6fw',
    gasPrices: { uusd: 0.15 },
    allowedPairContracts: [
      'terra1ttz2s465khrrmv2ck2ct4v9cqhx4f3h7kgqmrq', // FOO
      'terra109mvhus4fl50mh4c84cuk4ul3lcpuk2cwhdf6d', // TESTC
      'terra1yw6mwa4nz38zaacd7kzxy79h9rndpud0dvzxm3'  // TESTA
    ]
  },
  ...envNetworks
};

export const defaultNetwork = networks[process.env.REACT_APP_DEFAULT_NETWORK];
