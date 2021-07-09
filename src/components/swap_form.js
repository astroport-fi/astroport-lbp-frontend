import classNames from 'classnames';
import AssetInput from './asset_input';
import { ReactComponent as DownArrow } from '../assets/images/down-arrow.svg';
import { ReactComponent as ReverseArrows } from '../assets/images/reverse-arrows.svg';

function SwapForm({
  onSubmit,
  assets,
  fromAmount,
  fromUSDAmount,
  fromAsset,
  fromBalance,
  fromMin,
  fromMax,
  fromStep,
  onFromAmountChange,
  onFromAssetChange,
  fromMaxClick,
  toAmount,
  toUSDAmount,
  toAsset,
  toBalance,
  toStep,
  onToAmountChange,
  onToAssetChange,
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
        assets={assets}
        selectedAsset={fromAsset}
        onAssetChange={onFromAssetChange}
        required={true}
        balanceString={fromBalance}
        maxClick={fromMaxClick}
        max={fromMax}
        min={fromMin}
        step={fromStep}
      />

      <div className="relative flex items-center justify-center">
        <div className="rounded-full bg-blue-gray-500 text-yellow w-8 h-8 p-1 flex items-center justify-center my-4">
          <DownArrow className="h-5 w-5" />
        </div>

        <button type="button" className="absolute right-8" onClick={onReverseAssets}>
          <span className="sr-only">Reverse assets</span>

          <ReverseArrows className="h-5 w-5 opacity-60" />
        </button>
      </div>

      <AssetInput
        label="To (estimated)"
        amount={toAmount}
        onAmountChange={onToAmountChange}
        usdAmount={toUSDAmount}
        assets={assets}
        selectedAsset={toAsset}
        onAssetChange={onToAssetChange}
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
            "text-black py-3 px-6 rounded-lg w-full mt-12", {
              'bg-yellow': canSubmit,
              'bg-gray-400': !canSubmit
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
