import { Extension, MsgExecuteContract, StdTx, StdFee, Int, Coin, Coins } from '@terra-money/terra.js';
import { nativeTokenFromPair, saleAssetFromPair } from '../helpers/asset_pairs';
import terraClient from './client';

/**
 * Terra account address
 * @typedef {string} Address
 */

export function estimateFee(msg) {
  // Estimate the fee (gas + stability fee/tax)
  // This is very similar to what the TxAPI create method does to estimate fees:
  //    https://github.com/terra-money/terra.js/blob/b7e7c88151fe2f404437ce7de88b9fa2a03de26a/src/client/lcd/api/TxAPI.ts#L181-L185
  const stdTx = new StdTx([msg], new StdFee(0), [])
  return terraClient.tx.estimateFee(stdTx);
}

export function postMsg({ msg, fee }) {
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

  extension.post({
    msgs: [msg],
    fee
  });

  return promise;
}

/**
 * Builds message for native token -> contract token swap
 * @param pair - Asset pair from queries/getLBPs
 * @param {Address} walletAddress - User's wallet address
 * @param {Int} intAmount - Int amount to swap in smallest unit of native token
 * @returns {MsgExecuteContract} - Contract message to perform swap
 */
export function buildSwapFromNativeTokenMsg({ pair, walletAddress, intAmount }) {
  const denom = nativeTokenFromPair(pair.asset_infos).info.native_token.denom;

  return new MsgExecuteContract(
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
          amount: intAmount
        },
        to: walletAddress
      }
    },
    { [denom]: intAmount }
  );
}

/**
 * Builds message for contract token -> native token swap
 * @param pair - Asset pair from queries/getLBPs
 * @param {Address} walletAddress - User's wallet address
 * @param {Int} intAmount - Int amount to swap in smallest unit of token
 * @returns {MsgExecuteContract} - Contract message to perform swap
 */
export function buildSwapFromContractTokenMsg({ pair, walletAddress, intAmount }) {
  const tokenAddr = saleAssetFromPair(pair.asset_infos).info.token.contract_addr;

  return new MsgExecuteContract(
    walletAddress,
    tokenAddr,
    {
      send: {
        contract: pair.contract_addr,
        amount: intAmount,
        msg: btoa(
          JSON.stringify({
            swap: {}
          })
        )
      }
    }
  );
}

/**
 * Given a wallet balance, calculates the fees necessary to perform
 * a native token -> contract token swap using the maximum possible
 * amount of native token in the wallet.
 *
 * @param pair - Asset pair
 * @param {Address} walletAddress - Address of wallet
 * @param {Int} intBalance - Native token balance of wallet
 * @returns {StdFee} - Gas and fee (gas + stability fee/tax)
 */
export async function feeForMaxNativeToken({ pair, walletAddress, intBalance }) {
  const denom = nativeTokenFromPair(pair.asset_infos).info.native_token.denom;
  const balanceCoin = new Coin(denom, intBalance);
  const balanceCoins = new Coins([balanceCoin]);

  // Estimate gas usage (use 1 as amount to ignore taxes)
  const msg = buildSwapFromNativeTokenMsg({ pair, walletAddress, intAmount: new Int(1) });
  const fee = await estimateFee(msg);

  // NOTE: There's no stability fee for uluna,
  //       so we could stop here if we ever supported
  //       luna -> contract token swaps

  // Subtract gas fee from balance
  let balanceCoinsAfterGas = balanceCoins.sub(fee.amount);

  // Fetch tax rate
  const taxRate = await terraClient.treasury.taxRate();

  // Find max spendable amount after tax
  const balanceAfterFees = balanceCoinsAfterGas.get(denom).amount.div(taxRate.add(1));

  // Cap tax
  const taxCap = await terraClient.treasury.taxCap(denom);
  const tax = Math.min(
    balanceAfterFees.mul(taxRate).ceil(),
    taxCap.amount
  );
  const taxCoin = new Coin(denom, tax);

  // Return combined gas and tax fee for denom
  return new StdFee(fee.gas, fee.amount.add(taxCoin));
}
