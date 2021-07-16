import CardOverlay from './card_overlay';
import classNames from 'classnames';
import { useNetwork } from '../hooks/use_network';
import { ReactComponent as WaitingIndicator } from '../assets/images/waiting-indicator.svg';
import TxHash from './swap_card/tx_hash';

function SwapCardOverlay({ txState, txHash, waitingDismiss, completeDismiss, errorDismiss }) {
  let content, bgColor;
  const { terraClient } = useNetwork();

  // eslint-disable-next-line default-case
  switch(txState) {
    case 'waitingForExtension':
      bgColor = 'bg-blue-gray-700';
      content = (<>
        <p className="text-xl animate-pulse">Waiting for extension</p>

        <button type="button" className="mt-4" onClick={waitingDismiss}>Cancel</button>
      </>);
      break;
    case 'pending':
      bgColor = 'bg-blue-800';
      content = (<>
        <p className="text-xl">Please Wait</p>

        <WaitingIndicator className="mx-auto my-6 w-12 h-12" />

        <TxHash chainID={terraClient.config.chainID} txHash={txHash} />
      </>);
      break;
    case 'complete':
      bgColor = 'bg-green-500';
      content = (<>
        <p className="text-xl">Transaction Complete</p>

        <TxHash chainID={terraClient.config.chainID} txHash={txHash} className="my-6" />

        <button type="button" onClick={completeDismiss}>Continue</button>
      </>);
      break;
    case 'error':
      bgColor = 'bg-red-500';
      content = (<>
        <p className="text-xl">Error submitting transaction</p>

        <button type="button" className="mt-4" onClick={errorDismiss}>Continue</button>
      </>);
      break;
  }

  return (
    <CardOverlay className={classNames('backdrop-filter backdrop-blur-sm transition-colors duration-300 ease-out', bgColor)}>
      {content}
    </CardOverlay>
  );
}

export default SwapCardOverlay;
