import { useState, useEffect } from 'react';
import reportException from '../report_exception';
import { getTokenInfo } from '../terra/queries';
import { ReactComponent as LoadingIndicator } from '../assets/images/loading-indicator.svg';

function CW20TokenName({ address }) {
  const [name, setName] = useState();

  useEffect(() => {
    const fetchName = async () => {
      try {
        const tokenInfo = await getTokenInfo(address);

        setName(tokenInfo.name);
      } catch(e) {
        reportException(e);

        // Fallback to displaying the contract address
        setName(<small>{ address }</small>);
      }
    };

    fetchName();
  }, [address]);

  if(name) {
    return name;
  } else {
    return <LoadingIndicator className="w-5 h-5" />
  }
}

export default CW20TokenName;
