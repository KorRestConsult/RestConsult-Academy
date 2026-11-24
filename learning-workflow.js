(function(){
const tasks=()=>state.assignedTests||[];
const own=()=>current().id;
const byId=id=>tasks().find(t=>t.id===id);
const prepFor=(id,area,block)=>tasks().find(t=>t.employeeId===id&&t.workflowPreparation&&t.area===area&&t.block===block);
const officialFor=p=>tasks().filter(t=>t.employeeId===p.employeeId&&t.assignmentType==='attestation'&&t.area===p.area&&t.block===p.block&&!t.itemId).at(-1);
const studied=t=>new Set(state.assignmentStudyProgress?.[t.id]?.reviewedIds||[]).size;
const total=t=>STOCK[t.area].filter(x=>x.block===t.block&&(!t.itemId||x.id===t.itemId)).length;
const label=t=>t.workflowPreparation?'Самостоятельная подготовка':t.assignmentType==='attestation'?'Аттестация':'Тест по блюду';
const status=t=>t.status==='submitted'?'Ожидает подтверждения':t.status==='rejected'?'На повторную подготовку':t.status==='done'?(t.assignmentType==='attestation'?'Подтверждена':'Выполнено · '+t.score+'%'):t.status==='opened'?'В процессе':studied(t)?'Изучено '+studied(t)+' / '+total(t):'Назначено';
const action=(cls,fn,txt,attr='')=>'<button class="'+cls+'" '+attr+' onclick="'+fn+'">'+txt+'</button>';
const arg=x=>"'"+encodeURIComponent(x).replace(/'/g,'%27')+"'";
window.raPrepareBlock=function(area,encoded){
 if(state.auth!=='staff')return;
 const block=decodeURIComponent(encoded);
 let t=prepFor(own(),area,block);
 if(t){if(t.status==='done')return;studyAssignmentMaterial(t.id);return}
 t={id:'prep_'+Date.now(),employeeId:own(),area,block,scope:'block',assignmentType:'training',workflowPreparation:true,status:'new',createdAt:today(),presentation:!!state.compactDemo};
 if(!buildDemoQuestions(t).length){showToast('Нет полного банка вопросов для раздела');return}
 tasks().push(t);save();render();studyAssignmentMaterial(t.id)
};
window.raRequestReview=function(id){
 const p=byId(id);if(state.auth!=='staff'||!p||p.employeeId!==own()||!p.workflowPreparation||p.status!=='done'||p.score!==100||studied(p)<total(p))return;
 if(p.requestStatus==='requested'||p.requestStatus==='assigned')return;
 p.requestStatus='requested';p.requestedAt=today()+' '+testTime();save();render();showToast('Готовность к аттестации отправлена управляющему')
};
window.raAssignRequested=function(id){
 const p=byId(id);if(state.auth!=='manager'||!p||p.requestStatus!=='requested'||p.score!==100)return;
 const prev=officialFor(p);
 if(prev&&['new','opened','submitted'].includes(prev.status))return;
 runAttestationPlaceholder(p.employeeId,p.area,encodeURIComponent(p.block));
 const t=officialFor(p);
 if(!t||t===prev)return;
 t.preparationId=p.id;t.materialReviewed=true;
 state.assignmentStudyProgress ||= {};state.assignmentStudyProgress[t.id]={reviewedIds:[...(state.assignmentStudyProgress[p.id]?.reviewedIds||[])]};
 p.requestStatus='assigned';save();render()
};
window.raOpenReview=function(id){
 const t=byId(id);if(state.auth!=='manager'||!t||t.status!=='submitted')return;
 const e=emp(t.employeeId);
 openModal('<div class="modal-head"><div><div class="kicker">Подтверждение управляющим</div><h2>'+esc(t.block)+'</h2><p>'+esc(e.name)+' · тест '+t.correct+'/'+t.total+' ('+t.score+'%)</p></div><button class="closebtn" onclick="closeModal()">×</button></div><div class="notice">Рейтинг пока '+rating(e)+'%. Оценка практики проводится отдельно от знаний меню.</div><h3>Практическая оценка</h3><p>Сервис, продажи, стандарты · шкала 0–20</p>'+['Сервис','Продажи','Стандарты'].map((x,i)=>'<label class="ra-practical-row">'+x+'<input type="range" min="0" max="20" value="10" data-practical="'+i+'" oninput="this.nextElementSibling.textContent=this.value"><output>10</output></label>').join('')+'<p class="ra-practical-note">Оценки задаёт управляющий после наблюдения за работой. В демонстрации — условная оценка.</p><div class="modal-actions">'+action('ghost','raResolveReview('+arg(id)+',false)','На повторную подготовку')+action('primary','raResolveReview('+arg(id)+',true)','Подтвердить аттестацию','data-review-accept')+'</div>')
};
window.raResolveReview=function(encoded,accept){
 const t=byId(decodeURIComponent(encoded));if(state.auth!=='manager'||!t||t.status!=='submitted'||!t.pendingAttestation)return;
 const e=emp(t.employeeId),p=byId(t.preparationId);
 if(accept){
  const values=[...document.querySelectorAll('[data-practical]')].map(x=>Number(x.value));
  if(values.length!==3||values.some(v=>!Number.isFinite(v)||v<0||v>20))return;
  e.attestations||=[];if(!e.attestations.some(a=>a.assignmentId===t.id))e.attestations.push({...t.pendingAttestation,acceptedAt:today()+' '+testTime(),confirmed:true});
  t.status='done';t.confirmedAt=today()+' '+testTime();t.managerSeen=true;t.practical={service:values[0],sales:values[1],standards:values[2],date:today()};e.practical=t.practical;
  if(p)p.requestStatus='accepted';
 }else{t.status='rejected';t.managerSeen=true;if(p){p.requestStatus='rejected';p.status='new';p.materialReviewed=false;if(state.assignmentStudyProgress)delete state.assignmentStudyProgress[p.id]}}
 save();closeModal();render();showToast(accept?'Аттестация подтверждена. Рейтинг обновлён.':'Назначена повторная подготовка')
};
const oldFinish=finishTrainingTest;
finishTrainingTest=function(){const t=byId(state.activeQuiz?.testId);oldFinish();if(t?.workflowPreparation&&t.score!==100){t.status='new';save();render()}};
const oldResult=trainingTestResultPage;
trainingTestResultPage=function(){let html=oldResult();const t=byId(state.activeQuiz?.testId);if(t?.workflowPreparation){html=html.replace('Это тренировочный тест — общий рейтинг сотрудника не изменился.',t.score===100?'Блок готов к аттестации. Запросите подтверждение у управляющего.':'Для готовности к аттестации требуется 100%. Повторите тренировку.');}return html};
function prepPanel(e){
 const t=tasks().filter(x=>x.employeeId===e.id&&x.assignmentType==='training'&&!x.workflowPreparation).at(-1);
 const area=t?.area||'kitchen',block=t?.block||blocksFor(area)[0],p=prepFor(e.id,area,block);
 if(!block)return '';
 let button='';
 if(!p)button=action('primary','raPrepareBlock('+arg(area)+','+arg(block)+')','Изучить весь раздел','data-prep-start');
 else if(p.status==='done'&&p.score===100&&!['requested','assigned','accepted'].includes(p.requestStatus))button=action('primary','raRequestReview('+arg(p.id)+')','Готов к аттестации','data-prep-request');
 else if(p.status!=='done'&&p.materialReviewed)button=action('primary','openAssignedTest('+arg(p.id)+')','Пройти тренировку раздела','data-prep-quiz');
 const text=p?(p.requestStatus==='requested'?'Запрос отправлен управляющему':p.requestStatus==='assigned'?'Аттестация назначена':p.requestStatus==='accepted'?'Аттестация подтверждена':p.score===100?'Тренировка 100% · можно запросить аттестацию':'Изучено '+studied(p)+' / '+total(p)+' · тренировка до 100%'):'Изучите весь раздел и подтвердите готовность тренировкой на 100%.';
 return '<section class="section ra-workflow-prep"><h2>Подготовка к аттестации</h2><div class="card"><h3>'+esc(block)+'</h3><p>'+text+'</p>'+button+'</div></section>'
}
function managerPanel(e=null){
 const list=tasks().filter(t=>!e||t.employeeId===e.id);
 if(!list.length)return '';
 return '<section class="section ra-workflow-manager"><h2>Обучение и аттестации</h2><div class="card">'+list.map(t=>{
 const p=t.workflowPreparation,st=p&&t.requestStatus==='requested'?'Готов к аттестации':p&&t.requestStatus==='assigned'?'Аттестация назначена':p&&t.requestStatus==='accepted'?'Подтверждено':status(t);
 let btn=p&&t.requestStatus==='requested'?action('primary','raAssignRequested('+arg(t.id)+')','Назначить аттестацию','data-request-assign'):t.status==='submitted'?action('primary','raOpenReview('+arg(t.id)+')','Проверить результат','data-review-open'):'';
 return '<div class="ra-workflow-row"><div><b>'+esc(emp(t.employeeId).name)+' · '+esc(t.itemName||t.block)+'</b><small>'+label(t)+' · '+st+'</small>'+(studied(t)?'<small>Материалы: '+studied(t)+' / '+total(t)+'</small>':'')+'</div>'+btn+'</div>'
 }).join('')+'</div></section>'
}
const sh=staffHome;staffHome=function(){const e=current(),html=sh();return html+prepPanel(e)+(e.practical?'<section class="section"><h2>Практическая оценка</h2><div class="card">Сервис '+e.practical.service+'/20 · Продажи '+e.practical.sales+'/20 · Стандарты '+e.practical.standards+'/20</div></section>':'')};
const mh=managerHome;managerHome=function(){return managerPanel()+mh()};
const ed=employeeDetailPage;employeeDetailPage=function(){const e=current();return ed()+managerPanel(e)+(e.practical?'<section class="section"><h2>Практическая оценка</h2><div class="card">Сервис '+e.practical.service+'/20 · Продажи '+e.practical.sales+'/20 · Стандарты '+e.practical.standards+'/20</div></section>':'')};
const bh=blockHTML;blockHTML=function(area,block){return bh(area,block)+(state.auth==='staff'?'<div class="card">'+action('primary','raPrepareBlock('+arg(area)+','+arg(block)+')','Подготовиться к аттестации раздела')+'</div>':'')};
render()
})();