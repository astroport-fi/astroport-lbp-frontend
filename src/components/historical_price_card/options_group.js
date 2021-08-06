import classNames from 'classnames';

function OptionsGroup({ className, options, onOptionSelect, selected }) {
  return (
    <div className={classNames('flex', className)}>
      {
        options.map(({ value, label }) =>
          <button
            key={value}
            type="button"
            onClick={() => onOptionSelect(value)}
            className={classNames(
              'text-xs text-white text-opacity-60 rounded py-1 w-12 rounded mr-2 tracking-widest',
              {
                'bg-white bg-opacity-10': selected !== value,
                'bg-primary bg-opacity-100 text-opacity-90': selected === value
              }
            )}
          >
            {label}
          </button>
        )
      }
    </div>
  );
}

export default OptionsGroup;
