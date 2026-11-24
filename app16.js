// Guided onboarding for the presentation build. First visit per screen + manual replay via ?.
(function(){
  const TOUR_VERSION='ra-tour-v4';
  const SEEN_KEY=TOUR_VERSION+':seen';
  const OPTOUT_KEY='ra-tour:optout';

  function seenMap(){try{return JSON.parse(localStorage.getItem(SEEN_KEY)||'{}')}catch(e){return {}}}
  function saveSeen(m){localStorage.setItem(SEEN_KEY,JSON.stringify(m))}
  function isOptedOut(){return localStorage.getItem(OPTOUT_KEY)==='1'}
  function setOptOut(v){if(v)localStorage.setItem(OPTOUT_KEY,'1');else localStorage.removeItem(OPTOUT_KEY)}
  function screenKey(){
    if(state.demoHandoff?.stage==='manager'&&state.auth==='manager')return 'handoff-manager';
    if(state.demoHandoff?.stage==='select'&&state.route==='staff-select')return 'handoff-staff-select';
    if(state.demoHandoff?.stage==='pin'&&state.route==='staff-pin')return 'handoff-staff-pin';
    if(state.demoHandoff?.stage==='home'&&state.auth==='staff'&&state.route==='home')return 'handoff-staff-home';
    if(state.demoHandoff?.stage==='manager-pin-return'&&state.route==='manager-pin')return 'handoff-manager-pin-return';
    if(state.demoHandoff?.stage==='manager-result'&&state.auth==='manager'&&state.route==='home')return 'handoff-manager-result';
    if(state.route==='roles')return 'roles';
    if(state.route==='manager-pin')return 'manager-pin';
    if(state.route==='staff-select')return 'staff-select:'+state.role;
    if(state.route==='staff-pin')return 'staff-pin';
    if(state.auth==='manager'&&state.route==='home')return 'manager-home';
    if(state.auth==='manager'&&state.route==='employee-detail')return state.expandedKnowledgeKey?'employee-actions':'employee-detail';
    if(state.auth==='staff'&&state.route==='home')return 'staff-home';
    // The guided study modal is itself the tour: do not place a second overlay over it.
    if(state.studyAssignmentId&&state.auth==='staff'&&state.route==='learn')return '';
    if(state.auth==='staff'&&state.route==='learn')return 'learn:'+state.learnArea;
    if(state.route==='assigned-test')return 'assigned-test';
    if(state.route==='assigned-test-result')return 'assigned-test-result';
    if(state.route==='assigned-attestation')return 'assigned-attestation';
    if(state.route==='assigned-attestation-result')return 'assigned-attestation-result';
    if(state.route==='slow-self-quiz')return 'slow-self-quiz';
    return '';
  }

  const tours={
    'handoff-manager':[
      {sel:'.quick-role-waiter',title:'Перейдите в кабинет официанта',action:true}
    ],
    'handoff-staff-select':[
      {sel:'.staff-select-head',title:'Задание уже ждёт сотрудника'},
      {sel:'.handoff-target',title:'Выберите нужного официанта',action:true}
    ],
    'handoff-staff-pin':[
      {sel:'.pin-keypad',title:'Войдите как сотрудник',action:true}
    ],
    'handoff-staff-home':[
      {sel:'.attestation-inbox, .notification-card',title:'Вот назначенная аттестация'},
      {sel:'.attestation-inbox .ra-assignment-actions .ghost',title:'Изучите «Стрипсы»',action:true}
    ],
    'roles':[
      {sel:'.role-intro',title:'Демонстрация сервиса'},
      {sel:'.role-card:nth-child(1)',title:'Начните с управляющего',action:true}
    ],
    'manager-pin':[
      {sel:'.pin-keypad',title:'Вход управляющего · PIN 0000',action:true}
    ],
    'staff-select:Официант':[
      {sel:'.head',title:'Выберите сотрудника'},
      {sel:'.team-grid .card, .team-grid .employee-compact',title:'Личный профиль'}
    ],
    'staff-select:Бармен':[
      {sel:'.head',title:'Выберите сотрудника'},
      {sel:'.team-grid .card, .team-grid .employee-compact',title:'Личный профиль'}
    ],
    'staff-pin':[
      {sel:'.pin-keypad',title:'Вход сотрудника',action:true}
    ],
    'manager-home':[
      {sel:'.team-score-card',title:'Рейтинг команды'},
      {sel:'.employee-compact[data-employee-id="e1"]',title:'Откройте карточку Ильи',action:true}
    ],
    'employee-detail':[
      {sel:'.employee-detail-head',title:'Профиль сотрудника'},
      {sel:'.knowledge-row-wrap[data-demo-block] > .knowledge-row',title:'Откройте блок «Горячие закуски»',action:true}
    ],
    'employee-actions':[
      {sel:'.knowledge-row-wrap.open .knowledge-actions .ghost',title:'Тренировка · без изменения рейтинга'},
      {sel:'.knowledge-row-wrap.open .knowledge-actions .primary',title:'Назначьте проверку «Стрипсы»',action:true}
    ],
    'staff-home':[
      {sel:'.hero',title:'Личный кабинет'},
      {sel:'.scorebox',title:'Мой рейтинг'},
      {sel:'.attestation-inbox, .notification-card',title:'Задания от управляющего'},
      {sel:'.area-card:first-child',title:'Изучение меню'},
      {sel:'#nav',title:'Навигация'}
    ],
    'learn:kitchen':[
      {sel:'.head',title:'Кухня Slow'},
      {sel:'.toolbar',title:'Разделы меню'},
      {sel:'.menu-grid .menu-card, #menuBlock .menu-card',title:'Карточка блюда'},
      {sel:'#menuBlock .ghost, .head .ghost',title:'Тест по блоку'}
    ],
    'learn:bar':[
      {sel:'.head',title:'Бар Slow'},
      {sel:'.toolbar',title:'Разделы бара'},
      {sel:'.menu-grid .menu-card, #menuBlock .menu-card',title:'Карточка напитка'},
      {sel:'#menuBlock .ghost, .head .ghost',title:'Проверить знания'}
    ],
    'assigned-test':[
      {sel:'.quiz-top',title:'Тренировка · без изменения рейтинга'},
      {sel:'.quiz-progress',title:'Прогресс'},
      {sel:'.quiz-options',title:'Ответ и обучение'}
    ],
    'slow-self-quiz':[
      {sel:'.quiz-top',title:'Самостоятельная тренировка'},
      {sel:'.quiz-options',title:'Практика по меню'}
    ],
    'assigned-test-result':[
      {sel:'.quiz-result',title:'Результат тренировки'}
    ],
    'assigned-attestation':[
      {sel:'.quiz-top',title:'Аттестация · влияет на рейтинг'},
      {sel:'.quiz-options',title:'Выберите ответ',action:true}
    ],
    'handoff-manager-pin-return':[
      {sel:'.pin-keypad',title:'Вернитесь управляющим',action:true}
    ],
    'handoff-manager-result':[
      {sel:'.notification-card',title:'Результат уже у управляющего'},
      {sel:'.employee-compact[data-result-target]',title:'Рейтинг обновлён',action:true}
    ],
    'assigned-attestation-result':[
      {sel:'.attestation-result .result-circle',title:'Итоговый результат'},
      {sel:'.rating-after',title:'Рейтинг пересчитан'},
      {sel:'.quick-role-manager',title:'Вернитесь к управляющему',action:true}
    ]
  };

  let active=null,activeRoute=null,index=0,resizeTimer=null;

  function availableSteps(key){
    return (tours[key]||[]).filter(s=>document.querySelector(s.sel));
  }
  function ensureUI(){
    if(document.getElementById('raTour'))return;
    const root=document.createElement('div');root.id='raTour';root.className='ra-tour';
    root.innerHTML='<div class="ra-tour-spot"></div><div class="ra-tour-card"><div class="ra-tour-top"><span class="ra-tour-count"></span><div class="ra-tour-top-actions"><button class="ra-tour-repeat" type="button">Повторить</button><button class="ra-tour-skip" type="button">Пропустить</button></div></div><h3></h3><div class="ra-tour-dots"></div><div class="ra-tour-actions"><button class="ra-tour-back" type="button">Назад</button><button class="ra-tour-next" type="button">Далее</button></div></div>';
    document.body.appendChild(root);
    root.querySelector('.ra-tour-skip').onclick=()=>finish('skip');
    root.querySelector('.ra-tour-repeat').onclick=()=>place();
    root.querySelector('.ra-tour-back').onclick=prev;
    root.querySelector('.ra-tour-next').onclick=next;
    const help=document.createElement('button');help.id='raTourHelp';help.className='ra-tour-help';help.type='button';help.textContent='?';help.setAttribute('aria-label','Помощь по текущему экрану');help.setAttribute('title','Помощь по текущему экрану');help.onclick=()=>start(screenKey(),true);document.body.appendChild(help);
  }
  let placing=false,placementToken=0;
  function revealTarget(el){
    const r=el.getBoundingClientRect(),scroller=el.closest('.modal')||el.closest('#root');
    if(scroller&&scroller.scrollHeight>scroller.clientHeight){
      const v=scroller.getBoundingClientRect(),pad=12;
      if(r.top>=v.top+pad&&r.bottom<=v.bottom-pad)return;
      if(r.height>v.height-pad*2||r.top<v.top+pad)scroller.scrollTop+=r.top-v.top-pad;
      else if(r.bottom>v.bottom-pad)scroller.scrollTop+=r.bottom-v.bottom+pad;
    }else if(!matchMedia('(max-width:767px)').matches&&(r.top<86||r.bottom>innerHeight-110)){
      el.scrollIntoView({behavior:'auto',block:'nearest',inline:'nearest'});
    }
  }
  function scrollTargetIntoView(el,done){
    placing=true;
    revealTarget(el);
    placing=false;done();
  }
  function place(){
    if(!active)return;
    const steps=availableSteps(active),step=steps[index];if(!step){finish();return}
    const el=document.querySelector(step.sel);if(!el){next();return}
    const token=++placementToken;
    scrollTargetIntoView(el,()=>{if(token===placementToken)placeVisible(el,step,steps,token)});
  }
  function placeVisible(el,step,steps,token){
    if(!active||!document.body.contains(el))return;
    const root=document.getElementById('raTour');
    const r=el.getBoundingClientRect(),spot=document.querySelector('.ra-tour-spot'),card=document.querySelector('.ra-tour-card');
    // Let people tap the highlighted keypad; keep the guidance card clickable.
    if(root)root.style.pointerEvents=step.action?'none':'auto';
    if(card)card.style.pointerEvents='auto';
    if(step.action){el.style.pointerEvents='auto';el.style.touchAction='manipulation'}
    const pad=8,left=Math.max(6,r.left-pad),top=Math.max(6,r.top-pad),width=Math.min(innerWidth-left-6,r.width+pad*2),height=Math.min(innerHeight-top-6,r.height+pad*2);
    Object.assign(spot.style,{left:left+'px',top:top+'px',width:Math.max(24,width)+'px',height:Math.max(24,height)+'px'});
    card.querySelector('h3').textContent=step.title;
    card.querySelector('.ra-tour-count').textContent=(index+1)+' / '+steps.length;
    card.querySelector('.ra-tour-back').disabled=index===0&&!previousTourRoute();
    card.querySelector('.ra-tour-next').textContent=step.action?'Понятно':(index===steps.length-1?'Понятно':'Далее');
    card.querySelector('.ra-tour-dots').innerHTML=steps.map((_,i)=>'<i class="'+(i===index?'on':'')+'"></i>').join('');
    requestAnimationFrame(()=>{
      if(token!==placementToken||!active)return;
      const ch=card.offsetHeight,cw=card.offsetWidth,gap=14;
      if(innerWidth<700){
        card.style.left='14px';card.style.right='14px';card.style.width='auto';
        const targetCenter=r.top+r.height/2;
        const topSpace=r.top-gap;
        const bottomSpace=innerHeight-r.bottom-gap;
        let ct;
        if(targetCenter>innerHeight/2&&topSpace>=ch+10) ct=Math.max(12,r.top-ch-gap);
        else if(bottomSpace>=ch+10) ct=Math.min(innerHeight-ch-12,r.bottom+gap);
        else ct=targetCenter>innerHeight/2?12:Math.max(12,innerHeight-ch-12);
        card.style.top=ct+'px';
      }else{
        card.style.right='auto';card.style.width='min(390px,calc(100vw - 32px))';
        const below=innerHeight-r.bottom-gap,above=r.top-gap;
        const roomRight=innerWidth-r.right-gap,roomLeft=r.left-gap;
        let cl,ct;
        if(roomRight>=cw+8){
          cl=r.right+gap;ct=Math.min(Math.max(14,r.top),innerHeight-ch-14);
        }else if(roomLeft>=cw+8){
          cl=Math.max(14,r.left-cw-gap);ct=Math.min(Math.max(14,r.top),innerHeight-ch-14);
        }else if(below>=ch+8){
          cl=Math.min(Math.max(16,r.left),innerWidth-cw-16);ct=r.bottom+gap;
        }else{
          cl=Math.min(Math.max(16,r.left),innerWidth-cw-16);ct=Math.max(14,r.top-ch-gap);
        }
        card.style.left=cl+'px';card.style.top=ct+'px';
      }
    });
  }
  function lockTourInteraction(){
    document.documentElement.classList.add('ra-tour-lock');
    document.body.classList.add('ra-tour-lock');
  }
  function unlockTourInteraction(){
    document.documentElement.classList.remove('ra-tour-lock');
    document.body.classList.remove('ra-tour-lock');
  }
  function blockTourGesture(e){
    if(!active||!document.getElementById('raTour')?.classList.contains('show')||document.getElementById('raProductIntro')?.classList.contains('show'))return;
    const card=e.target?.closest?.('.ra-tour-card');
    if(card)return;
    if(e.cancelable)e.preventDefault();
  }
  function blockTourWheel(e){
    if(!active||!document.getElementById('raTour')?.classList.contains('show')||document.getElementById('raProductIntro')?.classList.contains('show'))return;
    const card=e.target?.closest?.('.ra-tour-card');
    if(card)return;
    if(e.cancelable)e.preventDefault();
  }
  document.addEventListener('touchmove',blockTourGesture,{passive:false,capture:true});
  document.addEventListener('wheel',blockTourWheel,{passive:false,capture:true});
  document.addEventListener('gesturestart',blockTourGesture,{passive:false,capture:true});
  document.addEventListener('gesturechange',blockTourGesture,{passive:false,capture:true});
  document.addEventListener('gestureend',blockTourGesture,{passive:false,capture:true});

  let pendingAction=null;
  function clearAction(){
    pendingAction=null;
    document.querySelectorAll('.ra-next-action').forEach(x=>x.classList.remove('ra-next-action'));
  }
  function restoreAction(){
    if(!pendingAction)return;
    if(pendingAction.route!==state.route||pendingAction.key!==screenKey()){clearAction();return}
    const el=document.querySelector(pendingAction.sel);
    if(el)el.classList.add('ra-next-action');
  }
  document.addEventListener('click',e=>{
    if(pendingAction){
      const el=document.querySelector(pendingAction.sel);
      if(el?.contains(e.target)&&!el.matches('.pin-keypad'))clearAction();
    }
    if(!active)return;
    const step=availableSteps(active)[index];
    if(!step?.action)return;
    const el=document.querySelector(step.sel);
    if(el?.contains(e.target))finish(el.matches('.pin-keypad')?'done':'action');
  },true);
  function start(key,force=false){
    ensureUI();if(!key||key!==screenKey()||active===key)return;
    const steps=availableSteps(key);if(!steps.length)return;
    const seen=seenMap();if(!force&&seen[key])return;
    clearAction();active=key;activeRoute=state.route;index=0;lockTourInteraction();place();document.getElementById('raTour').classList.add('show');
  }
  function pulseNextAction(step){
    if(!step?.action)return;
    clearAction();
    const el=document.querySelector(step.sel);if(!el)return;
    pendingAction={sel:step.sel,route:state.route,key:screenKey()};
    el.classList.add('ra-next-action');
    revealTarget(el);
  }
  function finish(reason='done'){
    const steps=active?availableSteps(active):[],step=steps[index];
    if(active){const m=seenMap();m[active]=true;saveSeen(m)}
    if(reason==='skip')setOptOut(true);
    clearAction();
    placementToken++;active=null;activeRoute=null;unlockTourInteraction();
    const root=document.getElementById('raTour');
    root?.classList.remove('show');
    if(root)root.style.pointerEvents='';
    if(reason==='done')pulseNextAction(step);
  }
  function next(){if(!active)return;const steps=availableSteps(active),step=steps[index];if(step?.action){finish();return}const n=steps.length;if(index>=n-1)finish();else{index++;place()}}
  function previousTourRoute(){
    if(state.route==='manager-pin'||state.route==='staff-select')return 'roles';
    if(state.route==='staff-pin')return 'staff-select';
    if(state.route==='employee-detail'||state.route==='learn')return 'home';
    return null;
  }
  function prev(){
    if(!active)return;
    if(index>0){index--;place();return}
    const previous=previousTourRoute();
    if(!previous)return;
    finish('back');
    if(previous==='roles')goRoles();
    else{state.route=previous;save();render()}
    const key=screenKey();
    setTimeout(()=>{
      if(state.route!==previous||screenKey()!==key||active)return;
      start(key,true);
      if(active===key){index=Math.max(0,availableSteps(key).length-1);place()}
    },80);
  }
  function maybe(){if(active||isOptedOut())return;const key=screenKey();if(!key)return;setTimeout(()=>{if(!active&&!isOptedOut()&&screenKey()===key)start(key,false)},260)}

  window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(place,80)});
  window.addEventListener('scroll',()=>{if(active&&!placing){clearTimeout(resizeTimer);resizeTimer=setTimeout(place,90)}},{passive:true});

  const realRender=render;
  render=function(){realRender();ensureUI();if(active&&(activeRoute!==state.route||active!==screenKey()))finish('navigation');restoreAction();maybe()};
  window.restartAcademyTour=async function(){
    finish();
    setOptOut(false);
    saveSeen({});
    state.demoRunId='run_'+Date.now()+'_'+Math.random().toString(36).slice(2,8);
    state.demoIsolationVersion=typeof DEMO_ISOLATION_VERSION!=='undefined'?DEMO_ISOLATION_VERSION:'run-v1';
    state.demoHandoff=null;
    state.assignedTests=[];
    state.testResults=[];
    state.activeQuiz=null;
    state.activeAssignedTest=null;
    state.activeAttestation=null;
    state.assignmentStudyProgress={};
    state.studyAssignmentId=null;
    state.expandedKnowledgeKey='';
    state.filter='Все';
    state.managerPin='0000';
    if(window.RA_DEMO_BASE_EMPLOYEES) state.employees=JSON.parse(JSON.stringify(window.RA_DEMO_BASE_EMPLOYEES));
    state.auth=null;
    state.role=null;
    state.currentEmployee='e1';
    state.route='roles';
    save();
    render();
    (window.raScrollPage||window.scrollTo.bind(window))({top:0,behavior:'auto'});
    try{
      if(window.RAResetDemoCloud) await window.RAResetDemoCloud();
    }catch(e){
      console.warn('[RA Demo reset]',e);
    }
    render();
    setTimeout(()=>start('roles',true),180);
  };
  window.RAOnboarding={
    startKey:(key,force=true)=>start(key,force),
    currentKey:screenKey,
    skip:()=>finish('skip'),
    highlight:sel=>pulseNextAction({sel,action:true}),
    restart:window.restartAcademyTour
  };
  ensureUI();maybe();
})();