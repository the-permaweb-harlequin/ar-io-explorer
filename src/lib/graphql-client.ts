import { GraphQLClient } from 'graphql-request'

export const graphqlClient = new GraphQLClient(
  'https://arweave-search.goldsky.com/graphql',
  {
    headers: {
      'Content-Type': 'application/json',
    },
  },
)
