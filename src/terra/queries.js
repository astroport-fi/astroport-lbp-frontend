import terraClient from '../terra/client';

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
    // Factory contract address:
    'terra18vd8fpwxzck93qlwghaj6arh4p7c5n896xzem5',
    {
      pairs: {}
    }
  );

  return pairs;
}
