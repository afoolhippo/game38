(()=>{"use strict";
const $=s=>document.querySelector(s);
const screens={title:$("#titleScreen"),game:$("#gameScreen"),result:$("#resultScreen")};
const scene=$("#scene"),ctx=scene.getContext("2d"),visitorImage=$("#visitorImage");
const shave=$("#shaveCanvas"),sx=shave.getContext("2d");
const clock=$("#clock"),moneyEl=$("#money"),cupsEl=$("#cups"),speaker=$("#speaker"),dialogue=$("#dialogue"),nextMark=$("#nextMark");
const box=$("#dialogueBox"),choices=$("#choices"),hint=$("#firstHint"),panel=$("#shavePanel"),shaveHint=$("#shaveHint"),shaveBtn=$("#shaveBtn"),orderLabel=$("#orderLabel");
const bgm=$("#bgm"),furin=$("#furin"),semi=$("#semi"),shaveSound=$("#shaveSound");

const CHAR_IMAGES={boy:"boy.png",girl:"girl.png",oldwoman:"oldwoman.png",worker:"worker.png",adult:"adult.png",dog:"dog.png",cat:"cat.png"};
const FLAVORS={
 strawberry:{label:"いちご",color:"#e85b65",price:200},
 melon:{label:"メロン",color:"#63ad62",price:200},
 blue:{label:"ブルーハワイ",color:"#4c92d9",price:200},
 ujikintoki:{label:"宇治金時",color:"#73924f",price:250,beans:true},
 milk:{label:"練乳",color:"#f2e7c9",price:220}
};

let money=0,cups=0,goodwill=0,step=0,busy=false,waitingAdvance=false,firstTap=true;
let queue=[],currentVisitor=null,weather="sun",shaving=false,amount=0,raf=0,shaveResolved=false,currentOrder=null,currentAction=null;
let syrupProgress=0,syrupRAF=0;
const times=["10:00","10:40","11:20","12:10","13:00","13:50","14:40","15:30","16:20","17:10","18:00"];

const pools={
 morning:[
  {type:"order",visitor:"boy",who:"小学生",text:"おじちゃん！ いちごひとつ！",flavor:"strawberry"},
  {type:"choice",visitor:"oldwoman",who:"常連のおばあさん",text:"暑いねぇ。今日はほんとに暑い。",options:[["暑いのう",0,1,"おじいさん","暑いのう。"],["冷たいお茶を出す",0,2,"おじいさん","かき氷屋じゃが、お茶もあるぞ。"],["宇治金時をすすめる",250,1,"常連のおばあさん","じゃあ、ひとつもらおうかね。"]]},
  {type:"ambient",visitor:"cat",who:"おじいさん",text:"また店先に猫が来たのう。そこが涼しいんか？"},
  {type:"ambient",who:"おじいさん",text:"風鈴の音は、暑い日ほど涼しく聞こえるのう。",sound:"furin"},
  {type:"ambient",who:"おじいさん",text:"セミは朝から元気じゃのう。",sound:"semi"},
  {type:"ambient",who:"おじいさん",text:"氷旗も今日はよう揺れとる。"}
 ],
 noon:[
  {type:"order",visitor:"girl",who:"小学生",text:"ブルーハワイください！",flavor:"blue"},
  {type:"order",visitor:"boy",who:"小学生",text:"メロン！ 山盛り！",flavor:"melon"},
  {type:"choice",visitor:"girl",who:"小学生",text:"100円しかないけど、かき氷食べたい…。",options:[["小さいのを作る",100,1,"おじいさん","ほい。100円分じゃ。"],["普通のを作ってやる",100,3,"おじいさん","内緒じゃぞ。"],["今日は200円じゃ",0,-1,"おじいさん","また小銭を握っておいで。"]]},
  {type:"rain",who:"おじいさん",text:"おや。急に暗くなったのう。夕立じゃ。"},
  {type:"ambient",visitor:"dog",who:"犬",text:"ワン！ ワン！"},
  {type:"choice",visitor:"dog",who:"おじいさん",text:"暑そうじゃの。",options:[["水をあげる",0,2,"おじいさん","ほれ、冷たい水じゃ。"],["日陰へ呼ぶ",0,1,"おじいさん","こっちへ来い。そこは涼しいぞ。"]]},
  {type:"ambient",who:"おじいさん",text:"さっきまでうるさかったセミが、急に静かになったのう。"},
  {type:"ambient",who:"おじいさん",text:"昼はさすがに暑すぎるわい。"}
 ],
 afternoon:[
  {type:"order",visitor:"oldwoman",who:"常連のおばあさん",text:"今日は宇治金時にしようかね。",flavor:"ujikintoki"},
  {type:"choice",visitor:"girl",who:"小学生",text:"練乳いっぱいにして！",options:[["ちょっと多め",220,1,"おじいさん","これくらいにしとこう。"],["たっぷり",220,2,"おじいさん","今日は特別じゃ。"],["いつも通り",220,0,"おじいさん","甘すぎると氷が泣くぞ。"]]},
  {type:"ambient",visitor:"cat",who:"おじいさん",text:"猫はまだ寝とる。自由じゃのう。"},
  {type:"ambient",who:"おじいさん",text:"自転車が一台、店の前を通っていった。"},
  {type:"ambient",who:"おじいさん",text:"風が少し出てきたのう。",sound:"furin"},
  {type:"ambient",who:"おじいさん",text:"氷もだいぶ減ってきた。"}
 ],
 evening:[
  {type:"order",visitor:"worker",who:"会社員",text:"まだやってます？ ブルーハワイをひとつ。",flavor:"blue"},
  {type:"order",visitor:"worker",who:"会社員",text:"仕事帰りに、いちごをひとつお願いします。",flavor:"strawberry"},
  {type:"ambient",visitor:"cat",who:"おじいさん",text:"猫もそろそろ帰る時間かの。"},
  {type:"ambient",who:"おじいさん",text:"西日がまぶしいのう。"},
  {type:"ambient",who:"おじいさん",text:"今日はあと何杯つくれるかの。"}
 ],
 rare:[
  {type:"rareSeq",visitor:"adult",lines:[["男性","おじさん、まだこの店やってたんですね。"],["おじいさん","……誰じゃったかの？"],["男性","子どものころ、毎週ここで宇治金時を食べてました。"]]},
  {type:"rareSeq",visitor:"oldwoman",lines:[["常連のおばあさん","この店も長いねぇ。"],["おじいさん","気づけば何十年じゃ。"],["常連のおばあさん","昔は50円だったかねぇ。"]]},
  {type:"rareSeq",visitor:"girl",lines:[["小学生","お母さんも子どものころここに来たって！"],["おじいさん","そうかそうか。"],["小学生","だから同じいちごにする！"]]}
 ]
};

function pick(arr){return arr[Math.floor(Math.random()*arr.length)]}
function uniquePicks(arr,n){
 const copy=[...arr],res=[];while(copy.length&&res.length<n){res.push(copy.splice(Math.floor(Math.random()*copy.length),1)[0])}return res;
}
function buildDay(){
 const q=[];
 q.push({type:"ambient",at:0,who:"おじいさん",text:"さて、今日もぼちぼちやるかの。"});
 uniquePicks(pools.morning,2).forEach((e,i)=>q.push({...e,at:1+i}));
 uniquePicks(pools.noon,3).forEach((e,i)=>q.push({...e,at:3+i}));
 uniquePicks(pools.afternoon,2).forEach((e,i)=>q.push({...e,at:6+i}));
 uniquePicks(pools.evening,1).forEach(e=>q.push({...e,at:8}));
 if(Math.random()<.55)q.push({...pick(pools.rare),at:9});
 else q.push({...pick(pools.evening),at:9});
 q.push({type:"close",at:10,who:"おじいさん",text:"さて、今日はここまでじゃ。"});
 return q;
}
function show(name){Object.values(screens).forEach(s=>s.classList.remove("active"));screens[name].classList.add("active")}
function safePlay(a,vol){try{a.volume=vol;a.currentTime=0;const p=a.play();if(p&&p.catch)p.catch(()=>{})}catch(e){}}
function stop(a){try{a.pause();a.currentTime=0}catch(e){}}
function stopAll(){[bgm,furin,semi,shaveSound].forEach(stop)}
function reset(){
 money=0;cups=0;goodwill=0;step=0;busy=false;waitingAdvance=false;firstTap=true;queue=buildDay();weather="sun";
 moneyEl.textContent=0;cupsEl.textContent=0;clock.textContent=times[0];choices.classList.add("hidden");panel.classList.add("hidden");hint.style.display="block";
 setVisitor(null,true);
}
function start(){stopAll();reset();show("game");drawScene();presentNext()}
function setVisitor(type,immediate=false){
 const apply=()=>{
  currentVisitor=type||null;
  if(!type){visitorImage.classList.add("hidden");visitorImage.removeAttribute("src");visitorImage.removeAttribute("data-char");return}
  visitorImage.src=CHAR_IMAGES[type];visitorImage.dataset.char=type;visitorImage.classList.remove("hidden");
  requestAnimationFrame(()=>visitorImage.classList.remove("fade"));
 };
 if(immediate){apply();return}
 visitorImage.classList.add("fade");
 setTimeout(apply,220);
}
function pauseBeat(nextText="……"){
 busy=true;waitingAdvance=false;nextMark.style.display="none";setVisitor(null);
 setTimeout(()=>{speaker.textContent="";dialogue.textContent=nextText;busy=false;waitingAdvance=true;currentAction=()=>presentNext();nextMark.style.display="block"},260);
}
function setText(who,text,advance=true){speaker.textContent=who;dialogue.textContent=text;waitingAdvance=advance;nextMark.style.display=advance?"block":"none"}
function playSceneSound(name){if(name==="furin")safePlay(furin,.42);if(name==="semi")safePlay(semi,.28)}
function presentNext(){
 if(busy)return;if(!queue.length){finish();return}
 const ev=queue.shift();step=Math.max(step,ev.at);clock.textContent=times[Math.min(step,10)];
 setVisitor(ev.visitor||null);if(ev.type==="rain")weather="rain";else if(step>5)weather="sun";drawScene();playSceneSound(ev.sound);
 if(ev.type==="order"){setText(ev.who,ev.text,true);currentAction=()=>openShave(ev.flavor)}
 else if(ev.type==="choice"){setText(ev.who,ev.text,false);showChoices(ev.options);currentAction=null}
 else if(ev.type==="rareSeq"){runRare(ev)}
 else if(ev.type==="close"){setText(ev.who,ev.text,true);currentAction=()=>finish()}
 else{setText(ev.who,ev.text,true);currentAction=()=>pauseBeat()}
}
function runRare(ev){
 let i=0;busy=false;
 const nextLine=()=>{const line=ev.lines[i++];setText(line[0],line[1],true);currentAction=()=>{if(i<ev.lines.length)nextLine();else pauseBeat("チリン……")}};
 nextLine();
}
function advance(){
 if(busy||!waitingAdvance)return;
 if(firstTap){firstTap=false;hint.style.display="none"}waitingAdvance=false;nextMark.style.display="none";
 const fn=currentAction;currentAction=null;if(fn)fn();else presentNext();
}
box.addEventListener("click",advance);box.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();advance()}});

function showChoices(opts){
 busy=true;choices.innerHTML="";choices.classList.remove("hidden");
 opts.forEach(o=>{const b=document.createElement("button");b.className="choice-btn";b.textContent=o[0];
 b.onclick=()=>{money+=o[1];goodwill+=o[2];moneyEl.textContent=money;if(o[0].includes("作る")||o[0].includes("宇治金時")||o[0].includes("練乳"))cups++;cupsEl.textContent=cups;
 choices.classList.add("hidden");busy=false;setText(o[3],o[4],true);currentAction=()=>pauseBeat()};choices.appendChild(b)});
}

function openShave(flavorKey){
 busy=true;waitingAdvance=false;amount=0;shaving=false;shaveResolved=false;syrupProgress=0;
 currentOrder={key:flavorKey,...FLAVORS[flavorKey]};orderLabel.textContent=`注文：${currentOrder.label}`;
 panel.classList.remove("hidden");shaveHint.textContent="長押しで氷を削ろう。いいところで離す。";drawShave();
}
function beginShave(e){
 e.preventDefault();if(shaving||shaveResolved)return;shaving=true;
 safePlay(bgm,.10);bgm.loop=true;safePlay(shaveSound,.58);shaveSound.loop=true;
 let last=performance.now();
 const loop=now=>{
  if(!shaving||shaveResolved)return;amount=Math.min(1.28,amount+(now-last)/2300);last=now;
  if(amount<.48)shaveHint.textContent="シャリ… シャリシャリ…";
  else if(amount<.72)shaveHint.textContent="まだ少し小さい…";
  else if(amount<1.00)shaveHint.textContent="ふわっと、いい山になってきた";
  else if(amount<1.17)shaveHint.textContent="山盛り！ そろそろ危ない…";
  else shaveHint.textContent="グラグラしている！";
  drawShave();
  if(amount>=1.28){shaving=false;resolveShave(true);return}
  raf=requestAnimationFrame(loop);
 };raf=requestAnimationFrame(loop);
}
function stopShaveAudio(){stop(bgm);stop(shaveSound)}
function endShave(e){if(e)e.preventDefault();if(!shaving||shaveResolved)return;shaving=false;cancelAnimationFrame(raf);stopShaveAudio();resolveShave(false)}
function resolveShave(forced){
 if(shaveResolved)return;shaveResolved=true;shaving=false;cancelAnimationFrame(raf);stopShaveAudio();cups++;
 let bonus=0,msg="";
 if(forced||amount>=1.17){bonus=-100;msg="ドサッ！ 欲張りすぎて崩れてしもうた。";drawCollapse();finishShaveResult(bonus,msg);return}
 if(amount<.48){bonus=-50;msg="……ちと少なかったかの。";}
 else if(amount<.72){bonus=0;msg="まあ、こんなもんじゃろ。";}
 else if(amount<=1.00){bonus=50;msg="ほい、ふわふわにできたぞ。";}
 else{bonus=20;msg="おお、山盛りじゃ。崩れんでよかった。";}
 animateSyrup(()=>finishShaveResult(bonus,msg));
}
function finishShaveResult(bonus,msg){
 money+=Math.max(0,currentOrder.price+bonus);moneyEl.textContent=money;cupsEl.textContent=cups;shaveHint.textContent=msg;
 setTimeout(()=>{panel.classList.add("hidden");busy=false;setText("おじいさん",msg,true);currentAction=()=>pauseBeat()},1050);
}
function animateSyrup(done){
 const start=performance.now();shaveHint.textContent=`${currentOrder.label}シロップをかける…`;
 const anim=now=>{syrupProgress=Math.min(1,(now-start)/520);drawShave();if(syrupProgress<1)syrupRAF=requestAnimationFrame(anim);else setTimeout(done,280)};
 syrupRAF=requestAnimationFrame(anim);
}
shaveBtn.addEventListener("pointerdown",beginShave,{passive:false});
["pointerup","pointercancel","pointerleave"].forEach(x=>shaveBtn.addEventListener(x,endShave,{passive:false}));
window.addEventListener("pointerup",e=>{if(shaving)endShave(e)},{passive:false});

function drawScene(){
 const w=scene.width,h=scene.height;ctx.imageSmoothingEnabled=false;
 let sky=step>=8?"#e7a16e":"#8bcbd7";if(weather==="rain")sky="#76858d";
 ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);ctx.fillStyle=step>=8?"#d39a6b":"#f0cf83";ctx.fillRect(0,112,w,h-112);
 ctx.fillStyle="#755f4b";ctx.fillRect(248,50,7,150);ctx.fillRect(228,52,50,5);
 ctx.fillStyle="#eee5ce";ctx.fillRect(255,80,65,105);ctx.fillStyle="#99785e";ctx.fillRect(266,102,17,26);ctx.fillRect(293,102,16,26);
 ctx.fillStyle="#68402a";ctx.fillRect(0,30,210,20);ctx.fillStyle="#a86739";ctx.fillRect(6,50,198,210);
 ctx.fillStyle="#3e3028";ctx.fillRect(18,69,170,151);ctx.fillStyle="#ead5a0";ctx.fillRect(24,75,158,139);
 ctx.fillStyle="#4f7892";ctx.fillRect(28,79,148,30);for(let x=58;x<176;x+=39){ctx.fillStyle="#ead5a0";ctx.fillRect(x,101,3,9)}
 ctx.fillStyle="#75452c";ctx.fillRect(0,218,221,39);ctx.fillStyle="#bf7b43";ctx.fillRect(0,216,221,8);
 ctx.fillStyle="#d45843";ctx.fillRect(128,145,48,12);ctx.fillStyle="#e8efe1";ctx.fillRect(136,157,31,42);ctx.fillStyle="#453a33";ctx.fillRect(169,148,25,5);ctx.fillRect(190,148,5,22);
 ["#d74f50","#5d9f59","#428ec0"].forEach((c,i)=>{ctx.fillStyle=c;ctx.fillRect(84+i*13,188,8,24);ctx.fillStyle="#eee1b4";ctx.fillRect(86+i*13,184,4,5)});
 ctx.fillStyle="#fff7df";ctx.fillRect(213,17,51,72);ctx.strokeStyle="#44352d";ctx.lineWidth=3;ctx.strokeRect(213,17,51,72);ctx.fillStyle="#c84c45";ctx.font="bold 34px serif";ctx.fillText("氷",220,66);
 ctx.fillStyle="#76543d";ctx.fillRect(0,257,w,93);ctx.fillStyle="#594131";ctx.fillRect(49,270,38,7);ctx.fillRect(54,277,5,28);ctx.fillRect(78,277,5,28);
 if(weather==="rain")drawRain();
}
function drawRain(){ctx.save();ctx.strokeStyle="#d9f2f5";ctx.lineWidth=2;for(let i=0;i<34;i++){let x=(i*47+step*13)%330,y=(i*31)%260;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-7,y+14);ctx.stroke()}ctx.restore()}

function drawShave(){
 const w=shave.width,h=shave.height;sx.imageSmoothingEnabled=false;sx.clearRect(0,0,w,h);
 sx.fillStyle="#b9deda";sx.fillRect(0,0,w,h);sx.fillStyle="#a86a3b";sx.fillRect(0,194,w,56);sx.fillStyle="#70452d";sx.fillRect(0,190,w,8);
 sx.fillStyle="#cf5745";sx.fillRect(28,23,108,18);sx.fillStyle="#713c31";sx.fillRect(42,41,12,112);sx.fillRect(111,41,12,112);
 sx.fillStyle="#e8eee1";sx.fillRect(58,48,48,62);sx.strokeStyle="#43352e";sx.lineWidth=4;sx.strokeRect(58,48,48,62);
 sx.fillStyle="#44362f";sx.fillRect(130,28,66,7);sx.fillRect(190,28,8,36);sx.fillRect(193,59,27,7);
 if(amount>0){sx.fillStyle="#f5ffff";for(let i=0;i<12;i++){let px=155+(i*17)%55,py=75+(i*23+Math.floor(amount*80))%85;sx.fillRect(px,py,5,7)}}
 sx.fillStyle="#fff2cf";sx.beginPath();sx.moveTo(142,190);sx.lineTo(278,190);sx.lineTo(257,230);sx.lineTo(164,230);sx.closePath();sx.fill();sx.strokeStyle="#44352e";sx.lineWidth=4;sx.stroke();
 const levels=Math.floor(amount*11);sx.fillStyle="#f4ffff";sx.strokeStyle="#799a9b";sx.lineWidth=2;
 for(let i=0;i<levels;i++){const yy=186-i*10,half=Math.max(12,58-i*4)+(amount>1?Math.floor((amount-1)*35):0);sx.fillRect(210-half,yy-9,half*2,11);sx.strokeRect(210-half,yy-9,half*2,11)}
 if(syrupProgress>0&&currentOrder){
  const colored=Math.max(1,Math.floor(levels*syrupProgress));
  sx.fillStyle=currentOrder.color;
  for(let i=0;i<colored;i++){
   const yy=186-i*10,half=Math.max(10,54-i*4);
   const width=Math.max(10,half*2*(.45+.45*syrupProgress));
   sx.fillRect(210-width/2,yy-7,width,7);
  }
  if(currentOrder.beans&&syrupProgress>.55){
   sx.fillStyle="#6b3b2c";
   [[198,142],[215,149],[225,137],[207,129],[190,153]].forEach(p=>sx.fillRect(p[0],p[1],6,5));
  }
 }
 if(amount>1.03){sx.fillStyle="#c54d43";sx.fillRect(272,91,5,26);sx.fillRect(272,124,5,6);sx.fillRect(137,91,5,26);sx.fillRect(137,124,5,6)}
}
function drawCollapse(){sx.fillStyle="#f5ffff";for(let i=0;i<28;i++)sx.fillRect(120+Math.random()*170,130+Math.random()*90,5+Math.random()*8,5+Math.random()*7)}
function drawResult(){
 const c=$("#resultCanvas"),r=c.getContext("2d");r.imageSmoothingEnabled=false;r.fillStyle="#e99a62";r.fillRect(0,0,300,115);r.fillStyle="#77506d";r.fillRect(0,75,300,40);
 r.fillStyle="#f4d96c";r.fillRect(228,18,30,30);r.fillStyle="#6b432c";r.fillRect(28,54,112,45);r.fillStyle="#bd7540";r.fillRect(22,49,124,9);
 r.fillStyle="#fff4d5";r.fillRect(165,68,70,22);r.fillStyle="#f7ffff";r.fillRect(173,55,54,16);r.fillRect(181,45,38,12);
}
function finish(){
 stopAll();$("#resultMoney").textContent=money;$("#resultCups").textContent=cups;
 let q=cups>=4?"おじいさん「今日はよう働いたわい。」":goodwill>=4?"おじいさん「ええ一日じゃったのう。」":"おじいさん「まあ、こんなもんじゃろ。」";
 $("#resultQuote").textContent=q;show("result");drawResult();
}
function title(){shaving=false;cancelAnimationFrame(raf);cancelAnimationFrame(syrupRAF);stopAll();show("title")}
$("#startBtn").onclick=start;$("#againBtn").onclick=start;$("#homeBtn").onclick=title;$("#backBtn").onclick=title;
drawShave();
})();