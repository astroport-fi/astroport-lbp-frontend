import { useEffect, useState } from 'react';
import ScheduledTokenSalesCard from './scheduled_token_sales_card';
import PreviousTokenSalesCard from './previous_token_sales_card';
import CurrentTokenSale from './current_token_sale';
import { getLBPs } from '../terra/queries';

function TokenSales() {
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
    };

    fetchLBPs();
  }, []);

  return (
    <>
      {currentPair && <CurrentTokenSale pair={currentPair} />}
      {scheduledPairs.length > 0 && <ScheduledTokenSalesCard pairs={scheduledPairs} />}
      {previousPairs.length > 0 && <PreviousTokenSalesCard pairs={previousPairs} className="mt-2" />}
    </>
  );
}

export default TokenSales;
