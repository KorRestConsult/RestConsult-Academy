(function(){
const guided=()=>!!state.compactDemo;
const task=k=>state.assignedTests.find(t=>t.employeeId==='e1'&&t.assignmentType===k);
const modal=()=>document.getElementById('modalWrap').classList.contains('open');
const step=(sel,title,desc,n)=>({sel,title,desc,n});
function currentStep(){
const t=task('training'),a=task('attestation'),m=modal(),r=state.route;
if(r==='roles')return step('.role-card:first-child','Кабинет управляющего','Вся команда, её знания и показатели продаж в одном месте.',1);
if(r==='staff-select')return step('.staff-select-card.handoff-target,.staff-select-card[onclick*="e1"]','Задания уже у официанта','Каждый сотрудник получает собственный план обучения.',5);
if(state.auth==='manager'){
 if(!state.guideSales){return m?step('#modal .closebtn','Коммерческие показатели','Личные продажи и средний чек — критерии эффективности обучения. Закройте отчёт.',1):step('.ra-ops-tile[onclick="raOpsFinance()"]','Контроль продаж','Откройте выручку, план и средний чек: эти показатели помогают оценивать работу команды.',1)}
 if(!t||!a){
  if(r!=='employee-detail')return step('.employee-compact[onclick*="e1"],.employee-compact[data-employee-id="e1"]','Рейтинг знаний','Вместо субъективной оценки — уровень подготовки каждого официанта.',2);
  if(m)return step('#modal [data-dish]','Тест по блюду','Выберите позицию: тест закрепляет состав, описание и рекомендации гостю.',3);
  if(!document.querySelector('[data-demo-block].open'))return step('[data-demo-block] .knowledge-row','Диагностика знаний','Откройте раздел меню, чтобы увидеть его уровень и назначить обучение.',2);
  if(!t)return step('[data-demo-block] .knowledge-actions .ghost','Точечное обучение','Тест выявляет пробелы по конкретному блюду, не изменяя рейтинг.',3);
  return step('[data-demo-block] .knowledge-actions .primary','Аттестация раздела','Итоговая проверка подтверждает знания и формирует рейтинг.',4);
 }
 if(t.status!=='done'||a.status!=='done')return step('.quick-role-waiter','Кабинет официанта','Задания назначены. Посмотрите, как сотрудник учится продавать.',5);
 if(!state.guideManagerCheck){
  if(m)return step('#modal .closebtn','Контроль исполнения','Управляющий видит отметку, сотрудника и время выполнения.',10);
  if(r==='employee-detail')return step('.backline button','Контроль смены','Вернитесь в команду, чтобы проверить выполнение стандартов.',10);
  return step('.ra-ops-tile[onclick="raOpsChecks()"]','Контроль стандартов','Откройте чек-лист: обязательные действия смены видны управляющему.',10);
 }
 if(r!=='employee-detail')return step('.attestation-card .primary,.employee-compact[onclick*="e1"]','Измеримый результат','Результат аттестации уже у управляющего. Откройте карточку.',11);
 return step('.detail-total','Результат','Рейтинг обновлён по аттестации. Динамика среднего чека и выручки оценивается после внедрения.',11);
}
if(state.auth==='staff'){
 if(m&&state.studyAssignmentId)return step('#modal .ra-study-actions .primary','Материал для продаж','Изучите состав, вкусные слова и скрипт. Уместные рекомендации помогают развивать личные продажи.',t?.status==='done'?7:6);
 if(r==='assigned-test')return state.activeQuiz?.feedbackShown?step('.quiz-card .primary','Обратная связь','Тренировка объясняет ошибки, не влияя на рейтинг.',6):step('.quiz-options','Проверка знания блюда','Выберите ответ: состав, вкусные слова или рекомендация гостю.',6);
 if(r==='assigned-test-result')return step('.quiz-result .primary','Результат тренировки','Управляющий получит результат. Рейтинг не изменяется.',6);
 if(r==='assigned-attestation')return state.activeAttestation?.answers?.[state.activeAttestation.index]!==undefined?step('.attestation-next','Подтверждение знаний','Перейдите к следующему вопросу или завершите проверку.',7):step('.quiz-options','Аттестация','Ответьте самостоятельно: результат войдёт в рейтинг.',7);
 if(r==='assigned-attestation-result')return step('.attestation-result .primary','Подтверждённый уровень','Результат сохранён, рейтинг пересчитан. Вернитесь в кабинет.',7);
 if(t?.status!=='done')return step('.assigned-test .ra-assignment-actions .ghost','Изучение блюда','Откройте учебную карточку: знания меню становятся навыками продаж.',6);
 if(a?.status!=='done')return a?.materialReviewed?step('.attestation-card .ra-assignment-actions .primary','Аттестация блока','Материал изучен. Проверьте знания всего раздела.',7):step('.attestation-card .ra-assignment-actions .ghost','Подготовка к аттестации','Изучите все позиции раздела меню.',7);
 if(!state.guideHall){if(m)return step('#modal input[data-shift-id]','Стандарт смены','Отметьте выполнение реальной задачи. Управляющий увидит результат.',8);return step('.ra-ops-tile[onclick="raOpsChecks()"]','Ежедневные стандарты','Откройте чек-лист смены.',8)}
 if(m)return step('#modal .closebtn','Отметка сохранена','Выполнение задачи зафиксировано. Закройте чек-лист.',8);
 return step('.quick-role-manager','Возврат к управляющему','Проверьте результаты обучения и работы сотрудника.',9)
}
return null
}
let target=null,card=null,frame=0,lastKey='',reveal=false;
function clear(){target?.classList.remove('ra-native-target');target=null;card?.remove();card=null}
function finish(){state.compactDemo=false;state.demoHandoff=null;localStorage.setItem('ra-tour:optout','1');save();clear();render()}
function launch(){window.RASalesIntro?.hide();window.restartAcademyTour()}
function place(){
frame=0;document.body.classList.toggle('ra-native-guided',guided());
if(!guided()){clear();const root=document.getElementById('root');if(root&&!document.getElementById('raDemoLaunch')){const b=document.createElement('button');b.id='raDemoLaunch';b.className='primary';b.textContent='Начать демонстрацию';b.onclick=launch;root.prepend(b)}return}
document.getElementById('raDemoLaunch')?.remove();
const s=currentStep();if(!s){clear();return}
const el=[...document.querySelectorAll(s.sel)].find(e=>e.getBoundingClientRect().width>0&&!e.disabled);
if(!el){clear();return}
const key=s.sel+'|'+s.title;
if(target!==el){target?.classList.remove('ra-native-target');target=el;el.classList.add('ra-native-target')}
if(key!==lastKey){lastKey=key;reveal=true}
if(!card){card=document.createElement('aside');card.id='raNativeGuide';document.body.append(card)}
const chapter=s.n<5?'Управляющий':s.n<9?'Официант':'Результат';
if(card.dataset.key!==key){card.dataset.key=key;card.innerHTML='<div class="ra-native-meta"><span>'+chapter+' · '+s.n+' / 11</span><button data-quit>Выйти</button></div><h3>'+s.title+'</h3><p>'+s.desc+'</p>'+(s.n===11&&state.route==='employee-detail'?'<button class="primary" data-finish>Завершить</button>':'');card.querySelector('[data-quit]').onclick=finish;const f=card.querySelector('[data-finish]');if(f)f.onclick=finish}
if(reveal){reveal=false;const r=el.getBoundingClientRect();if(r.top<70||r.bottom>innerHeight-60){if(!state.studyAssignmentId||!modal())el.scrollIntoView({block:'center',behavior:'auto'})}}
const r=el.getBoundingClientRect(),w=card.offsetWidth,h=card.offsetHeight,g=14,vh=innerHeight,vw=innerWidth;
let x,y;if(r.right+w+g<vw){x=r.right+g;y=Math.min(Math.max(12,r.top),vh-h-12)}else if(r.left>w+g){x=r.left-w-g;y=Math.min(Math.max(12,r.top),vh-h-12)}else if(r.bottom+h+g<vh&&r.bottom>0){x=Math.min(Math.max(12,r.left),vw-w-12);y=r.bottom+g}else{x=Math.min(Math.max(12,r.left),vw-w-12);y=Math.max(12,Math.min(vh-h-12,r.top-h-g))}
card.style.left=x+'px';card.style.top=y+'px'
}
function schedule(){if(!frame)frame=requestAnimationFrame(place)}
document.addEventListener('click',e=>{
if(!guided())return;const s=currentStep();if(!s)return;
if(s.n===1&&modal()&&e.target.closest('#modal .closebtn'))state.guideSales=true;
if(s.n===10&&modal()&&e.target.closest('#modal .closebtn'))state.guideManagerCheck=true;
if(s.n===8&&e.target.matches('#modal input[data-shift-id]'))state.guideHall=e.target.checked;
save();setTimeout(schedule,30)
},true);
window.addEventListener('resize',schedule);window.addEventListener('scroll',schedule,true);
const ae=activeEmployees;activeEmployees=function(){return ae().filter(e=>!guided()||e.role!=='Бармен')};
const base=render;render=function(){base();schedule()};
const om=openModal,cm=closeModal;openModal=function(){om.apply(this,arguments);schedule()};closeModal=function(){cm.apply(this,arguments);schedule()};
const reset=window.restartAcademyTour;
window.restartAcademyTour=async function(){state.compactDemo=true;state.compactVersion=5;state.guideSales=false;state.guideHall=false;state.guideManagerCheck=false;lastKey='';await reset();schedule()};
if(state.compactDemo&&state.compactVersion!==5){state.compactDemo=false;save()}
render();
})();