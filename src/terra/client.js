import { LCDClient } from '@terra-money/terra.js';
import config from '../config';

const terraClient = new LCDClient({
  URL: config.lcdURL,
  chainID: config.chainID
});

export default terraClient;