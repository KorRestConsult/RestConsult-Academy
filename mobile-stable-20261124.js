/* Preserve position during same-screen rendering; reset only for navigation. */
window.raScrollPage=function(options){const root=document.getElementById('root');if(root&&matchMedia('(max-width:767px)').matches){root.scrollTo(options||{top:0});return}window.scrollTo(options||{top:0})};
(function(){
const root=document.getElementById('root');if(!root||typeof render!=='function')return;
let route=state.route;
const previous=render;
render=function(){const same=route===state.route;const top=root.scrollTop;route=state.route;previous();if(matchMedia('(max-width:767px)').matches)root.scrollTop=same?top:0};
})();