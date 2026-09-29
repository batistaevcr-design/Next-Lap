# Checklist de publicação

1. Validar com duas contas reais do Supabase.
2. Confirmar criação/edição/exclusão de experiências em ambos os aparelhos.
3. Confirmar Realtime (alterar em um dispositivo e observar no outro).
4. Confirmar `completions` em vivências repetidas.
5. Confirmar upload de avatar, foto de experiência e backgrounds.
6. Definir `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` como variáveis de build no GitHub Actions.
7. Gerar build com `npm run build`.
8. Publicar a pasta `dist` no GitHub Pages.
9. Testar instalação PWA no celular.
10. Só depois remover/ajustar o fallback local, caso o comportamento desejado seja exigir conexão.
