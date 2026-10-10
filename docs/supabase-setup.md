# Fundação Supabase: perfis e imóveis

O estado do app continua em localStorage/IndexedDB. No modo local, nenhum serviço remoto é chamado. A segunda etapa usa Supabase para o imóvel quando há sessão; nenhum legado é enviado automaticamente. Configurar Supabase habilita o cliente e a autenticação existentes, preservando a persistência local dos demais módulos. Veja o [fluxo da segunda etapa](supabase-session-persistence.md).

## Ambiente

Em `apps/web`, copie `.env.example` para `.env.local` e preencha:

```dotenv
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=SUA_CHAVE_PUBLICA
```

Reinicie Vite após alterações. Use somente a publishable key (ou a chave pública anon legada). Nunca use `service_role`, `sb_secret_` ou credenciais de banco em variáveis VITE: elas são incluídas no bundle. `.env.local` está ignorado pelo Git. O cliente rejeita chaves privilegiadas conhecidas; essa verificação não substitui a configuração correta.

## Aplicar SQL versionado

Os scripts estão em `supabase/sql`, seguindo o padrão existente do projeto. Não há configuração do Supabase CLI nem migrations automaticamente aplicadas pelo app.

1. Em um projeto de teste, revise os scripts e faça backup do banco existente.
2. Se a base inicial ainda não estiver aplicada, execute `supabase/sql/001_initial_auth_and_properties.sql` no SQL Editor, como administrador.
3. Execute **uma vez** `supabase/sql/002_single_owner_isolation.sql`, integralmente. Ela usa BEGIN/COMMIT; erros abortam a alteração. Se 001 já foi aplicada, execute apenas 002. Não reaplique 001 depois de 002, pois restauraria políticas antigas.
4. Para ativar a segunda etapa, execute uma vez `supabase/sql/003_legacy_import_identity.sql`, depois valide também `supabase/sql/tests/003_import_idempotency.sql`.
5. Registre a aplicação no controle de deploy. Esta etapa mantém SQL versionado manualmente, sem fingir que há histórico de migrations do CLI.
6. Execute `supabase/sql/tests/002_owner_isolation.sql` em um banco de teste com pelo menos dois usuários Auth. O teste termina com ROLLBACK.

002 adiciona `owner_id`, preenche a partir de `created_by`, exige UUID não nulo com FK para Auth e igualdade com o criador legado. Não exclui imóveis ou memberships. Se dados existentes violarem as constraints (inclusive área não finita), a migration falha integralmente: investigue os dados antes de corrigir. O proprietário é o criador original; revise esse critério antes da aplicação se houver compartilhamento real em produção.

A migration substitui **todas** as políticas nas três tabelas para evitar acesso residual por políticas permissivas combinadas com OR. Políticas personalizadas precisam ser revisadas antes do deploy. Memberships existentes permanecem, mas deixam de permitir acesso compartilhado.

## Modelo e segurança

- `profiles`: um perfil por `auth.users.id`, nome e avatar; sem cópia do e-mail ou outros dados Auth. Trigger de 001 cria perfis novos e 002 preenche perfis ausentes.
- `properties`: UUID gerado pelo banco; exatamente um `owner_id`, sem unicidade por usuário (permite vários imóveis). `created_by` permanece por compatibilidade com RPC e auditoria. A constraint de igualdade e o trigger imutável do criador impedem transferência.
- Datas de assinatura/entrega são `date`; timestamps são `timestamptz`, com defaults e triggers de atualização de 001. área é `numeric` finita não negativa; quartos/vagas são inteiros não negativos. Não há valores monetários nesta etapa; módulos financeiros futuros devem usar `numeric` ou centavos inteiros, nunca texto.
- Índice `(owner_id, created_at)` suporta listagem por proprietário.
- RLS explícita nas três tabelas. Perfis e imóveis têm políticas separadas SELECT/INSERT/UPDATE/DELETE limitadas a `auth.uid()`. UPDATE valida tanto linha atual quanto resultado. Nenhuma consulta recursiva ou metadata de usuário participa da autorização.
- Grants de UPDATE excluem UUID, proprietário, criador e timestamps. INSERT não permite timestamps fornecidos pelo browser. Anon continua sem acesso. `property_members` tem quatro políticas de negação e nenhum grant ao navegador; helpers antigos perdem EXECUTE para authenticated.
- RPC existente `create_property_with_owner` continua compatível: deriva o criador do JWT e `owner_id` usa o mesmo JWT por default. A transação/trigger de 001 preserva os vínculos legados. Não foi criado outro helper SQL.
- RLS protege usuários via API; administradores/service role podem ignorá-la. Nunca disponibilize essas credenciais ao browser.

## Serviços e erros

`getMyProperties`, `getPropertyById`, `createProperty` e `updateProperty` mantém o contrato de domínio atual. Listagem/leitura/update usam também filtro owner_id; RLS é a proteção efetiva. Inputs não incluem proprietário e IDs locais não UUID são rejeitados. O mapper converte área de apresentação em número, rejeitando área inválida.

`requireCurrentUser` exige configuração, sessão e validação de usuário pelo Auth. Serviços de dados lançam `SupabaseServiceError` com `not-configured`, `unauthenticated`, `network`, `invalid-input`, `permission-denied`, `not-found` etc. Não convertem falha remota em escrita local silenciosa. Leitura de UUID inexistente/inacessível retorna null; update retorna not-found, sem revelar existência de imóvel alheio. Não faça retry automático de criação após resposta perdida, pois o resultado pode ter sido persistido.

Tipos em `database.types.ts` são um subconjunto manual alinhado aos scripts, **não tipos gerados/verificados no banco**. Após aplicar, gere e revise tipos oficiais via `supabase gen types typescript --project-id <PROJECT_ID> --schema public`; preserve/adapte aliases usados pelos serviços em arquivo próprio antes de substituir o arquivo.

## Verificação de isolamento

O teste SQL usa duas contas Auth existentes, assume temporariamente `authenticated` e claims JWT dentro da transação. Verifica múltiplos imóveis próprios, leitura/update/delete cruzados, insert com proprietário alheio, tentativa de transferência e acesso cruzado a perfil. Nunca teste RLS somente como postgres/service role.

Também teste pela API/browser com duas sessões separadas:

1. A cria dois imóveis pelo serviço; B cria um. Cada listagem mostra apenas os próprios.
2. B consulta UUID de A: null; tenta atualizar: not-found. DELETE pela API deve afetar zero linhas.
3. Com cliente público e JWT de B, tente INSERT com owner_id de A e tente alterar owner_id de B para A: devem falhar. Sem JWT não há acesso.
4. Confira que edição legítima atualiza updated_at e que datas não mudam de dia por timezone.
5. Sem variáveis, confirme rotas e dados locais. Serviços remotos devem lançar not-configured.
6. Com configuração e sem login, serviços de dados devem lançar unauthenticated. Simule offline com sessão ativa: erro network, sem apagar dados locais.

As regras seguem a [documentação oficial de RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

## Verificações automatizadas sem banco

Em `apps/web`, execute `node scripts/test-supabase-foundation.mjs`, `npm run build` e `npm run lint`. Os testes de contrato usam mocks para configuração, sessão, falhas de rede, filtros e mappers; não substituem a execução do teste SQL nem testes com duas sessões reais.

## Evolução

A segunda etapa foi implementada: consulte [sessão, imóvel ativo e importação legada](supabase-session-persistence.md). O próximo módulo remoto deve ser migrado em um fluxo vertical, com FK property_id, RLS e testes de isolamento; arquivos só devem ir ao Supabase após políticas de Storage específicas.
