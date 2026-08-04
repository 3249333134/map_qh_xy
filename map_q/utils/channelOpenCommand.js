const KEY = 'CHANNEL_OPEN_COMMAND_V1'
let memoryCommand = null

export function setChannelOpenCommand(command) {
  const value = {
    channelId: String(command?.channelId || ''),
    source: command?.source || 'unknown',
    focusMessageId: command?.focusMessageId || '',
    focusThreadId: command?.focusThreadId || '',
    mapContext: command?.mapContext || null,
    createdAt: Date.now()
  }
  memoryCommand = value
  try { if (typeof uni !== 'undefined') uni.setStorageSync(KEY, value) } catch (e) {}
  return value
}

export function consumeChannelOpenCommand() {
  let value = memoryCommand
  try { if (typeof uni !== 'undefined') value = uni.getStorageSync(KEY) || value } catch (e) {}
  memoryCommand = null
  try { if (typeof uni !== 'undefined') uni.removeStorageSync(KEY) } catch (e) {}
  if (!value || Date.now() - Number(value.createdAt || 0) > 10 * 60 * 1000) return null
  return value
}
