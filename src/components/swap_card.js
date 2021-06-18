import { useState, useCallback, useMemo } from 'react';
import Card from './card';
import AssetInput from './asset_input';
import { getSimulation } from '../terra/queries';
import debounce from 'lodash/debounce';

// TODO: Dim/disable interface and display connect to wallet button if not connected
// TODO: Reject input with too many decimals

function SwapCard({ pair, saleTokenInfo, ustExchangeRate, walletAddress }) {
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');

  const fromUSDAmount = useMemo(() => {
    const floatFromAmount = parseFloat(fromAmount);

    if(isNaN(floatFromAmount)) return 0;

    return floatFromAmount * ustExchangeRate;
  }, [fromAmount, ustExchangeRate]);

  async function simulatePurchase(amount) {
    if(isNaN(amount)) {
      setToAmount('');
      return;
    }

    const simulation = await getSimulation(
      pair.contract_addr,
      Math.floor(amount * 10 ** 6),
      {
        native_token: {
          denom: 'uusd'
        }
      }
    );

    setToAmount(parseInt(simulation.return_amount) / 10 ** saleTokenInfo.decimals);
  }

  const debouncedSimulation = useCallback(
    debounce(amount => simulatePurchase(amount), 200),
    []
  );

  function fromAmountChanged(amount) {
    setFromAmount(amount);

    debouncedSimulation(parseFloat(amount));
  }

  return (
    <Card className="w-2/5 p-6 border border-blue-gray-300">
      <h1 className="text-lg mb-7">
        Swap
      </h1>
      
      <AssetInput
        label="From"
        amount={fromAmount}
        onChange={fromAmountChanged}
        usdAmount={fromUSDAmount}
        symbol="UST"
      />

      <AssetInput
        label="To (estimated)"
        amount={toAmount}
        onChange={setToAmount}
        usdAmount={0} // TODO: Figure out how to calculate this
        symbol={saleTokenInfo.symbol}
        className="mt-10"
      />
    </Card>
  );
}

export default SwapCard;
