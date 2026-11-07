// Yahan apna Render/Backend URL daal sakte hain, ya Vercel ke Environment Variable mein:
const RAW_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const API_BASE_URL = RAW_BASE_URL.replace(/\/+$/, '')

const DEFAULT_STATE_KEY = 'default'

// --- Legacy / LocalStorage Functions ---
const LOCAL_STORAGE_KEY = 'hunter_app_state_legacy'

export function readLegacyState(defaultQuestData = {}) {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return {
      data: parsed.data || parsed,
      questData: parsed.questData || defaultQuestData
    }
  } catch (e) {
    console.error('Failed to read legacy local state', e)
    return null
  }
}

export function clearLegacyState() {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY)
  } catch (e) {
    console.error('Failed to clear legacy local state', e)
  }
}

// --- Cloud API Functions ---
export async function checkApiHealth() {
  const response = await fetch(`${API_BASE_URL}/api/health`)
  if (!response.ok) {
    throw new Error(`Health check failed with status ${response.status}`)
  }
  return response.json()
}

export async function loadCloudState(key = DEFAULT_STATE_KEY) {
  const params = new URLSearchParams({ key })
  const response = await fetch(`${API_BASE_URL}/api/state?${params.toString()}`)

  if (!response.ok) {
    throw new Error(`Cloud load failed with status ${response.status}`)
  }

  const result = await response.json()
  // Ensure it returns an object with data and questData
  return {
    data: result.data || null,
    questData: result.questData || null,
    updatedAt: result.updatedAt || null
  }
}

export async function saveCloudState(payload, key = DEFAULT_STATE_KEY) {
  const bodyData = {
    key,
    data: payload.data || payload,
    questData: payload.questData || {}
  }

  const response = await fetch(`${API_BASE_URL}/api/state`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bodyData),
  })

  if (!response.ok) {
    throw new Error(`Cloud save failed with status ${response.status}`)
  }

  return response.json()
}