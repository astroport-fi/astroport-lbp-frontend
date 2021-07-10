import InfoCard from './info_card';
import WeightsCart from './current_weight_card/weights_chart';

function CurrentWeightCard({ loading, pair, saleTokenInfo, currentNativeTokenWeight, currentSaleTokenWeight, ...rest }) {
  return (
    <InfoCard
      label="Current Weight"
      value={`${Math.round(currentNativeTokenWeight)} : ${Math.round(currentSaleTokenWeight)}`}
      loading={loading}
      moreInfo={
        <WeightsCart pair={pair} saleTokenInfo={saleTokenInfo} />
      }
      { ...rest }
    />
  );
}

export default CurrentWeightCard;
