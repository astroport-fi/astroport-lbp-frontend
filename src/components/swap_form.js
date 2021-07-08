import classNames from 'classnames';
import AssetInput from './asset_input';

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
  fromAmountChange,
  fromAssetChange,
  fromMaxClick,
  toAmount,
  toUSDAmount,
  toAsset,
  toBalance,
  toStep,
  toAmountChange,
  toAssetChange,
  error,
  canSubmit,
  children
}) {
  return (
    <form onSubmit={onSubmit}>
      <AssetInput
        label="From"
        amount={fromAmount}
        onAmountChange={fromAmountChange}
        usdAmount={fromUSDAmount}
        assets={assets}
        selectedAsset={fromAsset}
        onAssetChange={fromAssetChange}
        required={true}
        balanceString={fromBalance}
        maxClick={fromMaxClick}
        max={fromMax}
        min={fromMin}
        step={fromStep}
      />

      <AssetInput
        label="To (estimated)"
        amount={toAmount}
        onAmountChange={toAmountChange}
        usdAmount={toUSDAmount}
        className="mt-10"
        assets={assets}
        selectedAsset={toAsset}
        onAssetChange={toAssetChange}
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
            "text-black py-2 px-6 rounded-lg w-full mt-12", {
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
