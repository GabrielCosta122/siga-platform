import { BookOpen, BookPlus, Camera, FileText, Handshake, Landmark, ReceiptText } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { JourneyCard } from '@/features/sweet-home/components/JourneyCard'
import { RecentChapterItem } from '@/features/sweet-home/components/RecentChapterItem'
import { SectionHeading } from '@/features/sweet-home/components/SectionHeading'
import { StoryCover } from '@/features/sweet-home/components/StoryCover'
import { SummaryCard } from '@/features/sweet-home/components/SummaryCard'

const summaries = [
  { icon: Landmark, label: 'investidos', value: 'R$ 42.850' },
  { icon: BookOpen, label: 'capítulos', value: '18' },
  { icon: FileText, label: 'documentos', value: '12' },
  { icon: Camera, label: 'fotos', value: '34' },
]

function SweetHome() {
  return (
    <div className="bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1200px] space-y-9">
        <div className="space-y-6">
          <header className="space-y-2">
            <p className="text-sm text-muted-foreground">Bom dia, Gabriel.</p>
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Reserva das Palmeiras <span className="text-muted-foreground">· Apartamento 1204</span>
            </h1>
            <p className="text-sm italic text-muted-foreground">Toda história merece ser lembrada.</p>
          </header>

          <section className="space-y-3" aria-labelledby="capa-da-historia">
            <SectionHeading title="Capa da história" description="Um retrato do momento que o seu lar vive agora." />
            <StoryCover />
          </section>
        </div>

        <section className="grid gap-5 lg:grid-cols-2" aria-label="Jornada e novo capítulo">
          <JourneyCard />
          <Card className="justify-center border-primary/20 bg-primary text-primary-foreground shadow-book-sm">
            <CardContent className="space-y-4 pt-6">
              <span className="flex size-10 items-center justify-center rounded-md bg-primary-foreground/15">
                <BookPlus className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-display text-xl font-semibold">Um novo momento?</h2>
                <p className="mt-1 text-sm text-primary-foreground/75">Registre o que aconteceu hoje.</p>
              </div>
              <Button className="bg-card text-foreground hover:bg-card/90">
                <BookPlus aria-hidden="true" />
                Novo Capítulo
              </Button>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(25rem,0.85fr)]" aria-label="Último capítulo e visão resumida">
          <Card className="shadow-book-xs">
            <CardHeader>
              <CardTitle className="font-display text-xl">Último capítulo</CardTitle>
              <CardDescription>12 de julho de 2026 · há 3 dias</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="text-base font-medium">Atualização da obra — estrutura do 12º andar</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Obra</Badge>
                <Badge variant="outline">Marco importante</Badge>
                <Badge variant="outline">3 fotos</Badge>
              </div>
              <Button variant="outline">Abrir capítulo</Button>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            {summaries.map((summary) => <SummaryCard key={summary.label} {...summary} />)}
          </div>
        </section>

        <section className="space-y-5 pb-4" aria-labelledby="capitulos-recentes">
          <SectionHeading title="Capítulos recentes" description="Pequenos registros que ajudam a contar a história do seu lar." />
          <Card className="shadow-book-xs">
            <CardContent className="pt-6">
              <ul className="divide-y">
                <RecentChapterItem icon={Handshake} title="Assinatura do contrato" date="15 fev 2026" category="Contrato" />
                <RecentChapterItem icon={ReceiptText} title="Pagamento da entrada" date="20 fev 2026" category="Financeiro" />
                <RecentChapterItem icon={Camera} title="Primeira visita à obra" date="08 mar 2026" category="Memória" />
              </ul>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  )
}

export { SweetHome }
