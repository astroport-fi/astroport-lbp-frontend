import terraClient from '../terra/client';
import config from '../config';

export async function getTokenName(cw20ContractAddress) {
  const { name } = await terraClient.wasm.contractQuery(
    cw20ContractAddress,
    {
      token_info: {}
    }
  );

  return name;
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

// Returns array with [Native Token weight, Sale Token weight]
export async function getWeights(pairAddress, nativeToken) {
  const { ask_weight, offer_weight } = await terraClient.wasm.contractQuery(
    pairAddress,
    {
      simulation: {
        offer_asset: {
          amount: '0',
          info: {
            native_token: {
              denom: nativeToken
            }
          }
        },
        block_time: Math.floor(Date.now()/1000)
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
