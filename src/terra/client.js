import { LCDClient } from '@terra-money/terra.js';

const terraClient = new LCDClient({
  URL: 'http://localhost:1317',
  chainID: 'localterra'
});

export default terraClient;