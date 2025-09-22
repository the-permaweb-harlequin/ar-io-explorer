import { result } from '@permaweb/aoconnect'

import {
  SortOrder,
  TransactionEdge,
  useGetAllMessagesQuery,
  useGetEvalMessagesQuery,
  useGetIncomingMessagesQuery,
  useGetLinkedMessagesQuery,
  useGetMessagesForBlockQuery,
  useGetModulesQuery,
  useGetNetworkStatsQuery,
  useGetOutgoingMessagesQuery,
  useGetOwnedDomainsHistoryQuery,
  useGetProcessesQuery,
  useGetResultingMessagesByIdsQuery,
  useGetResultingMessagesQuery,
  useGetSetRecordsToEntityIdQuery,
  useGetSpawnedProcessesQuery,
  useGetTokenTransfersQuery,
  useGetTransactionByIdQuery,
  useInfiniteGetAllMessagesQuery,
  useInfiniteGetEvalMessagesQuery,
  useInfiniteGetIncomingMessagesQuery,
  useInfiniteGetLinkedMessagesQuery,
  useInfiniteGetMessagesForBlockQuery,
  useInfiniteGetModulesQuery,
  useInfiniteGetOutgoingMessagesQuery,
  useInfiniteGetOwnedDomainsHistoryQuery,
  useInfiniteGetProcessesQuery,
  useInfiniteGetResultingMessagesQuery,
  useInfiniteGetSetRecordsToEntityIdQuery,
  useInfiniteGetSpawnedProcessesQuery,
  useInfiniteGetTokenTransfersQuery,
} from '@/generated/graphql'

import { ParsedAddress, parseTransactionOwner } from './address-utils'
import { graphqlClient } from './graphql-client'

// MessageResult type definition
interface MessageResult {
  Messages?: Array<any>
  [key: string]: any
}

// Types for the AO queries
export interface AoMessage {
  id: string
  to: string
  from: string
  fromParsed: ParsedAddress
  type: string
  tags: Record<string, string>
  block?: {
    height: number
    timestamp?: number | null
  } | null
  data: {
    size: string
    type?: string | null
  }
  fee: {
    winston: string
    ar: string
  }
  quantity: {
    winston: string
    ar: string
  }
  bundledIn?: {
    id: string
  } | null
  ingested_at?: number | null
}

export interface TokenTransferMessage extends AoMessage {
  action: 'Credit-Notice' | 'Debit-Notice'
  quantity: {
    winston: string
    ar: string
  }
}

export interface NetworkStat {
  [key: string]: any // Define based on your actual network stats structure
}

export interface MessageTree extends AoMessage {
  result: MessageResult | null
  children: Array<MessageTree>
}

// Utility functions
export function parseAoMessage(edge: TransactionEdge): AoMessage {
  const { node } = edge
  const tags: Record<string, string> = {}

  node.tags.forEach((tag) => {
    tags[tag.name] = tag.value
  })

  const fromParsed = parseTransactionOwner(node.owner)

  return {
    id: node.id,
    to: node.recipient,
    from: fromParsed.address, // Use the parsed address (0x for Ethereum, normalized for Arweave)
    fromParsed,
    type: tags['Type'] || 'Message',
    tags,
    block: node.block,
    data: node.data,
    fee: node.fee,
    quantity: node.quantity,
    bundledIn: node.bundledIn,
    ingested_at: node.ingested_at,
  }
}

export function parseTokenEvent(edge: TransactionEdge): TokenTransferMessage {
  const aoMessage = parseAoMessage(edge)
  const action = aoMessage.tags['Action'] as 'Credit-Notice' | 'Debit-Notice'

  return {
    ...aoMessage,
    action,
  }
}

export function isArweaveId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{43}$/.test(id)
}

// Hook-based query functions
export function useOutgoingMessages(
  entityId: string,
  limit = 100,
  cursor = '',
  ascending = false,
  isProcess = false,
) {
  return useGetOutgoingMessagesQuery(graphqlClient, {
    entityId,
    limit,
    sortOrder: ascending ? SortOrder.HeightAsc : SortOrder.HeightDesc,
    cursor: cursor || undefined,
    isProcess,
  })
}

export function useInfiniteOutgoingMessages(
  entityId: string,
  limit = 100,
  ascending = false,
  isProcess = false,
) {
  return useInfiniteGetOutgoingMessagesQuery(
    graphqlClient,
    {
      entityId,
      limit,
      sortOrder: ascending ? SortOrder.HeightAsc : SortOrder.HeightDesc,
      isProcess,
    },
    {
      initialPageParam: undefined,
      getNextPageParam: (lastPage) => {
        const transactions = isProcess
          ? lastPage.processTransactions
          : lastPage.transactions
        return transactions?.pageInfo.hasNextPage
          ? transactions.edges[transactions.edges.length - 1]?.cursor
          : undefined
      },
    },
  )
}

export function useIncomingMessages(
  entityId: string,
  limit = 100,
  cursor = '',
  ascending = false,
) {
  return useGetIncomingMessagesQuery(graphqlClient, {
    entityId,
    limit,
    sortOrder: ascending ? SortOrder.HeightAsc : SortOrder.HeightDesc,
    cursor: cursor || undefined,
  })
}

export function useInfiniteIncomingMessages(
  entityId: string,
  limit = 100,
  ascending = false,
) {
  return useInfiniteGetIncomingMessagesQuery(
    graphqlClient,
    {
      entityId,
      limit,
      sortOrder: ascending ? SortOrder.HeightAsc : SortOrder.HeightDesc,
    },
    {
      initialPageParam: undefined,
      getNextPageParam: (lastPage) =>
        lastPage.transactions.pageInfo.hasNextPage
          ? lastPage.transactions.edges[lastPage.transactions.edges.length - 1]
              ?.cursor
          : undefined,
    },
  )
}

export function useTokenTransfers(
  entityId: string,
  limit = 100,
  cursor = '',
  ascending = false,
) {
  return useGetTokenTransfersQuery(graphqlClient, {
    entityId,
    limit,
    sortOrder: ascending ? SortOrder.HeightAsc : SortOrder.HeightDesc,
    cursor: cursor || undefined,
  })
}

export function useInfiniteTokenTransfers(
  entityId: string,
  limit = 100,
  ascending = false,
) {
  return useInfiniteGetTokenTransfersQuery(
    graphqlClient,
    {
      entityId,
      limit,
      sortOrder: ascending ? SortOrder.HeightAsc : SortOrder.HeightDesc,
    },
    {
      initialPageParam: undefined,
      getNextPageParam: (lastPage) =>
        lastPage.transactions.pageInfo.hasNextPage
          ? lastPage.transactions.edges[lastPage.transactions.edges.length - 1]
              ?.cursor
          : undefined,
    },
  )
}

export function useSpawnedProcesses(
  entityId: string,
  limit = 100,
  cursor = '',
  ascending = false,
  isProcess = false,
) {
  return useGetSpawnedProcessesQuery(graphqlClient, {
    entityId,
    limit,
    sortOrder: ascending ? SortOrder.HeightAsc : SortOrder.HeightDesc,
    cursor: cursor || undefined,
    isProcess,
  })
}

export function useInfiniteSpawnedProcesses(
  entityId: string,
  limit = 100,
  ascending = false,
  isProcess = false,
) {
  return useInfiniteGetSpawnedProcessesQuery(
    graphqlClient,
    {
      entityId,
      limit,
      sortOrder: ascending ? SortOrder.HeightAsc : SortOrder.HeightDesc,
      isProcess,
    },
    {
      initialPageParam: undefined,
      getNextPageParam: (lastPage) => {
        const transactions = isProcess
          ? lastPage.processTransactions
          : lastPage.transactions
        return transactions?.pageInfo.hasNextPage
          ? transactions.edges[transactions.edges.length - 1]?.cursor
          : undefined
      },
    },
  )
}

export function useProcesses(
  limit = 100,
  cursor = '',
  ascending = false,
  moduleId?: string,
) {
  const tags = [
    { name: 'Type', values: ['Process', 'Module'] },
    { name: 'Data-Protocol', values: ['ao'] },
  ]

  if (moduleId) {
    tags.push({ name: 'Module', values: [moduleId] })
  }

  return useGetProcessesQuery(graphqlClient, {
    limit,
    sortOrder: ascending ? SortOrder.HeightAsc : SortOrder.HeightDesc,
    cursor: cursor || undefined,
    tags,
  })
}

export function useInfiniteProcesses(
  limit = 100,
  ascending = false,
  moduleId?: string,
) {
  const tags = [
    { name: 'Type', values: ['Process', 'Module'] },
    { name: 'Data-Protocol', values: ['ao'] },
  ]

  if (moduleId) {
    tags.push({ name: 'Module', values: [moduleId] })
  }

  return useInfiniteGetProcessesQuery(
    graphqlClient,
    {
      limit,
      sortOrder: ascending ? SortOrder.HeightAsc : SortOrder.HeightDesc,
      tags,
    },
    {
      initialPageParam: undefined,
      getNextPageParam: (lastPage) =>
        lastPage.transactions.pageInfo.hasNextPage
          ? lastPage.transactions.edges[lastPage.transactions.edges.length - 1]
              ?.cursor
          : undefined,
    },
  )
}

export function useModules(limit = 100, cursor = '', ascending = false) {
  return useGetModulesQuery(graphqlClient, {
    limit,
    sortOrder: ascending ? SortOrder.HeightAsc : SortOrder.HeightDesc,
    cursor: cursor || undefined,
  })
}

export function useInfiniteModules(limit = 100, ascending = false) {
  return useInfiniteGetModulesQuery(
    graphqlClient,
    {
      limit,
      sortOrder: ascending ? SortOrder.HeightAsc : SortOrder.HeightDesc,
    },
    {
      initialPageParam: undefined,
      getNextPageParam: (lastPage) =>
        lastPage.transactions.pageInfo.hasNextPage
          ? lastPage.transactions.edges[lastPage.transactions.edges.length - 1]
              ?.cursor
          : undefined,
    },
  )
}

export function useResultingMessages(
  fromProcessId: string,
  msgRefs: Array<string>,
  limit = 100,
  cursor = '',
  ascending = false,
  useOldRefSymbol = false,
) {
  return useGetResultingMessagesQuery(graphqlClient, {
    fromProcessId,
    msgRefs,
    limit,
    sortOrder: ascending ? SortOrder.HeightAsc : SortOrder.HeightDesc,
    cursor: cursor || undefined,
    useOldRefSymbol,
  })
}

export function useInfiniteResultingMessages(
  fromProcessId: string,
  msgRefs: Array<string>,
  limit = 100,
  ascending = false,
  useOldRefSymbol = false,
) {
  return useInfiniteGetResultingMessagesQuery(
    graphqlClient,
    {
      fromProcessId,
      msgRefs,
      limit,
      sortOrder: ascending ? SortOrder.HeightAsc : SortOrder.HeightDesc,
      useOldRefSymbol,
    },
    {
      initialPageParam: undefined,
      getNextPageParam: (lastPage) => {
        const transactions = useOldRefSymbol
          ? lastPage.oldRefTransactions
          : lastPage.transactions
        return transactions?.pageInfo.hasNextPage
          ? transactions.edges[transactions.edges.length - 1]?.cursor
          : undefined
      },
    },
  )
}

export function useLinkedMessages(
  messageId: string,
  limit = 100,
  cursor = '',
  ascending = false,
) {
  return useGetLinkedMessagesQuery(graphqlClient, {
    messageId,
    limit,
    sortOrder: ascending ? SortOrder.HeightAsc : SortOrder.HeightDesc,
    cursor: cursor || undefined,
  })
}

export function useInfiniteLinkedMessages(
  messageId: string,
  limit = 100,
  ascending = false,
) {
  return useInfiniteGetLinkedMessagesQuery(
    graphqlClient,
    {
      messageId,
      limit,
      sortOrder: ascending ? SortOrder.HeightAsc : SortOrder.HeightDesc,
    },
    {
      initialPageParam: undefined,
      getNextPageParam: (lastPage) =>
        lastPage.transactions.pageInfo.hasNextPage
          ? lastPage.transactions.edges[lastPage.transactions.edges.length - 1]
              ?.cursor
          : undefined,
    },
  )
}

export function useMessagesForBlock(
  blockHeight: number,
  limit = 100,
  cursor = '',
  ascending = false,
) {
  return useGetMessagesForBlockQuery(graphqlClient, {
    blockHeight,
    limit,
    sortOrder: ascending ? SortOrder.HeightAsc : SortOrder.HeightDesc,
    cursor: cursor || undefined,
  })
}

export function useInfiniteMessagesForBlock(
  blockHeight: number,
  limit = 100,
  ascending = false,
) {
  return useInfiniteGetMessagesForBlockQuery(
    graphqlClient,
    {
      blockHeight,
      limit,
      sortOrder: ascending ? SortOrder.HeightAsc : SortOrder.HeightDesc,
    },
    {
      initialPageParam: undefined,
      getNextPageParam: (lastPage) =>
        lastPage.transactions.pageInfo.hasNextPage
          ? lastPage.transactions.edges[lastPage.transactions.edges.length - 1]
              ?.cursor
          : undefined,
    },
  )
}

export function useAllMessages(
  limit = 100,
  cursor = '',
  ascending = false,
  extraFilters?: Record<string, string>,
) {
  const tags = [
    {
      name: 'Data-Protocol',
      values: ['ao'],
    },
  ]

  if (extraFilters) {
    for (const [name, value] of Object.entries(extraFilters)) {
      tags.push({ name, values: [value] })
    }
  }

  return useGetAllMessagesQuery(graphqlClient, {
    limit,
    sortOrder: ascending ? SortOrder.HeightAsc : SortOrder.HeightDesc,
    cursor: cursor || undefined,
    tags,
  })
}

export function useInfiniteAllMessages(
  limit = 100,
  ascending = false,
  extraFilters?: Record<string, string>,
  recipients?: Array<string>,
  owners?: Array<string>,
) {
  const tags = [
    {
      name: 'Data-Protocol',
      values: ['ao'],
    },
  ]

  if (extraFilters) {
    for (const [name, value] of Object.entries(extraFilters)) {
      tags.push({ name, values: [value] })
    }
  }

  return useInfiniteGetAllMessagesQuery(
    graphqlClient,
    {
      limit,
      sortOrder: ascending ? SortOrder.HeightAsc : SortOrder.HeightDesc,
      tags,
      recipients: recipients?.length ? recipients : undefined,
      owners: owners?.length ? owners : undefined,
    },
    {
      initialPageParam: undefined,
      getNextPageParam: (lastPage) =>
        lastPage.transactions.pageInfo.hasNextPage
          ? lastPage.transactions.edges[lastPage.transactions.edges.length - 1]
              ?.cursor
          : undefined,
    },
  )
}

export function useEvalMessages(
  entityId: string,
  limit = 100,
  cursor = '',
  ascending = false,
) {
  return useGetEvalMessagesQuery(graphqlClient, {
    entityId,
    limit,
    sortOrder: ascending ? SortOrder.HeightAsc : SortOrder.HeightDesc,
    cursor: cursor || undefined,
  })
}

export function useInfiniteEvalMessages(
  entityId: string,
  limit = 100,
  ascending = false,
) {
  return useInfiniteGetEvalMessagesQuery(
    graphqlClient,
    {
      entityId,
      limit,
      sortOrder: ascending ? SortOrder.HeightAsc : SortOrder.HeightDesc,
    },
    {
      initialPageParam: undefined,
      getNextPageParam: (lastPage) =>
        lastPage.transactions.pageInfo.hasNextPage
          ? lastPage.transactions.edges[lastPage.transactions.edges.length - 1]
              ?.cursor
          : undefined,
    },
  )
}

export function useNetworkStats() {
  return useGetNetworkStatsQuery(graphqlClient, {})
}

export function useOwnedDomainsHistory(
  entityId: string,
  limit = 100,
  cursor = '',
  ascending = false,
) {
  return useGetOwnedDomainsHistoryQuery(graphqlClient, {
    entityId,
    limit,
    sortOrder: ascending ? SortOrder.HeightAsc : SortOrder.HeightDesc,
    cursor: cursor || undefined,
  })
}

export function useInfiniteOwnedDomainsHistory(
  entityId: string,
  limit = 100,
  ascending = false,
) {
  return useInfiniteGetOwnedDomainsHistoryQuery(
    graphqlClient,
    {
      entityId,
      limit,
      sortOrder: ascending ? SortOrder.HeightAsc : SortOrder.HeightDesc,
    },
    {
      initialPageParam: undefined,
      getNextPageParam: (lastPage) =>
        lastPage.transactions.pageInfo.hasNextPage
          ? lastPage.transactions.edges[lastPage.transactions.edges.length - 1]
              ?.cursor
          : undefined,
    },
  )
}

export function useSetRecordsToEntityId(
  entityId: string,
  limit = 100,
  cursor = '',
  ascending = false,
) {
  return useGetSetRecordsToEntityIdQuery(graphqlClient, {
    entityId,
    limit,
    sortOrder: ascending ? SortOrder.HeightAsc : SortOrder.HeightDesc,
    cursor: cursor || undefined,
  })
}

export function useInfiniteSetRecordsToEntityId(
  entityId: string,
  limit = 100,
  ascending = false,
) {
  return useInfiniteGetSetRecordsToEntityIdQuery(
    graphqlClient,
    {
      entityId,
      limit,
      sortOrder: ascending ? SortOrder.HeightAsc : SortOrder.HeightDesc,
    },
    {
      initialPageParam: undefined,
      getNextPageParam: (lastPage) =>
        lastPage.transactions.pageInfo.hasNextPage
          ? lastPage.transactions.edges[lastPage.transactions.edges.length - 1]
              ?.cursor
          : undefined,
    },
  )
}

// Message by ID function (non-hook version for use in message graph)
export async function getMessageById(id: string): Promise<AoMessage | null> {
  if (!isArweaveId(id)) {
    return null
  }

  try {
    const queryResult = await useGetTransactionByIdQuery.fetcher(
      graphqlClient,
      { id },
    )()

    if (!queryResult.transaction) return null

    const node = queryResult.transaction
    const tags: Record<string, string> = {}

    node.tags.forEach((tag: any) => {
      tags[tag.name] = tag.value
    })

    const fromParsed = parseTransactionOwner(node.owner)

    return {
      id: node.id,
      to: node.recipient,
      from: fromParsed.address, // Use the parsed address (0x for Ethereum, normalized for Arweave)
      fromParsed,
      type: tags['Type'] || 'Message',
      tags,
      block: node.block,
      data: node.data,
      fee: node.fee,
      quantity: node.quantity,
      bundledIn: node.bundledIn,
      ingested_at: node.ingested_at,
    }
  } catch (error) {
    console.error('Error fetching message by ID:', error)
    return null
  }
}

// Network stats function (non-hook version)
export async function getNetworkStats(): Promise<Array<NetworkStat>> {
  try {
    const queryResult = await useGetNetworkStatsQuery.fetcher(
      graphqlClient,
      {},
    )()

    if (!queryResult.transactions.edges.length) return []

    const updateId = queryResult.transactions.edges[0].node.id
    const data = await fetch(`https://arweave.net/${updateId}`)
    const json = await data.json()

    return json as Array<NetworkStat>
  } catch (error) {
    console.error('Error fetching network stats:', error)
    return []
  }
}

// Message graph functionality
export interface FetchMessageGraphArgs {
  msgId: string
  actions?: Array<string>
  startFromPushedFor?: boolean
  ignoreRepeatingMessages?: boolean
  depth?: number
}

export const fetchMessageGraph = async (
  {
    msgId,
    actions,
    startFromPushedFor = false,
    ignoreRepeatingMessages = false,
    depth = 0,
  }: FetchMessageGraphArgs,
  visited: Set<string> = new Set(),
): Promise<MessageTree | null> => {
  try {
    if (visited.has(msgId)) {
      return null
    }

    visited.add(msgId)

    let originalMsg = await getMessageById(msgId)

    if (!originalMsg) {
      return null
    }

    if (startFromPushedFor) {
      const pushedFor = originalMsg.tags['Pushed-For']

      if (pushedFor) {
        originalMsg = await getMessageById(pushedFor)
      }
    }

    if (!originalMsg) {
      return null
    }

    const receiverMsg = await getMessageById(originalMsg.to)

    let aoResult = null

    if (receiverMsg && receiverMsg.type === 'Process') {
      aoResult = await result({
        process: originalMsg.to,
        message: originalMsg.id,
      })
    }

    const head: MessageTree = Object.assign({}, originalMsg, {
      children: [],
      result: aoResult,
    })

    for (const aoMessage of head.result?.Messages ?? []) {
      const refTag = aoMessage.Tags.find((t: any) =>
        ['Ref_', 'Reference'].includes(t.name),
      )

      // Require a valid target and at least one reference tag value
      if (!isArweaveId(String(aoMessage.Target)) || !refTag?.value) {
        continue
      }

      const shouldUseOldRefSymbol = refTag.name === 'Ref_'

      // Use the GraphQL client directly for this complex query
      const nodes = await getResultingMessagesNodes({
        recipient: aoMessage.Target,
        limit: 100,
        cursor: '',
        _actions: actions,
        ascending: false,
        msgRefs: refTag ? [refTag.value] : [],
        useOldRefSymbol: shouldUseOldRefSymbol,
      })

      let nodesIds = nodes
        .filter((n: any) => n && isArweaveId(String(n.id)))
        .map((n: any) => n.id)

      if (ignoreRepeatingMessages) {
        nodesIds = [...new Set(nodesIds)]
      }

      let leafs = []

      for (const nodeId of nodesIds) {
        if (!isArweaveId(nodeId)) continue
        const leaf = await fetchMessageGraph(
          {
            msgId: nodeId,
            actions,
            ignoreRepeatingMessages,
            depth: depth + 1,
          },
          visited,
        )

        leafs.push(leaf)
      }

      leafs = leafs.filter((l) => l !== null)

      head.children = head.children.concat(leafs)
    }

    return head
  } catch (error) {
    console.error('Error fetching message graph:', error)
    return null
  }
}

export interface GetResultingMessagesNodesArgs {
  recipient: string
  limit: number
  cursor: string
  ascending: boolean
  _fromProcess?: string
  _actions?: Array<string>
  msgRefs?: Array<string>
  useOldRefSymbol: boolean
}

export const getResultingMessagesNodes = async ({
  recipient,
  limit = 100,
  cursor = '',
  ascending,
  _fromProcess: _,
  _actions: __,
  msgRefs,
  useOldRefSymbol = false,
}: GetResultingMessagesNodesArgs) => {
  try {
    const queryResult = await useGetResultingMessagesByIdsQuery.fetcher(
      graphqlClient,
      {
        recipient,
        msgRefs: msgRefs || [],
        limit,
        sortOrder: ascending ? SortOrder.HeightAsc : SortOrder.HeightDesc,
        cursor: cursor || undefined,
        useOldRefSymbol,
      },
    )()

    const transactions = useOldRefSymbol
      ? queryResult.oldRefTransactions
      : queryResult.transactions
    if (!transactions) return []

    const { edges } = transactions
    const nodes = edges.map((e: any) => e.node)

    return nodes
  } catch (error) {
    console.error('Error fetching resulting messages nodes:', error)
    return []
  }
}
