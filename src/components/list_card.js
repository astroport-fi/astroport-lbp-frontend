import classNames from 'classnames';
import Card from './card';

function ListCard({ title, headings, rows, className }) {
  return(
    <Card className={classNames('px-5 py-4', className)}>
      <h2 className="font-bold mb-8">{title}</h2>

      <table className="w-full">
        <thead className="bg-white bg-opacity-10">
          <tr className="text-white text-opacity-50 text-xs text-left">
            {
              headings.map((heading, i) =>
                <th key={i} className={classNames("px-3 py-2 font-medium", { 'w-1/3': i === 0 })}>{heading}</th>
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
                    <td key={i} className="px-3 py-2">{col}</td>
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
