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

 function optionsHTML(group,value,subset,action){return displayOptions(group,action).filter(o=>!subset||subset.includes(o[0])).map(o=>`<option value="${o[0]}" ${o[0]===value?'selected':''}>${esc(o[1])}</option>`).join('');}
 function selectHTML(group,value,attrs='',subset,action){return `<select data-help-group="${group}" ${action?`data-help-action="${action}"`:''} ${attrs}>${optionsHTML(group,value,subset,action)}</select>`;}
 function field(group,title,value,attrs='',subset,action){return `<div class="field"><button type="button" class="field-caption" data-help-caption>${title}</button>${selectHTML(group,value,attrs+` aria-label="${esc(title)}"`,subset,action)}</div>`;}
 function sentence(r){return `${displayLabel('when',r.when)} · ${view==='swarm'?label('who',r.who)+' — ':''}${label('action',r.action)} → ${targetLabel(r.target,r.action)}`;}
 function programMarkup(){
  if(view==='units'&&unit==='air')return airMarkup();
  const list=currentRules(),key=scope(),idx=Math.min(selected[key]??0,Math.max(0,list.length-1));selected[key]=idx;
  return `<section class="editor" data-block="program" aria-label="${view==='swarm'?'Программа роя':'Собственная программа '+units[unit].name}">
   <div class="editor-head"><h2>${view==='swarm'?'Правила роя':'Свои правила'}</h2><span class="count">${list.length} из 6</span><button data-action="add-rule" ${list.length===6?'disabled':''}>Добавить правило</button></div>
   <div class="rules">${!list.length?'<p class="empty">Правил пока нет. Добавьте своё или задайте действие «Иначе» ниже.</p>':list.map((r,i)=>`<article class="rule ${i===idx?'active':''}" data-rule="${i}"><div class="rule-top"><span class="rule-num">${i+1}</span><button class="rule-sentence" data-action="select-rule" data-index="${i}" aria-expanded="${i===idx}">${esc(sentence(r))}</button><button class="edit-toggle" data-action="select-rule" data-index="${i}" aria-label="Изменить правило ${i+1}">Изменить</button></div>${i===idx?`<div class="rule-fields ${view==='units'?'local':''}">${view==='swarm'?field('who','Кому',r.who,`data-field="who" data-index="${i}"`):''}${field('when','Когда',r.when,`data-field="when" data-index="${i}"`,view==='swarm'?['always','known','unknown','damaged','loss','before','arrived','blocked']:['always','known','damaged','assigned','available'])}${field('action','Действие',r.action,`data-field="action" data-index="${i}"`,view==='units'?['attack','wait']:undefined)}${field('target','Цель / точка',r.target,`data-field="target" data-index="${i}"`,view==='units'?['assigned','common','damaged','nearest']:undefined,r.action)}</div><div class="rule-tools"><button data-action="move-up" data-index="${i}" ${i===0?'disabled':''}>Выше</button><button data-action="move-down" data-index="${i}" ${i===list.length-1?'disabled':''}>Ниже</button><button class="plain danger" data-action="delete-rule" data-index="${i}">Удалить</button></div>`:''}</article>`).join('')}</div>
   <div class="program-end">${field('fallback','Иначе',view==='swarm'?model.fallback:model.units[unit].fallback,'data-setting="fallback"')}${field(view==='swarm'?'permission':'localPermission',view==='swarm'?'Смена цели юнитами':'Самостоятельная смена',view==='swarm'?model.permission:model.units[unit].permission,'data-setting="permission"')}</div>${editorBottom()}</section>`;
 }
 function editorBottom(){return `<div class="editor-bottom"><span>${dirty?'Изменено вами':'Основа: '+esc(presets[model.tactic].name)}</span><button class="plain" data-action="undo" ${!history.length?'disabled':''}>Отменить правку</button><button class="plain" data-action="restore">Вернуть основу</button></div>`;}
 function airMarkup(){return `<section class="editor" data-block="program" aria-label="Собственная программа AIR-1"><div class="editor-head"><h2>Маршрут и сообщения</h2><span class="count">${model.units.air.route.length} из 3 точек</span><button data-action="add-point" ${model.units.air.route.length===3?'disabled':''}>Добавить точку</button></div><p class="air-note" data-help-key="air-note" tabindex="0">AIR проходит точки по порядку, затем наблюдает у последней. Он безоружен.</p><div class="route-list">${model.units.air.route.length?model.units.air.route.map((point,i)=>`<div class="route-row"><span class="rule-num">${i+1}</span><div class="route-field"><button type="button" class="field-caption" data-help-caption>Точка ${i+1}</button>${selectHTML('route',point,`data-point="${i}" aria-label="Точка маршрута ${i+1}"`)}</div><button class="plain danger" data-action="delete-point" data-index="${i}">Удалить</button></div>`).join(''):'<p class="empty">Маршрут пуст — наблюдать с места. Обнаружение не гарантировано.</p>'}</div><div class="air-settings">${field('report','При обнаружении цели',model.units.air.report,'data-setting="report"')}</div><p class="air-note" data-help-key="air-note" tabindex="0">Сообщение становится знанием роя после доставки. Маршрут сам по себе не раскрывает противника.</p><div style="margin-top:auto"></div>${editorBottom()}</section>`;}
 function resultMarkup(){
  const stale=!checked||checked.revision!==revision;
  if(stale)return `<section class="result" data-block="result" aria-label="Объяснение результата"><div class="result-head"><h2>Что получится</h2></div><p class="notice stale" data-help-key="stale" tabindex="0">${checked?'План изменён. Проверьте новую версию.':'Выберите ситуацию и проверьте программу.'}</p><p class="result-note">Проверка объясняет, какое правило сработает. Это пример по заданным сведениям, без расчёта боя.</p></section>`;
  const r=checked,w=r.world,messages=!w.seen?'У AIR ещё нет контакта.':model.units.air.report==='no'?'AIR видит цель, но не сообщает рою.':!w.known?'AIR видит цель. Рой ещё не получил сообщение.':'Сведения AIR доставлены рою.';
  const ids=view==='swarm'?['rover','bot','air']:[unit];
  const entries=ids.map(id=>{const row=r.rows[id],source=id==='air'&&row.assignment.source==='Собственная программа AIR'?'Собственная программа AIR':`Рой: ${label('action',row.assignment.action)} · ${row.assignment.source}`;return `<div class="result-row" data-help-key="result-${id}" tabindex="0"><strong>${units[id].name}</strong><div><p>${esc(displayResult(row,id))}</p><p>${esc(source)}</p>${view==='units'&&id!=='air'?`<p>Локально: ${esc(row.local)}</p>`:''}</div></div>`;}).join('');
  const own=r.rows[view==='swarm'?'rover':unit];
  return `<section class="result" data-block="result" aria-label="Объяснение результата"><div class="result-head"><h2>Что получится</h2><span class="muted">${view==='swarm'?'Весь рой':units[unit].name}</span></div><p class="trace" data-help-key="trace" tabindex="0">${esc(messages)}</p><div class="result-rows">${entries}</div><p class="reason" data-help-key="reason" tabindex="0"><strong>Почему:</strong> ${esc(own.reason)}</p>${view==='units'&&unit!=='air'?`<p class="result-note" data-help-key="permission-result" tabindex="0">Другая цель: ${model.permission!=='allow'?'запрещена роем':model.units[unit].permission!=='allow'?'выключена у '+units[unit].name:'разрешена настройками'}.</p>`:''}</section>`;
 }
 function choiceMarkup(){
  if(view==='units')return `<section class="intro-row" data-block="choice" aria-label="Выбор юнита"><div class="title-group"><h1>Программа ${units[unit].name}</h1><p class="muted">${units[unit].role} · собственное поведение</p></div><div class="unit-choice" role="group" aria-label="Выбрать юнит">${Object.entries(units).map(([id,u])=>`<button data-action="unit" data-unit="${id}" aria-pressed="${unit===id}">${u.name}</button>`).join('')}</div></section>`;
  return `<section class="intro-row" data-block="choice" aria-label="Тактика роя"><div class="title-group"><h1>Тактика роя</h1><p class="muted">Первое подходящее правило — для каждого юнита</p></div><div class="choice">${pending?`<div class="notice"><p>Заменить правки: «${esc(presets[pending].name)}»?</p><div class="actions"><button data-action="confirm-tactic">Заменить</button><button data-action="cancel-tactic">Оставить правки</button></div></div>`:`<div class="tactic-field"><button type="button" class="field-caption" data-help-caption>Пресеты тактики</button><select id="tactic" data-help-group="tactic" aria-label="Пресеты тактики">${Object.entries(presets).map(([id,p])=>`<option value="${id}" ${model.tactic===id?'selected':''}>${p.name}</option>`).join('')}</select></div>`}</div></section>`;
 }
 const helpTitles={tactic:'Пресеты тактики',unit:'Юнит',who:'Кому',when:'Когда',action:'Действие',target:'Цель / точка',fallback:'Иначе',permission:'Смена цели юнитами',localPermission:'Самостоятельная смена',route:'Точка маршрута AIR',report:'При обнаружении цели',situation:'Ситуация проверки'};
 function helpOptions(group,action){
  if(group==='tactic')return Object.entries(presets).map(([id,p])=>[id,p.name,tacticDescriptions[id]+' Это редактируемая основа, не бонус к характеристикам или гарантия победы.']);
  if(group==='unit')return Object.entries(units).map(([id,u])=>[id,u.name,u.role+(id==='air'?'. Разведывает и сообщает, без оружия. Не рассчитывает фланговую позицию BOT.':'. Исполняет доставленное назначение своей программой. Правка юнита не меняет программу роя.')]);
  return displayOptions(group,action);
 }
 function describeHelp(element){
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

 function render(){
  const focus=document.activeElement,focusSelector=focus?.id?'#'+focus.id:focus?.dataset?.field?`[data-field="${focus.dataset.field}"][data-index="${focus.dataset.index}"]`:null;
  root.innerHTML=`<main class="app"><header class="topbar" data-common="navigation"><span class="brand">SOTF</span><nav aria-label="Уровень программы"><button data-action="view" data-view="swarm" ${view==='swarm'?'aria-current="page"':''}>Рой</button><button data-action="view" data-view="units" ${view==='units'?'aria-current="page"':''}>Юниты</button></nav><span class="muted">Пояснения по месту · F1</span><button data-action="help" aria-controls="context-help">Справка</button></header>${choiceMarkup()}<div class="workspace">${programMarkup()}<div class="check-column"><section class="test-input" data-block="situation" aria-label="Ситуация проверки"><h2>Проверить на примере</h2><div class="situation-field"><button type="button" class="field-caption" data-help-caption>Ситуация</button>${selectHTML('situation',situation,'id="situation" aria-label="Ситуация"')}</div><button class="primary" data-action="check">Проверить</button></section>${resultMarkup()}</div></div><footer class="screen-foot"><span>Условная проверка · без расчёта боя</span><span role="status">${esc(notice||'Изменения в памяти вкладки')}</span></footer></main>`;
  contextHelp.refresh();
  if(focusSelector){const target=root.querySelector(focusSelector);if(target)target.focus({preventScroll:true});}
 }
 root.addEventListener('change',e=>{
  const t=e.target;
  if(t.id==='tactic'){if(t.value===model.tactic)return;if(dirty){pending=t.value;render();}else{checkpoint();setTactic(t.value);render();}return;}
  if(t.id==='situation'){situation=t.value;checked=null;notice='Ситуация выбрана. Нажмите «Проверить»';render();return;}
  if(t.dataset.field){const i=Number(t.dataset.index);mutate(()=>currentRules()[i][t.dataset.field]=t.value);return;}
  if(t.dataset.point!==undefined){mutate(()=>model.units.air.route[Number(t.dataset.point)]=t.value,'Маршрут AIR изменён');return;}
  if(t.dataset.setting){mutate(()=>{if(t.dataset.setting==='report')model.units.air.report=t.value;else (view==='swarm'?model:model.units[unit])[t.dataset.setting]=t.value;});}
 });
 root.addEventListener('click',e=>{
  const el=e.target.closest('button[data-action]');if(!el||el.disabled)return;const a=el.dataset.action,i=Number(el.dataset.index);
  if(a==='view'){view=el.dataset.view;notice='';render();return;}if(a==='unit'){unit=el.dataset.unit;render();return;}
  if(a==='select-rule'){selected[scope()]=i;render();return;}
  if(a==='add-rule'){if(currentRules().length>=6)return;mutate(()=>{currentRules().push(rule(view==='swarm'?'armed':unit,view==='swarm'?'known':'assigned','attack',view==='swarm'?'common':'assigned'));selected[scope()]=currentRules().length-1;},'Новое правило добавлено');return;}
  if(a==='delete-rule'){mutate(()=>{currentRules().splice(i,1);selected[scope()]=Math.max(0,i-1);},'Правило удалено. Можно отменить');return;}
  if(a==='move-up'||a==='move-down'){mutate(()=>{const j=i+(a==='move-up'?-1:1),list=currentRules();[list[i],list[j]]=[list[j],list[i]];selected[scope()]=j;},'Порядок правил изменён');return;}
  if(a==='add-point'){if(model.units.air.route.length<3)mutate(()=>model.units.air.route.push('south'),'Точка маршрута добавлена');return;}
  if(a==='delete-point'){mutate(()=>model.units.air.route.splice(i,1),'Точка удалена. Можно отменить');return;}
  if(a==='undo'){const previous=history.pop();if(!previous)return;model=previous.model;dirty=previous.dirty;revision++;pending=null;notice='Предыдущая правка отменена';render();return;}
  if(a==='restore'){if(view==='units'){mutate(()=>model.units[unit]=startingUnits()[unit],'Возвращена только программа '+units[unit].name);return;}if(dirty){pending=model.tactic;render();}else notice='Вы уже на исходной тактике';render();return;}
  if(a==='confirm-tactic'){checkpoint();setTactic(pending);render();return;}if(a==='cancel-tactic'){pending=null;notice='Ваши правки сохранены';render();return;}
  if(a==='check'){checked=check(clone(model),situation);notice='Проверена текущая программа';render();return;}
  if(a==='help'){contextHelp.openLast();return;}
 });
 checked=check(model,situation);render();
 window.leanUI={snapshot:()=>clone({model,revision,dirty,view,unit,situation,checked,pending,historyLength:history.length}),inspect:(m,caseId)=>check(clone(m),caseId),options:clone(options),presets:clone(presets)};
})();
