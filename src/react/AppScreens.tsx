import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { ChangeEvent } from 'react'
import type { Experience, ExperienceStatus, UserId } from '../lib/types'
import { Icon } from './icons'
import { PhotoPicker } from './PhotoPicker'
import { CATEGORIES, DURATIONS, ExperienceDraft, STATUSES } from './useNextLap'

type Navigate = (route: 'home'|'explore'|'add'|'detail'|'mural'|'profile'|'decide'|'surprise'|'appearance'|'activity', id?: string) => void

const WANT_LABELS = ['Ideia aleatória','Seria legal','Queremos fazer','Queremos muito','PRECISAMOS FAZER ISSO']
const COST_FILTERS = [['Até R$50',50],['R$50–100',100],['R$100–200',200],['R$200+',1000000000],['Tanto faz',1000000000]] as const
const TIME_FILTERS = [['Até 1h',1],['1–2h',2],['2–4h',3],['Meio período',4],['Dia inteiro',5],['Tanto faz',9]] as const

function Avatar({ id, profiles, size = 44 }: { id: UserId; profiles: Record<UserId, { name: string; avatarUrl: string | null }>; size?: number }) {
  const p = profiles[id]
  return <div className={`av ${id}`} style={{ width: size, height: size, fontSize: size * .36, ...(p.avatarUrl ? { backgroundImage: `url(${p.avatarUrl})` } : {}) }}>
    {p.avatarUrl ? '' : id === 'E' ? 'E' : 'JP'}
  </div>
}

function BackHeader({ title, onBack, right }: { title: string; onBack: () => void; right?: ReactNode }) {
  return <div className="top">
    <button className="back" onClick={onBack} aria-label="Voltar"><Icon name="back" /></button>
    <h2 style={{ fontFamily: 'var(--serif)', fontSize: 20, flex: 1 }}>{title}</h2>
    {right}
  </div>
}

function fileToDataUrl(e: ChangeEvent<HTMLInputElement>, cb: (value: string) => void) {
  const file = e.target.files?.[0]
  if (!file || file.size > 6e6) return
  const reader = new FileReader()
  reader.onload = () => cb(String(reader.result))
  reader.readAsDataURL(file)
}

export function Splash({ state, onEnter }: { state: any; onEnter: () => void }) {
  const bg = state.splashCover
    ? `linear-gradient(180deg,rgba(240,244,255,.52) 0%,rgba(240,244,255,.16) 42%,rgba(6,31,68,.42) 100%),url(${state.splashCover}) center/cover no-repeat`
    : state.splashColor || '#eaf0ff'
  return <div className="scr full" style={{ padding: 0, background: bg }} onClick={onEnter}>
    <div className="splash-inner">
      <div className="splash-doodle" style={{ left: 0, top: 0, width: 80, height: 80, background: 'linear-gradient(135deg,rgba(66,103,255,.18),transparent 70%)', transform: 'rotate(-8deg)' }} />
      <div className="splash-doodle" style={{ right: 8, top: 10, color: '#4267ff' }}><Icon name="spark" /></div>
      <div className="splash-doodle" style={{ left: 8, top: 124, color: '#4267ff' }}><Icon name="star" /></div>
      <div className="splash-doodle" style={{ right: 8, top: 176, color: '#7357c8' }}><Icon name="heart" /></div>
      <div className="splash-head">
        <div className="splash-corner"><span><Avatar id="E" profiles={state.profiles} size={30} /></span><span><Avatar id="J" profiles={state.profiles} size={30} /></span><span className="tiny" style={{ color: '#4267ff' }}><Icon name="spark" /></span><span className="tiny j" style={{ color: '#7357c8' }}><Icon name="heart" /></span></div>
        <div className="splash-side"><span className="mini"><Icon name="mic" /></span><span className="mini p"><Icon name="star" /></span></div>
        <div className="splash-mark"><Icon name="mic" /></div>
        <div className="splash-logo">NEXT<br/>LAP</div>
        <div className="splash-stamp">EVY × JP</div>
      </div>
      <div className="splash-quotes">
        <div className="splash-quote e"><div className="qbody"><div className="qi"><Icon name="spark" /></div><div className="q">“I need a change, and I need it fast.”</div></div></div>
        <div className="splash-quote j"><div className="qbody"><div className="qi"><Icon name="heart" /></div><div className="q">“We’re driving toward the morning sun.”</div></div></div>
      </div>
      <div className="splash-enter"><span>entrar</span><button className="splash-cta" aria-label="Entrar" onClick={e => { e.stopPropagation(); onEnter() }}><Icon name="arr" /></button></div>
    </div>
  </div>
}

export function AuthScreen({ onSignIn, error }: { onSignIn: (email: string, password: string) => Promise<void>; error: string }) {
  const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [busy,setBusy]=useState(false)
  const submit=async()=>{ if(!email.trim()||!password){return} setBusy(true); try{await onSignIn(email.trim(),password)}catch{} finally{setBusy(false)} }
  return <div className="scr full paper" style={{padding:24,display:'flex',flexDirection:'column',justifyContent:'center'}}>
    <div style={{textAlign:'center',marginBottom:28}}><div className="hand" style={{fontSize:64,lineHeight:.82,transform:'rotate(-3deg)'}}>NEXT<br/>LAP</div><div style={{fontSize:12,color:'var(--mut)',marginTop:14}}>Entra para continuar.</div></div>
    <label className="lab">E-mail</label><input className="field" type="email" autoComplete="email" placeholder="seu e-mail" value={email} onChange={e=>setEmail(e.target.value)}/>
    <label className="lab">Senha</label><input className="field" type="password" autoComplete="current-password" placeholder="sua senha" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')void submit()}}/>
    {error && <div style={{fontSize:12,color:'#a33',background:'#ffecec',padding:10,borderRadius:8,marginTop:10}}>{error}</div>}
    <button className="btn" style={{marginTop:18}} onClick={submit} disabled={busy}>{busy?'Entrando…':'Entrar'}</button>
  </div>
}

export function Home({ state, onPhoto, onNavigate, onSurprise }: { state: any; onPhoto: (value: string) => void; onNavigate: Navigate; onSurprise: () => void }) {
  const up = state.items.filter((i: Experience) => i.status !== 'Vivido' && i.status !== 'Arquivado').slice(0,3)
  const profileCard = (id: UserId) => { const p = state.profiles[id]; return <div style={{ flex: 1, textAlign: 'center' }}>
    <Avatar id={id} profiles={state.profiles} size={78} />
    <b style={{ display:'block', fontSize:14, marginTop:8 }}>{p.name} <span style={{ color: id==='E' ? 'var(--blue)' : 'var(--purple)', fontSize:10 }}>●</span></b>
    <div style={{ fontSize:11.5, color:'var(--mut)', marginTop:3, padding:'0 6px' }}>“{p.bio}”</div>
  </div> }
  return <div className="scr paper">
    <div className="top" style={{ alignItems:'flex-start', marginBottom:8 }}>
      <div><div className="hand" style={{fontSize:34,lineHeight:.9,fontStyle:'italic',color:'var(--navy)',transform:'rotate(-3deg)'}}>NEXT LAP,</div><div className="hand" style={{fontSize:31,lineHeight:1,color:'var(--navy)',transform:'rotate(-3deg)',marginTop:4}}>A próxima volta<br/>começa aqui. <span style={{color:'var(--blue)',fontSize:22}}>〰</span></div></div>
      <div className="row" style={{ gap:0 }}><Avatar id="E" profiles={state.profiles} size={34}/><span style={{marginLeft:-9}}><Avatar id="J" profiles={state.profiles} size={34}/></span></div>
    </div>
    <div className="row" style={{alignItems:'flex-start',margin:'22px 0 24px'}}>{profileCard('E')}<div style={{width:1,alignSelf:'stretch',background:'var(--line)'}}/>{profileCard('J')}</div>
    <b style={{fontSize:15}}>Em destaque pra vocês</b>
    <div className="card" style={{margin:'10px 0 24px',height:170, ...(state.coverColor ? {background:state.coverColor} : {})}} onClick={onSurprise}>
      <div className="tape" style={{left:'9%',transform:'rotate(-38deg)'}}/><div className="tape" style={{left:'92%',transform:'rotate(38deg)'}}/>
      <div style={{position:'absolute',inset:0,borderRadius:6, ...(state.cover ? {background:`url(${state.cover}) center/cover`} : {}),display:'flex',alignItems:'center',justifyContent:'center',paddingBottom:34,color:'#7a86a3',flexDirection:'column',gap:6}}>{!state.cover && <><Icon name="cam"/></>}</div>
      <div style={{position:'absolute',left:14,bottom:12,right:60, ...(state.cover ? {color:'#fff',textShadow:'0 1px 6px #0009'} : {color:'var(--navy)'})}}><b style={{display:'block',fontSize:15}}>Surpreenda a gente</b><small style={{fontSize:12,opacity:.85}}>Qual será a próxima?</small></div>
      <span style={{position:'absolute',right:12,bottom:12,width:36,height:36,borderRadius:'50%',background:'#fff',border:'1px solid var(--line)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--navy)'}}><Icon name="arr"/></span>
    </div>
    <b style={{fontSize:15}}>O que vem por aí?</b>
    <div className="row" style={{marginTop:14,alignItems:'flex-start',gap:8}}>{[0,1,2].map(n=>{const i=up[n]; return <div key={n} className="pol" style={{transform:`rotate(${[-2,1.5,-1.5][n]}deg)`,padding:'6px 6px 16px',flex:1}} onClick={()=>i && onNavigate('detail',i.id)}><div className="tape" style={{width:34,marginLeft:-17,top:-7}}/>{i?.imageUrl ? <div className="ph has" style={{aspectRatio:'1/1',backgroundImage:`url(${i.imageUrl})`}}/> : <div className="ph" style={{aspectRatio:'1/1'}}><Icon name="cam"/></div>}{i && <b style={{fontSize:16}}>{i.title}</b>}</div>})}</div>
    <div className="ck" style={{right:-10,bottom:-10,width:80,height:90,transform:'scaleX(-1) rotate(-8deg)'}}/>
    <label className="row" style={{justifyContent:'center',margin:'24px auto 0',fontSize:12,color:'var(--blue)',cursor:'pointer'}}><Icon name="cam"/> Personalizar capa<input hidden type="file" accept="image/*" onChange={e=>fileToDataUrl(e,onPhoto)}/></label>
  </div>
}

export function Add({ state, onBack, onSave }: { state:any; onBack:()=>void; onSave:(draft:ExperienceDraft)=>void }) {
  const [draft, setDraft] = useState<ExperienceDraft>(() => ({ title:'', category:'Comer', wantLevel:3, importance:2, costMin:null, costMax:null, duration:null, location:'', externalUrl:null, reason:null, description:null, imageUrl:null, status:'Ideia', plannedDate:null, scheduledDate:null, notes:null, updatedAt:new Date().toISOString(), updatedBy:'E', lastViewedAt:null }))
  const patch = (p: Partial<ExperienceDraft>) => setDraft(d => ({...d,...p}))
  const save = () => { if (!draft.title?.trim()) { window.alert('Dê um título para a experiência.'); return } onSave(draft) }
  return <div className="scr full paper" style={{padding:0}}>
    <div style={{height:270,background:'#1b1712',position:'relative'}}>
      <PhotoPicker value={draft.imageUrl} onChange={v=>patch({imageUrl:v})} className="ph" style={{position:'absolute',inset:0,backgroundColor:'#1b1712',border:0,color:'#cfd6ea'}}/>
      <button onClick={onBack} style={{position:'absolute',left:16,top:16,color:'#fff',zIndex:3}}><Icon name="x"/></button>
      <button onClick={save} style={{position:'absolute',right:16,top:14,background:'#fff',borderRadius:18,padding:'8px 18px',fontWeight:600,fontSize:13,zIndex:3}}>Salvar</button>
    </div>
    <div style={{padding:'0 20px 20px',position:'relative'}}>
      <div style={{margin:'-38px 0 0',background:'#fbf9f1',padding:'14px 16px',boxShadow:'0 6px 16px #0003',transform:'rotate(-2deg)',position:'relative',zIndex:2}}><div className="tape" style={{left:'20%',top:-9}}/>
        <input style={{fontFamily:'var(--hand)',fontWeight:700,fontSize:28,border:0,outline:0,width:'100%',background:'transparent',color:'var(--navy)'}} placeholder="Nome da experiência" value={draft.title ?? ''} onChange={e=>patch({title:e.target.value})}/>
        <div className="row" style={{marginTop:4,fontSize:12,color:'var(--mut)'}}><Icon name="pin"/><input style={{border:0,outline:0,background:'transparent',fontSize:12,flex:1}} placeholder="Adicionar localização" value={draft.location ?? ''} onChange={e=>patch({location:e.target.value})}/></div>
      </div>
      <span className="lab">Categoria</span><div className="cats">{CATEGORIES.map(([c,i])=><button key={c} className={`cat ${draft.category===c?'on':''}`} onClick={()=>patch({category:c})}><span><Icon name={i as any}/></span>{c}</button>)}</div>
      <span className="lab">Quando?</span><div className="row" style={{flexWrap:'wrap'}}>{[['Ideia','Ideia'],['Planejado','Em breve'],['Agendado','Agendado'],['Vivido','Já vivemos']].map(([status,label])=><button key={status} className={`chip ${draft.status===status?'on':''}`} onClick={()=>patch({status:status as ExperienceStatus})}>{label}</button>)}</div>
      <span className="lab">Quanto queremos fazer isso?</span><div className="row" style={{gap:6,flexWrap:'wrap'}}>{[1,2,3,4,5].map(n=><button key={n} className={`chip ${draft.wantLevel===n?'on':''}`} style={{padding:'7px 9px'}} onClick={()=>patch({wantLevel:n as Experience['wantLevel']})}>{'🔥'.repeat(n)}</button>)}</div><small style={{color:'var(--mut)',fontSize:12}}>{WANT_LABELS[draft.wantLevel-1]}</small>
      <span className="lab">Importância</span><div className="row">{[['Baixa',1],['Média',2],['Alta',3]].map(([a,n])=><button key={String(a)} className={`chip ${draft.importance===n?'on':''}`} onClick={()=>patch({importance:n as Experience['importance']})}>{a}</button>)}</div>
      <span className="lab">Custo estimado para o casal</span><div className="row"><input className="field" type="number" min="0" inputMode="numeric" placeholder="R$ mín" value={draft.costMin ?? ''} onChange={e=>patch({costMin:e.target.value===''?null:Number(e.target.value)})}/><span>–</span><input className="field" type="number" min="0" inputMode="numeric" placeholder="R$ máx" value={draft.costMax ?? ''} onChange={e=>patch({costMax:e.target.value===''?null:Number(e.target.value)})}/></div>
      <span className="lab">Duração</span><div className="row" style={{flexWrap:'wrap',gap:8}}>{DURATIONS.map(([label,key])=><button key={key} className={`chip ${draft.duration===key?'on':''}`} onClick={()=>patch({duration:draft.duration===key?null:key})}>{label}</button>)}</div>
      <span className="lab">Outros detalhes <small style={{fontWeight:400,color:'var(--mut)'}}>opcional</small></span>
      <textarea className="field" rows={3} placeholder="Por que vocês querem fazer isso?" value={draft.reason ?? ''} onChange={e=>patch({reason:e.target.value})} style={{resize:'vertical'}}/>
      <div style={{height:30}}/>
    </div><div className="ck" style={{right:0,bottom:0,width:70,height:80,transform:'scaleX(-1) rotate(-6deg)'}}/>
  </div>
}

export function Explore({ state, onNavigate, onUpdateViewed }: { state:any; onNavigate:Navigate; onUpdateViewed:(id:string)=>void }) {
  const [q,setQ] = useState(''); const [cat,setCat] = useState('Todos'); const [status,setStatus] = useState('Todos'); const [cost,setCost] = useState(4)
  const filtered = useMemo(()=>state.items.filter((i:Experience)=> (cat==='Todos'||i.category===cat) && (status==='Todos'||i.status===status) && i.title.toLowerCase().includes(q.toLowerCase()) && ((cost===4)||((i.costMax ?? i.costMin ?? 0) <= (COST_FILTERS[cost]?.[1] ?? 1e9)))),[state.items,cat,status,q,cost])
  return <div className="scr paper">
    <h1 style={{fontFamily:'var(--sans)',fontWeight:700,fontSize:28,margin:'6px 0 14px'}}>Nossa lista</h1>
    <div className="row" style={{background:'#fff',border:'1px solid var(--line)',borderRadius:12,padding:'0 12px',color:'var(--mut)'}}><Icon name="search"/><input className="field" style={{border:0}} placeholder="Buscar experiências, lugares..." value={q} onChange={e=>setQ(e.target.value)}/></div>
    <div className="row" style={{margin:'14px 0',overflowX:'auto'}}>{['Todos',...CATEGORIES.map(x=>x[0])].map(c=><button key={c} className={`chip ${cat===c?'on':''}`} onClick={()=>setCat(c)}>{c}</button>)}</div>
    <div className="row" style={{marginBottom:14,overflowX:'auto'}}>{['Todos',...STATUSES].map(s=><button key={s} className={`chip ${status===s?'on':''}`} onClick={()=>setStatus(s)}>{s}</button>)}</div>
    <div className="row" style={{marginBottom:18,overflowX:'auto'}}>{COST_FILTERS.map(([label],idx)=><button key={label} className={`chip ${cost===idx?'on':''}`} onClick={()=>setCost(idx)}>{label}</button>)}</div>
    {filtered.length ? filtered.map((i:Experience)=><div key={i.id} style={{background:'#fff',border:'1px solid var(--line)',borderRadius:10,padding:10,marginBottom:14}} onClick={()=>{onUpdateViewed(i.id);onNavigate('detail',i.id)}}>
      <div style={{height:120,borderRadius:6,overflow:'hidden',background:'#dfe5f1'}}>{i.imageUrl ? <div style={{height:'100%',background:`url(${i.imageUrl}) center/cover`}}/> : <div className="ph" style={{height:'100%'}}><Icon name="cam"/></div>}</div>
      <div className="row" style={{marginTop:10}}><div style={{flex:1}}><b style={{fontSize:14}}>{i.title}</b><div style={{fontSize:12,color:'var(--mut)'}}>{i.category}{i.location?' · '+i.location:''}</div><div className="row" style={{gap:5,marginTop:7,flexWrap:'wrap'}}><span className="chip" style={{padding:'4px 9px'}}>{i.status}</span><span className="chip" style={{padding:'4px 9px'}}>{'🔥'.repeat(i.wantLevel)}</span>{i.costMin!=null||i.costMax!=null?<span className="chip" style={{padding:'4px 9px'}}>R${i.costMax ?? i.costMin}</span>:null}</div></div><span style={{color:'var(--navy)'}}><Icon name="bm"/></span></div>
    </div>) : <div style={{textAlign:'center',padding:'54px 20px',color:'var(--mut)'}}><Icon name="spark"/><p style={{marginTop:10}}>Nada encontrado com esses filtros.</p><button className="btn o" style={{margin:'16px auto 0'}} onClick={()=>{setQ('');setCat('Todos');setStatus('Todos');setCost(4)}}>Limpar filtros</button></div>}
  </div>
}

export function Detail({ item, state, onBack, onUpdate, onDelete, onView }: { item: Experience; state:any; onBack:()=>void; onUpdate:(id:string,patch:Partial<Experience>)=>void; onDelete:(id:string)=>void; onView:(id:string)=>void }) {
  const [editing,setEditing] = useState(false)
  const [title,setTitle] = useState(item.title); const [status,setStatus] = useState(item.status); const [reason,setReason] = useState(item.reason ?? ''); const [date,setDate] = useState(item.scheduledDate ?? item.plannedDate ?? '')
  const save = () => { onUpdate(item.id,{title:title.trim()||item.title,status,reason, ...(status==='Agendado'?{scheduledDate:date || null}:{plannedDate:date || null})}); setEditing(false) }
  return <div className="scr full paper" style={{paddingTop:20}}>
    <div className="top"><button className="back" onClick={onBack}><Icon name="back"/></button><span className="hand" style={{fontSize:32,fontStyle:'italic',transform:'rotate(-3deg)',flex:1}}>Experiência</span><button onClick={()=>setEditing(v=>!v)}>{editing?<Icon name="x"/>:<Icon name="pen"/>}</button></div>
    {item.imageUrl ? <div style={{height:260,background:`url(${item.imageUrl}) center/cover`,borderRadius:8,marginBottom:12}}/> : <div className="card" style={{height:260,marginBottom:12,display:'flex',alignItems:'center',justifyContent:'center'}}><Icon name="cam"/></div>}
    {editing ? <input className="field" style={{fontFamily:'var(--hand)',fontSize:32,fontWeight:700,color:'var(--navy)'}} value={title} onChange={e=>setTitle(e.target.value)}/> : <div className="hand" style={{fontSize:42,lineHeight:1,color:'var(--navy)',transform:'rotate(-2deg)'}}>{item.title}</div>}
    <div className="row" style={{margin:'10px 0 16px',flexWrap:'wrap'}}><span className="chip on">{item.category}</span>{item.location&&<span className="chip">📍 {item.location}</span>}{(item.costMin!=null||item.costMax!=null)&&<span className="chip">💸 R${item.costMax ?? item.costMin}</span>}</div>
    {editing ? <>
      <span className="lab">Status</span><div className="row" style={{flexWrap:'wrap',gap:8}}>{STATUSES.map(s=><button key={s} className={`chip ${status===s?'on':''}`} onClick={()=>setStatus(s)}>{s}</button>)}</div>
      <span className="lab">Data <small style={{fontWeight:400,color:'var(--mut)'}}>opcional</small></span><input className="field" type="date" value={date} onChange={e=>setDate(e.target.value)}/>
      <span className="lab">Motivo / memória</span><textarea className="field" rows={4} value={reason} onChange={e=>setReason(e.target.value)} />
      <button className="btn" style={{marginTop:20}} onClick={save}>Salvar alterações</button>
      <button className="btn o" style={{margin:'10px auto 0'}} onClick={()=>onDelete(item.id)}>Excluir experiência</button>
    </> : <>
      <div className="stat"><div><b>{item.wantLevel}</b><span>desejo</span></div><div><b>{item.importance}</b><span>importância</span></div><div><b>{item.status}</b><span>status</span></div></div>
      {item.reason && <div style={{background:'#f3eedf',padding:14,margin:'18px 0',fontFamily:'var(--hand)',fontSize:22,transform:'rotate(-1deg)'}}>“{item.reason}”</div>}
      <div style={{fontSize:12,color:'var(--mut)',lineHeight:1.45,marginTop:16}}>Adicionada por {state.profiles[item.createdBy].name}. {item.updatedBy && <>Última alteração por {state.profiles[item.updatedBy].name}.</>}</div>
      <button className="btn" style={{marginTop:20}} onClick={()=>onView(item.id)}>{item.status==='Vivido'?'Adicionar novamente como vivido':'Marcar como vivido'}</button>
      <button className="btn o" style={{margin:'10px auto 0'}} onClick={()=>setEditing(true)}>Editar experiência</button>
    </>}
  </div>
}

export function Decide({ state, onBack, onChoose }: { state:any; onBack:()=>void; onChoose:(item:Experience)=>void }) {
  const [budget,setBudget]=useState(4); const [time,setTime]=useState(5); const [low,setLow]=useState(false)
  const calculate = () => {
    const ceiling = Math.min(COST_FILTERS[budget][1], low ? 50 : 1000000000)
    const timeMax = TIME_FILTERS[time][1]
    const durationRank = (x: Experience['duration']) => DURATIONS.find(d => d[1] === x)?.[2] ?? 0
    const now = Date.now()
    const candidates = state.items.filter((i:Experience) => {
      if (i.status==='Arquivado') return false
      if (i.status==='Vivido' && i.lastViewedAt && now-new Date(i.lastViewedAt).getTime()<30*86400000) return false
      const cost=i.costMax ?? i.costMin
      if (cost!=null && cost>ceiling) return false
      const rank=durationRank(i.duration)
      if (rank && rank>timeMax) return false
      if (low && cost!=null && cost>50) return false
      return true
    })
    if (!candidates.length) return
    const scored = candidates.map((i:Experience) => {
      const dormant = Math.min(90,(now-new Date(i.lastViewedAt || i.updatedAt).getTime())/86400000)
      let score=i.wantLevel*5+i.importance*4+dormant/9+(i.status==='Planejado'?3:0)
      if (low && (i.costMax ?? i.costMin ?? 0)===0) score+=8
      if ((i.costMax ?? i.costMin)==null) score+=1
      return {item:i,score}
    }).sort((a:any,b:any)=>b.score-a.score)
    const top=scored.slice(0,Math.min(3,scored.length))
    onChoose(top[Math.floor(Math.random()*top.length)].item)
  }
  return <div className="scr full dk" style={{padding:24,display:'flex',flexDirection:'column'}}>
    <BackHeader title="Decidir" onBack={onBack} right={<Icon name="x"/>}/>
    <div className="hand" style={{fontSize:42,lineHeight:1,margin:'10px 0 26px',transform:'rotate(-2deg)'}}>Deixa o destino decidir.</div>
    <b style={{fontSize:14}}>💰 Quanto queremos gastar?</b><div className="row" style={{flexWrap:'wrap',gap:8,margin:'10px 0 22px'}}>{COST_FILTERS.map(([label],i)=><button key={label} className={`dc ${budget===i?'on':''}`} onClick={()=>setBudget(i)}>{label}</button>)}</div>
    <b style={{fontSize:14}}>⏱️ Quanto tempo temos?</b><div className="row" style={{flexWrap:'wrap',gap:8,margin:'10px 0 22px'}}>{TIME_FILTERS.map(([label],i)=><button key={label} className={`dc ${time===i?'on':''}`} onClick={()=>setTime(i)}>{label}</button>)}</div>
    <button className={`dc ${low?'on':''}`} style={{borderRadius:14,textAlign:'left',padding:'12px 16px',width:'100%'}} onClick={()=>setLow(v=>!v)}><b>Low Cost</b><br/><small style={{opacity:.75}}>Prioriza experiências grátis ou baratinhas</small></button>
    <div style={{flex:1}}/><button className="btn w" onClick={calculate}>Deixa comigo</button>
  </div>
}

export function Surprise({ item, state, onBack, onAgain, onLive }: { item: Experience; state:any; onBack:()=>void; onAgain:()=>void; onLive:(id:string)=>void }) {
  const d=Math.floor((Date.now()-new Date(item.createdAt).getTime())/86400000)
  const cost=item.costMax!=null?`R$${item.costMax}`:item.costMin!=null?`R$${item.costMin}`:''
  return <div className="scr full dk" style={{padding:24,display:'flex',flexDirection:'column',...(item.imageUrl?{background:`linear-gradient(#061F44cc,#061F44f2),url(${item.imageUrl}) center/cover`}:{})}}>
    <div className="top"><span className="hand" style={{fontSize:32,fontStyle:'italic',transform:'rotate(-4deg)'}}>NEXT LAP</span><button onClick={onBack}><Icon name="x"/></button></div>
    <div style={{flex:1,display:'flex',flexDirection:'column',justifyContent:'center'}}><div className="hand" style={{fontSize:26,color:'#aab8dd',transform:'rotate(-3deg)'}}>A próxima volta de vocês é...</div><div className="hand" style={{fontSize:54,lineHeight:1,margin:'6px 0 14px',transform:'rotate(-3deg)'}}>{item.title}</div><div style={{fontSize:20}}>{'🔥'.repeat(item.wantLevel)}</div><div style={{fontSize:13,color:'#dbe4ff',margin:'2px 0 14px'}}>{WANT_LABELS[item.wantLevel-1]}</div><div className="row" style={{flexWrap:'wrap',gap:8}}><span className="dc">{item.category}</span>{item.location&&<span className="dc">📍 {item.location}</span>}{cost&&<span className="dc">💸 {cost}</span>}</div><div style={{fontSize:13,color:'#b7c4e6',marginTop:18,lineHeight:1.4}}>Vocês adicionaram essa ideia {d<1?'hoje':`há ${d} dias`}.<br/>Talvez seja hora.</div></div>
    <button className="btn w" onClick={()=>onLive(item.id)}>Vamos!</button><button className="btn" style={{background:'transparent',border:'1px solid #ffffff66',marginTop:10}} onClick={onAgain}>Outra</button>
  </div>
}

export function Mural({ state, onNavigate }: { state:any; onNavigate:Navigate }) {
  const items=state.items.filter((i:Experience)=>i.status==='Vivido')
  return <div className="scr dk" style={{padding:'20px 0 30px'}}><div className="top" style={{padding:'0 20px'}}><button className="back" onClick={()=>onNavigate('home')}><Icon name="back"/></button><span className="hand" style={{fontSize:34,flex:1,fontStyle:'italic',transform:'rotate(-3deg)'}}>Nosso Mural</span><span style={{color:'var(--lav)'}}><Icon name="pen"/></span></div>
    <div style={{padding:'10px 20px'}}><div className="note" style={{position:'relative',left:'auto',top:'auto',width:160,margin:'10px auto 24px',transform:'rotate(2deg)',fontSize:22}}>Grandes planos ♡</div>
      {items.length ? <div className="row" style={{alignItems:'flex-start',flexWrap:'wrap',gap:16}}>{items.map((i:Experience,n:number)=><div key={i.id} className="pol" style={{width:'calc(50% - 8px)',transform:`rotate(${n%2?1.5:-2}deg)`}} onClick={()=>onNavigate('detail',i.id)}>{i.imageUrl?<div className="ph has" style={{aspectRatio:'1/1',backgroundImage:`url(${i.imageUrl})`}}/>:<div className="ph" style={{aspectRatio:'1/1'}}><Icon name="cam"/></div>}<b>{i.title}</b><small>{i.location||i.category}</small></div>)}</div> : <div style={{textAlign:'center',padding:'40px 20px',color:'#b7c4e6'}}>Ainda não tem memórias por aqui.<br/>Marquem uma experiência como vivida.</div>}
    </div>
  </div>
}

export function Profile({ state, user, currentUser, onSwitch, onPhoto, onBio, onNavigate, onSignOut }: { state:any; user:UserId; currentUser:UserId|null; onSwitch:(id:UserId)=>void; onPhoto:(value:string)=>void; onBio:(bio:string)=>void; onNavigate:Navigate; onSignOut?:()=>Promise<void> }) {
  const p=state.profiles[user]; const ac=user==='E'?'var(--blue)':'var(--purple)'; const n=state.items.length; const v=state.items.filter((i:Experience)=>i.status==='Vivido').length; const pl=new Set(state.items.map((i:Experience)=>i.location).filter(Boolean)).size; const canEdit=!onSignOut || user===currentUser
  return <div className="scr" style={{background:user==='E'?'radial-gradient(at 0 0,#b9caff,transparent 45%),radial-gradient(at 100% 40%,#dbe4ff,transparent 50%),#eef2ff':'radial-gradient(at 100% 0,#d5c6ff,transparent 50%),radial-gradient(at 0 60%,#e6dcff,transparent 55%),#f3eeff',textAlign:'center',paddingBottom:40}}>
    <div className="top"><div className="row" style={{gap:8}}><button onClick={()=>onSwitch('E')} style={{opacity:user==='E'?1:.45}}><Avatar id="E" profiles={state.profiles} size={32}/></button><button onClick={()=>onSwitch('J')} style={{opacity:user==='J'?1:.45}}><Avatar id="J" profiles={state.profiles} size={32}/></button></div><button style={{color:'var(--navy)'}} onClick={()=>onNavigate('appearance')}><Icon name="sett"/></button></div>
    {user==='E'&&<div className="ck" style={{left:0,top:0,width:90,height:100,opacity:.85}}/>}
    <div className="pol" style={{width:215,margin:'12px auto 0',transform:'rotate(-2deg)',opacity:canEdit?1:.72}}><div className="tape" style={{background:user==='E'?'rgba(190,200,255,.8)':'rgba(201,180,255,.8)'}}/>{canEdit ? <PhotoPicker value={p.avatarUrl} onChange={onPhoto}/> : <div className="ph has" style={{height:205,backgroundImage:p.avatarUrl?`url(${p.avatarUrl})`:undefined}}>{!p.avatarUrl&&<span style={{fontFamily:'var(--hand)',fontSize:54,color:ac}}>{user==='E'?'E':'JP'}</span>}</div>}</div>
    <div className="hand" style={{fontSize:40,marginTop:16,color:'var(--navy)',lineHeight:1}}>{p.name} <span style={{color:ac,fontSize:18}}>●</span></div>
    <div className="hand" style={{fontSize:23,color:'var(--navy)',lineHeight:1,marginTop:4}}>“{p.bio}”</div>
    <button className="btn o" style={{margin:'16px auto',display:'block'}} onClick={()=>onNavigate('appearance')}>Editar perfil</button>{onSignOut && !canEdit && <div style={{fontSize:11,color:'var(--mut)',marginBottom:12}}>Você está vendo o perfil de {p.name}. Para editar, alterne para o seu perfil.</div>}
    <div style={{textAlign:'left'}}><b style={{fontFamily:'var(--serif)',fontSize:15}}>Sobre mim</b><div className="row" style={{marginTop:6,color:'#4a5573',gap:8}}><span style={{color:ac}}>◎</span><input className="field" style={{fontSize:12.5,padding:6}} maxLength={60} value={p.bio} disabled={!canEdit} onChange={e=>onBio(e.target.value)}/></div></div>
    <div style={{textAlign:'left',marginTop:20}}><b style={{fontFamily:'var(--serif)',fontSize:15}}>Nossa história</b><div className="stat">{[[n,'experiências'],[v,'vividas'],[pl,'lugares'],[n-v,'ainda']].map(([a,b])=><div key={String(b)}><b>{a}</b><span>{b}</span></div>)}</div></div>
    <div className="hand" style={{textAlign:'right',color:ac,fontSize:20,marginTop:8,lineHeight:1,transform:'rotate(-3deg)'}}>e o melhor...<br/>vem por aí!</div>
    <button className="row" style={{margin:'14px auto 0',color:'var(--navy)',fontSize:13}} onClick={()=>onNavigate('activity')}>Atividade <Icon name="chev"/></button>{onSignOut && <button className="btn o" style={{margin:'22px auto 0'}} onClick={()=>void onSignOut()}>Sair</button>}
  </div>
}

export function Appearance({ state, target, onBack, onPhotoSplash, onSplashColor, onHomeColor, onPhotoHome, onSwitchScreen }: { state:any; target:'menu'|'splash'|'home'; onBack:()=>void; onPhotoSplash:(v:string)=>void; onSplashColor:(v:string)=>void; onHomeColor:(v:string)=>void; onPhotoHome:(v:string)=>void; onSwitchScreen:(screen:'splash'|'home'|'menu')=>void }) {
  const colors=['#061F44','#111111','#1f1736','#24324a','#3a1f2a','#203a32']
  if (target !== 'menu') {
    const isSplash = target === 'splash'
    return <div className="scr paper"><BackHeader title={isSplash ? 'Tela inicial' : 'Capa da Home'} onBack={()=>onSwitchScreen('menu')} />
      <div className="card" style={{height:210,marginBottom:8,background:isSplash ? (state.splashCover?'#111':(state.splashColor||'#eaf0ff')) : (state.coverColor||'#eef1fa'),overflow:'hidden'}}><div style={{position:'absolute',inset:0,background:isSplash&&state.splashCover?`linear-gradient(#061F44aa,#061F4455),url(${state.splashCover}) center/cover no-repeat`:!isSplash&&state.cover?`url(${state.cover}) center/cover`:''}}/><div className="hand" style={{position:'absolute',left:18,top:36,color:'#fff',fontSize:68,lineHeight:.8,transform:'rotate(-7deg)',textShadow:'0 2px 10px #0005'}}>NEXT<br/>LAP</div><div style={{position:'absolute',right:18,bottom:16,color:'#fff',fontSize:11}}>Prévia</div></div>
      <p style={{fontSize:11.5,color:'var(--mut)',marginBottom:22,textAlign:'center'}}>Personalize sem alterar o layout aprovado.</p>
      {!isSplash ? <><b style={{fontSize:14}}>Escolha uma cor</b><div className="sw">{['#061F44','#4267FF','#7357C8','#C9C7F6','#DDE3F0','#FF6B6B'].map(c=><span key={c} style={{background:c}} onClick={()=>onHomeColor(c)}/>)}</div><label className="btn o" style={{display:'flex',alignItems:'center',justifyContent:'center',marginTop:12,cursor:'pointer'}}>Escolher foto<input hidden type="file" accept="image/*" onChange={e=>fileToDataUrl(e,onPhotoHome)}/></label></> : <><b style={{fontSize:14}}>Escolha uma cor</b><div className="sw">{colors.map(c=><span key={c} style={{background:c}} onClick={()=>onSplashColor(c)}/>)}</div><label className="btn o" style={{display:'flex',alignItems:'center',justifyContent:'center',marginTop:12,cursor:'pointer'}}>Escolher foto<input hidden type="file" accept="image/*" onChange={e=>fileToDataUrl(e,onPhotoSplash)}/></label></>}
    </div>
  }
  return <div className="scr paper"><BackHeader title="Aparência" onBack={onBack}/><b style={{fontSize:15}}>Backgrounds</b><p style={{fontSize:12,color:'var(--mut)',margin:'4px 0 6px'}}>Escolha como cada tela vai aparecer no seu app.</p>
    <button className="set" onClick={()=>onSwitchScreen('splash')}><span style={{color:'var(--navy)',width:34,height:34,borderRadius:'50%',background:'var(--steel)',display:'flex',alignItems:'center',justifyContent:'center'}}><Icon name="mic"/></span><div><b>Tela inicial</b><small>Foto ou cor</small></div><Icon name="chev"/></button>
    <button className="set" onClick={()=>onSwitchScreen('home')}><span style={{color:'var(--navy)',width:34,height:34,borderRadius:'50%',background:'var(--steel)',display:'flex',alignItems:'center',justifyContent:'center'}}><Icon name="home"/></span><div><b>Capa da Home</b><small>Foto ou cor</small></div><Icon name="chev"/></button>
  </div>
}

export function Activity({ state, onBack, onNavigate }: { state:any; onBack:()=>void; onNavigate:Navigate }) {
  const [filter,setFilter]=useState('Tudo'); const list=state.items.filter((i:Experience)=>filter==='Tudo'||i.createdBy===(filter==='Evy'?'E':'J'))
  return <div className="scr paper"><BackHeader title="Atividade" onBack={onBack}/><div className="row" style={{marginBottom:8}}>{['Tudo','Evy','JP'].map(f=><button key={f} className={`chip ${filter===f?'on':''}`} onClick={()=>setFilter(f)}>{f}</button>)}</div>{list.length?list.map((i:Experience)=><div key={i.id} className="row" style={{padding:'15px 0',borderBottom:'1px solid var(--line)'}} onClick={()=>onNavigate('detail',i.id)}><Avatar id={i.createdBy} profiles={state.profiles} size={42}/><div style={{flex:1}}><b style={{fontSize:13}}>{state.profiles[i.createdBy].name} adicionou uma experiência</b><div style={{color:'var(--mut)',fontSize:12,marginTop:2}}>{i.title}</div></div><span style={{color:'#aab'}}><Icon name="chev"/></span></div>):<div style={{padding:30,textAlign:'center',color:'var(--mut)'}}>Nenhuma atividade ainda.</div>}</div>
}
