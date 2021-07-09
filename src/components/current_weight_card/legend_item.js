import classNames from 'classnames';

function LegendItem({ className, color, label }) {
  return (
    <div className={classNames('flex items-center', className)}>
      <div className="w-3 h-1 mr-2" style={{ backgroundColor: color }}></div>

      {label}
    </div>
  );
}

export default LegendItem;
