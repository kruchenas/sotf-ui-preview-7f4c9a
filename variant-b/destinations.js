/* R1 display adapter. Inputs are never rewritten; unknown/custom text stays literal. */
(() => {
 'use strict';
 const names={advance:'Рубеж продвижения',gather:'Точка сбора',flank:'Фланговая позиция',neutral:'Место назначения'};
 const definitions={
  [names.advance]:'Место, до которого юнит должен продвинуться по команде «Вперёд». Команда «Удерживать» задаёт удержание этого рубежа.',
  [names.gather]:'Место, куда юниты направляются по команде «Собраться» или «Отступить». Это выбранное место перегруппировки; его безопасность не гарантируется автоматически.',
  [names.flank]:'Место, к которому обходящий юнит направляется перед атакой сбоку. После прибытия отдельное правило разрешает атаку известной цели, если позволяют условия стрельбы.'
 };
 const general='Это место назначения для движения юнита. В текущем макете места условные: выбрать их на карте пока нельзя. Механика задания и изменения позиций ещё не определена.';
 const air={
  route:{name:'Маршрут AIR',body:'Список точек в собственной программе разведывательного коптера. По замыслу он проходит их по порядку, затем наблюдает у последней.',limit:'Здесь редактируется условный список; полёт и путь не рассчитываются. Район разведки не перестраивает этот маршрут и не задаёт позицию BOT.'},
  front:{name:'Передний район',body:'Участок разведки перед основной группой — желаемый район наблюдения.',limit:'Границы и привязка на карте не заданы. Автоматически построенного маршрута из этого назначения нет.'},
  perimeter:{name:'Периметр',body:'Условная граница района для патрулирования.',limit:'В макете нет заданного полигона и рассчитанного обхода. Конкретный район и его границы ещё нужно обсудить с автором.'},
  flank:{name:'Район разведки у фланга',body:'Область наблюдения AIR возле предполагаемой фланговой позиции обходящего юнита.',limit:'Область AIR отличается от места назначения BOT. Границы не заданы; AIR не рассчитывает позицию BOT и не меняет маршрут автоматически.'}
 };
 const norm=s=>String(s).trim().toLocaleLowerCase('ru-RU');
 const isA=s=>['a','рубеж а','рубеж a','точка сбора а','точка сбора a'].includes(norm(s));
 function label(raw,action){
  const n=norm(raw);
  if(Object.keys(definitions).some(s=>norm(s)===n))return String(raw);
  if(isA(raw))return ['advance','hold'].includes(action)?names.advance:['retreat','gather','rally'].includes(action)?names.gather:names.neutral;
  if(['b','точка б','точка b'].includes(n))return names.flank;
  if(n==='резервная позиция'&&['retreat','gather','rally'].includes(action))return names.gather;
  if(['perimeter','периметр','периметр а','периметр a'].includes(n))return air.perimeter.name;
  if(['flank','фланг б','фланг b'].includes(n))return air.flank.name;
  if(['front','передний район'].includes(n))return air.front.name;
  if(n==='route')return air.route.name;
  return String(raw);
 }
 function explain(raw,action){
  const title=label(raw,action),n=norm(raw);
  if(title===names.neutral)return {body:action==='wait'?'При ожидании сохранённое место назначения не используется.':'Роль этого места в старом примере не уточнена. Оно не объявляется рубежом продвижения или точкой сбора.',limit:general};
  if(definitions[title])return {body:definitions[title],limit:general,details:title===names.flank?'Прибытие BOT задаётся вручную выбранной ситуацией. AIR не рассчитывает эту позицию. Запрет менять место после старта для игры не принят.':null};
  const region=Object.values(air).find(v=>v.name===title);if(region)return {body:region.body,limit:region.limit};
  return null;
 }
 function result(row,rule){
  if(row.text==='Выйти к точке Б')return 'Выйти на фланговую позицию';
  const source=rule??row.assignment;
  // Only exact machine-produced result forms are formatted; custom prose is not searched/replaced.
  for(const command of ['Вперёд','Укрыться','Отступить','Собраться','Разведать','Патруль','Удерживать']){
   const legacy={a:'точка а',b:'точка б',front:'передний район',perimeter:'периметр а',flank:'фланг б',route:'маршрут air'}[source.target];
   if(legacy&&row.text===command+': '+legacy)return command+': '+label(source.target,source.action);
  }
  return row.text;
 }
 window.SotfDestinations=Object.freeze({label,explain,result,names:Object.freeze(names),general,air:Object.freeze(air)});
})();
