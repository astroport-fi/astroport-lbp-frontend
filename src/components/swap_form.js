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
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd"
                  d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z"
                  clipRule="evenodd"/>
          </svg>
        </div>

        <button type="button" className="absolute right-8" onClick={onReverseAssets}>
          <span className="sr-only">Reverse assets</span>

          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-60" viewBox="0 0 20 20" fill="currentColor">
            <path
              d="M5 12a1 1 0 102 0V6.414l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L5 6.414V12zM15 8a1 1 0 10-2 0v5.586l-1.293-1.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L15 13.586V8z"/>
          </svg>
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
