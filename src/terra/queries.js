import { Int, Dec } from '@terra-money/terra.js';

export async function getTokenInfo(terraClient, cw20ContractAddress) {
  const info = await terraClient.wasm.contractQuery(
    cw20ContractAddress,
    {
      token_info: {}
    }
  );

  return info;
};

export async function getLBPs(terraClient, factoryContractAddress) {
  const { pairs } = await terraClient.wasm.contractQuery(
    factoryContractAddress,
    {
      pairs: {}
    }
  );

  return pairs;
}

/**
 * Runs a simulation to purchase the other asset given
 * the specified amount of the specified asset.
 * offerAssetInfo should be an object with either
 * a 'token' or 'native_token' top-level key,
 * and then a 'contract_addr' or 'denom' child key,
 * respectively. This mirrors the contract interface.
 *
 * @param {LCDClient} terraClient
 * @param {Address} pairAddress - Pair contract address
 * @param {Int} amount - Int amount to simulate swapping
 * @param {object} offerAssetInfo
 * @returns {object} - Query response
 */
export async function getSimulation(terraClient, pairAddress, amount, offerAssetInfo) {
  const result = await terraClient.wasm.contractQuery(
    pairAddress,
    {
      simulation: {
        offer_asset: {
          amount,
          info: offerAssetInfo
        },
        block_time: Math.floor(Date.now()/1000)
      }
    }
  );

  return result;
}

/**
 * Runs a reverse simulation to find out what
 * the purchase amount of the other asset would be to purchase
 * the specified amount of the specified asset.
 * offerAssetInfo should be an object with either
 * a 'token' or 'native_token' top-level key,
 * and then a 'contract_addr' or 'denom' child key,
 * respectively. This mirrors the contract interface.
 *
 * @param {LCDClient} terraClient
 * @param {Address} pairAddress - Pair contract address
 * @param {Int} amount - Int amount to simulate swapping
 * @param {object} askAssetInfo
 * @returns {object} - Query response
 */
export async function getReverseSimulation(terraClient, pairAddress, amount, askAssetInfo) {
  const result = await terraClient.wasm.contractQuery(
    pairAddress,
    {
      reverse_simulation: {
        ask_asset: {
          amount,
          info: askAssetInfo
        },
        block_time: Math.floor(Date.now()/1000)
      }
    }
  );

  return result;
}

// Returns array with [Native Token weight, Sale Token weight]
export async function getWeights(terraClient, pairAddress, nativeToken) {
  const { ask_weight, offer_weight } = await getSimulation(
    terraClient,
    pairAddress,
    new Int(0),
    {
      native_token: {
        denom: nativeToken
      }
    }
  );

  return [new Dec(offer_weight), new Dec(ask_weight)];
};

export async function getPool(terraClient, pairAddress) {
  const response = await terraClient.wasm.contractQuery(
    pairAddress,
    {
      pool: {}
    }
  );

  return response;
};

export async function getBalance(terraClient, denom, address) {
  const response = await terraClient.bank.balance(address);

  return response.get(denom)?.amount || new Int(0);
}

export async function getTokenBalance(terraClient, tokenAddress, walletAddress) {
  const response = await terraClient.wasm.contractQuery(
    tokenAddress,
    {
      balance: {
        address: walletAddress
      }
    }
  );

  return new Int(response.balance);
}

export async function getPairInfo(terraClient, pairAddress) {
  const response = await terraClient.wasm.contractQuery(
    pairAddress,
    {
      pair: {}
    }
  );

  return response;
}
