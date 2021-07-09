import { Extension } from '@terra-money/terra.js';

export const EXTENSION_UNAVAILABLE = 1;

export function connectExtension() {
  // TODO: Time out at some point
  return new Promise((resolve, reject) => {
    const extension = new Extension();

    if(extension.isAvailable) {
      extension.connect();

      extension.once('onConnect', (wallet) => {
        resolve(wallet);
      });
    } else {
      reject({ reason: EXTENSION_UNAVAILABLE });
    }
  });
}
