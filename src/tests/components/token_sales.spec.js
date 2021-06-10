import { render, screen, within } from '@testing-library/react';
import TokenSales from '../../components/token_sales';
import { getTokenName, getLBPs } from '../../terra/queries';

jest.mock('../../terra/queries', () => ({
  __esModule: true,
  getLBPs: jest.fn(),
  getTokenName: jest.fn()
}));

function buildLBP({
  start_time,
  end_time,
  native_token_denom,
  token_contract_addr,
  contract_addr = "terra123"
}) {
  return {
    contract_addr,
    start_time,
    end_time,
    asset_infos: [
      {
        info: {
          native_token: {
            denom: native_token_denom
          }
        }
      },
      {
        info: {
          token: {
            contract_addr: token_contract_addr
          }
        }
      }
    ]
  };
};

describe('TokenSales', () => {
  it('renders Scheduled and Previous Token Sales cards', async () => {
    const dateNowSpy = jest
      .spyOn(Date, 'now')
      .mockImplementation(() => new Date(2021, 5, 9).getTime());

    getLBPs.mockResolvedValue([
      buildLBP({
        start_time: (new Date(2021, 0, 1).getTime())/1000,
        end_time: (new Date(2021, 0, 4).getTime())/1000,
        native_token_denom: 'uust',
        token_contract_addr: 'terra1'
      }),
      buildLBP({
        start_time: (new Date(2021, 5, 10).getTime())/1000,
        end_time: (new Date(2021, 5, 14).getTime())/1000,
        native_token_denom: 'uust',
        token_contract_addr: 'terra2'
      })
    ]);

    getTokenName.mockImplementation(address => (
      {
        terra1: 'Foo',
        terra2: 'Bar'
      }[address]
    ))

    render(<TokenSales />);

    const scheduledCard = (await screen.findByText('Scheduled Token Sales')).closest('div')
    const previousCard = (await screen.findByText('Previous Token Sales')).closest('div')

    // Tokens are in the correct cards with the correct time/dates
    const barCell = await within(scheduledCard).findByText('Bar');
    expect(barCell).toBeInTheDocument();
    expect(within(barCell.closest('tr')).queryByText('00:00 (UTC) 10-06-2021')).toBeInTheDocument();

    const fooCell = await within(previousCard).findByText('Foo')
    expect(fooCell).toBeInTheDocument();
    expect(within(fooCell.closest('tr')).queryByText('01-01-2021 - 04-01-2021')).toBeInTheDocument();

    // Tokens are not present in the wrong cards
    expect(within(scheduledCard).queryByText('Foo')).toBeNull();
    expect(within(previousCard).queryByText('Bar')).toBeNull();

    dateNowSpy.mockRestore();
  });
});
