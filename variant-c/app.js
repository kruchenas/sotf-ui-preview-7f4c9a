(() => {
 'use strict';
 const clone=value=>structuredClone(value), esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const units={rover:{name:'ROVER-1',role:'Наземный робот'},bot:{name:'BOT-1',role:'Антропоморфный робот'},air:{name:'AIR-1',role:'Воздушный разведчик'}};
 const options={
  who:[['armed','ROVER и BOT','Вооружённые юниты. AIR без оружия не входит в эту группу.'],['rover','ROVER','Только наземный робот ROVER-1.'],['bot','BOT','Только антропоморфный робот BOT-1.'],['air','AIR','Только воздушный разведчик AIR-1; атака ему недоступна.']],
  when:[['always','Всегда','Проверять правило независимо от событий. Исполнение всё равно требует подходящей цели и возможности действия.'],['known','Цель известна','Рой получил сведения о противнике. У юнита это собственное наблюдение или доставленные сведения.'],['unknown','Цель не найдена','Доступных сведений о противнике ещё нет. Это не означает, что противника нет на карте.'],['damaged','Есть повреждённая','Из доступных наблюдений известно о повреждённом противнике; это не чтение скрытого здоровья.'],['loss','Потерян свой юнит','В условной ситуации задана потеря одного из своих юнитов. Это пример реакции, не обязательная лучшая тактика.'],['before','Контакт до фланга','Цель известна, но BOT ещё не достиг заданной точки Б. Достижение точки задаётся ситуацией, путь здесь не рассчитывается.'],['arrived','BOT достиг точки Б','Прибытие BOT в условную Б задаётся вручную выбором ситуации. AIR не рассчитывает Б, движения и пути здесь нет. Атака всё равно требует известной цели.'],['blocked','Путь закрыт','В ситуации задан закрытый путь. Нельзя объявлять движение выполненным.'],['assigned','Получена задача атаки','Доставлено назначение на атаку и известна назначенная цель. Отправка роя сама по себе ещё не получение.'],['available','Цель в зоне атаки','Известная выбранная цель доступна по дальности и линии. Готовность оружия проверяется отдельно.']],
  action:[['attack','Атаковать','Рой назначает известную цель. Юнит сближается и атакует, когда может; попадание и победа не гарантированы.'],['wait','Ждать','Не начинать движение или атаку по этому правилу. Наблюдения и сообщения от этого не пропадают.'],['advance','Вперёд','Продвинуться к заданному рубежу или точке. Направление не берётся из скрытого положения противника.'],['cover','Укрыться','Занять подходящую позицию в районе. В этом UI-примере пригодность укрытия не рассчитывается.'],['retreat','Отступить','Перейти к резервной точке. Причина и адресат берутся из правила. Это не мгновенное спасение юнита.'],['gather','Собраться','Назначить сбор выбранных юнитов у точки. Недоступность пути должна быть видна.'],['recon','Разведать','Пройти маршрут разведки и сообщать фактические наблюдения. Не раскрывает всю карту.'],['patrol','Патруль','Повторно обходить заданный периметр. Здесь это проверка замысла, не новый оператор циклов движка.'],['hold','Удерживать','Оставаться в заданном районе по назначению. Это не гарантия отсутствия потерь.'],['bypass','Обойти','Двигаться к заданной точке выхода на фланг Б. Атака после прибытия задаётся отдельным правилом.']],
  target:[['common','Общая цель','Известная цель, выбранная роем; скрытое положение противника не используется.'],['assigned','Назначенная','Цель уже доставленной задачи юнита. Не новая самостоятельная цель.'],['damaged','Повреждённая','Известный противник с доступной оценкой повреждения. Без такого контакта подходящей цели нет.'],['nearest','Ближайшая','Ближайшая из известных юниту целей, а не из всех противников мира.'],['a','Точка А','Известная точка сбора или рубеж этого условного примера. Не обещает безопасную позицию. В этом макете метка условная: выбрать её на карте или переназначить нельзя. Это ограничение макета, не запрет в игре.'],['b','Точка Б','Заданная точка фланга. Прибытие к ней не гарантирует отвлечение противника или возможность выстрела. В этом макете метка условная: выбрать её на карте или переназначить нельзя. Это ограничение макета, не запрет в игре.'],['route','Маршрут AIR','Выбранные в программе AIR точки. Проверка не симулирует полёт или обнаружение по геометрии.'],['front','Передний район','Условный район разведки перед отрядом. Его содержимое не известно заранее.'],['perimeter','Периметр А','Условный периметр района А для патруля. В этом макете метка условная: выбрать её на карте или переназначить нельзя. Это ограничение макета, не запрет в игре.'],['flank','Фланг Б','Условное направление разведки у точки Б. В этом макете метка условная: выбрать её на карте или переназначить нельзя. Это ограничение макета, не запрет в игре.']],
  fallback:[['keep','Сохранять назначение','Если подходящего нового правила нет, сохранять известную задачу. При отсутствии задачи — ожидать.'],['wait','Ждать','Если ни одно правило не выполнимо, ждать. Не выдумывать выполненное действие.']],
  permission:[['deny','По назначению роя','Самостоятельная смена цели запрещена. Рой может выдавать разные назначения разным юнитам.'],['allow','Разрешить другую цель','Общее разрешение. Юниту также нужны собственное разрешение, известная цель и подходящее правило.']],
  localPermission:[['deny','По назначению роя','Этот юнит сохраняет назначенную цель. Его локальные правила остаются в программе.'],['allow','Разрешить другую цель','Этот юнит может выбрать другую известную цель своим правилом, если рой тоже разрешил и уже доставлено назначение на атаку.']],
  route:[['north-east','Северо-восток','Фиксированная известная точка прежней арены. Она не обозначает известного противника.'],['south','Юг','Другая известная точка маршрута. Обнаружение на пути не гарантировано.'],['west','Запад','Третья известная точка. После последней AIR остаётся наблюдать.']],
  report:[['yes','Сообщать о целях','AIR отправляет обнаруженные сведения рою. Их получение остаётся отдельным событием.'],['no','Не сообщать','Наблюдение остаётся у AIR. Рой не получает новые сведения от него автоматически.']],
  situation:[['delivered','AIR сообщил, сведения получены','AIR обнаружил вооружённую цель, сообщение доставлено рою и назначение может быть получено юнитами. Цель ещё далеко.'],['quiet','Противник ещё не найден','В примере нет доступных сведений о противнике; программа не получает скрытых координат.'],['seen','AIR видит, сообщение ещё в пути','AIR имеет локальное наблюдение. Рой пока не получил сообщение, новые назначения по нему ещё невозможны.'],['damaged','Получены сведения о повреждении','Рою известны общая цель и другой повреждённый противник. Это позволяет проверить распределение и смену цели.'],['blocked','Путь к точке закрыт','Задана известная цель и закрытый путь. Условная проверка должна показать препятствие, а не успешное движение.'],['loss','Потерян свой юнит','Входной пример сообщает о потере одного юнита; проверяются приоритеты реакции на потерю.'],['arrived','BOT дошёл до фланга Б','Вы вручную задаёте прибытие BOT в условную Б. AIR её не рассчитывает; здесь нет выбора точки на карте и расчёта движения. В игре запрет менять точки после старта не принят.'],['close','Цель в зоне атаки','Заданы дальность/линия для атаки и готовое оружие. Результат попадания не рассчитывается.'],['cooldown','Оружие ещё не готово','Цель доступна по дальности/линии, но оружие пока не готово; назначение не означает мгновенный выстрел.']]
 };
 const label=(group,value)=>options[group]?.find(o=>o[0]===value)?.[1]??String(value);
 const rule=(who,when,action,target)=>({who,when,action,target});
 const presets={
  common:{name:'Общая цель',description:'Известную цель получают ROVER и BOT. AIR разведывает и сообщает.',rules:[rule('armed','known','attack','common')]},
  split:{name:'Разделить цели',description:'BOT работает по известной повреждённой цели, ROVER сохраняет общую.',rules:[rule('bot','damaged','attack','damaged'),rule('rover','known','attack','common')]},
  advance:{name:'Наступление',description:'AIR проверяет передний район; вооружённые продвигаются и реагируют на контакт.',rules:[rule('armed','loss','retreat','a'),rule('air','always','recon','front'),rule('armed','known','attack','common'),rule('armed','unknown','advance','a')]},
  hold:{name:'Удержание',description:'ROVER и BOT сохраняют район, AIR патрулирует периметр.',rules:[rule('armed','loss','retreat','a'),rule('air','always','patrol','perimeter'),rule('armed','known','attack','common'),rule('armed','unknown','cover','a')]},
  flank:{name:'Фланговая атака',description:'ROVER действует с фронта; BOT выходит к Б и атакует после прибытия; AIR сообщает.',rules:[rule('armed','loss','gather','a'),rule('air','always','recon','flank'),rule('bot','before','bypass','b'),rule('bot','arrived','attack','common'),rule('rover','known','attack','common'),rule('armed','unknown','advance','a')]}
 };
 const startingUnits=()=>({rover:{rules:[rule('rover','assigned','attack','assigned')],fallback:'keep',permission:'deny'},bot:{rules:[rule('bot','assigned','attack','assigned')],fallback:'keep',permission:'deny'},air:{route:['north-east'],report:'yes'}});
 const initial=()=>({tactic:'common',rules:clone(presets.common.rules),fallback:'keep',permission:'deny',units:startingUnits()});
 let model=initial(),revision=0,dirty=false,history=[],view='swarm',unit='rover',selected={swarm:0,rover:0,bot:0},situation='delivered',pending=null,checked=null,notice='';
 const root=document.getElementById('app');
 const applicable=(r,id)=>r.who===id||(r.who==='armed'&&id!=='air');
 function worldFor(m,caseId){
  const seen=caseId!=='quiet',delivered=seen&&caseId!=='seen'&&m.units.air.report==='yes';
  return {seen,known:delivered,damaged:delivered&&caseId==='damaged',blocked:caseId==='blocked',loss:caseId==='loss',arrived:caseId==='arrived',available:['close','cooldown'].includes(caseId),weaponReady:caseId!=='cooldown'};
 }
 function matches(when,w,task){return when==='always'||when==='known'&&w.known||when==='unknown'&&!w.known||when==='damaged'&&w.damaged||when==='loss'&&w.loss||when==='before'&&w.known&&!w.arrived||when==='arrived'&&w.arrived||when==='blocked'&&w.blocked||when==='assigned'&&task?.action==='attack'&&w.known||when==='available'&&w.known&&w.available;}
 const hasTarget=(target,w)=>['common','assigned','nearest'].includes(target)?w.known:target==='damaged'?w.damaged:true;
 function taskFor(m,w,id){
  const i=m.rules.findIndex(r=>applicable(r,id)&&matches(r.when,w)&&!(r.action==='attack'&&!hasTarget(r.target,w)));
  if(i>=0)return {...m.rules[i],source:`Правило роя ${i+1}`,ruleIndex:i};
  if(id==='air')return {action:'recon',target:'route',source:'Собственная программа AIR',ruleIndex:-1};
  return m.fallback==='keep'&&w.known?{action:'attack',target:'common',source:'Иначе: сохранять назначение',ruleIndex:-1}:{action:'wait',target:'a',source:w.known?'Иначе: ждать':'Нет доставленных сведений о цели',ruleIndex:-1};
 }
 function actionResult(action,target,w,id){
  const place=label('target',target).toLowerCase();
  if(action==='wait')return {text:'Ждать',reason:'Выбрано ожидание; наблюдение и сообщения не отключаются.'};
  if(action==='attack'){
   if(id==='air')return {text:'Атака недоступна',reason:'AIR безоружен. Программа не создаёт оружие.'};
   if(!hasTarget(target,w))return {text:'Ждать',reason:'Подходящая цель неизвестна. Скрытые координаты не используются.'};
   if(w.blocked)return {text:'Путь закрыт',reason:'Сближение невозможно в заданной ситуации. Новый путь здесь не рассчитывается.'};
   if(!w.available)return {text:'Сближаться с целью',reason:'Цель известна, но вне зоны атаки. Назначение не означает выстрел.'};
   return w.weaponReady?{text:'Атаковать известную цель',reason:'Цель доступна и оружие готово. Попадание и исход не рассчитываются.'}:{text:'Ждать готовности оружия',reason:'Цель доступна, но оружие ещё не готово. Назначение сохраняется.'};
  }
  if(w.blocked&&['advance','retreat','gather','bypass','patrol','cover'].includes(action))return {text:'Путь закрыт',reason:`Задача «${label('action',action)}» не считается выполненной; нужно изменить путь или реакцию.`};
  if(action==='bypass')return {text:'Выйти к точке Б',reason:'Движение к заданному флангу. Атака — отдельным правилом после прибытия и при известной цели.'};
  if(action==='recon'||action==='patrol')return {text:`${label('action',action)}: ${place}`,reason:'Это назначение из плана; маршрут, полёт и обнаружение по геометрии не рассчитываются.'};
  return {text:`${label('action',action)}: ${place}`,reason:'Условное следствие правила. Движение/пригодность позиции и бой не рассчитываются.'};
 }
 function localFor(m,w,id,task){
  if(id==='air')return {text:m.units.air.route.length?'Разведывать по маршруту':'Наблюдать с места',reason:m.units.air.report==='yes'?'Сообщать о фактически обнаруженных целях. Доставка — отдельное событие.':'Не сообщать: новые сведения остаются у AIR.',local:'Программа AIR',assignment:task};
  const own=m.units[id];let blocked='';
  for(let i=0;i<own.rules.length;i++){
   const r=own.rules[i];if(!matches(r.when,w,task))continue;
   if(r.action==='wait')return {...actionResult('wait',r.target,w,id),local:`Правило юнита ${i+1}`,assignment:task};
   if(!hasTarget(r.target,w)){blocked='Подходящая цель неизвестна';continue;}
   if(task.action!=='attack'){blocked='Нет полученного назначения на атаку';continue;}
   const other=['damaged','nearest'].includes(r.target)&&r.target!==task.target;
   if(other&&(m.permission!=='allow'||own.permission!=='allow')){blocked=m.permission!=='allow'?'Другую цель запрещает рой; локальное правило сохранено':'Другая цель выключена у юнита';continue;}
   return {...actionResult(r.action,r.target,w,id),local:`Правило юнита ${i+1}`,assignment:task,reason:`${other?'Смена цели разрешена обоими уровнями. ':''}${actionResult(r.action,r.target,w,id).reason}`};
  }
  const result=own.fallback==='keep'?actionResult(task.action,task.target,w,id):actionResult('wait','a',w,id);
  return {...result,local:'Иначе: '+(own.fallback==='keep'?'выполнять назначение':'ждать'),assignment:task,reason:blocked?`${blocked}. ${result.reason}`:result.reason};
 }
 function check(m,caseId){const w=worldFor(m,caseId),rows={};for(const id of Object.keys(units)){const task=taskFor(m,w,id);rows[id]=localFor(m,w,id,task);}return {caseId,world:w,rows,revision};}
 function checkpoint(){history.push(clone({model,dirty}));if(history.length>40)history.shift();}
 function mutate(fn,message='План изменён'){checkpoint();fn();revision++;dirty=true;notice=message;pending=null;render();}
 const currentRules=()=>view==='swarm'?model.rules:unit==='air'?[]:model.units[unit].rules;
 const scope=()=>view==='swarm'?'swarm':unit;
 function setTactic(id){model={...initial(),tactic:id,rules:clone(presets[id].rules)};revision++;dirty=false;selected.swarm=0;notice='Тактика выбрана. Можно изменить правила';pending=null;}
 const destinations=window.SotfDestinations;
 const targetLabel=(value,action)=>{const formatted=destinations.label(value,action);return formatted===String(value)?label('target',value):formatted;};
 const destinationCopy={
  when:{before:['Контакт до выхода','Цель известна, но BOT ещё не достиг фланговой позиции. Прибытие задаётся ситуацией вручную, путь не рассчитывается.'],arrived:['BOT на фланговой позиции','В ситуации вручную отмечено прибытие BOT на фланговую позицию. Отдельная атака требует известной цели и подходящих условий стрельбы.']},
  situation:{arrived:['BOT достиг фланговой позиции','Вы вручную отмечаете прибытие BOT на фланговую позицию. Это не расчёт движения. AIR не рассчитывает позицию BOT.'],blocked:['Путь к месту закрыт','Задана известная цель и закрытый путь. Пример показывает препятствие, а не успешное движение.']},
  action:{advance:['Вперёд',destinations.explain('a','advance').body],retreat:['Отступить',destinations.explain('a','retreat').body],gather:['Собраться',destinations.explain('a','gather').body],hold:['Удерживать',destinations.explain('a','hold').body],bypass:['Обойти',destinations.explain('b','bypass').body],recon:['Разведать','Назначить район наблюдения и сообщать обнаруженные сведения. В этом макете район не перестраивает собственный маршрут AIR; полёт и обнаружение по геометрии не рассчитываются.'],patrol:['Патруль','Задать патрулирование периметра. Полигон и рассчитанный обход в макете отсутствуют; собственный маршрут AIR автоматически не меняется.']},
  route:{'north-east':['Северо-восток','Первая условная точка списка AIR. Название не означает известного противника; полёт и координаты здесь не рассчитываются.'],south:['Юг','Условная точка маршрута AIR. Обнаружение на пути не гарантировано, геометрического полёта в макете нет.'],west:['Запад','Условная точка списка AIR. По замыслу после последней точки коптер наблюдает; реальное движение здесь не рассчитывается.']}
 };
 function displayOptions(group,action){return (options[group]??[]).map(([id,title,description])=>{if(group==='target'){const copy=destinations.explain(id,action);return [id,targetLabel(id,action),copy?.body??description];}const copy=destinationCopy[group]?.[id];return [id,copy?.[0]??title,copy?.[1]??description];});}
 const displayLabel=(group,value)=>displayOptions(group).find(o=>o[0]===value)?.[1]??label(group,value);
 const tacticDescriptions={
  common:'Известную цель получают ROVER и BOT. AIR разведывает по своей программе и сообщает.',
  split:'BOT работает по известной повреждённой цели, ROVER сохраняет общую. Собственный маршрут AIR остаётся отдельной программой.',
  advance:'Вооружённые юниты идут к рубежу продвижения, при потере своего юнита — к точке сбора. Передний район — назначение разведки AIR, а не автоматически построенный маршрут.',
  hold:'AIR назначен периметр патрулирования. В старом правиле «Укрыться» роль места не уточнена; при потере своего юнита задана точка сбора. Геометрия района не рассчитывается.',
  flank:'ROVER действует с фронта; BOT идёт на фланговую позицию, затем отдельным правилом атакует известную цель. AIR назначен район разведки у фланга; его маршрут автоматически не перестраивается.'
 };
 function displayedRule(row,id){const match=/^Правило юнита (\d+)$/.exec(row.local??'');return match?model.units[id]?.rules[Number(match[1])-1]:row.assignment;}
 const displayResult=(row,id)=>destinations.result(row,displayedRule(row,id));
 const assignmentText=task=>task.action==='wait'?label('action',task.action):`${label('action',task.action)} → ${targetLabel(task.target,task.action)}`;

 let editorMode='rule',selectedPoint=0;
 const openMode={swarm:'rule',rover:'rule',bot:'rule',air:'point'};let nextFocus=null;

 let depth=0;
 const depthChoices=[['0','0 · Пресеты','Выбор готового пресета. Обе программы и все пояснения видны; ручная правка роя и юнитов закрыта. Проверка и выбор ситуации доступны.'],['1','1 · Рой','Можно менять правила, порядок, «Иначе» и разрешения роя. Своя программа выбранного юнита, включая AIR, остаётся для просмотра; её правка доступна на 2.'],['2','2 · Рой и юниты','Ручная правка обеих программ: правила и настройки роя, программы ROVER/BOT, маршрут и отправка сообщений AIR. Результат по-прежнему условный.'],['3','3 · Команды — позже','Будущая полноценная программа команд: последовательности, ветвления, проверки и циклы. Этот язык ещё не реализован; позицию выбрать нельзя. Дата, синтаксис и боевое исполнение здесь не обещаются.']];
 const editable=where=>depth>=(where==='swarm'?1:2);
 const lockReason=where=>(where==='swarm'?'Программа роя':'Своя программа '+units[unit].name)+' сейчас только для просмотра. Для ручной правки выберите «'+(where==='swarm'?'1 · Рой':'2 · Рой и юниты')+'» в шапке. Просмотр справки и переход к источнику режим не меняют.';
 function changeDepth(value){if(!Number.isInteger(value)||value<0||value>2)return;depth=value;notice='Глубина настройки: '+depthChoices[value][1]+'. Данные не изменены';nextFocus='[data-focus-key="depth-'+value+'"]';render();}
 function depthMarkup(){return '<div class="depth-control"><h1 id="depth-title">Глубина настройки</h1><div class="depth-options" role="radiogroup" aria-labelledby="depth-title">'+depthChoices.map(([id,title])=>'<button type="button" role="radio" aria-checked="'+(Number(id)===depth)+'" data-action="depth" data-depth="'+id+'" data-focus-key="depth-'+id+'" tabindex="'+(Number(id)===depth?0:-1)+'" title="'+esc(title)+'" '+(id==='3'?'disabled':'')+'>'+title+'</button>').join('')+'</div></div>';}
 function applyDepthAccess(){
  root.querySelectorAll('[data-program]').forEach(program=>{
   const where=program.dataset.program;if(editable(where))return;program.classList.add('is-readonly');
   const controls=program.querySelectorAll('select[data-field],select[data-setting],select[data-point],button[data-action="add-rule"],button[data-action="delete-rule"],button[data-action="move-up"],button[data-action="move-down"],button[data-action="add-point"],button[data-action="delete-point"],button[data-action="restore-unit"]');
   controls.forEach(e=>{e.disabled=true;e.dataset.depthLock=where;e.title=(e.getAttribute('aria-label')||'Правка')+'. '+lockReason(where);});
   const caption=program.querySelector('.inline-editor .field-caption');if(caption){const hint=document.createElement('span');hint.className='readonly-label';hint.textContent=' · правка на '+(where==='swarm'?1:2);caption.append(hint);}
  });
 }
 const keyFor=where=>where==='swarm'?'swarm':unit;
 const programRules=where=>where==='swarm'?model.rules:unit==='air'?[]:model.units[unit].rules;
 const ownerName=where=>where==='swarm'?'Рой':units[unit].name;
 function optionsHTML(group,value,subset,action){return displayOptions(group,action).filter(o=>!subset||subset.includes(o[0])).map(o=>`<option value="${o[0]}" ${o[0]===value?'selected':''}>${esc(o[1])}</option>`).join('');}
 function selectHTML(group,value,attrs='',subset,action){return `<select data-help-group="${group}" ${action?`data-help-action="${action}"`:''} ${attrs}>${optionsHTML(group,value,subset,action)}</select>`;}
 function field(group,title,value,attrs='',subset,action){return `<div class="field"><button type="button" class="field-caption" data-help-caption>${title}</button>${selectHTML(group,value,attrs+` aria-label="${esc(title)}"`,subset,action)}</div>`;}
 function sentence(r,where=view){return `${displayLabel('when',r.when)} · ${where==='swarm'?label('who',r.who)+' — ':''}${label('action',r.action)} → ${targetLabel(r.target,r.action)}`;}
 function presetMarkup(){return `<aside class="presets" aria-label="Пресеты тактики"><h2>Пресеты тактики</h2><p class="preset-intro">Выберите замысел<br>и доработайте его</p><div class="preset-list">${Object.entries(presets).map(([id,p])=>`<button data-action="preset" data-preset="${id}" aria-pressed="${model.tactic===id}" ${pending===id?'data-pending="true"':''}>${esc(p.name)}</button>`).join('')}</div>${pending?`<section class="preset-guard" aria-label="Подтверждение замены"><p>Заменить рой и юнитов?</p><strong>${esc(presets[pending].name)}</strong><button data-action="confirm-tactic">Заменить правки</button><button data-action="cancel-tactic" class="plain">Оставить правки</button></section>`:`<p class="preset-state">${dirty?'Есть ваши правки':'Основа выбрана'}</p>`}<div class="preset-bottom"><button data-action="undo" ${!history.length?'disabled':''}>Отменить правку</button><button data-action="restore-preset" class="plain">Вернуть пресет</button></div></aside>`;}
 function settingsSummary(where){const own=where==='swarm'?model:model.units[unit];if(where==='units'&&unit==='air')return `При контакте: ${label('report',own.report)}`;return `Иначе: ${label('fallback',own.fallback)}<br>Другая цель: ${own.permission==='allow'?'разрешена':'по назначению роя'}`;}

 function control(action,where,i,text,name,disabled=false){return '<button data-action="'+action+'" data-scope="'+where+'" data-index="'+i+'" data-focus-key="'+where+'-'+action+'-'+i+'" aria-label="'+esc(name)+'" title="'+esc(name)+'" '+(disabled?'disabled':'')+'>'+text+'</button>';}
 function inlineMarkup(where,i,point=false){
  const list=programRules(where),r=list[i],attrs='data-scope="'+where+'" data-index="'+i+'"',mode=openMode[keyFor(where)];
  if(point)return '<div class="inline-editor" aria-label="AIR-1 · точка '+(i+1)+'">'+field('route','Точка маршрута',model.units.air.route[i],'data-point="'+i+'" data-focus-key="units-point-'+i+'"')+'<p class="inline-note">Точки идут по порядку. Район разведки не перестраивает маршрут.</p></div>';
  if(mode==='settings'){
   const own=where==='swarm'?model:model.units[unit];
   return '<div class="inline-editor settings-fields" aria-label="'+ownerName(where)+' · настройки">'+(where==='units'&&unit==='air'?field('report','При обнаружении цели',own.report,'data-setting="report" data-scope="units" data-focus-key="units-report"')+'<p class="inline-note">AIR без оружия. Доставка сообщения — отдельное событие.</p>':field('fallback','Иначе',own.fallback,'data-setting="fallback" data-scope="'+where+'" data-focus-key="'+where+'-fallback"')+field(where==='swarm'?'permission':'localPermission',where==='swarm'?'Смена цели юнитами':'Самостоятельная смена',own.permission,'data-setting="permission" data-scope="'+where+'" data-focus-key="'+where+'-permission"')+'<p class="inline-note">Для другой цели нужны разрешения обоих уровней и известная цель.</p>')+'</div>';
  }
  if(!r)return '';
  const f=(group,title,subset,action)=>field(group,title,r[group],attrs+' data-field="'+group+'" data-focus-key="'+where+'-'+group+'-'+i+'"',subset,action);
  return '<div class="inline-editor" aria-label="'+ownerName(where)+' · правило '+(i+1)+'"><div class="inline-fields '+(where==='units'?'unit-fields':'')+'">'+(where==='swarm'?f('who','Кому'):'')+f('when','Когда',where==='swarm'?['always','known','unknown','damaged','loss','before','arrived','blocked']:['always','known','damaged','assigned','available'])+f('action','Действие',where==='units'?['attack','wait']:undefined)+f('target','Цель / точка',where==='units'?['assigned','common','damaged','nearest']:undefined,r.action)+'</div><div class="rule-tools">'+control('move-up',where,i,'Выше','Переместить правило '+ownerName(where)+' '+(i+1)+' выше',i===0)+control('move-down',where,i,'Ниже','Переместить правило '+ownerName(where)+' '+(i+1)+' ниже',i===list.length-1)+'</div></div>';
 }
 function programMarkup(where){
  const isUnit=where==='units',air=isUnit&&unit==='air',list=programRules(where),count=air?model.units.air.route.length:list.length,k=keyFor(where),mode=openMode[k],chosen=air?selectedPoint:selected[k];
  const title=isUnit?'<h2><button type="button" class="program-caption" data-help-caption data-help-target="#unit-choice">Своя программа</button></h2><select id="unit-choice" data-help-group="unit" aria-label="Выбрать юнит">'+Object.entries(units).map(([id,u])=>'<option value="'+id+'" '+(unit===id?'selected':'')+'>'+u.name+'</option>').join('')+'</select>':'<h2>Программа роя</h2>';
  const rows=(air?model.units.air.route:list).map((r,i)=>{
   const active=chosen===i&&mode===(air?'point':'rule'),name=air?'Точка маршрута AIR-1 '+(i+1):ownerName(where)+' · правило '+(i+1);
   return '<div class="rule-entry '+(active?'is-selected':'')+'"><div class="row-controls">'+control(air?'select-point':'select-rule',where,i,'<span class="rule-number">'+(i+1)+'</span><span>'+(air?'<span>Точка маршрута</span><strong>'+esc(label('route',r))+'</strong>':'<span>'+(where==='swarm'?esc(label('who',r.who))+' · ':'')+esc(displayLabel('when',r.when))+'</span><strong>'+esc(label('action',r.action))+' → '+esc(targetLabel(r.target,r.action))+'</strong>')+'</span>',name)+'<span class="row-remove">'+control(air?'delete-point':'delete-rule',where,i,'−',air?'Удалить точку маршрута AIR-1 '+(i+1):'Удалить правило '+ownerName(where)+' '+(i+1))+'</span></div>'+(active?inlineMarkup(where,i,air):'')+'</div>';
  }).join('');
  return '<section class="program '+where+'" data-program="'+where+'" aria-label="'+(isUnit?'Собственная программа выбранного юнита':'Программа роя')+'"><header class="program-head">'+title+'<span class="count">'+count+'/'+(air?3:6)+'</span>'+control(air?'add-point':'add-rule',where,-1,'+',air?'Добавить точку маршрута AIR-1':'Добавить правило '+(isUnit?units[unit].name:'роя'),count>=(air?3:6))+'</header><div class="program-list">'+(rows||'<p class="empty">'+(air?'Маршрут пуст: наблюдать с места.':'Правил нет. Действует «Иначе».')+'</p>')+(air?'<p class="air-note" data-help-key="air-note" tabindex="0">Условный маршрут AIR. Полёт здесь не рассчитывается.</p>':'')+'</div><div class="program-bottom"><button class="program-settings '+(mode==='settings'?'is-selected':'')+'" data-action="edit-settings" data-scope="'+where+'" data-focus-key="'+where+'-settings">'+settingsSummary(where)+'</button>'+(mode==='settings'?inlineMarkup(where,-1):'')+(isUnit?'<button class="restore-unit plain" data-action="restore-unit" data-focus-key="restore-unit">Вернуть юнит</button>':'')+'</div></section>';
 }
 function shortResult(row,id){const full=displayResult(row,id);if(full.length<=32)return full;const r=displayedRule(row,id);return r?.action?label('action',r.action)+' по назначению':full;}
 function shortReason(row){if(row.reason.startsWith('Другую цель запрещает рой'))return 'Рой запрещает смену';if(row.reason.startsWith('Другая цель выключена'))return 'Смена цели выключена';if(row.reason.startsWith('Нет полученного назначения'))return 'Нет назначения';if(row.reason.startsWith('Подходящая цель неизвестна'))return 'Цель неизвестна';if(row.text==='Выйти к точке Б')return 'До фланговой позиции';if(row.text==='Путь закрыт')return 'Путь закрыт';if(row.text==='Сближаться с целью')return 'Вне зоны атаки';if(row.text.includes('готовности'))return 'Оружие не готово';if(row.text==='Ждать')return 'Выбрано ожидание';if(row.text==='Атака недоступна')return 'Нет оружия';if(row.text==='Атаковать известную цель')return 'Цель доступна';return 'Условное правило';}
 function sourceButtons(id,row){const a=row.assignment,common=a.source==='Собственная программа AIR'?`<button data-action="jump-local" data-unit="air">Своя программа</button>`:`<button data-action="jump-swarm" data-index="${a.ruleIndex}">Рой${a.ruleIndex>=0?' '+(a.ruleIndex+1):': иначе'}</button>`;if(id==='air')return common+`<span class="brief-reason">${model.units.air.report==='yes'?'Сообщения вкл.':'Не сообщает'}</span>`;const m=/^Правило юнита (\d+)$/.exec(row.local??'');return common+`<span aria-hidden="true">→</span><button data-action="jump-local" data-unit="${id}" data-index="${m?Number(m[1])-1:-1}">Своя${m?' '+m[1]:': иначе'}</button><span class="brief-reason">${esc(shortReason(row))}</span>`;}
 function resultMarkup(){const stale=!checked||checked.revision!==revision;return `<section class="checker" aria-label="Общая проверка программ"><header><h2>Проверка</h2><button class="primary" data-action="check">Проверить</button></header><div class="situation-field"><button class="field-caption" data-help-caption>Ситуация</button>${selectHTML('situation',situation,'id="situation" aria-label="Ситуация проверки"')}</div>${stale?`<p class="stale" data-help-key="stale" tabindex="0">${checked?'Программа изменена. Проверьте новую версию.':'Ситуация выбрана. Нажмите «Проверить».'}</p><p class="check-hint">Рой назначает задачу.<br>Своя программа решает, как действовать.</p>`:`<p class="trace" data-help-key="trace" tabindex="0">${!checked.world.seen?'Контакт ещё не обнаружен':model.units.air.report==='no'?'AIR наблюдает, но не сообщает':!checked.world.known?'Сообщение AIR ещё в пути':'Сведения AIR доставлены рою'}</p><div class="results">${Object.entries(checked.rows).map(([id,row])=>`<article class="result-row" data-help-key="result-${id}" tabindex="0"><div class="result-main"><strong>${units[id].name}</strong><span>${esc(shortResult(row,id))}</span></div><div class="result-source">${sourceButtons(id,row)}</div></article>`).join('')}</div>`}</section>`;}
 function describeHelp(element){
  let el=element;if(el.matches('.disabled-help'))el=el.querySelector('button,select');if(el?.dataset.helpTarget)return describeLegacyHelp(root.querySelector(el.dataset.helpTarget));if(!el)return null;
  if(el.matches('[data-help-caption]'))el=el.parentElement.querySelector('select')||el;
  const a=el.dataset.action,i=Number(el.dataset.index??-1),where=el.dataset.scope??view;

  if(a==='depth')return {title:'Глубина настройки',choices:depthChoices,selected:String(depth),browsed:el.dataset.depth,extra:'Режим доступа к редактору, не сложность боя. Переключение не меняет программы, историю или результат проверки.'};
  if(el.dataset.depthLock){const reason=lockReason(el.dataset.depthLock);if(el.matches('select')){const d=describeLegacyHelp(el),explain=d.explain;return {...d,explain(value){const copy=explain?.(value)??{body:d.choices?.find(o=>o[0]===value)?.[2]??d.body};return {...copy,limit:[reason,copy.limit].filter(Boolean).join(' ')};}};}return {title:el.getAttribute('aria-label')||'Правка недоступна',body:reason+' Это действие меняет программу, поэтому здесь недоступно. Общие «Отменить правку» и «Вернуть пресет» — отдельные явные действия восстановления.'};}
  if(a==='undo'){const d=describeLegacyHelp(el);return {...d,body:d.body+' Общая отмена явно восстанавливает предыдущие данные роя или юнитов, включая закрытые сейчас для ручной правки. Текущий режим не повышается.'};}
  const resultId=el.dataset.helpKey?.startsWith('result-')?el.dataset.helpKey.slice(7):null;
  if(resultId&&depth===1&&resultId!=='air'){const d=describeLegacyHelp(el);return {...d,extra:(d.extra??'')+' Своя программа '+units[resultId].name+' и её разрешение сейчас только для просмотра. Если причина указывает на локальное правило или запрет смены цели, его правка доступна на «2 · Рой и юниты». Справка не меняет разрешение или режим.'};}
  if(a==='jump-local'&&depth<2)return {title:'Открыть свою программу '+units[el.dataset.unit].name,body:'Переходит к реальной строке или настройке своей программы в режиме просмотра. Правка юнита доступна на «2 · Рой и юниты»; этот переход не повышает режим и не включает разрешение.'};
  if(a==='delete-rule'||a==='delete-point')return {title:el.getAttribute('aria-label'),body:'Удаляет именно эту строку. Выбор другой строки и соседняя программа сохраняются. Изменение возвращается кнопкой «Отменить правку». При пустом списке действует «Иначе», AIR наблюдает с места.'};
  if(a==='add-rule'||a==='add-point'){const d=describeLegacyHelp(el);return {...d,title:el.getAttribute('aria-label')};}
  if(a==='preset')return {title:'Пресеты тактики',selected:model.tactic,browsed:el.dataset.preset,choices:helpOptions('tactic'),extra:'Применение другого пресета заменяет программы роя и всех юнитов. Ручные изменения защищены подтверждением.'};
  if(a==='select-rule'){const r=programRules(where)[i];return {title:ownerName(where)+' · правило '+(i+1),body:sentence(r,where)+'. Открывает поля этой строки внутри этой программы. Первое подходящее правило определяет задачу или собственное действие.'};}
  if(a==='select-point')return {title:'Точка маршрута AIR '+(i+1),body:label('route',model.units.air.route[i])+'. Нажатие открывает её поле внутри программы AIR. Маршрут AIR и назначенный район разведки — разные вещи; физический полёт здесь не рассчитывается.'};
  if(a==='edit-settings')return {title:ownerName(where)+' · настройки',body:where==='units'&&unit==='air'?'Открывает отправку сообщений AIR. Наблюдение и доставка не происходят автоматически от выбора района.':'Открывает «Иначе» и разрешение смены цели этого уровня. Сводка здесь показывает сохранённые настройки. Одного разрешения недостаточно: нужны оба уровня.'};
  if(a==='restore-preset')return {title:'Вернуть пресет',body:'Возвращает выбранный пресет: программу роя и исходные программы всех юнитов. Если есть ручные изменения, сначала появится подтверждение. Отменить замену можно общей отменой правки.'};
  if(a==='restore-unit')return {title:'Вернуть '+units[unit].name,body:'Возвращает только исходную собственную программу выбранного юнита. Рой и остальные юниты сохраняются. Это изменение можно отменить.'};
  if(a==='jump-swarm')return {title:i>=0?'Перейти к правилу роя '+(i+1):'Перейти к настройке «Иначе» роя',body:'Показывает источник назначения внутри программы роя. Программа не изменяется. Полная причина результата доступна нажатием строки результата или F1.'};
  if(a==='jump-local')return {title:'Открыть свою программу '+units[el.dataset.unit].name,body:'Выбирает этот юнит и показывает локальное правило или настройку «Иначе», из которой получено действие. Переход сам не меняет программу.'};
  if(a==='help')return {title:'Пояснения по месту',body:'Нажмите подчёркнутое название поля. У действия наведите курсор и выберите «Пояснить», либо используйте F1, правую кнопку мыши или удержание. В помощи можно читать варианты без их выбора в программе. Строка результата объясняет причину; ссылки «Рой» и «Своя» ведут к исходному правилу. Esc или нажатие вне закрывает пояснение.'};
  return describeLegacyHelp(element);
 }

 const helpTitles={tactic:'Пресеты тактики',unit:'Юнит',who:'Кому',when:'Когда',action:'Действие',target:'Цель / точка',fallback:'Иначе',permission:'Смена цели юнитами',localPermission:'Самостоятельная смена',route:'Точка маршрута AIR',report:'При обнаружении цели',situation:'Ситуация проверки'};
 function helpOptions(group,action){
  if(group==='tactic')return Object.entries(presets).map(([id,p])=>[id,p.name,tacticDescriptions[id]+' Это редактируемая основа, не бонус к характеристикам или гарантия победы.']);
  if(group==='unit')return Object.entries(units).map(([id,u])=>[id,u.name,u.role+(id==='air'?'. Разведывает и сообщает, без оружия. Не рассчитывает фланговую позицию BOT.':'. Исполняет доставленное назначение своей программой. Правка юнита не меняет программу роя.')]);
  return displayOptions(group,action);
 }
 function describeLegacyHelp(element){
  let el=element;
  if(el.matches('[data-help-caption]'))el=el.parentElement.querySelector('select');
  if(el?.matches('.disabled-help'))el=el.querySelector('button');
  if(!el)return null;
  const group=el.dataset.helpGroup;
  if(group){
   const available=[...el.options].map(o=>o.value),choices=helpOptions(group,el.dataset.helpAction).filter(o=>available.includes(o[0]));
   return {title:helpTitles[group],choices,selected:el.value,explain(value){
    if(group==='target')return destinations.explain(value,el.dataset.helpAction)??{body:choices.find(o=>o[0]===value)?.[2]??''};
    if(group==='route')return {body:choices.find(o=>o[0]===value)?.[2]??'',limit:destinations.air.route.limit};
    return {body:choices.find(o=>o[0]===value)?.[2]??''};
   }};
  }
  const action=el.dataset.action,i=Number(el.dataset.index),disabled=el.disabled;
  if(action==='unit')return {title:units[el.dataset.unit].name,body:helpOptions('unit').find(o=>o[0]===el.dataset.unit)[2]+' Обычное нажатие открывает собственную программу юнита.'};
  if(action==='view')return {title:el.dataset.view==='swarm'?'Рой':'Юниты',body:el.dataset.view==='swarm'?'Программа роя назначает задачи по первому подходящему правилу для каждого юнита. Переход сохраняет ваши правки.':'У каждого юнита собственная программа: она решает, как выполнить полученное назначение. Переход не меняет программу роя.'};
  if(action==='select-rule')return {title:'Правило '+(i+1),body:sentence(currentRules()[i])+'. Нажатие открывает поля этой строки, не меняя правило. Порядок важен: используется первое подходящее правило.'};
  const actions={
   'add-rule':['Добавить правило',disabled?'Достигнут лимит — 6 правил. Удалите ненужное правило, чтобы добавить новое. Справка не снимает лимит.':'Добавляет редактируемую строку в конец программы. Затем задайте условие, действие и цель. Изменение можно отменить.'],
   'delete-rule':['Удалить правило','Удаляет только эту строку; следующие правила сдвинутся вверх. Можно вернуть её кнопкой «Отменить правку».'],
   'move-up':['Выше',disabled?'Это первое правило, выше него строк нет. Действие недоступно.':'Перемещает правило на одну строку выше. Оно будет проверяться раньше; первое совпадение определяет назначение или локальное действие.'],
   'move-down':['Ниже',disabled?'Это последнее правило, ниже него строк нет. Действие недоступно.':'Перемещает правило на одну строку ниже. Более раннее подходящее правило может сработать вместо него.'],
   'add-point':['Добавить точку AIR',disabled?'В маршруте уже 3 точки — предел этого макета. Справка не добавляет четвёртую.':'Добавляет следующую условную точку маршрута AIR. Её можно изменить в списке; это не фланговая позиция BOT и не выбор места на карте.'],
   'delete-point':['Удалить точку AIR','Удаляет эту точку маршрута. Остальные сохраняют порядок; при пустом маршруте AIR наблюдает с места. Изменение можно отменить.'],
   'undo':['Отменить правку',disabled?'История правок пуста — отменять нечего. Просмотр помощи не создаёт запись истории.':'Возвращает предыдущее изменение программы из локальной истории. Это не отмена результата реального боя и не загрузка сохранённой версии.'],
   'restore':['Вернуть основу',view==='units'?'Возвращает только исходную собственную программу выбранного юнита. Программа роя и другие юниты сохраняются; действие можно отменить.':'Возвращает выбранную готовую тактику и исходные программы юнитов. Если есть ваши правки, сначала нужно подтвердить замену.'],
   'confirm-tactic':['Заменить правки','Применяет выбранную основу вместо текущих программ роя и юнитов. Ручные изменения заменятся; затем доступна отмена. Сам просмотр этого пояснения ничего не применяет.'],
   'cancel-tactic':['Оставить правки','Закрывает предложение замены. Выбранная ранее тактика и ваши текущие программы сохраняются.'],
   'check':['Проверить','Показывает условный результат текущей программы на выбранной ситуации: доступные сведения → назначение роя → собственное решение юнита → причина. Это не запуск боя, не расчёт пути и не проверка победы.'],
   'help':['Как получить пояснение','Нажмите подчёркнутое название поля. У кнопки наведите курсор и нажмите «Пояснить»; с клавиатуры — F1 у текущего элемента. Также работают правая кнопка мыши и удержание на сенсорном экране. В пояснении можно читать другие варианты без выбора в программе. Закрыть: Esc, «Закрыть» или нажатие вне.']
  };
  if(actions[action])return {title:actions[action][0],body:actions[action][1]};
  const key=el.dataset.helpKey;
  if(key?.startsWith('result-')){
   const id=key.slice(7),row=checked?.rows[id];if(!row)return {title:'Результат',body:'Сначала проверьте текущую программу.'};
   const sourceText=id==='air'&&row.assignment.source==='Собственная программа AIR'?'Собственная программа AIR':`Назначение роя: ${assignmentText(row.assignment)}. Источник: ${row.assignment.source}`;
   return {title:units[id].name+' · '+displayResult(row,id),body:sourceText+'. '+(id==='air'?'':`Локальное решение: ${row.local}. `)+row.reason,extra:checked.revision!==revision?'Это результат предыдущей версии. Сначала проверьте изменённую программу.':'Результат условный: реальный бой, путь и попадание не рассчитываются.'};
  }
  if(key==='reason')return {title:'Почему такой результат',body:checked?.revision===revision?checked.rows[view==='swarm'?'rover':unit].reason:'Программа изменена или ситуация ещё не проверена. Нажмите «Проверить», чтобы получить причину для текущей версии.',extra:view==='swarm'?'Краткая причина на экране относится к ROVER-1. Пояснение строки каждого юнита содержит его собственную причину.':null};
  if(key==='trace')return {title:'Откуда сведения',body:!checked?'Сначала выберите ситуацию и проверьте программу.':!checked.world.seen?'В выбранном примере нет наблюдений о противнике. Скрытые координаты недоступны.':!checked.world.known?'У AIR есть наблюдение, но рой не получил новые сведения: сообщение не доставлено либо отправка отключена.':'AIR сообщил о цели, сообщение в примере доставлено рою. Только после доставки эти сведения участвуют в назначениях.'};
  if(key==='permission-result')return {title:'Почему другая цель разрешена или запрещена',body:'Для самостоятельной смены цели нужны оба разрешения: общее у роя и своё у юнита. Также нужны известная цель, подходящее локальное правило и полученное назначение на атаку. Одного разрешения недостаточно.'};
  if(key==='stale')return {title:'Результат требует проверки',body:'Правка программы не пересчитывает результат автоматически. Нажмите «Проверить»: прежний вывод не выдаётся за результат новой версии. Справка сама проверку не запускает.'};
  if(key==='air-note')return {title:'Маршрут и сообщения AIR',body:'Точки проходятся в заданном порядке; после последней AIR наблюдает. Отправка сведений и доставка — разные события. Здесь нет симуляции полёта. Район роя не перестраивает маршрут AIR и не определяет фланговую позицию BOT.'};
  return null;
 }

 const contextHelp=window.createContextHelp(root,describeHelp);

 function selectContext(where,mode='rule',index){view=where;editorMode=mode;openMode[keyFor(where)]=mode;if(index!==undefined&&index>=0){if(mode==='point')selectedPoint=index;else selected[keyFor(where)]=index;}}
 function render(){
  const focus=document.activeElement,focusKey=focus?.dataset.focusKey,focusId=focus?.id;
  for(const id of ['swarm','rover','bot']){const n=(id==='swarm'?model.rules:model.units[id].rules).length;selected[id]=Math.min(selected[id]??0,Math.max(0,n-1));if(!n)openMode[id]='settings';}
  selectedPoint=Math.min(selectedPoint,Math.max(0,model.units.air.route.length-1));if(!model.units.air.route.length)openMode.air='settings';
  root.innerHTML='<main class="app"><header class="topbar"><span class="brand">SOTF</span>'+depthMarkup()+'<button data-action="help" data-focus-key="help" aria-controls="context-help">Справка</button></header><div class="workspace">'+presetMarkup()+programMarkup('swarm')+programMarkup('units')+resultMarkup()+'</div><footer class="screen-foot"><span>Условная проверка · без расчёта боя</span><span role="status">'+esc(notice||'Выберите строку для правки внутри программы')+'</span></footer></main>';
  applyDepthAccess();
  root.querySelectorAll('[data-action=select-rule],[data-action=select-point]').forEach(e=>e.setAttribute('aria-expanded',String(e.closest('.rule-entry').classList.contains('is-selected'))));
  root.querySelectorAll('[data-action=edit-settings]').forEach(e=>e.setAttribute('aria-expanded',String(e.classList.contains('is-selected'))));
  root.querySelectorAll('button,select').forEach((e,n)=>{if(!e.dataset.focusKey&&!e.id)e.dataset.focusKey=e.dataset.helpCaption!==undefined?'caption-'+(e.parentElement.querySelector('select')?.dataset.focusKey??n):[e.dataset.action??e.dataset.helpGroup??'control',e.dataset.preset??'',e.dataset.scope??'',e.dataset.index??'',n].join('-');});
  contextHelp.refresh();
  const selector=nextFocus||(focusKey?'[data-focus-key="'+CSS.escape(focusKey)+'"]':focusId?'#'+CSS.escape(focusId):null);nextFocus=null;if(selector){const target=root.querySelector(selector);(target?.disabled?target.closest('.disabled-help'):target)?.focus({preventScroll:true});}
 }
 const focusRow=(where,i,point=false)=>{nextFocus='[data-focus-key="'+where+'-'+(i<0?(point?'add-point':'add-rule')+'--1':(point?'select-point':'select-rule')+'-'+i)+'"]';};
 root.addEventListener('change',e=>{
  const t=e.target;
  if(t.dataset.field||t.dataset.setting||t.dataset.point!==undefined){const where=t.dataset.point!==undefined?'units':t.dataset.scope;if(!editable(where)){notice='Ручная правка доступна на '+(where==='swarm'?'1 · Рой':'2 · Рой и юниты');render();return;}}
  if(t.id==='unit-choice'){unit=t.value;view='units';editorMode=openMode[unit];notice='Выбрана собственная программа '+units[unit].name;render();return;}
  if(t.id==='situation'){situation=t.value;checked=null;notice='Ситуация выбрана. Нажмите «Проверить»';render();return;}
  if(t.dataset.field){const i=Number(t.dataset.index),where=t.dataset.scope;mutate(()=>programRules(where)[i][t.dataset.field]=t.value);return;}
  if(t.dataset.point!==undefined){mutate(()=>model.units.air.route[Number(t.dataset.point)]=t.value,'Маршрут AIR изменён');return;}
  if(t.dataset.setting)mutate(()=>{const own=t.dataset.scope==='swarm'?model:model.units[unit];own[t.dataset.setting]=t.value;});
 });
 root.addEventListener('click',e=>{
  const el=e.target.closest('button[data-action]');if(!el||el.disabled)return;const a=el.dataset.action,i=Number(el.dataset.index??-1),where=el.dataset.scope??view,k=keyFor(where);

  if(a==='depth'){changeDepth(Number(el.dataset.depth));return;}
  const mutationScope=['add-point','delete-point','restore-unit'].includes(a)?'units':['add-rule','delete-rule','move-up','move-down'].includes(a)?where:null;
  if(mutationScope&&!editable(mutationScope)){notice='Ручная правка доступна на '+(mutationScope==='swarm'?'1 · Рой':'2 · Рой и юниты');render();return;}
  if(a==='preset'){const id=el.dataset.preset;if(id===model.tactic)return;if(dirty){pending=id;render();}else{checkpoint();setTactic(id);render();}return;}
  if(a==='select-rule'){selectContext(where,'rule',i);render();return;}
  if(a==='select-point'){selectContext('units','point',i);render();return;}
  if(a==='edit-settings'){selectContext(where,'settings');render();return;}
  if(a==='add-rule'){const list=programRules(where);if(list.length>=6)return;selectContext(where,'rule');mutate(()=>{list.push(rule(where==='swarm'?'armed':unit,where==='swarm'?'known':'assigned','attack',where==='swarm'?'common':'assigned'));selected[k]=list.length-1;nextFocus='[data-focus-key="'+where+'-when-'+selected[k]+'"]';},'Новое правило добавлено');return;}
  if(a==='delete-rule'){const list=programRules(where),old=selected[k],wasChosen=old===i;mutate(()=>{list.splice(i,1);selected[k]=Math.max(0,wasChosen?Math.min(i,list.length-1):old-(i<old?1:0));focusRow(where,list.length?Math.min(i,list.length-1):-1);},'Правило удалено. Можно отменить');return;}
  if(a==='move-up'||a==='move-down'){const list=programRules(where),j=i+(a==='move-up'?-1:1);if(j<0||j>=list.length)return;mutate(()=>{[list[i],list[j]]=[list[j],list[i]];selected[k]=j;focusRow(where,j);},'Порядок правил изменён');return;}
  if(a==='add-point'){if(model.units.air.route.length>=3)return;selectContext('units','point');mutate(()=>{model.units.air.route.push('south');selectedPoint=model.units.air.route.length-1;nextFocus='[data-focus-key="units-point-'+selectedPoint+'"]';},'Точка маршрута добавлена');return;}
  if(a==='delete-point'){const list=model.units.air.route,old=selectedPoint;mutate(()=>{list.splice(i,1);selectedPoint=Math.max(0,old===i?Math.min(i,list.length-1):old-(i<old?1:0));focusRow('units',list.length?Math.min(i,list.length-1):-1,true);},'Точка удалена. Можно отменить');return;}
  if(a==='restore-unit'){selectContext('units',unit==='air'?'point':'rule');mutate(()=>model.units[unit]=startingUnits()[unit],'Возвращена только программа '+units[unit].name);return;}
  if(a==='undo'){const previous=history.pop();if(!previous)return;model=previous.model;dirty=previous.dirty;revision++;pending=null;notice='Предыдущая правка отменена';nextFocus='[data-action="undo"]';render();return;}
  if(a==='restore-preset'){if(dirty)pending=model.tactic;else notice='Вы уже на исходном пресете';render();return;}
  if(a==='confirm-tactic'){checkpoint();setTactic(pending);render();return;}
  if(a==='cancel-tactic'){pending=null;notice='Ваши правки сохранены';render();return;}
  if(a==='check'){checked=check(clone(model),situation);notice='Проверены обе программы для всех юнитов';nextFocus='[data-action="check"]';render();return;}
  if(a==='jump-swarm'){selectContext('swarm',i>=0?'rule':'settings',i);nextFocus=i>=0?'[data-focus-key="swarm-select-rule-'+i+'"]':'[data-focus-key="swarm-settings"]';render();return;}
  if(a==='jump-local'){unit=el.dataset.unit;selectContext('units',unit==='air'?'point':i>=0?'rule':'settings',i);if(unit==='air')selectedPoint=0;nextFocus=unit==='air'&&model.units.air.route.length?'[data-focus-key="units-select-point-0"]':i>=0?'[data-focus-key="units-select-rule-'+i+'"]':'[data-focus-key="units-settings"]';render();return;}
  if(a==='help')contextHelp.openLast();
 });

 root.addEventListener('keydown',e=>{const radio=e.target.closest('button[data-action="depth"]');if(!radio||radio.disabled)return;const value=Number(radio.dataset.depth);let next;if(e.key==='ArrowRight'||e.key==='ArrowDown')next=(value+1)%3;else if(e.key==='ArrowLeft'||e.key==='ArrowUp')next=(value+2)%3;else if(e.key==='Home')next=0;else if(e.key==='End')next=2;else return;e.preventDefault();changeDepth(next);});
 checked=check(model,situation);render();
 window.leanUI={snapshot:()=>clone({model,revision,dirty,view,unit,situation,checked,pending,historyLength:history.length,editorMode,selected,selectedPoint,openMode,depth}),inspect:(m,caseId)=>check(clone(m),caseId),options:clone(options),presets:clone(presets)};
})();
