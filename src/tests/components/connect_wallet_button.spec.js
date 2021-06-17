import ConnectWalletButton from '../../components/connect_wallet_button';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Extension } from '@terra-money/terra.js';
import { mockSuccessfullyConnectedExtension } from '../test_helpers/terra-js_mocks';

jest.mock('@terra-money/terra.js');

describe('ConnectWalletButton', () => {
  it('opens extension download URL when extension is not available', () => {
    Extension.mockImplementation(() => {
      return {
        isAvailable: false
      }
    });

    const windowOpenSpy = jest.spyOn(window, 'open').mockImplementation();

    render(<ConnectWalletButton />);

    userEvent.click(screen.getByText('Connect Wallet'));

    expect(windowOpenSpy).toHaveBeenCalledWith('https://terra.money/extension');
    windowOpenSpy.mockRestore();
  });

  it('displays connecting indicator while connecting and then passes wallet/payload to onConnect function when connected', () => {
    const wallet = jest.fn();

    mockSuccessfullyConnectedExtension(Extension, wallet);

    const onConnectMock = jest.fn();

    render(<ConnectWalletButton onConnect={onConnectMock} />);

    userEvent.click(screen.getByText('Connect Wallet'));

    expect(onConnectMock).toHaveBeenCalledWith(wallet);
  });
});
