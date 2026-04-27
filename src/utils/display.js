export function formatCell(value) {
  if (value === null || value === undefined || value === '') {
    return '-'
  }
  return value
}

export function statusLabel(rowOrStatus) {
  if (rowOrStatus && typeof rowOrStatus === 'object' && rowOrStatus.statusLabel) {
    return rowOrStatus.statusLabel
  }

  const status = typeof rowOrStatus === 'object' ? rowOrStatus?.status : rowOrStatus
  if (Number(status) === 1) {
    return '启用'
  }
  if (Number(status) === 0) {
    return '禁用'
  }
  return '-'
}

export function productStatusLabel(rowOrStatus) {
  if (rowOrStatus && typeof rowOrStatus === 'object' && rowOrStatus.statusLabel) {
    return rowOrStatus.statusLabel
  }

  const status = typeof rowOrStatus === 'object' ? rowOrStatus?.status : rowOrStatus
  if (Number(status) === 1) {
    return '已上架'
  }
  if (Number(status) === 0) {
    return '未上架'
  }
  return '-'
}

export function statusTagType(status) {
  if (Number(status) === 1) {
    return 'success'
  }
  if (Number(status) === 0) {
    return 'info'
  }
  return 'warning'
}
