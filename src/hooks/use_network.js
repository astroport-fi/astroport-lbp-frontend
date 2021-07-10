import { createContext, useContext, useMemo } from 'react';
import { defaultNetwork, networks } from '../config/networks';
import { buildClient } from '../terra/client';
import { useWallet } from './use_wallet';

const NetworkContext = createContext();
const useNetwork = () => useContext(NetworkContext);

const NetworkProvider = ({ children }) => {
  const { walletChainID } = useWallet();

  const network = useMemo(() => {
    if(walletChainID) {
      return Object.values(networks).find(n => n.chainID === walletChainID);
    } else {
      return defaultNetwork;
    }
  }, [walletChainID]);

  const terraClient = useMemo(() => {
    if(network) {
      return buildClient(network);
    }
  }, [network]);

  const value = { terraClient, network };

  if(network) {
    return(
      <NetworkContext.Provider value={value}>
        { children }
      </NetworkContext.Provider>
    );
  } else {
    return(
      <div className="m-10 text-center text-red-500">
        Astroport token sales are not available on the {walletChainID} network
      </div>
    );
  }
};

export { useNetwork, NetworkProvider }
