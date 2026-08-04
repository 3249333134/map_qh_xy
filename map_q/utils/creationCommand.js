export const CREATION_COMMAND_KEY = 'CREATION_COMMAND_V1'
export const CREATION_ACTIVE_DRAFT_KEY = 'CREATION_ACTIVE_DRAFT_V1'

export function setCreationCommand(command = {}) {
  const payload = { ...command, issuedAt: Date.now() }
  uni.setStorageSync(CREATION_COMMAND_KEY, payload)
  return payload
}

export function consumeCreationCommand() {
  try {
    const command = uni.getStorageSync(CREATION_COMMAND_KEY)
    if (!command) return null
    uni.removeStorageSync(CREATION_COMMAND_KEY)
    return command
  } catch (error) {
    return null
  }
}

export function setActiveCreationDraft(draftId) {
  uni.setStorageSync(CREATION_ACTIVE_DRAFT_KEY, draftId || '')
}

export function getActiveCreationDraft() {
  return uni.getStorageSync(CREATION_ACTIVE_DRAFT_KEY) || ''
}

