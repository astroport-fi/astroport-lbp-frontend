import Card from './card';
import classNames from 'classnames';
import { NATIVE_TOKEN_SYMBOLS } from '../constants';
import { nativeTokenFromPair } from '../helpers/asset_pairs';
import Chart from './chart';
import { VictoryArea } from 'victory';
import useMeasure from 'react-use-measure';
import { useState, useEffect } from 'react';
import { formatUSD } from '../helpers/number_formatters';

function HistoricalPriceCard({ className, pair, saleTokenInfo, usdPrice, style }) {
  const nativeTokenAssetInfo = nativeTokenFromPair(pair.asset_infos);
  const nativeSymbol = NATIVE_TOKEN_SYMBOLS[nativeTokenAssetInfo.info.native_token.denom];
  const [chartWrapperRef, chartWrapperBounds] = useMeasure();
  const [chartSVGWidth, setChartSVGWidth] = useState();
  const [chartSVGHeight, setChartSVGHeight] = useState();

  // Match aspect ratio of container (which grows to fill the card)
  useEffect(() => {
    if(chartWrapperBounds.width > 0) {
      setChartSVGWidth(chartWrapperBounds.width);
    }

    if(chartWrapperBounds.height > 0) {
      setChartSVGHeight(chartWrapperBounds.height);
    }
  }, [chartWrapperBounds.width, chartWrapperBounds.height]);

  const data = [
    { x: 3, y: 5.05 },
    { x: 6, y: 4.95 },
    { x: 9, y: 4.85 },
    { x: 12, y: 4.95 },
    { x: 15, y: 4.82 },
    { x: 18, y: 4.9 },
    { x: 21, y: 4.82 },
    { x: 24, y: 4.8 }
  ];

  const areaDataStyle = {
    stroke: '#4E6EFF',
    strokeWidth: 3,
    fill: 'url(#fillGradient)'
  }

  return (
    <Card className={classNames('p-6 flex flex-col', className)} style={style}>
      <h2 className="text-lg font-bold">
        {nativeSymbol} / {saleTokenInfo.symbol}
      </h2>

      {
        usdPrice &&
        <h3 className="text-2xl font-bold my-5">
          {formatUSD(usdPrice)}
        </h3>
      }

      <svg className="h-0">
        <defs>
          <linearGradient id="fillGradient"
            x1="0%"
            x2="0%"
            y1="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#4e6eff" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#86a7ff" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      <div ref={chartWrapperRef} className="flex-grow">
        {
          chartSVGWidth && chartSVGHeight &&
          <Chart
            width={chartSVGWidth}
            height={chartSVGHeight}
            padding={{ top: 30, left: 45, right: 0, bottom: 40 }}
            minDomain={4.7}
          >
            <VictoryArea data={data} style={{ data: areaDataStyle }} interpolation={'natural'} />
          </Chart>
        }
      </div>
    </Card>
  );
}

export default HistoricalPriceCard;
