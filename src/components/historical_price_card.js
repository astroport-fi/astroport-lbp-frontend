import './historical_price_card.css';
import Card from './card';
import classNames from 'classnames';
import { NATIVE_TOKEN_SYMBOLS } from '../constants';
import { nativeTokenFromPair } from '../helpers/asset_pairs';
import Chart from './chart';
import { VictoryArea } from 'victory';
import useMeasure from 'react-use-measure';
import { useState, useEffect, useMemo } from 'react';
import { formatNumber, formatUSD } from '../helpers/number_formatters';
import { ApolloClient, gql, InMemoryCache } from '@apollo/client';
import { useRefreshingEffect } from '../hooks/use_refreshing_effect';
import { timeString } from '../helpers/time_formatters';
import OptionsGroup from './historical_price_card/options_group';
import { ReactComponent as LoadingIndicator } from '../assets/images/loading-indicator.svg';

// TODO: Update to actual graphql endpoint
const apolloClient = new ApolloClient({
  uri: 'https://graph.mirror.finance/graphql',
  cache: new InMemoryCache()
});

const PRICE_QUERY = gql`
  query PriceHistory($contractAddress: String!, $from: Float!, $to: Float!, $interval: Float!) {
    asset(token: $contractAddress) {
      prices {
        history(from: $from, to: $to, interval: $interval) {
          timestamp
          price
        }
      }
    }
  }
`;

const INTERVALS = [
  {
    minutes: 5,
    label: '5M'
  },
  {
    minutes: 15,
    label: '15M'
  },
  {
    minutes: 30,
    label: '30M'
  },
  {
    minutes: 60,
    label: '1HR'
  },
  {
    minutes: 4 * 60,
    label: '4HR'
  }
]

const INTERVALS_TO_QUERY = 70;

function HistoricalPriceCard({ className, pair, saleTokenInfo, usdPrice, style }) {
  const nativeTokenAssetInfo = nativeTokenFromPair(pair.asset_infos);
  const nativeSymbol = NATIVE_TOKEN_SYMBOLS[nativeTokenAssetInfo.info.native_token.denom];
  const [chartWrapperRef, chartWrapperBounds] = useMeasure();
  const [chartSVGWidth, setChartSVGWidth] = useState();
  const [chartSVGHeight, setChartSVGHeight] = useState();
  const [data, setData] = useState();
  const [interval, setInterval] = useState(INTERVALS[INTERVALS.length-1].minutes);
  const [scale, setScale] = useState('linear');
  const [fetchingNewData, setFetchingNewData] = useState();

  useRefreshingEffect((isRefreshing) => {
    setFetchingNewData(!isRefreshing);

    const fetchData = async() => {
      const { data } = await apolloClient.query({
        fetchPolicy: 'no-cache',
        query: PRICE_QUERY,
        variables: {
          // TODO: Replace with actual contract address
          contractAddress: 'terra15gwkyepfc6xgca5t5zefzwy42uts8l2m4g40k6', // pair.contract_addr
          from: Date.now() - INTERVALS_TO_QUERY * interval * 60 * 1000,
          to: Date.now(),
          interval: interval // in minutes
        }
      });

      setData(data.asset.prices.history.map(
        ({ timestamp, price }) => ({ timestamp, price: parseFloat(price) })
      ));

      setFetchingNewData(false);
    }

    fetchData();
  }, 60_000, [pair, interval]);

  // Match aspect ratio of container (which grows to fill the card)
  useEffect(() => {
    if(chartWrapperBounds.width > 0) {
      setChartSVGWidth(chartWrapperBounds.width);
    }

    if(chartWrapperBounds.height > 0) {
      setChartSVGHeight(chartWrapperBounds.height);
    }
  }, [chartWrapperBounds.width, chartWrapperBounds.height]);

  const prices = useMemo(() => data?.map(({ price }) => price), [data]);

  const areaDataStyle = {
    stroke: 'var(--theme-historical-price-chart-line-color)',
    strokeWidth: 2,
    fill: 'url(#fillGradient)'
  }

  return (
    <Card className={classNames('py-8 px-12 flex flex-col historical-price-card', className)} style={style}>
      <div className="flex justify-between">
        <h2 className="font-bold">
          {nativeSymbol} / {saleTokenInfo.symbol}
        </h2>

        {
          usdPrice &&
          <h3 className="font-bold text-lg">
            {formatUSD(usdPrice)}
          </h3>
        }
      </div>

      <div className="flex justify-between my-4">
        <OptionsGroup
          options={[
            {
              value: 'linear',
              label: 'Lin'
            },
            {
              value: 'log',
              label: 'Log'
            }
          ]}
          selected={scale}
          onOptionSelect={setScale}
        />

        <OptionsGroup
          options={INTERVALS.map(({minutes: value, label}) => ({ value, label }))}
          selected={interval}
          onOptionSelect={setInterval}
          className="mr-4"
        />
      </div>

      <svg className="h-0">
        <defs>
          <linearGradient id="fillGradient"
            x1="0%"
            x2="0%"
            y1="0%"
            y2="100%"
          >
            <stop offset="0%" stopOpacity="0.5" className="from-stop" />
            <stop offset="50%" stopOpacity="0" className="to-stop" />
          </linearGradient>
        </defs>
      </svg>

      <div ref={chartWrapperRef} className={classNames('flex-grow transition-opacity flex items-center', { 'opacity-50': fetchingNewData })}>
        {
          chartSVGWidth && chartSVGHeight && data &&
          <Chart
            width={chartSVGWidth}
            height={chartSVGHeight}
            padding={{ top: 30, left: 45, right: 0, bottom: 40 }}
            scale={{ x: 'linear', y: scale }}
            minDomain={{ y: Math.min(...prices)*0.98 }}
            maxDomain={{ y: Math.max(...prices)*1.02 }}
            xAxis={{
              tickFormat: timeString,
              tickCount: 12
            }}
            yAxis={{
              tickFormat: (v) => formatNumber(v, { minimumFractionDigits: 2 }),
              tickCount: 8
            }}
          >
            <VictoryArea
              data={data}
              x="timestamp"
              y="price"
              style={{data: areaDataStyle}}
            />
          </Chart>
        }

        {
          !data && <LoadingIndicator className="w-12 h-12 mx-auto" />
        }
      </div>
    </Card>
  );
}

export default HistoricalPriceCard;
