import classNames from 'classnames';

function CardOverlay({ className, children }) {
  return (
    <div className={classNames('absolute inset-px rounded-xl z-50', className)}>
      {children}
    </div>
  );
}

export default CardOverlay;
