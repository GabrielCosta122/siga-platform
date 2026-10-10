# Sincronização financeira no Supabase

## Aplicação

1. Confirme que as migrations 001, 002 e 003 já foram aplicadas.
2. Abra o SQL Editor do Supabase.
3. Execute o conteúdo de `supabase/sql/004_financial_sync.sql` uma única vez.
4. Em um projeto descartável, execute `supabase/sql/tests/004_financial_sync.sql`. O teste termina com rollback.
5. Reinicie o app, entre na conta e abra cada imóvel que contém dados financeiros locais.

Na primeira abertura após a migration, a ausência do marcador remoto autoriza uma importação local única. Depois disso, os dados remotos são carregados ao abrir o imóvel. Alterações locais usam um marcador pendente e são enviadas em um snapshot transacional.

## Dados sincronizados

- financiamentos;
- parcelas;
- compromissos financeiros;
- movimentações e pagamentos.

Cada tabela usa `property_id` e RLS baseada no proprietário do imóvel. O RPC substitui o snapshot financeiro inteiro dentro de uma única transação e incrementa a revisão do imóvel.

## Limitações atuais

- não há realtime; outro dispositivo recebe as mudanças ao reabrir ou recarregar o imóvel;
- duas abas editando simultaneamente ainda usam a última gravação completa;
- capítulos, documentos, patrimônio e manutenção continuam locais, embora seus identificadores relacionados sejam preservados no Financeiro;
- os tipos do banco são manuais até a geração oficial via Supabase CLI.
