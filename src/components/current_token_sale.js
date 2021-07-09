import { useEffect, useState, useMemo } from 'react';
import { nativeTokenFromPair, saleAssetFromPair } from '../helpers/asset_pairs';
import InfoCard from './info_card';
import { getWeights, getPool } from '../terra/queries';
import fetchUSTExchangeRate from '../services/fetch_ust_exchange_rate';
import { formatUSD, formatTokenAmount } from '../helpers/number_formatters';
import { calcPrice } from '../terra/math';
import { useRefreshingEffect } from '../helpers/effects';
import { durationString } from '../helpers/time_formatters';
import SwapCard from './swap_card';
import { Int, Dec } from '@terra-money/terra.js';
import Card from './card';

const REFRESH_INTERVAL = 30_000; // 30s

function CurrentTokenSale({ onWalletConnect, pair, saleTokenInfo, walletAddress }) {
  const [nativeTokenWeight, setNativeTokenWeight] = useState();
  const [saleTokenWeight, setSaleTokenWeight] = useState();
  const [pool, setPool] = useState();
  const [ustExchangeRate, setUSTExchangeRate] = useState();
  const [secondsRemaining, setSecondsRemaining] = useState();

  useRefreshingEffect(async () => {
    const [[nativeTokenWeight, saleTokenWeight], pool] = await Promise.all([
      getWeights(
        pair.contract_addr,
        nativeTokenFromPair(pair.asset_infos).info.native_token.denom
      ),
      getPool(pair.contract_addr)
    ]);

    setNativeTokenWeight(new Dec(nativeTokenWeight));
    setSaleTokenWeight(new Dec(saleTokenWeight));
    setPool(pool);
  }, REFRESH_INTERVAL, [pair]);

  useRefreshingEffect(async() => {
    const exchangeRate = await fetchUSTExchangeRate();

    setUSTExchangeRate(exchangeRate);
  }, REFRESH_INTERVAL);

  const ustPrice = useMemo(() => {
    if(pool === undefined || nativeTokenWeight === undefined || saleTokenWeight === undefined){
      return;
    }

    return calcPrice({
      ustPoolSize: new Int(nativeTokenFromPair(pool.assets).amount),
      tokenPoolSize: new Int(saleAssetFromPair(pool.assets).amount),
      ustWeight: nativeTokenWeight,
      tokenWeight: saleTokenWeight
    });
  }, [pool, nativeTokenWeight, saleTokenWeight]);

  const usdPrice = useMemo(() => {
    // Don't convert if ust price or exchange rate is null
    if(ustPrice === undefined || ustExchangeRate === undefined) {
      return;
    }

    return ustPrice.mul(ustExchangeRate);
  }, [ustExchangeRate, ustPrice]);

  useEffect(() => {
    let timeout;

    const tick = () => {
      const secondsRemaining = pair.end_time - Math.floor(Date.now()/1000);

      setSecondsRemaining(secondsRemaining > 0 ? secondsRemaining : 0);

      // Since we only display the time left with minute granularity,
      // we only need to recalculate on the next whole minute
      const secondsToNextMinute = (secondsRemaining % 60);
      const delay = secondsToNextMinute === 0 ? 60 : secondsToNextMinute;

      timeout = setTimeout(tick, delay * 1000);
    };

    tick();

    return () => clearTimeout(timeout);
  }, [pair]);

  return (
    <>
      <div className="grid grid-cols-4 gap-8 my-8">
        <InfoCard label="Price" value={formatUSD(usdPrice)} loading={usdPrice === undefined} />
        <InfoCard label="Coins Remaining" value={pool && formatTokenAmount(saleAssetFromPair(pool.assets).amount, saleTokenInfo.decimals)} loading={pool === undefined} />
        <InfoCard label="Time Remaining" value={durationString(secondsRemaining)} loading={secondsRemaining === undefined} />
        <InfoCard label="Current Weight" value={`${Math.round(nativeTokenWeight)} : ${Math.round(saleTokenWeight)}`} loading={nativeTokenWeight === undefined} />
      </div>

      <div className="flex my-8">
        <SwapCard
          onWalletConnect={onWalletConnect}
          pair={pair}
          saleTokenInfo={saleTokenInfo}
          walletAddress={walletAddress}
          ustExchangeRate={ustExchangeRate}
          ustPrice={ustPrice}
        />
      </div>

      {
        pair.description &&
        <Card className="my-8 px-6 pb-6">
          <h2 className="text-xl font-bold mb-4 py-4 border-b border-blue-gray-400">About</h2>

          <p>
            {pair.description}
          </p>
        </Card>
      }
    </>
  );
}

export default CurrentTokenSale;
