import { Icon } from './icons'

export type AppRoute = 'home'|'explore'|'add'|'detail'|'mural'|'profile'

export function Navigation({ route, onNavigate }: { route: AppRoute; onNavigate: (route: AppRoute) => void }) {
  const item = (target: AppRoute, icon: 'home'|'mural'|'search'|'user', label: string) => (
    <button className={route === target ? 'on' : ''} onClick={() => onNavigate(target)}>
      <Icon name={icon} /><span>{label}</span>
    </button>
  )
  return <nav className="nav">
    {item('home', 'home', 'Início')}
    {item('mural', 'mural', 'Mural')}
    <button className="plus" onClick={() => onNavigate('add')}><Icon name="plus" /></button>
    {item('explore', 'search', 'Explorar')}
    {item('profile', 'user', 'Perfil')}
  </nav>
}
