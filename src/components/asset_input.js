import './asset_input.css';
import AutosizeInput from 'react-input-autosize';
import nextId from 'react-id-generator';
import { formatUSD } from '../helpers/number_formatters';
import { useRef, useState, useEffect } from 'react';
import classNames from 'classnames';

// TODO: Better display of huge numbers (currently overflows container)

const DEFAULT_BORDER_CLASSES = 'border-white border-opacity-30';

function AssetInput({
  label,
  required,
  className,
  amount,
  usdAmount,
  assetSymbol,
  balanceString,
  onAmountChange,
  maxClick,
  min,
  max,
  step
}) {
  const inputId = nextId();
  const inputEl = useRef();
  const [error, setError] = useState(false);
  const [focused, setFocused] = useState(false);
  const [borderClasses, setBorderClasses] = useState(DEFAULT_BORDER_CLASSES);

  function validateInput() {
    if(inputEl.current.input.validity.rangeOverflow) {
      setError(`cannot be greater than ${max}`);
    } else if(inputEl.current.input.validity.rangeUnderflow) {
      setError(`cannot be less than ${min}`);
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

  useEffect(() => {
    if(error) {
      setBorderClasses('border-red-500');
    } else if(focused) {
      setBorderClasses('border-white');
    } else {
      setBorderClasses(DEFAULT_BORDER_CLASSES);
    }
  }, [error, focused]);

  return (
    <div className={className}>
      <div className="flex justify-between">
        <label htmlFor={inputId} className="text-secondary">{label}</label>

        <span className="flex">
          <span className="text-secondary mr-1" aria-hidden="true">Balance:</span>

          <span className="text-xs" aria-label={`${assetSymbol} Balance`}>{balanceString}</span>
        </span>
      </div>

      <div className={classNames('transition-colors border rounded-lg py-3 px-3.5 flex justify-between mt-2 items-center', borderClasses)}>
        <div className="flex items-center flex-grow cursor-text" onClick={() => inputEl.current.focus()}>
          <AutosizeInput
            id={inputId}
            type="number"
            value={amount}
            onChange={amountChanged}
            className="max-w-max"
            inputClassName="bg-transparent outline-none input-no-spinner text-sm"
            autoComplete="off"
            placeholder="0.000"
            ref={inputEl}
            required={required}
            max={max}
            min={min}
            step={step}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />

          <span className={classNames('text-white text-xs select-none', { 'text-opacity-50': !amount })}>
            ({formatUSD(usdAmount)})
          </span>
        </div>

        {
          maxClick &&
          <button type="button" className="text-yellow text-xs uppercase mr-6 outline-none" onClick={maxClick}>
            Max
          </button>
        }
        <div className="text-xs">
          {assetSymbol}
        </div>
      </div>

      { error &&
        <span className="text-red-500 text-sm">{error}</span>
      }
    </div>
  );
}

export default AssetInput;
