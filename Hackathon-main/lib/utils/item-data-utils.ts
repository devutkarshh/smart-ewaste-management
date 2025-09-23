// Utility functions for handling real user data
export function hasRealValue(value: any): boolean {
  if (value === null || value === undefined || value === '') {
    return false
  }
  
  // Check for common placeholder/default values
  const placeholderValues = [
    'N/A', 'n/a', 'NA', 'na', 'Not specified', 'not specified',
    'Unknown', 'unknown', 'TBD', 'tbd', 'To be determined',
    'Not available', 'not available', 'None', 'none'
  ]
  
  if (typeof value === 'string' && placeholderValues.includes(value.trim())) {
    return false
  }
  
  // Check for obviously fake or template values
  if (typeof value === 'string' && value.trim().length === 0) {
    return false
  }
  
  return true
}

export function formatItemDetails(item: any) {
  const details: Array<{ label: string; value: string }> = []
  
  // Only include fields with real user data
  const fieldMappings = [
    { key: 'category', label: 'Category' },
    { key: 'brand', label: 'Brand' },
    { key: 'model', label: 'Model' },
    { key: 'condition', label: 'Condition', format: (val: any) => `${val}/10` },
    { key: 'purchase_date', label: 'Purchase Date' },
    { key: 'original_price', label: 'Original Price', format: (val: any) => `₹${val.toLocaleString()}` },
    { key: 'usage_pattern', label: 'Usage Pattern' },
    { key: 'storage_capacity', label: 'Storage' },
    { key: 'ram', label: 'RAM' },
    { key: 'processor', label: 'Processor' },
    { key: 'issues', label: 'Known Issues' },
    { key: 'accessories', label: 'Accessories' }
  ]
  
  fieldMappings.forEach(field => {
    if (hasRealValue(item[field.key])) {
      const value = field.format ? field.format(item[field.key]) : item[field.key]
      details.push({ label: field.label, value: String(value) })
    }
  })
  
  return details
}

export function getReporterInfo(item: any) {
  if (!item || !hasRealValue(item.reported_by)) {
    return null
  }
  
  return {
    email: item.reported_by,
    name: item.reporter_info?.name || null,
    role: item.reporter_info?.role || null
  }
}
