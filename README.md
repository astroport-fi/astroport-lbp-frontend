# Astroport Token Sales Frontend
Frontend app to buy & sell tokens using [Astroport's LBP contracts](https://github.com/astroport-fi/astroport-lbp/).

## Getting Started
Teams are expected to customize and host the frontend themselves.
This guide will walk you through the steps necessary to configure and deploy the app.
If further customization is desired, check out the [Development](#Development) section below.

It is recommended that you fork this repo and then make your changes there. 

**Important Note:** The frontend assumes that one side of the LBP pair is UST. Changes will need to be made to the app to support other assets. 

### Configuration
- Replace `src/assets/images/logo.svg` with your own logo
  - You may want/need to tweak the logo's size, or if your logo is not an SVG, change its import. The logo is rendered in the [`TokenSales`](src/components/token_sales.js) component.
- Configure your color scheme in [`theme.css`](src/theme.css)
- Update `src/config/networks.js` with:
  - Your mainnet Astroport LBP factory contract address (you are expected to deploy the factory and pair contracts yourself)
  - Your mainnet Astroport LBP pair contract address(es) (these are whitelisted by the frontend to control the asset pairs that are visible on the UI)
  - If you'd like to test the frontend on the testnet first, you could also deploy the necessary contracts to the testnet and update the testnet portion of `networks.js` with the factory and pair addresses. 
- If further UI customization is desired, the CSS entrypoint is [`src/index.css`](src/index.css), and there are also component-specific CSS files in [`src/components`](src/components).
  - You also have full access to [Tailwind](https://tailwindcss.com/)'s wonderful suite of utility classes. 
- This app is configured out-of-the-box with [Sentry](https://sentry.io) support for error tracking/reporting.
  - If you'd prefer not to use Sentry, no action is necessary.
  - If you'd like to use it, you'll need to set the `REACT_APP_SENTRY_DSN` environment variable at build time (more on this below in the [Deployment](#deployment) section).
  - If you'd like to use a different service for error tracking, you can make the necessary changes in [`src/index.js`](src/index.js) and [`src/report_exception.js`](src/report_exception.js).

### Deployment
The recommended process is to configure continuous deployment via [Github Actions](https://github.com/features/actions) or some other means, but you could also build the project yourself and upload the resulting static site to any web host.

#### Via Github Actions
If deploying via Github Actions, you can reference [`.github/workflows/staging_ci_cd.yml`](.github/workflows/staging_ci_cd.yml) as a template.

That workflow will run the test suite and then, if it passes, deploy to [Netlify](https://www.netlify.com/). If you'd like to deploy to Netlify as well, you'll only need to make a few changes:
1. Update `REACT_APP_DEFAULT_NETWORK` in `staging_ci_cd.yml` to `mainnet` for your production workflow.
2. Configure the `NETLIFY_AUTH_TOKEN` and `NETLIFY_SITE_ID` Github Actions secrets.
3. Configure the `SENTRY_DSN` Github Actions secret if using Sentry.

#### Manual Deployment
To build the project, you'll need to set up your local environment by installing `node` and `npm` and then all project dependencies as described in the [Development](#Development) section below.

Once your local environment is set up, building the project is as easy as running:

```console
$ npm run build
```

_Or, if using Sentry:_

```console
$ REACT_APP_SENTRY_DSN=https://your-sentry-dsn npm run build
```

That will build everything that you need to host the app in the `build` folder. Simply upload that to your web host of choice.

**Note:** The network that's used in the build is pulled from the `REACT_APP_DEFAULT_NETWORK` environment variable, which [defaults](.env) to `mainnet`.
If you'd like to generate a build using another network by default (e.g. `testnet` for a test deployment), you should run something like:

```console
$ REACT_APP_DEFAULT_NETWORK=testnet npm run build
```

## Development

### Stack
- [React](https://reactjs.org/)
  - `create-react-app`, configured via [craco](https://github.com/gsoft-inc/craco)
- [Tailwind](https://tailwindcss.com/)

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

## TODO
- [ ] Add historical pricing plot

## LICENSE

This repo is under a [MIT license](https://github.com/astroport-fi/astroport-lbp-frontend/blob/master/LICENSE).
