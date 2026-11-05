/* Context help owns presentation only. It never calls a model mutation or render. */
(() => {
 'use strict';
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 window.createContextHelp=(root,describe)=>{
  let source=null,info=null,open=false,hoverTimer,leaveTimer,touchTimer,touchGesture=null,suppress=null,suppressTimer;
  const clearSuppression=()=>{clearTimeout(suppressTimer);suppress=null;};
  function finishTouch(cancelled=false){
   clearTimeout(touchTimer);if(!touchGesture)return;
   document.removeEventListener('pointermove',touchGesture.move);document.removeEventListener('pointerup',touchGesture.up);document.removeEventListener('pointercancel',touchGesture.cancel);
   touchGesture=null;
   if(cancelled)clearSuppression();else if(suppress)suppressTimer=setTimeout(clearSuppression,150);
  }
  const trigger=document.createElement('button');trigger.id='context-help-trigger';trigger.className='context-help-trigger';trigger.hidden=true;trigger.type='button';trigger.tabIndex=-1;
  trigger.innerHTML='<svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="8"/><path d="M7.5 7a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4M10 14v.2"/></svg>Пояснить';
  trigger.setAttribute('aria-controls','context-help');trigger.setAttribute('aria-haspopup','dialog');
  const panel=document.createElement('aside');panel.id='context-help';panel.className='context-help';panel.setAttribute('popover','manual');panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','false');panel.setAttribute('aria-labelledby','context-help-title');document.body.append(panel);
  const inside=e=>panel.contains(e)||trigger.contains(e);
  const find=e=>e instanceof Element?e.closest('[data-help-caption],.disabled-help,[data-help-group],button[data-action],[data-help-key]'):null;
  const rect=e=>e.getBoundingClientRect();
  const overlap=(a,b)=>Math.max(0,Math.min(a.x+a.width,b.right)-Math.max(a.x,b.left))*Math.max(0,Math.min(a.y+a.height,b.bottom)-Math.max(a.y,b.top));
  function place(el,isTrigger=false){
   if(!source?.isConnected)return;
   const anchor=source.dataset.helpTarget?root.querySelector(source.dataset.helpTarget):source.matches('[data-help-caption]')?source.parentElement.querySelector('select'):source;
   const a=rect(anchor||source),w=el.offsetWidth,h=el.offsetHeight,g=8;
   const candidates=[{x:a.right-w,y:a.top-h-g},{x:a.left,y:a.top-h-g},{x:a.right+g,y:a.top},{x:a.left-w-g,y:a.top},{x:a.left,y:a.bottom+g},{x:a.right-w,y:a.bottom+g}];
   const controls=[...root.querySelectorAll('button,select')].filter(e=>e!==trigger&&e.getClientRects().length);
   {for(const x of [a.right+g,a.left-w-g,a.right-w,a.left,g,innerWidth-w-g])for(const control of controls){const r=rect(control);candidates.push({x,y:r.bottom+g},{x,y:r.top-h-g});}}
   const fits=candidates.map((p,i)=>{const c={x:Math.max(g,Math.min(innerWidth-w-g,p.x)),y:Math.max(g,Math.min(innerHeight-h-g,p.y)),width:w,height:h};const gap=Math.max(0,c.x-a.right,a.left-c.x-w)+Math.max(0,c.y-a.bottom,a.top-c.y-h);return {...c,anchorOverlap:overlap(c,a),score:controls.reduce((n,e)=>n+overlap(c,rect(e)),0)*1000+overlap(c,a)*100000+gap+Math.abs(c.x-a.left)/100+Math.abs(c.y-a.top)/100+i/100000};}).sort((a,b)=>a.anchorOverlap-b.anchorOverlap||a.score-b.score);
   el.style.left=fits[0].x+'px';el.style.top=fits[0].y+'px';
  }
  function hideTrigger(){clearTimeout(hoverTimer);if(!open&&document.activeElement!==trigger)trigger.hidden=true;}
  function activate(el,immediate=false){
   if(!el||inside(el)||open)return;
   const next=describe(el);if(!next)return;
   clearTimeout(leaveTimer);clearTimeout(hoverTimer);source=el;info=next;
   trigger.setAttribute('aria-label','Пояснить: '+info.title);source.after(trigger);
   const show=()=>{if(!source?.isConnected)return;trigger.hidden=false;place(trigger,true);};
   if(immediate)show();else hoverTimer=setTimeout(show,220);
  }
  function close(returnFocus=false){
   if(open)panel.hidePopover();open=false;trigger.setAttribute('aria-expanded','false');trigger.hidden=true;
   if(!touchGesture)clearSuppression();
   if(returnFocus){const target=source?.isConnected?source:root.querySelector('[data-action="help"]');target?.focus({preventScroll:true});}
  }
  function content(value){
   if(!open||!info||!source?.isConnected)return;
   const choice=info.choices?.find(o=>o[0]===value),copy=info.explain?.(value)??{body:choice?.[2]??info.body,limit:info.extra};
   panel.querySelector('.context-copy').textContent=copy.body;
   const limit=panel.querySelector('.context-limit');limit.textContent=copy.limit??'';limit.hidden=!copy.limit;
   const details=panel.querySelector('.context-details');details.hidden=!copy.details;details.open=false;details.querySelector('p').textContent=copy.details??'';
   const current=panel.querySelector('.context-reading');if(current){current.textContent='Только пояснение · выбор не изменён';current.hidden=value===info.selected;}
   place(panel);
  }
  function show(el=source){
   const next=el&&describe(el);if(!next)return;clearTimeout(hoverTimer);clearTimeout(leaveTimer);source=el;info=next;open=true;trigger.hidden=true;
   const choices=info.choices,selectedName=choices?.find(o=>o[0]===info.selected)?.[1]??'';
   panel.innerHTML=`<header><h2 id="context-help-title">${esc(info.title)}</h2><button type="button" class="plain context-close" aria-label="Закрыть пояснение">Закрыть</button></header>${choices?`<p class="context-selected">В программе: <strong>${esc(selectedName)}</strong></p><label class="context-option-label">Пояснить<select id="context-help-option">${choices.map(o=>`<option value="${esc(o[0])}" ${o[0]===(info.browsed??info.selected)?'selected':''}>${esc(o[1])}</option>`).join('')}</select></label><p class="context-reading" role="status" hidden></p>`:''}<p class="context-copy"></p><p class="context-limit" hidden></p><details class="context-details" hidden><summary>Подробнее о примере</summary><p></p></details>`;
   panel.querySelector('.context-close').onclick=()=>close(true);
   panel.querySelector('#context-help-option')?.addEventListener('change',e=>{if(!open||e.currentTarget!==panel.querySelector('#context-help-option'))return;content(e.target.value);});
   panel.querySelector('.context-details').addEventListener('toggle',()=>{if(open)place(panel);});
   panel.showPopover();content(info.browsed??info.selected);panel.querySelector('#context-help-option,.context-close').focus({preventScroll:true});trigger.setAttribute('aria-expanded','true');
  }
  trigger.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();show();});
  trigger.addEventListener('pointerenter',()=>clearTimeout(leaveTimer));
  trigger.addEventListener('pointerleave',()=>{clearTimeout(leaveTimer);leaveTimer=setTimeout(hideTrigger,220);});
  root.addEventListener('pointerover',e=>{if(e.pointerType==='touch'||inside(e.target))return;activate(find(e.target));});
  root.addEventListener('pointerout',e=>{if(inside(e.relatedTarget)||source?.contains(e.relatedTarget))return;clearTimeout(leaveTimer);leaveTimer=setTimeout(hideTrigger,220);});
  root.addEventListener('focusin',e=>{if(!inside(e.target))activate(find(e.target),true);});
  root.addEventListener('click',e=>{
   if(suppress&&suppress.element.contains(e.target)&&e.pointerType==='touch'&&e.pointerId===suppress.pointerId){e.preventDefault();e.stopImmediatePropagation();clearSuppression();panel.querySelector('.context-close')?.focus({preventScroll:true});return;}
   const caption=e.target.closest('[data-help-caption]'),result=e.target.closest('[data-help-key]');
   if(caption||result&&!e.target.closest('button,select')){e.preventDefault();e.stopPropagation();show(caption||result);}
  },true);
  root.addEventListener('contextmenu',e=>{const el=find(e.target);if(el&&!inside(el)){e.preventDefault();show(el);}});
  root.addEventListener('mousedown',e=>{if(suppress?.element.contains(e.target)&&e.sourceCapabilities?.firesTouchEvents)e.preventDefault();},true);
  root.addEventListener('pointerdown',e=>{
   if(e.pointerType!=='touch'||inside(e.target))return;const el=find(e.target);if(!el)return;
   finishTouch(true);clearSuppression();
   const gesture={pointerId:e.pointerId,x:e.clientX,y:e.clientY,opened:false};touchGesture=gesture;
   gesture.move=ev=>{if(ev.pointerId===gesture.pointerId&&Math.hypot(ev.clientX-gesture.x,ev.clientY-gesture.y)>10)clearTimeout(touchTimer);};
   gesture.up=ev=>{if(ev.pointerId===gesture.pointerId)finishTouch(false);};
   gesture.cancel=ev=>{if(ev.pointerId===gesture.pointerId){finishTouch(true);if(gesture.opened)close(false);}};
   document.addEventListener('pointermove',gesture.move);document.addEventListener('pointerup',gesture.up);document.addEventListener('pointercancel',gesture.cancel);
   touchTimer=setTimeout(()=>{gesture.opened=true;suppress={element:el,pointerId:gesture.pointerId};show(el);},550);
  },true);
  document.addEventListener('pointerdown',e=>{clearSuppression();if(open&&!inside(e.target))close(false);},true);
  document.addEventListener('focusin',e=>{if(open&&!inside(e.target))close(false);});
  document.addEventListener('keydown',e=>{
   if(e.key==='Escape'&&open){e.preventDefault();e.stopPropagation();close(true);return;}
   if(e.key==='F1'||e.key==='?'&&!['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)){
    if(panel.contains(e.target))return;const el=find(e.target)||source||root.querySelector('#tactic');if(el){e.preventDefault();show(el);}
   }
  });
  window.addEventListener('resize',()=>{if(open)place(panel);else if(!trigger.hidden)place(trigger,true);});
  return {
   refresh(){finishTouch(true);clearSuppression();close(false);source=null;info=null;trigger.remove();root.querySelectorAll('[data-help-caption]').forEach(e=>e.tabIndex=-1);root.querySelectorAll('[data-help-group],button[data-action],[data-help-key]').forEach(e=>e.setAttribute('aria-keyshortcuts','F1'));root.querySelectorAll('button:disabled,select:disabled').forEach(button=>{const wrapper=document.createElement('span');wrapper.className='disabled-help';wrapper.tabIndex=0;wrapper.setAttribute('aria-disabled','true');wrapper.setAttribute('aria-label',(button.getAttribute('aria-label')||button.textContent.trim())+(button.dataset.depthLock?' — только просмотр. Правка на '+(button.dataset.depthLock==='swarm'?1:2):' — недоступно')+'. F1: пояснение');wrapper.dataset.focusKey='disabled-'+(button.dataset.focusKey||button.id);if(button.dataset.depthLock)wrapper.title=button.title;button.before(wrapper);wrapper.append(button);});},
   openLast(){show(source?.isConnected?source:root.querySelector('#tactic')||root.querySelector('[data-action="unit"]'));},
   close
  };
 };
})();
