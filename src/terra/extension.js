import { Extension } from '@terra-money/terra.js';

export const EXTENSION_UNAVAILABLE = 1;

export function connectExtension() {
  // TODO: Time out at some point
  return new Promise((resolve, reject) => {
    const extension = new Extension();

    if(extension.isAvailable) {
      extension.connect();

      extension.once('onConnect', async (wallet) => {
        const { payload: info } = await extension.request('info');

        resolve({ ...wallet, ...info });
      });
    } else {
      reject({ reason: EXTENSION_UNAVAILABLE });
    }
  });
}
