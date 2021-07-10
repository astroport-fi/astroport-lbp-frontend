import { Extension, MsgExecuteContract, StdTx, StdFee, Int, Coin, Coins } from '@terra-money/terra.js';
import { nativeTokenFromPair, saleAssetFromPair } from '../helpers/asset_pairs';
import { getBalance, getTokenBalance } from './queries';

/**
 * Terra account address
 * @typedef {string} Address
 */

export function estimateFee(terraClient, msg) {
  // Estimate the fee (gas + stability fee/tax)
  // This is very similar to what the TxAPI create method does to estimate fees:
  //    https://github.com/terra-money/terra.js/blob/b7e7c88151fe2f404437ce7de88b9fa2a03de26a/src/client/lcd/api/TxAPI.ts#L181-L185
  const stdTx = new StdTx([msg], new StdFee(0), [])
  return terraClient.tx.estimateFee(stdTx);
}

export function postMsg(terraClient, { msg, fee }) {
  const extension = new Extension();

  /*
      NOTE: There's no guarantee that the onPost event that triggers
            this callback is for the message that we care about.
            The Extension interface does not currently offer a way to
            wait for an event for a specific message or to solve it
            ourself by registering a callback for all onPost events
            and then removing it once we've received the event for the
            message we're tracking.

            Removing a handler is possible, but we'd need access to the inpageStream.
            The Extension also offers an async request() function, but it suffers from the same
            issue and might resolve with an event for a different message.

            To see this in action: Create a transaction, then ignore the extension
            prompt and create another transaction. The extension will prompt again,
            and present you with a queue of messages to sign. Whatever you do to
            the first one will cause request() or this function to resolve,
            even though you only care about the second message at that time.
  */
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
 *
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
 *
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
 * @param {LCDClient} terraClient
 * @param pair - Asset pair
 * @param {Address} walletAddress - Address of wallet
 * @param {Int} intBalance - Native token balance of wallet
 * @returns {StdFee} - Gas and fee (gas + stability fee/tax)
 */
export async function feeForMaxNativeToken(terraClient, { pair, walletAddress, intBalance }) {
  const denom = nativeTokenFromPair(pair.asset_infos).info.native_token.denom;
  const balanceCoin = new Coin(denom, intBalance);
  const balanceCoins = new Coins([balanceCoin]);

  // Estimate gas usage (use 1 as amount to ignore taxes)
  const msg = buildSwapFromNativeTokenMsg({ pair, walletAddress, intAmount: new Int(1) });
  const fee = await estimateFee(terraClient, msg);

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

/**
 * Ensures specified wallet has enough balance to complete given transaction
 *
 * @param {LCDClient} terraClient
 * @param {Address} walletAddress
 * @param {Object} tx
 * @param {MsgExecuteContract} tx.msg
 * @param {StdFee} tx.fee
 * @returns {Promise<boolean>}
 */
export async function sufficientBalance(terraClient, walletAddress, tx) {
  const coins = tx.fee.amount.add(tx.msg.coins);

  // Check native token balance(s)
  for(const coin of coins.toArray()) {
    const balance = await getBalance(terraClient, coin.denom, walletAddress);

    if(balance.lessThan(coin.amount)) {
      return false;
    }
  }

  // Check contract token balance(s) if sending
  if(tx.msg.execute_msg.send) {
    const balance = await getTokenBalance(terraClient, tx.msg.contract, walletAddress);

    if(balance.lessThan(tx.msg.execute_msg.send.amount)) {
      return false;
    }
  }

  return true;
}
