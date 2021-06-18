import { useState, useEffect } from 'react';
import { getTokenInfo } from '../terra/queries';

function CW20TokenName({ address }) {
  const [name, setName] = useState();

  useEffect(() => {
    const fetchName = async () => {
      try {
        const tokenInfo = await getTokenInfo(address);

        setName(tokenInfo.name);
      } catch(e) {
        // Fallback to displaying the contract address
        setName(<small>{ address }</small>);

        // TODO: Report error?
        console.error(e);
      }
    };

    fetchName();
  }, [address]);

  // TODO: Replace with proper loading indicator
  return name ? name : 'Loading...';
}

export default CW20TokenName;
