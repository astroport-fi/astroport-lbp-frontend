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

      <div className="rounded-full bg-blue-gray-500 text-yellow w-8 h-8 p-1 inline-block flex items-center justify-center mx-auto my-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd"
                d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z"
                clip-rule="evenodd"/>
        </svg>
      </div>

      <AssetInput
        label="To (estimated)"
        amount={toAmount}
        onAmountChange={toAmountChange}
        usdAmount={toUSDAmount}
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
