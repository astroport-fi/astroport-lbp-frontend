import terraClient from '../../terra/client';
import { getTokenName, getLBPs } from '../../terra/queries';

jest.mock('../../terra/client', () => ({
  __esModule: true,
  default: {
    wasm: {
      contractQuery: jest.fn()
    }
  }
}));

describe('getTokenName', () => {
  it('queries contract for info and returns name', async () => {
    terraClient.wasm.contractQuery.mockResolvedValue({
      name: 'Foo'
    });

    expect(await getTokenName('terra1234')).toEqual('Foo');

    expect(terraClient.wasm.contractQuery).toHaveBeenCalledWith(
      'terra1234',
      {
        token_info: {}
      }
    );
  });
});

describe('getLBPs', () => {
  it('queries factory contract for all pairs', async () => {
    const pairs = [
      {
        asset_infos: [],
        contract_addr: 'terra1',
        liquidity_token: 'terra2',
        start_time: 11111,
        end_time: 22222
      },
      {
        asset_infos: [],
        contract_addr: 'terra3',
        liquidity_token: 'terra4',
        start_time: 33333,
        end_time: 44444
      }
    ]

    terraClient.wasm.contractQuery.mockResolvedValue({
      pairs: pairs
    });

    expect(await getLBPs()).toEqual(pairs);

    expect(terraClient.wasm.contractQuery).toHaveBeenCalledWith(
      'terra-factoryContractAddress',
      {
        pairs: {}
      }
    );
  });
});
