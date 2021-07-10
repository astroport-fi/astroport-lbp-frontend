import { captureException } from '@sentry/react';

export default function reportException(e) {
  captureException(e);
}
