const STORAGE_MONITORED_KEY = 'banshi_monitored_clients'
const STORAGE_ENABLED_KEY = 'banshi_enabled'

function renderClients(list) {
  const container = document.getElementById('clients')
  container.innerHTML = ''
  const keys = Object.keys(list || {})
  if (keys.length === 0) {
    container.innerHTML = '<div class="small">No monitored clients yet.</div>'
    return
  }
  keys.forEach(h => {
    const item = list[h]
    const el = document.createElement('div')
    el.className = 'client'
    el.innerHTML = `<div>
      <div style="font-weight:600">${item.name || h}</div>
      <div class="small">@${h}${item.last_synced ? ' • ' + new Date(item.last_synced).toLocaleString() : ''}</div>
    </div>
    <div>
      <button data-h="${h}" class="unmonitor">Unmonitor</button>
    </div>`
    container.appendChild(el)
  })
  Array.from(document.getElementsByClassName('unmonitor')).forEach(b => b.addEventListener('click', (e) => {
    const h = e.currentTarget.getAttribute('data-h')
    chrome.storage.local.get([STORAGE_MONITORED_KEY], (res) => {
      const m = (res && res[STORAGE_MONITORED_KEY]) ? res[STORAGE_MONITORED_KEY] : {}
      delete m[h]
      chrome.storage.local.set({ [STORAGE_MONITORED_KEY]: m }, () => renderClients(m))
    })
  }))
}

function init() {
  const linkBtn = document.getElementById('link')

  chrome.storage.local.get([STORAGE_MONITORED_KEY], (res) => {
    const m = (res && res[STORAGE_MONITORED_KEY]) ? res[STORAGE_MONITORED_KEY] : {}
    renderClients(m)
  })

  linkBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'OPEN_LINK_AND_ENABLE' }, (resp) => {
      // popup will close automatically, no further action
    })
  })
}

document.addEventListener('DOMContentLoaded', init)
