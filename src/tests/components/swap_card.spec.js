import { render, screen, act, within } from '@testing-library/react';
import SwapCard from '../../components/swap_card';
import userEvent from '@testing-library/user-event';
import { getSimulation } from '../../terra/queries';

// Swap input is normally debounced
// This mocks the debounce function to just invoke the
// normally debounced function immediately
jest.mock('lodash/debounce', () => ({
  __esModule: true,
  default: fn => fn
}));

jest.mock('../../terra/queries', () => ({
  __esModule: true,
  getSimulation: jest.fn()
}));

describe('SwapCard', () => {
  it('runs simulation and populates to field with simulated amount received', async () => {
    const pair = {
      contract_addr: 'terra1'
    };

    const saleTokenInfo = {
      symbol: 'FOO',
      decimals: 5
    };

    const ustExchangeRate = 0.99;

    getSimulation.mockResolvedValue({
      return_amount: '210000000'
    });

    render(<SwapCard pair={pair} saleTokenInfo={saleTokenInfo} ustExchangeRate={ustExchangeRate} />);

    const fromInput = screen.getByLabelText('From');

    await act(async () => {
      // We need to delay between inputs otherwise we end up with a field value of "2"
      await userEvent.type(fromInput, '42', { delay: 1 });
    });

    // "From" value is correctly converted to USD
    const fromField = fromInput.closest('.border');
    expect(within(fromField).getByText('($41.58)')).toBeInTheDocument(); // 42 * 0.99

    // "To" value is properly set to value returned by simulation
    expect(screen.getByLabelText('To (estimated)')).toHaveDisplayValue('2100');

    // Since we've mocked out lodash's debounce function,
    // we'll run one simulation per keypress
    expect(getSimulation).toHaveBeenCalledWith(
      'terra1',
      4000000,
      {
        native_token: {
          denom: 'uusd'
        }
      }
    );

    expect(getSimulation).toHaveBeenCalledWith(
      'terra1',
      42000000,
      {
        native_token: {
          denom: 'uusd'
        }
      }
    );
  });
});
