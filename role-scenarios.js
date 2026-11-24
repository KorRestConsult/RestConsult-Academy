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
const sh=staffHome;staffHome=function(){return sh()+'<section class="section section-lined"><div class="section-title"><span>•</span><div><h2>Подготовка к тренингам</h2><p>Ежедневное развитие навыков сервиса и продаж.</p></div></div><button class="card area-card" data-mini-training onclick="raMiniTraining()"><div class="area-top"><div><span class="badge">'+(state.miniTrainingRead?.[current().id]===today()?'Изучено':'Материал к тренингу')+'</span><h3>Продажи через рекомендации</h3></div><b>→</b></div></button></section>'};
render()
})();