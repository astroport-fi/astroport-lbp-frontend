import InfoCard from './info_card';
import MoreInfo from './current_weight_card/more_info';

function CurrentWeightCard({ loading, pair, saleTokenInfo, currentNativeTokenWeight, currentSaleTokenWeight }) {
  return (
    <InfoCard
      label="Current Weight"
      value={`${Math.round(currentNativeTokenWeight)} : ${Math.round(currentSaleTokenWeight)}`}
      loading={loading}
      moreInfo={
        <MoreInfo pair={pair} saleTokenInfo={saleTokenInfo} />
      }
    />
  );
}

export default CurrentWeightCard;
