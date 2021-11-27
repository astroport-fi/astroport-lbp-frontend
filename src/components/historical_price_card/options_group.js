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
              'historical-price-card__option-button',
              {
                'historical-price-card__option-button--inactive': selected !== value,
                'historical-price-card__option-button--active': selected === value
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
