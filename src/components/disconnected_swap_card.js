import classNames from 'classnames';
import ConnectWalletButton from './connect_wallet_button';
import Card from './card';

function DisconnectedSwapCard({ pair }) {
  // When the pair has a description, this card looks like an About card,
  // but with a Connect Wallet button at the bottom.
  // When the pair does not have a description, it's just a blank card
  // with a vertically centered Connect Wallet button.
  return (
    <Card className="py-6 px-5 col-span-5 flex flex-col">
      { pair.description &&
        <>
          <h2 className="font-bold mb-8">
            About
          </h2>

          <p className="text-xs opacity-50">
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
