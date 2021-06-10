import Card from './card';

function InfoCard({ label, value }) {
  return (
    <Card className="p-5 text-center">
      <h3 className="text-gray-400 text-xs mb-2">{label}</h3>

      <span className="text-2xl">{value}</span>
    </Card>
  );
}

export default InfoCard;
