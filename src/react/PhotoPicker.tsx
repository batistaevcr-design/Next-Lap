import { useRef } from 'react'
import type { CSSProperties } from 'react'
import { Icon } from './icons'

export function PhotoPicker({ value, onChange, className = 'ph', style, label = 'Adicionar foto' }: {
  value?: string | null
  onChange: (value: string) => void
  className?: string
  style?: CSSProperties
  label?: string
}) {
  const input = useRef<HTMLInputElement>(null)
  const handle = (file?: File) => {
    if (!file || file.size > 6e6) return
    const reader = new FileReader()
    reader.onload = () => onChange(String(reader.result))
    reader.readAsDataURL(file)
  }
  return <label className={`${className} ${value ? 'has' : ''}`} style={{ ...style, ...(value ? { backgroundImage: `url(${value})` } : {}) }}>
    {!value && <><Icon name="cam" /><span>{label}</span></>}
    <input ref={input} type="file" accept="image/*" onChange={e => handle(e.target.files?.[0])} />
  </label>
}
