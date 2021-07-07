import { useState, useCallback, useMemo, useEffect } from 'react';
import Card from './card';
import AssetInput from './asset_input';
import { getSimulation, getReverseSimulation, getBalance, getTokenBalance } from '../terra/queries';
import { nativeTokenFromPair, saleAssetFromPair } from '../helpers/asset_pairs';
import { NATIVE_TOKEN_SYMBOLS, NATIVE_TOKEN_DECIMALS } from '../constants';
import debounce from 'lodash/debounce';
import { feeForMaxNativeToken, buildSwapFromNativeTokenMsg, buildSwapFromContractTokenMsg, estimateFee, postMsg } from '../terra/swap';
import { formatTokenAmount, formatNumber, formatUSD } from '../helpers/number_formatters';
import { Dec } from '@terra-money/terra.js';
import terraClient from '../terra/client';
import classNames from 'classnames';

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
  const [calculatingFees, setCalculatingFees] = useState(false);
  const [usingMaxNativeAmount, setUsingMaxNativeAmount] = useState(false);
  const [priceImpact, setPriceImpact] = useState();

  const fromUSDAmount = useMemo(() => {
    const floatFromAmount = parseFloat(fromAmount);

    if(isNaN(floatFromAmount)) return 0;

    return floatFromAmount * ustExchangeRate;
  }, [fromAmount, ustExchangeRate]);

  // Runs either a regular/forward or reverse simulation based on the given type
  // A forward simulation runs a regular simulation from the given amount,
  // and sets the toAmount to the result.
  // A reverse simulation runs a reverse simulation to the given amount,
  // and sets the fromAmount to the result.
  async function simulation(type, amountString, fromAsset, toAsset) {
    const assets=[fromAsset, toAsset];

    let setter, decAmount;

    if(type === 'forward') {
      setter = setToAmount;
    } else {
      setter = setFromAmount;
      assets.reverse();
    }

    try {
      decAmount = new Dec(amountString);
    } catch {
      setter('');
      setPriceImpact(null);
      return;
    }

    const assetDecimals = {
      native_token: NATIVE_TOKEN_DECIMALS,
      token: saleTokenInfo.decimals
    }

    const requestAsset = assets[0] === 'native_token' ? nativeTokenFromPair(pair.asset_infos) : saleAssetFromPair(pair.asset_infos);

    const getters = {
      forward: getSimulation,
      reverse: getReverseSimulation
    }

    const simulation = await getters[type](
      pair.contract_addr,
      decAmount.mul(10 ** assetDecimals[assets[0]]).toInt(),
      requestAsset.info
    );

    const simulatedAmount = simulation[type === 'forward' ? 'return_amount' : 'offer_amount'];
    const simulatedAmountDec = Dec.withPrec(simulatedAmount, assetDecimals[assets[1]]);

    // Drop insignificant zeroes
    setter(parseFloat(simulatedAmountDec.toFixed(assetDecimals[assets[0]])).toString());

    // Calculate and set price impact
    let simulatedPrice;
    if(type === 'forward') {
      simulatedPrice = decAmount.div(simulatedAmountDec);
    } else {
      simulatedPrice = simulatedAmountDec.div(decAmount);
    }

    setPriceImpact(simulatedPrice.sub(ustPrice).div(ustPrice));
  }

  const pairAssets = useMemo(() => {
    return [
      {
        type: 'native_token',
        symbol: NATIVE_TOKEN_SYMBOLS[nativeTokenFromPair(pair.asset_infos).info.native_token.denom]
      },
      {
        type: 'token',
        symbol: saleTokenInfo.symbol
      }
    ];
  }, [pair, saleTokenInfo.symbol]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSimulation = useCallback(
    debounce((type, amountString, fromAsset, toAsset) => simulation(type, amountString, fromAsset, toAsset), 200),
    [ustPrice]
  );

  function fromAmountChanged(amount) {
    // If the from amount changes from an input event,
    // we're no longer using the calculated max amount
    setUsingMaxNativeAmount(false);

    setFromAmount(amount);

    debouncedSimulation('forward', amount, fromAsset, toAsset);
  }

  function toAmountChanged(amount) {
    setToAmount(amount);

    debouncedSimulation('reverse', amount, fromAsset, toAsset);
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
    // Swap assets when running simulation because we're about to swap them
    simulation('forward', fromAmount, toAsset, fromAsset);

    swapFromTo();
  }

  function toAssetChanged() {
    simulation('reverse', toAmount, toAsset, fromAsset);

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

  const decimals = useMemo(() => {
    return {
      native_token: 6,
      token: saleTokenInfo.decimals
    }
  }, [saleTokenInfo]);

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

  async function updateFeeEstimate(msg) {
    const fee = await estimateFee(msg);

    setTx({ msg, fee });
    setCalculatingFees(false);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedUpdateFeeEstimate = useCallback(
    debounce(msg => updateFeeEstimate(msg), 200),
    []
  );

  useEffect(() => {
    if(!fromAmount) {
      setTx({ msg: null, fee: null });
      return;
    }

    const fromInfo = {
      native_token: {
        builder: buildSwapFromNativeTokenMsg,
        decimals: 6
      },
      token: {
        builder: buildSwapFromContractTokenMsg,
        decimals: saleTokenInfo.decimals
      }
    }[fromAsset];

    const intAmount = (new Dec(fromAmount || 0)).mul(10 ** fromInfo.decimals).toInt();
    const msg = fromInfo.builder({ pair, walletAddress, intAmount });

    // Fetch fees unless the user selected "max" for the native amount
    // (that logic already calculated the fee by backing it out of the wallet balance)

    if(usingMaxNativeAmount) {
      setTx({ ...tx, msg });
    } else {
      setCalculatingFees(true);

      debouncedUpdateFeeEstimate(msg);
    }
  // usingMaxNativeAmount intentionally omitted
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromAmount, fromAsset, pair, walletAddress, saleTokenInfo]);

  async function swapFormSubmitted (e) {
    e.preventDefault();

    try {
      const { txhash } = await postMsg(tx);

      refreshBalancesWhenTxMined(txhash);

      // TODO: Clear form

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

      setTx({ ...tx, fee });
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
    simulation('forward', amountStr, fromAsset, toAsset)
  }

  const form = <form onSubmit={swapFormSubmitted}>
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
    />

    <AssetInput
      label="To (estimated)"
      amount={toAmount}
      onAmountChange={toAmountChanged}
      usdAmount={0} // TODO: Figure out how to calculate this
      symbol={saleTokenInfo.symbol}
      className="mt-10"
      assets={pairAssets}
      selectedAsset={toAsset}
      onAssetChange={toAssetChanged}
      balanceString={balances[toAsset] && formatTokenAmount(balances[toAsset], decimals[toAsset])}
    />

    <dl className="bg-blue-gray-500 text-xs rounded rounded-lg px-3 py-1 mt-4">
      <div className="flex justify-between my-2">
        <dt className="opacity-60">Rate</dt>
        <dd>1 {saleTokenInfo.symbol} = {formatNumber(ustPrice, { maximumFractionDigits: 3 })} {NATIVE_TOKEN_SYMBOLS[nativeTokenFromPair(pair.asset_infos).info.native_token.denom]}</dd>
      </div>

      <div className="flex justify-between my-2">
        <dt className="opacity-60">$ Price {NATIVE_TOKEN_SYMBOLS[nativeTokenFromPair(pair.asset_infos).info.native_token.denom]}</dt>
        <dd>{formatUSD(ustExchangeRate)}</dd>
      </div>

      <div className="flex justify-between my-2">
        <dt className="opacity-60">$ Price {saleTokenInfo.symbol}</dt>
        <dd>{ustPrice && ustExchangeRate && formatUSD(ustPrice.mul(ustExchangeRate))}</dd>
      </div>

      { priceImpact &&
        <div className="flex justify-between my-2">
          <dt className="opacity-60">Price Impact</dt>
          <dd>{formatNumber(priceImpact, { style: 'percent', maximumFractionDigits: 2 })}</dd>
        </div>
      }
    </dl>

    <button
      type="submit"
      className={
        classNames(
          "text-black py-2 px-6 rounded-lg w-full mt-12", {
            'bg-yellow': !calculatingFees,
            'bg-gray-400': calculatingFees
          }
        )
      }
      disabled={calculatingFees}>Swap</button>
  </form>;

  return (
    <Card className="w-2/5 p-6 border border-blue-gray-300">
      { walletAddress ? form : 'Please connect your wallet to swap' }
    </Card>
  );
}

export default SwapCard;
