import { useState, useCallback } from 'react';
import classNames from 'classnames';
import { connectExtension, EXTENSION_UNAVAILABLE } from '../terra/extension';
import { ReactComponent as LoadingIndicator } from '../assets/images/loading-indicator.svg';
import { useWallet } from '../hooks/use_wallet';

function ConnectWalletButton({ className }) {
  const [connecting, setConnecting] = useState(false);
  const { connectWallet } = useWallet();

  const connect = useCallback(async() => {
    setConnecting(true);

    try {
      const wallet = await connectExtension()

      setConnecting(false);
      connectWallet(wallet);
    } catch({ reason }) {
      setConnecting(false);

      if(reason === EXTENSION_UNAVAILABLE ) {
        window.open('https://terra.money/extension');
      }
    }
  }, [connectWallet]);

  return(
    <button className={classNames('bg-yellow text-black py-2 px-6 rounded-lg flex justify-center', className)} onClick={connect} disabled={connecting}>
      {
        connecting ?
          <LoadingIndicator className="w-6 h-6" /> :
          'Connect Wallet'
      }
    </button>
  );
}

export default ConnectWalletButton;
