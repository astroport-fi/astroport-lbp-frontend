let envNetworks = {};

if(process.env.NODE_ENV !== 'production') {
  const envConfig = require(`./environments/${process.env.NODE_ENV}.js`);
  envNetworks = envConfig.networks;
}

const networks = {
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
      'terra1jeaz8ulv78cze40dxm8rd8tcj077f2unlypzx9', // TESTA
      'terra1mw29javp5k2k7wxyk29cyyfv6nxlhvt83l7ak9'  // TESTB
    ]
  },
  ...envNetworks
};

export const defaultNetwork = networks[process.env.REACT_APP_DEFAULT_NETWORK];
