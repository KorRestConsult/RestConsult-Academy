(function(){
const records=()=>state.selfKnowledge ||= {};
const key=(area,block,item)=>[current().id,area,block,item||'*'].join('|');
const label=q=>q.itemId?'Тест по блюду':'Тест по разделу';
function backToMenu(q){state.slowSelfQuiz=null;state.studyAssignmentId=null;state.learnArea=q.area;state.route='learn';save();render();showBlock(q.area,q.block)}
window.raSelfReturn=function(){const q=state.slowSelfQuiz;if(q)backToMenu(q)};
window.raSelfRetry=function(){const q=state.slowSelfQuiz;if(!q)return;startSelfSlowQuiz(q.area,encodeURIComponent(q.block),q.itemId,encodeURIComponent(q.label))};
function pass(q){
 if(!q||q.index<q.questions.length||q.recorded)return;
 q.recorded=true;
 const score=Math.round(q.score/q.questions.length*100);
 const k=key(q.area,q.block,q.itemId),prev=records()[k];
 records()[k]={employeeId:current().id,area:q.area,block:q.block,itemId:q.itemId||null,score,best:Math.max(score,prev?.best||0),attempts:(prev?.attempts||0)+1,date:today()};
 if(!q.itemId&&score===100){
  let p=state.assignedTests.find(t=>t.employeeId===current().id&&t.area===q.area&&t.block===q.block&&t.workflowPreparation&&!t.assignedByManager&&!t.demoExample);
  if(!p){p={id:'self_'+Date.now(),employeeId:current().id,area:q.area,block:q.block,scope:'block',assignmentType:'training',workflowPreparation:true,status:'done',createdAt:today()};state.assignedTests.push(p)}
  Object.assign(p,{selfBlockPassed:true,status:'done',score:100,correct:q.score,total:q.questions.length,completedAt:today()+' '+testTime(),managerSeen:false});
  q.preparationId=p.id;
 }
 save()
}
const baseNext=window.slowSelfNext;
window.slowSelfNext=function(){baseNext();const q=state.slowSelfQuiz;if(q?.index>=q.questions.length){pass(q);render()}};
const selfRender=renderStaff;
renderStaff=function(){
 const q=state.slowSelfQuiz;
 if(state.route!=='slow-self-quiz'||!q||q.index<q.questions.length)return selfRender();
 pass(q);
 const p=state.assignedTests.find(t=>t.id===q.preparationId),score=Math.round(q.score/q.questions.length*100);
 const request=p&&score===100&&!['requested','assigned','accepted'].includes(p.requestStatus);
 return '<section class="quiz-shell"><div class="quiz-card quiz-result"><div class="quiz-kicker">'+label(q)+' · завершён</div><div class="result-circle"><strong>'+q.score+'/'+q.questions.length+'</strong></div><h1>'+esc(q.label)+'</h1><p>'+score+'% правильных ответов. Тренировка не меняет официальный рейтинг.</p>'+(q.itemId?'<p>Продолжите изучать позиции или проверьте весь раздел.</p>':score===100?'<p>Вы готовы запросить аттестацию у управляющего.</p>':'<p>Повторите материал. Для запроса аттестации нужно 100% по разделу.</p>')+'<div class="split-actions" style="justify-content:center">'+(request?'<button class="primary" data-self-request onclick="raSelfRequest()">Готов к аттестации</button>':p?.requestStatus?'<span class="badge">Запрос уже обработан или отправлен</span>':'')+(q.itemId?'<button class="primary" data-self-block onclick="raSelfBlock()">Тест по всему разделу</button>':'')+'<button class="ghost" data-self-return onclick="raSelfReturn()">К меню</button><button class="ghost" onclick="raSelfRetry()">Повторить тест</button></div></div></section>'
};
window.raSelfBlock=function(){const q=state.slowSelfQuiz;if(!q)return;startSelfSlowQuiz(q.area,encodeURIComponent(q.block),null,encodeURIComponent(q.block))};
window.raSelfRequest=function(){const q=state.slowSelfQuiz;if(!q?.preparationId)return;raRequestReview(q.preparationId);const p=state.assignedTests.find(t=>t.id===q.preparationId);if(p?.requestStatus==='requested')backToMenu(q)};
const bc=blockHTML;
blockHTML=function(area,block){
 let h=bc(area,block);
 if(state.auth!=='staff')return h;
 const box=document.createElement('div');box.innerHTML=h;
 const b=box.querySelector('.head .ghost');if(b){b.dataset.selfBlock='1';b.textContent='Тест по всему разделу'}
 box.querySelectorAll('.menu-card').forEach((el,i)=>{const x=STOCK[area].filter(x=>x.block===block)[i];const r=x&&records()[key(area,block,x.id)];if(r){const bd=document.createElement('span');bd.className='badge';bd.textContent='Тест: '+r.best+'%';el.querySelector('.menubody')?.append(bd)}});
 const r=records()[key(area,block,null)];
 const p=state.assignedTests.find(t=>t.employeeId===current().id&&t.area===area&&t.block===block&&t.selfBlockPassed);
 if(r){const note=document.createElement('div');note.className='notice';note.textContent='Самостоятельная тренировка раздела: '+r.best+'%';if(p&&!['requested','assigned','accepted'].includes(p.requestStatus)){const btn=document.createElement('button');btn.className='primary';btn.textContent='Готов к аттестации';btn.onclick=null;btn.setAttribute('onclick',"raRequestReview('"+p.id+"');showBlock('"+area+"','"+block.replace(/'/g,"\\'")+"')");note.append(btn)}else if(p?.requestStatus)note.append(' · Запрос: '+({requested:'отправлен',assigned:'аттестация назначена',accepted:'подтверждена',rejected:'на повторную подготовку'}[p.requestStatus]||p.requestStatus));box.prepend(note)}
 return box.innerHTML
};
// Return from an individual practice test to the assigned list if it was opened there.

window.raAssignedStudyResume=()=>state.resumeStudyAssignmentId;
window.raStudySelfTest=function(id){
 const x=findMenu(id),t=state.assignedTests.find(t=>t.id===state.studyAssignmentId);
 if(!x||!t||t.employeeId!==current().id)return;
 state.resumeStudyAssignmentId=t.id;closeModal();state.studyAssignmentId=null;save();
 startSelfSlowQuiz(x.area,encodeURIComponent(x.block),x.id,encodeURIComponent(x.name))
};
const rawReturn=window.raSelfReturn;
window.raSelfReturn=function(){
 if(state.resumeStudyAssignmentId){const id=state.resumeStudyAssignmentId;state.resumeStudyAssignmentId=null;state.slowSelfQuiz=null;studyAssignmentMaterial(id);return}
 rawReturn()
};
const rawRequest=window.raSelfRequest;
window.raSelfRequest=function(){const id=state.resumeStudyAssignmentId;rawRequest();if(id&&state.route==='learn'){state.resumeStudyAssignmentId=null;studyAssignmentMaterial(id)}};
const listBlock=blockHTML;
blockHTML=function(area,block){
 const box=document.createElement('div');box.innerHTML=listBlock(area,block);
 const grid=box.querySelector('.menu-grid');if(!grid||state.auth!=='staff')return box.innerHTML;
 const items=STOCK[area].filter(x=>x.block===block);
 const list=document.createElement('div');list.className='ra-dish-list';
 list.innerHTML=items.map(x=>{
  const record=records()[key(area,block,x.id)];
  return '<div class="ra-dish-row"><button class="ra-dish-open menu-card" onclick="openMenu(\''+x.id+'\')">'+(x.photo?'<img loading="lazy" src="'+esc(x.photo)+'" alt="">':'')+'<span><b>'+esc(x.name)+'</b><small>'+esc(x.price||'—')+' · '+esc(x.weight||x.volume||'—')+'</small>'+(record?'<small>Тест: '+record.best+'%</small>':'')+'</span><span class="ra-dish-chevron">›</span></button><button class="ghost" data-dish-test onclick="startSelfSlowQuiz(\''+area+'\',\''+encodeURIComponent(block)+'\',\''+x.id+'\',\''+encodeURIComponent(x.name)+'\')">Тест по блюду</button></div>'
 }).join('');
 grid.replaceWith(list);return box.innerHTML
};
const oldShow=showBlock;
showBlock=function(area,block){state.selfMenuBlock=block;oldShow(area,block)};
const oldLearn=learnPage;
learnPage=function(){return oldLearn().replace('<p>Меню по блокам</p>','<p>База знаний заведения · изучайте блюда и проверяйте себя</p>')};
const renderList=render;
render=function(){renderList();if(state.auth==='staff'&&state.route==='learn'&&!state.studyAssignmentId&&state.selfMenuBlock&&blocksFor(state.learnArea).includes(state.selfMenuBlock))showBlock(state.learnArea,state.selfMenuBlock)};

const oldRestart=window.restartAcademyTour;
window.restartAcademyTour=function(){state.resumeStudyAssignmentId=null;state.selfKnowledge={};state.slowSelfQuiz=null;state.selfMenuBlock=null;return oldRestart.apply(this,arguments)};
render()
})();