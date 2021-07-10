# Astroport Token Sales
![Staging CI/CD Badge](https://github.com/room118solutions/astroport-token-sales/actions/workflows/staging_ci_cd.yml/badge.svg)

## Development

### Requirements

- `node` v14.
- `npm` v6.

If you have `nvm` installed, it should select the correct version for you based on the `.nvmrc`.

### Install dependencies

```console
$ npm install
```

### Configuration

- The mainnet and testnet networks are configured in `src/config/networks.js`,
  but you can configure additional networks, or override those networks entirely,
  in `src/config/environments/development.js`. See `development.js.sample` for a template.
- The default network is selected based on the `REACT_APP_DEFAULT_NETWORK` env variable.
  By default (in `.env`), it's set to `mainnet`. You can override this to a network
  that you specify in `src/config/environments/development.js` in a `.env.development.local`
  file. See `.env.development.local.sample` for a template.
- A sensible configuration for local development would be to define a `localterra` network in `src/config/environments/development.js`,
  and set `REACT_APP_DEFAULT_NETWORK` to `localterra` in `.env.development.local`.
- **Important Note**: You *must* whitelist any pairs that you want the app to care about in the `allowedPairContracts` key of each network config.

### Running the development server

```console
$ npm start
```

You can then access the application by going to [`http://localhost:3000`](http://localhost:3000) in your web browser.

The page will reload if you make edits. You will also see any lint errors in the console.

### Testing

```console
$ npm test
```

Launches the test runner in the interactive watch mode.

### Building

```console
$ npm run build
```

Builds the app for production to the `build` folder.
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.
