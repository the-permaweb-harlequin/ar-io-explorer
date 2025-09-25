// Utility functions for parquet data processing

// Convert hex string to base64url (Arweave format)
export const hexToBase64Url = (hex: string): string => {
  if (!hex) return ''
  try {
    // Remove any whitespace and convert to lowercase
    const cleanHex = hex.replace(/\s/g, '').toLowerCase()
    // Convert hex to bytes
    const bytes = new Uint8Array(
      cleanHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || [],
    )
    // Convert to base64
    const base64 = btoa(String.fromCharCode(...bytes))
    // Convert to base64url (replace + with -, / with _, remove padding =)
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  } catch (error) {
    console.error('Error converting hex to base64url:', error)
    return hex // Return original if conversion fails
  }
}

// Convert base64url to hex
export const base64UrlToHex = (base64url: string): string => {
  if (!base64url) return ''
  try {
    // Convert base64url to base64
    let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
    // Add padding if needed
    while (base64.length % 4) {
      base64 += '='
    }
    // Convert to bytes
    const bytes = new Uint8Array(
      atob(base64)
        .split('')
        .map((char) => char.charCodeAt(0)),
    )
    // Convert to hex
    return Array.from(bytes)
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('')
  } catch (error) {
    console.error('Error converting base64url to hex:', error)
    return base64url
  }
}

// Process Arrow result to convert binary fields
export const processArrowResult = (arrow: any): any[] => {
  if (!arrow || arrow.numRows === 0) {
    return []
  }

  const columnNames = arrow.schema.fields.map((field: any) => field.name)

  return Array.from({ length: arrow.numRows }, (_, i) => {
    const row: any = {}

    columnNames.forEach((columnName: string) => {
      const column = arrow.getChild(columnName)
      const value = column?.get(i)

      // Handle binary fields (BLOB types)
      if (value && typeof value === 'object' && 'buffer' in value) {
        const bytes = new Uint8Array(value.buffer)

        // Convert Arweave IDs to base64url
        if (
          [
            'id',
            'owner',
            'target',
            'anchor',
            'data_root',
            'parent',
            'root_transaction_id',
          ].includes(columnName)
        ) {
          const hex = Array.from(bytes)
            .map((byte) => byte.toString(16).padStart(2, '0'))
            .join('')
          row[columnName] = hexToBase64Url(hex)
        }
        // Convert text fields to strings
        else if (
          ['tag_name', 'tag_value', 'content_type'].includes(columnName)
        ) {
          row[columnName] = new TextDecoder().decode(bytes)
        }
        // Default: convert to hex
        else {
          row[columnName] = Array.from(bytes)
            .map((byte) => byte.toString(16).padStart(2, '0'))
            .join('')
        }
      } else {
        row[columnName] = value
      }
    })

    return row
  })
}

// Build WHERE clause for tag filters
export const buildTagFilters = (
  filters: Array<{
    name: string
    value?: string
    operator?: 'eq' | 'like' | 'in'
  }>,
): string => {
  if (filters.length === 0) return ''

  const conditions = filters.map((filter) => {
    const nameCondition = `CAST(tags.tag_name AS VARCHAR) = '${filter.name}'`

    if (!filter.value) {
      return nameCondition
    }

    const operator = filter.operator || 'eq'
    let valueCondition: string

    switch (operator) {
      case 'like':
        valueCondition = `CAST(tags.tag_value AS VARCHAR) LIKE '%${filter.value}%'`
        break
      case 'in':
        // eslint-disable-next-line no-case-declarations
        const values = Array.isArray(filter.value)
          ? filter.value
          : [filter.value]
        // eslint-disable-next-line no-case-declarations
        const quotedValues = values.map((v) => `'${v}'`).join(', ')
        valueCondition = `CAST(tags.tag_value AS VARCHAR) IN (${quotedValues})`
        break
      default:
        valueCondition = `CAST(tags.tag_value AS VARCHAR) = '${filter.value}'`
    }

    return `(${nameCondition} AND ${valueCondition})`
  })

  return conditions.join(' OR ')
}
