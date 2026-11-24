/* Red pencil arrow: a non-interactive annotation, not a substitute for the control. */
(function(){
 const NS='http://www.w3.org/2000/svg';
 let layer,lines=[],head=[],last='',frame=0,source=null,dest=null,token='';
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const visible=e=>e?.isConnected&&e.getBoundingClientRect().width>0&&e.getBoundingClientRect().height>0;
 function create(){
  layer=document.createElementNS(NS,'svg');layer.id='raPencilArrow';layer.setAttribute('aria-hidden','true');
  layer.setAttribute('focusable','false');
  for(let i=0;i<4;i++){const p=document.createElementNS(NS,'path');p.setAttribute('pathLength','1');p.setAttribute('fill','none');p.setAttribute('class',i%2?'ra-pencil-grain':'ra-pencil-ink');p.classList.add(i<2?'ra-pencil-shaft':'ra-pencil-head');layer.append(p);(i<2?lines:head).push(p)}
  document.body.append(layer)
 }
 function hide(){layer?.remove();layer=null;lines=[];head=[];last='';source=dest=null;token=''}
 function draw(){
  frame=0;
  if(!visible(source)||!visible(dest)){if(layer)layer.style.visibility='hidden';return}
  if(!layer)create();
  const a=source.getBoundingClientRect(),b=dest.getBoundingClientRect(),vw=innerWidth,vh=innerHeight;
  const x=clamp(b.left+b.width/2,8,vw-8),y=clamp(b.top+b.height/2,8,vh-8);
  if(b.bottom<8||b.top>vh-8||b.right<8||b.left>vw-8){layer.style.visibility='hidden';return}
  // Choose facing edges, with small inset into the target.
  const ax=a.left+a.width/2,ay=a.top+a.height/2;
  let sx,sy,ex,ey;
  const dx=x-ax,dy=y-ay;
  if(b.top>=a.bottom||b.bottom<=a.top){
   const down=dy>=0;sx=clamp(x,a.left+14,a.right-14);sy=down?a.bottom+3:a.top-3;
   ex=clamp(sx,b.left+Math.min(14,b.width/2),b.right-Math.min(14,b.width/2));ey=down?b.top+5:b.bottom-5;
  }else if(b.left>=a.right||b.right<=a.left){
   const right=dx>=0;sx=right?a.right+3:a.left-3;sy=clamp(y,a.top+12,a.bottom-12);
   ex=right?b.left+5:b.right-5;ey=clamp(sy,b.top+Math.min(12,b.height/2),b.bottom-Math.min(12,b.height/2));
  }else {
   // A real action inside the guide: draw from the explanation towards its CTA.
   sx=clamp(x-34,a.left+6,a.right-6);sy=clamp(b.top-24,a.top+6,a.bottom-6);
   ex=clamp(x,b.left+3,b.right-3);ey=b.top+4;
  }
  sx=clamp(sx,5,vw-5);sy=clamp(sy,5,vh-5);ex=clamp(ex,6,vw-6);ey=clamp(ey,6,vh-6);
  let vx=ex-sx,vy=ey-sy,len=Math.hypot(vx,vy);
  if(len<12){const off=26; sx=clamp(sx-(Math.abs(vx)>Math.abs(vy)?0:off),5,vw-5);sy=clamp(sy-(Math.abs(vx)>Math.abs(vy)?off:0),5,vh-5);vx=ex-sx;vy=ey-sy;len=Math.hypot(vx,vy)}
  const ux=vx/Math.max(1,len),uy=vy/Math.max(1,len),nx=-uy,ny=ux;
  const bend=Math.min(27,Math.max(8,len*.18))*(ex>vw*.7?-1:1);
  const c1=[clamp(sx+vx*.27+nx*bend,5,vw-5),clamp(sy+vy*.27+ny*bend,5,vh-5)];
  const c2=[clamp(sx+vx*.72+nx*bend*.65,5,vw-5),clamp(sy+vy*.72+ny*bend*.65,5,vh-5)];
  const f=n=>Math.round(n*10)/10;
  const d='M '+f(sx)+' '+f(sy)+' C '+c1.map(f).join(' ')+', '+c2.map(f).join(' ')+', '+f(ex)+' '+f(ey);
  const angle=Math.atan2(ey-c2[1],ex-c2[0]),h=Math.min(17,Math.max(10,len*.3)),spread=.53;
  const left=[ex-h*Math.cos(angle-spread),ey-h*Math.sin(angle-spread)],right=[ex-h*Math.cos(angle+spread),ey-h*Math.sin(angle+spread)];
  const arrow='M '+left.map(f).join(' ')+' Q '+f(ex-h*.24*ux+nx*1.2)+' '+f(ey-h*.24*uy+ny*1.2)+' '+f(ex)+' '+f(ey)+' Q '+f(ex-h*.24*ux-nx*1.5)+' '+f(ey-h*.24*uy-ny*1.5)+' '+right.map(f).join(' ');
  layer.setAttribute('viewBox','0 0 '+vw+' '+vh);
  lines.forEach(p=>p.setAttribute('d',d));head.forEach(p=>p.setAttribute('d',arrow));
  layer.style.visibility='visible';
  if(last!==token){
   last=token;layer.classList.remove('ra-pencil-draw');void layer.getBoundingClientRect();layer.classList.add('ra-pencil-draw')
  }
 }
 function point(from,to,key){source=from;dest=to;token=key;draw()}
 function refresh(){if(source&&!frame)frame=requestAnimationFrame(draw)}
 window.RAPencil={point,hide};
 window.addEventListener('resize',refresh);window.addEventListener('scroll',refresh,true);
 window.visualViewport?.addEventListener('resize',refresh);window.visualViewport?.addEventListener('scroll',refresh);
})();