import { Extension, MsgExecuteContract, StdTx, StdFee } from '@terra-money/terra.js';
import { nativeTokenFromPair, saleAssetFromPair } from '../helpers/asset_pairs';
import terraClient from './client';

/**
 * Terra account address
 * @typedef {string} Address
 */

async function postMsg(msg) {
  const extension = new Extension();

  const promise = new Promise((resolve, reject) => {
    extension.once('onPost', ({ success, error, result }) => {
      if(success) {
        resolve(result);
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

/**
 * Creates native token -> contract token swap message and posts to station extension
 * @param pair - Asset pair from queries/getLBPs
 * @param {Address} walletAddress - User's wallet address
 * @param {Int} nativeIntAmount - Int amount to swap in smallest unit of native token
 * @returns {Promise} - Resolves/rejects when station extension emits next onPost event
 */
export function swapFromNativeToken({ pair, walletAddress, nativeIntAmount }) {
  const denom = nativeTokenFromPair(pair.asset_infos).info.native_token.denom;

  const msg = new MsgExecuteContract(
    walletAddress,
    pair.contract_addr,
    {
      swap: {
        offer_asset: {
          info: {
            native_token: {
              denom
            }
          },
          amount: nativeIntAmount
        },
        to: walletAddress
      }
    },
    { [denom]: nativeIntAmount }
  );

  return postMsg(msg);
}

/**
 * Creates contract token -> native token swap message and posts to station extension
 * @param pair - Asset pair from queries/getLBPs
 * @param {Address} walletAddress - User's wallet address
 * @param {Int} tokenIntAmount - Int amount to swap in smallest unit of token
 * @returns {Promise} - Resolves/rejects when station extension emits next onPost event
 */
export function swapFromContractToken({ pair, walletAddress, tokenIntAmount }) {
  const tokenAddr = saleAssetFromPair(pair.asset_infos).info.token.contract_addr;

  const msg = new MsgExecuteContract(
    walletAddress,
    tokenAddr,
    {
      send: {
        contract: pair.contract_addr,
        amount: tokenIntAmount,
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
