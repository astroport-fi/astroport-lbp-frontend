import { useState, useEffect } from 'react';
import reportException from '../report_exception';
import { getTokenInfo } from '../terra/queries';
import { ReactComponent as LoadingIndicator } from '../assets/images/loading-indicator.svg';
import { useNetwork } from '../hooks/use_network';

function CW20TokenName({ address }) {
  const [name, setName] = useState();
  const { terraClient } = useNetwork();

  useEffect(() => {
    const fetchName = async () => {
      try {
        const tokenInfo = await getTokenInfo(terraClient, address);

        setName(tokenInfo.name);
      } catch(e) {
        reportException(e);

        // Fallback to displaying the contract address
        setName(<small>{ address }</small>);
      }
    };

    fetchName();
  // terraClient intentionally omitted
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address]);

  if(name) {
    return name;
  } else {
    return <LoadingIndicator className="w-5 h-5" />
  }
}

export default CW20TokenName;
