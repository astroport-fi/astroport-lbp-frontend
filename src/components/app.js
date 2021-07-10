import { WalletProvider } from '../hooks/use_wallet';
import { NetworkProvider } from '../hooks/use_network';
import TokenSales from './token_sales';

function App() {
  return(
    <WalletProvider>
      <NetworkProvider>
        <TokenSales />
      </NetworkProvider>
    </WalletProvider>
  ) ;
}

export default App;
