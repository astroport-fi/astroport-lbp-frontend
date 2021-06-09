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
