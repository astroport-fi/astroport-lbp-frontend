import classNames from 'classnames';
import ConnectWalletButton from './connect_wallet_button';
import Card from './card';

function DisconnectedSwapCard({ pair }) {
  // When the pair has a description, this card looks like an About card,
  // but with a Connect Wallet button at the bottom.
  // When the pair does not have a description, it's just a blank card
  // with a vertically centered Connect Wallet button.
  return (
    <Card className="p-6 border border-blue-gray-300 col-span-5 flex flex-col">
      { pair.description &&
        <>
          <h2 className="text-xl font-bold mb-4">
            About
          </h2>

          <p>
            {pair.description}
          </p>
        </>
      }

      <div className={classNames("flex-grow flex mb-8", { 'items-end': pair.description, 'items-center': !pair.description })}>
        <ConnectWalletButton className="w-full" />
      </div>
    </Card>
  );
}

export default DisconnectedSwapCard;
