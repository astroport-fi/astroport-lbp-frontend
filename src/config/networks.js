let envNetworks = {};

if(process.env.NODE_ENV !== 'production') {
  const envConfig = require(`./environments/${process.env.NODE_ENV}.js`);
  envNetworks = envConfig.networks;
}

const networks = {
  mainnet: {
    lcdURL: 'https://lcd.terra.dev',
    chainID: 'columbus-4',
    factoryContractAddress: '' // TBD
  },
  testnet: {
    lcdURL: 'https://tequila-lcd.terra.dev',
    chainID: 'tequila-0004',
    factoryContractAddress: 'terra1y358sk0fcdc8zkhrwwrwkaph93jmw5kctvn6fw'
  },
  ...envNetworks
};

export const defaultNetwork = networks[process.env.REACT_APP_DEFAULT_NETWORK];
