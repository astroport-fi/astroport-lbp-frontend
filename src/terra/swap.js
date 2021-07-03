import { Extension, MsgExecuteContract, StdTx, StdFee } from '@terra-money/terra.js';
import { nativeTokenFromPair, saleAssetFromPair } from '../helpers/asset_pairs';
import terraClient from './client';

async function postMsg(msg) {
  const extension = new Extension();

  const promise = new Promise((resolve, reject) => {
    extension.once('onPost', ({ success, error }) => {
      if(success) {
        resolve();
      } else {
        reject(error);
      }
    });
  });

  // Estimate the fee (gas + stability fee/tax)
  // This is very similar to what the TxAPI create method does to estimate fees:
  //    https://github.com/terra-money/terra.js/blob/b7e7c88151fe2f404437ce7de88b9fa2a03de26a/src/client/lcd/api/TxAPI.ts#L181-L185
  const stdTx = new StdTx([msg], new StdFee(0), [])
  const fee = await terraClient.tx.estimateFee(stdTx);

  extension.post({
    msgs: [msg],
    fee
  });

  return promise;
}

export function swapFromUST({ pair, walletAddress, uusdAmount }) {
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

  return postMsg(msg);
}

export function swapFromToken({ pair, walletAddress, tokenAmount }) {
  const tokenAddr = saleAssetFromPair(pair.asset_infos).info.token.contract_addr;

  const msg = new MsgExecuteContract(
    walletAddress,
    tokenAddr,
    {
      send: {
        contract: pair.contract_addr,
        amount: String(tokenAmount),
        msg: btoa(
          JSON.stringify({
            swap: {}
          })
        )
      }
    }
  );

  return postMsg(msg);
}
