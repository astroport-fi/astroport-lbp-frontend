import { useState, useCallback } from 'react';
import classNames from 'classnames';
import { connectExtension, EXTENSION_UNAVAILABLE } from '../terra/extension';

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
    <button className={classNames('bg-yellow text-black py-2 px-6 rounded-lg', className)} onClick={connect} disabled={connecting}>
      {
        // TODO: Improve connecting indicator (e.g. spinner)
        connecting ? 'Connecting...' : 'Connect Wallet'
      }
    </button>
  );
}

export default ConnectWalletButton;
