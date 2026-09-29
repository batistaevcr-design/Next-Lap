import './styles.css'
import legacySource from './prototype.js?raw'

let mounted = false

export function mountLegacyApp() {
  if (mounted) return
  const host = document.getElementById('legacy-app')
  if (!host) throw new Error('Host do Next Lap não encontrado.')

  // The approved prototype remains the visual reference. This is a deliberate
  // migration bridge: React/Vite owns the application shell while the approved
  // interaction layer is preserved intact during the first technical migration.
  host.innerHTML = '<div id="app"></div>'

  const script = document.createElement('script')
  script.type = 'text/javascript'
  script.textContent = legacySource
  host.appendChild(script)
  mounted = true
}
