const TENANT_KEY = 'yaowang-mini-erp-tenant-id'
const AUTH_KEY = 'yaowang-mini-erp-auth-session'

export function getTenantId() {
  return localStorage.getItem(TENANT_KEY) || '1'
}

export function setTenantId(value) {
  localStorage.setItem(TENANT_KEY, String(value || '1').trim() || '1')
}

export function getAuthSession() {
  try {
    const session = JSON.parse(localStorage.getItem(AUTH_KEY) || 'null')
    return session && session.token ? session : null
  } catch {
    return null
  }
}

export function setAuthSession(session) {
  const normalized = {
    token: session?.token || '',
    userId: session?.userId,
    userName: session?.userName || '',
    account: session?.account || '',
    tenantId: session?.tenantId
  }

  if (normalized.tenantId) {
    setTenantId(normalized.tenantId)
  }
  localStorage.setItem(AUTH_KEY, JSON.stringify(normalized))
}

export function clearAuthSession() {
  localStorage.removeItem(AUTH_KEY)
}

function cleanPayload(payload = {}) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== null && value !== undefined)
  )
}

function buildHeaders(headers = {}, includeJson = false) {
  const session = getAuthSession()
  const result = {
    ...(includeJson ? { 'Content-Type': 'application/json' } : {}),
    ...headers,
    'X-Tenant-Id': getTenantId()
  }

  if (session?.token) {
    result.Authorization = `Bearer ${session.token}`
  }
  if (session?.userId) {
    result['X-User-Id'] = String(session.userId)
  }
  if (session?.userName || session?.account) {
    result['X-User-Name'] = toHeaderValue(session.userName, session.account)
  }

  return result
}

function toHeaderValue(value, fallback = '') {
  const text = String(value || '')
  if (/^[\x20-\x7E]*$/.test(text)) {
    return text
  }

  const fallbackText = String(fallback || '')
  if (/^[\x20-\x7E]*$/.test(fallbackText)) {
    return fallbackText
  }

  return encodeURIComponent(text)
}

async function request(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: buildHeaders(options.headers, Boolean(options.body)),
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

async function requestForm(path, formData) {
  const response = await fetch(path, {
    method: 'POST',
    headers: buildHeaders(),
    body: formData
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

async function requestBlob(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: buildHeaders(options.headers)
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const contentType = response.headers.get('Content-Type') || ''
  if (contentType.includes('application/json')) {
    const result = await response.json()
    if (result && result.success === false) {
      throw new Error(result.message || result.errorCode || '操作失败')
    }
    throw new Error(result?.message || '文件下载失败')
  }

  return {
    blob: await response.blob(),
    fileName: parseFileName(response.headers.get('Content-Disposition'))
  }
}

function parseFileName(disposition = '') {
  const encodedMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (encodedMatch) {
    return decodeURIComponent(encodedMatch[1])
  }

  const match = disposition.match(/filename="?([^"]+)"?/i)
  return match?.[1]
}

function post(path, body) {
  return request(path, {
    method: 'POST',
    body
  })
}

export const authApi = {
  login(payload) {
    return post('/api/admin/auth/login', payload)
  },
  changePassword(payload) {
    return post('/api/admin/auth/change-password', payload)
  },
  resetPassword(payload) {
    return post('/api/admin/auth/reset-password', payload)
  }
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

export const productSkuApi = {
  page(params) {
    return post('/api/admin/product/skus/page', params)
  },
  detail(id) {
    return request(`/api/admin/product/skus/${id}`)
  },
  inventory(skuCode) {
    return post('/api/admin/product/skus/inventory', { skuCode })
  },
  downloadImportTemplate() {
    return requestBlob('/api/admin/product/skus/import/excel/template')
  },
  importExcel(file) {
    const formData = new FormData()
    formData.append('file', file)
    return requestForm('/api/admin/product/skus/import/excel', formData)
  },
  importExcelAndDownloadResult(file) {
    const formData = new FormData()
    formData.append('file', file)
    return requestBlob('/api/admin/product/skus/import/excel/result', {
      method: 'POST',
      body: formData
    })
  },
  delete(id) {
    return post('/api/admin/product/skus/delete', { id })
  }
}

export const productSpuApi = {
  page(params) {
    return post('/api/admin/product/spus/page', params)
  },
  detail(id) {
    return request(`/api/admin/product/spus/${id}`)
  },
  save(payload) {
    return post('/api/admin/product/spus/save', payload)
  }
}

export const categoryApi = {
  list(params) {
    return post('/api/admin/product/categories/list', params)
  },
  detail(id) {
    return request(`/api/admin/product/categories/${id}`)
  },
  save(payload) {
    return post('/api/admin/product/categories/save', payload)
  }
}

export const unitApi = {
  page(params) {
    return post('/api/admin/mst/units/page', params)
  },
  detail(id) {
    return request(`/api/admin/mst/units/${id}`)
  },
  save(payload) {
    return post('/api/admin/mst/units/save', payload)
  },
  delete(id) {
    return post('/api/admin/mst/units/delete', { id })
  }
}

export const operationLogApi = {
  page(params) {
    return post('/api/admin/operation-logs/page', params)
  }
}

export const inventoryApi = {
  page(params) {
    return post('/api/admin/wms/inventory/page', params)
  },
  edit(payload) {
    return post('/api/admin/wms/inventory/edit', payload)
  },
  downloadImportTemplate() {
    return requestBlob('/api/admin/wms/inventory/import/excel/template')
  },
  importExcel(file) {
    const formData = new FormData()
    formData.append('file', file)
    return requestBlob('/api/admin/wms/inventory/import/excel/result', {
      method: 'POST',
      body: formData
    })
  }
}

export const inventoryLogApi = {
  list(inventoryNo) {
    return post('/api/admin/wms/inventory/logs/list', { inventoryNo })
  }
}

export const materialApi = {
  page(params) {
    return post('/api/admin/generic/object/page', { ...params, bizType: 'PR_SOURCE' })
  },
  detail(id) {
    return request(`/api/admin/generic/object/${id}`)
  },
  save(payload) {
    return post('/api/admin/generic/object/save', { ...payload, bizType: 'PR_SOURCE' })
  },
  upload(file) {
    const formData = new FormData()
    formData.append('file', file)
    return requestForm('/api/open/openclaw/media/upload?bizType=material', formData)
  }
}

export const partnerApi = {
  page(params) {
    return post('/api/admin/partner/tenant/page', params)
  },
  detail(id) {
    return request(`/api/admin/partner/tenant/${id}`)
  },
  save(payload) {
    return post('/api/admin/partner/tenant/save', payload)
  },
  enable(id) {
    return post(`/api/admin/partner/tenant/enable/${id}`)
  },
  disable(id) {
    return post(`/api/admin/partner/tenant/disable/${id}`)
  },
  users(id) {
    return request(`/api/admin/partner/tenant/${id}/users`)
  },
  assignUser(id, payload) {
    return post(`/api/admin/partner/tenant/${id}/users/assign`, payload)
  },
  enableUser(id, userId) {
    return post(`/api/admin/partner/tenant/${id}/users/${userId}/enable`)
  },
  disableUser(id, userId) {
    return post(`/api/admin/partner/tenant/${id}/users/${userId}/disable`)
  },
  resetUserPassword(id, userId, payload) {
    return post(`/api/admin/partner/tenant/${id}/users/${userId}/reset-password`, payload)
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
