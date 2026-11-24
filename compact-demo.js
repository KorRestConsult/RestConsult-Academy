(function(){
const guided=()=>!!state.compactDemo;
const task=kind=>state.assignedTests.find(t=>t.employeeId==='e1'&&t.assignmentType===kind);
const steps=[
['Управляющий','Выручка и план продаж','Открыть продажи',()=>raOpsFinance()],
['Команда','Знания и рейтинг','Открыть сотрудника',()=>{state.demoHandoff=null;openEmployeePage('e1')}],
['Обучение','Тест по конкретному блюду','Назначить тест',()=>raChooseDish('e1','kitchen',encodeURIComponent('Горячие закуски')),()=>!!task('training')],
['Контроль','Аттестация раздела меню','Назначить аттестацию',()=>runAttestationPlaceholder('e1','kitchen',encodeURIComponent('Горячие закуски')),()=>!!task('attestation')],
['Официант','Личный рейтинг и задания','Открыть кабинет',()=>switchRole('Официант','e1')],
['Меню','Состав · вкусные слова · скрипт','Изучить и пройти тест',()=>studyAssignmentMaterial(task('training').id),()=>task('training')?.status==='done'],
['Аттестация','Знания всего блока','Изучить раздел и пройти',()=>{if(state.auth!=='staff'||state.currentEmployee!=='e1')switchRole('Официант','e1');const t=task('attestation');t.materialReviewed?openAssignedAttestation(t.id):studyAssignmentMaterial(t.id)},()=>task('attestation')?.status==='done'],
['Официант','Открытие смены','Отметить чек-лист',()=>raOpsChecks('hall'),()=>checked('hall')],
['Управляющий','Результат обучения · отдельно от аттестации','Посмотреть результат',()=>{switchRole('Управляющий');openEmployeePage('e1')}],
['Управляющий','Контроль чек-листа зала','Проверить чек-листы',()=>{switchRole('Управляющий');raOpsChecks('hall')}],
['Результат','Рейтинг обновлён','Открыть рейтинг',()=>{switchRole('Управляющий');openEmployeePage('e1')}]
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
