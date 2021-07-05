import { swapFromNativeToken, swapFromContractToken } from '../../terra/swap';
import terraClient from '../../terra/client';
import { buildPair } from '../test_helpers/factories';
import { Extension, MsgExecuteContract, StdFee, StdTx, Int } from '@terra-money/terra.js';

jest.mock('@terra-money/terra.js');

jest.mock('../../terra/client', () => ({
  __esModule: true,
  default: {
    tx: {
      estimateFee: jest.fn()
    }
  }
}));

let mockPost;

beforeEach(() => {
  MsgExecuteContract.mockClear();
  StdTx.mockClear();
  Extension.mockClear();

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
});

function successfulPostMock() {
  return jest.fn().mockImplementation(function() {
    // Immediately invoke callback,
    // simulating successful message post
    this._postOnceCallback({ success: true });
  });
}

function failedPostMock(error) {
  return jest.fn().mockImplementation(function() {
    // Immediately invoke callback,
    // simulating failed message post
    this._postOnceCallback({ success: false, error });
  });
}

describe('swapFromNativeToken', () => {
  it('estimates fee, makes request via the extension,' +
    'and returns a promise that resolves when the transaction posts successfully', async () => {
    const pair = buildPair({
      contractAddr: 'terra-pair-addr',
      nativeToken: 'uusd'
    });
    const walletAddress = 'terra-wallet-addr';
    const nativeIntAmount = new Int(42 * 1e6);
    const mockMsg = jest.mock();
    const mockStdFee = jest.mock();
    const mockStdTx = jest.mock();

    MsgExecuteContract.mockReturnValue(mockMsg);
    StdTx.mockReturnValue(mockStdTx);

    terraClient.tx.estimateFee.mockResolvedValue(mockStdFee);

    mockPost = successfulPostMock();

    await swapFromNativeToken({ pair, walletAddress, nativeIntAmount });

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
            amount: nativeIntAmount
          },
          to: walletAddress
        }
      },
      { uusd: nativeIntAmount }
    );

    // Builds a tx to use for fee estimation
    expect(StdTx).toHaveBeenCalledTimes(1);
    expect(StdTx).toHaveBeenCalledWith([mockMsg], expect.any(StdFee), []);

    // Estimates fee
    expect(terraClient.tx.estimateFee).toHaveBeenCalledTimes(1);
    expect(terraClient.tx.estimateFee).toHaveBeenCalledWith(mockStdTx);

    // Posts msg to extension
    expect(Extension).toHaveBeenCalledTimes(1);
    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(mockPost).toHaveBeenCalledWith({
      msgs: [mockMsg],
      fee: mockStdFee
    });
  });

  it('rejects when extension returns error', () => {
    const mockError = jest.mock();

    mockPost = failedPostMock(mockError);

    const pair = buildPair()
    const walletAddress = 'terra-wallet-addr';
    const nativeIntAmount = new Int(42 * 1e6);

    return expect(swapFromNativeToken({ pair, walletAddress, nativeIntAmount })).rejects.toEqual(mockError);
  });
});

describe('swapFromContractToken', () => {
  it('estimates fee, makes request via the extension,' +
    'and returns a promise that resolves when the transaction posts successfully', async () => {
    const pair = buildPair({
      contractAddr: 'terra-pair-addr',
      tokenContractAddr: 'terra-token-addr'
    });
    const walletAddress = 'terra-wallet-addr';
    const tokenIntAmount = new Int(7 * 1e6);
    const mockMsg = jest.mock();
    const mockStdFee = jest.mock();
    const mockStdTx = jest.mock();

    MsgExecuteContract.mockReturnValue(mockMsg);
    StdTx.mockReturnValue(mockStdTx);

    terraClient.tx.estimateFee.mockResolvedValue(mockStdFee);

    mockPost = successfulPostMock();

    await swapFromContractToken({ pair, walletAddress, tokenIntAmount });

    expect(MsgExecuteContract).toHaveBeenCalledTimes(1);
    expect(MsgExecuteContract).toHaveBeenCalledWith(
      walletAddress,
      'terra-token-addr',
      {
        send: {
          contract: 'terra-pair-addr',
          amount: tokenIntAmount,
          msg: 'eyJzd2FwIjp7fX0='
        }
      }
    );

    // Builds a tx to use for fee estimation
    expect(StdTx).toHaveBeenCalledTimes(1);
    expect(StdTx).toHaveBeenCalledWith([mockMsg], expect.any(StdFee), []);

    // Estimates fee
    expect(terraClient.tx.estimateFee).toHaveBeenCalledTimes(1);
    expect(terraClient.tx.estimateFee).toHaveBeenCalledWith(mockStdTx);

    // Posts msg to extension
    expect(Extension).toHaveBeenCalledTimes(1);
    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(mockPost).toHaveBeenCalledWith({
      msgs: [mockMsg],
      fee: mockStdFee
    });
  });

  it('rejects when extension returns error', () => {
    const mockError = jest.mock();

    mockPost = failedPostMock(mockError);

    const pair = buildPair()
    const walletAddress = 'terra-wallet-addr';
    const tokenIntAmount = new Int(7 * 1e6);

    return expect(swapFromContractToken({ pair, walletAddress, tokenIntAmount })).rejects.toEqual(mockError);
  });
});