import { FileImage, FileSpreadsheet, FileText, Folder, ReceiptText } from 'lucide-react'
const documents=[
{id:'contract',name:'Contrato de compra e venda.pdf',category:'Contratos',type:'PDF',size:'4,8 MB',date:'15 de fevereiro de 2026',important:true,chapter:'Assinatura do contrato',movement:'',folder:'Compra do imóvel',description:'Documento que formaliza a aquisição do apartamento.',icon:FileText},
{id:'receipt',name:'Comprovante de pagamento da entrada.pdf',category:'Comprovantes',type:'PDF',size:'850 KB',date:'20 de fevereiro de 2026',important:true,chapter:'',movement:'Pagamento da entrada',folder:'Financeiro',description:'Comprovante da primeira parcela da entrada.',icon:ReceiptText},
{id:'report',name:'Relatório de evolução da obra.pdf',category:'Relatórios',type:'PDF',size:'3,2 MB',date:'12 de julho de 2026',important:true,chapter:'Atualização da obra — estrutura do 12º andar',movement:'',folder:'Obra',description:'Registro técnico do avanço da construção.',icon:FileText},
{id:'floorplan',name:'Planta do apartamento.pdf',category:'Planta e projetos',type:'PDF',size:'6,1 MB',date:'18 de março de 2026',important:false,chapter:'',movement:'',folder:'Projetos',description:'Planta aprovada do apartamento 1204.',icon:FileText},
{id:'invoice',name:'Nota fiscal dos materiais.pdf',category:'Notas fiscais',type:'PDF',size:'620 KB',date:'25 de julho de 2026',important:false,chapter:'',movement:'Compra de materiais',folder:'Obra',description:'Nota fiscal de materiais usados na obra.',icon:ReceiptText},
{id:'visit',name:'Registro da visita técnica.jpg',category:'Outros',type:'Imagem',size:'2,4 MB',date:'14 de julho de 2026',important:false,chapter:'Visita técnica ao apartamento',movement:'',folder:'Obra',description:'Imagem registrada durante a visita técnica.',icon:FileImage},]
const categories=[['Contratos',1,FileText],['Comprovantes',2,ReceiptText],['Notas fiscais',1,ReceiptText],['Relatórios',1,FileText],['Planta e projetos',1,FileSpreadsheet],['Outros',1,FileImage]] as const
const folders=[['Compra do imóvel',2,'15 fev 2026'],['Obra',4,'25 jul 2026'],['Financeiro',3,'20 fev 2026'],['Projetos',1,'18 mar 2026'],['Garantias',2,'12 jul 2026']] as const
export {categories,documents,folders,Folder}
export type DocumentItem=typeof documents[number]
