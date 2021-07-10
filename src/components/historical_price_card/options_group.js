import classNames from 'classnames';

function OptionsGroup({ className, options, onOptionSelect, selected }) {
  return (
    <div className={classNames('flex bg-blue-gray-400 px-2 py-1 rounded-lg text-sm', className)}>
      {
        options.map(({ value, label }) =>
          <button
            key={value}
            type="button"
            onClick={() => onOptionSelect(value)}
            className={classNames('rounded py-1 px-2', {'bg-blue-gray-700': selected === value})}
          >
            {label}
          </button>
        )
      }
    </div>
  );
}

export default OptionsGroup;
