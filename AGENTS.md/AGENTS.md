# SIGA Platform

## Visão do produto

O SIGA é uma plataforma para preservar, organizar e contar a história de um lar.

A experiência deve ser:
- editorial;
- acolhedora;
- contemporânea;
- clara;
- orientada à história do usuário.

Evitar aparência de:
- ERP;
- internet banking;
- dashboard corporativo;
- planilha;
- formulário administrativo;
- papel antigo ou estética medieval.

## Linguagem do produto

- Um evento é apresentado ao usuário como “Capítulo”.
- Sweet Home é a capa e a visão geral da história.
- Livro da Casa é a linha do tempo dos capítulos.
- Novo Capítulo registra um acontecimento.
- Detalhes do Capítulo apresenta o registro para leitura.
- Toda história merece ser lembrada.

## Design system

- Utilizar exclusivamente os tokens existentes do SIGA Ink.
- Reutilizar componentes existentes antes de criar novos.
- Usar vinho como cor de destaque, sem preenchimento excessivo.
- Preferir fundos claros, tons quentes, bordas suaves e sombras discretas.
- Preservar espaço em branco e leitura confortável.
- Não depender somente de cor para indicar estados.
- Manter uma linguagem visual consistente entre todos os módulos.

## Layout

- Todas as páginas devem utilizar o MainLayout.
- Desktop como prioridade, mantendo responsividade.
- Utilizar containers principais entre aproximadamente 1180px e 1240px.
- Evitar rolagem horizontal.
- A sidebar deve permanecer fixa e ocupar toda a altura da viewport.
- Páginas filhas não devem virar itens permanentes da sidebar.
- Evitar cards excessivamente altos ou conteúdo comprimido.

## Arquitetura

- Páginas em `apps/web/src/pages`.
- Componentes específicos em `apps/web/src/features/<feature>/components`.
- Componentes reutilizáveis devem ficar fora das features específicas.
- Não alterar componentes globais sem necessidade.
- Preservar todas as páginas existentes.
- Antes de criar um componente, verificar se já existe um equivalente reutilizável.

## Tecnologias

- React
- TypeScript
- Vite
- Tailwind CSS
- Shadcn/UI
- Lucide React

## Implementação

- Utilizar tipagem TypeScript adequada.
- Evitar duplicação de código.
- Separar dados mockados da apresentação quando isso melhorar a organização.
- Utilizar HTML semântico.
- Garantir foco visível e navegação por teclado.
- Não instalar bibliotecas sem necessidade.
- Não implementar API, banco ou persistência quando a tarefa pedir apenas protótipo visual.

## Qualidade

Ao finalizar uma tarefa:

1. executar `npm run build` dentro de `apps/web`;
2. executar `npm run lint`;
3. corrigir erros encontrados;
4. informar os arquivos criados e alterados;
5. resumir as decisões de implementação;
6. não criar commits automaticamente, salvo solicitação explícita.