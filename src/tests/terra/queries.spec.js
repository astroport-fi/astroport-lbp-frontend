import terraClient from '../../terra/client';
import {
  getTokenInfo,
  getLBPs,
  getSimulation,
  getWeights,
  getPool
} from '../../terra/queries';

jest.mock('../../terra/client', () => ({
  __esModule: true,
  default: {
    wasm: {
      contractQuery: jest.fn()
    }
  }
}));

describe('getTokenInfo', () => {
  it('queries contract for info and returns name', async () => {
    const tokenInfo = {
      name: 'Foo',
      symbol: 'FOO',
      decimals: 6
    };

    terraClient.wasm.contractQuery.mockResolvedValue(tokenInfo);

    expect(await getTokenInfo('terra1234')).toEqual(tokenInfo);

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

describe('getSimulation', () => {
  it('runs a simulation for the given pair address, amount, and offer asset and returns the result', async () => {
    const simulationResult = {
      return_amount: '424242',
      spread_amount: '123',
      ask_weight: '90.58',
      offer_weight: '9.42',
      commission_amount: '456'
    };

    terraClient.wasm.contractQuery.mockResolvedValue(simulationResult);

    const dateNowSpy = jest
      .spyOn(Date, 'now')
      .mockImplementation(() => new Date(2021, 6, 14).getTime());

    const simulation = await getSimulation(
      'terra1234',
      742,
      {
        native_token: {
          denom: 'uusd'
        }
      }
    );

    expect(simulation).toEqual(simulationResult);

    expect(terraClient.wasm.contractQuery).toHaveBeenCalledWith(
      'terra1234',
      {
        simulation: {
          offer_asset: {
            amount: '742',
            info: {
              native_token: {
                denom: 'uusd'
              }
            }
          },
          block_time: Math.floor(new Date(2021, 6, 14).getTime()/1000)
        }
      }
    );

    dateNowSpy.mockRestore();
  });
});

describe('getWeights', () => {
  it('fetches and returns current weights for given pair address', async () => {
    terraClient.wasm.contractQuery.mockResolvedValue({
      ask_weight: '90.58',
      offer_weight: '9.42'
    });

    const dateNowSpy = jest
      .spyOn(Date, 'now')
      .mockImplementation(() => new Date(2021, 6, 14).getTime());

    expect(await getWeights('terra1234', 'uusd')).toEqual([9.42, 90.58]);

    expect(terraClient.wasm.contractQuery).toHaveBeenCalledWith(
      'terra1234',
      {
        simulation: {
          offer_asset: {
            amount: '0',
            info: {
              native_token: {
                denom: 'uusd'
              }
            }
          },
          block_time: Math.floor(new Date(2021, 6, 14).getTime()/1000)
        }
      }
    );

    dateNowSpy.mockRestore();
  });
});

describe('getPool', () => {
  it('fetches and returns current pool info for given pair', async () => {
    const pool = {
      assets: [
        {
          info: {
            native_token: {
              denom: 'uusd'
            }
          },
          amount: '5000000',
          start_weight: '2',
          end_weight: '60'
        },
        {
          info: {
            token: {
              contract_addr: 'terra123'
            }
          },
          amount: '42000000',
          start_weight: '98',
          end_weight: '40'
        }
      ],
      total_share: '60000000'
    };

    terraClient.wasm.contractQuery.mockResolvedValue(pool);

    expect(await getPool('terra1234')).toEqual(pool);

    expect(terraClient.wasm.contractQuery).toHaveBeenCalledWith(
      'terra1234',
      {
        pool: {}
      }
    );
  });
});
