import ListCard from './ListCard';
import { saleAssetFromPair } from '../helpers/asset_pairs';
import CW20TokenName from './CW20TokenName';
import { timeAndDateString } from '../helpers/time_formatters';

function ScheduledTokenSalesCard({ pairs }) {
  return(
    <ListCard
      title="Scheduled Token Sales"
      headings={['Asset', 'Starting Time/Date']}
      rows={
        pairs.map((pair) => ({
          key: pair.contract_addr,
          cols: [
            <CW20TokenName address={saleAssetFromPair(pair.asset_infos).info.token.contract_addr} />,
            timeAndDateString(pair.start_time*1000)
          ]
        }))
      }
    />
  )
}

export default ScheduledTokenSalesCard;
