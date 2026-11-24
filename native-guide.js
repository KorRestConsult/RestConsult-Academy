(function(){
const guided=()=>!!state.compactDemo;
const task=k=>state.assignedTests.find(t=>t.employeeId==='e1'&&t.assignmentType===k);
const modal=()=>document.getElementById('modalWrap').classList.contains('open');
const step=(sel,title,desc,n)=>({sel,title,desc,n});
function currentStep(){
 const t=state.assignedTests.find(x=>x.employeeId==='e1'&&x.assignmentType==='training'&&!x.workflowPreparation),p=state.assignedTests.find(x=>x.employeeId==='e1'&&x.workflowPreparation),a=task('attestation'),m=modal(),r=state.route;
 if(r==='roles')return step('.role-card:first-child','Кабинет управляющего','Знания команды и показатели продаж помогают планировать обучение.',1);
 if(r==='staff-select')return step('.staff-select-card.handoff-target,.staff-select-card[onclick*="e1"]','Кабинет официанта','Персональные задания и собственный прогресс.',4);
 if(state.auth==='manager'){
  if(!state.guideSales)return m?step('#modal .closebtn','Коммерческие показатели','Личные продажи и средний чек — ориентиры для оценки эффективности. Закройте отчёт.',1):step('.ra-ops-tile[onclick="raOpsFinance()"]','Контроль продаж','Посмотрите выручку, план и средний чек.',1);
  if(!t){
   if(r!=='employee-detail')return step('.employee-compact[data-employee-id="e1"]','Рейтинг знаний','Выберите сотрудника: видно, какие знания нуждаются в проверке.',2);
   if(m)return step('#modal [data-dish]','Точечная тренировка','Выберите блюдо: состав, вкусные слова, рекомендации и допродажи.',3);
   if(!document.querySelector('[data-demo-block].open'))return step('[data-demo-block] .knowledge-row','Диагностика знаний','Откройте раздел, чтобы выявить пробелы.',2);
   return step('[data-demo-block] .knowledge-actions .ghost','Тест по блюду','Тренировка выявляет ошибки, не изменяя рейтинг.',3);
  }
  if(p?.requestStatus==='requested')return step('[data-request-assign]','Официант готов к аттестации','Управляющий видит тренировку на 100% и изученные позиции. Теперь можно назначить итоговую проверку.',7);
  if(a?.status==='submitted'){
   if(m)return step('[data-review-accept]','Решение управляющего','Оцените сервис, продажи и стандарты отдельно. Подтвердите знания — только теперь изменится рейтинг.',10);
   return step('[data-review-open]','Проверка результата','Результат аттестации получен. До подтверждения рейтинг не меняется.',10)
  }
  if(a?.status!=='done')return step('.quick-role-waiter',a?'Аттестация назначена':'Задание назначено','Посмотрите обучение со стороны официанта.',a?8:4);
  if(!state.guideManagerCheck){
   if(m)return step('#modal .closebtn','Контроль исполнения','Видны сотрудник и время выполнения задачи.',11);
   if(r==='employee-detail')return step('.backline button','Контроль смены','Вернитесь в команду.',11);
   return step('.ra-ops-tile[onclick="raOpsChecks()"]','Стандарты смены','Проверьте исполнение чек-листа.',11)
  }
  if(r!=='employee-detail')return step('.employee-compact[data-employee-id="e1"]','Измеримый результат','Откройте обновлённый рейтинг и историю обучения.',12);
  return step('.detail-total','Результат','Знания подтверждены управляющим. Влияние на средний чек и выручку отслеживается по фактическим продажам.',12)
 }
 if(state.auth==='staff'){
  if(m&&state.studyAssignmentId)return step('#modal .ra-study-actions .primary','Материал для продаж','Изучите состав, вкусные слова и скрипт рекомендации.',p?5:4);
  if(r==='assigned-test')return state.activeQuiz?.feedbackShown?step('.quiz-card .primary','Обратная связь','Тренировка объясняет ошибки. Рейтинг не меняется.',p?5:4):step('.quiz-options','Проверка знаний','Выберите ответ.',p?5:4);
  if(r==='assigned-test-result')return step('.quiz-result .primary','Результат тренировки','Вернитесь в кабинет. Для готовности к аттестации нужен результат 100% по разделу.',p?5:4);
  if(r==='assigned-attestation')return state.activeAttestation?.answers?.[state.activeAttestation.index]!==undefined?step('.attestation-next','Аттестация','Продолжите итоговую проверку.',8):step('.quiz-options','Аттестация','Ответьте без подсказок. Итог проверит управляющий.',8);
  if(r==='assigned-attestation-result')return step('.attestation-result .primary','Результат отправлен','Рейтинг пока прежний. Управляющий должен принять результат.',8);
  if(t?.status!=='done')return step('.assigned-test .ra-assignment-actions .ghost','Изучение блюда','Откройте карточку: знания меню становятся навыками продаж.',4);
  if(!p)return step('[data-prep-start]','Самостоятельное обучение','Официант изучает весь раздел и тренируется до готовности к аттестации.',5);
  if(p.status!=='done')return p.materialReviewed?step('[data-prep-quiz]','Тренировка раздела','Проверка всех блюд. Повторяйте до 100%.',5):step('.assigned-test .ra-assignment-actions .ghost','Изучение раздела','Продолжите подготовку.',5);
  if(!p.requestStatus||p.requestStatus==='rejected')return step('[data-prep-request]','Готов к аттестации','Официант сам заявляет о готовности после успешной тренировки.',6);
  if(p.requestStatus==='requested')return step('.quick-role-manager','Запрос управляющему','Управляющий получит запрос и сможет назначить аттестацию.',7);
  if(a&&['new','opened'].includes(a.status))return step('.attestation-card .ra-assignment-actions .primary','Итоговая аттестация','Материал уже изучен, повторное чтение не требуется.',8);
  if(!state.guideHall){if(m)return step('#modal input[data-shift-id]','Стандарт смены','Отметьте выполнение задачи.',9);return step('.ra-ops-tile[onclick="raOpsChecks()"]','Ежедневные стандарты','Откройте чек-лист смены.',9)}
  if(m)return step('#modal .closebtn','Отметка сохранена','Закройте чек-лист.',9);
  return step('.quick-role-manager','Возврат к управляющему','Проверьте результаты обучения и исполнения стандартов.',10)
 }
 return null
}
let target=null,card=null,frame=0,lastKey='',reveal=false;
let views=[],restoring=false;
const view=()=>({route:state.route,auth:state.auth,role:state.role,currentEmployee:state.currentEmployee,learnArea:state.learnArea,expandedKnowledgeKey:state.expandedKnowledgeKey});
const viewKey=v=>[v.route,v.auth,v.role,v.currentEmployee].join('|');
function remember(){const v=view();if(!restoring&&viewKey(v)!==viewKey(views.at(-1)||{}))views.push(v)}
function goBack(){
 if(modal()){const t=state.assignedTests.find(x=>x.id===state.studyAssignmentId);if(t){const img=document.querySelector('#modal .ra-study-actions button');const match=img?.getAttribute('onclick')?.match(/markStudyItemAndNext\('([^']+)'\)/);const items=STOCK[t.area].filter(x=>x.block===t.block&&(!t.itemId||x.id===t.itemId));const i=items.findIndex(x=>x.id===match?.[1]);if(i>0){openMenu(items[i-1].id);return}state.studyAssignmentId=null;closeModal();state.route='home';save();render();return}closeModal();return}
 if(state.route==='assigned-test'&&state.activeQuiz?.index>0){state.activeQuiz.index--;state.activeQuiz.feedbackShown=state.activeQuiz.answers[state.activeQuiz.index]!==undefined;save();render();return}
 if(state.route==='assigned-attestation'&&state.activeAttestation?.index>0){state.activeAttestation.index--;save();render();return}
 if(state.route==='roles'){window.RASalesIntro?.show();return}
 if(['assigned-test','assigned-test-result','assigned-attestation','assigned-attestation-result','learn'].includes(state.route)){state.route='home';state.studyAssignmentId=null;save();render();return}
 views.pop();let prev=views.pop();while(prev&&/quiz|assigned-|learn/.test(prev.route))prev=views.pop();
 if(!prev){prev={route:'roles',auth:null,role:null,currentEmployee:state.currentEmployee}}
 restoring=true;Object.assign(state,prev);state.studyAssignmentId=null;save();render();restoring=false;views.push(view());lastKey='';schedule()
}
function clear(){target?.classList.remove('ra-native-target');target=null;card?.remove();card=null}
function finish(){state.compactDemo=false;state.demoHandoff=null;localStorage.setItem('ra-tour:optout','1');save();clear();render()}
function launch(){window.RASalesIntro?.hide();window.restartAcademyTour()}
function place(){
frame=0;document.body.classList.toggle('ra-native-guided',guided());
if(!guided()){clear();const root=document.getElementById('root');if(root&&!document.getElementById('raDemoLaunch')){const b=document.createElement('button');b.id='raDemoLaunch';b.className='primary';b.textContent='Начать демонстрацию';b.onclick=launch;root.prepend(b)}return}
document.getElementById('raDemoLaunch')?.remove();
const s=currentStep();if(!s){clear();return}
const el=[...document.querySelectorAll(s.sel)].find(e=>e.getBoundingClientRect().width>0&&!e.disabled);
if(!el){clear();if(!card){card=document.createElement('aside');card.id='raNativeGuide';document.body.append(card);card.style.left='16px';card.style.top='90px';card.innerHTML='<div class="ra-native-meta"><span>Демонстрация</span><button data-back>Назад</button><button data-quit>Выйти</button></div><h3>Продолжить</h3><p>Вернитесь к предыдущему экрану, чтобы продолжить обучение.</p>';card.querySelector('[data-back]').onclick=goBack;card.querySelector('[data-quit]').onclick=finish}return}
const key=s.sel+'|'+s.title;
if(target!==el){target?.classList.remove('ra-native-target');target=el;el.classList.add('ra-native-target')}
if(key!==lastKey){lastKey=key;reveal=true}
if(!card){card=document.createElement('aside');card.id='raNativeGuide';document.body.append(card)}
const chapter=state.auth==='manager'||state.route==='roles'?'Управляющий':'Официант';
if(card.dataset.key!==key){card.dataset.key=key;card.innerHTML='<div class="ra-native-meta"><span>'+chapter+' · '+s.n+' / 12</span><button data-back>Назад</button><button data-quit>Выйти</button></div><h3>'+s.title+'</h3><p>'+s.desc+'</p>'+(s.n===12&&state.route==='employee-detail'?'<button class="primary" data-finish>Завершить</button>':'');card.querySelector('[data-quit]').onclick=finish;card.querySelector('[data-back]').onclick=goBack;const f=card.querySelector('[data-finish]');if(f)f.onclick=finish}
if(reveal){reveal=false;const r=el.getBoundingClientRect();if(r.top<70||r.bottom>innerHeight-60){if(!state.studyAssignmentId||!modal())el.scrollIntoView({block:'center',behavior:'auto'})}}
const r=el.getBoundingClientRect(),w=card.offsetWidth,h=card.offsetHeight,g=14,vh=innerHeight,vw=innerWidth;
let x,y;if(r.right+w+g<vw){x=r.right+g;y=Math.min(Math.max(12,r.top),vh-h-12)}else if(r.left>w+g){x=r.left-w-g;y=Math.min(Math.max(12,r.top),vh-h-12)}else if(r.bottom+h+g<vh&&r.bottom>0){x=Math.min(Math.max(12,r.left),vw-w-12);y=r.bottom+g}else{x=Math.min(Math.max(12,r.left),vw-w-12);y=Math.max(12,Math.min(vh-h-12,r.top-h-g))}
card.style.left=x+'px';card.style.top=y+'px'
}
function schedule(){if(!frame)frame=requestAnimationFrame(place)}
document.addEventListener('click',e=>{
if(!guided())return;const s=currentStep();if(!s)return;
if(s.n===1&&modal()&&e.target.closest('#modal .closebtn'))state.guideSales=true;
if(s.n===11&&modal()&&e.target.closest('#modal .closebtn'))state.guideManagerCheck=true;
if(s.n===9&&e.target.matches('#modal input[data-shift-id]'))state.guideHall=e.target.checked;
save();setTimeout(schedule,30)
},true);
window.addEventListener('resize',schedule);window.addEventListener('scroll',schedule,true);
const ae=activeEmployees;activeEmployees=function(){return ae().filter(e=>!guided()||e.role!=='Бармен')};
const base=render;render=function(){base();if(guided())remember();schedule()};
const om=openModal,cm=closeModal;openModal=function(){om.apply(this,arguments);schedule()};closeModal=function(){cm.apply(this,arguments);schedule()};
const reset=window.restartAcademyTour;
window.restartAcademyTour=async function(){state.compactDemo=true;state.compactVersion=7;views=[];state.shiftChecks={};state.guideSales=false;state.guideHall=false;state.guideManagerCheck=false;lastKey='';await reset();schedule()};
if(state.compactDemo&&state.compactVersion!==7){state.compactDemo=false;save()}
render();
})();