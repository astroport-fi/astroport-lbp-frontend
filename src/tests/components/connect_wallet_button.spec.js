import ConnectWalletButton from '../../components/connect_wallet_button';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { connectExtension, EXTENSION_UNAVAILABLE } from '../../terra/extension';

jest.mock('../../terra/extension', () => {
  const original = jest.requireActual('../../terra/extension');

  return {
    __esModule: true,
    ...original,
    connectExtension: jest.fn()
  }
});

let mockConnectWallet;

jest.mock('../../hooks/use_wallet', () => ({
  __esModule: true,
  useWallet: () => ({
    connectWallet: mockConnectWallet
  })
}));

beforeEach(() => {
  mockConnectWallet = jest.fn();
});

describe('ConnectWalletButton', () => {
  it('opens extension download URL when extension is not available', async () => {
    connectExtension.mockRejectedValue({ reason: EXTENSION_UNAVAILABLE })

    const windowOpenSpy = jest.spyOn(window, 'open').mockImplementation();

    render(<ConnectWalletButton />);

    await act(async () => {
      await userEvent.click(screen.getByText('Connect Wallet'));
    })

    expect(windowOpenSpy).toHaveBeenCalledWith('https://terra.money/extension');
    expect(connectExtension).toHaveBeenCalledTimes(1);

    windowOpenSpy.mockRestore();
  });

  it('displays connecting indicator while connecting' +
    'and then passes wallet/payload to onConnect function when connected', async () => {
    const wallet = jest.fn();

    connectExtension.mockResolvedValue(wallet);

    render(<ConnectWalletButton />);

    await act(async () => {
      await userEvent.click(screen.getByText('Connect Wallet'));
    })

    expect(connectExtension).toHaveBeenCalledTimes(1);
    expect(mockConnectWallet).toHaveBeenCalledTimes(1);
    expect(mockConnectWallet).toHaveBeenCalledWith(wallet);
  });
});
