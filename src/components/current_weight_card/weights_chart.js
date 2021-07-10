import { VictoryLine } from 'victory';
import { nativeTokenFromPair, saleAssetFromPair } from '../../helpers/asset_pairs';
import { NATIVE_TOKEN_SYMBOLS } from '../../constants';
import { formatNumber } from '../../helpers/number_formatters';
import LegendItem from './legend_item';
import Chart from '../chart.js';

const NATIVE_TOKEN_COLOR = '#4E6EFF';
const SALE_TOKEN_COLOR = '#F11B44';

function WeightsChart({ pair, saleTokenInfo }) {
  const nativeTokenAssetInfo = nativeTokenFromPair(pair.asset_infos);
  const saleTokenAssetInfo = saleAssetFromPair(pair.asset_infos);

  const durationHours = (pair.end_time - pair.start_time) / 60 ** 2;

  // TODO: at some point, we should probably cut over to days on the x-axis
  let tickInterval;
  if(durationHours <= 24 * 3) {
    // 4 hour interval for sales <= 3 days long
    tickInterval = 4;
  } else if(durationHours <= 24*15) {
    // 24 hour interval for sales > 3 days and <= 15 days long
    tickInterval = 24;
  } else {
    // Whatever interval yields 10 ticks for > 15 day sales
    tickInterval = Math.ceil(durationHours / 10);
  }

  const totalTicks = Math.ceil(durationHours / tickInterval) + 1; // Add 1 for 0

  const nativeTokenData = [
    {
      x: 0,
      y: parseInt(nativeTokenAssetInfo.start_weight)
    },
    {
      x: durationHours,
      y: parseInt(nativeTokenAssetInfo.end_weight)
    }
  ];

  const saleTokenData = [
    {
      x: 0,
      y: parseInt(saleTokenAssetInfo.start_weight)
    },
    {
      x: durationHours,
      y: parseInt(saleTokenAssetInfo.end_weight)
    }
  ];

  const nativeSymbol = NATIVE_TOKEN_SYMBOLS[nativeTokenAssetInfo.info.native_token.denom];
  const saleTokenSymbol = saleTokenInfo.symbol;

  const xAxisTickValues = Array.from(Array(totalTicks), (_, i) => Math.round(i * tickInterval));
  const yAxisTickValues = [0, 25, 50, 75, 100];

  return (
    <div style={{ width: '500px' }} className="p-4">
      <div className="border-b border-white flex justify-between pb-4 items-center">
        <h3 className="font-bold">{nativeSymbol} : {saleTokenSymbol} weight</h3>

        <div className="flex text-xs">
          <LegendItem color={NATIVE_TOKEN_COLOR} label={`${nativeSymbol} weight`} className="mr-4" />
          <LegendItem color={SALE_TOKEN_COLOR} label={`${saleTokenSymbol} weight`} />
        </div>
      </div>

      <Chart
        xAxis={{
          tickValues: xAxisTickValues,
          label: 'hour'
        }}
        yAxis={{
          tickFormat: (v) => formatNumber(v/100, { style: 'percent' }),
          tickValues: yAxisTickValues
        }}
        domainPadding={10}
        padding={{ top: 30, left: 45, right: 0, bottom: 40 }}
        width={500}
        height={250}
      >
        <VictoryLine data={nativeTokenData} style={{ data: { stroke: NATIVE_TOKEN_COLOR, strokeWidth: 2 }}}/>
        <VictoryLine data={saleTokenData}  style={{ data: { stroke: SALE_TOKEN_COLOR, strokeWidth: 2 }}} />
      </Chart>
    </div>
  );
}

export default WeightsChart;
