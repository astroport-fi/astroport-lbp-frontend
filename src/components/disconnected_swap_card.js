import classNames from 'classnames';
import ConnectWalletButton from './connect_wallet_button';
import Card from './card';
import PairDescription from './pair_description';

function DisconnectedSwapCard({ pair, className }) {
  // When the pair has a description, this card looks like an About card,
  // but with a Connect Wallet button at the bottom.
  // When the pair does not have a description, it's just a blank card
  // with a vertically centered Connect Wallet button.
  return (
    <Card className={classNames('py-8 px-12 flex flex-col', className)}>
      { pair.description &&
        <>
          <h2 className="font-bold mb-4">
            About
          </h2>

          <PairDescription pair={pair} className="mb-4" />
        </>
      }

      <div className={classNames("flex-grow flex", { 'items-end': pair.description, 'items-center': !pair.description })}>
        <ConnectWalletButton className="w-full" />
      </div>
    </Card>
  );
}

export default DisconnectedSwapCard;
