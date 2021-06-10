import { saleAssetFromPair } from '../helpers/asset_pairs';
import CW20TokenName from './cw20_token_name';
import InfoCard from './info_card';

function CurrentTokenSale({ pair }) {
  return (
    <>
      <h1 className="text-lg">
        <CW20TokenName address={saleAssetFromPair(pair.asset_infos).info.token.contract_addr} /> Token Sale
      </h1>

      <div className="grid grid-cols-4 gap-6 my-6">
        <InfoCard label="Price" value="$10.00" />
        <InfoCard label="Coins Remaining" value="1.500.000" />
        <InfoCard label="Time Remaining" value="1d : 22h : 25m" />
        <InfoCard label="Current Weight" value="80 : 20" />
      </div>
    </>
  );
}

export default CurrentTokenSale;
