import Card from './card';

// TODO: Improve loading behavior (e.g. spinner)
function InfoCard({ label, value, loading }) {
  return (
    <Card className="p-5 text-center">
      <h3 className="text-gray-400 text-xs mb-2">{label}</h3>

      <span className="text-2xl">{loading ? 'Loading' : value}</span>
    </Card>
  );
}

export default InfoCard;
