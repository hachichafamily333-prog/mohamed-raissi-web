'use strict';
const get=id=>document.getElementById(id);
const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Africa/Tunis',year:'numeric',month:'numeric',day:'numeric'}).formatToParts(new Date());
const num=key=>Number(parts.find(p=>p.type===key).value);
const today=new Date(num('year'),num('month')-1,num('day'));
const startMonth=new Date(today.getFullYear(),today.getMonth(),1);
const lastMonth=new Date(today.getFullYear(),today.getMonth()+2,1);
let month=new Date(startMonth), selectedDate=null, selectedTime=null, appointment=null, stage=1;
const times=['09:00','10:30','14:00','15:30'];
const label=new Intl.DateTimeFormat('fr-TN',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
function announce(text){get('announcement').textContent=text;}
function render(){
 get('month-label').textContent=new Intl.DateTimeFormat('fr-TN',{month:'long',year:'numeric'}).format(month);
 get('calendar').replaceChildren();
 const offset=(month.getDay()+6)%7;
 for(let i=0;i<offset;i++){const span=document.createElement('span');span.setAttribute('aria-hidden','true');get('calendar').append(span);}
 const count=new Date(month.getFullYear(),month.getMonth()+1,0).getDate();
 for(let day=1;day<=count;day++){
  const date=new Date(month.getFullYear(),month.getMonth(),day),button=document.createElement('button');
  button.type='button';button.textContent=String(day);button.disabled=date<today||date.getDay()===0;
  button.className=button.disabled?'':'available';button.setAttribute('aria-label',`${label.format(date)}, ${button.disabled?'indisponible':'date fictive'}`);
  button.setAttribute('aria-pressed',String(Boolean(selectedDate&&date.getTime()===selectedDate.getTime())));
  button.addEventListener('click',()=>select(date,null));get('calendar').append(button);
 }
 get('previous-month').disabled=month.getTime()<=startMonth.getTime();get('next-month').disabled=month.getTime()>=lastMonth.getTime();
 get('selected-date').textContent=selectedDate?new Intl.DateTimeFormat('fr-TN',{day:'numeric',month:'long'}).format(selectedDate):'Choisissez une date';
 get('slots').replaceChildren();
 if(selectedDate)times.forEach(time=>{const button=document.createElement('button');button.type='button';button.textContent=time;button.setAttribute('aria-pressed',String(time===selectedTime));button.setAttribute('aria-label',`${time}, heure de Tunis, créneau fictif`);button.addEventListener('click',()=>select(selectedDate,time));get('slots').append(button);});
 else{const p=document.createElement('p');p.textContent='Sélectionnez une date pour découvrir les horaires.';get('slots').append(p);}
 get('continue').disabled=!selectedTime;get('continue').textContent=selectedTime?'Continuer · démonstration →':'Choisissez un créneau';
}
function select(date,time){selectedDate=date;selectedTime=time;render();}
function setStage(next){stage=next;get('calendar-panel').hidden=next!==1;get('review-panel').hidden=next!==2;get('result-panel').hidden=next!==3;for(let n=1;n<=3;n++){get(`progress-${n}`).classList.toggle('active',n<=next);if(n===next)get(`progress-${n}`).setAttribute('aria-current','step');else get(`progress-${n}`).removeAttribute('aria-current');}}
function summary(target,date,time){target.replaceChildren();const b=document.createElement('b');b.textContent=label.format(date);const s=document.createElement('span');s.textContent=`${time} · heure de Tunis · créneau fictif`;target.append(b,s);}
function review(){if(!selectedDate||!selectedTime)return;summary(get('review-summary'),selectedDate,selectedTime);setStage(2);announce('Vérifiez votre créneau fictif.');get('confirm-demo').focus();}
function renderTracking(){get('tracking-empty').hidden=Boolean(appointment);get('tracking-details').hidden=!appointment;if(!appointment)return;get('tracking-date').textContent=label.format(appointment.date);get('tracking-time').textContent=`${appointment.time} · heure de Tunis · créneau fictif`;get('tracking-state').textContent=appointment.cancelled?'Sélection fictive annulée':'Sélection fictive terminée · aucun rendez-vous réservé';get('cancel').disabled=appointment.cancelled;get('cancel').hidden=appointment.cancelled;get('reschedule').textContent=appointment.cancelled?'Choisir un nouveau créneau':'Déplacer';}
function finish(){if(stage!==2||!selectedDate||!selectedTime)return;appointment={date:new Date(selectedDate),time:selectedTime,cancelled:false};summary(get('result-summary'),selectedDate,selectedTime);setStage(3);renderTracking();announce('Démonstration terminée. Aucun rendez-vous réel réservé.');get('result-panel').querySelector('a').focus();}
function reset(){selectedDate=null;selectedTime=null;setStage(1);render();get('rendez-vous').scrollIntoView({behavior:'smooth',block:'start'});get('next-month').focus();}
function moveMonth(delta){const next=new Date(month.getFullYear(),month.getMonth()+delta,1);if(next<startMonth||next>lastMonth)return;month=next;selectedDate=null;selectedTime=null;render();}
get('previous-month').addEventListener('click',()=>moveMonth(-1));get('next-month').addEventListener('click',()=>moveMonth(1));get('continue').addEventListener('click',review);get('back').addEventListener('click',()=>{setStage(1);get('continue').focus();});get('confirm-demo').addEventListener('click',finish);get('new-demo').addEventListener('click',reset);get('reschedule').addEventListener('click',reset);get('cancel').addEventListener('click',()=>get('cancel-dialog').showModal());get('confirm-cancel').addEventListener('click',()=>{if(appointment)appointment.cancelled=true;get('cancel-dialog').close();renderTracking();announce('Sélection fictive annulée.');get('reschedule').focus();});get('information').addEventListener('click',()=>get('info-dialog').showModal());
document.querySelectorAll('dialog').forEach(dialog=>dialog.querySelectorAll('.close,.close-dialog').forEach(button=>button.addEventListener('click',()=>dialog.close())));
const menu=get('menu-toggle'),navigation=get('navigation');menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));navigation.classList.toggle('open',open);});navigation.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{menu.setAttribute('aria-expanded','false');navigation.classList.remove('open');}));document.addEventListener('keydown',e=>{if(e.key==='Escape'){menu.setAttribute('aria-expanded','false');navigation.classList.remove('open');}});
get('year').textContent=String(today.getFullYear());render();setStage(1);renderTracking();
fetch('config.json').then(r=>{if(!r.ok)throw Error('Configuration unavailable');return r.json();}).then(config=>{if(typeof config.calendarBookingUrl!=='string')return;const url=new URL(config.calendarBookingUrl);if(url.protocol!=='https:'||!['calendar.google.com','calendar.app.google','calendar.app.google.com'].includes(url.hostname))return;get('live-booking').href=url.href;get('live-booking').hidden=false;}).catch(()=>{});
// Optional browser-agent tools use the same visible demonstration state. They never book a real appointment.
if(document.modelContext?.registerTool){const lifecycle=new AbortController();window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});const register=tool=>{try{Promise.resolve(document.modelContext.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}};
 register({name:'read_demo_selection',title:'Lire la sélection fictive',description:'Lit le créneau et le statut de démonstration affichés. Aucun rendez-vous réel.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute:()=>({demo:true,date:selectedDate?`${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}`:null,time:selectedTime,stage,trackingState:appointment?(appointment.cancelled?'cancelled-demo':'completed-demo'):null})});
 register({name:'select_demo_slot',title:'Sélectionner un créneau fictif',description:'Sélectionne une date et une heure de démonstration et ouvre la vérification. Ne crée aucun rendez-vous.',inputSchema:{type:'object',properties:{date:{type:'string',description:'Date YYYY-MM-DD'},time:{type:'string',enum:times}},required:['date','time'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:input=>{if(!input||typeof input.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(input.date)||!times.includes(input.time)||Object.keys(input).some(k=>!['date','time'].includes(k)))throw Error('Invalid demo slot');const [y,m,d]=input.date.split('-').map(Number),date=new Date(y,m-1,d),candidateMonth=new Date(y,m-1,1);if(date.getFullYear()!==y||date.getMonth()!==m-1||date.getDate()!==d||date<today||date.getDay()===0||candidateMonth<startMonth||candidateMonth>lastMonth)throw Error('Unavailable demo date');month=candidateMonth;select(date,input.time);review();return{demo:true,date:input.date,time:input.time,stage:2,booked:false};}});
}
