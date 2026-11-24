(function(){
const lists=window.RAShiftLists,roles={hall:'Зал',bar:'Бар'};
const role=()=>state.auth==='manager'?'hall':current()?.role==='Бармен'?'bar':'hall';
const book=()=>{state.shiftChecks ||= {};const d=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Moscow'}).format(new Date());return state.shiftChecks[d] ||= {}};
const items=k=>lists[k].sections.flatMap((s,i)=>s.items.map((x,j)=>k+'-'+i+'-'+j));
const count=k=>items(k).filter(id=>book()[id]).length+'/'+items(k).length;
const tile=(a,b,c,d)=>'<button class="ra-ops-tile" onclick="'+d+'"><span>'+a+'</span><strong>'+b+'</strong><small>'+c+'</small></button>';
const money=n=>new Intl.NumberFormat('ru-RU').format(n)+' ₽';
const sales={e1:{amount:46600,checks:20,plan:60000},e2:{amount:69800,checks:30,plan:90000},e4:{amount:70000,checks:30,plan:90000}};
const personal=e=>sales[e?.id]||null;
const personalRows=d=>d?rows([['Личные продажи',money(d.amount)],['Личный план',money(d.plan)],['Выполнение плана',Math.round(d.amount/d.plan*100)+'%'],['Средний чек',money(Math.round(d.amount/d.checks))],['Количество чеков',String(d.checks)]]):'<p>Нет демонстрационных данных по сотруднику.</p>';
function panel(){
const manager=state.auth==='manager';
return '<section class="ra-ops section"><h2>Рабочая смена</h2><div class="ra-ops-grid">'+(manager?tile('Выручка','186 400 ₽','Демо · сегодня','raOpsFinance()')+tile('План продаж','78%','Демо · план 240 000 ₽','raOpsFinance()')+tile('Чек-листы','Зал '+count('hall'),state.compactDemo?'Контроль стандартов':'Бар '+count('bar'),'raOpsChecks()')+tile('График команды','Смены','Демо','raOpsSchedule()'):tile('Чек-лист',count(role()),roles[role()]+' · сегодня','raOpsChecks()')+tile('Мой график','12:00–23:00','Демо','raOpsSchedule()')+tile('Мои продажи',personal(current())?money(personal(current()).amount):'—','Демо · за смену','raOpsFinance()')+tile('Начислено',current().id==='e1'?'28 500 ₽':'—','Демо · за месяц','raOpsFinance()'))+'</div></section>';
}
function modal(title,body){openModal('<div class="modal-head"><div><div class="kicker">Рабочая смена · демо</div><h2>'+title+'</h2></div><button class="closebtn" onclick="closeModal()">×</button></div>'+body)}
const allowed=k=>!!roles[k]&&(state.auth==='manager'||state.auth==='staff'&&role()===k);
const writable=k=>allowed(k)&&state.auth==='staff';
window.raOpsChecks=function(k=state.auth==='manager'?'hall':role()){
if(!allowed(k))return;
let h=state.auth==='manager'?Object.keys(roles).map(r=>'<button class="ghost" data-shift-role="'+r+'">'+roles[r]+' '+count(r)+'</button>').join(' '):'';
h+='<h3>'+roles[k]+' · '+count(k)+'</h3>';
h+=lists[k].sections.map((s,i)=>'<details class="ra-check-phase" '+(i===0?'open':'')+'><summary>'+esc(s.title)+'</summary>'+s.items.map((x,j)=>{const id=k+'-'+i+'-'+j,v=book()[id];return '<label class="ra-check-item"><input type="checkbox" data-shift-id="'+id+'" '+(v?'checked ':'')+(writable(k)?'':'disabled')+'><span>'+esc(x.text)+(x.time?'<small>'+esc(x.time)+'</small>':'')+(x.note?'<small>'+esc(x.note)+'</small>':'')+(v?'<small>'+esc(v.name)+' · '+esc(v.time)+'</small>':'')+'</span></label>'}).join('')+'</details>').join('');
modal('Чек-листы',h);
const m=document.getElementById('modal');
m.querySelectorAll('[data-shift-role]').forEach(b=>b.onclick=()=>raOpsChecks(b.dataset.shiftRole));
m.querySelectorAll('[data-shift-id]').forEach(b=>b.onchange=()=>{if(!writable(k))return;const id=b.dataset.shiftId,top=m.scrollTop,opened=[...m.querySelectorAll('details')].map(d=>d.open);if(b.checked)book()[id]={name:state.auth==='manager'?'Управляющий':current().name,time:new Intl.DateTimeFormat('ru-RU',{timeZone:'Europe/Moscow',hour:'2-digit',minute:'2-digit'}).format(new Date())};else delete book()[id];save();render();raOpsChecks(k);[...m.querySelectorAll('details')].forEach((d,i)=>d.open=opened[i]);m.scrollTop=top});
};
const rows=xs=>xs.map(x=>'<div class="ra-ops-row"><span>'+esc(x[0])+'</span><b>'+esc(x[1])+'</b></div>').join('');
window.raOpsFinance=function(){
 if(state.auth==='manager'){
 const team=Object.keys(sales).map(id=>({e:state.employees.find(e=>e.id===id),d:sales[id]})).filter(x=>x.e);
 const revenue=team.reduce((sum,x)=>sum+x.d.amount,0),checks=team.reduce((sum,x)=>sum+x.d.checks,0),plan=team.reduce((sum,x)=>sum+x.d.plan,0);
 return modal('Продажи ресторана','<p>Демонстрационные данные · интеграция с iiko не подключена.</p>'+rows([['Выручка',money(revenue)],['План',money(plan)],['Выполнение',Math.round(revenue/plan*100)+'%'],['Средний чек',money(Math.round(revenue/checks))],['Количество чеков',String(checks)],['Кухня','125 000 ₽'],['Бар','61 400 ₽']])+'<h3>Личные продажи сотрудников</h3>'+team.map(({e,d})=>'<div class="ra-ops-row"><span><b>'+esc(e.name)+'</b><small style="display:block">Средний чек '+money(Math.round(d.amount/d.checks))+' · '+d.checks+' чеков</small></span><b>'+money(d.amount)+'</b></div>').join(''))
 }
 if(state.auth==='staff'){
 const d=personal(current());
 return modal('Мои продажи и начисления','<p>Демонстрационные данные · интеграция с iiko не подключена.</p><h3>Моя смена</h3>'+personalRows(d)+'<h3>Начисления за месяц</h3>'+(current().id==='e1'?rows([['За месяц','28 500 ₽'],['Оклад / часы','24 000 ₽'],['Бонусы','4 500 ₽']]):'<p>Нет демонстрационных данных по начислениям.</p>'))
 }
};
window.raOpsSchedule=()=>modal(state.auth==='manager'?'График команды':'Мой график','<p>Демо-данные · iiko не подключена.</p>'+rows(state.auth==='manager'?activeEmployees().map((e,i)=>[e.name,i===1?'Выходной':'12:00–23:00']):[['Сегодня','12:00–23:00'],['Завтра','12:00–23:00'],['Послезавтра','Выходной']]));
const base=render;render=function(){base();if(state.auth&&state.route==='home')document.getElementById('root').insertAdjacentHTML('beforeend',panel())};
const restart=window.restartAcademyTour;window.restartAcademyTour=function(){state.shiftChecks={};return restart.apply(this,arguments)};
render();
})();