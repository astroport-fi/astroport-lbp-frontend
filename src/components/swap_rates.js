import { formatNumber, formatUSD } from '../helpers/number_formatters';
import { NATIVE_TOKEN_SYMBOLS } from '../constants';
import { nativeTokenFromPair } from '../helpers/asset_pairs';

function SwapRates({ pair, saleTokenInfo, ustPrice, ustExchangeRate, priceImpact }) {
  return (
    <dl className="text-xs rounded rounded-lg px-3 py-1 mt-6 mb-4">
      <div className="flex justify-between my-2">
        <dt className="text-secondary">Rate</dt>
        <dd>1 {saleTokenInfo.symbol} = {formatNumber(ustPrice, { maximumFractionDigits: 3 })} {NATIVE_TOKEN_SYMBOLS[nativeTokenFromPair(pair.asset_infos).info.native_token.denom]}</dd>
      </div>

      <div className="flex justify-between my-2">
        <dt className="text-xs">$ Price {NATIVE_TOKEN_SYMBOLS[nativeTokenFromPair(pair.asset_infos).info.native_token.denom]}</dt>
        <dd>{formatUSD(ustExchangeRate)}</dd>
      </div>

      <div className="flex justify-between my-2">
        <dt className="text-xs">$ Price {saleTokenInfo.symbol}</dt>
        <dd>{formatUSD(ustPrice.mul(ustExchangeRate))}</dd>
      </div>

      { priceImpact &&
        <div className="flex justify-between my-2">
          <dt className="text-secondary">Price Impact</dt>
          <dd>{formatNumber(priceImpact, { style: 'percent', maximumFractionDigits: 2 })}</dd>
        </div>
      }
    </dl>
  )
}

export default SwapRates;
