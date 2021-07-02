import './asset_input.css';
import AutosizeInput from 'react-input-autosize';
import nextId from 'react-id-generator';
import { formatNumber, formatUSD } from '../helpers/number_formatters';
import { useRef } from 'react'

// TODO: Better display of huge numbers (currently overflows container)

function AssetInput({ label, required, className, amount, usdAmount, assets, selectedAsset, onAmountChange, onAssetChange }) {
  const inputId = nextId();
  const selectId = nextId();
  const inputEl = useRef();

  // TODO: Fetch actual balance
  const balance = 0;

  return (
    <div className={className}>
      <div className="flex justify-between text-sm text-white text-opacity-60">
        <label htmlFor={inputId}>{label}</label>

        <span>
          Balance: {formatNumber(balance)}
        </span>
      </div>

      <div className="border border-blue-gray-300 rounded-lg py-3 px-4 flex justify-between mt-2">
        <div className="flex items-center flex-grow cursor-text" onClick={() => inputEl.current.focus()}>
          <AutosizeInput
            id={inputId}
            type="number"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            className="max-w-max"
            inputClassName="bg-transparent outline-none input-no-spinner"
            autoComplete="off"
            placeholder="0.000"
            ref={inputEl}
            required={required}
          />

          <span className="text-white text-opacity-50 text-xs select-none">
            ({formatUSD(usdAmount)})
          </span>
        </div>

        <div className="border-l border-blue-gray-350 pl-4">
          <label htmlFor={selectId} className="sr-only">Asset</label>

          <select id={selectId} className="bg-transparent outline-none cursor-pointer" value={selectedAsset} onChange={e => onAssetChange(e.target.value)}>
            {
              assets.map(asset => <option value={asset.type} key={asset.type}>{asset.symbol}</option>)
            }
          </select>
        </div>
      </div>
    </div>
  );
}

export default AssetInput;
