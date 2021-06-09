import { useState, useEffect } from 'react';
import { getTokenName } from '../terra/queries';

function CW20TokenName({ address }) {
  const [name, setName] = useState();

  useEffect(() => {
    const fetchName = async () => {
      try {
        setName(await getTokenName(address));
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
