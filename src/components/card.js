import classNames from 'classnames';

function Card({ children, overlay, className }) {
  return(
    <div className={classNames('bg-blue-gray-700 rounded-2xl', className, { 'relative': overlay })}>
      {overlay}

      {children}
    </div>
  );
}

export default Card;
