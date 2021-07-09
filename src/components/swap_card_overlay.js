import CardOverlay from './card_overlay';
import { transactionDetailsUrl } from '../terra/urls';
import terraClient from '../terra/client';
import classNames from 'classnames';

function SwapCardOverlay({ txState, txHash, waitingDismiss, successDismiss, errorDismiss }) {
  let content, bgColor;

  // eslint-disable-next-line default-case
  switch(txState) {
    case 'waitingForExtension':
      bgColor = 'bg-blue-gray-700';
      content = (<>
        <p className="text-xl animate-pulse">Waiting for extension</p>

        <button type="button" className="mt-4" onClick={waitingDismiss}>Cancel</button>
      </>);
      break;
    case 'success':
      bgColor = 'bg-green-500';
      content = (<>
        <p className="text-xl mb-2">Transaction submitted successfully</p>

        <a href={transactionDetailsUrl(terraClient.config.chainID, txHash)} target="_blank" rel="noreferrer" className="text-sm block">
          {txHash}
        </a>

        <button type="button" className="mt-4" onClick={successDismiss}>Continue</button>
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
    <CardOverlay className={classNames('transition-colors duration-300 ease-out', bgColor)}>
      {content}
    </CardOverlay>
  );
}

export default SwapCardOverlay;
