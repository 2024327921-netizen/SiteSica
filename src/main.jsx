import React,{useEffect,useState} from 'react';import{createRoot}from'react-dom/client';import{configured,supabase}from'./supabase';import{pending,savePending,removePending}from'./offline';import{jsPDF}from'jspdf';import{LayoutDashboard,Users,ClipboardList,Send,History,LogOut,Wifi,WifiOff,RefreshCw,FileDown,UserPlus,Copy,School}from'lucide-react';import'./style.css';



function App(){const[session,S]=useState(null),[profile,P]=useState(null),[page,G]=useState('dashboard'),[msg,M]=useState(''),[busy,B]=useState(false),[online,O]=useState(navigator.onLine),[queue,Q]=useState([]),[students,ST]=useState([]),[cats,CA]=useState([]),[classes,CL]=useState([]),[occ,OC]=useState([]),[refs,RF]=useState([]),[refLinks,RL]=useState([]),[email,E]=useState(''),[password, PW]=useState(''),[name,N]=useState(''),[code,C]=useState(''),[mode,MO]=useState('login'),[student,AS]=useState(''),[mat,AM]=useState(''),[turma,AT]=useState(''),[aluno,AO]=useState(''),[cat,AC]=useState(''),[grav,AV]=useState('baixa'),[desc,AD]=useState(''),[fardamentoItens,FI]=useState([]),[horaEntrada,HE]=useState(''),[inviteRole,IR]=useState(''),[inviteCode,IC]=useState(''),[inviteUsers,IU]=useState([]),[activationCode,ACT]=useState(''),[activationName,AN]=useState(''),[searchStudent,SS]=useState(''),[selectedStudent,SEL]=useState(''),[histStudent,HS]=useState(''),[histCategory,HC]=useState(''),[histSeverity,HV]=useState(''),[histStart,HSTART]=useState(''),[histEnd,HEND]=useState(''),[histStatus,HSTATUS]=useState('todos'),[historySearch,HSEARCH]=useState(''),[auditSearch,ASEARCH]=useState(''),[agora,AGORA]=useState(new Date()),[importRows,IMP]=useState([]),[importErrors,IE]=useState([]),[importProgress,IP]=useState(''),[importFile,IF]=useState(''),[allClasses,ALLCL]=useState([]),[classNewName,CNN]=useState(''),[classNewShift,CNS]=useState('Matutino'),[classRows,CR]=useState([]),[classErrors,CE]=useState([]),[classFile,CF]=useState(''),[classProgress,CP]=useState(''),[editRecord,ER]=useState(null),[editReason,EM]=useState(''),[editFields,EF]=useState({}),[auditNames,ANAMES]=useState({}),[auditRows,AR]=useState([]),[auditLoading,AL]=useState(false);



useEffect(()=>{const f=()=>O(navigator.onLine);addEventListener('online',f);addEventListener('offline',f);if('serviceWorker'in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});refresh();if(configured){supabase.auth.getSession().then(({data})=>S(data.session));const{data:l}=supabase.auth.onAuthStateChange((_,s)=>S(s));return()=>{l.subscription.unsubscribe();removeEventListener('online',f);removeEventListener('offline',f)}}return()=>{removeEventListener('online',f);removeEventListener('offline',f)}},[]);



useEffect(()=>{const timer=setInterval(()=>AGORA(new Date()),1000);return()=>clearInterval(timer)},[]);useEffect(()=>{if(session?.user)loadProfile();else P(null)},[session]);useEffect(()=>{if(profile)load()},[profile,page]);useEffect(()=>{if(profile&&page==='users')loadUsers()},[profile,page]);useEffect(()=>{if(profile)loadAuditNames()},[profile?.id]);useEffect(()=>{if(profile&&page==='classes'&&['admin','depe'].includes(profile.papel))loadAllClasses()},[profile,page]);

// Atualização imediata via Realtime; consulta periódica como alternativa quando a publicação Realtime não estiver habilitada.

useEffect(()=>{if(!profile||!configured)return;let active=true;const refreshRefs=async()=>{if(!navigator.onLine||!active)return;const{data,error}=await supabase.from('encaminhamentos_depe').select('*').order('enviado_em',{ascending:false});if(active&& !error)RF(data||[])};const channel=supabase.channel('sica-acompanhamento-depe').on('postgres_changes',{event:'*',schema:'public',table:'encaminhamentos_depe'},()=>{refreshRefs()}).subscribe();const interval=setInterval(refreshRefs,15000);const onFocus=()=>refreshRefs();window.addEventListener('focus',onFocus);return()=>{active=false;clearInterval(interval);window.removeEventListener('focus',onFocus);supabase.removeChannel(channel)}},[profile?.id]);



async function refresh(){try{Q(await pending())}catch{}}



async function loadProfile(){const{data,error}=await supabase.from('perfis').select('id,nome_completo,papel,ativo').eq('id',session.user.id).maybeSingle();if(error)M(error.message);else if(data?.ativo)P(data);else M('Perfil não está ativo. Entre com uma conta ativada por convite.')}



async function load(){const results=await Promise.all([supabase.from('alunos').select('id,matricula,nome_completo,turma_id,ativo').order('nome_completo'),supabase.from('categorias').select('id,nome').eq('ativo',true),supabase.from('turmas').select('id,nome,turno').eq('ativo',true),supabase.from('ocorrencias').select('*').order('registrada_em',{ascending:false}).limit(1000),supabase.from('encaminhamentos_depe').select('*').order('enviado_em',{ascending:false}),supabase.rpc('sica_consultar_vinculos_depe')]);[ST,CA,CL,OC,RF,RL].forEach((fn,i)=>results[i].data&&fn(results[i].data));const err=results.find(x=>x.error);if(err)M('Não foi possível consultar todos os dados, incluindo encaminhamentos ao DEPE: '+err.error.message)}



 async function loadAllClasses(){const{data,error}=await supabase.from('turmas').select('id,nome,turno,ativo').order('nome');if(error)M('Erro ao consultar turmas: '+error.message);else ALLCL(data||[])}



 async function createClass(e){e.preventDefault();if(!['admin','depe'].includes(profile?.papel)||busy)return;const nome=classNewName.trim(),turno=classNewShift.trim();if(!nome||!turno)return;B(true);try{const{data,error}=await supabase.from('turmas').select('id,nome,turno,ativo');if(error)throw error;const matches=(data||[]).filter(x=>norm(x.nome)===norm(nome)&&norm(x.turno)===norm(turno));if(matches.length){M('Essa turma e turno já estão cadastrados. Use a lista para consultar ou reativar.');return}const{error:insertError}=await supabase.from('turmas').insert({nome,turno,ativo:true});if(insertError)throw insertError;CNN('');M('Turma cadastrada com sucesso.');await loadAllClasses();await load()}catch(err){M('Não foi possível cadastrar turma: '+err.message)}finally{B(false)}}



 function downloadClassModel(){const csv='turma;turno\r\nIINF21;Integrado\r\nIINF31;Vespertino\r\n';const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='modelo-turmas-sica.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}



 async function readClassFile(e){const file=e.target.files?.[0];CR([]);CE([]);CP('');CF(file?.name||'');if(!file)return;if(!/.csv$/i.test(file.name)){CE(['Salve a planilha como CSV UTF-8 (.csv).']);return}try{const data=parseCSV(await file.text());if(data.length<2){CE(['O arquivo não contém turmas.']);return}const headers=data[0].map(norm);const ti=headers.findIndex(h=>['turma','nome','nometurma'].includes(h)),si=headers.findIndex(h=>['turno'].includes(h));if(ti<0||si<0){CE(['O arquivo precisa ter as colunas turma e turno.']);return}const errors=[],valid=[],seen=new Set();data.slice(1).forEach((r,i)=>{const nome=(r[ti]||'').trim(),turno=(r[si]||'').trim(),key=norm(nome)+'|'+norm(turno);if(!nome||!turno){errors.push(`Linha ${i+2}: informe turma e turno.`);return}if(!['matutino','vespertino','noturno','integral','integrado'].includes(norm(turno))){errors.push(`Linha ${i+2}: turno inválido (${turno}). Use Matutino, Vespertino, Noturno, Integral ou Integrado.`);return}if(seen.has(key)){errors.push(`Linha ${i+2}: turma e turno repetidos no arquivo.`);return}seen.add(key);valid.push({nome,turno:turno.charAt(0).toUpperCase()+turno.slice(1).toLowerCase(),ativo:true})});CR(valid);CE(errors);CP(`${valid.length} turma(s) na prévia; ${errors.length} linha(s) com problema.`)}catch(err){CE(['Erro ao ler arquivo: '+err.message])}}



 async function importClasses(){if(!['admin','depe'].includes(profile?.papel)||!classRows.length||classErrors.length||busy)return;if(!navigator.onLine){M('A importação exige internet.');return}B(true);try{const{data,error}=await supabase.from('turmas').select('id,nome,turno,ativo');if(error)throw error;const existing=new Set((data||[]).map(x=>norm(x.nome)+'|'+norm(x.turno)));const newRows=classRows.filter(x=>!existing.has(norm(x.nome)+'|'+norm(x.turno)));const skipped=classRows.length-newRows.length;let count=0;for(let i=0;i<newRows.length;i+=50){const part=newRows.slice(i,i+50);const{error:insertError}=await supabase.from('turmas').insert(part);if(insertError)throw new Error(`${count} turma(s) inserida(s) antes da falha: ${insertError.message}`);count+=part.length;CP(`${count} de ${newRows.length} turmas importadas...`)}CP(`${count} turma(s) importada(s) com sucesso; ${skipped} já cadastrada(s), ignorada(s) para evitar duplicidade.`);M('Importação de turmas concluída.');CR([]);CF('');await loadAllClasses();await load()}catch(err){M('Erro ao importar turmas: '+err.message)}finally{B(false)}}



async function loadAuditHistory(){
 if(!online){M('Conecte-se à internet para consultar a auditoria.');return}
 AL(true);
 try{const{data,error}=await supabase.rpc('sica_consultar_auditoria_ocorrencias');if(error)throw error;AR(data||[])}
 catch(err){M('Não foi possível consultar a auditoria: '+err.message)}finally{AL(false)}
}

async function loadAuditNames(){const{data,error}=await supabase.rpc('sica_consultar_nomes_responsaveis');if(error){M('Não foi possível consultar os nomes dos responsáveis: '+error.message);return}ANAMES(Object.fromEntries((data||[]).map(x=>[x.id,x.nome_completo])))}

function explainAction(type,item,action='editar'){
 if(busy)return 'Aguarde a operação em andamento terminar.';
 if(!online)return 'Você está sem conexão. Conecte-se à internet para realizar esta operação.';
 const role=profile?.papel;
 if(type!=='ocorrencia'&&!['admin','depe'].includes(role))return 'Seu perfil não tem permissão para alterar alunos ou turmas.';
 if(type==='ocorrencia'){
  if(!['admin','depe','registrador'].includes(role))return 'Seu perfil não tem permissão para alterar ocorrências.';
  if(refLinks.some(x=>x.ocorrencia_id===item.id))return 'Esta ocorrência já foi encaminhada ao DEPE e não pode ser editada ou excluída por nenhum perfil (DEPE, ADM ou Registrador). O histórico precisa ser preservado, mesmo quando o encaminhamento estiver resolvido.';
  if(item.excluida_em)return 'Esta ocorrência já foi excluída e não pode ser alterada.';
  if(role==='registrador'&&item.registrada_por!==session?.user?.id)return 'O Registrador só pode editar ou excluir ocorrências registradas por ele mesmo.';
 }else if(action==='editar'&&!item.ativo)return 'Este cadastro está inativo. Reative-o antes de editar.';
 return '';
}
function notifyBlocked(reason){window.alert('Operação não permitida\n\n'+reason);M(reason)}
function openEdit(type,item,action='editar'){
 const reason=explainAction(type,item,action);
 if(reason){notifyBlocked(reason);return}
 ER({type,item,action});EM('');
 EF(type==='aluno'?{nome:item.nome_completo||'',matricula:item.matricula||'',turma_id:item.turma_id||''}:type==='turma'?{nome:item.nome||'',turno:item.turno||'Matutino'}:{gravidade:item.gravidade||'baixa',descricao:item.descricao||''});
}
async function saveEdit(e){
 e.preventDefault();if(!editRecord){notifyBlocked('Nenhum registro foi selecionado. Abra a edição novamente.');return}
 const blocked=explainAction(editRecord.type,editRecord.item,editRecord.action);if(blocked){notifyBlocked(blocked);return}
 if(editReason.trim().length<5){notifyBlocked('Informe uma justificativa com pelo menos 5 caracteres.');return}
 const {type,item,action}=editRecord;B(true);
 try{
  let fn,args;
  if(type==='aluno'){
   if(action==='editar'){fn='sica_editar_aluno';args={p_aluno_id:item.id,p_nome:editFields.nome,p_matricula:editFields.matricula||null,p_turma_id:editFields.turma_id||null,p_motivo:editReason.trim()}}
   else {fn='sica_alterar_situacao_aluno';args={p_aluno_id:item.id,p_ativo:action==='reativar',p_motivo:editReason.trim()}}
  }else if(type==='turma'){
   if(action==='editar'){fn='sica_editar_turma';args={p_turma_id:item.id,p_nome:editFields.nome,p_turno:editFields.turno,p_motivo:editReason.trim()}}
   else {fn='sica_alterar_situacao_turma';args={p_turma_id:item.id,p_ativo:action==='reativar',p_motivo:editReason.trim()}}
  }else{
   if(action==='editar'){fn='sica_editar_ocorrencia';args={p_ocorrencia_id:item.id,p_gravidade:editFields.gravidade,p_descricao:editFields.descricao,p_motivo:editReason.trim()}}
   else {fn='sica_excluir_ocorrencia';args={p_ocorrencia_id:item.id,p_motivo:editReason.trim()}}
  }
  const {error}=await supabase.rpc(fn,args);if(error)throw error;
  M('Operação concluída. Justificativa e usuário registrados na auditoria.');ER(null);EM('');
  await load();if(type==='turma')await loadAllClasses();await loadAuditNames();
 }catch(err){const reason='Não foi possível concluir a operação: '+(err?.message||'Erro desconhecido.');M(reason);window.alert(reason)}finally{B(false)}
}
const editorButtons=(type,item)=>{
 const canManage=type==='ocorrencia'
  ? ['admin','depe','registrador'].includes(profile?.papel)
  : ['admin','depe'].includes(profile?.papel);
 if(!canManage)return null;
 const reason=explainAction(type,item);
 const depeBlocked=type==='ocorrencia'&&refLinks.some(x=>x.ocorrencia_id===item.id);
 return <span style={{display:'inline-flex',gap:6,flexWrap:'wrap',alignItems:'center'}}>
  {depeBlocked&&<span style={{fontSize:12,color:'#7c4a12',fontWeight:600}}>🔒 Encaminhada ao DEPE</span>}
  {!depeBlocked&&<><button type="button" className="ghost" onClick={()=>openEdit(type,item)}>Editar</button>
  <button type="button" className="ghost" onClick={()=>openEdit(type,item,type==='ocorrencia'?'excluir':item.ativo?'excluir':'reativar')}>{type==='ocorrencia'?'Excluir':item.ativo?'Excluir':'Reativar'}</button></>}
  {reason&&<button type="button" className="ghost" onClick={()=>notifyBlocked(reason)}>Por quê?</button>}
 </span>;
};

async function loadUsers(){const{data,error}=await supabase.from('perfis').select('id,nome_completo,papel,ativo,criado_em').order('nome_completo');if(error)M('Não foi possível consultar os usuários: '+error.message);else IU(data||[])}



async function generateInvite(e){e.preventDefault();if(!['depe','admin'].includes(profile?.papel))return;B(true);IC('');const{data,error}=await supabase.rpc('sica_gerar_convite',{p_papel:inviteRole});B(false);if(error)M('Não foi possível gerar o convite: '+error.message);else{IC(data);M('Convite criado. Copie o código e envie somente à pessoa autorizada. Válido por 24 horas.')}}



async function activateAfterLogin(e){e.preventDefault();B(true);const{error}=await supabase.rpc('sica_ativar_conta',{p_codigo:activationCode.trim(),p_nome:activationName.trim()});B(false);if(error)M('Não foi possível ativar a conta: '+error.message);else{M('Conta ativada com sucesso.');ACT('');await loadProfile()}}



async function login(e){e.preventDefault();B(true);const{error}=await supabase.auth.signInWithPassword({email,password});B(false);if(error)M(error.message)}



async function signup(e){e.preventDefault();B(true);const{data,error}=await supabase.auth.signUp({email,password});if(error){B(false);M(error.message);return}if(!data.session){B(false);M('Conta criada. Confirme seu e-mail e depois entre para ativar o convite.');return}const{error:er}=await supabase.rpc('sica_ativar_conta',{p_codigo:code,p_nome:name});B(false);M(er?er.message:'Convite ativado. Carregando seu perfil.')}



async function addStudent(e){e.preventDefault();B(true);const{error}=await supabase.from('alunos').insert({nome_completo:student,matricula:mat||null,turma_id:turma||null,ativo:true});B(false);M(error?.message||'Aluno cadastrado com sucesso.');if(!error){AS('');AM('');load()}}



// Importação CSV: aceita arquivos exportados do Excel, sem bibliotecas adicionais.



function parseCSV(text){const first=text.replace(/^\uFEFF/,'');const line=first.split(/\r?\n/).find(x=>x.trim())||'';const delim=[';',',','\t'].sort((a,b)=>line.split(b).length-line.split(a).length)[0];let rows=[],row=[],cell='',quoted=false;for(let i=0;i<first.length;i++){let ch=first[i];if(ch==='"'){if(quoted&&first[i+1]==='"'){cell+='"';i++}else quoted=!quoted}else if(ch===delim&&!quoted){row.push(cell.trim());cell=''}else if((ch==='\n'||ch==='\r')&&!quoted){if(ch==='\r'&&first[i+1]==='\n')i++;row.push(cell.trim());if(row.some(x=>x))rows.push(row);row=[];cell=''}else cell+=ch}row.push(cell.trim());if(row.some(x=>x))rows.push(row);return rows}



function norm(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'')}



async function readImportFile(e){const file=e.target.files?.[0];IMP([]);IE([]);IP('');IF(file?.name||'');if(!file)return;if(!/\.csv$/i.test(file.name)){IE(['Salve sua planilha do Excel como CSV UTF-8 (.csv) antes de importar.']);return}try{const text=await file.text();const data=parseCSV(text);if(data.length<2){IE(['Arquivo sem alunos ou sem cabeçalho.']);return}const headers=data[0].map(norm);const idx=(...names)=>headers.findIndex(h=>names.map(norm).includes(h));const ni=idx('nome_completo','nome completo','nome','aluno');const mi=idx('matricula','matrícula');const ti=idx('turma','nome_turma');const turni=idx('turno');if(ni<0){IE(['É obrigatória uma coluna chamada nome_completo (ou nome).']);return}const errors=[],valid=[],seen=new Set();data.slice(1).forEach((r,i)=>{const nome=(r[ni]||'').trim(),matricula=mi>=0?(r[mi]||'').trim():'',turmaNome=ti>=0?(r[ti]||'').trim():'',turno=turni>=0?(r[turni]||'').trim():'';if(!nome){errors.push(`Linha ${i+2}: nome vazio.`);return}if(matricula&&seen.has(matricula.toLowerCase())){errors.push(`Linha ${i+2}: matrícula repetida no arquivo (${matricula}).`);return}if(matricula)seen.add(matricula.toLowerCase());let turmaId=null;if(turmaNome){const matches=classes.filter(t=>norm(t.nome)===norm(turmaNome)&&(!turno||norm(t.turno)===norm(turno)));if(matches.length!==1){errors.push(`Linha ${i+2}: turma "${turmaNome}" não identificada de forma única${turno?' no turno '+turno:''}.`);return}turmaId=matches[0].id}valid.push({nome_completo:nome,matricula:matricula||null,turma_id:turmaId,ativo:true})});IMP(valid);IE(errors);IP(`${valid.length} aluno(s) pronto(s) para importar; ${errors.length} linha(s) com problema.`)}catch(err){IE(['Não foi possível ler o arquivo: '+err.message])}}



async function importStudents(){if(!['admin','depe'].includes(profile?.papel)||!importRows.length||importErrors.length||busy)return;if(!navigator.onLine){M('A importação exige conexão com a internet.');return}B(true);IP('Conferindo matrículas no banco...');try{const mats=importRows.map(r=>r.matricula).filter(Boolean);const existing=new Set();for(let i=0;i<mats.length;i+=100){const{data,error}=await supabase.from('alunos').select('matricula').in('matricula',mats.slice(i,i+100));if(error)throw error;(data||[]).forEach(x=>existing.add(String(x.matricula).toLowerCase()))}const repeated=importRows.filter(r=>r.matricula&&existing.has(r.matricula.toLowerCase()));if(repeated.length){IP('Importação interrompida: matrículas já cadastradas.');IE(repeated.slice(0,15).map(r=>'Matrícula já cadastrada: '+r.matricula));return}let count=0;for(let i=0;i<importRows.length;i+=50){const part=importRows.slice(i,i+50);const{error}=await supabase.from('alunos').insert(part);if(error)throw new Error(`${count} aluno(s) inserido(s) antes da falha: ${error.message}`);count+=part.length;IP(`${count} de ${importRows.length} alunos importados...`)}IP(`${count} aluno(s) importado(s) com sucesso.`);M('Importação concluída.');IMP([]);IF('');await load()}catch(err){M('Falha na importação: '+err.message);IP('Verifique a mensagem acima; não reenvie o mesmo arquivo sem conferir os alunos cadastrados.')}finally{B(false)}}



function downloadModel(){const csv='nome_completo;matricula;turma;turno\r\nMARIA EXEMPLO;2026001;;\r\nJOAO EXEMPLO;2026002;;\r\n';const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='modelo-importacao-alunos-sica.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}



const categoriaSelecionada=(cats.find(x=>x.id===cat)?.nome||'').trim().toLocaleLowerCase('pt-BR');const isFardamento=categoriaSelecionada==='fardamento';const isAtraso=categoriaSelecionada==='atraso';



const itensFardamento=[{id:'calca',texto:'Não utilizou a calça escolar'},{id:'blusa',texto:'Não utilizou a blusa da instituição'},{id:'sapato',texto:'Não utilizou sapato fechado'}];



const descricaoFardamento=itensFardamento.filter(x=>fardamentoItens.includes(x.id)).map(x=>x.texto).join('; ');



async function addOcc(e){e.preventDefault();if(isAtraso&&!horaEntrada){M('Informe o horário de entrada do aluno.');return}if(isFardamento&&!fardamentoItens.length){M('Selecione pelo menos uma regra de fardamento descumprida.');return}const descricaoFinal=isFardamento?'Regras de fardamento descumpridas: '+descricaoFardamento+'.'+(desc.trim()?' Observações: '+desc.trim():''):isAtraso?'Horário de entrada do aluno: '+horaEntrada+'.'+(desc.trim()?' Observações: '+desc.trim():''):desc.trim();if(!descricaoFinal){M('Informe a descrição da ocorrência.');return}const row={id_sincronizacao:crypto.randomUUID(),aluno_id:aluno,categoria_id:cat,gravidade:grav,descricao:descricaoFinal,...(isAtraso?{horario_entrada:horaEntrada}:{}),ocorrida_em:new Date().toISOString()};B(true);if(!navigator.onLine){await savePending(row);await refresh();M('Ocorrência salva neste dispositivo. Sincronize quando a conexão com a internet voltar.')}else{const{error}=await supabase.from('ocorrencias').insert(row);if(error)M(error.message);else{const{data:after,error:refError}=await supabase.from('encaminhamentos_depe').select('*').eq('aluno_id',aluno).eq('categoria_id',cat).order('enviado_em',{ascending:false}).limit(1);const newlySent=!refError&&after?.some(r=>!refs.some(old=>old.id===r.id));M(newlySent?'Ocorrência registrada. O limite de 3 ocorrências foi atingido: encaminhamento enviado automaticamente ao DEPE.':'Ocorrência registrada com sucesso.');await load()}}B(false);AD('');FI([]);HE('')}



async function updateReferral(id,situacao){if(profile?.papel!=='depe'||busy||!online)return;B(true);const{error}=await supabase.from('encaminhamentos_depe').update({situacao}).eq('id',id);if(error)M('Não foi possível atualizar o encaminhamento: '+error.message);else{M('Situação do encaminhamento atualizada.');const{data,error:readError}=await supabase.from('encaminhamentos_depe').select('*').order('enviado_em',{ascending:false});if(!readError)RF(data||[])}B(false)}



const referralStatus={recebido:'Enviado ao DEPE',visualizado:'Visualizada',em_processo:'Em andamento',resolvido:'Resolvida'};

const referralLabel=s=>referralStatus[s]||s||'Não informado';

const referralsForStudent=id=>refs.filter(r=>r.aluno_id===id);

const referralForOcc=o=>{const link=refLinks.find(x=>x.ocorrencia_id===o.id);return link?refs.find(r=>r.id===link.encaminhamento_id)||{situacao:'encaminhado'}:null};



async function sync(){if(!navigator.onLine)return;B(true);let n=0;for(const x of await pending()){const{error}=await supabase.from('ocorrencias').upsert(x,{onConflict:'id_sincronizacao',ignoreDuplicates:true});if(error){M('Não foi possível sincronizar: '+error.message);break}await removePending(x.id_sincronizacao);n++}await refresh();await load();B(false);if(n)M(n+' ocorrência(s) sincronizada(s) com sucesso.')}



const cleanOcc=occ.filter(x=>!x.excluida_em);



const byStudent=id=>cleanOcc.filter(x=>x.aluno_id===id);



const categoryName=id=>cats.find(c=>c.id===id)?.nome||'Categoria não identificada';



const studentName=id=>students.find(a=>a.id===id)?.nome_completo||'Aluno não identificado';



const className=id=>classes.find(t=>t.id===id)?.nome||'Sem turma';



const dateOf=x=>new Date(x.ocorrida_em||x.registrada_em);



const dateText=x=>dateOf(x).toLocaleString('pt-BR');



const filteredStudents=students.filter(x=>[x.nome_completo,x.matricula||'',className(x.turma_id)].join(' ').toLocaleLowerCase('pt-BR').includes(searchStudent.toLocaleLowerCase('pt-BR')));



const filteredOcc=cleanOcc.filter(x=>{
 const termo=historySearch.trim().toLocaleLowerCase('pt-BR');
 const alunoAtual=students.find(a=>a.id===x.aluno_id);
 const textoBusca=[alunoAtual?.nome_completo,alunoAtual?.matricula,className(alunoAtual?.turma_id),categoryName(x.categoria_id),x.gravidade,x.descricao,dateText(x),auditNames[x.registrada_por]].join(' ').toLocaleLowerCase('pt-BR');



 const date=dateOf(x);const day=Number.isNaN(date.getTime())?'':`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;



 return (!termo||textoBusca.includes(termo))&&(!histStudent||x.aluno_id===histStudent)&&(!histCategory||x.categoria_id===histCategory)&&(!histSeverity||x.gravidade===histSeverity)&&(!histStart||day>=histStart)&&(!histEnd||day<=histEnd);



});



function pdfBase(title,subtitle){const d=new jsPDF({unit:'mm',format:'a4'});const W=210,H=297;let y=45,page=1;const header=()=>{d.setFillColor(23,87,58);d.rect(0,0,W,34,'F');d.setFillColor(213,171,81);d.rect(0,34,W,1.5,'F');d.setTextColor(255,255,255);d.setFont('helvetica','bold');d.setFontSize(16);d.text('SICA',15,14);d.setFontSize(9);d.text('SISTEMA INTEGRADO DE CONTROLE DE ALUNOS',15,21);d.setFontSize(8);d.text('RELATÓRIO INSTITUCIONAL',15,28);d.setTextColor(36,53,45);d.setFont('helvetica','bold');d.setFontSize(13);d.text(title,15,44);d.setFont('helvetica','normal');d.setFontSize(9);d.setTextColor(93,106,98);d.text(subtitle,15,51);y=59};const footer=()=>{d.setDrawColor(215,225,219);d.line(15,282,195,282);d.setFont('helvetica','normal');d.setTextColor(105,115,109);d.setFontSize(8);d.text('SICA • Documento gerado eletronicamente',15,288);d.text(`Página ${page}`,195,288,{align:'right'})};const ensure=h=>{if(y+h>277){footer();d.addPage();page++;header()}};header();return{d,ensure,footer,getY:()=>y,setY:v=>{y=v}}}



function makePdf(rows,title,filename){const stamp=new Date().toLocaleString('pt-BR',{timeZone:'America/Manaus'});const p=pdfBase(title,'Gerado em '+stamp+' (horário de Manaus)');const{d,ensure}=p;let y=p.getY();d.setFillColor(238,246,240);d.roundedRect(15,y,180,15,2,2,'F');d.setTextColor(23,87,58);d.setFont('helvetica','bold');d.setFontSize(10);d.text(`${rows.length} ocorrência(s) no relatório`,20,y+9);y+=23;if(!rows.length){d.setTextColor(75,90,81);d.text('Nenhuma ocorrência encontrada.',15,y+6)}rows.forEach((r,i)=>{const aluno=studentName(r.aluno_id),categoria=categoryName(r.categoria_id),turmaNome=className(students.find(s=>s.id===r.aluno_id)?.turma_id);const description=d.splitTextToSize(r.descricao||'Sem descrição',167);const height=Math.max(31,24+description.length*4.7);p.setY(y);ensure(height+4);y=p.getY();d.setFillColor(i%2===0?248:252,250,249);d.setDrawColor(220,230,224);d.roundedRect(15,y,180,height,2,2,'FD');d.setTextColor(24,83,56);d.setFont('helvetica','bold');d.setFontSize(10);d.text(`${i+1}. ${aluno}`.slice(0,90),20,y+7,{maxWidth:169});d.setTextColor(68,79,73);d.setFont('helvetica','normal');d.setFontSize(8.5);d.text(`${categoria}  |  ${String(r.gravidade||'').toUpperCase()}  |  ${turmaNome}`,20,y+13,{maxWidth:170});d.text(`Data: ${dateText(r)}`+(r.horario_entrada?`  |  Entrada: ${String(r.horario_entrada).slice(0,5)}`:''),20,y+19,{maxWidth:170});d.setTextColor(49,59,53);d.text(description,20,y+25);y+=height+4});p.footer();d.save(filename)}



function pdf(){if(page==='depe'){const stamp=new Date().toLocaleString('pt-BR',{timeZone:'America/Manaus'});const p=pdfBase('Encaminhamentos ao DEPE','Gerado em '+stamp+' (horário de Manaus)');const{d,ensure}=p;let y=p.getY();d.setFontSize(10);d.setTextColor(23,87,58);d.text(`${refs.length} encaminhamento(s)`,15,y+3);y+=10;refs.forEach((r,i)=>{p.setY(y);ensure(24);y=p.getY();d.setFillColor(i%2?249:240,247,243);d.roundedRect(15,y,180,21,2,2,'F');d.setFont('helvetica','bold');d.setTextColor(23,87,58);d.setFontSize(10);d.text(`${i+1}. ${studentName(r.aluno_id)}`,19,y+7,{maxWidth:172});d.setFont('helvetica','normal');d.setTextColor(61,74,66);d.setFontSize(9);d.text(`${categoryName(r.categoria_id)}  |  ${r.competencia||''}  |  ${r.situacao||''}`,19,y+15,{maxWidth:172});y+=25});p.footer();d.save('sica-encaminhamentos-depe.pdf');return}makePdf(filteredOcc,histStudent?'Histórico individual - '+studentName(histStudent):'Histórico geral de ocorrências','sica-historico-ocorrencias.pdf')}



if(!configured)return <div className="setup"><img src="/logo-sica.png"/><h2>Conectar o SICA ao Supabase</h2><p>Copie .env.example para .env e informe Project URL e chave pública (publishable/anon). Nunca use service_role no navegador.</p></div>;



if(session&&!profile)return <main className="auth"><div className="card"><img src="/logo-sica.png"/><h2>Ativar acesso ao SICA</h2><p>Se você recebeu um convite, informe o código e seu nome completo para ativar sua conta.</p><form onSubmit={activateAfterLogin}><label>Nome completo<input value={activationName} onChange={e=>AN(e.target.value)} required/></label><label>Código do convite<input value={activationCode} onChange={e=>ACT(e.target.value)} required/></label><button disabled={busy}>Ativar meu acesso</button></form><button type="button" className="ghost" onClick={()=>supabase.auth.signOut()}>Sair e usar outra conta</button>{msg&&<p>{msg}</p>}</div></main>;



if(!session)return <main className="auth"><form className="card" onSubmit={mode==='login'?login:signup}><img src="/logo-sica.png"/><h2>{mode==='login'?'Entrar no SICA':'Cadastro por convite'}</h2>{mode==='signup'&&<><label>Nome completo<input value={name} onChange={e=>N(e.target.value)} required/></label><label>Código do convite<input value={code} onChange={e=>C(e.target.value)} required/></label></>}<label>E-mail<input type="email" value={email} onChange={e=>E(e.target.value)} required/></label><label>Senha<input type="password" minLength="8" value={password} onChange={e=>PW(e.target.value)} required/></label><button disabled={busy}>{mode==='login'?'Entrar':'Criar conta e ativar convite'}</button><button type="button" className="ghost" onClick={()=>MO(mode==='login'?'signup':'login')}>{mode==='login'?'Tenho um código de convite':'Voltar ao acesso'}</button>{msg&&<p>{msg}</p>}</form></main>;



const links=[['Painel inicial','dashboard',LayoutDashboard],['Alunos','students',Users],['Ocorrências','occurrences',ClipboardList],['Acompanhamento DEPE','depe',Send],['Histórico','history',History],['Gerenciamento de usuários','users',UserPlus],['Gerenciamento de turmas','classes',School]];



return <div className="layout"><aside><img src="/logo-sica.png"/><b>{profile.nome_completo}</b><small>{profile.papel.toUpperCase()}</small>{links.filter(x=>(x[1]!=='users'||['depe','admin'].includes(profile.papel))&&(x[1]!=='classes'||['depe','admin'].includes(profile.papel))).map(([label,key,I])=><button className={page===key?'active':''} onClick={()=>G(key)}><I size={17}/>{label}</button>)}<button onClick={()=>supabase.auth.signOut()}><LogOut size={17}/>Sair</button></aside><main><header><div><small>SISTEMA INTEGRADO DE CONTROLE DE ALUNOS</small><h1>{links.find(x=>x[1]===page)?.[0]}</h1></div><span>{online?<Wifi/>:<WifiOff/>} {online?'Conectado':'Sem conexão'} · {queue.length} pendentes</span></header>{msg&&<p className="msg">{msg}</p>}{queue.length>0&&<button onClick={sync} disabled={!online||busy}><RefreshCw/> Sincronizar {queue.length}</button>}



{page==='dashboard'&&<section className="cards"><article><b>{students.length}</b>Alunos</article><article><b>{occ.length}</b>Ocorrências</article><article><b>{refs.length}</b>Encaminhamentos</article><article><b>{queue.length}</b>Pendentes offline</article></section>}



{page==='students'&&<section className="panel"><h2>Consulta de alunos</h2><label>Pesquisar por nome, matrícula ou turma<input value={searchStudent} onChange={e=>SS(e.target.value)} placeholder="Digite para pesquisar"/></label><p>{filteredStudents.length} aluno(s) encontrado(s) · {filteredStudents.filter(x=>byStudent(x.id).length===0).length} sem ocorrências</p><Table heads={['Nome completo','Matrícula','Turma','Ocorrências','Situação','Consultar','Ações']} rows={filteredStudents.map(x=>[x.nome_completo,x.matricula||'—',className(x.turma_id),byStudent(x.id).length,x.ativo?'Ativo':'Inativo',<button type="button" onClick={()=>SEL(x.id)}>Ver histórico</button>,editorButtons('aluno',x)])}/>{selectedStudent&&<div className="panel"><h3>Histórico individual — {studentName(selectedStudent)}</h3><p>Total de ocorrências: {byStudent(selectedStudent).length}</p><h4>Encaminhamentos ao DEPE</h4>{referralsForStudent(selectedStudent).length?<Table heads={['Categoria','Mês','Situação','Enviado em']} rows={referralsForStudent(selectedStudent).map(r=>[categoryName(r.categoria_id),String(r.competencia).slice(0,7),referralLabel(r.situacao),new Date(r.enviado_em).toLocaleString('pt-BR',{timeZone:'America/Manaus'})])}/>:<p>Nenhum encaminhamento ao DEPE para este aluno.</p>}<button type="button" onClick={()=>makePdf(byStudent(selectedStudent),'Histórico individual - '+studentName(selectedStudent),'sica-historico-individual.pdf')}><FileDown size={17}/> Gerar PDF individual</button><button type="button" className="ghost" onClick={()=>SEL('')}>Fechar</button><Table heads={['Data','Categoria','Gravidade','Descrição']} rows={byStudent(selectedStudent).map(x=>[dateText(x),categoryName(x.categoria_id),x.gravidade,x.descricao])}/></div>}{['depe','admin'].includes(profile.papel)&&<><h2>Cadastrar aluno</h2><form className="form" onSubmit={addStudent}><label>Nome<input value={student} onChange={e=>AS(e.target.value)} required/></label><label>Matrícula<input value={mat} onChange={e=>AM(e.target.value)}/></label><label>Turma<select value={turma} onChange={e=>AT(e.target.value)}><option value="">Sem turma</option>{classes.map(x=><option key={x.id} value={x.id}>{x.nome} — {x.turno}</option>)}</select></label><button disabled={busy}>Salvar aluno</button></form><div className="panel" style={{marginTop:18}}><h3>Importar alunos por planilha (ADM / DEPE)</h3><p>Para importar vários alunos de uma vez, salve a planilha do Excel como <b>CSV UTF-8</b>. Colunas: <b>nome_completo</b>, <b>matricula</b>, <b>turma</b> e <b>turno</b>. Turma e turno podem ficar vazios.</p><button type="button" className="ghost" onClick={downloadModel}>Baixar modelo de planilha CSV</button><label>Selecionar arquivo CSV<input type="file" accept=".csv,text/csv" onChange={readImportFile}/></label><div className="import-guide"><h4>Como organizar a planilha de alunos</h4><p>Organize as colunas nesta sequência: <b>nome_completo → matricula → turma → turno</b>. Use a primeira linha para os títulos, exatamente como no exemplo:</p><div className="table"><table><thead><tr><th>nome_completo</th><th>matricula</th><th>turma</th><th>turno</th></tr></thead><tbody><tr><td>Maria Silva</td><td>2026001</td><td>IINF31</td><td>Vespertino</td></tr><tr><td>João Souza</td><td>2026002</td><td>IINF21</td><td>Integrado</td></tr></tbody></table></div><p><b>Obrigatório:</b> nome completo. Matrícula, turma e turno são opcionais. Se informar uma turma, ela deve estar previamente cadastrada no SICA; informe o turno para diferenciá-la quando necessário.</p><p><b>Formato:</b> CSV UTF-8 (.csv), com uma linha por aluno. Você pode baixar o modelo acima, preencher e salvar como CSV UTF-8.</p></div>{importFile&&<p><b>Arquivo:</b> {importFile}</p>}{importProgress&&<p>{importProgress}</p>}{importErrors.length>0&&<div style={{color:'#9a3412'}}><b>Corrija antes de importar:</b><ul>{importErrors.slice(0,12).map((x,i)=><li key={i}>{x}</li>)}</ul>{importErrors.length>12&&<p>Mais {importErrors.length-12} erro(s).</p>}</div>}{importRows.length>0&&<><h4>Prévia dos primeiros alunos</h4><Table heads={['Nome','Matrícula','Turma']} rows={importRows.slice(0,8).map(x=>[x.nome_completo,x.matricula||'—',className(x.turma_id)])}/><button type="button" disabled={busy||importErrors.length>0||!online} onClick={importStudents}>Confirmar importação de {importRows.length} aluno(s)</button></>}<p><small>A importação verifica matrículas repetidas e respeita as permissões do Supabase. Não importa linhas com erro. Não feche a página durante o envio.</small></p></div></>}</section>}



{page==='occurrences'&&<section className="panel"><h2>Registrar ocorrência</h2><form className="form" onSubmit={addOcc}><label>Aluno<select required value={aluno} onChange={e=>AO(e.target.value)}><option value="">Selecione</option>{students.filter(x=>x.ativo).map(x=><option value={x.id}>{x.nome_completo}</option>)}</select></label><label>Categoria<select required value={cat} onChange={e=>{AC(e.target.value);FI([]);AD('');HE('')}}><option value="">Selecione</option>{cats.filter(x=>['atraso','fardamento','desacato'].includes(x.nome.trim().toLocaleLowerCase('pt-BR'))).map(x=><option key={x.id} value={x.id}>{x.nome}</option>)}</select></label>{!cats.some(x=>['atraso','fardamento','desacato'].includes(x.nome.trim().toLocaleLowerCase('pt-BR')))&&<p>Cadastre as categorias Atraso, Fardamento e Desacato no banco de dados para habilitar o registro.</p>}<div style={{padding:12,background:'#edf5ef',border:'1px solid #b9c9bc',borderRadius:8,margin:'12px 0'}}><strong>Data e hora automáticas do registro</strong><div style={{fontSize:17,marginTop:6}}>{agora.toLocaleString('pt-BR',{timeZone:'America/Manaus',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'})} (horário de Manaus)</div><small>O horário definitivo será registrado ao salvar. Em caso de sincronização offline, será preservada a data e hora do registro no dispositivo.</small>{isAtraso&&<p style={{marginBottom:0}}>Atraso: este horário representa o momento do registro, não necessariamente o horário de chegada do aluno.</p>}</div>{isAtraso&&<label>Horário de entrada do aluno<input type="time" required value={horaEntrada} onChange={e=>HE(e.target.value)}/><small>Informe a hora em que o aluno realmente entrou. O horário de registro é salvo automaticamente e pode ser diferente.</small></label>}<label>Gravidade<select value={grav} onChange={e=>AV(e.target.value)}><option value="baixa">Baixa</option><option value="media">Média</option><option value="alta">Alta</option></select></label>{isFardamento&&<fieldset style={{border:'1px solid #b9c9bc',borderRadius:8,padding:12,margin:'10px 0'}}><legend><strong>Qual regra do fardamento o aluno descumpriu?</strong></legend>{itensFardamento.map(item=><label key={item.id} style={{display:'flex',alignItems:'center',gap:8,margin:'8px 0'}}><input type="checkbox" style={{width:'auto',margin:0}} checked={fardamentoItens.includes(item.id)} onChange={e=>FI(v=>e.target.checked?[...v,item.id]:v.filter(x=>x!==item.id))}/>{item.texto}</label>)}<p style={{fontSize:13}}>Mesmo selecionando várias regras, será registrada apenas uma ocorrência de Fardamento.</p>{fardamentoItens.length>0&&<p><strong>Descrição automática:</strong> Regras de fardamento descumpridas: {descricaoFardamento}.</p>}</fieldset>}<label>{isFardamento||isAtraso?'Observações adicionais (opcional)':'Descrição'}<textarea value={desc} onChange={e=>AD(e.target.value)} required={!isFardamento&&!isAtraso}/></label><button disabled={busy||(isFardamento&&!fardamentoItens.length)||(isAtraso&&!horaEntrada)}>Registrar ocorrência</button></form></section>}



{page==='depe'&&<section className="panel"><h2>Acompanhamento de encaminhamentos ao DEPE</h2><p>Os encaminhamentos são criados automaticamente após 3 ocorrências da mesma categoria no mês. As situações são atualizadas automaticamente enquanto o site estiver aberto (consulta de segurança a cada 15 segundos).</p><button type="button" className="ghost" onClick={load} disabled={busy}>Atualizar agora</button>{profile.papel==='depe'&&<button className="pdf" onClick={pdf}><FileDown/> PDF</button>}<Table heads={['Aluno','Categoria','Mês','Lote','Enviado em','Situação','Última atualização',...(profile.papel==='depe'?['Atualizar situação']:[])]} rows={refs.map(x=>[studentName(x.aluno_id),categoryName(x.categoria_id),String(x.competencia).slice(0,7),x.lote,new Date(x.enviado_em).toLocaleString('pt-BR',{timeZone:'America/Manaus'}),<strong>{referralLabel(x.situacao)}</strong>,x.atualizado_em?new Date(x.atualizado_em).toLocaleString('pt-BR',{timeZone:'America/Manaus'}):'—',...(profile.papel==='depe'?[<select aria-label={'Atualizar situação de '+studentName(x.aluno_id)} value={x.situacao} disabled={busy||!online} onChange={e=>updateReferral(x.id,e.target.value)}><option value="recebido">Enviado ao DEPE</option><option value="visualizado">Visualizada</option><option value="em_processo">Em andamento</option><option value="resolvido">Resolvida</option></select>]:[])])}/><small>Somente o DEPE pode alterar a situação. ADM e Registrador acompanham em modo de consulta.</small></section>}



{page==='users'&&['depe','admin'].includes(profile.papel)&&<section className="panel"><h2>Gerenciamento de usuários</h2><p>Crie convites para novos usuários. Cada convite é válido por 24 horas e pode ser utilizado uma única vez.</p><form className="form" onSubmit={generateInvite}><label>Perfil do novo usuário<select value={inviteRole} onChange={e=>{IR(e.target.value);IC('')}} required><option value="">Selecione o perfil</option>{(profile.papel==='depe'?['depe','admin']:['registrador']).map(r=><option key={r} value={r}>{r==='depe'?'DEPE':r==='admin'?'Administrador':'Registrador'}</option>)}</select></label><button disabled={busy||!inviteRole} type="submit"><UserPlus size={17}/> Gerar convite</button></form>{inviteCode&&<div className="panel"><h3>Código do convite</h3><p>Copie agora: por segurança, o código não poderá ser consultado novamente.</p><p style={{overflowWrap:'anywhere',fontWeight:'bold'}}>{inviteCode}</p><button type="button" onClick={()=>navigator.clipboard.writeText(inviteCode).then(()=>M('Código copiado.')).catch(()=>M('Não foi possível copiar automaticamente. Selecione o código acima.'))}><Copy size={17}/> Copiar código</button><p>Validade: 24 horas a partir da criação. Compartilhe apenas com a pessoa autorizada.</p></div>}<h2>Usuários cadastrados</h2><button type="button" className="ghost" onClick={loadUsers}>Atualizar lista</button><Table heads={['Nome completo','Perfil','Situação']} rows={inviteUsers.map(x=>[x.nome_completo,x.papel==='depe'?'DEPE':x.papel==='admin'?'Administrador':'Registrador',x.ativo?'Ativo':'Inativo'])}/><p>A ativação e a desativação de contas serão adicionadas após configurar uma função segura no banco.</p></section>}



 {page==='classes'&&['depe','admin'].includes(profile.papel)&&<section className="panel"><h2>Gerenciamento de turmas</h2><p>Cadastre turmas individualmente ou importe várias por planilha CSV UTF-8. O sistema verifica turma e turno para evitar duplicidades.</p><h3>Cadastrar turma</h3><form className="form" onSubmit={createClass}><label>Nome da turma<input required value={classNewName} onChange={e=>CNN(e.target.value)} placeholder="Ex.: IINF31"/></label><label>Turno<select value={classNewShift} onChange={e=>CNS(e.target.value)}><option>Matutino</option><option>Vespertino</option><option>Noturno</option><option>Integral</option><option>Integrado</option></select></label><button disabled={busy||!online}>Salvar turma</button></form><div className="panel" style={{marginTop:18}}><h3>Importar turmas por planilha</h3><p>Colunas obrigatórias: <b>turma</b> e <b>turno</b>. Salve o arquivo do Excel como <b>CSV UTF-8</b>.</p><button type="button" className="ghost" onClick={downloadClassModel}>Baixar modelo CSV de turmas</button><label>Selecionar planilha CSV<input type="file" accept=".csv,text/csv" onChange={readClassFile}/></label><div className="import-guide"><h4>Como organizar a planilha de turmas</h4><p>Organize as colunas nesta sequência: <b>turma → turno</b>. Use a primeira linha para os títulos, exatamente como no exemplo:</p><div className="table"><table><thead><tr><th>turma</th><th>turno</th></tr></thead><tbody><tr><td>IINF31</td><td>Vespertino</td></tr><tr><td>IINF21</td><td>Integrado</td></tr></tbody></table></div><p><b>Obrigatórios:</b> turma e turno em todas as linhas. Turnos aceitos: <b>Matutino, Vespertino, Noturno, Integral ou Integrado</b>.</p><p><b>Formato:</b> CSV UTF-8 (.csv), com uma linha por turma. Não repita a mesma combinação de turma e turno. Você pode baixar o modelo acima.</p></div>{classFile&&<p><b>Arquivo:</b> {classFile}</p>}{classProgress&&<p>{classProgress}</p>}{classErrors.length>0&&<div style={{color:'#9a3412'}}><b>Corrija antes de importar:</b><ul>{classErrors.slice(0,15).map((x,i)=><li key={i}>{x}</li>)}</ul></div>}{classRows.length>0&&<><h4>Prévia das turmas</h4><Table heads={['Turma','Turno']} rows={classRows.slice(0,12).map(x=>[x.nome,x.turno])}/><button type="button" disabled={busy||!online||classErrors.length>0} onClick={importClasses}>Confirmar importação de {classRows.length} turma(s)</button></>}</div><h3>Turmas cadastradas</h3><button type="button" className="ghost" onClick={loadAllClasses}>Atualizar lista</button><p>{allClasses.length} turma(s) cadastrada(s).</p><Table heads={['Turma','Turno','Situação','Editar','Ação']} rows={allClasses.map(x=>[x.nome,x.turno,x.ativo?'Ativa':'Inativa',<button type="button" className="ghost" disabled={busy||!online||!x.ativo} onClick={()=>openEdit('turma',x)}>Editar</button>,<button type="button" className="ghost" disabled={busy||!online} onClick={()=>openEdit('turma',x,x.ativo?'excluir':'reativar')}>{x.ativo?'Excluir':'Reativar'}</button>])}/><small>Desativar uma turma não exclui alunos nem ocorrências anteriores. Turmas inativas não aparecem nas opções de novos cadastros.</small></section>}



{page==='history'&&<section className="panel"><h2>Histórico geral e individual</h2><label>Pesquisar no histórico<input type="search" value={historySearch} onChange={e=>HSEARCH(e.target.value)} placeholder="Nome, matrícula, turma, categoria, descrição..."/></label><div className="form"><label>Aluno<select value={histStudent} onChange={e=>HS(e.target.value)}><option value="">Todos os alunos</option>{students.map(x=><option key={x.id} value={x.id}>{x.nome_completo}</option>)}</select></label><label>Categoria<select value={histCategory} onChange={e=>HC(e.target.value)}><option value="">Todas as categorias</option>{cats.map(x=><option key={x.id} value={x.id}>{x.nome}</option>)}</select></label><label>Gravidade<select value={histSeverity} onChange={e=>HV(e.target.value)}><option value="">Todas</option><option value="baixa">Baixa</option><option value="media">Média</option><option value="alta">Alta</option></select></label><label>Data inicial<input type="date" value={histStart} onChange={e=>HSTART(e.target.value)}/></label><label>Data final<input type="date" value={histEnd} onChange={e=>HEND(e.target.value)}/></label></div><p><b>{filteredOcc.length}</b> ocorrência(s) encontrada(s).</p><button className="pdf" onClick={pdf}><FileDown size={17}/> Gerar PDF {histStudent?'individual':'geral'} (com filtros)</button><button type="button" className="ghost" onClick={()=>{HSEARCH('');HS('');HC('');HV('');HSTART('');HEND('')}}>Limpar filtros</button><Table heads={['Aluno','Turma','Categoria','Gravidade','Descrição','Data','Registrado por','Acompanhamento DEPE','Ações']} rows={filteredOcc.map(x=>[studentName(x.aluno_id),className(students.find(a=>a.id===x.aluno_id)?.turma_id),categoryName(x.categoria_id),x.gravidade,x.descricao,dateText(x),auditNames[x.registrada_por]||'Usuário não identificado',referralForOcc(x)?referralLabel(referralForOcc(x).situacao):'Sem encaminhamento',editorButtons('ocorrencia',x)])}/><p>Consulta limitada aos 1.000 registros mais recentes carregados. Para relatórios completos com mais registros, será necessário acrescentar paginação.</p></section>}{page==='history'&&<section className="panel" style={{marginTop:18}}><h3>Auditoria de ocorrências</h3><label>Pesquisar na auditoria<input type="search" value={auditSearch} onChange={e=>ASEARCH(e.target.value)} placeholder="Aluno, responsável, motivo, operação..."/></label><p>Consulte as justificativas de edição e exclusão, a data, o responsável e as informações anteriores. Registradores visualizam somente as alterações das próprias ocorrências.</p><button type="button" className="ghost" disabled={busy||auditLoading||!online} onClick={loadAuditHistory}>{auditLoading?'Carregando...':'Ver auditoria / Atualizar'}</button>{auditRows.length>0&&<Table heads={['Aluno','Operação','Responsável','Data e hora','Justificativa','Detalhes']} rows={auditRows.filter(a=>[studentName(a.aluno_id),a.acao,a.responsavel,a.dados?.motivo,a.dados?.motivo_exclusao,JSON.stringify(a.dados||{})].join(' ').toLocaleLowerCase('pt-BR').includes(auditSearch.trim().toLocaleLowerCase('pt-BR'))).map(a=>[studentName(a.aluno_id),a.acao,a.responsavel||'Usuário não identificado',new Date(a.momento).toLocaleString('pt-BR',{timeZone:'America/Manaus'}),a.dados?.motivo||a.dados?.motivo_exclusao||'Não informado',<details><summary>Ver alterações</summary><pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',maxWidth:340}}>{JSON.stringify(a.dados,null,2)}</pre></details>])}/>}</section>}
{editRecord&&<div role="dialog" aria-modal="true" style={{position:'fixed',inset:0,zIndex:1000,background:'rgba(0,0,0,.55)',display:'flex',alignItems:'center',justifyContent:'center',padding:16}}><form onSubmit={saveEdit} style={{background:'white',color:'#20352a',borderRadius:12,padding:24,width:'min(100%,520px)',maxHeight:'90vh',overflowY:'auto',boxShadow:'0 12px 50px #0005'}}><h2>{editRecord.action==='editar'?'Editar':editRecord.action==='reativar'?'Reativar':'Excluir'} {editRecord.type==='aluno'?'aluno':editRecord.type==='turma'?'turma':'ocorrência'}</h2><p><b>Responsável:</b> {profile.nome_completo} (login atual)</p>{editRecord.action==='editar'&&<div className="form">{editRecord.type==='aluno'?<><label>Nome completo<input required value={editFields.nome||''} onChange={e=>EF({...editFields,nome:e.target.value})}/></label><label>Matrícula<input value={editFields.matricula||''} onChange={e=>EF({...editFields,matricula:e.target.value})}/></label><label>Turma<select value={editFields.turma_id||''} onChange={e=>EF({...editFields,turma_id:e.target.value})}><option value="">Sem turma</option>{classes.map(t=><option key={t.id} value={t.id}>{t.nome} — {t.turno}</option>)}</select></label></>:editRecord.type==='turma'?<><label>Turma<input required value={editFields.nome||''} onChange={e=>EF({...editFields,nome:e.target.value})}/></label><label>Turno<select value={editFields.turno||'Matutino'} onChange={e=>EF({...editFields,turno:e.target.value})}>{['Matutino','Vespertino','Noturno','Integral','Integrado'].map(t=><option key={t}>{t}</option>)}</select></label></>:<><label>Gravidade<select value={editFields.gravidade||'baixa'} onChange={e=>EF({...editFields,gravidade:e.target.value})}><option value="baixa">Baixa</option><option value="media">Média</option><option value="alta">Alta</option></select></label><label>Descrição<textarea required value={editFields.descricao||''} onChange={e=>EF({...editFields,descricao:e.target.value})}/></label></>}</div>}<label>Justificativa obrigatória (mínimo de 5 caracteres)<textarea required minLength={5} value={editReason} onChange={e=>EM(e.target.value)} placeholder="Explique o motivo da operação"/></label><p><small>Data, horário e responsável serão registrados automaticamente. Exclusões de alunos e turmas preservam o histórico.</small></p><div style={{display:'flex',gap:8,marginTop:12}}><button type="submit" disabled={busy||!online||editReason.trim().length<5}>Confirmar</button><button type="button" className="ghost" disabled={busy} onClick={()=>ER(null)}>Cancelar</button></div></form></div>}</main></div>}



function Table({heads,rows}){return <div className="table"><table><thead><tr>{heads.map(h=><th>{h}</th>)}</tr></thead><tbody>{rows.map(r=><tr>{r.map(v=><td>{v}</td>)}</tr>)}</tbody></table>{!rows.length&&<p>Nenhum registro encontrado.</p>}</div>}



createRoot(document.getElementById('root')).render(<App/>);s
