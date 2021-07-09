import classNames from 'classnames';
import Card from './card';

function ListCard({ title, headings, rows, className }) {
  return(
    <Card className={classNames('pt-4 pb-6', className)}>
      <h2 className="text-xl font-bold mb-4 px-6">{title}</h2>

      <table className="w-full">
        <thead className="bg-blue-gray-600 border-t border-b border-blue-gray-400">
          <tr className="text-gray-400 text-xs text-left">
            {
              headings.map((heading, i) =>
                <th key={i} className={classNames("px-6 py-2 font-medium", { 'w-1/3': i === 0 })}>{heading}</th>
              )
            }
          </tr>
        </thead>

        <tbody>
          {
            rows.map((row) =>
              <tr key={row.key} className="text-sm">
                {
                  row.cols.map((col, i) =>
                    <td key={i} className="px-6 py-3 border-b border-blue-gray-400">{col}</td>
                  )
                }
              </tr>
            )
          }
        </tbody>
      </table>
    </Card>
  );
}

export default ListCard;
