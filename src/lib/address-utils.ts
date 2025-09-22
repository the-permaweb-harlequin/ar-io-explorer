import { keccak256 } from 'js-sha3'

export type AddressType = 'arweave' | 'ethereum'

export interface ParsedAddress {
  type: AddressType
  address: string
  normalizedAddress: string
  publicKey: string
}

/**
 * Determines if a public key belongs to an Ethereum address based on its length
 * @param publicKey - The base64url encoded public key
 * @returns true if the public key is from an Ethereum address
 */
export function isEthereumPublicKey(publicKey: string): boolean {
  try {
    // Decode base64url to get the raw key bytes
    const keyBuffer = Buffer.from(publicKey, 'base64url')

    // Ethereum public keys are 65 bytes (uncompressed) or 33 bytes (compressed)
    // But in arbundles context, we typically see 65 bytes for uncompressed keys
    return keyBuffer.length === 65 || keyBuffer.length === 33
  } catch {
    return false
  }
}

/**
 * Determines if a public key belongs to an Arweave address based on its length
 * @param publicKey - The base64url encoded public key
 * @returns true if the public key is from an Arweave address
 */
export function isArweavePublicKey(publicKey: string): boolean {
  try {
    // Decode base64url to get the raw key bytes
    const keyBuffer = Buffer.from(publicKey, 'base64url')

    // Arweave RSA public keys are typically 512 bytes (4096-bit keys)
    return keyBuffer.length >= 256 // Allow for different RSA key sizes
  } catch {
    return false
  }
}

/**
 * Converts an Ethereum public key to its 0x address
 * @param publicKey - The base64url encoded Ethereum public key
 * @returns The Ethereum address with 0x prefix
 */
export function ethereumPublicKeyToAddress(publicKey: string): string {
  try {
    const keyBuffer = Buffer.from(publicKey, 'base64url')

    // For uncompressed keys, skip the first byte (0x04 prefix)
    const keyBytes = keyBuffer.length === 65 ? keyBuffer.slice(1) : keyBuffer

    // Hash the public key with Keccak-256
    const hash = keccak256(keyBytes)

    // Take the last 20 bytes and add 0x prefix
    const address = '0x' + hash.slice(-40)

    return address
  } catch (error) {
    throw new Error(
      `Failed to convert Ethereum public key to address: ${error}`,
    )
  }
}

/**
 * Parses a transaction owner to determine the address type and actual address
 * @param owner - The owner object from a GraphQL transaction
 * @returns Parsed address information
 */
export function parseTransactionOwner(owner: {
  address: string
  key: string
}): ParsedAddress {
  const { address: normalizedAddress, key: publicKey } = owner

  if (isEthereumPublicKey(publicKey)) {
    try {
      const ethAddress = ethereumPublicKeyToAddress(publicKey)
      return {
        type: 'ethereum',
        address: ethAddress,
        normalizedAddress,
        publicKey,
      }
    } catch {
      // Fallback to normalized address if conversion fails
      return {
        type: 'ethereum',
        address: normalizedAddress,
        normalizedAddress,
        publicKey,
      }
    }
  } else if (isArweavePublicKey(publicKey)) {
    return {
      type: 'arweave',
      address: normalizedAddress,
      normalizedAddress,
      publicKey,
    }
  } else {
    // Default to Arweave if we can't determine the type
    return {
      type: 'arweave',
      address: normalizedAddress,
      normalizedAddress,
      publicKey,
    }
  }
}

/**
 * Gets the display address for a transaction owner
 * @param owner - The owner object from a GraphQL transaction
 * @returns The appropriate address to display (0x for Ethereum, normalized for Arweave)
 */
export function getDisplayAddress(owner: {
  address: string
  key: string
}): string {
  const parsed = parseTransactionOwner(owner)
  return parsed.address
}

/**
 * Checks if an address is a valid Arweave transaction ID format
 * @param address - The address to check
 * @returns true if the address matches Arweave ID format
 */
export function isArweaveAddress(address: string): boolean {
  return /^[a-zA-Z0-9_-]{43}$/.test(address)
}

/**
 * Checks if an address is a valid Ethereum address format
 * @param address - The address to check
 * @returns true if the address matches Ethereum address format
 */
export function isEthereumAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

/**
 * Formats an address for display with appropriate truncation
 * @param address - The address to format
 * @param startChars - Number of characters to show at the start (default: 6)
 * @param endChars - Number of characters to show at the end (default: 4)
 * @returns Formatted address string
 */
export function formatAddressForDisplay(
  address: string,
  startChars = 6,
  endChars = 4,
): string {
  if (address.length <= startChars + endChars) {
    return address
  }

  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`
}

/**
 * Gets the address type from a string address
 * @param address - The address string
 * @returns The detected address type
 */
export function getAddressType(address: string): AddressType {
  if (isEthereumAddress(address)) {
    return 'ethereum'
  } else if (isArweaveAddress(address)) {
    return 'arweave'
  } else {
    // Default to arweave for unknown formats
    return 'arweave'
  }
}

/**
 * Validates if an address is valid for its detected type
 * @param address - The address to validate
 * @returns true if the address is valid for its type
 */
export function isValidAddress(address: string): boolean {
  const type = getAddressType(address)

  if (type === 'ethereum') {
    return isEthereumAddress(address)
  } else {
    return isArweaveAddress(address)
  }
}
