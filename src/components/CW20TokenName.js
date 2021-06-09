import { useState, useEffect } from 'react';
import { getTokenName } from '../terra/queries';

function CW20TokenName({ address }) {
  const [name, setName] = useState();

  useEffect(() => {
    const fetchName = async () => {
      setName(await getTokenName(address));
    };

    fetchName();
  }, [address]);

  // TODO: Replace with proper loading indicator
  return name ? name : 'Loading...';
}

export default CW20TokenName;
