import './card.css';
import classNames from 'classnames';

function Card({ children, overlay, className, ...rest }) {
  return(
    <div className={classNames('card', className, { 'relative': overlay })} { ...rest }>
      {overlay}

      {children}
    </div>
  );
}

export default Card;
