# Configuração do Supabase

## 1. Criar o projeto
Crie um projeto no Supabase e copie a **Project URL** e a **publishable/anon key**.

## 2. Executar o banco
No Supabase, abra **SQL Editor**, cole o conteúdo de `supabase/schema.sql` e execute uma vez.

Isso cria `profiles`, `experiences`, `completions`, `app_settings`, as políticas de acesso e os buckets públicos para imagens.

## 3. Criar os dois usuários
Em **Authentication → Users**, crie duas contas com e-mail e senha. Uma conta será da Evy e a outra do JP.

Depois de criar as contas, abra o SQL Editor e descubra os UUIDs em:

```sql
select id, email from auth.users order by created_at;
```

Associe cada UUID ao perfil correspondente:

```sql
update public.profiles
set auth_user_id = 'UUID_DA_EVY'
where id = 'E';

update public.profiles
set auth_user_id = 'UUID_DO_JP'
where id = 'J';
```

Não compartilhe a senha no repositório.

## 4. Configurar o frontend
Crie `.env.local` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_PUBLICAVEL
```

A chave pública pode ficar no frontend. A segurança real está nas regras RLS do banco. **Nunca** coloque a service role key em `.env.local`, no GitHub ou no navegador.

## 5. Executar

```bash
npm install
npm run dev
```

Com as variáveis configuradas, o Next Lap passa a:

- exigir login;
- identificar Evy/JP pelo `auth_user_id`;
- carregar as experiências do banco;
- compartilhar alterações entre os dois usuários;
- sincronizar alterações por Realtime;
- armazenar fotos nos buckets do Supabase Storage.

Sem `.env.local`, o projeto continua funcionando em modo local com `localStorage`, útil para desenvolvimento e testes.
