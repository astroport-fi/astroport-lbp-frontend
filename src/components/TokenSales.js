import { useEffect, useState } from 'react';
import ScheduledTokenSalesCard from './ScheduledTokenSalesCard';
import PreviousTokenSalesCard from './PreviousTokenSalesCard';
import { getLBPs } from '../terra/queries';

function TokenSales() {
  const [scheduledPairs, setScheduledPairs] = useState([]);
  const [previousPairs, setPreviousPairs] = useState([]);

  useEffect(() => {
    const fetchLBPs = async () => {
      const lbps = await getLBPs();

      lbps.sort((a, b) => a.start_time - b.start_time);

      const currentTime = Math.floor(Date.now() / 1000);

      setScheduledPairs(lbps.filter((lbp) => lbp.start_time > currentTime));
      setPreviousPairs(lbps.filter((lbp) => lbp.end_time <= currentTime));
    };

    fetchLBPs();
  }, []);

  return (
    <>
      <h1 className="text-lg mb-6">Foo Token Sale</h1>
      {scheduledPairs.length > 0 && <ScheduledTokenSalesCard pairs={scheduledPairs} />}
      {previousPairs.length > 0 && <PreviousTokenSalesCard pairs={previousPairs} className="mt-2" />}
    </>
  );
}

export default TokenSales;
