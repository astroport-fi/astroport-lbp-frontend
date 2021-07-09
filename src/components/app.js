import { useEffect, useState } from 'react';
import ScheduledTokenSalesCard from './scheduled_token_sales_card';
import PreviousTokenSalesCard from './previous_token_sales_card';
import CurrentTokenSale from './current_token_sale';
import { getLBPs, getPairInfo, getTokenInfo } from '../terra/queries';
import { saleAssetFromPair } from '../helpers/asset_pairs';
import ConnectWalletButton from './connect_wallet_button';
import ConnectedWallet from './connected_wallet';
import { connectExtension } from '../terra/extension';
import { ReactComponent as LoadingIndicator } from '../assets/images/loading-indicator.svg';

const EXTENSION_LOCAL_STORAGE_KEY = 'terraStationExtensionPreviouslyConnected';

function App() {
  const [loading, setLoading] = useState(true);
  const [errorLoadingData, setErrorLoadingData] = useState(false);
  const [scheduledPairs, setScheduledPairs] = useState([]);
  const [previousPairs, setPreviousPairs] = useState([]);
  const [currentPair, setCurrentPair] = useState();
  const [saleTokenInfo, setSaleTokenInfo] = useState();
  const [walletAddress, setWalletAddress] = useState();

  // Automatically reconnect extension if it was connected before
  // Wait a beat because the extension isn't always ready immediately
  useEffect(() => {
    const timer = setTimeout(() => {
      if(window.localStorage.getItem(EXTENSION_LOCAL_STORAGE_KEY)) {
        connectExtension().then(({ address }) => setWalletAddress(address));
      }
    }, 10);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchLBPs = async () => {
      try {
        const lbps = await getLBPs();

        lbps.sort((a, b) => a.start_time - b.start_time);

        const currentTime = Math.floor(Date.now() / 1000);

        setScheduledPairs(lbps.filter((lbp) => lbp.start_time > currentTime));
        setPreviousPairs(lbps.filter((lbp) => lbp.end_time <= currentTime));

        const currentPair = lbps.find(
          (lbp) => lbp.start_time <= currentTime && lbp.end_time > currentTime
        );

        // If there's an ongoing sale,
        // fetch the detailed info for the pair
        // and the sale token info (name, symbol, decimals, etc.)
        if(currentPair) {
          setCurrentPair(
            await getPairInfo(currentPair.contract_addr)
          );

          const saleTokenAddress = saleAssetFromPair(currentPair.asset_infos).info.token.contract_addr;

          setSaleTokenInfo(
            await getTokenInfo(saleTokenAddress)
          );
        }
      } catch(e) {
        // TODO: Report error
        // TODO: Some kind of retry behavior?
        console.error(e);
        setErrorLoadingData(true);
      } finally {
        setLoading(false);
      }
    };

    fetchLBPs();
  }, []);

  function walletConnected({ address }) {
    setWalletAddress(address);
    window.localStorage.setItem(EXTENSION_LOCAL_STORAGE_KEY, true);
  }

  function disconnectWallet() {
    setWalletAddress();
    window.localStorage.removeItem(EXTENSION_LOCAL_STORAGE_KEY);
  }

  if(loading) {
    return(
      <div className="m-10 text-center">
        <LoadingIndicator className="w-20 h-20 inline" />
      </div>
    );
  } else if(errorLoadingData) {
    return <div className="m-10 text-center text-red-500">Error connecting to node</div>;
  } else {
    return (
      <div className="container mx-auto mt-10">
        {
          currentPair &&
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">
                {saleTokenInfo.name} Token Sale
              </h1>

              {
                walletAddress ?
                  <ConnectedWallet address={walletAddress} onDisconnect={disconnectWallet} />
                  :
                  <ConnectWalletButton onConnect={walletConnected} />
              }
            </div>
        }

        {currentPair && <CurrentTokenSale pair={currentPair} saleTokenInfo={saleTokenInfo} walletAddress={walletAddress} onWalletConnect={walletConnected} />}
        {scheduledPairs.length > 0 && <ScheduledTokenSalesCard pairs={scheduledPairs} className="my-8" />}
        {previousPairs.length > 0 && <PreviousTokenSalesCard pairs={previousPairs} className="my-8" />}
      </div>
    );
  }
}

export default App;
