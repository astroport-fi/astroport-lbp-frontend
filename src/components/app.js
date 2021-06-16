import { useEffect, useState } from 'react';
import ScheduledTokenSalesCard from './scheduled_token_sales_card';
import PreviousTokenSalesCard from './previous_token_sales_card';
import CurrentTokenSale from './current_token_sale';
import { getLBPs } from '../terra/queries';
import CW20TokenName from './cw20_token_name';
import { saleAssetFromPair } from '../helpers/asset_pairs';

function App() {
  const [loading, setLoading] = useState(true);
  const [scheduledPairs, setScheduledPairs] = useState([]);
  const [previousPairs, setPreviousPairs] = useState([]);
  const [currentPair, setCurrentPair] = useState();

  useEffect(() => {
    const fetchLBPs = async () => {
      const lbps = await getLBPs();

      lbps.sort((a, b) => a.start_time - b.start_time);

      const currentTime = Math.floor(Date.now() / 1000);

      setScheduledPairs(lbps.filter((lbp) => lbp.start_time > currentTime));
      setPreviousPairs(lbps.filter((lbp) => lbp.end_time <= currentTime));
      setCurrentPair(lbps.find((lbp) => lbp.start_time <= currentTime && lbp.end_time > currentTime));
      setLoading(false);
    };

    fetchLBPs();
  }, []);

  if(loading) {
    // TODO: Proper spinner/loading indicator
    return <div className="m-10 text-center">Loading...</div>;
  } else {
    return (
      <div className="container mx-auto mt-10">
        <h1 className="text-lg">
          <CW20TokenName address={saleAssetFromPair(currentPair.asset_infos).info.token.contract_addr}/> Token Sale
        </h1>

        {currentPair && <CurrentTokenSale pair={currentPair}/>}
        {scheduledPairs.length > 0 && <ScheduledTokenSalesCard pairs={scheduledPairs}/>}
        {previousPairs.length > 0 && <PreviousTokenSalesCard pairs={previousPairs} className="mt-2"/>}
      </div>
    );
  }
}

export default App;
