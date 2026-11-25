(function(){
const tasks=()=>state.assignedTests||[];
const group=(id,area,block)=>tasks().find(t=>t.employeeId===id&&t.area===area&&t.block===block&&t.workflowPreparation&&t.scope==='block');
window.raAssignGroup=function(id,area,encoded,example=false){
 if(state.auth!=='manager'&&!(example&&state.compactDemo&&state.auth==='staff'&&current().id===id))return;
 const block=decodeURIComponent(encoded);
 if(group(id,area,block)){showToast('Задание уже существует');return}
 const t={id:'group_'+Date.now(),employeeId:id,area,block,scope:'block',assignmentType:'training',workflowPreparation:true,assignedByManager:!example,demoExample:example,status:'new',createdAt:today(),presentation:!!state.compactDemo};
 if(!buildDemoQuestions(t).length){showToast('Нет полного банка вопросов раздела');return}
 tasks().push(t);save();render();showToast(example?'Учебный пример задания':'Задание назначено: '+block)
};
const rows=knowledgeRows;knowledgeRows=function(e,area){
 const h=document.createElement('div');h.innerHTML=rows(e,area);
 h.querySelectorAll('.knowledge-row-wrap').forEach((w,i)=>{
  const block=blocksFor(area)[i],actions=w.querySelector('.knowledge-actions');
  if(!actions||!block)return;
  if(area==='kitchen'&&block==='Салаты')w.dataset.demoSalads='1';
  const t=group(e.id,area,block),b=document.createElement('button');
  b.className='ghost';b.dataset.assignGroup='1';b.disabled=!!t;
  b.textContent=t?'Тест по разделу назначен':'Назначить тест по разделу';
  b.setAttribute('onclick','raAssignGroup('+JSON.stringify(e.id)+','+JSON.stringify(area)+','+JSON.stringify(encodeURIComponent(block))+')');
  actions.prepend(b)
 });
 return h.innerHTML
};
window.raMiniTraining=function(){
 if(state.auth!=='staff')return;
 const data=[
 ['Вкусная презентация','Главный ингредиент → 2–3 детали состава → вкусные слова → подача → финальный аргумент.'],
 ['Выявление потребности','Техника «ёлочка»: открытый вопрос → альтернативный выбор → уточнение вкуса → уверенная рекомендация.'],
 ['Уместные допродажи','Предложить аперитив, повтор напитка, пейринг, десерт или дижестив в подходящий момент.'],
 ['Подготовка к собранию','Знать стоп-лист, подготовить рекомендацию гостю, повторить 1–2 вопроса по меню или стандартам.']
 ];
 openModal('<div class="modal-head"><div><div class="kicker">Подготовка к тренингу</div><h2>Продажи через рекомендации</h2><p>Материал к ежедневному мини-тренингу.</p></div><button class="closebtn" onclick="closeModal()">×</button></div>'+data.map(x=>'<div class="fact wide"><span>'+esc(x[0])+'</span><b>'+esc(x[1])+'</b></div>').join('')+'<div class="modal-actions"><button class="primary" data-training-read onclick="raTrainingRead()">Материал изучен</button></div>');
};
window.raTrainingRead=function(){if(state.auth!=='staff')return;state.miniTrainingRead ||= {};state.miniTrainingRead[current().id]=today();save();closeModal();render();showToast('Подготовка к тренингу отмечена')};
const sh=staffHome;staffHome=function(){if(state.compactDemo)return sh();return sh()+'<section class="section section-lined"><div class="section-title"><span>•</span><div><h2>Подготовка к тренингам</h2><p>Ежедневное развитие навыков сервиса и продаж.</p></div></div><button class="card area-card" data-mini-training onclick="raMiniTraining()"><div class="area-top"><div><span class="badge">'+(state.miniTrainingRead?.[current().id]===today()?'Изучено':'Материал к тренингу')+'</span><h3>Продажи через рекомендации</h3></div><b>→</b></div></button></section>'};
// Public demonstration has one login per role. The manager retains the full team.
const rolesHTML=roleCards;
roleCards=function(){
 const box=document.createElement('div');box.innerHTML=rolesHTML();
 box.querySelectorAll('.role-card').forEach((b,i)=>{if(i>1)b.remove()});
 box.querySelector('.role-grid')?.classList.add('ra-demo-role-grid');
 return box.innerHTML
};
function enterDemoRole(role,target=null){
 if(!['Управляющий','Официант'].includes(role))return;
 if(state.compactDemo&&state.route==='roles'&&role!==(state.guideManagerDone?'Официант':'Управляющий'))return;
 closeModal();state.auth=null;state.role=role;state.studyAssignmentId=null;state.resumeStudyAssignmentId=null;state.slowSelfQuiz=null;
 if(role==='Управляющий'){state.currentEmployee='e1';state.demoHandoff=null;state.route='manager-pin'}
 else if(state.compactDemo){state.currentEmployee='e1';state.route='staff-pin'}
 else{
  const e=activeEmployees().find(x=>x.id===target&&x.role==='Официант');
  state.route=e?'staff-pin':'staff-select';
  if(e){state.currentEmployee=e.id;state.demoHandoff={employeeId:e.id,stage:'pin'}}
 }
 save();render();(window.raScrollPage||window.scrollTo.bind(window))({top:0,behavior:'auto'})
}
openRole=enterDemoRole;
selectStaff=function(id){
 if(state.compactDemo)return enterDemoRole('Официант');
 const e=activeEmployees().find(x=>x.id===id&&x.role==='Официант');if(!e)return;
 enterDemoRole('Официант',e.id)
};
window.quickSwitchToWaiter=function(){
 if(state.compactDemo){if(!state.assignedTests.some(t=>t.employeeId==='e1'&&t.block==='Салаты'&&t.itemId&&t.assignedByManager)){showToast('Сначала назначьте тест по одному салату');return}state.guideManagerDone=true;goRoles();return}
 const target=state.demoHandoff?.employeeId;
 const pending=state.assignedTests.filter(t=>['new','opened'].includes(t.status)&&activeEmployees().some(e=>e.id===t.employeeId&&e.role==='Официант'));
 enterDemoRole('Официант',pending.find(t=>t.employeeId===target)?.employeeId||pending.at(-1)?.employeeId||null)
};
window.quickSwitchToManager=function(){if(state.compactDemo){showToast('Завершите демонстрацию официанта или выйдите из сопровождения');return}enterDemoRole('Управляющий')};
const baseRender=render;
render=function(){
 if(state.compactDemo&&state.route==='staff-select'){state.role='Официант';state.auth=null;state.currentEmployee='e1';state.route=state.employees.some(e=>e.id==='e1'&&e.active!==false)?'staff-pin':'roles';save()}
 if(state.compactDemo&&(state.auth==='staff'||state.route==='staff-pin')){state.currentEmployee='e1';state.role='Официант'}
 baseRender()
};
render()
})();