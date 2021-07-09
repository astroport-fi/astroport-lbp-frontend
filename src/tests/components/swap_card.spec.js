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
  postMsg
} from '../../terra/swap';
import { Int, Dec, StdFee, Coins, Coin } from '@terra-money/terra.js';
import terraClient from '../../terra/client';

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
    feeForMaxNativeToken: jest.fn()
  }
});

jest.mock('../../terra/client', () => ({
  __esModule: true,
  default: {
    tx: {
      txInfo: jest.fn()
    },
    config: {
      chainID: 'testnet'
    }
  }
}));

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
        walletAddress="terra42"
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
    await screen.findByText('Balance: 2,000');

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
    await screen.findByText('Balance: 2,000');

    await act(async () => {
      await userEvent.type(toInput, '7');
    });

    // "From" value is properly set to value returned by reverse simulation
    expect(screen.getByLabelText('From')).toHaveDisplayValue('42');

    // Simulated price is $0.05 higher than the spot price ($5.95),
    // so the price impact is $0.05/$5.95 = 0.0084
    expect(getDescriptionByTermEl(screen.getByText('Price Impact'))).toHaveTextContent('0.84%');

    expect(getReverseSimulation).toHaveBeenCalledWith(
      'terra1',
      new Int(700000),
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
          return_amount: '2000000' // 6 decimals
        }
      }
    });

    getBalance.mockResolvedValue(2000 * 1e6);
    getTokenBalance.mockResolvedValue(2000 * 1e6);

    renderCard({ ustPrice: new Dec(.48) });

    // Wait for balances
    await screen.findByText('Balance: 2,000');

    // First enter a from value (UST -> FOO)
    const fromInput = screen.getByLabelText('From');
    await act(async () => {
      await userEvent.type(fromInput, '4');
    });

    // Assert simulated value set
    expect(screen.getByLabelText('To (estimated)')).toHaveDisplayValue('2100');

    // Now change the from asset (FOO -> UST)
    const fromSelect = screen.getAllByLabelText('Asset')[0];
    await act(async () => {
      await userEvent.selectOptions(fromSelect, 'FOO');
    });

    // "To" value is properly set to value returned by simulation
    expect(screen.getByLabelText('To (estimated)')).toHaveDisplayValue('2');

    // Simulated price is $0.02 higher than the spot price ($0.48),
    // so the price impact is $0.02/$0.48 = 0.0417
    expect(getDescriptionByTermEl(screen.getByText('Price Impact'))).toHaveTextContent('4.17%');

    // First simulation when initial "from" amount was entered
    expect(getSimulation).toHaveBeenCalledWith(
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
      'terra1',
      new Int(4 * 1e5), // 5 decimals
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
          offer_amount: '909000' // 5 decimals
        };
      } else {
        // Mocked response when ask asset is the sale token
        return {
          offer_amount: '2600000' // 6 decimals
        }
      }
    });

    getBalance.mockResolvedValue(2000 * 1e6);
    getTokenBalance.mockResolvedValue(2000 * 1e6);

    renderCard({ ustPrice: new Dec(0.50) });

    // Wait for balances
    await screen.findByText('Balance: 2,000');

    // First enter a to value (UST <- FOO)
    const fromInput = screen.getByLabelText('To (estimated)');
    await act(async () => {
      await userEvent.type(fromInput, '5');
    });

    // Assert simulated value set
    expect(screen.getByLabelText('From')).toHaveDisplayValue('2.6');

    // Now change the to asset (FOO <- UST)
    const fromSelect = screen.getAllByLabelText('Asset')[1];
    await act(async () => {
      await userEvent.selectOptions(fromSelect, 'UST');
    });

    // "From" value is properly set to value returned by reverse simulation
    expect(screen.getByLabelText('From')).toHaveDisplayValue('9.09');

    // Simulated price is $0.05005 higher than the spot price ($0.50),
    // so the price impact is $0.05005/$0.50 = 0.1001
    expect(getDescriptionByTermEl(screen.getByText('Price Impact'))).toHaveTextContent('10.01%');

    // First reverse simulation when initial "to" amount was entered
    expect(getReverseSimulation).toHaveBeenCalledWith(
      'terra1',
      new Int(5 * 1e5), // 5 decimals
      {
        token: {
          contract_addr: 'terra2'
        }
      }
    );

    // Second reverse simulation when "to" asset was changed
    expect(getReverseSimulation).toHaveBeenCalledWith(
      'terra1',
      new Int(5 * 1e6), // 6 decimals
      {
        native_token: {
          denom: 'uusd'
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

    renderCard();

    // Initial balances
    expect(await screen.findByText('Balance: 2')).toBeInTheDocument();
    expect(await screen.findByText('Balance: 0')).toBeInTheDocument();

    const fromInput = screen.getByLabelText('From');
    await act(async () => {
      await userEvent.type(fromInput, '1');
    });

    // Mock mined tx to trigger balance update
    terraClient.tx.txInfo.mockResolvedValue({});

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Swap' }));
    });

    expect(screen.getByText('Transaction submitted successfully')).toBeInTheDocument();

    const txLink = screen.getByRole('link', { name: '123ABC' });
    expect(txLink).toBeInTheDocument();
    expect(txLink.getAttribute('href')).toEqual('https://finder.terra.money/testnet/tx/123ABC');

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    });

    // New balances
    expect(await screen.findByText('Balance: 1')).toBeInTheDocument();
    expect(await screen.findByText('Balance: 5')).toBeInTheDocument();

    // Estimates fee and posts message with estimated fee
    const msg = buildSwapFromNativeTokenMsg({
      walletAddress: 'terra42',
      pair,
      intAmount: new Int(1e6)
    });
    expect(estimateFee).toHaveBeenCalledTimes(1);
    expect(estimateFee).toHaveBeenCalledWith(msg);

    expect(postMsg).toHaveBeenCalledTimes(1);
    expect(postMsg).toHaveBeenCalledWith({ msg, fee });

    // Fetches tx info
    expect(terraClient.tx.txInfo).toHaveBeenCalledWith('123ABC');

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

    renderCard();

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

    // Mock mined tx to trigger balance update
    terraClient.tx.txInfo.mockResolvedValue({});

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Swap' }));
    });

    expect(screen.getByText('Transaction submitted successfully')).toBeInTheDocument();

    const txLink = screen.getByRole('link', { name: 'ABC123' });
    expect(txLink).toBeInTheDocument();
    expect(txLink.getAttribute('href')).toEqual('https://finder.terra.money/testnet/tx/ABC123');

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    });

    // New balances
    expect(await screen.findByText('Balance: 5')).toBeInTheDocument();
    expect(await screen.findByText('Balance: 1')).toBeInTheDocument();

    // Estimates fee and posts message with estimated fee
    const msg = buildSwapFromContractTokenMsg({
      walletAddress: 'terra42',
      pair,
      intAmount: new Int(5e5)
    });
    expect(estimateFee).toHaveBeenCalledTimes(1);
    expect(estimateFee).toHaveBeenCalledWith(msg);

    expect(postMsg).toHaveBeenCalledTimes(1);
    expect(postMsg).toHaveBeenCalledWith({ msg, fee });

    // Fetches tx info
    expect(terraClient.tx.txInfo).toHaveBeenCalledWith('ABC123');
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

    renderCard();

    // Wait for balances to load
    expect(await screen.findByText('Balance: 1,000')).toBeInTheDocument();

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Max' }));
    });

    // "From" value is properly set to value balance less fees
    expect(screen.getByLabelText('From')).toHaveDisplayValue('999.000001');

    // Perform swap
    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Swap' }));
    });

    expect(screen.getByText('Transaction submitted successfully')).toBeInTheDocument();

    // Posts message with max fee
    const msg = buildSwapFromNativeTokenMsg({
      walletAddress: 'terra42',
      pair,
      intAmount: new Int(999000001)
    });
    expect(postMsg).toHaveBeenCalledTimes(1);
    expect(postMsg).toHaveBeenCalledWith({ msg, fee });

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

    renderCard();

    // Wait for balances to load
    expect(await screen.findByText('Balance: 5,000')).toBeInTheDocument();

    // Change the from asset (FOO -> UST)
    const fromSelect = screen.getAllByLabelText('Asset')[0];
    await act(async () => {
      await userEvent.selectOptions(fromSelect, 'FOO');
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

    expect(screen.getByText('Transaction submitted successfully')).toBeInTheDocument();

    // Posts message with max contract tokens
    // and still estimates fee (uusd)
    const msg = buildSwapFromContractTokenMsg({
      walletAddress: 'terra42',
      pair,
      intAmount: new Int(5000 * 1e5)
    });
    expect(estimateFee).toHaveBeenCalledTimes(1);
    expect(estimateFee).toHaveBeenCalledWith(msg);

    expect(postMsg).toHaveBeenCalledTimes(1);
    expect(postMsg).toHaveBeenCalledWith({ msg, fee });
  });

  it('conveys error state to user and does not invoke onSwapTxMined callback if extension responds with error when sending message', async() => {
    // Simulation is performed on input change
    getSimulation.mockResolvedValue({
      return_amount: String(1e6)
    });

    getBalance.mockResolvedValue(10 * 1e6);
    getTokenBalance.mockResolvedValue(0);

    // Failed post
    postMsg.mockRejectedValue({ code: 1 });

    renderCard();

    // Wait for balances
    expect(await screen.findByText('Balance: 10')).toBeInTheDocument();

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
});
