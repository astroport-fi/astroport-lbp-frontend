import CurrentTokenSale from '../../components/current_token_sale';
import { getWeights, getPool, getTokenName } from '../../terra/queries';
import fetchUSTExchangeRate from '../../services/fetch_ust_exchange_rate';
import { render, screen, within } from '@testing-library/react';

jest.mock('../../terra/queries', () => ({
  __esModule: true,
  getWeights: jest.fn(),
  getPool: jest.fn(),
  getTokenName: jest.fn()
}));

jest.mock('../../services/fetch_ust_exchange_rate', () => ({
  __esModule: true,
  default: jest.fn()
}));

describe('CurrentTokenSale', () => {
  it('fetches and displays data for current token sale', async () => {
    fetchUSTExchangeRate.mockResolvedValue(0.99);
    getTokenName.mockResolvedValue('Foo');
    getWeights.mockResolvedValue([5, 95]);
    getPool.mockResolvedValue({
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
    });

    const pair = {
      contract_addr: 'terra1',
      asset_infos: [
        {
          info: {
            native_token: {
              denom: 'uusd'
            }
          }
        },
        {
          info: {
            token: {
              contract_addr: 'terra123'
            }
          }
        }
      ],
      end_time: (new Date(2021, 5, 18, 11, 10)).getTime() / 1000
    };

    const dateNowSpy = jest
      .spyOn(Date, 'now')
      .mockImplementation(() => new Date(2021, 5, 16, 8).getTime());

    render(<CurrentTokenSale pair={pair} />);

    expect(await screen.findByText('Foo Token Sale')).toBeInTheDocument();

    const priceCard = (await screen.findByText('Price')).closest('div');
    const coinsRemainingCard = (await screen.findByText('Coins Remaining')).closest('div');
    const timeRemainingCard = (await screen.findByText('Time Remaining')).closest('div');
    const currentWeightCard = (await screen.findByText('Current Weight')).closest('div');

    // ((5000000 / 5) / (42000000 / 95)) = 2.261904762 * $0.99 = $2.239285714
    expect(within(priceCard).getByText('$2.24')).toBeInTheDocument();

    expect(within(coinsRemainingCard).getByText('42,000,000')).toBeInTheDocument();

    // 2021-06-16 @ 8am -> 2021-06-18 @ 11:10am
    expect(within(timeRemainingCard).getByText('2d : 3h : 10m')).toBeInTheDocument();

    expect(within(currentWeightCard).getByText('5 : 95')).toBeInTheDocument();

    expect(getTokenName).toHaveBeenCalledWith('terra123');
    expect(getWeights).toHaveBeenCalledWith('terra1', 'uusd');
    expect(getPool).toHaveBeenCalledWith('terra1');

    dateNowSpy.mockRestore();
  });
});
