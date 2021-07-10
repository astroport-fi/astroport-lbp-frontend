import 'animate.css/source/_vars.css';
import 'animate.css/source/_base.css';
import 'animate.css/source/fading_entrances/fadeIn.css';
import classNames from 'classnames';

function Popover({ children }) {
  const commonClasses = ['z-50', 'animated', 'fadeIn', 'faster', 'cursor-default', 'backdrop-filter', 'backdrop-blur'];
  const bgOpacityClass = 'bg-opacity-70';

  return (
    <>
      {/* Popover triangle */}
      <div className={classNames('inset-x-0 overflow-hidden absolute flex justify-center opacity-80', commonClasses)}>
        <div className={classNames('h-5 w-5 bg-blue-gray-700 rotate-45 transform origin-bottom-left', bgOpacityClass)}></div>
      </div>

      {/* Popover wrapper, right-aligned (only current needed use-case) */}
      <div className={classNames('absolute bg-blue-gray-700 mt-4 p-2 rounded-lg shadow-xl min-w-full right-0', bgOpacityClass, commonClasses)}>
        {children}
      </div>
    </>
  );
}

export default Popover;
