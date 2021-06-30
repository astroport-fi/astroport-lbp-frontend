let envNetworks = {};

if(process.env.NODE_ENV !== 'production') {
  const envConfig = require(`./environments/${process.env.NODE_ENV}.js`);
  envNetworks = envConfig.networks;
}

const networks = {
  mainnet: {
    lcdUrl: 'https://lcd.terra.dev',
    chainID: 'columbus-4',
    factoryContractAddress: '' // TBD
  },
  testnet: {
    lcd: 'https://tequila-lcd.terra.dev',
    chainID: 'tequila-0004',
    factoryContractAddress: 'terra1fyn0x6n4gutqljjju6nkwxesxy24thaxu9vjpx'
  },
  ...envNetworks
};

export const defaultNetwork = networks[process.env.REACT_APP_DEFAULT_NETWORK];
