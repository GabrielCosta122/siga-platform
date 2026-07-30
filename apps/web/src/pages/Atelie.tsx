import {
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  ChevronRight,
  CircleCheck,
  Command,
  Heart,
  Info,
  Mail,
  Search,
  Settings,
  Sparkles,
  TriangleAlert,
} from 'lucide-react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'

const colors = [
  { name: 'Primary', className: 'bg-primary', token: '--primary' },
  { name: 'Secondary', className: 'bg-secondary', token: '--secondary' },
  { name: 'Background', className: 'bg-background', token: '--background' },
  { name: 'Accent', className: 'bg-accent', token: '--accent' },
  { name: 'Success', className: 'bg-success', token: '--success' },
  { name: 'Warning', className: 'bg-warning', token: '--warning' },
  { name: 'Destructive', className: 'bg-destructive', token: '--destructive' },
]

function Section({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-5" aria-labelledby={title.toLowerCase()}>
      <div className="space-y-1 border-b pb-4">
        <h2 id={title.toLowerCase()} className="font-display text-xl font-semibold">
          {title}
        </h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  )
}

function Atelie() {
  return (
    <div className="bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-12">
        <header className="rounded-xl border bg-card p-6 shadow-book-sm sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-3">
              <Badge variant="secondary" className="gap-1.5">
                <BookOpen aria-hidden="true" />
                Design System
              </Badge>
              <div className="space-y-2">
                <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                  SIGA Ateliê
                </h1>
                <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
                  Laboratório visual para calibrar os fundamentos e componentes da
                  identidade do SIGA.
                </p>
              </div>
            </div>
            <div className="flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-book-xs">
              <Sparkles aria-hidden="true" />
            </div>
          </div>
        </header>

        <Section title="Tipografia" description="Hierarquia editorial para conteúdo legível e sereno.">
          <Card>
            <CardContent className="space-y-5 pt-6">
              <div className="grid gap-2 border-b pb-5 sm:grid-cols-[8rem_1fr] sm:items-baseline">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">H1</span>
                <h1 className="font-display text-4xl font-semibold tracking-tight">Título principal</h1>
              </div>
              <div className="grid gap-2 border-b pb-5 sm:grid-cols-[8rem_1fr] sm:items-baseline">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">H2</span>
                <h2 className="font-display text-3xl font-semibold tracking-tight">Título de seção</h2>
              </div>
              <div className="grid gap-2 border-b pb-5 sm:grid-cols-[8rem_1fr] sm:items-baseline">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">H3</span>
                <h3 className="font-display text-xl font-semibold">Título de conteúdo</h3>
              </div>
              <div className="grid gap-2 border-b pb-5 sm:grid-cols-[8rem_1fr] sm:items-baseline">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Body</span>
                <p className="max-w-2xl leading-relaxed">
                  Texto de apoio para comunicar informações com clareza, preservando
                  ritmo, contraste e conforto de leitura.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-[8rem_1fr] sm:items-baseline">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Caption</span>
                <p className="text-xs text-muted-foreground">Atualizado em julho de 2026</p>
              </div>
            </CardContent>
          </Card>
        </Section>

        <Section title="Botões" description="Ações com prioridade e presença visual bem definidas.">
          <Card>
            <CardContent className="flex flex-wrap gap-3 pt-6">
              <Button><Check aria-hidden="true" />Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
            </CardContent>
          </Card>
        </Section>

        <Section title="Cards" description="Superfícies de conteúdo com espaçamento e elevação suaves.">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="shadow-book-xs">
              <CardHeader>
                <CardTitle>Leitura em andamento</CardTitle>
                <CardDescription>Resumo de informação em uma superfície neutra.</CardDescription>
              </CardHeader>
              <CardContent><Badge>Em andamento</Badge></CardContent>
            </Card>
            <Card className="shadow-book-xs">
              <CardHeader>
                <CardTitle>Atividade recente</CardTitle>
                <CardDescription>Estrutura para mensagens, dados ou pequenos fluxos.</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarDays className="size-4" aria-hidden="true" /> Hoje
              </CardContent>
            </Card>
            <Card className="shadow-book-xs">
              <CardHeader>
                <CardTitle>Próximo passo</CardTitle>
                <CardDescription>Composição simples e orientada ao conteúdo.</CardDescription>
              </CardHeader>
              <CardContent><Button variant="ghost" size="sm">Ver detalhes <ChevronRight aria-hidden="true" /></Button></CardContent>
            </Card>
          </div>
        </Section>

        <Section title="Inputs" description="Campos compactos, claros e preparados para estados de foco.">
          <Card>
            <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium">
                Busca
                <span className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <Input className="pl-8" placeholder="Pesquisar no SIGA" />
                </span>
              </label>
              <label className="grid gap-2 text-sm font-medium">
                E-mail
                <Input type="email" placeholder="nome@exemplo.com" />
              </label>
            </CardContent>
          </Card>
        </Section>

        <Section title="Badges" description="Rótulos concisos para estados, categorias e contexto.">
          <Card>
            <CardContent className="flex flex-wrap items-center gap-3 pt-6">
              <Badge>Principal</Badge>
              <Badge variant="secondary">Secundário</Badge>
              <Badge variant="outline">Neutro</Badge>
              <Badge variant="destructive">Atenção</Badge>
              <Badge variant="ghost">Rascunho</Badge>
            </CardContent>
          </Card>
        </Section>

        <Section title="Alertas" description="Feedback objetivo com cor, ícone e hierarquia de leitura.">
          <div className="grid gap-4 lg:grid-cols-3">
            <Alert>
              <Info aria-hidden="true" />
              <AlertTitle>Informação</AlertTitle>
              <AlertDescription>Uma atualização está disponível para consulta.</AlertDescription>
            </Alert>
            <Alert className="border-success/30 bg-success/10 text-success">
              <CircleCheck aria-hidden="true" />
              <AlertTitle>Concluído</AlertTitle>
              <AlertDescription className="text-success/85">As alterações foram registradas com sucesso.</AlertDescription>
            </Alert>
            <Alert variant="destructive">
              <TriangleAlert aria-hidden="true" />
              <AlertTitle>Atenção necessária</AlertTitle>
              <AlertDescription>Revise os dados antes de continuar.</AlertDescription>
            </Alert>
          </div>
        </Section>

        <Section title="Cores do tema" description="Tokens semânticos que compõem a paleta acolhedora do SIGA.">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {colors.map((color) => (
              <div key={color.name} className="overflow-hidden rounded-lg border bg-card shadow-book-xs">
                <div className={`h-20 border-b ${color.className}`} />
                <div className="space-y-0.5 p-3">
                  <p className="text-sm font-medium">{color.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">{color.token}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section title="Ícones Lucide" description="Ícones de interface adotados como linguagem visual complementar.">
          <Card>
            <CardContent className="grid grid-cols-2 gap-3 pt-6 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7">
              {[
                [BookOpen, 'BookOpen'], [Search, 'Search'], [Bell, 'Bell'], [CalendarDays, 'CalendarDays'],
                [Mail, 'Mail'], [Settings, 'Settings'], [Heart, 'Heart'], [Command, 'Command'],
                [Info, 'Info'], [Sparkles, 'Sparkles'],
              ].map(([Icon, name]) => {
                const LucideIcon = Icon as typeof BookOpen
                return (
                  <div key={name as string} className="flex flex-col items-center gap-2 rounded-lg border bg-background p-3 text-muted-foreground">
                    <LucideIcon className="size-5 text-foreground" aria-hidden="true" />
                    <span className="text-xs">{name as string}</span>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </Section>
      </div>
    </div>
  )
}

export { Atelie }
