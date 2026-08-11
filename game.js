(()=>{"use strict";
const $=s=>document.querySelector(s);
const GAME_ID="game38";
const GAME_TITLE="かき氷じいさん";
const GAME_URL="https://afoolhippo.github.io/game38/";
const ARCADE_URL="https://afoolhippo.github.io/home/";
const SUPABASE_URL="https://gmncxnybsovlallxgnkd.supabase.co";
const SUPABASE_ANON_KEY="sb_publishable_ly3h5OhL8HDSHhYdmJq_Fw_9pG3mhla";
const kabaDb=(window.supabase)?supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY):null;

const screens={title:$("#titleScreen"),game:$("#gameScreen"),result:$("#resultScreen")};
const scene=$("#scene"),ctx=scene.getContext("2d"),visitor=$("#visitorImage");
const shave=$("#shaveCanvas"),sx=shave.getContext("2d");
const clock=$("#clock"),moneyEl=$("#money"),cupsEl=$("#cups"),speaker=$("#speaker"),dialogue=$("#dialogue"),nextMark=$("#nextMark");
const box=$("#dialogueBox"),choices=$("#choices"),hint=$("#firstHint"),panel=$("#shavePanel"),shaveHint=$("#shaveHint"),shaveBtn=$("#shaveBtn"),orderLabel=$("#orderLabel");
const bgm=$("#bgm"),furin=$("#furin"),semi=$("#semi"),shaveSound=$("#shaveSound");
const resultButtons=$("#resultButtons"),registerButton=$("#registerButton");

const CHARS={boy:"boy.png",girl:"girl.png",oldwoman:"oldwoman.png",worker:"worker.png",adult:"adult.png",cat:"cat.png"};
const FLAVORS={
 strawberry:{label:"いちご",color:"#e85b65",price:200},
 melon:{label:"メロン",color:"#63ad62",price:200},
 blue:{label:"ブルーハワイ",color:"#4c92d9",price:200},
 ujikintoki:{label:"宇治金時",color:"#73924f",price:250,beans:true}
};

let money=0,cups=0,goodwill=0,busy=false,waiting=false,firstTap=true,currentAction=null;
let queue=[],step=0,currentOrder=null,shaving=false,amount=0,raf=0,shaveResolved=false,syrupProgress=0,syrupRAF=0;
let scoreRegistered=false,resultTimer=null,semiTimer=null;
const times=["10:00","10:45","11:30","12:15","13:00","14:00","15:00","16:00","17:00","17:35","18:00"];

function buildDay(){
 const opening={at:0,type:"ambient",who:"おじいさん",text:"さて、今日もぼちぼちやるかの。",sound:"furin"};

 const morningCustomers=[
  {type:"order",visitor:"boy",who:"小学生",text:"おじちゃん！ いちごひとつ！",flavor:"strawberry"},
  {type:"order",visitor:"girl",who:"小学生",text:"メロンください！",flavor:"melon"},
  {type:"talkOrder",visitor:"oldwoman",who:"常連のおばあさん",text:"朝から暑いねぇ。",reply:"朝の宇治金時も悪くないぞ。",flavor:"ujikintoki"}
 ];
 const morningBreaks=[
  {type:"ambient",who:"おじいさん",text:"今日も暑くなりそうじゃ。",sound:"semi"},
  {type:"ambient",who:"おじいさん",text:"風鈴がよう鳴るのう。",sound:"furin"},
  {type:"ambient",who:"おじいさん",text:"まだ午前じゃというのに暑いわい。"},
  {type:"ambient",visitor:"cat",who:"おじいさん",text:"おや、猫か。涼しいところをよう知っとる。"}
 ];
 const noonCustomers=[
  {type:"choiceOrder",visitor:"girl",who:"小学生",text:"100円しかないけど、かき氷食べたい…。",
   options:[
    {label:"小さいのを作る",price:100,goodwill:1,reply:"ほい。100円分じゃ。",flavor:"strawberry"},
    {label:"普通のを作ってやる",price:100,goodwill:3,reply:"内緒じゃぞ。",flavor:"strawberry"},
    {label:"今日は200円じゃ",price:0,goodwill:-1,reply:"また小銭を握っておいで。",flavor:null}
   ]},
  {type:"order",visitor:"boy",who:"小学生",text:"ブルーハワイってどんな味？ それにする！",flavor:"blue"},
  {type:"talkOrder",visitor:"oldwoman",who:"常連のおばあさん",text:"暑いねぇ。今日はほんとに暑い。",reply:"まあ、宇治金時でも食べていきなされ。",flavor:"ujikintoki"}
 ];
 const afternoonCustomers=[
  {type:"order",visitor:"boy",who:"小学生",text:"今日はメロン！ 山盛りで！",flavor:"melon"},
  {type:"order",visitor:"girl",who:"小学生",text:"いちご、ふわふわにして！",flavor:"strawberry"},
  {type:"order",visitor:"oldwoman",who:"常連のおばあさん",text:"いつもの宇治金時をひとつ。",flavor:"ujikintoki"},
  {type:"order",visitor:"boy",who:"小学生",text:"青いやつ！ ブルーハワイ！",flavor:"blue"}
 ];
 const afternoonBreaks=[
  {type:"ambient",who:"おじいさん",text:"風が少し出てきたのう。",sound:"furin"},
  {type:"ambient",who:"おじいさん",text:"氷もだいぶ減ってきたわい。"},
  {type:"ambient",who:"おじいさん",text:"セミはまだ元気じゃのう。",sound:"semi"},
  {type:"ambient",visitor:"cat",who:"おじいさん",text:"また来たんか。今日は一日ここにおる気かの。"}
 ];
 const eveningCustomers=[
  {type:"order",visitor:"worker",who:"会社員",text:"まだやってます？ ブルーハワイをひとつ。",flavor:"blue"},
  {type:"order",visitor:"worker",who:"会社員",text:"仕事帰りに、いちごをひとつお願いします。",flavor:"strawberry"},
  {type:"order",visitor:"adult",who:"男性",text:"久しぶりに宇治金時、ひとつお願いします。",flavor:"ujikintoki"},
  {type:"order",visitor:"girl",who:"小学生",text:"間に合った！ 最後にメロンひとつ！",flavor:"melon"}
 ];
 const eveningMoments=[
  {type:"ambient",who:"おじいさん",text:"西日がまぶしいのう。そろそろ店じまいじゃ。"},
  {type:"ambient",who:"おじいさん",text:"今日もよう削ったのう。"},
  {type:"rare",visitor:"adult",lines:[
    ["男性","おじさん、まだこの店やってたんですね。"],
    ["おじいさん","……誰じゃったかの？"],
    ["男性","子どものころ、ここでよく食べてました。"]
  ]}
 ];

 const choose=a=>({...a[Math.floor(Math.random()*a.length)]});
 const q=[
  opening,
  {...choose(morningCustomers),at:1},
  {...choose(morningBreaks),at:2},
  {...choose(noonCustomers),at:3},
  {...choose(afternoonCustomers),at:5},
  {...choose(afternoonBreaks),at:6},
  {...choose(afternoonCustomers),at:7},
  {...choose(eveningCustomers),at:8},
  {...choose(eveningMoments),at:9},
  {at:10,type:"close",who:"おじいさん",text:"さて、今日はここまでじゃ。"}
 ];
 return q;
}
function show(name){Object.values(screens).forEach(s=>s.classList.remove("active"));screens[name].classList.add("active")}
function play(a,vol,restart=true){try{a.volume=vol;if(restart)a.currentTime=0;const p=a.play();if(p&&p.catch)p.catch(()=>{})}catch(e){}}
function stop(a){try{a.pause();a.currentTime=0}catch(e){}}
function startBgm(){bgm.loop=true;play(bgm,.085,false)}
function stopAll(){[bgm,furin,semi,shaveSound].forEach(stop);clearTimeout(semiTimer)}
function shortSemi(){stop(semi);play(semi,.26);clearTimeout(semiTimer);semiTimer=setTimeout(()=>stop(semi),2800)}
function sceneSound(s){if(s==="furin")play(furin,.40);if(s==="semi")shortSemi()}

function reset(){
 money=0;cups=0;goodwill=0;busy=false;waiting=false;firstTap=true;currentAction=null;queue=buildDay();step=0;
 moneyEl.textContent=0;cupsEl.textContent=0;clock.textContent=times[0];choices.classList.add("hide");panel.classList.add("hide");hint.style.display="block";
 scoreRegistered=false;registerButton.disabled=false;registerButton.textContent="記録を登録";resultButtons.classList.add("hidden");
 setVisitor(null,true);
}
function start(){clearTimeout(resultTimer);stopAll();reset();show("game");startBgm();drawScene();present()}
function setVisitor(type,instant=false){
 const apply=()=>{
  if(!type){visitor.classList.add("hidden-char");setTimeout(()=>{if(visitor.classList.contains("hidden-char"))visitor.removeAttribute("src")},260);return}
  visitor.src=CHARS[type];visitor.dataset.char=type;visitor.classList.remove("hidden-char");
 };
 if(instant){apply();return}
 visitor.classList.add("hidden-char");setTimeout(apply,240);
}
function setText(who,text,canAdvance=true){speaker.textContent=who;dialogue.textContent=text;waiting=canAdvance;nextMark.style.display=canAdvance?"block":"none"}
function beat(text="……"){
 busy=true;waiting=false;nextMark.style.display="none";setVisitor(null);
 setTimeout(()=>{busy=false;setText("おじいさん",text,true);currentAction=()=>present()},300);
}
function present(){
 if(busy)return;if(!queue.length){finish();return}
 const ev=queue.shift();step=ev.at;clock.textContent=times[step];setVisitor(ev.visitor||null);drawScene();sceneSound(ev.sound);
 if(ev.type==="order"){setText(ev.who,ev.text,true);currentAction=()=>openShave(ev.flavor)}
 else if(ev.type==="choiceOrder"){setText(ev.who,ev.text,false);showChoiceOrder(ev.options)}
 else if(ev.type==="talkOrder"){setText(ev.who,ev.text,true);currentAction=()=>{setText("おじいさん",ev.reply,true);currentAction=()=>openShave(ev.flavor)}}
 else if(ev.type==="rare"){runRare(ev)}
 else if(ev.type==="close"){setText(ev.who,ev.text,true);currentAction=finish}
 else{setText(ev.who,ev.text,true);currentAction=()=>beat()}
}
function advance(){
 if(busy||!waiting)return;if(firstTap){firstTap=false;hint.style.display="none"}
 waiting=false;nextMark.style.display="none";const fn=currentAction;currentAction=null;if(fn)fn();else present();
}
box.addEventListener("click",advance);
box.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();advance()}});

function showChoiceOrder(opts){
 busy=true;choices.innerHTML="";choices.classList.remove("hide");
 opts.forEach(o=>{
  const b=document.createElement("button");b.className="choice-btn";b.textContent=o.label;
  b.onclick=()=>{
   choices.classList.add("hide");busy=false;goodwill+=o.goodwill;
   setText("おじいさん",o.reply,true);
   currentAction=o.flavor?()=>openShave(o.flavor,o.price):()=>beat();
  };choices.appendChild(b);
 });
}
function runRare(ev){
 let i=0;
 const next=()=>{const l=ev.lines[i++];setText(l[0],l[1],true);currentAction=()=>i<ev.lines.length?next():beat("チリン……")};next();
}

function openShave(flavorKey,overridePrice=null){
 busy=true;waiting=false;amount=0;shaving=false;shaveResolved=false;syrupProgress=0;
 currentOrder={key:flavorKey,...FLAVORS[flavorKey]};if(overridePrice!==null)currentOrder.price=overridePrice;
 orderLabel.textContent=`注文：${currentOrder.label}`;panel.classList.remove("hide");shaveHint.textContent="長押しで氷を削ろう。いいところで離す。";drawShave();
}
function beginShave(e){
 e.preventDefault();if(shaving||shaveResolved)return;shaving=true;bgm.volume=.045;shaveSound.loop=true;play(shaveSound,.58);
 let last=performance.now();
 const loop=now=>{
  if(!shaving||shaveResolved)return;amount=Math.min(1.28,amount+(now-last)/2300);last=now;
  shaveHint.textContent=amount<.48?"シャリ… シャリシャリ…":amount<.72?"まだ少し小さい…":amount<1?"ふわっと、いい山になってきた":amount<1.17?"山盛り！ そろそろ危ない…":"グラグラしている！";
  drawShave();if(amount>=1.28){shaving=false;resolveShave(true);return}raf=requestAnimationFrame(loop);
 };raf=requestAnimationFrame(loop);
}
function stopShavingSound(){stop(shaveSound);bgm.volume=.085}
function endShave(e){if(e)e.preventDefault();if(!shaving||shaveResolved)return;shaving=false;cancelAnimationFrame(raf);stopShavingSound();resolveShave(false)}
function resolveShave(forced){
 if(shaveResolved)return;shaveResolved=true;stopShavingSound();cups++;
 let bonus=0,msg="";
 if(forced||amount>=1.17){bonus=-100;msg="ドサッ！ 欲張りすぎて崩れてしもうた。";drawCollapse();return completeShave(bonus,msg)}
 if(amount<.48){bonus=-50;msg="……ちと少なかったかの。"}
 else if(amount<.72){msg="まあ、こんなもんじゃろ。"}
 else if(amount<=1){bonus=50;msg="ほい、ふわふわにできたぞ。"}
 else{bonus=20;msg="おお、山盛りじゃ。崩れんでよかった。"}
 animateSyrup(()=>completeShave(bonus,msg));
}
function completeShave(bonus,msg){
 money+=Math.max(0,currentOrder.price+bonus);moneyEl.textContent=money;cupsEl.textContent=cups;shaveHint.textContent=msg;
 setTimeout(()=>{panel.classList.add("hide");busy=false;setText("おじいさん",msg,true);currentAction=()=>beat()},900);
}
function animateSyrup(done){
 const st=performance.now();shaveHint.textContent=`${currentOrder.label}シロップをかける…`;
 const f=now=>{syrupProgress=Math.min(1,(now-st)/550);drawShave();if(syrupProgress<1)syrupRAF=requestAnimationFrame(f);else setTimeout(done,250)};syrupRAF=requestAnimationFrame(f);
}
shaveBtn.addEventListener("pointerdown",beginShave,{passive:false});
["pointerup","pointercancel","pointerleave"].forEach(x=>shaveBtn.addEventListener(x,endShave,{passive:false}));
window.addEventListener("pointerup",e=>{if(shaving)endShave(e)},{passive:false});

function drawScene(){
 const w=scene.width,h=scene.height;ctx.imageSmoothingEnabled=false;
 const sky=step>=8?"#e7a16e":"#8bcbd7";ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
 ctx.fillStyle=step>=8?"#d39a6b":"#f0cf83";ctx.fillRect(0,112,w,h-112);
 ctx.fillStyle="#755f4b";ctx.fillRect(248,50,7,150);ctx.fillRect(228,52,50,5);
 ctx.fillStyle="#eee5ce";ctx.fillRect(255,80,65,105);ctx.fillStyle="#99785e";ctx.fillRect(266,102,17,26);ctx.fillRect(293,102,16,26);
 ctx.fillStyle="#68402a";ctx.fillRect(0,30,210,20);ctx.fillStyle="#a86739";ctx.fillRect(6,50,198,210);ctx.fillStyle="#3e3028";ctx.fillRect(18,69,170,151);
 ctx.fillStyle="#ead5a0";ctx.fillRect(24,75,158,139);ctx.fillStyle="#4f7892";ctx.fillRect(28,79,148,30);
 ctx.fillStyle="#75452c";ctx.fillRect(0,218,221,39);ctx.fillStyle="#bf7b43";ctx.fillRect(0,216,221,8);
 ctx.fillStyle="#d45843";ctx.fillRect(128,145,48,12);ctx.fillStyle="#e8efe1";ctx.fillRect(136,157,31,42);ctx.fillStyle="#453a33";ctx.fillRect(169,148,25,5);ctx.fillRect(190,148,5,22);
 ["#d74f50","#5d9f59","#428ec0"].forEach((c,i)=>{ctx.fillStyle=c;ctx.fillRect(84+i*13,188,8,24)});
 ctx.fillStyle="#fff7df";ctx.fillRect(213,17,51,72);ctx.strokeStyle="#44352d";ctx.lineWidth=3;ctx.strokeRect(213,17,51,72);ctx.fillStyle="#c84c45";ctx.font="bold 34px serif";ctx.fillText("氷",220,66);
 ctx.fillStyle="#76543d";ctx.fillRect(0,257,w,93);ctx.fillStyle="#594131";ctx.fillRect(49,270,38,7);ctx.fillRect(54,277,5,28);ctx.fillRect(78,277,5,28);
}
function drawShave(){
 sx.imageSmoothingEnabled=false;sx.clearRect(0,0,300,250);sx.fillStyle="#b9deda";sx.fillRect(0,0,300,250);
 sx.fillStyle="#a86a3b";sx.fillRect(0,194,300,56);sx.fillStyle="#70452d";sx.fillRect(0,190,300,8);
 sx.fillStyle="#cf5745";sx.fillRect(28,23,108,18);sx.fillStyle="#713c31";sx.fillRect(42,41,12,112);sx.fillRect(111,41,12,112);
 sx.fillStyle="#e8eee1";sx.fillRect(58,48,48,62);sx.strokeStyle="#43352e";sx.lineWidth=4;sx.strokeRect(58,48,48,62);
 sx.fillStyle="#44362f";sx.fillRect(130,28,66,7);sx.fillRect(190,28,8,36);sx.fillRect(193,59,27,7);
 if(amount>0){sx.fillStyle="#f5ffff";for(let i=0;i<12;i++)sx.fillRect(155+(i*17)%55,75+(i*23+Math.floor(amount*80))%85,5,7)}
 sx.fillStyle="#fff2cf";sx.beginPath();sx.moveTo(142,190);sx.lineTo(278,190);sx.lineTo(257,230);sx.lineTo(164,230);sx.closePath();sx.fill();sx.stroke();
 const levels=Math.floor(amount*11);sx.fillStyle="#f4ffff";sx.strokeStyle="#799a9b";sx.lineWidth=2;
 for(let i=0;i<levels;i++){const yy=186-i*10,half=Math.max(12,58-i*4)+(amount>1?Math.floor((amount-1)*35):0);sx.fillRect(210-half,yy-9,half*2,11);sx.strokeRect(210-half,yy-9,half*2,11)}
 if(syrupProgress>0&&currentOrder&&levels>0){
  sx.fillStyle=currentOrder.color;
  const colored=Math.max(1,Math.floor(levels*syrupProgress));
  /* 山頂（大きいi）から下段（小さいi）へ染み込ませる */
  for(let n=0;n<colored;n++){
   const i=(levels-1)-n;
   if(i<0)break;
   const yy=186-i*10,half=Math.max(10,52-i*4),spread=.48+.42*syrupProgress;
   const ww=half*2*spread;
   sx.fillRect(210-ww/2,yy-8,ww,7);
  }
  /* 上から垂れる細いシロップ筋 */
  const topY=186-(levels-1)*10-14;
  const dripLen=Math.min(38,8+Math.floor(syrupProgress*34));
  sx.fillRect(205,Math.max(48,topY-dripLen),5,dripLen);
  sx.fillRect(216,Math.max(52,topY-dripLen+7),4,Math.max(5,dripLen-7));
  if(currentOrder.beans&&syrupProgress>.55){
   sx.fillStyle="#6b3b2c";
   [[205,topY+12],[216,topY+18],[198,topY+23],[224,topY+27],[211,topY+31]].forEach(p=>sx.fillRect(p[0],p[1],6,5));
  }
 }
}
function drawCollapse(){sx.fillStyle="#f5ffff";for(let i=0;i<28;i++)sx.fillRect(120+Math.random()*170,130+Math.random()*90,5+Math.random()*8,5+Math.random()*7)}

function finish(){
 stopAll();$("#resultMoney").textContent=money;$("#resultCups").textContent=cups;
 $("#resultQuote").textContent=money>=1000?"今日はよう売れたのう。":money>=700?"今日もよう削ったのう。":"まあ、こんな日もあるわい。";
 show("result");resultButtons.classList.add("hidden");clearTimeout(resultTimer);resultTimer=setTimeout(()=>resultButtons.classList.remove("hidden"),1500);
}
$("#shareButton").onclick=()=>{
 const text=`🍧 かき氷じいさんで遊びました！\n\n本日の売上：${money}円\n\n今日も暑い一日。\nじいさんは、せっせとかき氷を削りました。\n\n${GAME_URL}\n\n#カバゲーセン\n#かき氷じいさん`;
 window.open("https://twitter.com/intent/tweet?text="+encodeURIComponent(text),"_blank","noopener");
};
registerButton.onclick=async()=>{
 if(scoreRegistered){alert("この記録は登録済みです");return}
 if(!kabaDb){alert("記録登録の準備ができていません");return}
 const nickname=prompt("ニックネームを入力してね","匿名カバ");if(!nickname)return;
 registerButton.disabled=true;registerButton.textContent="登録中...";
 const rank=money>=1000?"大繁盛":money>=700?"いい一日":"のんびり営業";
 const {error}=await kabaDb.from("kaba_scores").insert({game_id:GAME_ID,game_title:GAME_TITLE,nickname:nickname.trim().slice(0,20),rank_title:rank,score:money});
 if(error){console.error(error);registerButton.disabled=false;registerButton.textContent="記録を登録";alert("登録に失敗しました");return}
 scoreRegistered=true;registerButton.textContent="登録済み";alert("記録を登録しました！");
};
$("#retryButton").onclick=()=>{stopAll();reset();show("title")};
$("#arcadeButton").onclick=()=>location.href=ARCADE_URL;
$("#startBtn").onclick=start;
$("#backBtn").onclick=()=>{stopAll();show("title")};
})();