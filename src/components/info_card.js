import { useState } from 'react';
import Card from './card';
import { ReactComponent as LoadingIndicator } from '../assets/images/loading-indicator.svg';
import { ReactComponent as InfoIcon } from '../assets/images/info.svg';
import classNames from 'classnames';
import Popover from './info_card/popover';

function InfoCard({ label, value, loading, moreInfo, className }) {
  const [showMoreInfo, setShowMoreInfo] = useState(false);

  return (
    <Card
      className={classNames('relative', { 'cursor-pointer': moreInfo }, className)}
      onMouseEnter={() => setShowMoreInfo(true)}
      onMouseLeave={() => setShowMoreInfo(false)}
    >
      <div className="px-5 pt-4 pb-5 text-center">
        <h3 className="text-secondary mb-2 flex items-center justify-center">
          {label}
          {
            !loading && moreInfo &&
            <InfoIcon className="text-white h-4 w-4 ml-2 cursor-pointer" />
          }
        </h3>

        <span className="text-lg">
          {
            loading ?
              <div className="flex justify-center">
                <LoadingIndicator className="w-8 h-8" />
              </div> :
              value
          }
        </span>
      </div>

      {
        !loading && showMoreInfo && moreInfo &&
        <Popover>{moreInfo}</Popover>
      }
    </Card>
  );
}

export default InfoCard;
