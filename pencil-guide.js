/* Red pencil arrow: a non-interactive annotation, not a substitute for the control. */
(function(){
 const NS='http://www.w3.org/2000/svg';
 let layer,lines=[],head=[],last='',frame=0,source=null,dest=null,token='';
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const visible=e=>e?.isConnected&&e.getBoundingClientRect().width>0&&e.getBoundingClientRect().height>0;
 function create(){
  layer=document.createElementNS(NS,'svg');layer.id='raPencilArrow';layer.setAttribute('aria-hidden','true');
  layer.setAttribute('focusable','false');
  for(let i=0;i<2;i++){const p=document.createElementNS(NS,'path');p.setAttribute('pathLength','1');p.setAttribute('fill','none');p.setAttribute('class','ra-pencil-ink '+(i===0?'ra-pencil-shaft':'ra-pencil-head'));layer.append(p);(i===0?lines:head).push(p)}
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
  const minLength=vw>=768?115:80;
  const insetX=Math.min(54,b.width*.42),insetY=Math.min(54,b.height*.42);
  if(b.top>=a.bottom||b.bottom<=a.top){
   const down=dy>=0;sx=clamp(x,a.left+14,a.right-14);sy=down?a.bottom+3:a.top-3;
   ex=clamp(sx,b.left+Math.min(14,b.width/2),b.right-Math.min(14,b.width/2));ey=down?b.top+insetY:b.bottom-insetY;
  }else if(b.left>=a.right||b.right<=a.left){
   const right=dx>=0;sx=right?a.right+3:a.left-3;sy=clamp(y,a.top+12,a.bottom-12);
   ex=right?b.left+insetX:b.right-insetX;ey=clamp(sy,b.top+Math.min(12,b.height/2),b.bottom-Math.min(12,b.height/2));
  }else {
   // A real action inside the guide: draw from the explanation towards its CTA.
   sx=clamp(x-34,a.left+6,a.right-6);sy=clamp(b.top-24,a.top+6,a.bottom-6);
   ex=clamp(x,b.left+3,b.right-3);ey=b.top+4;
  }
  sx=clamp(sx,5,vw-5);sy=clamp(sy,5,vh-5);ex=clamp(ex,6,vw-6);ey=clamp(ey,6,vh-6);
  let vx=ex-sx,vy=ey-sy,len=Math.hypot(vx,vy);
  if(len<minLength){
   // Short gaps need a diagonal stroke across the empty part of the target, not a tiny hook.
   const vertical=Math.abs(vy)>=Math.abs(vx);
   if(vertical){
    const low=Math.max(10,b.left+12),high=Math.min(vw-10,b.right-12);
    if(high>=low){
     const options=[low,high].sort((u,v)=>Math.abs(v-sx)-Math.abs(u-sx));
     const shift=Math.sqrt(Math.max(0,minLength*minLength-vy*vy));
     ex=clamp(sx+(options[0]>=sx?shift:-shift),low,high)
    }
   }else{
    const low=Math.max(10,b.top+10),high=Math.min(vh-10,b.bottom-10);
    if(high>=low){
     const options=[low,high].sort((u,v)=>Math.abs(v-sy)-Math.abs(u-sy));
     const shift=Math.sqrt(Math.max(0,minLength*minLength-vx*vx));
     ey=clamp(sy+(options[0]>=sy?shift:-shift),low,high)
    }
   }
   vx=ex-sx;vy=ey-sy;len=Math.hypot(vx,vy);
  }
  // Confirm the tip belongs to the actual target, not a neighbouring control.
  const hits=(x,y)=>{const hit=document.elementFromPoint(x,y);return hit&&dest.contains(hit)};
  if(!hits(ex,ey)){
   const points=[[x,y],[x,b.top+b.height*.3],[x,b.top+b.height*.7],[b.left+b.width*.3,y],[b.left+b.width*.7,y]].filter(p=>p[0]>5&&p[0]<vw-5&&p[1]>5&&p[1]<vh-5&&hits(...p));
   if(!points.length){layer.style.visibility='hidden';return}
   [ex,ey]=points[0];vx=ex-sx;vy=ey-sy;len=Math.hypot(vx,vy)
  }
  const ux=vx/Math.max(1,len),uy=vy/Math.max(1,len),nx=-uy,ny=ux;
  const sign=ex>vw*.7?-1:1;
  const bend=Math.min(26,Math.max(8,len*.12))*sign;
  const mid=[clamp(sx+vx*.48+nx*bend*.78,5,vw-5),clamp(sy+vy*.48+ny*bend*.78,5,vh-5)];
  const c1=[clamp(sx+vx*.12-nx*bend*.19,5,vw-5),clamp(sy+vy*.12-ny*bend*.19,5,vh-5)];
  const c2=[clamp(sx+vx*.31+nx*bend*.58,5,vw-5),clamp(sy+vy*.31+ny*bend*.58,5,vh-5)];
  const c3=[clamp(sx+vx*.69+nx*bend,5,vw-5),clamp(sy+vy*.69+ny*bend,5,vh-5)];
  const c4=[clamp(sx+vx*.94+nx*bend*.52,5,vw-5),clamp(sy+vy*.94+ny*bend*.52,5,vh-5)];
  const f=n=>Math.round(n*10)/10;
  const pt=a=>a.map(f).join(' ');
  const d='M '+pt([sx,sy])+' C '+pt(c1)+', '+pt(c2)+', '+pt(mid)+' C '+pt(c3)+', '+pt(c4)+', '+pt([ex,ey]);
  // An asymmetric, lightly hooked finish, like a quick handwritten annotation.
  const angle=Math.atan2(ey-c4[1],ex-c4[0]),h=Math.min(vw>=768?23:19,Math.max(9,len*.24));
  const u=[Math.cos(angle),Math.sin(angle)],n=[-u[1],u[0]];
  const left=[ex-u[0]*h+n[0]*h*.55,ey-u[1]*h+n[1]*h*.55];
  const right=[ex-u[0]*h*.68-n[0]*h*.65,ey-u[1]*h*.68-n[1]*h*.65];
  const arrow='M '+pt(left)+' Q '+pt([ex-u[0]*h*.32+n[0]*h*.15,ey-u[1]*h*.32+n[1]*h*.15])+' '+pt([ex,ey])+' Q '+pt([ex-u[0]*h*.22-n[0]*h*.29,ey-u[1]*h*.22-n[1]*h*.29])+' '+pt(right);
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