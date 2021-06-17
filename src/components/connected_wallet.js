function ConnectedWallet({ address }) {
  return (
    <div className="bg-blue-gray-800 py-2 px-6 rounded-lg">
      {address.slice(0,6)}...{address.slice(-6)}
    </div>
  );
}

export default ConnectedWallet;
