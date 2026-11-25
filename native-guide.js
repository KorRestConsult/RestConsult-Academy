(function(){
const guided=()=>!!state.compactDemo;
const handoffKey='ra-guide-waiter-active';
function rememberHandoff(){try{sessionStorage.setItem(handoffKey,'1')}catch(e){}}
function clearHandoff(){try{sessionStorage.removeItem(handoffKey)}catch(e){}}
function recoverHandoff(){
 if(!['staff-pin','home','learn','assigned-test','assigned-test-result','assigned-attestation','assigned-attestation-result','slow-self-quiz'].includes(state.route)||!(state.auth==='staff'||state.route==='staff-pin'))return;
 try{if(sessionStorage.getItem(handoffKey)==='1'&&!state.guideStaffDone&&!state.compactDemo){state.compactDemo=true;state.compactVersion=9;state.guideManagerDone=true;save()}}catch(e){}
}
const task=k=>state.assignedTests.find(t=>t.employeeId==='e1'&&t.assignmentType===k);
const modal=()=>document.getElementById('modalWrap').classList.contains('open');
const step=(sel,title,desc,n)=>({sel,title,desc,n});
function currentStep(){
 const id=state.currentEmployee||'e1',t=state.assignedTests.find(x=>x.employeeId===id&&x.workflowPreparation&&x.block==='Салаты'),a=state.assignedTests.find(x=>x.employeeId===id&&x.assignmentType==='attestation'&&x.block==='Салаты'),m=modal(),r=state.route;
 if(r==='roles'){
  if(state.guideManagerDone&&!state.guideStaffDone)return step('.role-card:nth-child(2)','Теперь вы — официант','Задание уже сохранено. Войдите в персональный кабинет и увидите работу системы глазами сотрудника.',1);
  return step('.role-card:first-child','Начнём с управляющего','Вы — управляющий ресторана. Посмотрите, как контролировать продажи, знания команды и стандарты смены. Откройте кабинет.',1)
 }
 if(r==='manager-pin')return step('.pin-keypad','Доступ управляющего','Введите демонстрационный PIN: 0000. Управление доступно только после входа.',1);
 if(r==='staff-select')return step('.staff-select-card[onclick*="e1"]','Выберите сотрудника','Личный кабинет хранит задания, знания и рабочий график.',1);
 if(r==='staff-pin')return step('.pin-keypad','Персональный вход','Введите демонстрационный PIN: '+(current().pin||'1111')+'. Официант не видит управление командой.',1);
 if(state.auth==='manager'){
  if(!state.guideSales)return m?step('#modal .closebtn','Коммерческие показатели','От выручки ресторана до личного результата каждого официанта. План, средний чек и продажи помогают выявлять точки роста и оценивать эффект обучения.',2):step('.ra-ops-tile[onclick="raOpsFinance()"]','Управление продажами','Управляющий видит выручку ресторана и личные продажи каждого сотрудника: обучение становится инструментом управления коммерческим результатом.',2);
  if(!state.guideManagerCheck){
   if(m){
    const bar=document.querySelector('#modal [data-shift-role="bar"]');
    if(bar&&!state.guideCheckedBar)return step('#modal [data-shift-role="bar"]','Контроль бара','Управляющий видит выполнение чек-листа каждого подразделения.',3);
    return step('#modal .closebtn','Единый контроль','Готовность подразделений и история выполнения в одном месте. Закройте чек-листы.',3)
   }
   if(r==='employee-detail')return step('.backline button','Команда','Вернитесь к обзору команды.',3);
   return step('.ra-ops-tile[onclick="raOpsChecks()"]','Чек-листы подразделений','Контроль готовности зала и бара: видно, что выполнено, кем и когда.',3)
  }
  if(!t){
   if(r!=='employee-detail')return step('.employee-compact[data-employee-id="e1"]','Рейтинг команды','Общий уровень виден сразу. Откройте сотрудника и найдите раздел, требующий обучения.',4);
   if(!document.querySelector('[data-demo-salads].open'))return step('[data-demo-salads] .knowledge-row','Диагностика знаний','Откройте раздел «Салаты». Управляющий видит знания по каждому разделу.',5);
   return step('[data-demo-salads] [data-assign-group]','Назначение теста','Назначьте обучение всему разделу. Официант получит новое задание.',6)
  }
  if(state.assignedTests.some(x=>x.requestStatus==='requested'))return step('[data-request-assign]','Запрос на аттестацию','Официант изучил весь раздел и подтвердил готовность. Назначьте итоговую проверку.',6);
  if(state.assignedTests.some(x=>x.assignmentType==='attestation'&&x.status==='submitted'))return m?step('[data-review-accept]','Подтверждение','Оцените практические навыки и подтвердите аттестацию. Только после этого меняется рейтинг.',6):step('[data-review-open]','Результат получен','Управляющий принимает или отклоняет результат.',6);
  return step('#roleBtn','Сценарий управляющего завершён','Вы назначили обучение. Вернитесь к выбору роли: теперь вы — официант. Задание останется в его кабинете.',6)
 }
 if(state.auth==='staff'){
  if(r==='slow-self-quiz'&&window.raAssignedStudyResume?.()){const q=state.slowSelfQuiz;return step('.quiz-shell',q?.itemId?'Тест по блюду':'Тест по разделу','После проверки вернитесь к списку назначенных блюд. Самостоятельная тренировка не заменяет назначенный тест.',3)}
  if(r==='learn'&&state.studyAssignmentId&&!m)return step('.ra-assigned-menu','Выберите блюдо для изучения','Откройте любую позицию. Изучите её и вернитесь к списку. Для закрепления знаний можно пройти тест по блюду. Когда все позиции изучены, доступен тест по разделу.',3);
  if(m&&state.studyAssignmentId)return step('#modal .ra-study-actions .primary','Обучение продажам','Фото, цена, выход, состав, вкусные слова и скрипт. Изучайте меню так, чтобы уверенно рекомендовать гостю.',3);
  if(r==='assigned-test')return state.activeQuiz?.feedbackShown?step('.quiz-card .primary','Разбор ответа','Система объясняет ответ. Учебный тест не меняет рейтинг.',3):step('.quiz-options','Проверка знаний','Ответьте на вопрос по изученному материалу.',3);
  if(r==='assigned-test-result')return step('.quiz-result .primary','Результат тренировки',t?.score===100?'Результат виден управляющему. Теперь можно отправить запрос на аттестацию.':'Результат виден управляющему. Для запроса аттестации нужно 100%. Вернитесь в кабинет и продолжите знакомство с системой.',3);
  if(r==='assigned-attestation')return state.activeAttestation?.answers?.[state.activeAttestation.index]!==undefined?step('.attestation-next','Аттестация','Продолжите итоговую проверку.',3):step('.quiz-options','Аттестация','Ответьте без подсказок. Рейтинг изменится после подтверждения управляющим.',3);
  if(r==='assigned-attestation-result')return step('.attestation-result .primary','Результат отправлен','Управляющий увидит результат. Ваш рейтинг пока не изменился.',3);
  if(!state.guideRatingSeen)return step('.scorebox','Мой рейтинг','У каждого сотрудника своя история аттестаций. Тренировки помогают подготовиться, но официальный рейтинг меняется только после подтверждения управляющим.',2);
  if(a&&['new','opened'].includes(a.status))return step('.attestation-card .ra-assignment-actions .primary','Назначена аттестация','Пройдите проверку уже изученного раздела.',3);
  if(t&&!state.guideTrainingAttempt&&t.status!=='done')return t.materialReviewed?step('[data-prep-quiz],.assigned-test .ra-assignment-actions .primary','Тест по салатам','Материал изучен. Пройдите тренировочную проверку.',3):step('.assigned-test .ra-assignment-actions .ghost','Новое задание','Это то самое задание, которое вы только что назначили управляющим. Оно уже в кабинете официанта. Откройте раздел «Салаты».',3);
  if(!state.guideAssignmentPreview&&t?.score===100&&!t.requestStatus&&document.querySelector('[data-prep-request]'))return step('[data-prep-request]','Готов к аттестации','Вы сдали тренировочный тест на 100%. Нажмите кнопку готовности: управляющий получит запрос и назначит итоговую аттестацию. До подтверждения рейтинг не меняется.',4);
  if(r==='slow-self-quiz'){
    const q=state.slowSelfQuiz;
    if(q&&q.index<q.questions.length)return q.answered?step('.quiz-card .primary','Разбор ответа','После каждого ответа видны объяснения. Можно повторить тест сколько угодно раз.',4):step('.quiz-options','Самостоятельная проверка',q.itemId?'Вопросы только по выбранному блюду.':'Вопросы охватывают все блюда раздела.',4);
    if(q?.itemId)return step('[data-self-block]','От блюда к разделу','Уверены в знаниях? Проверьте весь раздел, не открывая каждую карточку.',4);
    if(document.querySelector('[data-self-request]'))return step('[data-self-request]','Готов к аттестации','Тренировка на 100% позволяет заявить о готовности управляющему.',4);
    return step('[data-self-return]','Результат раздела','Вернитесь в базу знаний. При необходимости повторите проверку.',4);
   }
  if(!state.guideSelfSeen){
   if(r==='learn'&&state.learnArea==='kitchen'){
    if(m)return step('#modal .ra-study-actions .primary','Вся информация о блюде','Изучите фото, описание, выход, цену, состав, вкусные слова и рекомендации. Затем проверьте именно это блюдо.',4);
    return step('#menuBlock .menu-card','База знаний заведения','Выберите любое блюдо самостоятельно. Назначение от управляющего для этого не требуется.',4)
   }
   if(r==='learn')return step('.head button[onclick="go(\'home\')"]','Личный кабинет','Вернитесь к базе знаний кухни.',4);
   return step('.area-card[onclick*="kitchen"]','Свободное обучение','Точно так же официант может учиться без задания управляющего. Посмотрите базу кухни — повторять тест не нужно.',4)
  }
  if(!state.guideBarSeen){
   if(r==='learn'&&state.learnArea==='bar'){
    if(m)return step('#modal .closebtn','Меню бара','Официант изучает напитки, состав и рекомендации. Закройте карточку.',4);
    return step('#menuBlock .menu-card','Самостоятельное обучение','Откройте напиток. Любую позицию можно изучать самостоятельно.',4)
   }
   if(r==='learn')return step('.head button[onclick="go(\'home\')"]','Меню','Вернитесь в личный кабинет.',4);
   return step('.area-card[onclick*="bar"]','Кухня и бар','Тот же принцип действует и для бара. Посмотрите, как организована база напитков.',4)
  }
  if(r==='learn')return step('.head button[onclick="go(\'home\')"]','Личный кабинет','Вернитесь в кабинет и посмотрите другие инструменты сотрудника.',4);
  if(!state.guideMini)return m?step('[data-training-read]','Подготовка к тренингу','Короткая подготовка перед сменой закрепляет единый стандарт общения с гостями. Отметьте ознакомление с материалом.',5):step('[data-mini-training]','Мини-тренинги','Обучение продолжается каждый день: сотрудник заранее знакомится с темой короткого тренинга перед сменой.',5);
  if(!state.guideHall)return m?step('#modal input[data-shift-id]','Интерактивный чек-лист','Отметьте выполненную задачу. Управляющий сразу увидит сотрудника и время.',6):step('.ra-ops-tile[onclick="raOpsChecks()"]','Рабочая смена','Вместо устных напоминаний — персональный список задач смены. Откройте чек-лист и отметьте одну выполненную задачу.',6);
  if(m&&!state.guideHallClosed)return step('#modal .closebtn','Задача выполнена','Отметка сохранена и видна управляющему.',6);
  if(!state.guideSchedule)return m?step('#modal .closebtn','График','Демо расписания. При интеграции данные поступают из системы учёта.',7):step('.ra-ops-tile[onclick="raOpsSchedule()"]','Мой график','Сотрудник видит расписание смен в одном кабинете. Посмотрите график, затем завершите демонстрацию.',7);
  return step('.scorebox','Демонстрация завершена','Управляющий назначает обучение и видит результат. Официант развивает знания, готовится к аттестации и соблюдает стандарты смены. Все инструменты доступны в свободном режиме.',7)
 }
 return null
}
let target=null,card=null,spot=null,frame=0,lastKey='',reveal=false;
let views=[],restoring=false;
const view=()=>({route:state.route,auth:state.auth,role:state.role,currentEmployee:state.currentEmployee,learnArea:state.learnArea,expandedKnowledgeKey:state.expandedKnowledgeKey});
const viewKey=v=>[v.route,v.auth,v.role,v.currentEmployee].join('|');
function remember(){const v=view();if(!restoring&&viewKey(v)!==viewKey(views.at(-1)||{}))views.push(v)}
function goBack(){
 if(modal()&&state.studyAssignmentId&&document.querySelector('#modal .ra-study-facts')){closeModal();schedule();return}
 if(modal()&&learningSurface()){document.querySelector('#modal .closebtn')?.click();return}
 if(modal()){const t=state.assignedTests.find(x=>x.id===state.studyAssignmentId);if(t){const img=document.querySelector('#modal .ra-study-actions button');const match=img?.getAttribute('onclick')?.match(/markStudyItemAndNext\('([^']+)'\)/);const items=STOCK[t.area].filter(x=>x.block===t.block&&(!t.itemId||x.id===t.itemId));const i=items.findIndex(x=>x.id===match?.[1]);if(i>0){openMenu(items[i-1].id);return}state.studyAssignmentId=null;closeModal();state.route='home';save();render();return}closeModal();return}
 if(state.route==='slow-self-quiz'){raSelfReturn();return}
 if(state.route==='learn'&&state.studyAssignmentId){raStudyListBack();return}
 if(state.route==='assigned-test'&&state.activeQuiz?.index>0){state.activeQuiz.index--;state.activeQuiz.feedbackShown=state.activeQuiz.answers[state.activeQuiz.index]!==undefined;save();render();return}
 if(state.route==='assigned-attestation'&&state.activeAttestation?.index>0){state.activeAttestation.index--;save();render();return}
 if(state.route==='roles'){window.RASalesIntro?.show();return}
 if(['assigned-test','assigned-test-result','assigned-attestation','assigned-attestation-result','learn'].includes(state.route)){state.route='home';state.studyAssignmentId=null;save();render();return}
 views.pop();let prev=views.pop();while(prev&&/quiz|assigned-|learn/.test(prev.route))prev=views.pop();
 if(!prev){prev={route:'roles',auth:null,role:null,currentEmployee:state.currentEmployee}}
 restoring=true;Object.assign(state,prev);state.studyAssignmentId=null;save();render();restoring=false;views.push(view());lastKey='';schedule()
}
function clear(keepArrow=false){if(!keepArrow)window.RAPencil?.hide();target?.classList.remove('ra-native-target');target=null;card?.remove();card=null;spot?.remove();spot=null}
function finish(){clearHandoff();if(state.slowSelfQuiz?.guidedDishPreview){state.slowSelfQuiz=null;state.studyAssignmentId=state.resumeStudyAssignmentId||null;state.resumeStudyAssignmentId=null;state.route=state.studyAssignmentId?'learn':'home'}document.querySelectorAll('.ra-learning-note,.ra-reading-footer').forEach(n=>n.remove());document.body.classList.remove('ra-guide-reading');state.compactDemo=false;state.demoHandoff=null;localStorage.setItem('ra-tour:optout','1');save();clear();render()}
function launch(){window.RASalesIntro?.show();schedule()}
// Scroll the actual scrolling container and cancel competing smooth navigation.
const priorScroll=window.raScrollPage;
window.raScrollPage=function(opts){return priorScroll?priorScroll(guided()?{...opts,behavior:'auto'}:opts):window.scrollTo(guided()?{...opts,behavior:'auto'}:opts)};
function moveIntoSafeArea(el,top,bottom){
 const r=el.getBoundingClientRect();
 if(r.top>=top&&r.bottom<=bottom)return false;
 const desired=top+Math.max(0,(bottom-top-r.height)/2);
 let delta=r.top-desired;
 for(let p=el.parentElement;p&&p!==document.body;p=p.parentElement){
  if(!/auto|scroll/.test(getComputedStyle(p).overflowY)||p.scrollHeight<=p.clientHeight+1)continue;
  const old=p.scrollTop;p.scrollTop=old+delta;delta-=p.scrollTop-old;
  if(Math.abs(delta)<1)return true;
 }
 const root=document.scrollingElement;
 if(root&&Math.abs(delta)>1)root.scrollTop+=delta;
 return true
}
// Reading and answering are real work, not navigation targets.
function learningSurface(){
 if(modal()){const p=document.getElementById('modal');if(p.querySelector('.ra-ops-row,.ra-check-phase,.ra-study-facts,[data-training-read]'))return p}
 if(state.auth!=='staff')return null;
 if(!modal()&&state.route==='learn'&&state.studyAssignmentId)return document.querySelector('.ra-assigned-menu');
 if(!modal()&&state.route==='learn')return document.getElementById('menuBlock');
 if(['assigned-test','assigned-test-result','assigned-attestation','assigned-attestation-result','slow-self-quiz'].includes(state.route))return document.querySelector('.quiz-shell')||document.querySelector('.official-attestation');
 return null
}
// Staff uses the same green/gold language as the manager, but an in-flow guide
// never obscures training materials. One local arrow per actionable screen.
function staffLearningNote(surface,s){
 clear();
 document.body.classList.add('ra-guide-reading','ra-staff-reading');
 const list=surface.matches('.ra-assigned-menu,#menuBlock'),isModal=surface.id==='modal',studying=!!surface.querySelector('.ra-study-facts'),checks=!!surface.querySelector('.ra-check-phase'),report=!!surface.querySelector('.ra-ops-row'),mini=!!surface.querySelector('[data-training-read]'),result=!!surface.querySelector('.quiz-result,.attestation-result');
 const assigned=!!state.studyAssignmentId,returnAssignment=!!window.raAssignedStudyResume?.(),blockReady=surface.querySelector('[data-study-block-test]:not(:disabled)');
 const nextDish=surface.querySelector('.ra-dish-row[data-unread="1"] .ra-dish-open');
 const nextQuestion=[...surface.querySelectorAll('.quiz-card .primary:not(:disabled),.attestation-next:not(:disabled)')].find(e=>e.getClientRects().length);
 const area=state.learnArea==='bar'?'напиток':'блюдо';
 const guidedDish=state.route==='slow-self-quiz'&&state.slowSelfQuiz?.guidedDishPreview;
 const singleDish=assigned&&!!window.raGuideDishPreview?.(state.assignedTests.find(t=>t.id===state.studyAssignmentId));
 let title=s.title,desc=s.desc,action=null,group=null;
 if(list){
  if(singleDish){title='Выберите один салат';desc='Вы видите весь раздел, назначенный управляющим. Для знакомства с системой изучите только одно блюдо. Откройте любой салат.';action=surface.querySelector('.ra-dish-open')}
  else if(assigned&&blockReady){title='Материал изучен';desc='Все позиции изучены. Теперь пройдите назначенный тест по разделу. Отдельные тренировки можно повторять.';action=blockReady}
  else{title=assigned?'Изучите назначенный раздел':'Самостоятельное обучение';desc=assigned?'Управляющий назначил весь раздел. Откройте любое блюдо: здесь есть всё для уверенной рекомендации гостю. Затем отметьте изучение или проверьте себя.':'Вся база меню доступна без назначения. Здесь можно открыть любое '+area+' или проверить знания раздела. Мы уже показали механизм теста — продолжите демонстрацию.';action=nextDish||surface.querySelector('.ra-dish-open')}
 }else if(studying&&singleDish){title='Подготовьтесь к тесту';desc='Внимательно изучите состав блюда, потому что впереди тест. Изучите скрипт продажи, цену, выход и вкусные слова. Затем ответьте на пять вопросов.';action=surface.querySelector('.ra-study-actions .primary')}
 else if(studying){title='Изучите в своём темпе';desc='Здесь не просто состав: официант учится объяснять вкус и уверенно рекомендовать блюдо гостю. Прочитайте карточку, затем вернитесь к списку или проверьте себя.';action=surface.querySelector('.ra-study-actions .primary')}
 else if(checks){title='Контроль стандартов';desc=state.guideHall?'Задача отмечена. Управляющий видит факт выполнения. Продолжите демонстрацию.':'Отметьте выполненную задачу. Управляющий увидит сотрудника и время. Можно раскрыть любой раздел чек-листа.'}
 else if(mini){title='Подготовка к тренингу';action=surface.querySelector('[data-training-read]')}
 else if(result){title='Результат обучения';
  if(guidedDish){title='Отличный результат';desc='Вы увидели, как работает обучение на одном блюде. В настоящем тесте подсказок нет. Продолжим знакомство с кабинетом.';action=surface.querySelector('[data-demo-dish-next]')}
  else if(returnAssignment){desc='Результат личной тренировки сохранён. Вернитесь к списку назначенных блюд, чтобы завершить задание.';action=surface.querySelector('[data-self-return]')}
  else if(state.route==='slow-self-quiz'){desc=state.slowSelfQuiz?.itemId?'Можно повторить тест, проверить весь раздел или вернуться к меню. Когда будете готовы, продолжите демонстрацию.':s.desc;action=surface.querySelector('[data-self-request]')||surface.querySelector('[data-self-return]')}
  else action=surface.querySelector('.quiz-result .primary,.attestation-result .primary');
 }else if(!report){
  if(nextQuestion){title=guidedDish?'Верно!':'Разбор ответа';desc='Прочитайте объяснение и перейдите к следующему вопросу.';action=nextQuestion}
  else if(guidedDish){title='Вопрос '+(state.slowSelfQuiz.index+1)+' из 5';desc='В демонстрации мы подсказываем правильный ответ. Нажмите выделенный вариант.';action=surface.querySelector('[data-demo-correct]')}
  else{title='Проверка знаний';desc=state.route==='assigned-attestation'?'Выберите ответ самостоятельно. Рейтинг изменится после подтверждения управляющим.':'Прочитайте вопрос и выберите один ответ. Тренировка не меняет официальный рейтинг.';group=surface.querySelector('.quiz-options')}
 }
 let note=surface.querySelector(':scope > .ra-learning-note');
 if(!note){
  note=document.createElement('aside');note.className='ra-learning-note ra-staff-note';
  note.innerHTML='<div class="ra-staff-meta"><span></span><button type="button" data-learning-back>Назад</button><button type="button" data-learning-quit>Выйти</button></div><h3></h3><p></p><div class="ra-staff-actions"></div>';
  const anchor=isModal?surface.querySelector('.modal-head'):surface.querySelector('.quiz-top');
  if(anchor&&anchor.parentElement===surface)anchor.after(note);else if(list&&assigned&&surface.querySelector('.ra-study-progress'))surface.querySelector('.ra-study-progress').after(note);else surface.prepend(note);
  note.querySelector('[data-learning-back]').onclick=goBack;note.querySelector('[data-learning-quit]').onclick=finish;
 }
 note.querySelector('.ra-staff-meta span').textContent='Официант · '+s.n+' / 7';
 note.querySelector('h3').textContent=title;note.querySelector('p').textContent=desc;
 const actions=note.querySelector('.ra-staff-actions');
 const previewReady=returnAssignment&&state.route==='slow-self-quiz'&&(state.slowSelfQuiz?.answered||state.slowSelfQuiz?.index>0);
 const optionalNext=(list&&!assigned)||(result&&state.route==='slow-self-quiz'&&!returnAssignment);
 const shortPreview=previewReady&&!result&&!guidedDish;
 const completedExample=returnAssignment&&result&&!guidedDish;
 const canSkipAssignment=list&&assigned&&!singleDish&&!blockReady&&(state.assignmentStudyProgress?.[state.studyAssignmentId]?.reviewedIds||[]).length>0;
 if(shortPreview||completedExample||canSkipAssignment){
  desc+=(shortPreview||completedExample?' Для запроса на аттестацию нужно изучить весь раздел и сдать назначенный тест на 100%.':' Для запроса аттестации необходимо изучить все позиции и пройти тест раздела на 100%.');
  note.querySelector('p').textContent=desc+' Если продолжите сейчас, задание останется незавершённым.';
 }

 if(optionalNext){
  let next=actions.querySelector('button');
  if(!next){next=document.createElement('button');next.className='primary';actions.append(next)}
  if(list){next.dataset.guideMenuNext='1';delete next.dataset.guideQuizNext}else{next.dataset.guideQuizNext='1';delete next.dataset.guideMenuNext}next.textContent='Продолжить демонстрацию';
  next.onclick=()=>{if(state.learnArea==='bar')state.guideBarSeen=true;else state.guideSelfSeen=true;state.slowSelfQuiz=null;state.studyAssignmentId=null;state.route='home';save();render();(window.raScrollPage||window.scrollTo.bind(window))({top:0,behavior:'auto'})};
  if(list&&!assigned&&state.guideAssignmentPreview)action=next;
 }else if(shortPreview||completedExample||canSkipAssignment){
  let next=actions.querySelector('[data-guide-preview-next]');
  if(!next){actions.replaceChildren();next=document.createElement('button');next.className='primary';next.dataset.guidePreviewNext='1';actions.append(next)}
  next.textContent='Далее по демонстрации';
  next.onclick=()=>{
   state.guideAssignmentPreview=true;state.guideTrainingAttempt=true;state.resumeStudyAssignmentId=null;state.slowSelfQuiz=null;state.studyAssignmentId=null;state.route='home';save();render();(window.raScrollPage||window.scrollTo.bind(window))({top:0,behavior:'auto'})
  };
 }else if(actions.childElementCount)actions.replaceChildren();
 if(report||checks){
  let footer=surface.querySelector('.ra-reading-footer');
  if(!footer){footer=document.createElement('div');footer.className='ra-reading-footer';footer.innerHTML='<button type="button" class="primary" data-report-continue>Продолжить</button>';surface.append(footer);footer.querySelector('button').onclick=()=>surface.querySelector('.closebtn')?.click()}
  const b=footer.querySelector('button');b.disabled=checks&&!state.guideHall;
  action=checks&&!state.guideHall?surface.querySelector('input[data-shift-id]:not(:checked):not(:disabled)')?.closest('label'):b;
 }
 // All earlier markers are cleared, including those in closed modals.
 if(list&&assigned&&blockReady){
  const footer=blockReady.closest('.ra-assignment-footer');
  if(footer&&note.nextElementSibling!==footer){note.after(footer);requestAnimationFrame(()=>{if(footer.isConnected)footer.scrollIntoView({block:'nearest',behavior:'auto'})})}
 }
 const focus=action||group;
 document.querySelectorAll('.ra-staff-focus').forEach(e=>{if(e!==focus)e.classList.remove('ra-staff-focus')});
 document.querySelectorAll('.ra-local-cue,.ra-staff-pointer').forEach(e=>{if(e.parentElement!==focus)e.remove()});
 if(focus){
  const newlyFocused=!focus.classList.contains('ra-staff-focus');
  focus.classList.add('ra-staff-focus');
  // The whole answer group is framed, never a specific option.
  if(action&&!focus.matches('input,select,textarea')&&!focus.querySelector(':scope > .ra-staff-pointer')){
   const pointer=document.createElement('span');pointer.className='ra-staff-pointer';pointer.setAttribute('aria-hidden','true');
   pointer.innerHTML='<svg viewBox="0 0 44 35"><path pathLength="1" d="M 3 3 C 24 3 31 12 34 29 M 24 21 L 34 29 L 41 18"/></svg>';
   focus.append(pointer)
  }
  if(guidedDish&&!result&&newlyFocused)requestAnimationFrame(()=>{if(focus.isConnected){const r=focus.getBoundingClientRect(),vv=window.visualViewport;if(r.bottom>(vv?.height||innerHeight)-16)focus.scrollIntoView({block:'nearest',behavior:'auto'})}});
 }
}
function learningNote(surface,s){
 if(state.auth==='staff')return staffLearningNote(surface,s);
 clear();
 document.body.classList.add('ra-guide-reading');
 const list=surface.matches('.ra-assigned-menu,#menuBlock'),isModal=surface.id==='modal',studying=!!surface.querySelector('.ra-study-facts'),checks=!!surface.querySelector('.ra-check-phase'),report=!!surface.querySelector('.ra-ops-row'),mini=!!surface.querySelector('[data-training-read]'),result=!!surface.querySelector('.quiz-result,.attestation-result');
 const title=list?'Выберите блюдо для изучения':report?s.title:checks?'Контроль стандартов':mini?'Подготовка к тренингу':studying?'Изучите в своём темпе':result?'Результат обучения':'Проверка знаний';
 const text=list?(state.studyAssignmentId?'Откройте любое блюдо, прочитайте карточку и отметьте его изученным. Для закрепления знаний нажмите «Тест по блюду». После изучения всех позиций откроется назначенный тест по разделу.':'Откройте любое блюдо и прочитайте карточку. Вернитесь к списку или нажмите «Тест по блюду». Уверены в знаниях? Пройдите тест по всему разделу. Когда закончите знакомство с меню, нажмите «Продолжить демонстрацию».'):report?s.desc:checks?(state.auth==='manager'?'Откройте зал или бар, раскройте нужный раздел. После просмотра продолжите демонстрацию.':'Отметьте выполненную задачу. Можно раскрыть любой раздел чек-листа.'):mini?s.desc:studying?'Изучите состав, вкусные слова и рекомендации. Внизу карточки вернитесь к списку или пройдите тест по этому блюду.':result?s.desc:state.route==='assigned-attestation'?'Ответьте самостоятельно. Рейтинг изменится после принятия результата управляющим.':'Прочитайте вопрос, выберите ответ и изучите объяснение. Тренировка не меняет официальный рейтинг.';
 let note=surface.querySelector(':scope > .ra-learning-note');
 if(!note){
  note=document.createElement('aside');note.className='ra-learning-note';
  note.innerHTML='<div><b></b><p></p></div><div class="ra-learning-controls"><button type="button" data-learning-back>Назад</button><button type="button" data-learning-quit>Выйти</button></div>';
  const anchor=isModal?surface.querySelector('.modal-head'):surface.querySelector('.quiz-top');
  if(anchor&&anchor.parentElement===surface)anchor.after(note);else surface.prepend(note);
  note.querySelector('[data-learning-back]').onclick=goBack;
  note.querySelector('[data-learning-quit]').onclick=finish;
 }
 note.querySelector('b').textContent=title;note.querySelector('p').textContent=text;
 if(state.auth==='staff'){
  note.classList.add('ra-staff-note');
  note.querySelector('b').textContent='Официант · '+s.n+' / 8 · '+title;
 }
 if(list&&!state.studyAssignmentId){
  let next=note.querySelector('[data-guide-menu-next]');
  if(!next){next=document.createElement('button');next.className='primary';next.dataset.guideMenuNext='1';next.textContent='Продолжить демонстрацию →';note.firstElementChild.append(next)}
  next.onclick=()=>{if(state.learnArea==='bar')state.guideBarSeen=true;else state.guideSelfSeen=true;state.route='home';state.studyAssignmentId=null;save();render();(window.raScrollPage||window.scrollTo.bind(window))({top:0,behavior:'auto'})};
 }
 if(result&&state.route==='slow-self-quiz'&&!window.raAssignedStudyResume?.()){
  let next=note.querySelector('[data-guide-quiz-next]');
  if(!next){next=document.createElement('button');next.className='primary';next.dataset.guideQuizNext='1';next.textContent='Продолжить демонстрацию →';note.firstElementChild.append(next)}
  next.onclick=()=>{if(state.learnArea==='bar')state.guideBarSeen=true;else state.guideSelfSeen=true;state.slowSelfQuiz=null;state.route='home';save();render()};
 }

 if(report||checks){
  let footer=surface.querySelector('.ra-reading-footer');
  if(!footer){footer=document.createElement('div');footer.className='ra-reading-footer';footer.innerHTML='<button type="button" class="primary" data-report-continue>Продолжить →</button>';surface.append(footer);footer.querySelector('button').onclick=()=>surface.querySelector('.closebtn')?.click()}
  const b=footer.querySelector('button');b.disabled=checks&&state.auth==='staff'&&!state.guideHall;
 }

}
function place(){
frame=0;recoverHandoff();document.body.classList.toggle('ra-native-guided',guided());
const readingSurface=guided()?learningSurface():null;document.body.classList.toggle('ra-guide-reading',!!readingSurface);document.body.classList.toggle('ra-staff-reading',!!readingSurface&&state.auth==='staff');
if(!readingSurface){document.querySelectorAll('.ra-learning-note,.ra-reading-footer,.ra-local-cue,.ra-staff-pointer').forEach(n=>n.remove());document.querySelectorAll('.ra-staff-focus').forEach(n=>n.classList.remove('ra-staff-focus'))}
const pinMode=['manager-pin','staff-pin'].includes(state.route);document.body.classList.toggle('ra-guide-pin',guided()&&pinMode);document.documentElement.style.setProperty('--ra-visible-height',(window.visualViewport?.height||innerHeight)+'px');
if(document.getElementById('raProductIntro')?.classList.contains('show')){clear(true);const intro=document.getElementById('raProductIntro');window.RAPencil?.point(intro.querySelector('.ra-intro-categories'),intro.querySelector('[data-start]'),'intro');return}
if(!guided()){clear();document.querySelectorAll('.role-card').forEach(b=>{b.disabled=false;b.removeAttribute('aria-disabled')});const root=document.getElementById('root');if(root&&!document.getElementById('raDemoLaunch')){const b=document.createElement('button');b.id='raDemoLaunch';b.className='primary';b.textContent='Начать демонстрацию';b.onclick=launch;root.prepend(b)}return}
document.getElementById('raDemoLaunch')?.remove();
let s=currentStep();if(!s){clear();return}
if(readingSurface){document.querySelectorAll('.ra-learning-note').forEach(n=>{if(!readingSurface.contains(n))n.remove()});learningNote(readingSurface,s);return}
if(modal()&&!s.sel.startsWith('#modal')&&!s.sel.startsWith('[data-review-accept]')&&!s.sel.startsWith('[data-training-read]'))s=step('#modal .closebtn','Вернуться к демонстрации','Закройте это окно и продолжите по выделенной кнопке.',s.n);
if(state.route==='roles'){document.querySelectorAll('.role-card').forEach((b,i)=>{const enabled=i===(state.guideManagerDone?1:0);b.disabled=!enabled;b.setAttribute('aria-disabled',String(!enabled))})}
let el=[...document.querySelectorAll(s.sel)].find(e=>e.getBoundingClientRect().width>0&&!e.disabled);
if(!el&&state.auth==='staff'&&state.route==='home'&&!state.guideTrainingAttempt&&s.n===3){state.guideTrainingAttempt=true;save();s=currentStep();el=[...document.querySelectorAll(s.sel)].find(e=>e.getBoundingClientRect().width>0&&!e.disabled)}
if(!el){clear();if(!card){card=document.createElement('aside');card.id='raNativeGuide';document.body.append(card);card.style.left='16px';card.style.top='90px';card.innerHTML='<div class="ra-native-meta"><span>Демонстрация</span><button data-back>Назад</button><button data-quit>Выйти</button></div><h3>Продолжить</h3><p>Вернитесь к предыдущему экрану, чтобы продолжить обучение.</p>';card.querySelector('[data-back]').onclick=goBack;card.querySelector('[data-quit]').onclick=finish}return}
const key=s.sel+'|'+s.title;
if(target!==el){target?.classList.remove('ra-native-target');target=el;el.classList.add('ra-native-target');reveal=true}
if(key!==lastKey){lastKey=key;reveal=true}
if(!card){card=document.createElement('aside');card.id='raNativeGuide';document.body.append(card)}
const chapter=state.auth==='manager'||state.route==='manager-pin'||(state.route==='roles'&&!state.guideManagerDone)?'Управляющий':'Официант';const max=chapter==='Управляющий'?6:7;
if(card.dataset.key!==key){card.dataset.key=key;card.innerHTML='<div class="ra-native-meta"><span>'+chapter+' · '+s.n+' / '+max+'</span><button data-back>Назад</button><button data-quit>Выйти</button></div><h3>'+s.title+'</h3><p>'+s.desc+'</p>'+(state.auth==='staff'&&s.n===7&&state.guideSchedule?'<button class="primary" data-finish>Завершить</button>':state.auth==='staff'&&s.n===2&&!state.guideRatingSeen?'<button class="primary" data-rating-next>Продолжить</button>':'');card.querySelector('[data-quit]').onclick=finish;card.querySelector('[data-back]').onclick=goBack;const f=card.querySelector('[data-finish]');if(f)f.onclick=()=>{state.guideStaffDone=true;finish()};const rn=card.querySelector('[data-rating-next]');if(rn)rn.onclick=()=>{state.guideRatingSeen=true;save();schedule()}}
// Keep the highlighted control inside the actual usable viewport, above the fixed navigation.
const vv=window.visualViewport;
const viewportTop=vv?.offsetTop||0;
const viewportBottom=viewportTop+(vv?.height||innerHeight);
const nav=document.getElementById('nav'),topbar=document.querySelector('.top');
const nr=nav?.getBoundingClientRect(),tr=topbar?.getBoundingClientRect();
const bottomNav=!modal()&&nr&&nr.height>0&&nr.width>nr.height*1.5&&nr.top>viewportTop+(viewportBottom-viewportTop)*.5;
const safeTop=modal()?viewportTop+14:Math.max(viewportTop+14,(tr?.bottom||0)+12);
const safeBottom=bottomNav?Math.min(viewportBottom-16,nr.top-16):viewportBottom-16;
if(reveal){
 reveal=false;
 const reading=modal()&&el.closest('.ra-study-actions');
 if(!reading){
  const scrollTarget=pinMode?document.getElementById('pinPanel')||el:el;
  if(moveIntoSafeArea(scrollTarget,safeTop,safeBottom)){
   requestAnimationFrame(schedule);
  }
 }
}
const report=modal()&&el.matches('#modal .closebtn'),panel=report?document.getElementById('modal'):pinMode?document.getElementById('pinPanel'):null;
const g=innerWidth>=768?120:82,vh=modal()?viewportBottom:Math.min(viewportBottom,safeBottom),vw=innerWidth;
let panelRect=panel?.getBoundingClientRect();
const side=panelRect?Math.max(panelRect.left-g-16,vw-panelRect.right-g-16):0;
const inline=!!panel&&side<235;
card.classList.toggle('ra-guide-inline',inline);
if(inline){if(card.parentElement!==panel)panel.prepend(card);card.style.width='';card.style.left='';card.style.top=''}
else{if(card.parentElement!==document.body)document.body.append(card);card.style.width=panelRect?Math.min(330,side)+'px':''}
const r=el.getBoundingClientRect(),w=card.offsetWidth,h=card.offsetHeight;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const roles=state.route==='roles',choice=roles?document.querySelector('.role-grid')?.getBoundingClientRect():null;
const bounds=panel?.getBoundingClientRect()||choice||r;
const cx=clamp(r.left+(r.width-w)/2,12,vw-w-12),cy=clamp(r.top+(r.height-h)/2,safeTop,Math.max(safeTop,vh-h-12));
const candidates=[{x:cx,y:bounds.bottom+g},{x:cx,y:bounds.top-h-g},{x:bounds.right+g,y:cy},{x:bounds.left-w-g,y:cy}];
const fits=c=>c.x>=12&&c.y>=safeTop&&c.x+w<=vw-12&&c.y+h<=vh-12;
let pos=candidates.find(fits);
if(!pos){const compact=[{x:cx,y:bounds.bottom+36},{x:cx,y:bounds.top-h-36},{x:bounds.right+36,y:cy},{x:bounds.left-w-36,y:cy}];pos=compact.find(fits)}
if(!pos){
 const overlap=c=>Math.max(0,Math.min(c.x+w,bounds.right)-Math.max(c.x,bounds.left))*Math.max(0,Math.min(c.y+h,bounds.bottom)-Math.max(c.y,bounds.top));
 pos=candidates.map(c=>({x:clamp(c.x,12,vw-w-12),y:clamp(c.y,safeTop,Math.max(safeTop,vh-h-12))})).sort((a,b)=>overlap(a)-overlap(b))[0]
}
if(!inline){card.style.left=pos.x+'px';card.style.top=pos.y+'px'}
if(!spot){spot=document.createElement('div');spot.id='raNativeSpot';spot.setAttribute('aria-hidden','true');document.body.append(spot)}
const focus=pinMode?document.getElementById('pinPanel').getBoundingClientRect():panel?.getBoundingClientRect()||r;
let l=Math.max(4,focus.left-6),t=Math.max(modal()?4:safeTop,focus.top-6),right=Math.min(vw-4,focus.right+6),bottom=Math.min(vh-4,focus.bottom+6);
for(let p=panel?panel.parentElement:el.parentElement;p&&p!==document.body;p=p.parentElement){
 const c=getComputedStyle(p),v=p.getBoundingClientRect();
 if(/auto|scroll|hidden|clip/.test(c.overflowY)){t=Math.max(t,v.top);bottom=Math.min(bottom,v.bottom)}
 if(/auto|scroll|hidden|clip/.test(c.overflowX)){l=Math.max(l,v.left);right=Math.min(right,v.right)}
}
spot.style.display=right>l&&bottom>t?'block':'none';
Object.assign(spot.style,{left:l+'px',top:t+'px',width:Math.max(0,right-l)+'px',height:Math.max(0,bottom-t)+'px'});
spot.style.borderRadius=Math.min(18,Math.max(7,r.height/4))+'px';
let arrowTarget=card.querySelector('[data-finish],[data-rating-next]')||el;
if(el.matches('.pin-keypad')){
 const pin=state.route==='manager-pin'?(state.managerPin||'0000'):(current().pin||'1111');
 const digit=pin[pinBuffer.length];
 if(digit)arrowTarget=[...el.querySelectorAll('.pin-key')].find(b=>b.querySelector('strong')?.textContent===digit)||el;
}
if(el.matches('input[type="checkbox"]'))arrowTarget=el;
if(card.contains(arrowTarget)||el.matches('.quiz-options')){window.RAPencil?.hide();return}
const arrowSource=card;
const quizIndex=state.route==='slow-self-quiz'?state.slowSelfQuiz?.index:state.route==='assigned-attestation'?state.activeAttestation?.index:state.route==='assigned-test'?state.activeQuiz?.index:'';
const arrowKey=[key,state.route,quizIndex,pinBuffer.length,el.getAttribute('onclick')||'',arrowTarget.getAttribute('onclick')||'',state.studyAssignmentId?document.querySelector('#modal h2')?.textContent||'':''].join('|');
const ar=arrowTarget.getBoundingClientRect(),centerX=ar.left+ar.width/2,centerY=ar.top+ar.height/2;
const obstruction=document.elementFromPoint(centerX,centerY);
if((obstruction&&arrowTarget.contains(obstruction))||arrowTarget.contains(card)||card.contains(arrowTarget)){
 window.RAPencil?.point(arrowSource,arrowTarget,arrowKey)
}else window.RAPencil?.hide();



}
function pinModeRoute(){return ['manager-pin','staff-pin'].includes(state.route)}
function rSelfResult(e){return state.route==='slow-self-quiz'&&state.slowSelfQuiz&&!state.slowSelfQuiz.itemId&&state.slowSelfQuiz.index>=state.slowSelfQuiz.questions.length&&e.target.closest('[data-self-request],[data-self-return]')}
function schedule(){if(!frame)frame=requestAnimationFrame(place)}
document.addEventListener('click',e=>{
if(e.target.closest('.tour-launch')){e.preventDefault();e.stopImmediatePropagation();launch();return}
if(!guided()||document.getElementById('raProductIntro')?.classList.contains('show'))return;
if(e.target.closest('#raNativeGuide,.ra-learning-note'))return;
const surface=learningSurface();
const allowed=(target?.isConnected&&target.contains(e.target))||(surface&&surface.contains(e.target));
const modalClose=modal()&&e.target.closest('#modal .closebtn');
const pinBack=pinModeRoute()&&e.target.closest('.pin-back');
const menuChoice=state.route==='learn'&&!modal()&&e.target.closest('.toolbar .chip,#menuBlock .menu-card,#menuBlock [data-self-block],#menuBlock [data-dish-test],.head button,.ra-assigned-menu button');
if(!allowed&&!modalClose&&!pinBack&&!menuChoice){e.preventDefault();e.stopImmediatePropagation();return}
const s=currentStep();if(!s)return;
const m=modal(),close=e.target.closest('#modal .closebtn'),mgr=state.auth==='manager',staff=state.auth==='staff';
if(mgr&&s.n===2&&m&&close)state.guideSales=true;
if(mgr&&s.n===3&&e.target.closest('[data-shift-role="bar"]'))state.guideCheckedBar=true;
if(mgr&&s.n===3&&m&&close)state.guideManagerCheck=true;
if(mgr&&e.target.closest('#roleBtn')&&state.assignedTests.some(t=>t.employeeId==='e1'&&t.block==='Салаты'&&t.assignedByManager)){state.guideManagerDone=true;rememberHandoff()}
if(state.route==='roles'&&e.target.closest('.role-card:nth-child(2)')&&state.guideManagerDone)rememberHandoff();
if(staff&&state.route==='assigned-test-result'&&e.target.closest('.quiz-result .primary'))state.guideTrainingAttempt=true;
if(staff&&rSelfResult(e)&&!window.raAssignedStudyResume?.()){if(state.learnArea==='bar')state.guideBarSeen=true;else state.guideSelfSeen=true}
if(staff&&s.n===4&&m&&close&&state.learnArea==='bar'&&!state.studyAssignmentId)state.guideBarSeen=true;

if(staff&&s.n===5&&e.target.closest('[data-training-read]'))state.guideMini=true;
if(staff&&s.n===6&&e.target.matches('#modal input[data-shift-id]'))state.guideHall=!!document.querySelector('#modal input[data-shift-id]:checked');
if(staff&&s.n===6&&m&&close&&state.guideHall)state.guideHallClosed=true;
if(staff&&s.n===7&&m&&close)state.guideSchedule=true;

save();setTimeout(schedule,30)
},true);
window.addEventListener('pageshow',()=>{schedule();setTimeout(schedule,180)});
document.addEventListener('visibilitychange',()=>{if(!document.hidden){schedule();setTimeout(schedule,180)}});
window.addEventListener('ra-intro-change',schedule);window.addEventListener('resize',schedule);window.addEventListener('scroll',schedule,true);window.visualViewport?.addEventListener('resize',schedule);window.visualViewport?.addEventListener('scroll',schedule);
const ae=activeEmployees;activeEmployees=function(){return ae().filter(e=>!guided()||e.role!=='Бармен')};
const base=render;render=function(){recoverHandoff();base();if(guided()){remember();if(state.auth==='staff'&&state.route==='home'&&!state.assignedTests.some(x=>x.employeeId===current().id&&x.workflowPreparation&&x.block==='Салаты')){raAssignGroup(current().id,'kitchen',encodeURIComponent('Салаты'),true)}}schedule()};
const om=openModal,cm=closeModal;openModal=function(){om.apply(this,arguments);schedule()};closeModal=function(){cm.apply(this,arguments);schedule()};
const reset=window.restartAcademyTour;
window.restartAcademyTour=async function(){clearHandoff();state.compactDemo=true;state.compactVersion=9;views=[];state.shiftChecks={};state.miniTrainingRead={};['guideSales','guideHall','guideHallClosed','guideManagerCheck','guideCheckedBar','guideCheckedManager','guideManagerDone','guideStaffDone','guideRatingSeen','guideTrainingAttempt','guideAssignmentPreview','guideSelfSeen','guideBarSeen','guideMini','guideSchedule','guidePay'].forEach(k=>state[k]=false);lastKey='';await reset();schedule()};
if(state.compactDemo&&state.compactVersion!==9){state.compactDemo=false;save()}
render();
})();
