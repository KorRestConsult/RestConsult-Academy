// Slow menu + quiz engine adapter for Restaurant Academy.
(function(){
  const D=window.SLOW_ACADEMY_DATA;if(!D)return;
  STOCK.kitchen.splice(0,STOCK.kitchen.length,...D.kitchen.items);
  STOCK.bar.splice(0,STOCK.bar.length,...D.bar.items);

  blocksFor=function(area){return [...new Set((STOCK[area]||[]).map(x=>x.block).filter(Boolean))]};

  function normalizeQ(q){
    const opts=(q.options||[]).map(o=>typeof o==='string'?o:o.text);
    let correct=0;
    if(Array.isArray(q.options)){
      const i=q.options.findIndex(o=>o&&typeof o==='object'&&o.isCorrect); if(i>=0)correct=i;
    }
    if(Number.isInteger(q.correct))correct=q.correct;
    if(q.correctAnswer&&Array.isArray(q.options)){
      const i=q.options.findIndex(o=>o?.letter===q.correctAnswer); if(i>=0)correct=i;
    }
    return {id:q.id||('q'+Math.random()),text:q.question||q.q,options:opts,correct,explanation:q.explanation||q.exp||'',skill:q.skill||''};
  }
  function bank(area){return D[area]||{questions:[],blockQuestions:[]}}
  function questionsFor(area,block,itemId){
    const b=bank(area),all=[...(b.questions||[]),...(b.blockQuestions||[])];
    let rows=all.filter(q=>q.active!==false);
    if(itemId) rows=rows.filter(q=>q.positionId===itemId||q.positionName===itemId);
    else if(block) rows=rows.filter(q=>q.category===block);
    // A named menu block must never receive generic questions from another block.
    // A missing bank is reported by the caller instead of silently mixing topics.
    return rows.map(normalizeQ);
  }
  function sample(arr,n){const a=[...arr];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a.slice(0,Math.min(n,a.length))}

  buildDemoQuestions=function(t){
    let qs=questionsFor(t.area,t.block,t.itemId||null);
    if(!qs.length) return [];
    const guided=t.presentation===true||(t.presentation!==false&&state.demoRunId&&localStorage.getItem('ra-tour:optout')!=='1');
    let chosen;
    if(!t.itemId&&(t.workflowPreparation||t.assignmentType==='attestation')){
      const items=(STOCK[t.area]||[]).filter(x=>x.block===t.block);
      const groups=['composition','taste_words','sales_script','recommendation','service_technique'];
      chosen=items.map((x,i)=>{
        const pool=questionsFor(t.area,t.block,x.id);
        return pool.find(q=>q.skill===groups[(i+(t.workflowPreparation?0:1))%groups.length])||pool[0];
      });
      if(!items.length||chosen.some(q=>!q))return [];
    }else if(guided){
      // Three different practical skills, with reliable order in the presentation.
      const groups=[['composition'],['taste_words'],['recommendation','scenario_choice','sales_script','service_technique']];
      chosen=[];
      for(const group of groups){
        const q=group.map(skill=>qs.find(x=>x.skill===skill&&!chosen.includes(x))).find(Boolean);
        if(q)chosen.push(q);
      }
      const practical=qs.filter(q=>!chosen.includes(q)&&!['price_weight','format_price'].includes(q.skill));
      chosen.push(...practical.slice(0,3-chosen.length));
      if(chosen.length<3)chosen.push(...qs.filter(q=>!chosen.includes(q)).slice(0,3-chosen.length));
    }else{
      const n=t.itemId?Math.min(7,qs.length):Math.min(12,Math.max(5,qs.length));
      chosen=sample(qs,n);
    }
    return chosen.map(q=>({id:q.id,text:q.text,options:q.options,correct:q.options[q.correct],correctIndex:q.correct,explanation:q.explanation}));
  };

  function startSelfSlowQuiz(area,block,itemId,label){
    const qs=buildDemoQuestions({area,block,itemId});
    if(!qs.length){showToast('Для этого раздела пока нет вопросов');return}
    state.slowSelfQuiz={area,block,itemId,label,questions:qs,index:0,answers:[],score:0,answered:false};
    state.route='slow-self-quiz';save();render();(window.raScrollPage||window.scrollTo.bind(window))({top:0});
  }
  window.startSelfSlowQuiz=startSelfSlowQuiz;

  function selfQuizPage(){
    const qz=state.slowSelfQuiz;if(!qz)return staffHome();
    if(qz.index>=qz.questions.length){
      const pct=Math.round(qz.score/qz.questions.length*100);
      return `<section class="quiz-shell"><div class="quiz-card quiz-result"><div class="quiz-kicker">Тренировка завершена</div><div class="result-circle"><strong>${qz.score}/${qz.questions.length}</strong></div><h1>${esc(qz.label)}</h1><p>${pct}% правильных ответов. Тренировка рейтинг не меняет.</p><button class="primary" onclick="state.slowSelfQuiz=null;state.route='home';save();render()">В кабинет</button></div></section>`;
    }
    const q=qz.questions[qz.index],sel=qz.answers[qz.index];
    return `<section class="quiz-shell"><div class="quiz-top"><div><div class="quiz-kicker">Тренировочный тест</div><h2>${esc(qz.label)}</h2></div><button class="ghost" onclick="state.route='home';save();render()">Закрыть</button></div><div class="quiz-progress-label">Вопрос ${qz.index+1} из ${qz.questions.length}</div><div class="quiz-progress"><i style="width:${Math.round(qz.index/qz.questions.length*100)}%"></i></div><div class="quiz-card"><h1>${esc(q.text)}</h1><div class="quiz-options">${q.options.map((o,i)=>`<button class="quiz-option ${sel===i?'selected':''}" onclick="slowSelfAnswer(${i})"><span class="letter">${String.fromCharCode(65+i)}</span><span>${esc(o)}</span></button>`).join('')}</div>${qz.answered?`<div class="slow-feedback"><b>${sel===q.correctIndex?'Верно':'Неверно'}</b><p>${esc(q.explanation||'')}</p></div><button class="primary" onclick="slowSelfNext()">${qz.index+1===qz.questions.length?'Завершить':'Следующий вопрос'}</button>`:''}</div></section>`;
  }
  window.slowSelfAnswer=function(i){const qz=state.slowSelfQuiz;if(!qz||qz.answered)return;const q=qz.questions[qz.index];qz.answers[qz.index]=i;qz.answered=true;if(i===q.correctIndex)qz.score++;save();render()}
  window.slowSelfNext=function(){const qz=state.slowSelfQuiz;if(!qz)return;qz.index++;qz.answered=false;save();render();(window.raScrollPage||window.scrollTo.bind(window))({top:0})}

  const oldRenderStaff=renderStaff;
  renderStaff=function(){if(state.route==='slow-self-quiz')return selfQuizPage();return oldRenderStaff()}

  blockHTML=function(area,block){
    const xs=STOCK[area].filter(x=>x.block===block);
    return `<div class="head"><div><h2>${esc(block)}</h2><p>${xs.length} позиций</p></div><button class="ghost" onclick="startSelfSlowQuiz('${area}','${encodeURIComponent(block)}',null,'${encodeURIComponent(block)}')">Тест по блоку</button></div><div class="menu-grid">${xs.map(menuCard).join('')}</div>`;
  }
  const _start=startSelfSlowQuiz;
  startSelfSlowQuiz=function(area,encBlock,itemId,encLabel){_start(area,decodeURIComponent(encBlock||''),itemId,decodeURIComponent(encLabel||encBlock||''))};
  window.startSelfSlowQuiz=startSelfSlowQuiz;

  openMenu=function(id){
    const x=findMenu(id);if(!x)return;const bar=x.area==='bar';
    openModal(`<div class="modal-head"><div><div class="kicker">${bar?'Бар':'Кухня'} · ${esc(x.block)}</div><h2>${esc(x.name)}</h2><p>${esc(x.desc||'')}</p></div><button class="closebtn" onclick="closeModal()">×</button></div>${x.photo?`<div class="detail-photo"><img src="${esc(x.photo)}"></div>`:''}<div class="facts"><div class="fact"><span>Цена</span><b>${esc(x.price||'—')}</b></div>${x.weight?`<div class="fact"><span>Вес</span><b>${esc(x.weight)}</b></div>`:''}${x.ingredients?`<div class="fact wide"><span>Состав</span><b>${esc(x.ingredients)}</b></div>`:''}${x.taste?`<div class="fact wide"><span>Вкус</span><b>${esc(x.taste)}</b></div>`:''}${x.salesTechnique?`<div class="fact wide"><span>Продажа / сервис</span><b>${esc(x.salesTechnique)}</b></div>`:''}</div><div class="modal-actions"><button class="primary" onclick="closeModal();startSelfSlowQuiz('${x.area}','${encodeURIComponent(x.block)}','${x.id}','${encodeURIComponent(x.name)}')">Тест по позиции</button></div>`)
  }

  // Assigned tests use Slow bank and show explanation after every answer.
  chooseQuizAnswer=function(index){
    const q=state.activeQuiz;if(!q||q.feedbackShown)return;
    q.answers[q.index]=index;q.feedbackShown=true;save();render();
  }
  nextQuizQuestion=function(){
    const q=state.activeQuiz;if(!q||!q.feedbackShown)return;
    const t=state.assignedTests.find(x=>x.id===q.testId);if(!t)return;
    const questions=q.questionSet||(q.questionSet=buildDemoQuestions(t));
    if(q.index<questions.length-1){q.index++;q.feedbackShown=false;save();render();(window.raScrollPage||window.scrollTo.bind(window))({top:0})}else finishTrainingTest();
  }
  trainingTestPage=function(){
    const q=state.activeQuiz,t=q&&state.assignedTests.find(x=>x.id===q.testId);if(!q||!t){state.route='home';save();return staffHome()}
    if(!q.questionSet)q.questionSet=buildDemoQuestions(t);
    const questions=q.questionSet,question=questions[q.index],selected=q.answers[q.index];
    if(!question)return staffHome();
    const correctIndex=question.correctIndex??question.options.indexOf(question.correct);
    return `<section class="quiz-shell"><div class="quiz-top"><div><div class="quiz-kicker">${t.workflowPreparation?'Самостоятельная тренировка':'Тест от управляющего'}</div><h2>${esc(t.itemName||t.block)}</h2></div><button class="ghost" onclick="state.route='home';save();render()">Закрыть</button></div><div class="quiz-progress-label">Вопрос ${q.index+1} из ${questions.length}</div><div class="quiz-progress"><i style="width:${Math.round(q.index/questions.length*100)}%"></i></div><div class="quiz-card"><h1>${esc(question.text)}</h1><div class="quiz-options">${question.options.map((o,i)=>`<button class="quiz-option ${selected===i?'selected':''}" onclick="chooseQuizAnswer(${i})"><span class="letter">${String.fromCharCode(65+i)}</span><span>${esc(o)}</span></button>`).join('')}</div>${q.feedbackShown?`<div class="slow-feedback"><b>${selected===correctIndex?'Верно':'Неверно'}</b><p>${esc(question.explanation||'')}</p></div><button class="primary" onclick="nextQuizQuestion()">${q.index+1===questions.length?'Завершить':'Следующий вопрос'}</button>`:''}</div></section>`
  }
  finishTrainingTest=function(){
    const q=state.activeQuiz;if(!q)return;const t=state.assignedTests.find(x=>x.id===q.testId);if(!t)return;
    const questions=q.questionSet||buildDemoQuestions(t);let correct=0;
    questions.forEach((question,i)=>{const ci=question.correctIndex??question.options.indexOf(question.correct);if(q.answers[i]===ci)correct++});
    t.status='done';t.correct=correct;t.total=questions.length;t.score=Math.round(correct/questions.length*100);t.completedAt=`${today()} ${testTime()}`;t.managerSeen=false;
    state.testResults.push({testId:t.id,runId:state.demoRunId||null,employeeId:t.employeeId,area:t.area,block:t.block,correct,total:t.total,score:t.score,completedAt:t.completedAt,source:'slow'});
    state.route='assigned-test-result';save();render();showToast('Тест завершён. Рейтинг не изменился.');
  }

  render();
})();