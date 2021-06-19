import terraClient from '../terra/client';
import config from '../config';

export async function getTokenInfo(cw20ContractAddress) {
  const info = await terraClient.wasm.contractQuery(
    cw20ContractAddress,
    {
      token_info: {}
    }
  );

  return info;
};

export async function getLBPs() {
  const { pairs } = await terraClient.wasm.contractQuery(
    config.factoryContractAddress,
    {
      pairs: {}
    }
  );

  return pairs;
}

// Runs a simulation to purchase the other asset given
// the specified amount of the specified asset.
// offerAssetInfo should be an object with either
// a 'token' or 'native_token' top-level key,
// and then a 'contract_addr' or 'denom' child key,
// respectively. This mirrors the contract interface.
export async function getSimulation(pairAddress, amount, offerAssetInfo) {
  const result = await terraClient.wasm.contractQuery(
    pairAddress,
    {
      simulation: {
        offer_asset: {
          amount: String(amount),
          info: offerAssetInfo
        },
        block_time: Math.floor(Date.now()/1000)
      }
    }
  );

  return result;
}

export async function getReverseSimulation(pairAddress, amount, askAssetInfo) {
  const result = await terraClient.wasm.contractQuery(
    pairAddress,
    {
      reverse_simulation: {
        ask_asset: {
          amount: String(amount),
          info: askAssetInfo
        },
        block_time: Math.floor(Date.now()/1000)
      }
    }
  );

  return result;
}

// Returns array with [Native Token weight, Sale Token weight]
export async function getWeights(pairAddress, nativeToken) {
  const { ask_weight, offer_weight } = await getSimulation(
    pairAddress,
    0,
    {
      native_token: {
        denom: nativeToken
      }
    }
  );

  // TODO: Use big decimal lib?
  return [parseFloat(offer_weight), parseFloat(ask_weight)];
};

export async function getPool(pairAddress) {
  const response = await terraClient.wasm.contractQuery(
    pairAddress,
    {
      pool: {}
    }
  );

  return response;
};
