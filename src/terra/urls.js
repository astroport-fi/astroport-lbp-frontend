export function transactionDetailsUrl(chainID, txHash) {
  return `https://finder.terra.money/${chainID}/tx/${txHash}`;
}
