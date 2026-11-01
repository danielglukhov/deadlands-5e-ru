const ID = "deadlands-5e-ru";
const DEFAULT = { ammo: 6, capacity: 6, reserve: 24, wounds: {head:0, torso:0, leftArm:0, rightArm:0, leftLeg:0, rightLeg:0}, chips:{white:2,blue:1,red:1} };
const ZONES = {head:"Голова",torso:"Торс",leftArm:"Левая рука",rightArm:"Правая рука",leftLeg:"Левая нога",rightLeg:"Правая нога"};
const clone = x => foundry.utils.deepClone(x);
function state(actor) {
  const saved = actor.getFlag(ID,"state") ?? {};
  return foundry.utils.mergeObject(clone(DEFAULT),clone(saved),{inplace:false});
}
async function save(actor,s){ await actor.setFlag(ID,"state",s); }
function notify(s){ ui.notifications.info(s); }
function escapeHtml(s){ return foundry.utils.escapeHTML(String(s)); }
function actorOwner(actor){ if(!actor.isOwner){ui.notifications.warn("Нет прав на изменение персонажа.");return false;}return true; }
function content(actor,s){
 const chips = Object.entries(s.chips).map(([k,v])=>`<div class="dl-line"><span>${{white:"⚪ Белые",blue:"🔵 Синие",red:"🔴 Красные"}[k]}</span><span><button type="button" data-action="chip-minus" data-key="${k}">−</button> <strong>${v}</strong> <button type="button" data-action="chip-plus" data-key="${k}">+</button></span></div>`).join("");
 const wounds = Object.entries(ZONES).map(([k,v])=>`<div class="dl-line"><span>${v}</span><span><button type="button" data-action="wound-minus" data-key="${k}">−</button> <strong>${s.wounds[k] ?? 0}</strong> <button type="button" data-action="wound-plus" data-key="${k}">+</button></span></div>`).join("");
 return `<div class="dl-panel"><p class="dl-note">${escapeHtml(actor.name)} · Прототип механик. Стандартный лист dnd5e остаётся основным.</p><h3>Револьвер · барабан</h3><div class="dl-cylinder">${Array.from({length:s.capacity},(_,i)=>`<span class="${i<s.ammo?'loaded':''}" title="Камора ${i+1}">${i<s.ammo?'●':'○'}</span>`).join("")}</div><p>Заряжено: <b>${s.ammo}/${s.capacity}</b> · Запас: <b>${s.reserve}</b></p><div class="dl-buttons"><button type="button" data-action="fire">Выстрел (d20)</button><button type="button" data-action="reload">Зарядить 1</button><button type="button" data-action="reload-all">Зарядить полностью</button></div><p class="dl-note">Выстрел расходует патрон и бросает d20 + Ловкость + бонус мастерства при владении. Урон пока не применяется автоматически.</p><h3>Ранения по зонам</h3>${wounds}<p class="dl-note">Ранения пока записываются без автоматических штрафов и кровотечения.</p><h3>Фишки судьбы</h3>${chips}<h3>Универсальная проверка</h3><div class="dl-buttons"><button type="button" data-action="check">Проверка d20</button><button type="button" data-action="fate">Бросок судьбы d20</button></div></div>`;
}
async function check(actor, label="Проверка", bonus=0){
 const roll=await new Roll("1d20 + @bonus",{bonus}).evaluate();
 await roll.toMessage({speaker:ChatMessage.getSpeaker({actor}),flavor:`Deadlands d20 · ${label} (${bonus>=0?'+':''}${bonus})`});
}
async function action(actor,s,act,key){
 if(act==="fire"){
  if(s.ammo<=0){ui.notifications.warn("Барабан пуст!");return false;}
  s.ammo--;
  const dex=actor.system?.abilities?.dex?.mod ?? 0;
  const prof=actor.system?.attributes?.prof ?? 0;
  await check(actor,"Выстрел из револьвера (условное владение)",dex+prof);
  return true;
 }
 if(act==="reload" || act==="reload-all"){
  const n=Math.min(s.capacity-s.ammo,s.reserve,act==="reload"?1:s.capacity);
  if(n<=0){notify("Нет места или запасных патронов.");return false;}
  s.ammo+=n;s.reserve-=n;return true;
 }
 if(act==="chip-plus" || act==="chip-minus"){
  if(!(key in s.chips))return false;
  s.chips[key]=Math.max(0,s.chips[key]+(act==="chip-plus"?1:-1));return true;
 }
 if(act==="wound-plus" || act==="wound-minus"){
  if(!(key in s.wounds))return false;
  s.wounds[key]=Math.max(0,s.wounds[key]+(act==="wound-plus"?1:-1));return true;
 }
 if(act==="check"){
  const abilities=actor.system?.abilities ?? {};
  const choices=Object.entries({str:"Сила",dex:"Ловкость",con:"Телосложение",int:"Интеллект",wis:"Мудрость",cha:"Харизма"});
  const opts=choices.map(([k,v])=>`<option value="${k}">${v}</option>`).join("");
  const result=await foundry.applications.api.DialogV2.prompt({window:{title:"Проверка d20"},content:`<form><div class="form-group"><label>Характеристика</label><select name="ability">${opts}</select></div><div class="form-group"><label><input type="checkbox" name="proficient"> Добавить мастерство</label></div><div class="form-group"><label>Доп. модификатор</label><input name="extra" type="number" value="0"></div></form>`,ok:{label:"Бросить",callback:(event,button)=>{const form=button.form;return {ability:form.elements.ability.value,proficient:form.elements.proficient.checked,extra:Number(form.elements.extra.value)||0};}}});
  if(result){const bonus=(abilities[result.ability]?.mod??0)+(result.proficient?(actor.system?.attributes?.prof??0):0)+result.extra;await check(actor,"Проверка характеристики",bonus);}return false;
 }
 if(act==="fate"){await check(actor,"Бросок судьбы",0);return false;}
 return false;
}
async function openPanel(actor){
 if(!actorOwner(actor))return;
 const DialogV2=foundry.applications.api.DialogV2;
 let dialog;
 async function render(){
  const s=state(actor);
  const el=dialog.element;
  if(!el)return;
  const body=el.querySelector(".dialog-content") ?? el.querySelector(".window-content");
  if(!body)return;
  body.innerHTML=content(actor,s);
  body.querySelectorAll("[data-action]").forEach(btn=>btn.addEventListener("click",async()=>{
   if(btn.disabled)return;btn.disabled=true;
   try{const latest=state(actor);const changed=await action(actor,latest,btn.dataset.action,btn.dataset.key);if(changed)await save(actor,latest);await render();}
   catch(e){console.error(`${ID} action error`,e);ui.notifications.error("Ошибка Deadlands: подробности в консоли.");btn.disabled=false;}
  }));
 }
 dialog=new DialogV2({window:{title:`Мёртвые земли · ${actor.name}`,resizable:true},content:content(actor,state(actor)),buttons:[{action:"close",label:"Закрыть",default:true}],position:{width:490}});
 await dialog.render(true);await render();
}
Hooks.once("init",()=>{console.log(`${ID} | initialized`);});
Hooks.on("renderActorSheet",(sheet,html)=>{
 const actor=sheet.actor;
 if(!actor || actor.type!=="character" || !actor.isOwner)return;
 const root=html instanceof HTMLElement?html:html?.[0];
 if(!root || root.querySelector(".dl-open"))return;
 const header=root.querySelector(".window-header .window-title") ?? root.querySelector(".window-header");
 if(!header)return;
 const btn=document.createElement("button");btn.type="button";btn.className="dl-open";btn.textContent="🤠 Вестерн";btn.title="Открыть панель Deadlands d20";
 btn.addEventListener("click",e=>{e.preventDefault();openPanel(actor);});header.after(btn);
});
Hooks.once("ready",()=>{
 game.deadlands5e={openPanel, getState:state};
 console.log(`${ID} | ready on Foundry ${game.version}, dnd5e ${game.system.version}`);
});
