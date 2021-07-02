import { Extension, MsgExecuteContract } from '@terra-money/terra.js';
import { nativeTokenFromPair } from '../helpers/asset_pairs';
import terraClient from './client';

export async function swapFromUST({ pair, walletAddress, uusdAmount }) {
  const extension = new Extension();

  const msg = new MsgExecuteContract(
    walletAddress,
    pair.contract_addr,
    {
      swap: {
        offer_asset: {
          info: {
            native_token: {
              denom: nativeTokenFromPair(pair.asset_infos).info.native_token.denom
            }
          },
          amount: String(uusdAmount)
        },
        to: walletAddress
      }
    },
    { uusd: uusdAmount }
  );

  // For automatic fee calculation/estimation
  // More info here: https://github.com/terra-money/terra.js/issues/64
  const tx = await terraClient.tx.create(walletAddress, {
    msgs: [msg]
  });

  const promise = new Promise((resolve, reject) => {
    extension.once('onPost', ({ success, error }) => {
      if(success) {
        resolve();
      } else {
        reject(error);
      }
    });
  });

  extension.post({
    msgs: [msg],
    fee: tx.fee
  });

  return promise;
}
