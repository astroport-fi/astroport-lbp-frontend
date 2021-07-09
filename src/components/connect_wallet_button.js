import { useState, useCallback } from 'react';
import classNames from 'classnames';
import { connectExtension, EXTENSION_UNAVAILABLE } from '../terra/extension';
import { ReactComponent as LoadingIndicator } from '../assets/images/loading-indicator.svg';

function ConnectWalletButton({ onConnect, className }) {
  const [connecting, setConnecting] = useState(false);

  const connect = useCallback(async() => {
    setConnecting(true);

    try {
      const wallet = await connectExtension()

      setConnecting(false);
      onConnect(wallet);
    } catch({ reason }) {
      setConnecting(false);

      if(reason === EXTENSION_UNAVAILABLE ) {
        window.open('https://terra.money/extension');
      }
    }
  }, [onConnect]);

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
