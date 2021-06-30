import { LCDClient } from '@terra-money/terra.js';
import { defaultNetwork } from '../config/networks';

const terraClient = new LCDClient({
  URL: defaultNetwork.lcdURL,
  chainID: defaultNetwork.chainID
});

export default terraClient;