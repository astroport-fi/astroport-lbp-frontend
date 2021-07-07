import {
  buildSwapFromNativeTokenMsg,
  buildSwapFromContractTokenMsg,
  postMsg,
  estimateFee,
  feeForMaxNativeToken
} from '../../terra/swap';
import terraClient from '../../terra/client';
import { buildPair } from '../test_helpers/factories';
import { Extension, MsgExecuteContract, StdFee, StdTx, Int, Dec, Coins, Coin } from '@terra-money/terra.js';

jest.mock('@terra-money/terra.js', () => {
  const original = jest.requireActual('@terra-money/terra.js');

  return {
    __esModule: true,
    ...original,
    Extension: jest.fn()
  }
});

jest.mock('../../terra/client', () => ({
  __esModule: true,
  default: {
    tx: {
      estimateFee: jest.fn()
    },
    treasury: {
      taxRate: jest.fn(),
      taxCap: jest.fn()
    }
  }
}));

describe('estimateFee', () => {
  it('queries node for estimated fee for given message', () => {
    const mockPromise = jest.fn();
    const msg = jest.fn();

    terraClient.tx.estimateFee.mockReturnValue(mockPromise);

    expect(estimateFee(msg)).toEqual(mockPromise);

    expect(terraClient.tx.estimateFee).toHaveBeenCalledWith(new StdTx([msg], new StdFee(0), []));
  });
});

describe('buildSwapFromNativeTokenMsg', () => {
  it('returns built MsgExecuteContract', () => {
    const pair = buildPair({
      contractAddr: 'terra-pair-addr',
      nativeToken: 'uusd'
    });
    const walletAddress = 'terra-wallet-addr';
    const intAmount = new Int(42 * 1e6);

    const msg = buildSwapFromNativeTokenMsg({ pair, walletAddress, intAmount });

    expect(msg).toEqual(new MsgExecuteContract(
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
            amount: intAmount
          },
          to: walletAddress
        }
      },
      { uusd: intAmount }
    ));
  });
});

describe('buildSwapFromContractTokenMsg', () => {
  it('returns built MsgExecuteContract', () => {
    const pair = buildPair({
      contractAddr: 'terra-pair-addr',
      tokenContractAddr: 'terra-token-addr'
    });
    const walletAddress = 'terra-wallet-addr';
    const intAmount = new Int(7 * 1e6);

    const msg = buildSwapFromContractTokenMsg({ pair, walletAddress, intAmount });

    expect(msg).toEqual(new MsgExecuteContract(
      walletAddress,
      'terra-token-addr',
      {
        send: {
          contract: 'terra-pair-addr',
          amount: intAmount,
          msg: 'eyJzd2FwIjp7fX0='
        }
      }
    ));
  });
});

describe('postMsg', () => {
  let mockPost, msg, fee;

  beforeEach(() => {
    msg = jest.mock();
    fee = jest.mock();

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
      this._postOnceCallback({
        success: true,
        result: {
          txhash: '123ABC'
        }
      });
    });
  }

  function failedPostMock(error) {
    return jest.fn().mockImplementation(function() {
      // Immediately invoke callback,
      // simulating failed message post
      this._postOnceCallback({ success: false, error });
    });
  }

  it('posts message and fee to extension and' +
    'returns a promise that resolves when the transaction posts successfully', async () => {
    mockPost = successfulPostMock();

    const result = await postMsg({ msg, fee });

    expect(result).toEqual({
      txhash: '123ABC'
    });

    // Posts msg to extension
    expect(Extension).toHaveBeenCalledTimes(1);
    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(mockPost).toHaveBeenCalledWith({
      msgs: [msg],
      fee
    });
  });

  it('rejects when extension returns error', () => {
    const mockError = jest.mock();

    mockPost = failedPostMock(mockError);

    return expect(postMsg({ msg, fee })).rejects.toEqual(mockError);

    // Posts msg to extension
    expect(Extension).toHaveBeenCalledTimes(1);
    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(mockPost).toHaveBeenCalledWith({
      msgs: [msg],
      fee
    });
  });
});

describe('feeForMaxNativeToken', () => {
  let pair, walletAddress;

  beforeEach(() => {
    pair = buildPair({
      contractAddr: 'terra-pair-addr',
      tokenContractAddr: 'terra-token-addr',
      nativeToken: 'uusd'
    });
    walletAddress = 'terra-wallet-addr';

    // Stub request for gas estimate
    const gasFee = new StdFee(200000, new Coins([new Coin('uusd', 30000)]));
    terraClient.tx.estimateFee.mockResolvedValue(gasFee);

    // Stub tax rate and cap
    const taxDec = new Dec('0.001');
    terraClient.treasury.taxRate.mockResolvedValue(taxDec);
    terraClient.treasury.taxCap.mockResolvedValue(new Coin('uusd', 1000000 ));
  });

  afterEach(() => {
    // Should have estimated (gas) fee for 1 uusd
    const msg = new MsgExecuteContract(
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
            amount: new Int(1)
          },
          to: walletAddress
        }
      },
      { uusd: new Int(1) }
    );
    expect(terraClient.tx.estimateFee).toHaveBeenCalledWith(new StdTx([msg], new StdFee(0), []))

    // Should have fetched tax rate
    expect(terraClient.treasury.taxRate).toHaveBeenCalledTimes(1);

    // Should have fetched UST tax cap
    expect(terraClient.treasury.taxCap).toHaveBeenCalledTimes(1);
    expect(terraClient.treasury.taxCap).toHaveBeenCalledWith('uusd');
  });

  it('returns fee that includes gas and tax on balance (less fees)', async () => {
    const intBalance = new Int(700 * 1e6);

    const fee = await feeForMaxNativeToken({ pair, walletAddress, intBalance });

    // Returned fee includes original gas amount and fee,
    // plus tax on the balance such that with the tax,
    // the total equals the balance
    // Gas fee: 30000 ( 200000 * 0.15 )
    // Tax: 699271 ( ((700000000 - 30000) / 1.001) * 0.001 )
    expect(fee).toEqual(new StdFee(200000, new Coins([new Coin('uusd', 729271)])));
  });

  it('returns fee with gas and tax cap when tax would exceed cap', async () => {
    const intBalance = new Int(2000 * 1e6); // 2,000 UST

    const fee = await feeForMaxNativeToken({ pair, walletAddress, intBalance });

    // Returned fee includes original gas amount and fee,
    // plus tax cap
    expect(fee).toEqual(new StdFee(200000, new Coins([new Coin('uusd', 30000 + 1000000)])));
  });
});
