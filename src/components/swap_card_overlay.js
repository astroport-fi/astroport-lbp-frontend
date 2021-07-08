import CardOverlay from './card_overlay';
import { transactionDetailsUrl } from '../terra/urls';
import terraClient from '../terra/client';

function SwapCardOverlay({ txState, txHash, waitingDismiss, successDismiss, errorDismiss }) {
  // eslint-disable-next-line default-case
  switch(txState) {
    case 'waitingForExtension':
      return (
        <CardOverlay className="bg-blue-gray-700">
          <p className="text-xl">Waiting for extension...</p>

          <button type="button" className="mt-4" onClick={waitingDismiss}>Cancel</button>
        </CardOverlay>
      );
    case 'success':
      return (
        <CardOverlay className="bg-green-500">
          <p className="text-xl mb-2">Transaction submitted successfully</p>

          <a href={transactionDetailsUrl(terraClient.config.chainID, txHash)} target="_blank" rel="noreferrer" className="text-sm block">
            {txHash}
          </a>

          <button type="button" className="mt-4" onClick={successDismiss}>Continue</button>
        </CardOverlay>
      );
    case 'error':
      return (
        <CardOverlay className="bg-red-500">
          <p className="text-xl">Error submitting transaction</p>

          <button type="button" className="mt-4" onClick={errorDismiss}>Continue</button>
        </CardOverlay>
      );
  }
}

export default SwapCardOverlay;
