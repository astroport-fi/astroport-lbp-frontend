import { render, screen } from '@testing-library/react';
import CW20TokenName from '../../components/cw20_token_name';
import { getTokenInfo } from '../../terra/queries';

jest.mock('../../terra/queries', () => ({
  __esModule: true,
  getTokenInfo: jest.fn()
}));

describe('CW20TokenName', () => {
  it('displays Loading indicator while fetching the given token name, then displays the name', async () => {
    getTokenInfo.mockResolvedValue({
      name: 'Foo',
      symbol: 'FOO',
      decimals: 6
    });

    const { container } = render(<CW20TokenName address="terra42" />);
    expect(container.innerHTML).toMatch(/loading-indicator\.svg/);

    expect(await screen.findByText('Foo')).toBeInTheDocument();
    expect(getTokenInfo).toHaveBeenCalledWith('terra42');
  });

  it('displays contract address and logs error when unable to resolve token name', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const error = new Error('failed to fetch token name');

    getTokenInfo.mockRejectedValue(error);

    render(<CW20TokenName address="terra42" />);
    expect(await screen.findByText('terra42')).toBeInTheDocument();

    expect(consoleErrorSpy).toHaveBeenCalledWith(error);
    consoleErrorSpy.mockRestore();
  });
});
