function ConnectedWallet({ address, onDisconnect }) {
  return (
    <div className="bg-blue-gray-800 py-2 px-6 rounded-lg">
      {address.slice(0,6)}...{address.slice(-6)}

      <button type="button" className="ml-4 opacity-60" onClick={onDisconnect} aria-label="Disconnect wallet">
        &times;
      </button>
    </div>
  );
}

export default ConnectedWallet;
