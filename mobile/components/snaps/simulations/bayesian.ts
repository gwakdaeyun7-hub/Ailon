/**
 * Bayesian Inference interactive simulation — self-contained HTML/JS/Canvas
 *
 * Features:
 * - Coin fairness estimation via Beta-Binomial conjugate model
 * - Prior distribution (Beta) with adjustable alpha/beta sliders
 * - Coin flip area: 1x / 10x / 100x batch flips with running tally
 * - Posterior distribution overlay (prior dashed + posterior filled)
 * - MAP estimate, 95% credible interval, hidden true coin bias reveal
 * - Preset priors: Uniform, Fair Belief, Biased Belief
 * - Dark/light theme, Korean/English bilingual
 */

export function getBayesianSimulationHTML(isDark: boolean, lang: string): string {
  const themeClass = isDark ? 'dark' : '';

  return '<!DOCTYPE html>' +
'<html class="' + themeClass + '"><head><meta charset="utf-8">' +
'<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">' +
'<style>' +
':root{--bg:#FFFFFF;--card:#FFFFFF;--text:#000;--text2:#57534E;--text3:#A8A29E;' +
'--border:#E7E5E4;--surface:#F5F2EE;--teal:#5EEAD4;--tealLight:#F0FDFA;' +
'--accent:#B45309;--red:#DC2626;--green:#15803D}' +
'.dark{--bg:#1A1816;--card:#231F1D;--text:#E7E5E4;--text2:#A8A29E;--text3:#78716C;' +
'--border:#302B28;--surface:#211D1B;--teal:#5EEAD4;--tealLight:#112525;' +
'--accent:#F59E0B;--red:#F87171;--green:#4ADE80}' +
'*{box-sizing:border-box;margin:0;padding:0}' +
'body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:var(--bg);color:var(--text);padding:0;-webkit-user-select:none;user-select:none;overflow-x:hidden}' +
'.panel{border:2px solid var(--border);background:var(--card);margin-bottom:8px;padding:12px}' +
'canvas{width:100%;display:block;border:2px solid var(--border);background:var(--card)}' +
'.label{font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--text3);margin-bottom:6px}' +
'.row{display:flex;align-items:center;gap:8px;margin-bottom:10px}' +
'.row:last-child{margin-bottom:0}' +
'.ctrl-name{font-size:12px;font-weight:600;color:var(--text);min-width:56px;flex-shrink:0}' +
'.ctrl-val{font-size:12px;font-family:monospace;color:var(--teal);min-width:50px;text-align:right;flex-shrink:0}' +
'.ctrl-hint{font-size:10px;color:var(--text3);margin-top:-6px;margin-bottom:8px;padding-left:60px}' +
'input[type=range]{flex:1;min-width:0;accent-color:var(--teal);height:20px}' +
'.btn-row{display:flex;gap:6px;margin-top:4px}' +
'.btn{flex:1;padding:10px 6px;border:2px solid var(--border);background:var(--surface);color:var(--text);font-size:12px;font-weight:700;text-align:center;cursor:pointer;letter-spacing:0.5px;-webkit-tap-highlight-color:transparent}' +
'.btn:active{opacity:0.7}' +
'.btn-primary{background:var(--teal);border-color:var(--teal);color:#1A1816}' +
'.btn-stop{background:var(--accent);border-color:var(--accent);color:#1A1816}' +
'.stats{font-family:monospace;font-size:11px;line-height:2;color:var(--text2)}' +
'.stats .hi{color:var(--teal);font-weight:700}' +
'.stats .warn{color:var(--accent);font-weight:700}' +
'.preset-row{display:flex;gap:6px;margin-bottom:8px}' +
'.preset{flex:1;padding:12px 4px;border:2px solid var(--border);background:var(--surface);color:var(--text2);font-size:10px;font-weight:700;text-align:center;cursor:pointer;letter-spacing:0.3px}' +
'.preset:active{opacity:0.7}' +
'.preset.active{border-color:var(--teal);color:var(--teal)}' +
'.coin-seq{display:flex;flex-wrap:wrap;gap:3px;margin-top:6px}' +
'.coin-badge{width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;font-family:monospace;border:2px solid var(--border)}' +
'.coin-h{background:var(--tealLight);color:var(--teal);border-color:var(--teal)}' +
'.coin-t{background:var(--surface);color:var(--accent);border-color:var(--accent)}' +
'.tally{font-family:monospace;font-size:13px;color:var(--text);margin-top:8px;line-height:1.8}' +
'.tally-val{font-weight:700}' +
'.tally-h{color:var(--teal)}' +
'.tally-t{color:var(--accent)}' +
'.reveal-row{display:flex;align-items:center;gap:8px;margin-top:8px}' +
'.reveal-btn{padding:14px 12px;border:2px solid var(--border);background:var(--surface);color:var(--text2);font-size:11px;font-weight:700;cursor:pointer}' +
'.reveal-btn:active{opacity:0.7}' +
'.reveal-val{font-family:monospace;font-size:13px;font-weight:700;color:var(--accent)}' +
'</style></head><body>' +

// ── Prior Distribution Panel ──
'<div class="panel"><div class="label" id="lbl-prior"></div>' +
'<canvas id="cvPrior" height="180"></canvas></div>' +

// ── Parameters Panel ──
'<div class="panel"><div class="label" id="lbl-params"></div>' +
'<div class="preset-row">' +
'<div class="preset active" id="pre0" onclick="onPreset(0)"></div>' +
'<div class="preset" id="pre1" onclick="onPreset(1)"></div>' +
'<div class="preset" id="pre2" onclick="onPreset(2)"></div>' +
'</div>' +
'<div class="row"><span class="ctrl-name">\u03B1</span>' +
'<input type="range" id="slA" min="1" max="40" value="2" oninput="onSlider()">' +
'<span class="ctrl-val" id="valA"></span></div>' +
'<div class="ctrl-hint" id="hint-a"></div>' +
'<div class="row"><span class="ctrl-name">\u03B2</span>' +
'<input type="range" id="slB" min="1" max="40" value="2" oninput="onSlider()">' +
'<span class="ctrl-val" id="valB"></span></div>' +
'<div class="ctrl-hint" id="hint-b"></div>' +
'</div>' +

// ── Coin Flip Panel ──
'<div class="panel"><div class="label" id="lbl-flip"></div>' +
'<div class="btn-row">' +
'<div class="btn btn-primary" id="btnFlip1" onclick="doFlip(1)"></div>' +
'<div class="btn" id="btnFlip10" onclick="doFlip(10)"></div>' +
'<div class="btn" id="btnFlip100" onclick="doFlip(100)"></div>' +
'<div class="btn" id="btnReset" onclick="onReset()"></div>' +
'</div>' +
'<div class="tally" id="tallyBox"></div>' +
'<div class="coin-seq" id="coinSeq"></div>' +
'<div class="reveal-row">' +
'<div class="reveal-btn" id="btnReveal" onclick="onReveal()"></div>' +
'<span class="reveal-val" id="revealVal"></span>' +
'</div>' +
'</div>' +

// ── Posterior Distribution Panel ──
'<div class="panel"><div class="label" id="lbl-post"></div>' +
'<canvas id="cvPost" height="180"></canvas></div>' +

// ── Stats Panel ──
'<div class="panel"><div class="label" id="lbl-stats"></div>' +
'<div class="stats" id="statsBox"></div></div>' +

'<script>' +
'var LANG="' + lang + '";' +

// ── Labels ──
'var L={' +
'ko:{prior:"\\uC0AC\\uC804 \\uBD84\\uD3EC",post:"\\uC0AC\\uD6C4 \\uBD84\\uD3EC",flip:"\\uB3D9\\uC804 \\uB358\\uC9C0\\uAE30",params:"\\uD30C\\uB77C\\uBBF8\\uD130",stats:"\\uD1B5\\uACC4",' +
'hintA:"\\uC55E\\uBA74 \\uAD00\\uCE21\\uAC12 \\uAC00\\uC911\\uCE58 (\\uB192\\uC744\\uC218\\uB85D \\uC55E\\uBA74 \\uB9DE\\uC74C)",' +
'hintB:"\\uB4B7\\uBA74 \\uAD00\\uCE21\\uAC12 \\uAC00\\uC911\\uCE58 (\\uB192\\uC744\\uC218\\uB85D \\uB4B7\\uBA74 \\uB9DE\\uC74C)",' +
'pre0:"\\uADE0\\uB4F1 \\uC0AC\\uC804\\uBD84\\uD3EC",pre1:"\\uACF5\\uC815 \\uBBFF\\uC74C",pre2:"\\uD3B8\\uD5A5 \\uBBFF\\uC74C",' +
'flip1:"1\\uD68C",flip10:"10\\uD68C",flip100:"100\\uD68C",reset:"\\u21BA \\uB9AC\\uC14B",' +
'heads:"\\uC55E\\uBA74",tails:"\\uB4B7\\uBA74",total:"\\uCD1D",' +
'priorMean:"\\uC0AC\\uC804 \\uD3C9\\uADE0",postMean:"\\uC0AC\\uD6C4 \\uD3C9\\uADE0",obsRate:"\\uAD00\\uCE21 \\uBE44\\uC728",' +
'ci:"95% \\uC2E0\\uB8B0 \\uAD6C\\uAC04",map:"MAP \\uCD94\\uC815",flips:"\\uB358\\uC9C0\\uAE30",' +
'showTrue:"\\uCC38 \\uD655\\uB960 \\uD45C\\uC2DC",hideTrue:"\\uCC38 \\uD655\\uB960 \\uC228\\uAE30\\uAE30",trueP:"\\uCC38 \\uD655\\uB960",' +
'waiting:"\\uC0AC\\uC804 \\uBD84\\uD3EC\\uB97C \\uC124\\uC815\\uD558\\uACE0 \\uB3D9\\uC804\\uC744 \\uB358\\uC838\\uBCF4\\uC138\\uC694",' +
'insight:"\\uB370\\uC774\\uD130\\uAC00 \\uC30D\\uC77C\\uC218\\uB85D \\uC0AC\\uC804 \\uBD84\\uD3EC\\uC758 \\uC601\\uD5A5\\uC774 \\uC904\\uC5B4\\uB4ED\\uB2C8\\uB2E4",' +
'priorL:"\\uC0AC\\uC804",postL:"\\uC0AC\\uD6C4"},' +
'en:{prior:"PRIOR DISTRIBUTION",post:"POSTERIOR DISTRIBUTION",flip:"COIN FLIP",params:"PARAMETERS",stats:"STATISTICS",' +
'hintA:"Pseudo-count for heads (higher = expect more heads)",' +
'hintB:"Pseudo-count for tails (higher = expect more tails)",' +
'pre0:"Uniform Prior",pre1:"Fair Belief",pre2:"Biased Belief",' +
'flip1:"1x",flip10:"10x",flip100:"100x",reset:"\\u21BA Reset",' +
'heads:"Heads",tails:"Tails",total:"Total",' +
'priorMean:"Prior Mean",postMean:"Post Mean",obsRate:"Observed Rate",' +
'ci:"95% Credible Int.",map:"MAP Estimate",flips:"Flips",' +
'showTrue:"Show True Prob",hideTrue:"Hide True Prob",trueP:"True Prob",' +
'waiting:"Set prior and flip the coin",' +
'insight:"More data \\u2192 prior influence diminishes",' +
'priorL:"Prior",postL:"Posterior"}' +
'};' +
'var T=L[LANG]||L.en;' +

// ── State ──
'var priorA=1,priorB=1,heads=0,tails=0,totalFlips=0;' +
'var coinHistory=[];' +
'var trueProb=Math.round((0.15+Math.random()*0.7)*100)/100;' +
'var revealed=false;' +

// ── Canvas DPR setup ──
'function setupCanvas(cv,h){' +
'var dpr=window.devicePixelRatio||1;' +
'var w=cv.parentElement.clientWidth-4;' +
'cv.style.width=w+"px";cv.style.height=h+"px";' +
'cv.width=w*dpr;cv.height=h*dpr;' +
'var ctx=cv.getContext("2d");ctx.scale(dpr,dpr);return{w:w,h:h}}' +

// ── Log-Gamma (Lanczos) ──
'function lnGamma(z){' +
'var g=7;var c=[0.99999999999980993,676.5203681218851,-1259.1392167224028,771.32342877765313,' +
'-176.61502916214059,12.507343278686905,-0.13857109526572012,9.9843695780195716e-6,1.5056327351493116e-7];' +
'if(z<0.5)return Math.log(Math.PI/Math.sin(Math.PI*z))-lnGamma(1-z);' +
'z-=1;var x=c[0];for(var i=1;i<g+2;i++)x+=c[i]/(z+i);' +
'var t=z+g+0.5;return 0.5*Math.log(2*Math.PI)+(z+0.5)*Math.log(t)-t+Math.log(x)}' +

// ── Beta PDF ──
'function betaPDF(x,a,b){' +
'if(x<=0||x>=1)return 0;' +
'return Math.exp((a-1)*Math.log(x)+(b-1)*Math.log(1-x)-lnGamma(a)-lnGamma(b)+lnGamma(a+b))}' +

// ── Beta CDF via numerical integration (Simpson) ──
'function betaCDF(x,a,b){' +
'if(x<=0)return 0;if(x>=1)return 1;' +
'var n=200;var h=x/n;var s=betaPDF(0.0001,a,b)+betaPDF(x,a,b);' +
'for(var i=1;i<n;i++){var xi=i*h;s+=betaPDF(xi,a,b)*(i%2===0?2:4)}' +
'return s*h/3}' +

// ── Beta quantile via bisection ──
'function betaQuantile(p,a,b){' +
'var lo=0,hi=1;for(var i=0;i<60;i++){var mid=(lo+hi)/2;' +
'if(betaCDF(mid,a,b)<p)lo=mid;else hi=mid}return(lo+hi)/2}' +

// ── Draw Beta distribution curve ──
'function drawBeta(canvasId,a,b,overlayA,overlayB,showOverlay){' +
'var cv=document.getElementById(canvasId);' +
'var dim=setupCanvas(cv,180);var w=dim.w,h=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var textC=cs.getPropertyValue("--text3").trim();' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var accentC=cs.getPropertyValue("--accent").trim();' +
'var pad=36;var pr=16;var pb=26;var pt=14;' +
'var pw=w-pad-pr;var ph=h-pt-pb;' +
// sample points
'var N=200;var pts=[];var maxY=0;' +
'for(var i=0;i<=N;i++){var x=0.001+0.998*i/N;var y=betaPDF(x,a,b);pts.push({x:x,y:y});if(y>maxY)maxY=y}' +
// overlay points if showing
'var oPts=[];var oMax=0;' +
'if(showOverlay){for(var i=0;i<=N;i++){var x=0.001+0.998*i/N;var y=betaPDF(x,overlayA,overlayB);oPts.push({x:x,y:y});if(y>oMax)oMax=y}}' +
'var scaleMax=Math.max(maxY,oMax)||1;scaleMax*=1.1;' +
// coord helpers
'function toX(v){return pad+v*pw}' +
'function toY(v){return pt+(scaleMax-v)/scaleMax*ph}' +
// axes
'ctx.strokeStyle=borderC;ctx.lineWidth=1;' +
'ctx.beginPath();ctx.moveTo(pad,pt);ctx.lineTo(pad,h-pb);ctx.lineTo(w-pr,h-pb);ctx.stroke();' +
// x ticks
'ctx.fillStyle=textC;ctx.font="9px monospace";ctx.textAlign="center";' +
'for(var v=0;v<=10;v+=2){var xv=v/10;ctx.fillText(xv.toFixed(1),toX(xv),h-pb+14);' +
'if(v>0&&v<10){ctx.strokeStyle=borderC;ctx.setLineDash([2,3]);ctx.beginPath();ctx.moveTo(toX(xv),pt);ctx.lineTo(toX(xv),h-pb);ctx.stroke();ctx.setLineDash([])}}' +
// y tick (max)
'ctx.textAlign="right";ctx.fillText(scaleMax.toFixed(1),pad-4,pt+4);' +
'ctx.fillText("0",pad-4,h-pb+4);' +
// draw overlay (prior on posterior canvas) — dashed, faint
'if(showOverlay&&oPts.length>0){' +
'ctx.strokeStyle=accentC;ctx.lineWidth=1.5;ctx.globalAlpha=0.5;ctx.setLineDash([5,4]);ctx.beginPath();' +
'for(var i=0;i<=N;i++){var px=toX(oPts[i].x),py=toY(oPts[i].y);if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py)}ctx.stroke();' +
'ctx.setLineDash([]);ctx.globalAlpha=1}' +
// 95% credible interval shading
'if(canvasId==="cvPost"&&totalFlips>0){' +
'var postA=priorA+heads,postB=priorB+tails;' +
'var lo95=betaQuantile(0.025,postA,postB);var hi95=betaQuantile(0.975,postA,postB);' +
'ctx.fillStyle=tealC;ctx.globalAlpha=0.12;ctx.beginPath();' +
'var started=false;' +
'for(var i=0;i<=N;i++){var x=pts[i].x;if(x>=lo95&&x<=hi95){var px=toX(x),py=toY(pts[i].y);if(!started){ctx.moveTo(px,h-pb);ctx.lineTo(px,py);started=true}else{ctx.lineTo(px,py)}}}' +
'if(started){ctx.lineTo(toX(Math.min(hi95,0.999)),h-pb);ctx.closePath();ctx.fill()}' +
'ctx.globalAlpha=1}' +
// draw main curve filled
'ctx.beginPath();ctx.moveTo(toX(pts[0].x),h-pb);' +
'for(var i=0;i<=N;i++){ctx.lineTo(toX(pts[i].x),toY(pts[i].y))}' +
'ctx.lineTo(toX(pts[N].x),h-pb);ctx.closePath();' +
'ctx.fillStyle=tealC;ctx.globalAlpha=0.15;ctx.fill();ctx.globalAlpha=1;' +
// stroke curve
'ctx.strokeStyle=tealC;ctx.lineWidth=2;ctx.beginPath();' +
'for(var i=0;i<=N;i++){var px=toX(pts[i].x),py=toY(pts[i].y);if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py)}ctx.stroke();' +
// MAP line (mode)
'var mode=(a-1)/(a+b-2);' +
'if(a>1&&b>1){' +
'ctx.strokeStyle=accentC;ctx.lineWidth=1.5;ctx.setLineDash([4,3]);' +
'ctx.beginPath();ctx.moveTo(toX(mode),pt);ctx.lineTo(toX(mode),h-pb);ctx.stroke();ctx.setLineDash([]);' +
'ctx.fillStyle=accentC;ctx.font="9px monospace";ctx.textAlign="center";ctx.fillText("MAP "+mode.toFixed(2),toX(mode),pt-2)}' +
// mean line
'var mean=a/(a+b);' +
'ctx.strokeStyle=tealC;ctx.lineWidth=1;ctx.setLineDash([2,2]);' +
'ctx.beginPath();ctx.moveTo(toX(mean),pt+10);ctx.lineTo(toX(mean),h-pb);ctx.stroke();ctx.setLineDash([]);' +
// true prob line if revealed
'if(revealed){' +
'ctx.strokeStyle=cs.getPropertyValue("--green").trim();ctx.lineWidth=2;ctx.setLineDash([6,3]);' +
'ctx.beginPath();ctx.moveTo(toX(trueProb),pt);ctx.lineTo(toX(trueProb),h-pb);ctx.stroke();ctx.setLineDash([])}' +
// legend
'ctx.font="10px -apple-system,sans-serif";ctx.textAlign="left";' +
'if(showOverlay){' +
'ctx.strokeStyle=accentC;ctx.lineWidth=1.5;ctx.globalAlpha=0.5;ctx.setLineDash([5,4]);' +
'ctx.beginPath();ctx.moveTo(pad+4,pt+4);ctx.lineTo(pad+20,pt+4);ctx.stroke();ctx.setLineDash([]);ctx.globalAlpha=1;' +
'ctx.fillStyle=textC;ctx.fillText(T.priorL,pad+24,pt+8);' +
'ctx.strokeStyle=tealC;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(pad+70,pt+4);ctx.lineTo(pad+86,pt+4);ctx.stroke();' +
'ctx.fillText(T.postL,pad+90,pt+8)}' +
'}' +

// ── Draw all ──
'function drawAll(){' +
'drawBeta("cvPrior",priorA,priorB,0,0,false);' +
'var postA=priorA+heads,postB=priorB+tails;' +
'if(totalFlips>0){drawBeta("cvPost",postA,postB,priorA,priorB,true)}' +
'else{drawBeta("cvPost",priorA,priorB,0,0,false)}}' +

// ── Update tally text ──
'function updateTally(){' +
'var box=document.getElementById("tallyBox");' +
'if(totalFlips===0){box.innerHTML="";return}' +
'var rate=(heads/totalFlips*100).toFixed(1);' +
'box.innerHTML="<span class=\\"tally-val tally-h\\">"+T.heads+": "+heads+"</span>"' +
'+" &nbsp;|&nbsp; <span class=\\"tally-val tally-t\\">"+T.tails+": "+tails+"</span>"' +
'+" &nbsp;|&nbsp; "+T.total+": "+totalFlips' +
'+" &nbsp;|&nbsp; "+rate+"%"}' +

// ── Update coin sequence badges ──
'function updateSeq(){' +
'var box=document.getElementById("coinSeq");var s="";' +
'var start=Math.max(0,coinHistory.length-20);' +
'for(var i=start;i<coinHistory.length;i++){' +
'var isH=coinHistory[i];' +
's+="<div class=\\"coin-badge "+(isH?"coin-h\\"":"coin-t\\"")+">"+' +
'(isH?"H":"T")+"</div>"}' +
'box.innerHTML=s}' +

// ── Update stats panel ──
'function updateStats(){' +
'var box=document.getElementById("statsBox");' +
'if(totalFlips===0){box.innerHTML=T.waiting;return}' +
'var postA=priorA+heads,postB=priorB+tails;' +
'var prMean=priorA/(priorA+priorB);' +
'var poMean=postA/(postA+postB);' +
'var obsRate=heads/totalFlips;' +
'var lo95=betaQuantile(0.025,postA,postB);' +
'var hi95=betaQuantile(0.975,postA,postB);' +
'var mapVal=(postA>1&&postB>1)?(postA-1)/(postA+postB-2):poMean;' +
'var s="<span class=\\"hi\\">"+T.priorMean+"</span> "+prMean.toFixed(4)+"<br>";' +
's+="<span class=\\"hi\\">"+T.postMean+"</span> "+poMean.toFixed(4)+"<br>";' +
's+=T.obsRate+": <span class=\\"warn\\">"+obsRate.toFixed(4)+"</span><br>";' +
's+=T.map+": "+mapVal.toFixed(4)+"<br>";' +
's+=T.ci+": ["+lo95.toFixed(3)+", "+hi95.toFixed(3)+"]<br>";' +
's+=T.flips+": <span class=\\"hi\\">"+heads+"H / "+tails+"T</span> (n="+totalFlips+")<br>";' +
// insight when data overwhelms prior
'if(totalFlips>=10){s+="<br><span class=\\"warn\\">"+T.insight+"</span>"}' +
'box.innerHTML=s}' +

// ── Coin flip logic ──
'function doFlip(n){' +
'for(var i=0;i<n;i++){' +
'var isHead=Math.random()<trueProb;' +
'if(isHead)heads++;else tails++;' +
'totalFlips++;coinHistory.push(isHead)}' +
'drawAll();updateTally();updateSeq();updateStats();notifyHeight()}' +

// ── Slider change ──
'function onSlider(){' +
'priorA=+document.getElementById("slA").value/2;' +
'priorB=+document.getElementById("slB").value/2;' +
'document.getElementById("valA").textContent=priorA.toFixed(1);' +
'document.getElementById("valB").textContent=priorB.toFixed(1);' +
'highlightPreset();drawAll();updateStats();notifyHeight()}' +

// ── Preset buttons ──
'var PRESETS=[{a:1,b:1},{a:10,b:10},{a:2,b:8}];' +
'function onPreset(idx){' +
'priorA=PRESETS[idx].a;priorB=PRESETS[idx].b;' +
'document.getElementById("slA").value=priorA*2;' +
'document.getElementById("slB").value=priorB*2;' +
'document.getElementById("valA").textContent=priorA.toFixed(1);' +
'document.getElementById("valB").textContent=priorB.toFixed(1);' +
'highlightPreset();drawAll();updateStats();notifyHeight()}' +

'function highlightPreset(){' +
'for(var i=0;i<3;i++){' +
'var el=document.getElementById("pre"+i);' +
'var match=Math.abs(priorA-PRESETS[i].a)<0.01&&Math.abs(priorB-PRESETS[i].b)<0.01;' +
'el.className=match?"preset active":"preset"}}' +

// ── Reveal true probability ──
'function onReveal(){' +
'revealed=!revealed;' +
'document.getElementById("btnReveal").textContent=revealed?T.hideTrue:T.showTrue;' +
'document.getElementById("revealVal").textContent=revealed?(T.trueP+": "+trueProb.toFixed(2)):"";' +
'drawAll();notifyHeight()}' +

// ── Reset ──
'function onReset(){' +
'heads=0;tails=0;totalFlips=0;coinHistory=[];' +
'trueProb=Math.round((0.15+Math.random()*0.7)*100)/100;' +
'revealed=false;' +
'document.getElementById("btnReveal").textContent=T.showTrue;' +
'document.getElementById("revealVal").textContent="";' +
'drawAll();updateTally();updateSeq();updateStats();notifyHeight()}' +

// ── Height notification ──
'function notifyHeight(){' +
'var h=document.body.scrollHeight+20;' +
'try{window.ReactNativeWebView.postMessage(JSON.stringify({type:"height",value:h}))}catch(e){}}' +

// ── Init labels ──
'document.getElementById("lbl-prior").textContent=T.prior;' +
'document.getElementById("lbl-post").textContent=T.post;' +
'document.getElementById("lbl-flip").textContent=T.flip;' +
'document.getElementById("lbl-params").textContent=T.params;' +
'document.getElementById("lbl-stats").textContent=T.stats;' +
'document.getElementById("pre0").textContent=T.pre0;' +
'document.getElementById("pre1").textContent=T.pre1;' +
'document.getElementById("pre2").textContent=T.pre2;' +
'document.getElementById("btnFlip1").textContent=T.flip1;' +
'document.getElementById("btnFlip10").textContent=T.flip10;' +
'document.getElementById("btnFlip100").textContent=T.flip100;' +
'document.getElementById("btnReset").textContent=T.reset;' +
'document.getElementById("btnReveal").textContent=T.showTrue;' +
'document.getElementById("hint-a").textContent=T.hintA;' +
'document.getElementById("hint-b").textContent=T.hintB;' +

// ── Init ──
'onPreset(0);' +
'window.addEventListener("resize",function(){drawAll();notifyHeight()});' +
'setTimeout(notifyHeight,100);' +

'</script></body></html>';
}
