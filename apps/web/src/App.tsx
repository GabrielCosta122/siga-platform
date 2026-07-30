import { BookOpen, CircleDollarSign, Home, Sparkles } from 'lucide-react'
import type { NavigationItem } from '@/components/layout/Sidebar'
import { MainLayout } from '@/layouts/MainLayout'
import { Financial } from '@/pages/Financial'
const navigation: NavigationItem[]=[{icon:Home,label:'Sweet Home',href:'/'},{icon:BookOpen,label:'Livro da Casa',href:'/livro-da-casa'},{icon:CircleDollarSign,label:'Financeiro',href:'/financeiro',current:true},{icon:Sparkles,label:'Ateliê',href:'/atelie'}]
function App(){return <MainLayout title="Financeiro" navigation={navigation}><Financial/></MainLayout>}
export default App
