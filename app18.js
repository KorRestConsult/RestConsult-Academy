// Final UX audit fixes from the 13-page buyer review.
(function(){
  function pct(v){const n=Number(v)||0;return Math.max(0,Math.min(100,n))}
  function scaleHTML(v,label){
    const n=pct(v);
    return '<div class="ra-rating-scale" aria-label="'+esc(label||'Рейтинг')+' '+n+'%"><div class="ra-rating-scale-top"><span>'+esc(label||'Рейтинг')+'</span><b>'+(n?n+'%':'—')+'</b></div><div class="ra-rating-track"><i style="width:'+n+'%"></i></div></div>';
  }
  window.raScaleHTML=scaleHTML;

  // 1) Make every employee knowledge score visual, not a lonely percentage.
  knowledgeRows=function(e,area){return blocksFor(area).map(b=>{
    const r=rating(e,area,b),n=atts(e,area,b).length,key=knowledgeKey(area,b),open=state.expandedKnowledgeKey===key,enc=encodeURIComponent(b),
      sent=sentTestExists(e.id,area,b),attSent=sentAttestationExists(e.id,area,b),lastTest=latestCompletedTest(e.id,area,b);
    let desc=n?(n+' '+(n===1?'аттестация':'аттестации')+(r?' · результат внутренней проверки '+r+'%':'')):'Аттестаций пока нет';
    if(lastTest)desc+=' · тренировка '+lastTest.correct+' из '+lastTest.total;
    const demoDish=area==='kitchen'&&b==='Горячие закуски'&&e.id==='e1'&&(STOCK.kitchen||[]).find(x=>x.id==='kitchen_stripsy');
    const itemArg=demoDish?",'"+demoDish.id+"'":'';
    const actionText=demoDish?'Проверить «'+esc(demoDish.name)+'»':'Назначить аттестацию';
    const extra=demoDish?'<button class="ghost" onclick="runAttestationPlaceholder(\''+e.id+'\',\''+area+'\',\''+enc+'\')">Весь блок (отдельно)</button>':'';
    return '<div class="knowledge-row-wrap '+(open?'open':'')+'" '+(demoDish?'data-demo-block':'')+'><button class="knowledge-row" onclick="toggleKnowledge(\''+area+'\',\''+enc+'\')"><div class="knowledge-row-main"><b>'+esc(b)+'</b><small>'+esc(desc)+'</small>'+scaleHTML(r,'Уровень блока')+'</div><span class="knowledge-chevron">›</span></button><div class="knowledge-expand"><div class="knowledge-expand-inner"><div class="knowledge-actions"><button class="ghost '+(sent?'sent':'')+'" onclick="sendTest(\''+e.id+'\',\''+area+'\',\''+enc+'\')">'+(sent?'Тест отправлен':'Отправить тест')+'</button><button class="primary '+(attSent?'sent':'')+'" onclick="runAttestationPlaceholder(\''+e.id+'\',\''+area+'\',\''+enc+'\''+itemArg+')">'+(attSent?'Задание назначено':actionText)+'</button>'+extra+'</div></div></div></div>';
  }).join('')};

  employeeDetailPage=function(){
    const e=current(),all=rating(e),kr=rating(e,'kitchen'),br=rating(e,'bar');
    return '<div class="backline"><button class="ghost" onclick="state.route=\'home\';save();render()">← Команда</button></div>'+
      '<section class="employee-detail-head ra-detail-head">'+employeePhoto(e)+'<div><div class="kicker">'+esc(e.role)+' · сотрудник</div><h1>'+esc(e.name)+'</h1><p>'+(e.tg?esc(e.tg):'')+(e.start?' · с '+esc(e.start):'')+'</p></div><div class="detail-total"><span>Общий рейтинг</span><strong>'+(all||'—')+(all?'%':'')+'</strong>'+scaleHTML(all,'Общий уровень')+'</div></section>'+
      '<section class="section section-lined"><div class="section-title"><span>01</span><div><h2>Шкала знаний</h2><p>Вся система строится от общего рейтинга к конкретному слабому блоку</p></div></div>'+
      '<div class="ra-area-scales"><div class="card">'+scaleHTML(kr,'Кухня')+'</div><div class="card">'+scaleHTML(br,'Бар')+'</div></div>'+
      '<div class="knowledge-grid"><div class="knowledge-card"><div class="knowledge-head"><h3>Кухня</h3><strong>'+ (kr?kr+'%':'—') +'</strong></div><div class="knowledge-list">'+knowledgeRows(e,'kitchen')+'</div></div><div class="knowledge-card"><div class="knowledge-head"><h3>Бар</h3><strong>'+ (br?br+'%':'—') +'</strong></div><div class="knowledge-list">'+knowledgeRows(e,'bar')+'</div></div></div></section>'+
      '<section class="section section-lined"><div class="section-title"><span>02</span><div><h2>Тренировочные тесты</h2><p>Тренировка показывает знания, но не меняет рейтинг</p></div></div>'+managerTrainingResults(e)+'</section>'+
      '<section class="section section-lined"><div class="section-title"><span>03</span><div><h2>История аттестаций</h2><p>Только внутренние итоговые аттестации формируют шкалы выше</p></div></div>'+employeeHistory(e)+'</section>'+
      '<section class="section section-lined"><div class="settings-strip"><div><b>Настройки сотрудника</b><small>Редко используемые действия</small></div><div class="settings-actions"><button class="ghost" onclick="openEmployeeForm(\''+e.id+'\')">Редактировать</button><button class="ghost" onclick="openPinReset(\''+e.id+'\')">Сменить PIN</button><button class="danger" onclick="archiveEmployee(\''+e.id+'\')">Архивировать</button></div></div></section>';
  };

  managerTrainingResults=function(e){
    const rows=completedTestsFor(e.id);
    if(!rows.length)return '<div class="empty">Тренировочных тестов пока нет.</div>';
    return '<div class="test-results-card">'+rows.slice(0,8).map(t=>'<div class="test-result-row"><div><b>'+esc(t.block)+'</b><small>'+(t.area==='kitchen'?'Кухня':'Бар')+' · '+esc(t.completedAt||'')+' · тренировка</small></div><div class="test-result-score"><b>'+t.correct+' из '+t.total+'</b><small>'+t.score+'%</small></div></div>').join('')+'</div>';
  };

  // 2) A block attestation requires reviewing EVERY item in that block.
  // The demonstration remembers completed cards, never treats one dish as a whole block.
  // Upgrade only unfinished legacy demo tasks that had no explicit scope.
  // Explicit full-block assignments stay untouched.
  let upgradedLegacyDish=false;
  (state.assignedTests||[]).forEach(t=>{
    if(!t.scope&&t.employeeId==='e1'&&t.area==='kitchen'&&t.block==='Горячие закуски'&&t.assignmentType==='attestation'&&t.status==='new'){
      t.scope='item';t.itemId='kitchen_stripsy';t.itemName='Стрипсы';
      upgradedLegacyDish=true;
    }
  });
  if(upgradedLegacyDish)save();
  function pendingAssignment(id){return (state.assignedTests||[]).find(t=>t.id===id)}
  function itemsForAssignment(t){return (STOCK[t.area]||[]).filter(x=>x.block===t.block&&(!t.itemId||x.id===t.itemId))}
  function reviewFor(t){
    state.assignmentStudyProgress=state.assignmentStudyProgress||{};
    let progress=state.assignmentStudyProgress[t.id];
    if(!progress||!Array.isArray(progress.reviewedIds)){
      progress={reviewedIds:[]};
      state.assignmentStudyProgress[t.id]=progress;
    }
    return progress;
  }
  function studyStatus(t){
    const items=itemsForAssignment(t);
    const progress=reviewFor(t);
    const done=items.filter(x=>progress.reviewedIds.includes(x.id)).length;
    const completed=items.length>0&&done===items.length;
    // Older demo sessions may contain the former one-dish completion flag.
    if(t.materialReviewed&&!completed)t.materialReviewed=false;
    return {items,done,total:items.length,completed};
  }
  function openStudyCard(t, item){
    if(!item)return;
    state.studyAssignmentId=t.id;
    state.learnArea=t.area;
    state.route='learn';
    save();render();
    showBlock(t.area,t.block);
    openMenu(item.id);
  }
  window.studyAssignmentMaterial=function(id){
    const t=pendingAssignment(id);if(!t)return;
    const s=studyStatus(t);
    if(!s.total){showToast('Нет учебных карточек для блока «'+t.block+'»');return}
    const next=s.items.find(x=>!reviewFor(t).reviewedIds.includes(x.id))||s.items[0];
    openStudyCard(t,next);
  };
  window.markStudyItemAndNext=function(id){
    const t=pendingAssignment(state.studyAssignmentId);if(!t)return;
    const s=studyStatus(t);
    const item=s.items.find(x=>x.id===id);
    if(!item)return;
    const progress=reviewFor(t);
    if(!progress.reviewedIds.includes(id))progress.reviewedIds.push(id);
    const next=s.items.find(x=>!progress.reviewedIds.includes(x.id));
    if(next){
      save();
      // Keep the menu card in the same modal, without jumping to the test.
      openMenu(next.id);
    }else{
      finishStudyMaterial();
    }
  };
  window.finishStudyMaterial=function(){
    const t=pendingAssignment(state.studyAssignmentId);
    if(!t)return;
    const s=studyStatus(t);
    if(!s.completed){
      showToast('Изучено '+s.done+' из '+s.total+'. Для аттестации нужен весь блок.');
      const next=s.items.find(x=>!reviewFor(t).reviewedIds.includes(x.id));
      if(next)openMenu(next.id);
      return;
    }
    t.materialReviewed=true;
    state.studyAssignmentId=null;
    closeModal();
    state.route='home';
    save();render();
    if(t.itemId){
      showToast('Блюдо изучено. Теперь проверим знания именно этой позиции.');
      window.openAssignedAttestation(t.id);
      return;
    }
    showToast('Изучены все '+s.total+' позиций блока. Теперь можно пройти аттестацию.');
    setTimeout(()=>{
      const btn=document.querySelector('.attestation-card .primary,.assigned-test .primary');
      if(btn)window.RAOnboarding?.highlight('.attestation-card .primary,.assigned-test .primary');
    },120);
  };

  const originalOpenMenu=openMenu;
  openMenu=function(id){
    const x=findMenu(id);if(!x)return;
    const bar=x.area==='bar';
    const t=state.studyAssignmentId&&pendingAssignment(state.studyAssignmentId);
    const inAssignedBlock=t&&x.area===t.area&&x.block===t.block&&(!t.itemId||x.id===t.itemId);
    const s=inAssignedBlock?studyStatus(t):null;
    const index=inAssignedBlock?s.items.findIndex(item=>item.id===x.id):-1;
    const facts=[
      ['Цена',x.price||'—'],
      [bar?'Объём':'Вес',x.volume||x.weight||'—'],
      ['Состав',x.ingredients||'—'],
      ['Вкус и ощущения',x.taste||x.meta||'—'],
      ['Как продавать',x.salesScript||x.desc||'—'],
      ['Скрипт / сервис',x.salesTechnique||'—']
    ];
    const studyInfo=inAssignedBlock?
      '<div class="ra-study-progress"><b>'+(t.itemId?'Изучение блюда «'+esc(x.name)+'»':'Изучение блока «'+esc(t.block)+'»')+'</b><span>'+(t.itemId?'Одна позиция · затем проверка по ней':'Блюдо '+(index+1)+' из '+s.total+' · просмотрено '+s.done)+'</span><div class="ra-study-progress-track"><i style="width:'+(s.done/s.total*100)+'%"></i></div></div>':'';
    const description=inAssignedBlock?
      (t.itemId?'Изучите «'+x.name+'». Затем пройдёте короткую проверку только по этому блюду.':'Последовательно изучите все '+s.total+' позиций блока. Проверка знаний начнётся только после последней карточки.'):
      'Изучите позицию и проверьте знания тренировочным тестом.';
    const action=inAssignedBlock?
      '<button class="primary" onclick="markStudyItemAndNext(\''+x.id+'\')">'+(t.itemId?'Изучено → проверить «'+esc(x.name)+'»':index===s.total-1?'Изучено · завершить блок':'Изучено · следующее блюдо →')+'</button>':
      '<button class="primary" onclick="closeModal();startSelfSlowQuiz(\''+x.area+'\',\''+encodeURIComponent(x.block)+'\',\''+x.id+'\',\''+encodeURIComponent(x.name)+'\')">Пройти тренировочный тест</button>';
    openModal('<div class="modal-head"><div><div class="kicker">'+(bar?'Бар':'Кухня')+' · '+esc(x.block)+'</div><h2>'+esc(x.name)+'</h2><p>'+esc(description)+'</p></div><button class="closebtn" onclick="closeModal()">×</button></div>'+
      studyInfo+
      (x.photo?'<div class="detail-photo ra-study-photo"><img src="'+esc(x.photo)+'" alt="'+esc(x.name)+'" loading="eager"></div>':'')+
      '<div class="ra-study-label">МАТЕРИАЛ ДЛЯ ИЗУЧЕНИЯ</div><div class="facts ra-study-facts">'+facts.map(([k,v])=>'<div class="fact '+(['Состав','Вкус и ощущения','Как продавать','Скрипт / сервис'].includes(k)?'wide':'')+'"><span>'+esc(k)+'</span><b>'+esc(v)+'</b></div>').join('')+'</div>'+
      '<div class="modal-actions ra-study-actions">'+action+'</div>');
    // Each next dish must open at the beginning of its own card.
    const wrap=document.getElementById('modalWrap');
    const panel=document.getElementById('modal');
    if(wrap)wrap.scrollTop=0;
    if(panel)panel.scrollTop=0;
  };

  // 3) Clear employee inbox wording: study -> attestation.
  assignedTestsHTML=function(e){
    const all=(state.assignedTests||[]).filter(t=>t.employeeId===e.id&&t.status!=='done');
    const attrs=all.filter(t=>t.assignmentType==='attestation');
    const tests=all.filter(t=>t.assignmentType!=='attestation');
    let html='';
    function assignedRow(t,isAttestation){
      const s=studyStatus(t);
      const label=isAttestation?'АТТЕСТАЦИЯ':'ТРЕНИРОВКА';
      const allRead=s.completed;
      const action=isAttestation?'openAssignedAttestation':'openAssignedTest';
      const title=isAttestation?'Начать аттестацию':'Начать тест';
      const studyText=t.itemId?(allRead?'Повторить блюдо':'Изучить «'+esc(t.itemName||t.block)+'»'):(allRead?'Повторить блок':s.done?'Продолжить обучение':'Изучить весь блок');
      const detail=s.total?
        (t.itemId?(allRead?'Блюдо изучено · проверка по одной позиции':'Сначала изучите блюдо · проверка только по нему'):'Изучено '+s.done+' из '+s.total+' позиций · '+(allRead?'можно проходить проверку':'сначала весь блок')):
        'Нет материалов для этого блока';
      const enabled=allRead?'':' disabled aria-disabled="true" title="Сначала изучите все позиции блока"';
      return '<div class="'+(isAttestation?'notification-card attestation-card':'assigned-test')+'">'+
        (isAttestation?'<div class="notification-badge">★</div>':'')+
        '<div><div class="meta"><span>'+(t.area==='kitchen'?'КУХНЯ':'БАР')+'</span><span>·</span><span>'+label+'</span></div>'+
        '<h3>'+esc(t.itemName||t.block)+'</h3><p>'+esc(detail)+'</p></div>'+
        '<div class="ra-assignment-actions"><button class="ghost" onclick="studyAssignmentMaterial(\''+t.id+'\')">'+studyText+'</button>'+
        '<button class="primary"'+enabled+' onclick="'+action+'(\''+t.id+'\')">'+title+'</button></div></div>';
    }
    if(attrs.length){
      html+='<section class="section section-lined attestation-inbox"><div class="section-title"><span>!</span><div><h2>Новая проверка знаний</h2><p>Изучите назначенное блюдо или весь блок — вопросы соответствуют только изученному материалу</p></div></div><div class="assigned-tests">'+attrs.map(t=>assignedRow(t,true)).join('')+'</div></section>';
    }
    if(tests.length){
      html+='<section class="section section-lined"><div class="section-title"><span>Т</span><div><h2>Тренировочные тесты</h2><p>Результат увидит управляющий, рейтинг не изменится</p></div></div><div class="assigned-tests">'+tests.map(t=>assignedRow(t,false)).join('')+'</div></section>';
    }
    return html;
  };

  // Guard official assessment: in the sales demo the buyer must see learning before control.
  const rawOpenAttestation=window.openAssignedAttestation;
  window.openAssignedAttestation=function(id){
    const t=pendingAssignment(id);if(!t)return;
    if(!studyStatus(t).completed){
      t.materialReviewed=false;
      showToast('Сначала изучите все позиции блока — затем начнётся аттестация');
      studyAssignmentMaterial(id);return;
    }
    return rawOpenAttestation(id);
  };
  const rawOpenTest=window.openAssignedTest;
  if(typeof rawOpenTest==='function'){
    window.openAssignedTest=function(id){
      const t=pendingAssignment(id);if(!t)return;
      if(!studyStatus(t).completed){showToast('Сначала изучите все позиции блока');studyAssignmentMaterial(id);return}
      return rawOpenTest(id);
    };
  }

  // 4) Make result numbers self-explanatory.
  const baseManagerHome=managerHome;
  managerHome=function(){
    let html=baseManagerHome();
    html=html.replace(/<p>(\d+)% · рейтинг уже пересчитан: (\d+)%<\/p>/g,'<p>Результат аттестации: <b>$1%</b> · новый общий рейтинг сотрудника: <b>$2%</b></p>');
    html=html.replace(/Тест завершён: (\d+)\/(\d+) · рейтинг не изменён/g,'Тренировочный тест: $1 из $2 правильных · рейтинг не изменился');
    return html;
  };

  // 5) When a rating appears, always give it a visible scale.
  const baseEmployeeCard=employeeCard;
  employeeCard=function(e){
    const html=baseEmployeeCard(e),r=rating(e);
    return html
      .replace('class="employee-compact"', 'class="employee-compact" data-employee-id="'+e.id+'"'+(state.demoHandoff?.stage==='manager-result'&&state.demoHandoff.employeeId===e.id?' data-result-target':''))
      .replace('</div><span class="employee-compact-arrow">',''+scaleHTML(r,'Общий уровень')+'</div><span class="employee-compact-arrow">');
  };

  render();
})();