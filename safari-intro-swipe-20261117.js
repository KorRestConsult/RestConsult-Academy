// iOS Safari: restore reliable swipe scrolling for every KORREST AI sales-intro slide.
// The onboarding tour may leave a document-level touchmove guard active while hidden.
// Use a delegated touch handler on the presentation's scroll surface itself.
(function(){
  let previousY=null;
  let activeShell=null;
  function introShell(node){
    const intro=node?.closest?.('#raProductIntro.show');
    return intro?.querySelector('.ra-intro-shell')||null;
  }
  document.addEventListener('touchstart',function(e){
    if(e.touches.length!==1){activeShell=null;previousY=null;return}
    activeShell=introShell(e.target);
    previousY=activeShell?e.touches[0].clientY:null;
  },{capture:true,passive:true});
  document.addEventListener('touchmove',function(e){
    if(!activeShell||previousY===null||e.touches.length!==1)return;
    if(!activeShell.isConnected||!activeShell.closest('#raProductIntro.show')){activeShell=null;return}
    const current=e.touches[0].clientY;
    const movement=previousY-current;
    previousY=current;
    if(Math.abs(movement)<0.3)return;
    const max=activeShell.scrollHeight-activeShell.clientHeight;
    if(max>0){
      const next=Math.max(0,Math.min(max,activeShell.scrollTop+movement));
      activeShell.scrollTop=next;
      if(e.cancelable)e.preventDefault();
    }
  },{capture:true,passive:false});
  document.addEventListener('touchend',function(){activeShell=null;previousY=null},{capture:true,passive:true});
  document.addEventListener('touchcancel',function(){activeShell=null;previousY=null},{capture:true,passive:true});
})();
