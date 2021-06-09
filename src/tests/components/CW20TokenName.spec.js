import { render, screen } from '@testing-library/react';
import CW20TokenName from '../../components/CW20TokenName';
import { getTokenName } from '../../terra/queries';

jest.mock('../../terra/queries', () => ({
  __esModule: true,
  getTokenName: jest.fn()
}));

describe('CW20TokenName', () => {
  it('displays Loading indicator while fetching the given token name, then displays the name', async () => {
    getTokenName.mockResolvedValue('Foo');

    const { container } = render(<CW20TokenName address="terra42" />);
    expect(container.textContent).toEqual('Loading...');

    expect(await screen.findByText('Foo')).toBeInTheDocument();
    expect(getTokenName).toHaveBeenCalledWith('terra42');
  });
});