import ListCard from './list_card';
import { saleAssetFromPair } from '../helpers/asset_pairs';
import CW20TokenName from './cw20_token_name';
import { timeAndDateString } from '../helpers/time_formatters';

function ScheduledTokenSalesCard({ pairs }) {
  return(
    <ListCard
      title="Scheduled Token Sales"
      headings={['Asset', 'Starting Date/Time']}
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
