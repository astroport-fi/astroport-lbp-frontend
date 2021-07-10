import { useEffect, useState, useMemo, useCallback } from 'react';
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
import CurrentWeightCard from './current_weight_card';
import ConnectWalletButton from './connect_wallet_button';
import HistoricalPriceCard from './historical_price_card';
import { useWallet } from '../hooks/use_wallet';
import { useNetwork } from '../hooks/use_network';

const REFRESH_INTERVAL = 30_000; // 30s

function CurrentTokenSale({ pair, saleTokenInfo }) {
  const [nativeTokenWeight, setNativeTokenWeight] = useState();
  const [saleTokenWeight, setSaleTokenWeight] = useState();
  const [pool, setPool] = useState();
  const [ustExchangeRate, setUSTExchangeRate] = useState();
  const [secondsRemaining, setSecondsRemaining] = useState();
  const { walletAddress } = useWallet();
  const { terraClient } = useNetwork();

  const refreshPairInfo = useCallback(async () => {
    const [[nativeTokenWeight, saleTokenWeight], pool] = await Promise.all([
      getWeights(
        terraClient,
        pair.contract_addr,
        nativeTokenFromPair(pair.asset_infos).info.native_token.denom
      ),
      getPool(terraClient, pair.contract_addr)
    ]);

    setNativeTokenWeight(new Dec(nativeTokenWeight));
    setSaleTokenWeight(new Dec(saleTokenWeight));
    setPool(pool);
  // terraClient intentionally omitted
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pair]);

  useRefreshingEffect(refreshPairInfo, REFRESH_INTERVAL, [refreshPairInfo]);

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
      tokenWeight: saleTokenWeight,
      tokenDecimals: saleTokenInfo.decimals
    });
  }, [pool, nativeTokenWeight, saleTokenWeight, saleTokenInfo.decimals]);

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
      <div className="grid grid-cols-12 gap-8 my-8">
        <InfoCard className="col-span-3" label="Price" value={formatUSD(usdPrice)} loading={usdPrice === undefined} />
        <InfoCard className="col-span-3" label="Coins Remaining" value={pool && formatTokenAmount(saleAssetFromPair(pool.assets).amount, saleTokenInfo.decimals)} loading={pool === undefined} />
        <InfoCard className="col-span-3" label="Time Remaining" value={durationString(secondsRemaining)} loading={secondsRemaining === undefined} />
        <CurrentWeightCard
          className="col-span-3"
          loading={nativeTokenWeight === undefined}
          pair={pair}
          saleTokenInfo={saleTokenInfo}
          currentNativeTokenWeight={nativeTokenWeight}
          currentSaleTokenWeight={saleTokenWeight}
        />

        {
          walletAddress ?
            <SwapCard
              className="col-span-5"
              pair={pair}
              saleTokenInfo={saleTokenInfo}
              ustExchangeRate={ustExchangeRate}
              ustPrice={ustPrice}
              onSwapTxMined={() => refreshPairInfo()}
            />
          :
            <Card className="p-6 border border-blue-gray-300 col-span-5 flex flex-col">
              <h2 className="text-xl font-bold">
                Swap
              </h2>

              <div className="flex-grow flex items-center mb-8">
                <ConnectWalletButton className="w-full" />
              </div>
            </Card>
        }

        <HistoricalPriceCard
          className="col-span-7"
          pair={pair}
          saleTokenInfo={saleTokenInfo}
          usdPrice={usdPrice}
          style={{ minHeight: '500px' }}
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
