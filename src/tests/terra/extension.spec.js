import { connectExtension, EXTENSION_UNAVAILABLE } from '../../terra/extension';
import { Extension } from '@terra-money/terra.js';
import { mockSuccessfullyConnectedExtension } from '../test_helpers/terra-js_mocks';

jest.mock('@terra-money/terra.js');

describe('connectExtension', () => {
  it('rejects when extension is unavailable', () => {
    Extension.mockImplementation(() => {
      return {
        isAvailable: false
      }
    });

    expect(connectExtension()).rejects.toEqual({ reason: EXTENSION_UNAVAILABLE });
  });

  it('resolves with wallet once connected', async () => {
    const wallet = jest.fn();

    mockSuccessfullyConnectedExtension(Extension, wallet);

    expect(connectExtension()).resolves.toEqual(wallet);
  });
});
