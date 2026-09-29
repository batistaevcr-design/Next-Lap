import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './legacy/styles.css'
import type { UserId } from './lib/types'
import { saveLocalState } from './react/storage'
import { useNextLap } from './react/useNextLap'
import { Navigation, type AppRoute } from './react/Navigation'
import { Activity, Add, Appearance, AuthScreen, Decide, Detail, Explore, Home, Mural, Profile, Splash, Surprise } from './react/AppScreens'

const queryClient = new QueryClient()

type Route = AppRoute | 'decide'|'surprise'|'appearance'|'activity'

function NextLapApp() {
  const api = useNextLap()
  const [route,setRoute] = useState<Route>('home')
  const [selectedId,setSelectedId] = useState<string | null>(null)
  const [profileUser,setProfileUser] = useState<UserId>('E')
  const [showSplash,setShowSplash] = useState(true)
  const [surpriseId,setSurpriseId] = useState<string | null>(null)
  const [appearanceTarget,setAppearanceTarget] = useState<'menu'|'splash'|'home'>('menu')

  useEffect(() => {
    // Keep the legacy prototype's storage format readable by the React app.
    // The initial state already imports it; React owns writes from this point on.
    saveLocalState(api.data)
  }, [])

  const navigate = (next: Route, id?: string) => {
    if (next === 'appearance') setAppearanceTarget('menu')
    setRoute(next)
    setSelectedId(id ?? null)
    if (next !== 'surprise') setSurpriseId(null)
  }

  const selected = selectedId ? api.data.items.find(i => i.id === selectedId) ?? null : null
  const surprised = surpriseId ? api.data.items.find(i => i.id === surpriseId) ?? null : null

  const chooseSurprise = () => navigate('decide')

  if (showSplash) return <Splash state={api.data} onEnter={() => setShowSplash(false)} />
  if (api.remoteEnabled && api.authLoading) return <div className="scr full paper" style={{display:'flex',alignItems:'center',justifyContent:'center',textAlign:'center',padding:28}}><div><div className="hand" style={{fontSize:44}}>NEXT LAP</div><p style={{color:'var(--mut)'}}>Preparando a corrida…</p></div></div>
  if (api.remoteEnabled && !api.authenticated) return <AuthScreen onSignIn={api.signIn} error={api.authError || api.syncError} />

  let content: ReactNode
  if (route === 'home') content = <Home state={api.data} onPhoto={v=>api.selectPhoto('home',v)} onNavigate={navigate} onSurprise={chooseSurprise}/>
  else if (route === 'add') content = <Add state={api.data} onBack={()=>navigate('home')} onSave={draft=>{api.addExperience(draft);navigate('explore')}}/>
  else if (route === 'explore') content = <Explore state={api.data} onNavigate={navigate} onUpdateViewed={id=>api.updateExperience(id,{lastViewedAt:new Date().toISOString()})}/>
  else if (route === 'detail' && selected) content = <Detail item={selected} state={api.data} onBack={()=>navigate('explore')} onUpdate={api.updateExperience} onDelete={id=>{api.deleteExperience(id);navigate('explore')}} onView={api.markViewed}/>
  else if (route === 'decide') content = <Decide state={api.data} onBack={()=>navigate('home')} onChoose={item=>{setSurpriseId(item.id);navigate('surprise')}}/>
  else if (route === 'surprise' && surprised) content = <Surprise item={surprised} state={api.data} onBack={()=>navigate('home')} onAgain={()=>navigate('decide')} onLive={id=>{api.markViewed(id);navigate('detail',id)}}/>
  else if (route === 'mural') content = <Mural state={api.data} onNavigate={navigate}/>
  else if (route === 'profile') content = <Profile state={api.data} user={profileUser} currentUser={api.currentUser} onSwitch={setProfileUser} onPhoto={v=>api.selectPhoto('profile',v,profileUser)} onBio={bio=>api.setProfileBio(profileUser,bio)} onNavigate={navigate} onSignOut={api.remoteEnabled ? api.signOut : undefined}/>
  else if (route === 'activity') content = <Activity state={api.data} onBack={()=>navigate('profile')} onNavigate={navigate}/>
  else if (route === 'appearance') content = <Appearance state={api.data} target={appearanceTarget} onBack={()=>navigate('profile')} onPhotoSplash={v=>api.selectPhoto('splash',v)} onSplashColor={v=>api.setBackgroundColor('splash',v)} onHomeColor={v=>api.setBackgroundColor('home',v)} onPhotoHome={v=>api.selectPhoto('home',v)} onSwitchScreen={screen=>setAppearanceTarget(screen)}/>
  else content = <Home state={api.data} onPhoto={()=>{}} onNavigate={navigate} onSurprise={chooseSurprise}/>

  return <div id="next-lap-react-root">
    {content}
    {!['add','detail','decide','surprise','appearance','activity'].includes(route) && <Navigation route={route as AppRoute} onNavigate={navigate}/>} 
  </div>
}

export default function App() {
  return <QueryClientProvider client={queryClient}><NextLapApp/></QueryClientProvider>
}
