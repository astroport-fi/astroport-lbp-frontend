import classNames from 'classnames';

function PairDescription({ pair, className }) {
  return(
    <p className={classNames('text-xs font-normal', className)}>
      {pair.description}
    </p>
  );
}

export default PairDescription;
