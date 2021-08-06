import { useEffect, useState } from 'react';
import reportException from '../report_exception';
import ScheduledTokenSalesCard from './scheduled_token_sales_card';
import PreviousTokenSalesCard from './previous_token_sales_card';
import CurrentTokenSale from './current_token_sale';
import { getLBPs, getPairInfo, getTokenInfo } from '../terra/queries';
import { saleAssetFromPair } from '../helpers/asset_pairs';
import ConnectWalletButton from './connect_wallet_button';
import ConnectedWallet from './connected_wallet';
import { ReactComponent as LoadingIndicator } from '../assets/images/loading-indicator.svg';
import { useWallet } from '../hooks/use_wallet';
import { useNetwork } from '../hooks/use_network';
import { ReactComponent as Logo } from '../assets/images/logo.svg';

function sortLBPsAsc(lbps) {
  return lbps.sort((a, b) => a.start_time - b.start_time);
}

function sortLBPsDesc(lbps) {
  return lbps.sort((a, b) => b.start_time - a.start_time);
}

function TokenSales() {
  const [loading, setLoading] = useState(true);
  const [errorLoadingData, setErrorLoadingData] = useState(false);
  const [scheduledPairs, setScheduledPairs] = useState([]);
  const [previousPairs, setPreviousPairs] = useState([]);
  const [currentPair, setCurrentPair] = useState();
  const [saleTokenInfo, setSaleTokenInfo] = useState();
  const { walletAddress } = useWallet();
  const { terraClient, network } = useNetwork();

  useEffect(() => {
    const fetchLBPs = async () => {
      try {
        // We only care about permitted/whitelisted pairs
        const lbps = (await getLBPs(terraClient, network.factoryContractAddress)).filter(
          lbp => network.allowedPairContracts.includes(lbp.contract_addr)
        );
        const currentTime = Math.floor(Date.now() / 1000);

        setScheduledPairs(sortLBPsAsc(
          lbps.filter((lbp) => lbp.start_time > currentTime)
        ));

        setPreviousPairs(sortLBPsDesc(
          lbps.filter((lbp) => lbp.end_time <= currentTime)
        ));

        const currentPair = lbps.find(
          (lbp) => lbp.start_time <= currentTime && lbp.end_time > currentTime
        );

        // If there's an ongoing sale,
        // fetch the detailed info for the pair
        // and the sale token info (name, symbol, decimals, etc.)
        if(currentPair) {
          setCurrentPair(
            await getPairInfo(terraClient, currentPair.contract_addr)
          );

          const saleTokenAddress = saleAssetFromPair(currentPair.asset_infos).info.token.contract_addr;

          setSaleTokenInfo(
            await getTokenInfo(terraClient, saleTokenAddress)
          );
        } else {
          setCurrentPair();
        }
      } catch(e) {
        reportException(e);
        setErrorLoadingData(true);
      } finally {
        setLoading(false);
      }
    };

    fetchLBPs();
  }, [network, terraClient]);

  if(loading) {
    return(
      <div className="w-screen h-screen flex items-center justify-center">
        <LoadingIndicator className="w-20 h-20" />
      </div>
    );
  } else if(errorLoadingData) {
    return <div className="m-10 text-center text-red-500">Error connecting to node</div>;
  } else {
    return (
      <div className="container mx-auto">
        <div className="flex justify-between mt-6 mb-12">
          <Logo className="h-8" />

          {
            walletAddress ?
              <ConnectedWallet />
              :
              <ConnectWalletButton />
          }
        </div>

        {
          currentPair &&
            <div className="flex justify-between items-center">
              <h1 className="text-xl font-bold">
                {saleTokenInfo.name} Token Sale
              </h1>
            </div>
        }

        {currentPair && <CurrentTokenSale pair={currentPair} saleTokenInfo={saleTokenInfo} />}
        {scheduledPairs.length > 0 && <ScheduledTokenSalesCard pairs={scheduledPairs} className="my-8" />}
        {previousPairs.length > 0 && <PreviousTokenSalesCard pairs={previousPairs} className="my-8" />}
      </div>
    );
  }
}

export default TokenSales;
