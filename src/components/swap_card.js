import { useState, useCallback, useMemo } from 'react';
import Card from './card';
import AssetInput from './asset_input';
import { getSimulation, getReverseSimulation } from '../terra/queries';
import { nativeTokenFromPair, saleAssetFromPair } from '../helpers/asset_pairs';
import { NATIVE_TOKEN_SYMBOLS, NATIVE_TOKEN_DECIMALS } from '../constants';
import debounce from 'lodash/debounce';

// TODO: Dim/disable interface and display connect to wallet button if not connected
// TODO: Reject input with too many decimals
// TODO: Error handling

function SwapCard({ pair, saleTokenInfo, ustExchangeRate, walletAddress }) {
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [fromAsset, setFromAsset] = useState('native_token');
  const [toAsset, setToAsset] = useState('token');

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
  async function simulation(type, amount, fromAsset, toAsset) {
    const assets=[fromAsset, toAsset];

    let setter;

    if(type === 'forward') {
      setter = setToAmount;
    } else {
      setter = setFromAmount;
      assets.reverse();
    }

    if(isNaN(amount)) {
      setter('');
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
      Math.floor(amount * 10 ** assetDecimals[assets[0]]),
      requestAsset.info
    );

    const simulatedAmount = parseInt(simulation[type == 'forward' ? 'return_amount' : 'offer_amount']);

    setter(simulatedAmount / 10 ** assetDecimals[assets[1]]);
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
    debounce((type, amount, fromAsset, toAsset) => simulation(type, amount, fromAsset, toAsset), 200),
    []
  );

  function fromAmountChanged(amount) {
    setFromAmount(amount);

    debouncedSimulation('forward', parseFloat(amount), fromAsset, toAsset);
  }

  function toAmountChanged(amount) {
    setToAmount(amount);

    debouncedSimulation('reverse', parseFloat(amount), fromAsset, toAsset);
  }

  function swapFromTo() {
    setFromAsset(toAsset);
    setToAsset(fromAsset);
  }

  // While these are onAssetChange handlers, since we assume only two assets,
  // we don't bother checking what the actual change was - any change implies a reversal
  function fromAssetChanged() {
    // Swap assets when running simulation because we're about to swap them
    simulation('forward', parseFloat(fromAmount), toAsset, fromAsset);

    swapFromTo();
  }

  function toAssetChanged() {
    simulation('reverse', parseFloat(toAmount), toAsset, fromAsset);

    swapFromTo();
  }

  return (
    <Card className="w-2/5 p-6 border border-blue-gray-300">
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
      />
    </Card>
  );
}

export default SwapCard;
