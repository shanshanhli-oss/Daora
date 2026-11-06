import './styles.css';
import { createIcons, CalendarDays, Clock3, MapPin, ArrowUpRight, Sparkles, LockKeyhole, CircleDollarSign, VolumeX, Volume2, Wind, ArrowRight, Mouse, Scan, Footprints, Maximize, Minimize, House, BookOpen, CircleHelp, X, Check, Leaf, Droplets, Flame, Mountain, Feather, MoveUpRight, Pause, Play, PencilLine, ShieldCheck, RotateCcw, Eye, Heart, Info, Coins, ChevronRight, Compass } from 'lucide';
import { SanctuaryScene } from './scene.js';
import { copy, services, demoEntries, elementNames, elementColors } from './i18n.js';
import { AmbientAudio } from './audio.js';

const icons={CalendarDays,Clock3,MapPin,ArrowUpRight,Sparkles,LockKeyhole,CircleDollarSign,VolumeX,Volume2,Wind,ArrowRight,Mouse,Scan,Footprints,Maximize,Minimize,House,BookOpen,CircleHelp,X,Check,Leaf,Droplets,Flame,Mountain,Feather,MoveUpRight,Pause,Play,PencilLine,ShieldCheck,RotateCcw,Eye,Heart,Info,Coins,ChevronRight,Compass};
const $=(selector,parent=document)=>parent.querySelector(selector);
const $$=(selector,parent=document)=>[...parent.querySelectorAll(selector)];
const escapeHTML=(text='')=>String(text).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const STORAGE_KEY='daora-sanctuary-v1';
const safeStorage={available:true,read(){try{const data=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');return data&&typeof data==='object'?data:{};}catch{this.available=false;return{};}},write(data){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(data));return true;}catch{this.available=false;return false;}}};
const stored=safeStorage.read();
const validRecords=Array.isArray(stored.records)?stored.records.filter(entry=>entry&&typeof entry==='object'&&typeof entry.body==='string'&&entry.body.trim()&&typeof entry.title==='string').slice(0,30).map(entry=>({id:String(entry.id||Date.now()),date:/^\d{4}-\d{2}-\d{2}$/.test(String(entry.date||''))?entry.date:'2026-11-06',time:typeof entry.time==='string'?entry.time.slice(0,8):'',title:entry.title.slice(0,150),body:entry.body.slice(0,4000),tag:typeof entry.tag==='string'?entry.tag.slice(0,80):'Reflection',kind:entry.kind==='memory'?'memory':'reflection',sample:false})):[];
const state={
  language:stored.language==='en'?'en':'zh',
  profile:stored.profile&&typeof stored.profile.city==='string'?stored.profile:{city:'Shanghai',birthDate:'1995-05-20',birthTime:'08:30'},
  coins:Number.isFinite(stored.coins)?Math.min(9999,Math.max(0,stored.coins)):128,
  records:[...validRecords,...demoEntries],entered:false,currentPanel:null,currentHotspot:null,ritual:null,ritualElapsed:0,ritualComplete:false,
};
const t=(key,vars={})=>{let value=copy[state.language][key]||copy.zh[key]||key;for(const[k,v]of Object.entries(vars))value=value.replaceAll(`{${k}}`,v);return value;};
let toastTimer;
function toast(message){const el=$('#toast');$('span',el).textContent=message;el.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('visible'),3600);}
function iconMarkup(){createIcons({icons,attrs:{'aria-hidden':'true'}});}
function persist(){const ok=safeStorage.write({language:state.language,profile:state.profile,coins:state.coins,records:state.records.filter(entry=>!entry.sample).slice(0,30)});if(!ok&&!safeStorage.warned){safeStorage.warned=true;toast(t('localStorageError'));}}
function headerHTML(kicker){return `<button class="icon-button panel-close" data-action="close-panel" aria-label="${t('close')}"><i data-lucide="x"></i></button><div class="panel-kicker">${kicker}</div>`;}
function noticeHTML(text,icon='shield-check'){return `<div class="notice"><i data-lucide="${icon}"></i><span>${text}</span></div>`;}
function setNav(section='room'){$$('[data-nav]').forEach(button=>button.classList.toggle('active',button.dataset.nav===section));}
function refreshCounts(){
  $('#coin-count').textContent=state.coins;
  $('.coin-chip').setAttribute('aria-label',`${state.coins} demo energy tokens`);
  $('#reflection-count').textContent=String(state.records.length).padStart(2,'0');
  $('#record-badge').textContent=state.records.length;
  $('#record-badge').hidden=!state.records.length;
}
function translateUI(){
  document.documentElement.lang=state.language==='zh'?'zh-CN':'en';
  $$('[data-i18n]').forEach(element=>{element.textContent=t(element.dataset.i18n);});
  $$('[data-i18n-html]').forEach(element=>{element.innerHTML=t(element.dataset.i18nHtml);});
  $$('[data-action="language"]').forEach(element=>{if(element.classList.contains('language-button'))element.innerHTML=state.language==='zh'?'EN <span>/</span> <b>中文</b>':'<b>EN</b> <span>/</span> 中文';else element.textContent=state.language==='zh'?'EN':'中';});
  $('[name="birthDate"]').setAttribute('aria-label',t('birthDate'));
  $('[name="birthTime"]').setAttribute('aria-label',t('birthTime'));
  $('[name="birthCity"]').setAttribute('aria-label',t('birthCity'));
  $('[name="birthCity"]').placeholder=state.language==='zh'?'城市 / City':'City / 城市';
  if(state.currentPanel)renderPanel(state.currentPanel,false);
  if(state.currentHotspot)renderHotspot(state.currentHotspot,false);
  if($('#modal-backdrop').classList.contains('hidden')===false&&state.ritual){const context=state.ritual;state.ritual=null;openBreath(context);}
  iconMarkup();
}

const hotspotMeta={
  chart:{title:'chartTitle',kicker:'YOUR ELEMENTS · 你的五行',glyph:'☰',intro:'chartIntro'},
  tea:{title:'teaTitle',kicker:'A MOMENT OF CALM · 茶',glyph:'茶',intro:'teaIntro'},
  sofa:{title:'sofaTitle',kicker:'REST WITHOUT RUSH · 息',glyph:'憩',intro:'sofaIntro'},
  orb:{title:'orbTitle',kicker:'KEEP YOUR INNER LIGHT · 心灯',glyph:'心',intro:'orbIntro'},
  bagua:{title:'baguaTitle',kicker:'THE ART OF BALANCE · 易',glyph:'☯',intro:'baguaIntro'},
};
function energyBarsHTML(){
  const values=[62,78,48,69,55],words=['chartMetal','chartWood','chartWater','chartFire','chartEarth'];
  return `<div class="element-bars">${values.map((value,index)=>`<div class="element-row"><span style="color:${elementColors[index]}">${elementNames[index]}</span><span>${t(words[index])}</span><div class="element-track"><div style="width:${value}%;background:${elementColors[index]}"></div></div><span>${value}</span></div>`).join('')}</div><div class="reflection-quote">${t('chartPrompt')}</div>${noticeHTML(t('chartDemo'),'info')}`;
}
function renderHotspot(id,focus=true){
  closeModal(false);stopRitual(false);if(scene?.mode==='walk')scene.leaveWalk();if(scene)scene.paused=true;state.currentHotspot=id;state.currentPanel=null;setNav('room');
  const backdrop=$('#panel-backdrop'),panel=$('#detail-panel');
  backdrop.classList.remove('hidden');panel.classList.remove('hidden');
  let html='';
  if(id==='chart'){
    html=`${headerHTML('YOUR ELEMENTS · 你的五行')}<div class="hotspot-panel-symbol">☰</div><h2 id="detail-title">${t('chartTitle')}</h2><p class="panel-intro">${t('chartIntro')}</p>${energyBarsHTML()}<button class="primary-button panel-action" data-action="new-record"><i data-lucide="pencil-line"></i>${t('recordNew')}</button>`;
  }else if(id.startsWith('element-')){
    const index=Number(id.split('-')[1]),descriptions=['elementClarity','elementGrowth','elementStillness','elementWarmth','elementPresence'];
    html=`${headerHTML('THE FIVE ELEMENTS · 五行')}<div class="hotspot-panel-symbol" style="color:${elementColors[index]}">${elementNames[index]}</div><h2 id="detail-title">${t(descriptions[index])}</h2><p class="panel-intro">${t('elementsIntro')}</p><div class="panel-divider"></div><p class="panel-intro">${t('baguaDetail')}</p>${noticeHTML(t('elementalNotReading'),'leaf')}<button class="primary-button panel-action" data-panel="chart">${t('chartTitle')}<i data-lucide="arrow-right"></i></button>`;
  }else{
    const meta=hotspotMeta[id]||hotspotMeta.bagua;
    html=`${headerHTML(meta.kicker)}<div class="hotspot-panel-symbol">${meta.glyph}</div><h2 id="detail-title">${t(meta.title)}</h2><p class="panel-intro">${t(meta.intro)}</p><div class="panel-divider"></div>`;
    if(id==='memory'){panel.innerHTML=memoryRecordsHTML();panel.scrollTop=0;iconMarkup();scene?.focusHotspot(id);if(focus)$('.panel-close',panel)?.focus({preventScroll:true});return;}
    else if(id==='tea')html+=`<div class="reflection-quote">${t('teaDetail')}</div><p class="panel-intro">${t('teaRitual')}</p><button class="primary-button panel-action" data-panel="breathe">${t('serviceStart')}<i data-lucide="arrow-right"></i></button>`;
    else if(id==='sofa')html+=`<p class="panel-intro">${t('sofaDetail')}</p><button class="primary-button panel-action" data-panel="breathe">${t('minuteForSelf')}<i data-lucide="wind"></i></button>`;
    else if(id==='orb')html+=`<p class="panel-intro">${t('orbDetail')}</p><button class="primary-button panel-action" data-action="new-record">${t('recordNew')}<i data-lucide="pencil-line"></i></button>`;
    else html+=`<p class="panel-intro">${t('baguaDetail')}</p><ul class="detail-list"><li><i data-lucide="wind"></i>乾 · 坎 · 艮 · 震<small>Qian / Kan / Gen / Zhen</small></li><li><i data-lucide="leaf"></i>巽 · 离 · 坤 · 兑<small>Xun / Li / Kun / Dui</small></li></ul><button class="primary-button panel-action" data-panel="chart">${t('chartTitle')}<i data-lucide="arrow-right"></i></button>`;
  }
  panel.innerHTML=html;panel.scrollTop=0;iconMarkup();
  if(id)scene?.focusHotspot(id);
  if(focus)$('.panel-close',panel)?.focus({preventScroll:true});
}

function servicesHTML(){
  return `${headerHTML(t('servicesKicker'))}<h2 id="detail-title">${t('servicesTitle')}</h2><p class="panel-intro">${t('servicesIntro')}</p>${services.map(service=>`<article class="service-card"><div class="service-heading"><span class="service-symbol">${service.glyph}</span><div><h3>${t(service.title)}</h3><small>${t(service.duration)}</small></div><span class="service-price">${service.price==='serviceFree'?t('serviceFree'):service.price}</span></div><p>${t(service.text)}</p><button class="text-button" data-service="${service.id}">${service.id==='tea'?t('servicePreview'):t(service.action)}<i data-lucide="arrow-right"></i></button></article>`).join('')}<div class="panel-divider"></div>${noticeHTML(t('servicesDisclaim'),'info')}`;
}
function memoryRecordsHTML(){
  const personal=state.records.filter(entry=>!entry.sample&&entry.kind==='memory').slice(0,3);
  return `${headerHTML(t('memoryKicker'))}<div class="hotspot-panel-symbol journey-symbol"><i data-lucide="sparkles"></i></div><h2 id="detail-title">${t('memoryTitle')}</h2><div class="eyebrow journey-subtitle">JOURNEY MEMORY</div><p class="panel-intro">${t('memoryIntro')}</p><p class="panel-intro">${t('memoryCaption')}</p><div class="memory-toolbar"><span class="eyebrow">${t('memoryMilestones')}</span><span class="tag">DEMO + YOUR MOMENTS</span></div><div class="journey-timeline">
    ${[['memoryArrival','memoryArrivalText'],['memoryObserve','memoryObserveText'],['memoryBreath','memoryBreathText'],['memoryReturn','memoryReturnText']].map(([title,body],index)=>`<article class="journey-step"><span class="journey-step-number">${String(index+1).padStart(2,'0')}</span><div><h3>${t(title)}</h3><p>${t(body)}</p><small>${t('markDemo')}</small></div></article>`).join('')}
    ${personal.map((entry,index)=>`<article class="journey-step personal"><span class="journey-step-number"><i data-lucide="sparkles"></i></span><div><h3>${escapeHTML(entry.title)}</h3><p>${escapeHTML(entry.body.length>140?entry.body.slice(0,140)+'…':entry.body)}</p><small>${escapeHTML(entry.date)} · ${t('markPersonal')}</small></div></article>`).join('')}
  </div>${noticeHTML(t('memoryDemoNote'),'book-open')}<button class="primary-button panel-action" data-panel="records">${t('memoryViewJournal')}<i data-lucide="book-open"></i></button><button class="secondary-button panel-action" data-action="new-record">${t('memoryWrite')}<i data-lucide="pencil-line"></i></button>`;
}
function recordsHTML(){
  return `${headerHTML(t('recordsKicker'))}<h2 id="detail-title">${t('recordsTitle')}</h2><p class="panel-intro">${t('recordsIntro')}</p><button class="primary-button panel-action" data-action="new-record"><i data-lucide="pencil-line"></i>${t('recordNew')}</button><p class="privacy-note" style="margin:19px 0 28px">${t('demoRecords')}</p><div>${state.records.length?state.records.map(entry=>`<article class="record-card"><div class="record-content"><div class="record-meta"><span>${escapeHTML(entry.date)} · ${escapeHTML(entry.time)}</span><span>${entry.sample?t('markDemo'):t('markPersonal')}</span></div><h3>${entry.sample&&copy.zh[entry.title]?t(entry.title):escapeHTML(entry.title)}</h3><p>${entry.sample&&copy.zh[entry.body]?t(entry.body):escapeHTML(entry.body)}</p><small>${entry.sample?(state.language==='en'?entry.tag.split(' / ')[1]:entry.tag.split(' / ')[0]):escapeHTML(entry.tag)}</small></div></article>`).join(''):`<p class="panel-intro">${t('noRecords')}</p>`}</div><div class="panel-divider"></div>${noticeHTML(t('recordHint'),'lock-keyhole')}`;
}
function aboutHTML(){
  return `${headerHTML(t('aboutKicker'))}<div class="about-mark">道</div><h2 id="detail-title">${t('aboutTitle')}</h2><p class="panel-intro">${t('aboutIntro')}</p><div class="panel-divider"></div><h3>${t('aboutWhat')}</h3><p class="panel-intro">${t('aboutText')}</p><ul class="detail-list"><li><i data-lucide="compass"></i>${t('aboutCraft')}</li><li><i data-lucide="shield-check"></i>${t('localOnly')}</li></ul><div class="panel-divider"></div><h3>${t('aboutDemo')}</h3><p class="panel-intro">${t('aboutDemoText')}</p><div class="about-version"><span>${t('aboutVersion')}</span><span>1.1.0 · 2026</span></div>`;
}
function coinsHTML(){
  return `${headerHTML('INNER LIGHT · 心光')}<div class="hotspot-panel-symbol"><i data-lucide="coins"></i></div><h2 id="detail-title">${t('coinsTitle')}</h2><p class="panel-intro">${t('coinsIntro')}</p><div class="panel-stat-grid"><div class="panel-stat"><b>${state.coins}</b><small>INNER LIGHT</small></div><div class="panel-stat"><b>${state.records.filter(entry=>!entry.sample).length}</b><small>${t('moments')}</small></div></div><p class="panel-intro">${t('coinsExplainer')}</p><button class="primary-button panel-action" data-panel="breathe">${t('breatheBegin')}<i data-lucide="wind"></i></button>${noticeHTML(t('demoOnly'),'info')}`;
}

function renderPanel(panel,focus=true){
  if(!panel)return;closeModal(false);stopRitual(false);if(scene?.mode==='walk')scene.leaveWalk();scene.paused=true;setNav(['services','records','about'].includes(panel)?panel:'room');
  state.currentPanel=panel;state.currentHotspot=null;
  $('#panel-backdrop').classList.remove('hidden');$('#detail-panel').classList.remove('hidden');
  let html;
  if(panel==='services')html=servicesHTML();
  else if(panel==='records')html=recordsHTML();
  else if(panel==='about')html=aboutHTML();
  else if(panel==='coins')html=coinsHTML();
  else if(panel==='chart')html=`${headerHTML('YOUR ELEMENTS · 你的五行')}<div class="hotspot-panel-symbol">☰</div><h2 id="detail-title">${t('chartTitle')}</h2><p class="panel-intro">${t('chartIntro')}</p>${energyBarsHTML()}<button class="primary-button panel-action" data-action="new-record"><i data-lucide="pencil-line"></i>${t('recordNew')}</button>`;
  else if(panel==='breathe'){openBreath();return;}
  else {renderHotspot(panel,focus);return;}
  $('#detail-panel').innerHTML=html;$('#detail-panel').scrollTop=0;iconMarkup();
  if(focus)$('.panel-close',$('#detail-panel'))?.focus({preventScroll:true});
}
function closePanel(restoreFocus=true){
  const wasOpen=!$('#panel-backdrop').classList.contains('hidden');
  $('#panel-backdrop').classList.add('hidden');$('#detail-panel').classList.add('hidden');
  state.currentPanel=null;state.currentHotspot=null;if(scene)scene.paused=false;setNav('room');
  if(restoreFocus&&wasOpen)$('[data-nav="room"]').focus({preventScroll:true});
}

function showModal(html){$('#modal').innerHTML=html;$('#modal-backdrop').classList.remove('hidden');iconMarkup();$('.panel-close',$('#modal'))?.focus({preventScroll:true});}
function closeModal(restoreFocus=true){
  const wasOpen=!$('#modal-backdrop').classList.contains('hidden');
  if(state.ritual)stopRitual(false);
  $('#modal-backdrop').classList.add('hidden');$('#modal').innerHTML='';state.ritualComplete=false;
  if(restoreFocus&&wasOpen){if(state.currentPanel||state.currentHotspot)$('.panel-close',$('#detail-panel'))?.focus({preventScroll:true});else $('[data-nav="room"]').focus({preventScroll:true});}
}
function newReflection(){
  state.ritual=null;
  const memory=state.currentHotspot==='memory';
  showModal(`<button class="icon-button panel-close" data-action="close-modal" aria-label="${t('close')}"><i data-lucide="x"></i></button><form class="modal-form" id="reflection-form" data-context="${memory?'memory':'reflection'}"><span class="eyebrow">${t(memory?'memoryKicker':'recordsKicker')}</span><h2 id="modal-title" style="margin-top:18px">${t(memory?'memoryNewTitle':'recordNewTitle')}</h2><label for="reflection-text">${t(memory?'memoryPrompt':'recordPrompt')}</label><textarea id="reflection-text" name="reflection" maxlength="4000" required placeholder="${t('recordPlaceholder')}"></textarea><p class="form-footnote">${t('recordHint')}</p><div class="modal-actions"><button class="secondary-button" type="button" data-action="close-modal">${t('cancel')}</button><button class="primary-button" type="submit">${t('save')}<i data-lucide="arrow-right"></i></button></div></form>`);
  $('#reflection-text').focus({preventScroll:true});
}
function formatDate(){
  // Use the viewer's actual date, not a made-up consultation timestamp.
  const date=new Date();
  return {date:`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`,time:`${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`};
}
function addRecord(body,title='',tag='',kind='reflection'){
  const clean=String(body).trim().slice(0,4000);if(!clean)return false;
  const now=formatDate();
  state.records.unshift({id:`reflection-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,date:now.date,time:now.time,title:title||(state.language==='zh'?'此刻 · 写给自己的话':'A moment for myself'),body:clean,tag:tag||(state.language==='zh'?'我的觉察':'My reflection'),kind:kind==='memory'?'memory':'reflection',sample:false});
  state.records=[...state.records.filter(entry=>!entry.sample).slice(0,30),...demoEntries];
  state.coins=Math.min(9999,state.coins+2);refreshCounts();persist();return true;
}

function breathPhase(seconds){
  const phase=seconds%14;
  if(phase<4)return{label:t('breatheInPrompt'),scale:.70+phase*.0775,sublabel:'INHALE'};
  if(phase<8)return{label:t('breatheHoldPrompt'),scale:1.01,sublabel:'HOLD'};
  return{label:t('breatheOutPrompt'),scale:1.01-(phase-8)*.0518,sublabel:'EXHALE'};
}
function breathHTML(){
  const first=breathPhase(state.ritualElapsed);
  return `<button class="icon-button panel-close" data-action="close-modal" aria-label="${t('close')}"><i data-lucide="x"></i></button><div class="ritual"><span class="eyebrow">A MOMENT, JUST FOR YOU</span><h2 id="modal-title" style="margin-top:17px">${t('breatheTitle')}</h2><p>${t('breatheIntro')}</p><div class="ritual-ring"><div class="ritual-orb" style="transform:scale(${first.scale})"></div><b class="ritual-time">${Math.max(0,60-state.ritualElapsed)}</b></div><p class="ritual-text">${first.label}</p><p style="font-size:9px">${t('breatheGuide')}</p><button class="secondary-button" data-action="finish-breath">${t('breatheStop')}</button></div>`;
}
function openBreath(context='tea'){
  if(state.ritual){clearInterval(state.ritual);state.ritual=null;}
  state.ritualElapsed=0;state.ritualComplete=false;
  showModal(breathHTML());
  const timer=setInterval(()=>{
    if(state.ritual!==timer)return;
    state.ritualElapsed++;
    if(state.ritualElapsed>=60){finishBreath();return;}
    const phase=breathPhase(state.ritualElapsed);
    const orb=$('.ritual-orb'),timerEl=$('.ritual-time'),text=$('.ritual-text');
    if(orb)orb.style.transform=`scale(${phase.scale})`;
    if(timerEl)timerEl.textContent=Math.max(0,60-state.ritualElapsed);
    if(text)text.textContent=phase.label;
  },1000);state.ritual=timer;
}
function stopRitual(save=false){
  if(state.ritual)clearInterval(state.ritual);state.ritual=null;
}
function finishBreath(){
  if(state.ritualComplete)return;
  const seconds=state.ritualElapsed;stopRitual();state.ritualComplete=true;
  const isTea=state.currentHotspot==='tea'||state.currentPanel==='tea';
  if(isTea)addRecord(state.language==='zh'?'我在茶与呼吸之间，为自己留下了一段安静的时光。':'I made time for quiet between tea and breath.',t('recordTeaTitle'),state.language==='zh'?'日常仪式':'Daily ritual');
  const earned=seconds>=60?10:8;state.coins=Math.min(9999,state.coins+earned);refreshCounts();persist();
  showModal(`<div class="ritual"><span class="eyebrow">A LITTLE LIGHT, KEPT</span><div class="about-mark">静</div><h2 id="modal-title">${seconds>=60?t('breatheComplete'):t('breatheShort')}</h2><p>${seconds>=60?t('recordBreathText'):t('breatheShort')}</p><div class="modal-row"><span>INNER LIGHT</span><strong>+${earned}</strong></div><div class="modal-actions"><button class="secondary-button" data-action="again-breath">${t('breatheAgain')}</button><button class="primary-button" data-action="close-modal">${t('breatheClose')}<i data-lucide="arrow-right"></i></button></div></div>`);
}

let scene,audio;
function handleError(error){
  console.error('DAORA scene initialization:',error);
  $('#loading').classList.add('hidden');
  if(!$('.error-screen'))$('#app').insertAdjacentHTML('beforeend',`<div class="error-screen"><div><span class="eyebrow">DAORA · A QUIET SANCTUARY</span><h1>${state.language==='zh'?'静境正在等你':'Your sanctuary is waiting'}</h1><p>${state.language==='zh'?'当前浏览器无法创建 3D 场景。请在支持 WebGL 的 Chrome、Edge、Firefox 或 Safari 中启用硬件加速后刷新。':'The 3D scene could not start. Please enable hardware acceleration in a WebGL-capable browser such as Chrome, Edge, Firefox or Safari, then refresh.'}</p><p><code>${escapeHTML(error?.message||'WebGL unavailable')}</code></p><button class="primary-button" onclick="location.reload()">${state.language==='zh'?'重新尝试':'Try again'}</button></div></div>`);
}
function enterRoom(profile=null){
  // Programmatic onboarding goes through the same candidate, but never relies on a
  // previously focused form field. Invalid user submissions are handled by reportValidity.
  if(!scene)return;
  if(profile){
    state.profile={birthDate:String(profile.birthDate).slice(0,10),birthTime:String(profile.birthTime).slice(0,8),city:String(profile.city).trim().slice(0,60)};
    $('[name="birthDate"]').value=state.profile.birthDate;
    $('[name="birthTime"]').value=state.profile.birthTime;
    $('[name="birthCity"]').value=state.profile.city;
  }
  const form=$('#birth-form');
  if(!form.reportValidity())return;
  state.entered=true;persist();
  closePanel(false);closeModal(false);
  $('#landing').classList.add('hidden');$('#room-ui').classList.remove('hidden');$('#room-ui').classList.add('enter-immediate');
  scene.paused=false;scene.setRoomCamera();refreshCounts();updateRoomDate();
}

function updateRoomDate(){
  const now=new Date(),hour=now.getHours();
  const phrase=state.language==='zh'?(hour<5?'夜深了，安静陪伴':hour<11?'早安，愿今日清明':hour<18?'午后好，给自己片刻留白':'晚上好，欢迎回来'):(hour<5?'A quiet night. Welcome back.':hour<11?'Good morning. Make space for today.':hour<18?'Good afternoon. Take a quiet pause.':'Good evening. Welcome back.');
  $('#room-date').textContent=state.language==='zh'?`${hour<5?'静夜':hour<11?'晨光':hour<18?'日暖':'晚灯'} · ${String(hour).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`:`${now.toLocaleDateString('en-GB',{day:'numeric',month:'short'})} · ${String(hour).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
  $('[data-i18n="roomGreeting"]').textContent=phrase;
}
function onHover(id){
  const container=$('#hotspots');container.innerHTML='';
  if(!id||state.currentPanel||state.currentHotspot)return;
  const data=scene.room.hotspotData.find(h=>h.id===id);if(!data)return;
  const label=document.createElement('div');label.className='hotspot-label visible';label.textContent=data.title;container.append(label);
  const point=data.group.position.clone().project(scene.camera);
  label.style.left=`${(point.x*.5+.5)*innerWidth}px`;label.style.top=`${(-point.y*.5+.5)*innerHeight-28}px`;
}
function handleService(id){
  if(id==='breathe'){openBreath();return;}
  if(id==='elements'){renderPanel('chart');return;}
  if(id==='tea'){closePanel(false);renderHotspot('tea');return;}
  showModal(`<button class="icon-button panel-close" data-action="close-modal" aria-label="${t('close')}"><i data-lucide="x"></i></button><span class="eyebrow">SERVICE CONCEPT · DEMO</span><div class="about-mark">辰</div><h2 id="modal-title">${t('serviceFourTitle')}</h2><p>${t('serviceFourText')}</p><div class="panel-divider"></div><p>${t('chartExploreText')}</p>${noticeHTML(t('demoReadonly'),'info')}<button class="primary-button" data-action="close-modal">${t('breatheClose')}<i data-lucide="arrow-right"></i></button>`);
}

function bindUI(){
  $('#birth-form').addEventListener('submit',event=>{
    event.preventDefault();const data=new FormData(event.currentTarget);
    enterRoom({birthDate:data.get('birthDate'),birthTime:data.get('birthTime'),city:data.get('birthCity')});
    toast(t('welcomeName',{city:state.profile.city}));
  });
  document.addEventListener('click',async event=>{
    const button=event.target.closest('button,a[data-action],a[data-panel]');if(!button)return;
    if(button.matches('a[href="#"]'))event.preventDefault();
    const action=button.dataset.action;
    if(button.dataset.nav){renderPanel(button.dataset.nav);return;}
    if(button.dataset.panel){renderPanel(button.dataset.panel);return;}
    if(button.dataset.service){handleService(button.dataset.service);return;}
    if(action==='language'){
      state.language=state.language==='zh'?'en':'zh';persist();translateUI();updateRoomDate();
      if(state.entered)toast(state.language==='zh'?'已切换到中文':'Switched to English');
    } else if(action==='home'){closePanel();closeModal();scene.setLandingCamera();$('#landing').classList.remove('hidden');$('#room-ui').classList.add('hidden');}
    else if(action==='close-panel')closePanel();
    else if(action==='close-modal')closeModal();
    else if(action==='reset-view'){scene.resetView();toast(t('resetView'));}
    else if(action==='walk')scene.enterWalk();
    else if(action==='immersive'){
      $('#room-ui').classList.toggle('immersive');button.setAttribute('aria-pressed',$('#room-ui').classList.contains('immersive'));
      button.innerHTML=`<i data-lucide="${$('#room-ui').classList.contains('immersive')?'minimize':'maximize'}"></i>`;iconMarkup();
      if($('#room-ui').classList.contains('immersive'))toast(t('immersiveOn'));
    }
    else if(action==='new-record')newReflection();
    else if(action==='finish-breath')finishBreath();
    else if(action==='again-breath'){state.ritualComplete=false;openBreath();}
    else if(action==='sound'){
      button.disabled=true;
      try{const enabled=await audio.toggle();button.setAttribute('aria-pressed',String(enabled));button.setAttribute('aria-label',enabled?'Mute ambient sound':'Enable ambient sound');button.innerHTML=`<i data-lucide="${enabled?'volume-2':'volume-x'}"></i>`;iconMarkup();toast(t(enabled?'ambientOn':'ambientOff'));}
      catch(error){console.warn('DAORA audio unavailable',error);toast(t('soundUnavailable'));}
      finally{button.disabled=false;}
    }
  });
  document.addEventListener('submit',event=>{
    if(event.target.id!=='reflection-form')return;event.preventDefault();
    const inMemory=$('#reflection-form').dataset.context==='memory';
    if(addRecord($('#reflection-text').value,inMemory?t('memoryNewTitle'):'',inMemory?t('memoryTag'):'',inMemory?'memory':'reflection')){
      closeModal(false);
      if(inMemory)renderHotspot('memory');else renderPanel('records');
      toast(t('recordSaved'));
    }
  });
  document.addEventListener('keydown',event=>{
    if(event.key==='Escape'){
      if(!$('#modal-backdrop').classList.contains('hidden')){event.stopPropagation();closeModal();}
      else if(!$('#panel-backdrop').classList.contains('hidden'))closePanel();
    }
    // A small, explicit trap keeps keyboard focus inside the active dialog.
    if(event.key==='Tab'){
      const container=!$('#modal-backdrop').classList.contains('hidden')?$('#modal'):!$('#panel-backdrop').classList.contains('hidden')?$('#detail-panel'):null;
      if(!container)return;
      const items=$$('button, input, textarea, [tabindex="0"], a[href]',container).filter(el=>!el.disabled&&!el.hidden);
      if(!items.length)return;
      const first=items[0],last=items.at(-1);
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
      else if(!container.contains(document.activeElement)){event.preventDefault();first.focus();}
    }
  },true);
}

function start(){
  translateUI();refreshCounts();
  const form=$('#birth-form');
  $('[name="birthDate"]',form).value=state.profile.birthDate||'1995-05-20';
  $('[name="birthTime"]',form).value=state.profile.birthTime||'08:30';
  $('[name="birthCity"]',form).value=state.profile.city||'Shanghai';
  updateRoomDate();
  try{
    scene=new SanctuaryScene({container:$('#scene'),onHotspot:id=>renderHotspot(id),onHover,onWalkChange:enabled=>{
      $('#walk-help').classList.toggle('hidden',!enabled);
      $('[data-action="walk"]').setAttribute('aria-pressed',String(enabled));
      if(enabled){$('#room-ui').classList.remove('immersive');toast(t('walkOn'));}
      else toast(t('walkOff'));
    },onError:handleError});
  }catch(error){handleError(error);return;}
  audio=new AmbientAudio();
  // Give the renderer one real frame before removing the loading screen.
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    $('#loading').classList.add('leaving');
    setTimeout(()=>$('#loading').classList.add('hidden'),700);
    $('#landing').classList.remove('hidden');
  }));
  bindUI();
  window.daoraDiagnostics=()=>scene?{mode:scene.mode,drawCalls:scene.renderer.info.render.calls,triangles:scene.renderer.info.render.triangles,geometries:scene.renderer.info.memory.geometries,textures:scene.renderer.info.memory.textures,position:scene.camera.position.toArray().map(value=>Number(value.toFixed(2))),webgl:scene.renderer.capabilities.isWebGL2?'WebGL2':'WebGL1',hotspots:scene.room.hotspotData.length,staticBatches:scene.room.staticBatchStats,entered:state.entered,language:state.language,localRecords:state.records.filter(entry=>!entry.sample).length}:null;
  // Test-only local controls. No network endpoint; available solely on this page instance.
  window.daora={getState:()=>({...state,ritual:undefined}),getScene:()=>scene,closePanel,openPanel:renderPanel,enterRoom:()=>enterRoom(),setLanguage:language=>{if(['en','zh'].includes(language)){state.language=language;translateUI();updateRoomDate();}},startBreath:openBreath,finishBreath};
}
// Scene creation is intentionally deferred until application bootstrap; no import-time WebGL side effects.
try{start();}catch(error){console.error('DAORA UI startup failed',error);handleError(error);}
