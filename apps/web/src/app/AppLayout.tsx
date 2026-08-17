import { Outlet, useLocation } from 'react-router'
import { useEffect } from 'react'
import { MainLayout } from '@/layouts/MainLayout'
const titles:Record<string,string>={'/':'Sweet Home','/livro-da-casa':'Livro da Casa','/novo-capitulo':'Novo Capítulo','/financeiro':'Financeiro','/documentos':'Documentos','/patrimonio':'Patrimônio e Inventário','/manutencao':'Manutenção','/atelie':'Ateliê','/configuracoes':'Configurações'}
function AppLayout(){const{pathname}=useLocation();const title=pathname.startsWith('/livro-da-casa/')?'Detalhes do Capítulo':pathname.startsWith('/novo-capitulo/')?'Editar Capítulo':titles[pathname]??'SIGA';useEffect(()=>{document.title=`${title} | SIGA`;window.scrollTo({top:0,behavior:'instant'})},[pathname,title]);return <MainLayout title={title}><Outlet/></MainLayout>};export{AppLayout}
