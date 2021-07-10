import { createContext, useState, useContext, useEffect } from 'react';
import { connectExtension } from '../terra/extension';

const WalletContext = createContext();
const useWallet = () => useContext(WalletContext);

const EXTENSION_LOCAL_STORAGE_KEY = 'terraStationExtensionPreviouslyConnected';

const WalletProvider = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState();
  const [walletChainID, setWalletChainID] = useState();

  function connectWallet({ address, chainID }) {
    setWalletAddress(address);
    setWalletChainID(chainID);
    window.localStorage.setItem(EXTENSION_LOCAL_STORAGE_KEY, true);
  }

  function disconnectWallet() {
    setWalletAddress();
    window.localStorage.removeItem(EXTENSION_LOCAL_STORAGE_KEY);
  }

  const value = { walletAddress, walletChainID, disconnectWallet, connectWallet };

  // Automatically reconnect extension if it was connected before
  // Wait a beat because the extension isn't always ready immediately
  useEffect(() => {
    const timer = setTimeout(async () => {
      if(window.localStorage.getItem(EXTENSION_LOCAL_STORAGE_KEY)) {
        try {
          const { address, chainID } = await connectExtension();
          setWalletAddress(address);
          setWalletChainID(chainID);
        } catch {
          // If we fail to reconnect to the extension,
          // don't try to reconnect again automatically in the future
          window.localStorage.removeItem(EXTENSION_LOCAL_STORAGE_KEY);
        }
      }
    }, 10);

    return () => clearTimeout(timer);
  }, []);

  return(
    <WalletContext.Provider value={value}>
      { children }
    </WalletContext.Provider>
  );
};

export { useWallet, WalletProvider }
