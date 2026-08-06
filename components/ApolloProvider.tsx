'use client';

import React from 'react';
import { ApolloProvider as Provider } from '@apollo/client/react';
import { client } from '../lib/apollo-client';

export function ApolloProvider({ children }: { children: React.ReactNode }) {
  return <Provider client={client}>{children}</Provider>;
}
