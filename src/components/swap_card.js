import { useState, useCallback, useEffect } from 'react';
import reportException from '../report_exception';
import Card from './card';
import { getSimulation, getReverseSimulation, getBalance, getTokenBalance } from '../terra/queries';
import { nativeTokenFromPair, saleAssetFromPair } from '../helpers/asset_pairs';
import { NATIVE_TOKEN_DECIMALS, NATIVE_TOKEN_SYMBOLS } from '../constants';
import { feeForMaxNativeToken, buildSwapFromNativeTokenMsg, buildSwapFromContractTokenMsg, estimateFee, postMsg, sufficientBalance } from '../terra/swap';
import { formatTokenAmount, dropInsignificantZeroes } from '../helpers/number_formatters';
import { Dec } from '@terra-money/terra.js';
import SwapRates from './swap_rates';
import SwapCardOverlay from './swap_card_overlay';
import SwapForm from './swap_form';
import classNames from 'classnames';
import { useNetwork } from '../hooks/use_network';
import { useWallet } from '../hooks/use_wallet';
import debounce from 'lodash/debounce';

// TODO: Reject input with too many decimals

function SwapCard({
  pair,
  saleTokenInfo,
  ustExchangeRate,
  ustPrice,
  onSwapTxMined,
  className
}) {
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [fromAsset, setFromAsset] = useState('native_token');
  const [toAsset, setToAsset] = useState('token');
  const [balances, setBalances] = useState({});
  const [tx, setTx] = useState({ msg: null, fee: null });
  const [usingMaxNativeAmount, setUsingMaxNativeAmount] = useState(false);
  const [priceImpact, setPriceImpact] = useState();
  const [error, setError] = useState();
  const [simulating, setSimulating] = useState(false);
  const [pendingSimulation, setPendingSimulation] = useState({});
  const [lastTx, setLastTx] = useState();
  const { walletAddress } = useWallet();
  const { terraClient } = useNetwork();

  function resetForm() {
    setFromAmount('');
    setToAmount('');
    setPriceImpact(null);
    setTx({ msg: null, fee: null });
    setUsingMaxNativeAmount(false);
    setLastTx();
  }

  function usdExchangeRateForAsset (asset) {
    if(asset === 'native_token') {
      return new Dec(ustExchangeRate);
    } else {
      return ustPrice.mul(ustExchangeRate);
    }
  }

  function convertAmountToUSD (amountStr, asset) {
    let decAmount;

    try {
      decAmount = new Dec(amountStr);
    } catch {
      return 0;
    }

    const rate = usdExchangeRateForAsset(asset);
    return decAmount.mul(rate);
  }

  const decimals = {
    native_token: NATIVE_TOKEN_DECIMALS,
    token: saleTokenInfo.decimals
  }

  const symbols = {
    native_token: NATIVE_TOKEN_SYMBOLS[nativeTokenFromPair(pair.asset_infos).info.native_token.denom],
    token: saleTokenInfo.symbol
  }

  const fromUSDAmount = convertAmountToUSD(fromAmount, fromAsset);
  const toUSDAmount = convertAmountToUSD(toAmount, toAsset);

  let maxFromAmount;
  if(balances[fromAsset]) {
    maxFromAmount = Dec.withPrec(balances[fromAsset], decimals[fromAsset]);
  }

  function smallestDecOfAsset(asset) {
    return new Dec(1).div(10 ** decimals[asset]);
  }

  async function buildTx(fromAmount, fromAsset) {
    const builders = {
      native_token: buildSwapFromNativeTokenMsg,
      token: buildSwapFromContractTokenMsg
    };

    const intAmount = (new Dec(fromAmount || 0)).mul(10 ** decimals[fromAsset]).toInt();
    const msg = builders[fromAsset]({ pair, walletAddress, intAmount });

    // Fetch fees unless the user selected "max" for the native amount
    // (that logic already calculated the fee by backing it out of the wallet balance)

    if(usingMaxNativeAmount) {
      return { ...tx, msg };
    } else {
      const fee = await estimateFee(terraClient, msg);

      return { msg, fee };
    }
  }

  function nullifyTx() {
    setTx({ msg: null, fee: null });
  };

  function resetSimulationState() {
    setPriceImpact(null);
    nullifyTx();
    setSimulating(false);
  }

  // Debounce pending simulations so we don't run too many back-to-back due to rapid input
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSetPendingSimulation = useCallback(
    debounce(setPendingSimulation, 300),
    []
  );

  // Cancel debounced pending simulation on unmount
  useEffect(() => () => debouncedSetPendingSimulation?.cancel(), [debouncedSetPendingSimulation]);

  // Runs either a regular/forward or reverse simulation based on the pendingSimulation.type
  // A forward simulation runs a regular simulation from the fromAmount,
  // and sets the toAmount to the result.
  // A reverse simulation runs a reverse simulation toAmount,
  // and sets the fromAmount to the result.
  useEffect(() => {
    if(!pendingSimulation.type) { return; }
    setSimulating(true);
    setError(); // Reset error state

    async function simulate() {
      const { type } = pendingSimulation;
      let setter, decInputAmount, inputAmountString, simulationInputAsset, simulationOutputAsset, simulationFn;

      if(type === 'forward') {
        simulationFn = getSimulation;
        setter = setToAmount;
        inputAmountString = fromAmount;
        [simulationInputAsset, simulationOutputAsset] = [fromAsset, toAsset];
      } else {
        simulationFn = getReverseSimulation;
        setter = setFromAmount;
        inputAmountString = toAmount;
        [simulationInputAsset, simulationOutputAsset] = [toAsset, fromAsset];
      }

      const requestAsset = simulationInputAsset === 'native_token' ?
        nativeTokenFromPair(pair.asset_infos) :
        saleAssetFromPair(pair.asset_infos);

      try {
        decInputAmount = new Dec(inputAmountString);
      } catch {
        setter('');
        resetSimulationState();
        return;
      }

      // Don't run simulation when from amount is below minimum
      if(type === 'forward' && decInputAmount.lessThan(smallestDecOfAsset(fromAsset))) {
        setter('');
        resetSimulationState();
        return;
      }

      try {
        const simulation = await simulationFn(
          terraClient,
          pair.contract_addr,
          decInputAmount.mul(10 ** decimals[simulationInputAsset]).toInt(),
          requestAsset.info
        );

        const decOutputAmount = Dec.withPrec(
          simulation[type === 'forward' ? 'return_amount' : 'offer_amount'],
          decimals[simulationOutputAsset]
        );

        // Set output value and drop insignificant zeroes
        setter(dropInsignificantZeroes(decOutputAmount.toFixed(decimals[simulationInputAsset])));

        // Calculate and set price impact
        let simulatedPrice;
        if (simulationInputAsset === 'native_token') {
          simulatedPrice = decInputAmount.div(decOutputAmount);
        } else {
          simulatedPrice = decOutputAmount.div(decInputAmount);
        }

        setPriceImpact(simulatedPrice.sub(ustPrice).div(ustPrice));

        if((type === 'forward' ? decInputAmount : decOutputAmount).greaterThan(maxFromAmount)) {
          // Don't calculate fees and blank out the tx when the from amount exceeds the balance.
          // This is mostly an informational state where user may want to see potential
          // swap amount/price impact.
          setError(`Not enough ${symbols[fromAsset]}`);
          nullifyTx();
        } else {
          // A successful simulation is a pre-req to building the tx

          let fromAmount;
          if(type === 'forward') {
            fromAmount = decInputAmount;
          } else {
            fromAmount = decOutputAmount;
          }

          try {
            setTx(await buildTx(fromAmount, fromAsset));
          } catch {
            setError('Failed to estimate fees');
          }
        }
      } catch (e) {
        reportException(e);

        resetSimulationState();

        setError('Simulation failed');
      } finally {
        setSimulating(false);
      }
    }

    simulate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingSimulation]);

  function fromAmountChanged (amount) {
    // If the from amount changes from an input event,
    // we're no longer using the calculated max amount
    setUsingMaxNativeAmount(false);

    setFromAmount(amount);

    debouncedSetPendingSimulation({ type: 'forward' });
  }

  function toAmountChanged (amount) {
    setToAmount(amount);

    debouncedSetPendingSimulation({ type: 'reverse' });
  }

  function assetsReversed() {
    // If the assets are swapped, we're no longer using
    // the calculated max amount
    setUsingMaxNativeAmount(false);

    setFromAsset(toAsset);
    setToAsset(fromAsset);

    debouncedSetPendingSimulation({ type: 'forward' });
  }

  const updateBalances = useCallback(async () => {
    if (walletAddress) {
      const nativeToken = nativeTokenFromPair(pair.asset_infos).info.native_token.denom;

      const balances = await Promise.all([
        getBalance(terraClient, nativeToken, walletAddress),
        getTokenBalance(terraClient, saleAssetFromPair(pair.asset_infos).info.token.contract_addr, walletAddress)
      ]);

      setBalances({
        native_token: balances[0],
        token: balances[1]
      });
    }
  // terraClient intentionally omitted
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletAddress, pair]);

  useEffect(() => {
    updateBalances();
  }, [updateBalances]);

  // Checks up on the tx until it's mined,
  // then update balances and and state
  const trackTx = useCallback(async function (txhash) {
    try {
      // Once the tx has been included on the blockchain,
      // update the balances and state
      await terraClient.tx.txInfo(txhash);

      updateBalances();
      onSwapTxMined();
      setLastTx({ state: 'complete', txhash });
    } catch {
      // Not on chain yet, try again in 5s
      setTimeout(trackTx, 5000, txhash);
    }
  // terraClient intentionally omitted
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateBalances, onSwapTxMined]);

  async function swapFormSubmitted (e) {
    e.preventDefault();

    // Perform final balance check
    if(await sufficientBalance(terraClient, walletAddress, tx)) {
      setLastTx({ state: 'waitingForExtension' });

      try {
        const { txhash } = await postMsg(terraClient, tx);

        setLastTx({ state: 'pending', txhash });

        trackTx(txhash);
      } catch {
        setLastTx({ state: 'error' });
      }
    } else {
      setError('Insufficient balance to complete transaction with fees');
    }
  }

  async function selectMaxFromAsset () {
    let amount;

    if(fromAsset === 'native_token') {
      try {
        const fee = await feeForMaxNativeToken(terraClient, { pair, walletAddress, intBalance: balances.native_token });
        const denom = nativeTokenFromPair(pair.asset_infos).info.native_token.denom;
        const maxAmount = balances.native_token.sub(fee.amount.get(denom).amount);

        setTx({ fee });
        setUsingMaxNativeAmount(true);

        amount = maxAmount
      } catch (e) {
        // Note: We may not want to report this error forever, but for diagnostic purposes, we're reporting it now.
        //       A legitimate reason for this error might be that the user's balance exceeds the liquidity in the pool
        reportException(e);
        setError('Unable to swap max balance');
        return;
      }
    } else {
      // Since fees are paid in the native token,
      // we can set the amount to the full balance of contract tokens
      amount = balances.token;
    }

    const amountStr = Dec.withPrec(amount, decimals[fromAsset]).toFixed(decimals[fromAsset]);

    // Update from amount state (and drop insignificant zeroes)
    setFromAmount(dropInsignificantZeroes(amountStr));

    // Run simulation to project received tokens if entire wallet balance were swapped
    debouncedSetPendingSimulation({ type: 'forward' });
  }

  return (
    <Card className={classNames('py-8 px-12 flex flex-col', className)} overlay={
      lastTx &&
      <SwapCardOverlay
        txState={lastTx.state}
        txHash={lastTx.txhash}
        waitingDismiss={() => setLastTx()}
        completeDismiss={resetForm}
        errorDismiss={() => setLastTx()}
      />
    }>
      <h2 className="font-bold mb-7">
        Swap
      </h2>

      <SwapForm
        onSubmit={swapFormSubmitted}
        fromAmount={fromAmount}
        fromUSDAmount={fromUSDAmount}
        fromAssetSymbol={symbols[fromAsset]}
        fromBalance={balances[fromAsset] && formatTokenAmount(balances[fromAsset], decimals[fromAsset])}
        fromMin={smallestDecOfAsset(fromAsset)}
        fromMax={maxFromAmount?.toFixed(decimals[fromAsset])}
        fromStep={smallestDecOfAsset(fromAsset)}
        fromMaxClick={selectMaxFromAsset}
        toAmount={toAmount}
        toUSDAmount={toUSDAmount}
        toAssetSymbol={symbols[toAsset]}
        toBalance={balances[toAsset] && formatTokenAmount(balances[toAsset], decimals[toAsset])}
        toStep={smallestDecOfAsset(toAsset)}
        error={error}
        canSubmit={!(simulating || error)}
        onFromAmountChange={fromAmountChanged}
        onToAmountChange={toAmountChanged}
        onReverseAssets={assetsReversed}
      >
        {
          ustPrice && ustExchangeRate &&
          <SwapRates
            pair={pair}
            saleTokenInfo={saleTokenInfo}
            ustPrice={ustPrice}
            ustExchangeRate={ustExchangeRate}
            priceImpact={priceImpact}
          />
        }
      </SwapForm>
    </Card>
  );
}

export default SwapCard;
