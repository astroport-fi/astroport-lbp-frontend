import './asset_input.css';
import AutosizeInput from 'react-input-autosize';
import nextId from 'react-id-generator';
import { formatUSD } from '../helpers/number_formatters';
import { useRef, useState, useEffect } from 'react';
import classNames from 'classnames';

// TODO: Better display of huge numbers (currently overflows container)

function AssetInput({
  label,
  required,
  className,
  amount,
  usdAmount,
  assets,
  selectedAsset,
  balanceString,
  onAmountChange,
  onAssetChange,
  maxClick,
  min,
  max
}) {
  const inputId = nextId();
  const selectId = nextId();
  const inputEl = useRef();
  const [error, setError] = useState(false);

  function validateInput() {
    if(inputEl.current.input.validity.rangeOverflow) {
      setError(`cannot be greater than ${parseFloat(max)}`);
    } else {
      setError(false);
    }
  }

  function amountChanged(e) {
    validateInput()

    onAmountChange(e.target.value);
  }

  useEffect(() => {
    validateInput();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount, max]);

  return (
    <div className={className}>
      <div className="flex justify-between text-sm text-white text-opacity-60">
        <label htmlFor={inputId}>{label}</label>

        <span>
          Balance: {balanceString}
        </span>
      </div>

      <div className={classNames('border rounded-lg py-3 px-4 flex justify-between mt-2', { 'border-blue-gray-300': !error, 'border-red-500': error })}>
        <div className="flex items-center flex-grow cursor-text" onClick={() => inputEl.current.focus()}>
          <AutosizeInput
            id={inputId}
            type="number"
            value={amount}
            onChange={amountChanged}
            className="max-w-max"
            inputClassName="bg-transparent outline-none input-no-spinner"
            autoComplete="off"
            placeholder="0.000"
            ref={inputEl}
            required={required}
            max={max}
            min={min}
          />

          <span className="text-white text-opacity-50 text-xs select-none">
            ({formatUSD(usdAmount)})
          </span>
        </div>

        {
          maxClick &&
          <button type="button" className="text-yellow text-xs uppercase mr-3" onClick={maxClick}>
            Max
          </button>
        }
        <div className="border-l border-blue-gray-350 pl-4">
          <label htmlFor={selectId} className="sr-only">Asset</label>

          <select id={selectId} className="bg-transparent outline-none cursor-pointer" value={selectedAsset} onChange={e => onAssetChange(e.target.value)}>
            {
              assets.map(asset => <option value={asset.type} key={asset.type}>{asset.symbol}</option>)
            }
          </select>
        </div>
      </div>

      { error &&
        <span className="text-red-500 text-sm">{error}</span>
      }
    </div>
  );
}

export default AssetInput;
