import { Extension, MsgExecuteContract, StdTx, StdFee } from '@terra-money/terra.js';
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

  // Estimate the fee (gas + stability fee/tax)
  // This is very similar to what the TxAPI create method does to estimate fees:
  //    https://github.com/terra-money/terra.js/blob/b7e7c88151fe2f404437ce7de88b9fa2a03de26a/src/client/lcd/api/TxAPI.ts#L181-L185
  const stdTx = new StdTx([msg], new StdFee(0), [])
  const fee = await terraClient.tx.estimateFee(stdTx);

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
    fee
  });

  return promise;
}
