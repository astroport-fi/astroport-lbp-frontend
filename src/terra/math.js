export function calcPrice({ ustPoolSize, tokenPoolSize, ustWeight, tokenWeight }) {
  return (ustPoolSize/ustWeight) / (tokenPoolSize/tokenWeight);
};
