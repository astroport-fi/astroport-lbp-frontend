import ListCard from './list_card';
import { saleAssetFromPair } from '../helpers/asset_pairs';
import CW20TokenName from './cw20_token_name';
import { dateString } from '../helpers/time_formatters';

function PreviousTokenSalesCard({ pairs }) {
  return(
    <ListCard
      className="mt-8"
      title="Previous Token Sales"
      headings={['Asset', 'Period']}
      rows={
        pairs.map((pair) => ({
          key: pair.contract_addr,
          cols: [
            <CW20TokenName address={saleAssetFromPair(pair.asset_infos).info.token.contract_addr} />,
            `${dateString(new Date(pair.start_time*1000))} - ${dateString(new Date(pair.end_time*1000))}`
          ]
        }))
      }
    />
  )
}

export default PreviousTokenSalesCard;
