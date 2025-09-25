// ArFS-specific types and interfaces

export interface ArFSDriveMetadata {
  name: string
  rootFolderId: string
  isHidden: boolean
}

export interface ArFSDriveTags {
  ArFS: string
  Cipher?: string
  'Cipher-IV'?: string
  'Content-Type': 'application/json' | 'application/octet-stream'
  'Drive-Id': string
  'Drive-Privacy': 'public' | 'private'
  'Drive-Auth-Mode'?: 'password'
  'Entity-Type': 'drive'
  'Signature-Type'?: '1'
  'Unix-Time': string
}

export interface ArFSDrive {
  // Transaction info
  id: string
  owner: string
  height: bigint
  indexed_at: bigint
  data_size: bigint

  // ArFS-specific data
  driveId: string
  privacy: 'public' | 'private'
  arfsVersion: string
  unixTime: number
  contentType: 'application/json' | 'application/octet-stream'

  // Optional encryption info
  cipher?: string
  cipherIV?: string
  authMode?: 'password'
  signatureType?: '1'

  // Metadata (from transaction data)
  metadata?: ArFSDriveMetadata

  // Raw tags for debugging
  tags: Record<string, string>
}

export interface ArFSFolderTags {
  ArFS: string
  Cipher?: string
  'Cipher-IV'?: string
  'Content-Type': 'application/json' | 'application/octet-stream'
  'Drive-Id': string
  'Entity-Type': 'folder'
  'Folder-Id': string
  'Parent-Folder-Id'?: string
  'Unix-Time': string
}

export interface ArFSFileMetadata {
  name: string
  size: number
  lastModifiedDate: number
  dataTxId: string
  dataContentType: string
}

export interface ArFSFileTags {
  ArFS: string
  Cipher?: string
  'Cipher-IV'?: string
  'Content-Type': 'application/json' | 'application/octet-stream'
  'Drive-Id': string
  'Entity-Type': 'file'
  'File-Id': string
  'Parent-Folder-Id': string
  'Unix-Time': string
}

export interface ArFSQueryOptions {
  limit?: number
  offset?: number
  driveId?: string
  owner?: string
  privacy?: 'public' | 'private'
  arfsVersion?: string
  orderBy?: 'height' | 'unix_time'
  orderDirection?: 'ASC' | 'DESC'
}
