import classNames from 'classnames';
import AssetInput from './asset_input';
import { ReactComponent as ReverseArrows } from '../assets/images/reverse-arrows.svg';

function SwapForm({
  onSubmit,
  fromAmount,
  fromUSDAmount,
  fromAssetSymbol,
  fromBalance,
  fromMin,
  fromMax,
  fromStep,
  onFromAmountChange,
  fromMaxClick,
  toAmount,
  toUSDAmount,
  toAssetSymbol,
  toBalance,
  toStep,
  onToAmountChange,
  error,
  canSubmit,
  onReverseAssets,
  children
}) {
  return (
    <form onSubmit={onSubmit}>
      <AssetInput
        label="From"
        amount={fromAmount}
        onAmountChange={onFromAmountChange}
        usdAmount={fromUSDAmount}
        assetSymbol={fromAssetSymbol}
        required={true}
        balanceString={fromBalance}
        maxClick={fromMaxClick}
        max={fromMax}
        min={fromMin}
        step={fromStep}
      />

      <div className="flex items-center justify-center mt-5 mb-2">
        <button type="button" onClick={onReverseAssets}>
          <span className="sr-only">Reverse assets</span>

          <ReverseArrows className="h-5 w-5 opacity-50 hover:opacity-100 transition-opacity" aria-hidden="true" />
        </button>
      </div>

      <AssetInput
        label="To (estimated)"
        amount={toAmount}
        onAmountChange={onToAmountChange}
        usdAmount={toUSDAmount}
        assetSymbol={toAssetSymbol}
        balanceString={toBalance}
        step={toStep}
      />

      { children }

      {
        error &&
        <div className="bg-red-600 bg-opacity-50 text-white text-center mt-4 p-2 rounded rounded-lg">{error}</div>
      }

      <button
        type="submit"
        className={
          classNames(
            "py-3 px-6 rounded-lg w-full mt-12 transition", {
              'btn-primary hover:animate-pulse': canSubmit,
              'btn-disabled': !canSubmit
            }
          )
        }
        disabled={!canSubmit}>
        Swap
      </button>
    </form>
  );
}

export default SwapForm;
