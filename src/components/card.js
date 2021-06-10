import classNames from 'classnames';

function Card({ children, className }) {
  return(
    <div className={classNames('bg-blue-gray-700 rounded-2xl', className)}>
      {children}
    </div>
  );
}

export default Card;
