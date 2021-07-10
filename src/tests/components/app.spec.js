import { render, screen, within, act } from '@testing-library/react';
import App from '../../components/app';
import { getLBPs, getTokenInfo, getPairInfo } from '../../terra/queries';
import userEvent from "@testing-library/user-event";
import { buildPair } from '../test_helpers/factories';
import { connectExtension } from '../../terra/extension';

jest.mock('../../terra/extension');
jest.mock('@terra-money/terra.js');

jest.mock('../../terra/queries', () => ({
  __esModule: true,
  getLBPs: jest.fn(),
  getTokenInfo: jest.fn(),
  getPairInfo: jest.fn()
}));

// Simple stub for CurrentTokenSale component,
// which is unit tested separately.
jest.mock('../../components/current_token_sale', () =>
  () => (<div>Current Token Info</div>)
);

jest.mock('../../config/networks.js', () => {
  const original = jest.requireActual('../../config/networks.js');

  return {
    __esModule: true,
    ...original,
    defaultNetwork: {
      ...original.defaultNetwork,
      allowedPairContracts: [
        'terra1-pair-addr',
        'terra2-pair-addr',
        'terra3-pair-addr'
      ]
    }
  }
});

describe('App', () => {
  it('renders Scheduled and Previous Token Sales cards', async () => {
    const dateNowSpy = jest
      .spyOn(Date, 'now')
      .mockImplementation(() => new Date(2021, 5, 9).getTime());

    // Mock toLocaleString to always use en-US locale in EDT timezone
    const toLocaleStringSpy = jest.spyOn(Date.prototype, 'toLocaleString');
    toLocaleStringSpy.mockImplementation(
      function (locale, options) {
        return new Intl.DateTimeFormat('en-US', { ...options, timeZone: 'America/New_York' }).format(this);
      }
    )

    const currentPair = buildPair({
      startTime: Math.floor(Date.UTC(2021, 5, 8, 12)/1000),
      endTime: Math.floor(Date.UTC(2021, 5, 10, 12)/1000),
      tokenContractAddr: 'terra3',
      contractAddr: 'terra3-pair-addr'
    });

    // This pair would be displayed as scheduled if permitted
    const unpermittedPair = buildPair({
      startTime: Math.floor(Date.UTC(2021, 5, 10, 12)/1000),
      endTime: Math.floor(Date.UTC(2021, 5, 14, 12)/1000),
      tokenContractAddr: 'terra4',
      contractAddr: 'terra4-pair-addr'
    });

    getLBPs.mockResolvedValue([
      buildPair({
        startTime: Math.floor(Date.UTC(2021, 0, 1, 12)/1000),
        endTime: Math.floor(Date.UTC(2021, 0, 4, 12)/1000),
        tokenContractAddr: 'terra1',
        contractAddr: 'terra1-pair-addr'
      }),
      buildPair({
        startTime: Math.floor(Date.UTC(2021, 5, 10, 12)/1000),
        endTime: Math.floor(Date.UTC(2021, 5, 14, 12)/1000),
        tokenContractAddr: 'terra2',
        contractAddr: 'terra2-pair-addr'
      }),
      unpermittedPair,
      currentPair
    ]);

    getPairInfo.mockResolvedValue(currentPair);

    getTokenInfo.mockImplementation((_, address) => (
      {
        terra1: {
          name: 'Foo'
        },
        terra2: {
          name: 'Bar'
        },
        terra3: {
          name: 'Baz'
        },
        terra4: {
          name: 'Bad'
        }
      }[address]
    ));

    render(<App />);

    // Heading with sale token name
    expect(await screen.findByText('Baz Token Sale')).toBeInTheDocument();

    // Current token info component
    expect(await screen.findByText('Current Token Info')).toBeInTheDocument();

    // Tokens are in the correct cards with the correct time/dates
    const scheduledCard = (await screen.findByText('Scheduled Token Sales')).closest('div')
    const previousCard = (await screen.findByText('Previous Token Sales')).closest('div')

    const barCell = await within(scheduledCard).findByText('Bar');
    expect(barCell).toBeInTheDocument();
    expect(within(barCell.closest('tr')).queryByText('06/10/2021, 08:00 AM EDT')).toBeInTheDocument();

    const fooCell = await within(previousCard).findByText('Foo')
    expect(fooCell).toBeInTheDocument();
    expect(within(fooCell.closest('tr')).queryByText('01/01/2021 - 01/04/2021')).toBeInTheDocument();

    // Tokens are not present in the wrong cards
    expect(within(scheduledCard).queryByText('Foo')).toBeNull();
    expect(within(scheduledCard).queryByText('Baz')).toBeNull();
    expect(within(previousCard).queryByText('Bar')).toBeNull();
    expect(within(previousCard).queryByText('Baz')).toBeNull();

    // It should have fetched info for the current sale
    expect(getPairInfo).toHaveBeenCalledTimes(1);
    expect(getPairInfo).toHaveBeenCalledWith(expect.anything(), 'terra3-pair-addr');

    // Unpermitted pair should never be displayed
    expect(screen.queryByText('Bad')).not.toBeInTheDocument();

    dateNowSpy.mockRestore();
  });

  it('displays partial wallet address after successful browser extension connection', async () => {
    connectExtension.mockResolvedValue({ address: 'terra1234567890' });

    const currentPair = buildPair({ contractAddr: 'terra1-pair-addr' });

    getLBPs.mockResolvedValue([
      currentPair
    ]);

    getPairInfo.mockResolvedValue(currentPair);

    getTokenInfo.mockResolvedValue({
      name: 'Foo'
    });

    render(<App />);

    // Wait for data to load and Connect Wallet button to become visible
    await screen.findByText('Connect Wallet');

    // Wallet address should not yet be displayed
    expect(screen.queryByText('567890')).toBeNull();

    await act(async () => {
      await userEvent.click(screen.getByText('Connect Wallet'));
    })

    expect(screen.getByText('terra1...567890')).toBeInTheDocument();
  });

  it('automatically reconnects extension if it was connected previously', async () => {
    const getItemSpy = jest.spyOn(window.localStorage.__proto__, 'getItem');
    getItemSpy.mockImplementation((key) => {
      return {
        terraStationExtensionPreviouslyConnected: true
      }[key]
    });

    connectExtension.mockResolvedValue({ address: 'terra1234567890' });

    const currentPair = buildPair({ contractAddr: 'terra1-pair-addr' });

    getLBPs.mockResolvedValue([
      currentPair
    ]);

    getPairInfo.mockResolvedValue(currentPair);

    getTokenInfo.mockResolvedValue({
      name: 'Foo'
    });

    render(<App />);

    expect(await screen.findByText('terra1...567890')).toBeInTheDocument();

    expect(getItemSpy).toHaveBeenCalledTimes(1);
    expect(getItemSpy).toHaveBeenCalledWith('terraStationExtensionPreviouslyConnected');
  });

  it('disconnects wallet', async () => {
    const getItemSpy = jest.spyOn(window.localStorage.__proto__, 'getItem');
    const removeItemSpy = jest.spyOn(window.localStorage.__proto__, 'removeItem');
    getItemSpy.mockImplementation((key) => {
      return {
        terraStationExtensionPreviouslyConnected: true
      }[key]
    });

    connectExtension.mockResolvedValue({ address: 'terra1234567890' });

    const currentPair = buildPair({ contractAddr: 'terra1-pair-addr'} );

    getLBPs.mockResolvedValue([
      currentPair
    ]);

    getPairInfo.mockResolvedValue(currentPair);

    getTokenInfo.mockResolvedValue({
      name: 'Foo'
    });

    render(<App />);

    expect(await screen.findByText('terra1...567890')).toBeInTheDocument();

    await act(async () => {
      await userEvent.click(screen.getByRole('button', { name: 'Disconnect wallet' }));
    })

    expect(screen.queryByText('terra1...567890')).not.toBeInTheDocument();

    expect(getItemSpy).toHaveBeenCalledTimes(1);
    expect(getItemSpy).toHaveBeenCalledWith('terraStationExtensionPreviouslyConnected');

    expect(removeItemSpy).toHaveBeenCalledTimes(1);
    expect(removeItemSpy).toHaveBeenCalledWith('terraStationExtensionPreviouslyConnected');
  });
});
