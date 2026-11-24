(function(){
const guided=()=>!!state.compactDemo;
const task=kind=>state.assignedTests.find(t=>t.employeeId==='e1'&&t.assignmentType===kind);
const steps=[
['Продажи под контролем','Выручка, средний чек и личные продажи — ориентиры для обучения команды.','Открыть продажи',()=>raOpsFinance()],
['Диагностика знаний','Рейтинг по разделам показывает пробелы в знаниях каждого официанта.','Открыть сотрудника',()=>{state.demoHandoff=null;openEmployeePage('e1')}],
['Точечное обучение','Тест по блюду закрепляет состав, вкусные слова и рекомендации гостю.','Назначить тест',()=>raChooseDish('e1','kitchen',encodeURIComponent('Горячие закуски')),()=>!!task('training')],
['Единый стандарт знаний','Аттестация проверяет весь раздел меню и формирует официальный рейтинг.','Назначить аттестацию',()=>runAttestationPlaceholder('e1','kitchen',encodeURIComponent('Горячие закуски')),()=>!!task('attestation')],
['Официант знает свои цели','Личные задания и рейтинг показывают, чему учиться и над чем работать.','Открыть кабинет',()=>switchRole('Официант','e1')],
['Знать меню — значит уметь продавать','Состав, вкусные слова и скрипты помогают развивать личные продажи, допродажи и средний чек.','Изучить и пройти тест',()=>studyAssignmentMaterial(task('training').id),()=>task('training')?.status==='done'],
['Знания подтверждены','Изучение всего раздела и проверка знаний вместо формального ознакомления с меню.','Изучить раздел и пройти',()=>{if(state.auth!=='staff'||state.currentEmployee!=='e1')switchRole('Официант','e1');const t=task('attestation');t.materialReviewed?openAssignedAttestation(t.id):studyAssignmentMaterial(t.id)},()=>task('attestation')?.status==='done'],
['Стандарты в каждой смене','Чек-лист помогает не забывать обязательные действия перед встречей гостей.','Отметить чек-лист',()=>raOpsChecks('hall'),()=>checked('hall')],
['Обучение без формальности','Управляющий видит результаты заданий; тренировка не подменяет официальную аттестацию.','Посмотреть результат',()=>{switchRole('Управляющий');openEmployeePage('e1')}],
['Контроль исполнения','Видно, какие задачи выполнены, кем и когда, а какие требуют внимания.','Проверить чек-листы',()=>{switchRole('Управляющий');raOpsChecks('hall')}],
['Результат обучения и контроля','Рейтинг знаний обновляется. Влияние обучения на продажи оценивается по динамике среднего чека и выручки.','Открыть рейтинг',()=>{switchRole('Управляющий');openEmployeePage('e1')}]
];
function checked(k){return Object.values(state.shiftChecks||{}).some(d=>Object.keys(d).some(id=>id.startsWith(k+'-')))}
function switchRole(role,id='e1'){closeModal();state.role=role;state.auth=role==='Управляющий'?'manager':'staff';state.currentEmployee=id;state.route='home';state.demoHandoff=null;state.filter='Все';save();render()}
function draw(){
const old=document.getElementById('raCompact');if(old)old.remove();
if(!guided())return;
let i=Math.min(steps.length-1,state.compactStep||0),s=steps[i],done=s[4]?s[4]():state.compactOpened===i;
const chapter=i<4?'I · Управляющий':i<8?'II · Официант':'III · Результат';
let el=document.createElement('section');el.id='raCompact';el.className='ra-compact';
el.innerHTML='<div class="ra-compact-meta"><span>'+chapter+' · '+(i+1)+' / '+steps.length+'</span><button type="button" data-exit>Выйти</button></div><div class="ra-compact-progress"><i style="width:'+((i+1)/steps.length*100)+'%"></i></div><div class="ra-compact-body"><div><b>'+s[0]+'</b><span>'+s[1]+'</span></div><button class="primary" data-act>'+ (done?(i===steps.length-1?'Завершить':'Далее →'):s[2])+'</button></div>';
document.getElementById('root').prepend(el);
el.querySelector('[data-exit]').onclick=()=>{state.compactDemo=false;state.demoHandoff=null;localStorage.setItem('ra-tour:optout','1');save();render()};
el.querySelector('[data-act]').onclick=()=>{
if(done){if(i===steps.length-1){state.compactDemo=false;state.demoHandoff=null;localStorage.setItem('ra-tour:optout','1')}else{state.compactStep=i+1;state.compactOpened=-1}save();render();return}
state.compactOpened=i;save();s[3]();draw()
};
}
if(state.compactDemo&&state.compactVersion!==2){state.compactDemo=false;save()}
const base=render;render=function(){base();draw()};
const reset=window.restartAcademyTour;window.restartAcademyTour=async function(){state.compactVersion=2;state.compactDemo=true;state.compactStep=0;state.compactOpened=-1;await reset();switchRole('Управляющий')};
render();
})();
