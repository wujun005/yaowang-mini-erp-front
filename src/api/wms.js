const TENANT_KEY = 'yaowang-mini-erp-tenant-id'

export function getTenantId() {
  return localStorage.getItem(TENANT_KEY) || '1'
}

export function setTenantId(value) {
  localStorage.setItem(TENANT_KEY, String(value || '1').trim() || '1')
}

function cleanPayload(payload = {}) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== null && value !== undefined)
  )
}

async function request(path, options = {}) {
  const headers = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...options.headers,
    'X-Tenant-Id': getTenantId()
  }

  const response = await fetch(path, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(cleanPayload(options.body)) : undefined
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const result = await response.json()

  if (result && result.success === false) {
    throw new Error(result.message || result.errorCode || '操作失败')
  }

  return result?.data
}

function post(path, body) {
  return request(path, {
    method: 'POST',
    body
  })
}

export const warehouseApi = {
  page(params) {
    return post('/api/admin/wms/warehouses/page', params)
  },
  detail(id) {
    return request(`/api/admin/wms/warehouses/${id}`)
  },
  save(payload) {
    return post('/api/admin/wms/warehouses/save', payload)
  },
  delete(id) {
    return post('/api/admin/wms/warehouses/delete', { id })
  }
}

export const shelfApi = {
  page(params) {
    return post('/api/admin/wms/shelves/page', params)
  },
  detail(id) {
    return request(`/api/admin/wms/shelves/${id}`)
  },
  save(payload) {
    return post('/api/admin/wms/shelves/save', payload)
  },
  delete(id) {
    return post('/api/admin/wms/shelves/delete', { id })
  }
}

export const layerApi = {
  page(params) {
    return post('/api/admin/wms/shelf-layers/page', params)
  },
  save(payload) {
    return post('/api/admin/wms/shelf-layers/save', payload)
  },
  delete(id) {
    return post('/api/admin/wms/shelf-layers/delete', { id })
  }
}

export const statusOptions = [
  { label: '启用', value: 1 },
  { label: '禁用', value: 0 }
]

export const shelfTypeOptions = [
  { label: '重型', value: 1 },
  { label: '轻型', value: 2 },
  { label: '流利式', value: 3 }
]

export const enabledOptions = [
  { label: '是', value: 1 },
  { label: '否', value: 0 }
]
