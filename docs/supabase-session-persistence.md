# Sessão, imóvel ativo e importação legada

## Preparação

Aplique os scripts 001 e 002 somente se ainda não aplicados. Depois execute **003_legacy_import_identity.sql uma vez** no SQL Editor, como administrador, antes de habilitar a importação no app. Não reaplique 001/002. Não há Supabase CLI/config local neste projeto. A nova migration não apaga registros nem altera políticas de acesso: mantém RLS explícita, adiciona UUID de origem e UNIQUE(owner_id, legacy_import_id), com RPC SECURITY INVOKER, search_path vazio e EXECUTE somente para authenticated. Não há JSONB de preferências ou novos segredos.

As variáveis continuam sendo `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`, em `apps/web/.env.local`, conforme [configuração](supabase-setup.md).

## Fluxo

- Sem configuração: sem exigência de login ou novos controles, StateProvider mantém a chave v1 e o IndexedDB `siga-files`, usando o comportamento local anterior.
- Com configuração: o app aguarda Auth e mostra acesso à conta antes de montar qualquer store de dados. A sessão sem usuário não lê v1 como estado corrente.
- Ao entrar, a listagem usa o usuário validado pelo Auth. Um único imóvel é automaticamente selecionado após nova consulta. Vários imóveis exigem escolha, salvo seleção salva e revalidada. Seleção ausente/alheia é descartada sem excluir outros dados.
- O seletor permite trocar de imóvel e criar imóveis. A troca desmonta o provider e as páginas anteriores, invalidando callbacks e drafts. A UI mantém tokens, componentes e páginas existentes; os novos controles aparecem apenas no modo autenticado.
- No logout ou troca de conta, AuthProvider invalida o lease síncrono, remove apenas a seleção do usuário anterior e desmonta sua memória. Dados, arquivos, journals e decisões persistidos permanecem.

## Namespaces

Estado: `siga:app-state:v2:user:<userId>:property:<propertyId>`.
Seleção: `siga:active-property:v2:user:<userId>`, contendo **somente o ID**.
Arquivos: banco IndexedDB `siga-files:v2:user:<userId>:property:<propertyId>`.
IDs são codificados com encodeURIComponent. O envelope de estado contém version=2, userId e propertyId, além do AppState interno cuja schemaVersion continua 1. Isso separa a versão do namespace da versão de domínio.

O envelope e os registros internos são validados. Dados corrompidos ou com identidade diferente abrem uma base vazia com aviso, bloqueando gravação automática para preservar o original. A restauração explícita afeta apenas o namespace atual e preserva os campos remotos do imóvel. Erros de storage são exibidos; nunca ocasionam fallback para v1 no modo autenticado.

Namespacing protege o fluxo normal do app, não é criptografia: alguém com acesso ao DevTools/perfil do navegador consegue inspecionar localStorage/IndexedDB. Dados dos módulos ainda não remotos continuam apenas neste dispositivo.

## Importação explícita

Um usuário autenticado vê uma prévia de nome/identificação e contagens de capítulos, movimentações, compromissos, documentos, ambientes, bens e manutenções. Pode importar, começar sem importar ou decidir depois. Importar exige confirmação adicional de propriedade dos dados. Cancelar/adiar não grava o legado nem faz chamadas remotas. A opção Dados antigos reabre o fluxo; começar sem importar grava somente a decisão por usuário.

A importação cria um imóvel próprio (ou recupera o mesmo imóvel em retries), copia registros locais, preferências, categorias e arquivos físicos existentes. Não mescla com outro imóvel já ocupado, evitando substituição de dados. Financiamentos locais passam a referenciar o novo propertyId; os demais IDs e relações são preservados. Registros com IDs de antigo demo são preservados na importação explícita. Nenhuma chave v1 ou arquivo original é removido.

Imóvel legado sem nome ou registros malformados bloqueiam a importação com erro explícito. É necessário corrigir/recuperar o legado no modo local antes de confirmar, mantendo a cópia original. Arquivos ausentes na origem continuam indisponíveis; arquivos existentes são copiados sem upload remoto.

## Idempotência e falhas

- `siga:legacy-identity:v2` guarda um UUID estável para este legado no navegador; não usa nome para deduplicar.
- Journal por usuário/origem grava o snapshot antes do primeiro request e o propertyId após resposta. A prévia de uma retomada mostra esse snapshot congelado, mesmo se v1 foi editada depois.
- A RPC `import_legacy_property` deriva owner do JWT, usa UNIQUE(owner_id, legacy_import_id), retorna o mesmo imóvel em repetições e **não sobrescreve edições posteriores**. Funciona mesmo se a primeira resposta foi perdida.
- Cópia de arquivos precede o commit local. Estado e marcador importSourceId são gravados juntos em uma única operação localStorage. O marcador permanece em salvamentos posteriores. Falha na última gravação do journal não faz retry substituir o estado já importado.
- Repetir importação concluída recupera a mesma seleção; não recopia registros nem arquivos. Se o imóvel foi removido, um erro exige recuperação deliberada, sem criar outra cópia.
- Web Locks serializa importações entre abas antes de alocar identidade. Sem Web Locks há serialização por aba; evite iniciar a primeira importação simultaneamente em duas abas nesse ambiente.
- Cada await relevante verifica o lease da sessão e montagem. Requisições de dados usam cliente com JWT capturado, sem sessão persistida própria: uma troca de conta não transforma um request de A em request de B.
- Se logout ocorrer após o servidor confirmar uma criação, o imóvel pode permanecer na conta original; nenhuma resposta é aplicada em memória/estado da outra conta. Não é possível desfazer uma transação remota já concluída pelo simples cancelamento local. Retry da conta original recupera esse imóvel.

Não apague a identidade/journal para reiniciar importações: isso pode criar uma nova origem. Esta etapa importa um snapshot por origem/usuário; alterações posteriores em v1 não são mescladas automaticamente.

## Gravação do imóvel e preferências

Supabase é autoritativo para os campos do imóvel. Carregamento substitui apenas os campos do imóvel no estado local; configurações do imóvel são salvas pelo serviço tipado, com loading/sucesso/erro. O reducer aplica os campos e timestamps devolvidos pelo servidor somente após sucesso. Falha mantém o draft e o estado anterior. Gravações remotas são ações explícitas, não effects; há proteção contra cliques repetidos e respostas tardias.

Preferências, notificações e categorias permanecem no namespace usuário/imóvel. Capítulos, finanças, documentos, bens e manutenções não são enviados ao banco. Effects persistem apenas o estado local do namespace atual.

## Verificação

Em `apps/web`:

```powershell
npm.cmd test
npm.cmd run build
npm.cmd run lint
```

Na raiz: `git diff --check`. No PowerShell desta máquina, use npm.cmd para contornar a restrição a scripts npm.ps1 sem mudar a política do sistema.

O teste existente de serviços continua executado. Os novos contratos exercitam as implementações de persistência, seleção, importação, reducers, StateProvider, AppProvider e AuthProvider com mocks de rede/storage e um driver simples de hooks/effects. Cobrem os dez cenários pedidos e falhas parciais. O driver não é teste de React DOM nem prova execução das políticas no PostgreSQL.

No SQL Editor de um projeto **de teste** com duas contas Auth, execute `supabase/sql/tests/002_owner_isolation.sql` e `supabase/sql/tests/003_import_idempotency.sql`; ambos terminam com ROLLBACK. O segundo verifica identidade repetida, preservação de edições e isolamento entre donos.

Valide ainda com duas sessões reais: login/logout, seleção inválida, troca de imóveis, importação com fotos/documentos, offline, quota e edição remota. Supabase CLI, psql e Docker não estavam disponíveis nesta execução; migrations/testes SQL não foram executados. O bundle continua emitindo aviso de tamanho acima de 500 kB.

## Limitações e próxima etapa

Dados locais não sincronizam entre dispositivos, e edições simultâneas do mesmo namespace em abas diferentes ainda usam last-write-wins. Namespaces não fornecem criptografia. As migrations precisam ser aplicadas e os tipos manuais devem ser regenerados/revisados no projeto provisionado. A importação requer v1 compatível e não mescla estados ocupados. Não há limpeza automática de cópias parciais após cancelamento.

Próximo passo: validar o fluxo com o Supabase real e escolher um módulo filho para persistência remota, com FK do imóvel, RLS, estados de erro e importação idempotente própria. Antes de upload de arquivos, definir políticas de Storage por usuário/imóvel.

## Arquivos desta etapa

Criados:

- `supabase/sql/003_legacy_import_identity.sql` e `supabase/sql/tests/003_import_idempotency.sql`.
- `apps/web/src/store/StateProvider.tsx`, `SessionWorkspace.tsx`, `active-property.ts`, `scoped-persistence.ts`, `legacy-import.ts`, `state-validation.ts` e `useWorkspace.ts`.
- `apps/web/src/features/workspace/components/AccountAccess.tsx` e `WorkspaceControls.tsx`.
- `apps/web/src/storage/import-legacy-files.ts`.
- `apps/web/scripts/test-module-loader.mjs` e `test-workspace-persistence.mjs`.
- `docs/supabase-session-persistence.md`.

Alterados (incluindo arquivos que já estavam não commitados):

- `apps/web/package.json` (npm test) e `tsconfig.app.json` (strict).
- `apps/web/src/auth/AuthProvider.tsx` e `useAuth.ts`.
- `apps/web/src/lib/supabase.ts` e `lib/supabase/database.types.ts`.
- `apps/web/src/services/supabase/auth.service.ts`, `properties.service.ts` e `profiles.service.ts`.
- `apps/web/src/store/AppProvider.tsx`, `useAppStore.ts`, `app-actions.ts`, `app-reducer.ts` e `persistence.ts`.
- `apps/web/src/app/AppLayout.tsx`.
- `apps/web/src/pages/Settings.tsx`, `Documents.tsx`, `ChapterDetails.tsx` e `NewChapter.tsx`.
- `apps/web/src/storage/document-file-storage.ts` e `chapter-photo-storage.ts`.
- `apps/web/src/features/chapters/useChapterPhotoObjectUrls.ts` e `features/new-chapter/useChapterPhotoAttachments.ts`.
- `apps/web/scripts/test-supabase-foundation.mjs` e `docs/supabase-setup.md`.

As migrations 001/002 permaneceram intactas. Nenhum commit, biblioteca nova ou credencial foi adicionado.
