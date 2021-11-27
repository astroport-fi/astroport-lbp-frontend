import './swap_card_overlay.css';
import CardOverlay from './card_overlay';
import { useNetwork } from '../hooks/use_network';
import { ReactComponent as WaitingIndicator } from '../assets/images/waiting-indicator.svg';
import TxHash from './swap_card/tx_hash';

function SwapCardOverlay({ txState, txHash, waitingDismiss, completeDismiss, errorDismiss }) {
  let content;
  const { terraClient } = useNetwork();

  // eslint-disable-next-line default-case
  switch(txState) {
    case 'waitingForExtension':
      content = <>
        <h3 className="animate-pulse">Waiting for Terra Station</h3>

        <button type="button" onClick={waitingDismiss}>Cancel</button>
      </>;
      break;
    case 'pending':
      content = <>
        <h3>Please Wait</h3>

        <WaitingIndicator className="mx-auto my-6 w-12 h-12" />

        <TxHash chainID={terraClient.config.chainID} txHash={txHash} className="text-center" />
      </>;
      break;
    case 'complete':
      content = <>
        <div className="text-center">
          <h3 className="mb-5">Transaction Complete</h3>

          <TxHash chainID={terraClient.config.chainID} txHash={txHash} />
        </div>

        <button type="button" onClick={completeDismiss}>Continue</button>
      </>;
      break;
    case 'error':
      content = <>
        <h3>Error submitting transaction</h3>

        <button type="button" onClick={errorDismiss}>Continue</button>
      </>;
      break;
  }

  return (
    <CardOverlay className={`swap-card-overlay swap-card-overlay--${txState}`}>
      {content}
    </CardOverlay>
  );
}

export default SwapCardOverlay;
