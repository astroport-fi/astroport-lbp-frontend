import { useEffect, useState } from 'react';
import { nativeTokenFromPair, saleAssetFromPair } from '../helpers/asset_pairs';
import CW20TokenName from './cw20_token_name';
import InfoCard from './info_card';
import { getWeights, getPool } from '../terra/queries';
import fetchUSTExchangeRate from '../services/fetch_ust_exchange_rate';
import { formatUSD, formatNumber } from '../helpers/number_formatters';
import { calcPrice } from '../terra/math';

function CurrentTokenSale({ pair }) {
  const [weights, setWeights] = useState([]);
  const [pool, setPool] = useState();
  const [ustPrice, setUSTPrice] = useState();
  const [usdPrice, setUSDPrice] = useState();

  // TODO: Refresh automatically
  useEffect(() => {
    const fetchWeights = async () => {
      const price = await getWeights(
        pair.contract_addr,
        nativeTokenFromPair(pair.asset_infos).info.native_token.denom
      );

      setWeights(price);
    }

    fetchWeights();
  }, [pair]);

  // TODO: Refresh automatically
  useEffect(() => {
    const fetchPool = async () => {
      const pool = await getPool(pair.contract_addr);

      setPool(pool);
    }

    fetchPool();
  }, [pair]);

  useEffect(() => {
    if(pool?.assets == null || weights.length == 0){
      setUSTPrice(null);
      return;
    }

    setUSTPrice(calcPrice({
      ustPoolSize: nativeTokenFromPair(pool.assets).amount,
      tokenPoolSize: saleAssetFromPair(pool.assets).amount,
      ustWeight: weights[0],
      tokenWeight: weights[1]
    }));
  }, [pool, weights]);

  useEffect(() => {
    // Don't bother converting if ust price is null
    if(ustPrice == null) {
      setUSDPrice(null);
      return;
    }

    const convertUSTPriceToUSD = async () => {
      const exchangeRate = await fetchUSTExchangeRate();

      setUSDPrice(ustPrice * exchangeRate);
    }

    convertUSTPriceToUSD();
  }, [ustPrice]);

  // TODO: Fetch time remaining

  return (
    <>
      <h1 className="text-lg">
        <CW20TokenName address={saleAssetFromPair(pair.asset_infos).info.token.contract_addr} /> Token Sale
      </h1>

      <div className="grid grid-cols-4 gap-6 my-6">
        <InfoCard label="Price" value={formatUSD(usdPrice)} loading={usdPrice == null} />
        <InfoCard label="Coins Remaining" value={pool && formatNumber(saleAssetFromPair(pool.assets).amount)} loading={pool == null} />
        <InfoCard label="Time Remaining" value="1d : 22h : 25m" />
        <InfoCard label="Current Weight" value={weights.map(w => Math.round(w)).join(' : ')} loading={weights.length == 0} />
      </div>
    </>
  );
}

export default CurrentTokenSale;
