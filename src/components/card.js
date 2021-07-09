import classNames from 'classnames';

function Card({ children, overlay, className, ...rest }) {
  return(
    <div className={classNames('bg-blue-gray-700 rounded-2xl', className, { 'relative': overlay })} { ...rest }>
      {overlay}

      {children}
    </div>
  );
}

export default Card;
