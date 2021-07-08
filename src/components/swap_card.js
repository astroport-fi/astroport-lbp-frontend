import { useState, useCallback, useEffect } from 'react';
import Card from './card';
import AssetInput from './asset_input';
import { getSimulation, getReverseSimulation, getBalance, getTokenBalance } from '../terra/queries';
import { nativeTokenFromPair, saleAssetFromPair } from '../helpers/asset_pairs';
import { NATIVE_TOKEN_SYMBOLS } from '../constants';
import { feeForMaxNativeToken, buildSwapFromNativeTokenMsg, buildSwapFromContractTokenMsg, estimateFee, postMsg } from '../terra/swap';
import { formatTokenAmount } from '../helpers/number_formatters';
import { Dec } from '@terra-money/terra.js';
import terraClient from '../terra/client';
import classNames from 'classnames';
import SwapRates from './swap_rates';

// TODO: Dim/disable interface and display connect to wallet button if not connected
// TODO: Reject input with too many decimals
// TODO: Error handling

function SwapCard({ pair, saleTokenInfo, ustExchangeRate, walletAddress, ustPrice }) {
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

  function resetForm() {
    setFromAmount('');
    setToAmount('');
    setPriceImpact(null);
    setTx({ msg: null, fee: null });
    setUsingMaxNativeAmount(false);
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
    native_token: 6,
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

  const pairAssets = [
    {
      type: 'native_token',
      symbol: symbols.native_token
    },
    {
      type: 'token',
      symbol: symbols.token
    }
  ];

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
      const fee = await estimateFee(msg);

      return { msg, fee };
    }
  }

  function resetSimulationState() {
    setPriceImpact(null);
    setTx({ msg: null, fee: null });
    setSimulating(false);
  }

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

      // Don't run simulation when from amount is out of bounds
      if(type === 'forward' && (decInputAmount.lessThan(smallestDecOfAsset(fromAsset)) || decInputAmount.greaterThan(maxFromAmount))) {
        setter('');
        resetSimulationState();
        return;
      }

      try {
        const simulation = await simulationFn(
          pair.contract_addr,
          decInputAmount.mul(10 ** decimals[simulationInputAsset]).toInt(),
          requestAsset.info
        );

        const decOutputAmount = Dec.withPrec(
          simulation[type === 'forward' ? 'return_amount' : 'offer_amount'],
          decimals[simulationOutputAsset]
        );

        // Set output value and drop insignificant zeroes
        setter(parseFloat(decOutputAmount.toFixed(decimals[simulationInputAsset])).toString());

        // Calculate and set price impact
        let simulatedPrice;
        if (simulationInputAsset === 'native_token') {
          simulatedPrice = decInputAmount.div(decOutputAmount);
        } else {
          simulatedPrice = decOutputAmount.div(decInputAmount);
        }

        setPriceImpact(simulatedPrice.sub(ustPrice).div(ustPrice));

        if(type === 'reverse' && decOutputAmount.greaterThan(maxFromAmount)) {
          setError(`Not enough ${symbols[fromAsset]}`);
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
        // TODO: Notify error reporting service?
        console.error(e);

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

    setPendingSimulation({ type: 'forward' });
  }

  function toAmountChanged (amount) {
    setToAmount(amount);

    setPendingSimulation({ type: 'reverse' });
  }

  function swapFromTo() {
    // If the assets are swapped, we're no longer using
    // the calculated max amount
    setUsingMaxNativeAmount(false);

    setFromAsset(toAsset);
    setToAsset(fromAsset);
  }

  // While these are onAssetChange handlers, since we assume only two assets,
  // we don't bother checking what the actual change was - any change implies a reversal
  function fromAssetChanged() {
    setPendingSimulation({ type: 'forward' });

    swapFromTo();
  }

  function toAssetChanged() {
    setPendingSimulation({ type: 'reverse' });

    swapFromTo();
  }

  const updateBalances = useCallback(async () => {
    if (walletAddress) {
      const nativeToken = nativeTokenFromPair(pair.asset_infos).info.native_token.denom;

      const balances = await Promise.all([
        getBalance(nativeToken, walletAddress),
        getTokenBalance(saleAssetFromPair(pair.asset_infos).info.token.contract_addr, walletAddress)
      ]);

      setBalances({
        native_token: balances[0],
        token: balances[1]
      });
    }
  }, [walletAddress, pair]);

  useEffect(() => {
    updateBalances();
  }, [updateBalances]);

  // Checks up on the tx until it's mined
  // NOTE: This could also be used to convey the status
  //       of the tx to the user
  const refreshBalancesWhenTxMined = useCallback(async function (txhash) {
    try {
      // Once the tx has been included on the blockchain,
      // update the balances
      await terraClient.tx.txInfo(txhash);

      updateBalances();
      // TODO: Update rest of UI
    } catch {
      // Not on chain yet, try again in 5s
      setTimeout(refreshBalancesWhenTxMined, 5000, txhash);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function swapFormSubmitted (e) {
    e.preventDefault();

    try {
      const { txhash } = await postMsg(tx);

      refreshBalancesWhenTxMined(txhash);

      resetForm();

      alert('Success!');
    } catch (e) {
      console.error(e);

      alert('Error!');
    }
  }

  async function selectMaxFromAsset () {
    let amount;

    if(fromAsset === 'native_token') {
      const fee = await feeForMaxNativeToken({ pair, walletAddress, intBalance: balances.native_token });
      const denom = nativeTokenFromPair(pair.asset_infos).info.native_token.denom;
      const maxAmount = balances.native_token.sub(fee.amount.get(denom).amount);

      setTx({ fee });
      setUsingMaxNativeAmount(true);

      amount = maxAmount
    } else {
      // Since fees are paid in the native token,
      // we can set the amount to the full balance of contract tokens
      amount = balances.token;
    }

    const amountStr = Dec.withPrec(amount, decimals[fromAsset]).toFixed(decimals[fromAsset]);

    // Update from amount state (and drop insignificant zeroes)
    setFromAmount(parseFloat(amountStr));

    // Run simulation to project received tokens if entire wallet balance were swapped
    setPendingSimulation({ type: 'forward' });
  }

  const form = (
    <form onSubmit={swapFormSubmitted}>
      <h1 className="text-lg mb-7">
        Swap
      </h1>

      <AssetInput
        label="From"
        amount={fromAmount}
        onAmountChange={fromAmountChanged}
        usdAmount={fromUSDAmount}
        symbol="UST"
        assets={pairAssets}
        selectedAsset={fromAsset}
        onAssetChange={fromAssetChanged}
        required={true}
        balanceString={balances[fromAsset] && formatTokenAmount(balances[fromAsset], decimals[fromAsset])}
        maxClick={selectMaxFromAsset}
        max={maxFromAmount}
        min={smallestDecOfAsset(fromAsset)}
        step={smallestDecOfAsset(fromAsset)}
      />

      <AssetInput
        label="To (estimated)"
        amount={toAmount}
        onAmountChange={toAmountChanged}
        usdAmount={toUSDAmount}
        symbol={saleTokenInfo.symbol}
        className="mt-10"
        assets={pairAssets}
        selectedAsset={toAsset}
        onAssetChange={toAssetChanged}
        balanceString={balances[toAsset] && formatTokenAmount(balances[toAsset], decimals[toAsset])}
        step={smallestDecOfAsset(toAsset)}
      />

      { ustPrice && ustExchangeRate &&
        <SwapRates
          pair={pair}
          saleTokenInfo={saleTokenInfo}
          ustPrice={ustPrice}
          ustExchangeRate={ustExchangeRate}
          priceImpact={priceImpact}
        />
      }

      { error &&
        <div className="bg-red-600 bg-opacity-50 text-white text-center mt-4 p-2 rounded rounded-lg">{error}</div>
      }

      <button
        type="submit"
        className={
          classNames(
            "text-black py-2 px-6 rounded-lg w-full mt-12", {
              'bg-yellow': !(simulating || error),
              'bg-gray-400': (simulating || error)
            }
          )
        }
        disabled={simulating || error}>Swap</button>
    </form>
  );

  return (
    <Card className="w-2/5 p-6 border border-blue-gray-300">
      { walletAddress ? form : 'Please connect your wallet to swap' }
    </Card>
  );
}

export default SwapCard;
