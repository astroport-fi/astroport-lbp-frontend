import { swapFromUST } from '../../terra/swap';
import terraClient from '../../terra/client';
import { buildPair } from '../test_helpers/factories';
import { Extension, MsgExecuteContract } from '@terra-money/terra.js';

jest.mock('@terra-money/terra.js');

jest.mock('../../terra/client', () => ({
  __esModule: true,
  default: {
    tx: {
      create: jest.fn()
    }
  }
}));

describe('swapFromUST', () => {
  it('estimates fee, makes request via the extension,' +
    'and returns a promise that resolves when the transaction posts successfully', async () => {

    const pair = buildPair();
    const walletAddress = 'terra-wallet-addr';
    const uusdAmount = 42 * 1e6;
    const msg = jest.mock();
    const stdFee = jest.mock();

    MsgExecuteContract.mockReturnValue(msg);

    terraClient.tx.create.mockResolvedValue({ fee: stdFee });

    const mockPost = jest.fn().mockImplementation(function() {
      // Immediately invoke callback,
      // simulating successful message post
      this._postOnceCallback({ success: true });
    });

    Extension.mockImplementation(() => {
      return {
        _postOnceCallback: null,
        once(event, fn) {
          // Store off callback to later be called by mock post() implementation
          this._postOnceCallback=fn;
        },
        post: mockPost
      };
    });

    await swapFromUST({ pair, walletAddress, uusdAmount });

    expect(MsgExecuteContract).toHaveBeenCalledTimes(1);
    expect(MsgExecuteContract).toHaveBeenCalledWith(
      walletAddress,
      'terra-pair-addr',
      {
        swap: {
          offer_asset: {
            info: {
              native_token: {
                denom: 'uusd'
              }
            },
            amount: String(uusdAmount)
          },
          to: walletAddress
        }
      },
      { uusd: uusdAmount }
    );

    expect(terraClient.tx.create).toHaveBeenCalledTimes(1);
    expect(terraClient.tx.create).toHaveBeenCalledWith(walletAddress, {
      msgs: [msg]
    });

    expect(Extension).toHaveBeenCalledTimes(1);
    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(mockPost).toHaveBeenCalledWith({
      msgs: [msg],
      fee: stdFee
    });
  });
});