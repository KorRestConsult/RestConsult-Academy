(function(){
window.raChooseDish=function(id,area,enc){
if(state.auth!=='manager')return;
const block=decodeURIComponent(enc),xs=STOCK[area].filter(x=>x.block===block);
openModal('<div class="modal-head"><h2>Тест по блюду</h2><button class="closebtn" onclick="closeModal()">×</button></div>'+xs.map(x=>'<button class="ghost ra-dish-choice" data-dish="'+esc(x.id)+'">'+esc(x.name)+'</button>').join(''));
document.querySelectorAll('.ra-dish-choice').forEach(b=>b.onclick=()=>{const x=xs.find(v=>v.id===b.dataset.dish);if(!x)return;if(state.assignedTests.some(t=>t.employeeId===id&&t.itemId===x.id&&t.assignmentType!=='attestation'&&t.status!=='done')){showToast('Тест уже назначен');return}
const t={id:'dish_'+Date.now(),employeeId:id,area,block,itemId:x.id,itemName:x.name,scope:'item',assignmentType:'training',presentation:!!state.demoRunId,status:'new',createdAt:today(),managerSeen:false};
if(!buildDemoQuestions(t).length){showToast('Нет вопросов по блюду');return}
state.assignedTests.push(t);state.demoHandoff={employeeId:id,stage:'manager'};closeModal();save();render();showToast('Тест назначен: '+x.name);});
};
const guided=()=>!!state.demoRunId&&localStorage.getItem('ra-tour:optout')!=='1';
const baseRole=openRole;openRole=function(r){if(guided()&&!state.compactDemo&&r==='Управляющий'){state.role=r;state.auth='manager';state.route='home';save();render()}else baseRole(r)};
const baseSelect=selectStaff;selectStaff=function(id){if(guided()&&!state.compactDemo){state.currentEmployee=id;state.auth='staff';state.route='home';if(state.demoHandoff?.employeeId===id)state.demoHandoff.stage='home';save();render()}else baseSelect(id)};
const baseReturn=window.quickSwitchToManager;window.quickSwitchToManager=function(){if(!guided()||state.compactDemo)return baseReturn();const result=state.assignedTests.filter(t=>t.status==='done'&&t.assignmentType==='attestation').at(-1);state.role='Управляющий';state.auth='manager';state.route='home';state.filter='Все';state.demoHandoff=result?{employeeId:result.employeeId,stage:'manager-result'}:null;save();render()};
})();