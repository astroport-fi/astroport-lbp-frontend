import { LCDClient } from '@terra-money/terra.js';

export function buildClient(network) {
  return new LCDClient({
    URL: network.lcdURL,
    chainID: network.chainID,
    gasPrices: network.gasPrices
  });
}
