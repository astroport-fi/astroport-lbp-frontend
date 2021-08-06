import { render, screen, act, within } from '@testing-library/react';
import { getDescriptionByTermEl } from '../test_helpers/dom-queries';
import SwapCard from '../../components/swap_card';
import userEvent from '@testing-library/user-event';
import { getSimulation, getReverseSimulation, getBalance, getTokenBalance } from '../../terra/queries';
import { buildPair } from '../test_helpers/factories';
import {
  buildSwapFromContractTokenMsg,
  buildSwapFromNativeTokenMsg,
  estimateFee,
  feeForMaxNativeToken,
  postMsg,
  sufficientBalance
} from '../../terra/swap';
import { Int, Dec, StdFee, Coins, Coin } from '@terra-money/terra.js';
import reportException from '../../report_exception';

jest.mock('../../terra/queries', () => ({
  __esModule: true,
  getSimulation: jest.fn(),
  getReverseSimulation: jest.fn(),
  getBalance: jest.fn(),
  getTokenBalance: jest.fn()
}));

jest.mock('../../terra/swap', () => {
  const original = jest.requireActual('../../terra/swap');

  return {
    __esModule: true,
    ...original,
    estimateFee: jest.fn(),
    postMsg: jest.fn(),
    feeForMaxNativeToken: jest.fn(),
    sufficientBalance: jest.fn()
  }
});

let mockTerraClient;

jest.mock('../../hooks/use_wallet', () => ({
  __esModule: true,
  useWallet: () => ({
    walletAddress: 'terra42'
  })
}));

jest.mock('../../hooks/use_network', () => ({
  __esModule: true,
  useNetwork: () => ({
    terraClient: mockTerraClient
  })
}));

jest.mock('../../report_exception.js');

// Simulations are normally debounced
// This mocks the debounce function to just invoke the
// normally debounced function immediately
jest.mock('lodash/debounce', () => ({
  __esModule: true,
  default: fn => {
    fn.cancel = jest.fn();
    return fn;
  }
}));

beforeEach(() => {
  mockTerraClient = {
    tx: {
      txInfo: jest.fn()
    },
    config: {
      chainID: 'testnet'
    }
  }
});

afterEach(() => {
  jest.useRealTimers();
});

async function waitForBalances({ fromBalance, toBalance }) {
  const [fromBalanceLabel, toBalanceLabel] = screen.getAllByText('Balance:');

  if(fromBalance !== undefined) {
    expect(await within(fromBalanceLabel.parentElement).findByText(fromBalance)).toBeInTheDocument();
  }

  if(toBalance !== undefined) {
    expect(await within(toBalanceLabel.parentElement).findByText(toBalance)).toBeInTheDocument();
  }
}

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

  let onSwapTxMined;

  beforeEach(() => {
    onSwapTxMined = jest.fn();
  });

  function renderCard({ ustPrice } = {}) {
    render(
      <SwapCard
        pair={pair}
        saleTokenInfo={saleTokenInfo}
        ustExchangeRate={ustExchangeRate}
        ustPrice={ustPrice || new Dec(1)}
        onSwapTxMined={onSwapTxMined}
      />
    );
  }

  it('runs simulation, populates "to" field with simulated amount received, and calculates price impact', async () => {
    getSimulation.mockResolvedValue({
      return_amount: '200000000' // 0.50 UST valuation
    });

    getBalance.mockResolvedValue(2000 * 1e6); // Simulation does a basic balance check

    renderCard({ ustPrice: new Dec(0.49) });

    // Wait for balance
    await waitForBalances({ fromBalance: '2,000' });

    const fromInput = screen.getByLabelText('From');
    const toInput = screen.getByLabelText('To (estimated)');

    await act(async () => {
      // We need to delay between inputs otherwise we end up with a field value of "1"
      await userEvent.type(fromInput, '1000', { delay: 1 });
    });

    // "From" value is correctly converted to USD
    const fromField = fromInput.closest('.border');
    expect(within(fromField).getByText('($990.00)')).toBeInTheDocument(); // 1000 * 0.99

    // "To" value is properly set to value returned by simulation
    expect(toInput).toHaveDisplayValue('2000');

    // "To" value is correctly converted to USD
    const toField = toInput.closest('.border');
    expect(within(toField).getByText('($970.20)')).toBeInTheDocument(); // 2000 * 0.49 * .99

    // Simulated price is $0.01 higher than the spot price ($0.49),
    // so the price impact is $0.01/$0.49 = 0.0204
    expect(getDescriptionByTermEl(screen.getByText('Price Impact'))).toHaveTextContent('2.04%');

    expect(getSimulation).toHaveBeenCalledWith(
      mockTerraClient,
      'terra1',
      new Int(1000000000),
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

    // Simulation does a basic balance check
    getBalance.mockResolvedValue(2000 * 1e6);
    getTokenBalance.mockResolvedValue(2000 * 1e6);

    renderCard({ ustPrice: new Dec(5.95) });

    const toInput = screen.getByLabelText('To (estimated)');

    // Wait for balances
    await waitForBalances({ fromBalance: '2,000' });

    await act(async () => {
      await userEvent.type(toInput, '7');
    });

    // "From" value is properly set to value returned by reverse simulation
    expect(screen.getByLabelText('From')).toHaveDisplayValue('42');

    // Simulated price is $0.05 higher than the spot price ($5.95),
    // so the price impact is $0.05/$5.95 = 0.0084
    expect(getDescriptionByTermEl(screen.getByText('Price Impact'))).toHaveTextContent('0.84%');

    expect(getReverseSimulation).toHaveBeenCalledWith(
      mockTerraClient,
      'terra1',
      new Int(700000),
      {
        token: {
          contract_addr: 'terra2'
        }
      }
    );
  });

  it('runs new simulation when assets are reversed', async () => {
    getSimulation.mockImplementation((_, pairAddress, amount, offerAssetInfo) => {
      if(offerAssetInfo.native_token) {
        // Mocked response when offer asset is the native token
        return {
          return_amount: '210000000' // 5 decimals
        };
      } else {
        // Mocked response when offer asset is the sale token
        return {
          return_amount: '2000000' // 6 decimals
        }
      }
    });

    getBalance.mockResolvedValue(2000 * 1e6);
    getTokenBalance.mockResolvedValue(2000 * 1e6);

    renderCard({ ustPrice: new Dec(.48) });

    // Wait for balances
    await waitForBalances({ fromBalance: '2,000' });

    // First enter a from value (UST -> FOO)
    const fromInput = screen.getByLabelText('From');
    await act(async () => {
      await userEvent.type(fromInput, '4');
    });

    // Assert simulated value set
    expect(screen.getByLabelText('To (estimated)')).toHaveDisplayValue('2100');

    // Reverse the assets (FOO -> UST)
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Reverse assets' }));
    });

    // "To" value is properly set to value returned by simulation
    expect(screen.getByLabelText('To (estimated)')).toHaveDisplayValue('2');

    // Simulated price is $0.02 higher than the spot price ($0.48),
    // so the price impact is $0.02/$0.48 = 0.0417
    expect(getDescriptionByTermEl(screen.getByText('Price Impact'))).toHaveTextContent('4.17%');

    // First simulation when initial "from" amount was entered
    expect(getSimulation).toHaveBeenCalledWith(
      mockTerraClient,
      'terra1',
      new Int(4 * 1e6), // 6 decimals
      {
        native_token: {
          denom: 'uusd'
        }
      }
    );

    // Second simulation when "from" asset was changed
    expect(getSimulation).toHaveBeenCalledWith(
      mockTerraClient,
      'terra1',
      new Int(4 * 1e5), // 5 decimals
      {
        token: {
          contract_addr: 'terra2'
        }
      }
    );
  });

  it('performs native -> token swap, displays success message, and updates balances', async () => {
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

    // Mock fee fetching
    const fee = jest.fn();
    estimateFee.mockResolvedValue(fee);

    // Successful post
    postMsg.mockResolvedValue({ txhash: '123ABC' });

    // Stub out balance check
    sufficientBalance.mockResolvedValue(true);

    renderCard();

    // Initial balances
    await waitForBalances({ fromBalance: '2', toBalance: '0' });

    const fromInput = screen.getByLabelText('From');
    await act(async () => {
      await userEvent.type(fromInput, '1');
    });

    // Mock mined tx to trigger balance update
    mockTerraClient.tx.txInfo.mockResolvedValue({});

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Swap' }));
    });

    expect(screen.getByText('Transaction Complete')).toBeInTheDocument();

    const txLink = screen.getByRole('link', { name: '123ABC' });
    expect(txLink).toBeInTheDocument();
    expect(txLink.getAttribute('href')).toEqual('https://finder.terra.money/testnet/tx/123ABC');

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    });

    // New balances
    await waitForBalances({ fromBalance: '1', toBalance: '5' });

    // Estimates fee and posts message with estimated fee
    const msg = buildSwapFromNativeTokenMsg({
      walletAddress: 'terra42',
      pair,
      intAmount: new Int(1e6)
    });
    expect(estimateFee).toHaveBeenCalledTimes(1);
    expect(estimateFee).toHaveBeenCalledWith(mockTerraClient, msg);

    expect(postMsg).toHaveBeenCalledTimes(1);
    expect(postMsg).toHaveBeenCalledWith(mockTerraClient, { msg, fee });

    // Fetches tx info
    expect(mockTerraClient.tx.txInfo).toHaveBeenCalledWith('123ABC');

    // Invokes callback
    expect(onSwapTxMined).toHaveBeenCalledTimes(1);
  });

  it('performs token -> native token swap, displays success message, and updates balances', async () => {
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

    // Mock fee fetching
    const fee = jest.fn();
    estimateFee.mockResolvedValue(fee);

    // Successful post
    postMsg.mockResolvedValue({ txhash: 'ABC123' });

    // Stub out balance check
    sufficientBalance.mockResolvedValue(true);

    renderCard();

    // Initial balances
    await waitForBalances({ fromBalance: '0', toBalance: '10' });

    // Reverse the assets (FOO -> UST)
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Reverse assets' }));
    });

    const fromInput = screen.getByLabelText('From');
    await act(async () => {
      await userEvent.type(fromInput, '5');
    });

    // Mock mined tx to trigger balance update
    mockTerraClient.tx.txInfo.mockResolvedValue({});

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Swap' }));
    });

    expect(screen.getByText('Transaction Complete')).toBeInTheDocument();

    const txLink = screen.getByRole('link', { name: 'ABC123' });
    expect(txLink).toBeInTheDocument();
    expect(txLink.getAttribute('href')).toEqual('https://finder.terra.money/testnet/tx/ABC123');

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    });

    // New balances
    await waitForBalances({ fromBalance: '5', toBalance: '1' });

    // Estimates fee and posts message with estimated fee
    const msg = buildSwapFromContractTokenMsg({
      walletAddress: 'terra42',
      pair,
      intAmount: new Int(5e5)
    });
    expect(estimateFee).toHaveBeenCalledTimes(1);
    expect(estimateFee).toHaveBeenCalledWith(mockTerraClient, msg);

    expect(postMsg).toHaveBeenCalledTimes(1);
    expect(postMsg).toHaveBeenCalledWith(mockTerraClient, { msg, fee });

    // Fetches tx info
    expect(mockTerraClient.tx.txInfo).toHaveBeenCalledWith('ABC123');
  });

  it('performs swap after setting from amount to balance less fees when swapping from native token', async () => {
    getBalance.mockResolvedValue(new Int(1000 * 1e6));
    getTokenBalance.mockResolvedValue(new Int(0));

    const fee = new StdFee(200000, new Coins(
      [new Coin('uusd', 999999)]
    ));
    feeForMaxNativeToken.mockResolvedValue(fee);

    // Setting max from asset triggers a forward simulation
    getSimulation.mockResolvedValue({ return_amount: '500000000' });

    // Successful post
    postMsg.mockResolvedValue({ txhash: '123ABC' });

    // Stub out balance check
    sufficientBalance.mockResolvedValue(true);

    renderCard();

    // Wait for balances to load
    await waitForBalances({ fromBalance: '1,000' });

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Max' }));
    });

    // "From" value is properly set to value balance less fees
    expect(screen.getByLabelText('From')).toHaveDisplayValue('999.000001');

    // Perform swap
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Swap' }));
    });

    expect(screen.getByText('Transaction Complete')).toBeInTheDocument();

    // Posts message with max fee
    const msg = buildSwapFromNativeTokenMsg({
      walletAddress: 'terra42',
      pair,
      intAmount: new Int(999000001)
    });
    expect(postMsg).toHaveBeenCalledTimes(1);
    expect(postMsg).toHaveBeenCalledWith(mockTerraClient, { msg, fee });

    // Does not estimate fee for from amount
    // (this is calculated differently for "max" amount)
    expect(estimateFee).not.toHaveBeenCalled();
  });

  it('performs swap after setting from amount to balance of contract token', async () => {
    getBalance.mockResolvedValue(new Int(1000 * 1e6));
    getTokenBalance.mockResolvedValue(new Int(5000 * 1e5));

    const fee = new StdFee(200000, new Coins(
      [new Coin('uusd', 30000)]
    ));
    estimateFee.mockResolvedValue(fee);

    // Setting max from asset triggers a forward simulation
    getSimulation.mockResolvedValue({ return_amount: '1000000000' });

    // Successful post
    postMsg.mockResolvedValue({ txhash: '123ABC' });

    // Stub out balance check
    sufficientBalance.mockResolvedValue(true);

    renderCard();

    // Wait for balances to load
    await waitForBalances({ fromBalance: '1,000', toBalance: '5,000' });

    // Reverse the assets (FOO -> UST)
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Reverse assets' }));
    });

    // Use max FOO tokens
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Max' }));
    });

    // "From" value is properly set to entire token balance
    expect(screen.getByLabelText('From')).toHaveDisplayValue('5000');

    // Perform swap
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Swap' }));
    });

    expect(screen.getByText('Transaction Complete')).toBeInTheDocument();

    // Posts message with max contract tokens
    // and still estimates fee (uusd)
    const msg = buildSwapFromContractTokenMsg({
      walletAddress: 'terra42',
      pair,
      intAmount: new Int(5000 * 1e5)
    });
    expect(estimateFee).toHaveBeenCalledTimes(1);
    expect(estimateFee).toHaveBeenCalledWith(mockTerraClient, msg);

    expect(postMsg).toHaveBeenCalledTimes(1);
    expect(postMsg).toHaveBeenCalledWith(mockTerraClient, { msg, fee });
  });

  it('conveys error state to user and does not invoke onSwapTxMined callback if extension responds with error when sending message', async() => {
    // Simulation is performed on input change
    getSimulation.mockResolvedValue({
      return_amount: String(1e6)
    });

    getBalance.mockResolvedValue(10 * 1e6);
    getTokenBalance.mockResolvedValue(0);
    sufficientBalance.mockResolvedValue(true);

    // Failed post
    postMsg.mockRejectedValue({ code: 1 });

    renderCard();

    // Wait for balances
    await waitForBalances({ fromBalance: '10' });

    await act(async () => {
      await userEvent.type(screen.getByLabelText('From'), '5');
    });

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Swap' }));
    });

    expect(screen.queryByText('Error submitting transaction')).toBeInTheDocument();

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    });

    expect(screen.queryByText('Error submitting transaction')).not.toBeInTheDocument();

    // Does not invoke callback
    expect(onSwapTxMined).not.toHaveBeenCalled();
  });

  it('displays and reports error when an error is thrown while selecting max balance', async() => {
    getBalance.mockResolvedValue(new Int(1000 * 1e6));
    getTokenBalance.mockResolvedValue(new Int(0));

    const mockError = jest.fn();
    feeForMaxNativeToken.mockRejectedValue(mockError);

    renderCard();

    // Wait for balances to load
    await waitForBalances({ fromBalance: '1,000' });

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Max' }));
    });

    expect(screen.queryByText('Unable to swap max balance')).toBeInTheDocument();
    expect(reportException).toHaveBeenCalledTimes(1);
    expect(reportException).toHaveBeenCalledWith(mockError);
  });

  it('displays and reports error when simulation fails', async () => {
    const mockError = jest.fn();
    getSimulation.mockRejectedValue(mockError);

    getBalance.mockResolvedValue(2000 * 1e6); // Simulation does a basic balance check

    renderCard({ ustPrice: new Dec(0.49) });

    // Wait for balance
    await waitForBalances({ fromBalance: '2,000' });

    const fromInput = screen.getByLabelText('From');
    const toInput = screen.getByLabelText('To (estimated)');

    await act(async () => {
      await userEvent.type(fromInput, '1');
    });

    expect(screen.queryByText('Simulation failed')).toBeInTheDocument();

    // "To" value is not set
    expect(toInput).toHaveDisplayValue('');

    // "To" value is still $0
    const toField = toInput.closest('.border');
    expect(within(toField).getByText('($0.00)')).toBeInTheDocument();

    // Price impact is not calculated or displayed
    expect(screen.queryByText('Price Impact')).not.toBeInTheDocument();

    // Error is reported
    expect(reportException).toHaveBeenCalledTimes(1);
    expect(reportException).toHaveBeenCalledWith(mockError);
  });

  it('runs simulation and calculates price impact when from balance is insufficient, but displays error and does not calculate fees', async () => {
    getSimulation.mockResolvedValue({
      return_amount: '200000000' // 0.50 UST valuation
    });

    getBalance.mockResolvedValue(50 * 1e6);

    renderCard({ ustPrice: new Dec(0.49) });

    // Wait for balance
    await waitForBalances({ fromBalance: '50' });

    const fromInput = screen.getByLabelText('From');
    const toInput = screen.getByLabelText('To (estimated)');

    await act(async () => {
      // We need to delay between inputs otherwise we end up with a field value of "1"
      await userEvent.type(fromInput, '1000', { delay: 1 });
    });

    // "From" value is correctly converted to USD
    const fromField = fromInput.closest('.border');
    expect(within(fromField).getByText('($990.00)')).toBeInTheDocument(); // 1000 * 0.99

    // "To" value is properly set to value returned by simulation
    expect(toInput).toHaveDisplayValue('2000');

    // "To" value is correctly converted to USD
    const toField = toInput.closest('.border');
    expect(within(toField).getByText('($970.20)')).toBeInTheDocument(); // 2000 * 0.49 * .99

    // Simulated price is $0.01 higher than the spot price ($0.49),
    // so the price impact is $0.01/$0.49 = 0.0204
    expect(getDescriptionByTermEl(screen.getByText('Price Impact'))).toHaveTextContent('2.04%');

    expect(screen.queryByText('Not enough UST')).toBeInTheDocument();

    expect(getSimulation).toHaveBeenCalledWith(
      mockTerraClient,
      'terra1',
      new Int(1000000000),
      {
        native_token: {
          denom: 'uusd'
        }
      }
    );

    // Fees should have been estimated for each key stroke up until "10",
    // then "100" and "1000" exceeded the balance of 50
    expect(estimateFee).toHaveBeenCalledTimes(2);
  });

  it('displays pending state while waiting for tx to be mined', async () => {
    jest.useFakeTimers();

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

    // Successful post
    postMsg.mockResolvedValue({ txhash: '123ABC' });

    // Stub out balance check
    sufficientBalance.mockResolvedValue(true);

    renderCard();

    // Initial balances
    await waitForBalances({ fromBalance: '2', toBalance: '0' });

    const fromInput = screen.getByLabelText('From');
    await act(async () => {
      await userEvent.type(fromInput, '1');
    });

    // Mock pending tx (404)
    mockTerraClient.tx.txInfo.mockRejectedValue();

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Swap' }));
    });

    expect(screen.getByText('Please Wait')).toBeInTheDocument();

    let txLink = screen.getByRole('link', { name: '123ABC' });
    expect(txLink).toBeInTheDocument();
    expect(txLink.getAttribute('href')).toEqual('https://finder.terra.money/testnet/tx/123ABC');

    // Mock mined tx
    mockTerraClient.tx.txInfo.mockResolvedValue({});

    // Blockchain is polled every 5s until tx is mined
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(await screen.findByText('Transaction Complete')).toBeInTheDocument();

    txLink = screen.getByRole('link', { name: '123ABC' });
    expect(txLink).toBeInTheDocument();
    expect(txLink.getAttribute('href')).toEqual('https://finder.terra.money/testnet/tx/123ABC');

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    });

    // New balances
    await waitForBalances({ fromBalance: '1', toBalance: '5' });

    // Invokes callback
    expect(onSwapTxMined).toHaveBeenCalledTimes(1);
  });
});
