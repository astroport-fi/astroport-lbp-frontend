// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

import { enableFetchMocks } from 'jest-fetch-mock';
global.crypto = require('crypto'); // TODO: Without this, we get an error running tests after terra.js update - find out why
enableFetchMocks();
