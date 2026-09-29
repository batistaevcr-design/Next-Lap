# Next Lap

Aplicativo do Next Lap migrado para React + Vite + TypeScript, mantendo o layout aprovado como referência visual.

## Etapa atual

O núcleo funcional está em React e agora a camada de **Supabase/Auth/Realtime** está preparada:

- Login por e-mail e senha quando Supabase está configurado
- Perfil autenticado Evy/JP
- `profiles`, `experiences`, `completions` e `app_settings`
- Supabase Storage para avatars, fotos de experiências e backgrounds
- Realtime para experiências, perfis, vivências e aparência
- RLS para limitar operações ao casal autenticado
- Fallback para `localStorage` quando Supabase não estiver configurado

## Testar localmente

```bash
npm install
npm run dev
```

Abra a URL mostrada pelo Vite.

## Configurar Supabase

Veja `supabase/setup.md` e execute `supabase/schema.sql` no SQL Editor do projeto Supabase.

## Build

```bash
npm run build
npm run preview
```

## Próxima etapa

Validar o fluxo autenticado com duas contas reais e, depois, fechar PWA/publicação.

## Regra visual

`reference/Next Lap.approved.html` é a referência visual congelada. Mudanças nessa camada só devem ocorrer para correções visuais ou quando explicitamente solicitadas.
