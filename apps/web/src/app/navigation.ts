import type { LucideIcon } from 'lucide-react'
import { Armchair, BookOpen, BookPlus, FileText, Home, Settings, Sparkles, WalletCards, Wrench } from 'lucide-react'
type NavigationItem={label:string;path:string;icon:LucideIcon;group:'principal'|'casa'|'secundario'|'final';end?:boolean}
const navigation:NavigationItem[]=[{label:'Sweet Home',path:'/',icon:Home,group:'principal',end:true},{label:'Livro da Casa',path:'/livro-da-casa',icon:BookOpen,group:'principal'},{label:'Novo Capítulo',path:'/novo-capitulo',icon:BookPlus,group:'principal'},{label:'Financeiro',path:'/financeiro',icon:WalletCards,group:'casa'},{label:'Documentos',path:'/documentos',icon:FileText,group:'casa'},{label:'Patrimônio',path:'/patrimonio',icon:Armchair,group:'casa'},{label:'Manutenção',path:'/manutencao',icon:Wrench,group:'casa'},{label:'Ateliê',path:'/atelie',icon:Sparkles,group:'secundario'},{label:'Configurações',path:'/configuracoes',icon:Settings,group:'final'}]
export{navigation};export type{NavigationItem}
