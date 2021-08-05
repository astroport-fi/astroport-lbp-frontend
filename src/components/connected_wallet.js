import { useWallet } from '../hooks/use_wallet';
import { useNetwork } from '../hooks/use_network';
import { networks } from '../config/networks';

function ConnectedWallet() {
  const { walletAddress, disconnectWallet } = useWallet();
  const { network } = useNetwork();

  return (
    <div className="flex items-center">
      {
        network.chainID !== networks.mainnet.chainID &&
        <small className="mr-4 bg-yellow-300 text-black font-bold px-2 py-1 rounded">{network.chainID}</small>
      }

      <div className="text-white bg-white bg-opacity-10 text-opacity-90 py-2 px-6 rounded-lg">
        {walletAddress.slice(0,6)}...{walletAddress.slice(-6)}

        <button type="button" className="ml-4 opacity-60 hover:opacity-100 transition-opacity" onClick={disconnectWallet} aria-label="Disconnect wallet">
          &times;
        </button>
      </div>
    </div>
  );
}

export default ConnectedWallet;
