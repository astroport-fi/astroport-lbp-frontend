import { render, screen, act, within } from '@testing-library/react';
import SwapCard from '../../components/swap_card';
import userEvent from '@testing-library/user-event';
import { getSimulation, getReverseSimulation, getBalance, getTokenBalance } from '../../terra/queries';
import { buildPair } from '../test_helpers/factories';
import { swapFromNativeToken, swapFromContractToken } from '../../terra/swap';
import { Int } from '@terra-money/terra.js';

// Simulation is normally debounced
// This mocks the debounce function to just invoke the
// normally debounced function immediately
jest.mock('lodash/debounce', () => ({
  __esModule: true,
  default: fn => fn
}));

jest.mock('../../terra/queries', () => ({
  __esModule: true,
  getSimulation: jest.fn(),
  getReverseSimulation: jest.fn(),
  getBalance: jest.fn(),
  getTokenBalance: jest.fn()
}));

jest.mock('../../terra/swap');

describe('SwapCard', () => {
  const pair = buildPair({
    contractAddr: 'terra1',
    tokenContractAddr: 'terra2'
  });

  const saleTokenInfo = {
    symbol: 'FOO',
    decimals: 5
  };

  const ustExchangeRate = 0.99;

  it('runs simulation and populates "to" field with simulated amount received', async () => {
    getSimulation.mockResolvedValue({
      return_amount: '210000000'
    });

    render(<SwapCard pair={pair} saleTokenInfo={saleTokenInfo} ustExchangeRate={ustExchangeRate} walletAddress="terra42" />);

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

  it('runs reverse simulation and populates "from" field with simulated amount required', async () => {
    getReverseSimulation.mockResolvedValue({
      offer_amount: '42000000'
    });

    render(<SwapCard pair={pair} saleTokenInfo={saleTokenInfo} ustExchangeRate={ustExchangeRate} walletAddress="terra42" />);

    const toInput = screen.getByLabelText('To (estimated)');

    await act(async () => {
      await userEvent.type(toInput, '7');
    });

    // "From" value is properly set to value returned by reverse simulation
    expect(screen.getByLabelText('From')).toHaveDisplayValue('42');

    expect(getReverseSimulation).toHaveBeenCalledWith(
      'terra1',
      700000,
      {
        token: {
          contract_addr: 'terra2'
        }
      }
    );
  });

  it('runs new simulation when from asset is changed', async () => {
    getSimulation.mockImplementation((pairAddress, amount, offerAssetInfo) => {
      if(offerAssetInfo.native_token) {
        // Mocked response when offer asset is the native token
        return {
          return_amount: '210000000' // 5 decimals
        };
      } else {
        // Mocked response when offer asset is the sale token
        return {
          return_amount: '1000000' // 6 decimals
        }
      }
    });

    render(<SwapCard pair={pair} saleTokenInfo={saleTokenInfo} ustExchangeRate={ustExchangeRate} walletAddress="terra42" />);

    // First enter a from value (UST -> FOO)
    const fromInput = screen.getByLabelText('From');
    await act(async () => {
      await userEvent.type(fromInput, '7');
    });

    // Assert simulated value set
    expect(screen.getByLabelText('To (estimated)')).toHaveDisplayValue('2100');

    // Now change the from asset (FOO -> UST)
    const fromSelect = screen.getAllByLabelText('Asset')[0];
    await act(async () => {
      await userEvent.selectOptions(fromSelect, 'FOO');
    });

    // "To" value is properly set to value returned by simulation
    expect(screen.getByLabelText('To (estimated)')).toHaveDisplayValue('1');

    // First simulation when initial "from" amount was entered
    expect(getSimulation).toHaveBeenCalledWith(
      'terra1',
      7000000, // 6 decimals
      {
        native_token: {
          denom: 'uusd'
        }
      }
    );

    // Second simulation when "from" asset was changed
    expect(getSimulation).toHaveBeenCalledWith(
      'terra1',
      700000, // 5 decimals
      {
        token: {
          contract_addr: 'terra2'
        }
      }
    );
  });

  it('runs new reverse simulation when to asset is changed', async () => {
    getReverseSimulation.mockImplementation((pairAddress, amount, askAssetInfo) => {
      if(askAssetInfo.native_token) {
        // Mocked response when ask asset is the native token
        return {
          offer_amount: '1000' // 5 decimals
        };
      } else {
        // Mocked response when ask asset is the sale token
        return {
          offer_amount: '100000000' // 6 decimals
        }
      }
    });

    render(<SwapCard pair={pair} saleTokenInfo={saleTokenInfo} ustExchangeRate={ustExchangeRate} walletAddress="terra42" />);

    // First enter a to value (UST <- FOO)
    const fromInput = screen.getByLabelText('To (estimated)');
    await act(async () => {
      await userEvent.type(fromInput, '1');
    });

    // Assert simulated value set
    expect(screen.getByLabelText('From')).toHaveDisplayValue('100');

    // Now change the to asset (FOO <- UST)
    const fromSelect = screen.getAllByLabelText('Asset')[1];
    await act(async () => {
      await userEvent.selectOptions(fromSelect, 'UST');
    });

    // "From" value is properly set to value returned by reverse simulation
    expect(screen.getByLabelText('From')).toHaveDisplayValue('0.01');

    // First reverse simulation when initial "to" amount was entered
    expect(getReverseSimulation).toHaveBeenCalledWith(
      'terra1',
      100000, // 5 decimals
      {
        token: {
          contract_addr: 'terra2'
        }
      }
    );

    // Second reverse simulation when "to" asset was changed
    expect(getReverseSimulation).toHaveBeenCalledWith(
      'terra1',
      1000000, // 6 decimals
      {
        native_token: {
          denom: 'uusd'
        }
      }
    );
  });

  it('performs native -> token swap, alerts user on success, and updates balances', async () => {
    // Simulation is performed on input change
    getSimulation.mockResolvedValue({
      return_amount: String(5 * 1e5)
    });

    // Before balances
    getBalance.mockResolvedValueOnce(2000000);
    getTokenBalance.mockResolvedValueOnce(0);

    // After balances
    getBalance.mockResolvedValueOnce(1000000);
    getTokenBalance.mockResolvedValueOnce(5 * 1e5);

    const alertSpy = jest.spyOn(window, 'alert').mockImplementation();

    render(<SwapCard pair={pair} saleTokenInfo={saleTokenInfo} ustExchangeRate={ustExchangeRate} walletAddress="terra42" />);

    // Initial balances
    expect(await screen.findByText('Balance: 2')).toBeInTheDocument();
    expect(await screen.findByText('Balance: 0')).toBeInTheDocument();

    const fromInput = screen.getByLabelText('From');
    await act(async () => {
      await userEvent.type(fromInput, '1');
    });

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Swap' }));
    });

    // New balances
    expect(await screen.findByText('Balance: 1')).toBeInTheDocument();
    expect(await screen.findByText('Balance: 5')).toBeInTheDocument();

    expect(swapFromNativeToken).toHaveBeenCalledTimes(1);
    expect(swapFromNativeToken).toHaveBeenCalledWith({
      walletAddress: 'terra42',
      pair,
      intAmount: new Int(1e6)
    });

    expect(alertSpy).toHaveBeenCalledWith('Success!');
    alertSpy.mockRestore();
  });

  it('performs token -> native token swap, alerts user on success, and updates balances', async () => {
    // Simulation is performed on input change
    getSimulation.mockResolvedValue({
      return_amount: String(1e6)
    });

    // Before balances
    getTokenBalance.mockResolvedValueOnce(10 * 1e5);
    getBalance.mockResolvedValueOnce(0);

    // After balances
    getTokenBalance.mockResolvedValueOnce(5 * 1e5);
    getBalance.mockResolvedValueOnce(1e6);

    const alertSpy = jest.spyOn(window, 'alert').mockImplementation();

    render(<SwapCard pair={pair} saleTokenInfo={saleTokenInfo} ustExchangeRate={ustExchangeRate} walletAddress="terra42" />);

    // Initial balances
    expect(await screen.findByText('Balance: 10')).toBeInTheDocument();
    expect(await screen.findByText('Balance: 0')).toBeInTheDocument();

    // Change the from asset (FOO -> UST)
    const fromSelect = screen.getAllByLabelText('Asset')[0];
    await act(async () => {
      await userEvent.selectOptions(fromSelect, 'FOO');
    });

    const fromInput = screen.getByLabelText('From');
    await act(async () => {
      await userEvent.type(fromInput, '5');
    });

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Swap' }));
    });

    // New balances
    expect(await screen.findByText('Balance: 5')).toBeInTheDocument();
    expect(await screen.findByText('Balance: 1')).toBeInTheDocument();

    expect(swapFromContractToken).toHaveBeenCalledTimes(1);
    expect(swapFromContractToken).toHaveBeenCalledWith({
      walletAddress: 'terra42',
      pair,
      intAmount: new Int(5e5)
    });

    expect(alertSpy).toHaveBeenCalledWith('Success!');
    alertSpy.mockRestore();
  });
});
