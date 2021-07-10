import { render, screen } from '@testing-library/react';
import CW20TokenName from '../../components/cw20_token_name';
import { getTokenInfo } from '../../terra/queries';
import reportException from '../../report_exception';

jest.mock('../../terra/queries', () => ({
  __esModule: true,
  getTokenInfo: jest.fn()
}));

jest.mock('../../report_exception');

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

  it('displays contract address and reports error when unable to resolve token name', async () => {
    const error = new Error('failed to fetch token name');

    getTokenInfo.mockRejectedValue(error);

    render(<CW20TokenName address="terra42" />);
    expect(await screen.findByText('terra42')).toBeInTheDocument();

    expect(reportException).toHaveBeenCalledTimes(1);
    expect(reportException).toHaveBeenCalledWith(error);
  });
});
