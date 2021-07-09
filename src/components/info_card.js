import Card from './card';
import { ReactComponent as LoadingIndicator } from '../assets/images/loading-indicator.svg';

function InfoCard({ label, value, loading }) {
  return (
    <Card className="p-5 text-center">
      <h3 className="text-gray-400 text-xs mb-2">{label}</h3>

      <span className="text-2xl">
        {
          loading ?
            <div className="flex justify-center">
              <LoadingIndicator className="w-8 h-8" />
            </div> :
            value
        }
      </span>
    </Card>
  );
}

export default InfoCard;
