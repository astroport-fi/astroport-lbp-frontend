import { transactionDetailsUrl } from '../../terra/urls';
import classNames from 'classnames';

function TxHash({ chainID, txHash, className }) {
  return (
    <div className={classNames('flex flex-col', className)}>
      <a href={transactionDetailsUrl(chainID, txHash)} target="_blank" rel="noreferrer" className="text-sm">
        {txHash}
      </a>

      <small className="text-xs opacity-60">Tx Hash</small>
    </div>
  );
}

export default TxHash;
