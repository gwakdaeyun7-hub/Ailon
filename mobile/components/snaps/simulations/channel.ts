/**
 * Channel Capacity — Shannon's channel coding theorem
 *
 * Features:
 * - Pipeline: Sender -> Channel (noise) -> Receiver with bit animations
 * - Capacity graph: C vs SNR with current marker
 * - Bandwidth, Signal Power, Noise Power, Transmission Rate sliders
 * - "Send Burst" button: 100 bits through channel
 * - C = B*log2(1+SNR) display
 * - Bit animation: colored squares flowing through pipe
 * - Dark/light theme, Korean/English bilingual
 */

export function getChannelSimulationHTML(isDark: boolean, lang: string): string {
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
'input[type=range]{flex:1;min-width:0;accent-color:var(--teal);height:20px}' +
'.btn-row{display:flex;gap:6px;margin-top:4px}' +
'.btn{flex:1;padding:10px 6px;border:2px solid var(--border);background:var(--surface);color:var(--text);font-size:12px;font-weight:700;text-align:center;cursor:pointer;letter-spacing:0.5px;-webkit-tap-highlight-color:transparent}' +
'.btn:active{opacity:0.7}' +
'.btn-primary{background:var(--teal);border-color:var(--teal);color:#1A1816}' +
'.btn-stop{background:var(--accent);border-color:var(--accent);color:#1A1816}' +
'.stats{font-family:monospace;font-size:11px;line-height:2;color:var(--text2)}' +
'.stats .hi{color:var(--teal);font-weight:700}' +
'.stats .warn{color:var(--accent);font-weight:700}' +
'</style></head><body>' +

// ── Pipeline Canvas ──
'<div class="panel"><div class="label" id="lbl-pipe"></div>' +
'<canvas id="cvPipe" height="140"></canvas></div>' +

// ── Capacity Graph Canvas ──
'<div class="panel"><div class="label" id="lbl-cap"></div>' +
'<canvas id="cvCap" height="160"></canvas></div>' +

// ── Controls ──
'<div class="panel"><div class="label" id="lbl-ctrl"></div>' +

// Bandwidth
'<div class="row"><span class="ctrl-name" id="lblBW"></span>' +
'<input type="range" id="slBW" min="1" max="20" value="5" oninput="onParam()">' +
'<span class="ctrl-val" id="valBW"></span></div>' +

// Signal Power
'<div class="row"><span class="ctrl-name" id="lblSig"></span>' +
'<input type="range" id="slSig" min="1" max="100" value="50" oninput="onParam()">' +
'<span class="ctrl-val" id="valSig"></span></div>' +

// Noise Power
'<div class="row"><span class="ctrl-name" id="lblNoise"></span>' +
'<input type="range" id="slNoise" min="1" max="100" value="10" oninput="onParam()">' +
'<span class="ctrl-val" id="valNoise"></span></div>' +

// Transmission Rate
'<div class="row"><span class="ctrl-name" id="lblRate"></span>' +
'<input type="range" id="slRate" min="1" max="100" value="20" oninput="onParam()">' +
'<span class="ctrl-val" id="valRate"></span></div>' +

// Buttons
'<div class="btn-row">' +
'<div class="btn btn-primary" id="btnSend" onclick="sendBurst()"></div>' +
'<div class="btn btn-stop" id="btnReset" onclick="doReset()"></div>' +
'</div></div>' +

// ── Stats ──
'<div class="panel"><div class="label" id="lbl-stats"></div>' +
'<div class="stats" id="statsBox"></div></div>' +

'<script>' +
'var LANG="' + lang + '";' +
'var L={' +
'ko:{pipe:"\\uCC44\\uB110 \\uD30C\\uC774\\uD504\\uB77C\\uC778",' +
'cap:"\\uCC44\\uB110 \\uC6A9\\uB7C9 \\uADF8\\uB798\\uD504",' +
'ctrl:"\\uD30C\\uB77C\\uBBF8\\uD130",stats:"\\uD1B5\\uACC4",' +
'bw:"\\uB300\\uC5ED\\uD3ED(B)",sig:"\\uC2E0\\uD638(S)",noise:"\\uC7A1\\uC74C(N)",rate:"\\uC804\\uC1A1\\uB960",' +
'send:"100\\uBE44\\uD2B8 \\uC804\\uC1A1",reset:"\\u21BA \\uB9AC\\uC14B",' +
'capacity:"\\uCC44\\uB110 \\uC6A9\\uB7C9",snr:"SNR",ber:"\\uBE44\\uD2B8 \\uC624\\uB958\\uC728(BER)",' +
'txRate:"\\uC804\\uC1A1\\uB960",sent:"\\uC804\\uC1A1",errors:"\\uC624\\uB958",' +
'success:"\\uC131\\uACF5",sender:"\\uC1A1\\uC2E0\\uAE30",receiver:"\\uC218\\uC2E0\\uAE30",' +
'noiseZone:"\\uC7A1\\uC74C \\uC601\\uC5ED",danger:"\\uC704\\uD5D8! \\uC6A9\\uB7C9 \\uCD08\\uACFC",' +
'safe:"\\uC6A9\\uB7C9 \\uC774\\uB0B4",hz:"kHz",bps:"kbps",db:"dB",' +
'totalSent:"\\uCD1D \\uC804\\uC1A1",totalErr:"\\uCD1D \\uC624\\uB958"},' +
'en:{pipe:"CHANNEL PIPELINE",' +
'cap:"CAPACITY GRAPH",' +
'ctrl:"PARAMETERS",stats:"STATISTICS",' +
'bw:"Band(B)",sig:"Signal(S)",noise:"Noise(N)",rate:"Tx Rate",' +
'send:"Send 100 Bits",reset:"\\u21BA Reset",' +
'capacity:"Channel Capacity",snr:"SNR",ber:"Bit Error Rate(BER)",' +
'txRate:"Tx Rate",sent:"Sent",errors:"Errors",' +
'success:"Success",sender:"Sender",receiver:"Receiver",' +
'noiseZone:"Noise Zone",danger:"DANGER! Over Capacity",' +
'safe:"Within Capacity",hz:"kHz",bps:"kbps",db:"dB",' +
'totalSent:"Total Sent",totalErr:"Total Errors"}' +
'};' +
'var T=L[LANG]||L.en;' +

// ── State ──
'var bandwidth=5;var sigPower=50;var noisePower=10;var txRate=20;' +
'var totalSent=0;var totalErrors=0;' +
'var bits=[];' + // animated bits: {x,corrupted,phase}
'var animFrame=null;var animating=false;' +
'var lastBurstErrors=0;var lastBurstSent=0;' +

// ── Canvas DPR setup ──
'function setupCanvas(cv,h){' +
'var dpr=window.devicePixelRatio||1;' +
'var w=cv.parentElement.clientWidth-4;' +
'cv.style.width=w+"px";cv.style.height=h+"px";' +
'cv.width=w*dpr;cv.height=h*dpr;' +
'var ctx=cv.getContext("2d");ctx.scale(dpr,dpr);return{w:w,h:h}}' +

// ── Compute capacity ──
'function computeC(){' +
'var snr=sigPower/noisePower;' +
'return bandwidth*Math.log(1+snr)/Math.LN2}' +

'function computeSNR_dB(){' +
'return 10*Math.log(sigPower/noisePower)/Math.LN10}' +

// ── Compute BER based on rate vs capacity ──
'function computeBER(){' +
'var C=computeC();' +
'if(txRate<=C)return 0.001;' +
'var excess=txRate/C-1;' +
'return Math.min(0.5,0.001+excess*0.3)}' +

// ── Draw pipeline ──
'function drawPipe(){' +
'var cv=document.getElementById("cvPipe");' +
'var dim=setupCanvas(cv,140);var w=dim.w,h=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var accentC=cs.getPropertyValue("--accent").trim();' +
'var redC=cs.getPropertyValue("--red").trim();' +
'var greenC=cs.getPropertyValue("--green").trim();' +
'var text3C=cs.getPropertyValue("--text3").trim();' +
'var textC=cs.getPropertyValue("--text").trim();' +

// layout: sender box | pipe | receiver box
'var boxW=50;var boxH=50;' +
'var senderX=16;var senderY=(h-boxH)/2;' +
'var receiverX=w-boxW-16;var receiverY=(h-boxH)/2;' +
'var pipeL=senderX+boxW+10;var pipeR=receiverX-10;' +
'var pipeY=h/2-16;var pipeH=32;' +

// sender
'ctx.strokeStyle=tealC;ctx.lineWidth=2;ctx.strokeRect(senderX,senderY,boxW,boxH);' +
'ctx.fillStyle=tealC;ctx.globalAlpha=0.08;ctx.fillRect(senderX,senderY,boxW,boxH);ctx.globalAlpha=1;' +
'ctx.fillStyle=tealC;ctx.font="bold 10px -apple-system,sans-serif";ctx.textAlign="center";' +
'ctx.fillText(T.sender,senderX+boxW/2,senderY+boxH/2+4);' +

// receiver
'ctx.strokeStyle=greenC;ctx.lineWidth=2;ctx.strokeRect(receiverX,receiverY,boxW,boxH);' +
'ctx.fillStyle=greenC;ctx.globalAlpha=0.08;ctx.fillRect(receiverX,receiverY,boxW,boxH);ctx.globalAlpha=1;' +
'ctx.fillStyle=greenC;ctx.font="bold 10px -apple-system,sans-serif";ctx.textAlign="center";' +
'ctx.fillText(T.receiver,receiverX+boxW/2,receiverY+boxH/2+4);' +

// pipe
'ctx.strokeStyle=borderC;ctx.lineWidth=2;' +
'ctx.strokeRect(pipeL,pipeY,pipeR-pipeL,pipeH);' +
'ctx.fillStyle=borderC;ctx.globalAlpha=0.05;' +
'ctx.fillRect(pipeL,pipeY,pipeR-pipeL,pipeH);ctx.globalAlpha=1;' +

// noise zone (middle third of pipe)
'var noiseL=pipeL+(pipeR-pipeL)*0.3;var noiseR=pipeL+(pipeR-pipeL)*0.7;' +
'ctx.fillStyle=redC;ctx.globalAlpha=0.08;' +
'ctx.fillRect(noiseL,pipeY,noiseR-noiseL,pipeH);ctx.globalAlpha=1;' +

// noise particles
'var noiseLvl=noisePower/100;' +
'for(var i=0;i<Math.floor(noiseLvl*20);i++){' +
'var nx=noiseL+Math.random()*(noiseR-noiseL);' +
'var ny=pipeY+4+Math.random()*(pipeH-8);' +
'ctx.fillStyle=redC;ctx.globalAlpha=0.3+Math.random()*0.4;' +
'ctx.fillRect(nx-1,ny-1,3,3);ctx.globalAlpha=1}' +

// noise zone label
'ctx.fillStyle=text3C;ctx.font="8px -apple-system,sans-serif";ctx.textAlign="center";' +
'ctx.fillText(T.noiseZone,(noiseL+noiseR)/2,pipeY-4);' +

// draw bits
'var bitSize=8;' +
'for(var i=0;i<bits.length;i++){' +
'var b=bits[i];' +
'var bx=pipeL+b.x*(pipeR-pipeL);' +
'var by=pipeY+pipeH/2-bitSize/2+b.yOff;' +
'if(bx>=pipeL&&bx<=pipeR-bitSize){' +
'ctx.fillStyle=b.corrupted?redC:tealC;' +
'ctx.fillRect(bx,by,bitSize,bitSize);' +
'ctx.strokeStyle=b.corrupted?redC:tealC;ctx.lineWidth=1;ctx.strokeRect(bx,by,bitSize,bitSize)}}' +

// capacity formula
'var C=computeC();var snrDB=computeSNR_dB();' +
'ctx.fillStyle=tealC;ctx.font="bold 12px monospace";ctx.textAlign="center";' +
'ctx.fillText("C = "+C.toFixed(1)+" "+T.bps,w/2,h-8);' +
'ctx.fillStyle=text3C;ctx.font="9px monospace";ctx.textAlign="left";' +
'ctx.fillText(T.snr+": "+snrDB.toFixed(1)+" "+T.db,8,h-8)}' +

// ── Draw capacity graph ──
'function drawCap(){' +
'var cv=document.getElementById("cvCap");' +
'var dim=setupCanvas(cv,160);var w=dim.w,h=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var accentC=cs.getPropertyValue("--accent").trim();' +
'var redC=cs.getPropertyValue("--red").trim();' +
'var greenC=cs.getPropertyValue("--green").trim();' +
'var text3C=cs.getPropertyValue("--text3").trim();' +

'var pad=36;var pt=20;var pb=28;var pr=14;' +
'var gW=w-pad-pr;var gH=h-pt-pb;' +

// axes
'ctx.strokeStyle=borderC;ctx.lineWidth=1;' +
'ctx.beginPath();ctx.moveTo(pad,pt);ctx.lineTo(pad,h-pb);ctx.lineTo(w-pr,h-pb);ctx.stroke();' +

// axis labels
'ctx.fillStyle=text3C;ctx.font="9px -apple-system,sans-serif";' +
'ctx.textAlign="center";ctx.fillText(T.snr+" ("+T.db+")",w/2,h-4);' +
'ctx.save();ctx.translate(8,pt+gH/2);ctx.rotate(-Math.PI/2);' +
'ctx.fillText("C ("+T.bps+")",0,0);ctx.restore();' +

// plot C = B*log2(1+SNR) for SNR_dB from 0 to 30
'var maxSNR=30;' +
'var maxC=bandwidth*Math.log(1+Math.pow(10,maxSNR/10))/Math.LN2;' +

// capacity curve
'ctx.strokeStyle=tealC;ctx.lineWidth=2.5;ctx.beginPath();' +
'for(var i=0;i<=100;i++){' +
'var snrDB=i/100*maxSNR;' +
'var snrLin=Math.pow(10,snrDB/10);' +
'var C=bandwidth*Math.log(1+snrLin)/Math.LN2;' +
'var x=pad+(snrDB/maxSNR)*gW;' +
'var y=pt+(1-C/maxC)*gH;' +
'if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)}ctx.stroke();' +

// fill under curve
'ctx.fillStyle=tealC;ctx.globalAlpha=0.06;ctx.beginPath();' +
'ctx.moveTo(pad,h-pb);' +
'for(var i=0;i<=100;i++){' +
'var snrDB=i/100*maxSNR;var snrLin=Math.pow(10,snrDB/10);' +
'var C=bandwidth*Math.log(1+snrLin)/Math.LN2;' +
'var x=pad+(snrDB/maxSNR)*gW;var y=pt+(1-C/maxC)*gH;' +
'ctx.lineTo(x,y)}' +
'ctx.lineTo(pad+gW,h-pb);ctx.closePath();ctx.fill();ctx.globalAlpha=1;' +

// danger zone: above capacity
'ctx.fillStyle=redC;ctx.globalAlpha=0.04;' +
'ctx.fillRect(pad,pt,gW,gH);ctx.globalAlpha=1;' +

// current position marker
'var curSNR=computeSNR_dB();var curC=computeC();' +
'var markerX=pad+(Math.max(0,curSNR)/maxSNR)*gW;' +
'var markerY=pt+(1-Math.min(curC,maxC)/maxC)*gH;' +

// transmission rate line (horizontal)
'var rateY=pt+(1-Math.min(txRate,maxC)/maxC)*gH;' +
'var overCap=txRate>curC;' +
'ctx.setLineDash([4,4]);ctx.strokeStyle=overCap?redC:greenC;ctx.lineWidth=1.5;' +
'ctx.beginPath();ctx.moveTo(pad,rateY);ctx.lineTo(w-pr,rateY);ctx.stroke();ctx.setLineDash([]);' +
'ctx.fillStyle=overCap?redC:greenC;ctx.font="9px monospace";ctx.textAlign="right";' +
'ctx.fillText(T.txRate+"="+txRate.toFixed(0),w-pr,rateY-4);' +

// marker dot
'ctx.beginPath();ctx.arc(markerX,markerY,6,0,Math.PI*2);' +
'ctx.fillStyle=overCap?redC:tealC;ctx.fill();' +
'ctx.strokeStyle=overCap?redC:tealC;ctx.lineWidth=2;ctx.stroke();' +

// danger/safe label
'ctx.font="bold 10px -apple-system,sans-serif";ctx.textAlign="center";' +
'ctx.fillStyle=overCap?redC:greenC;' +
'ctx.fillText(overCap?T.danger:T.safe,w/2,pt+10);' +

// x ticks
'ctx.fillStyle=text3C;ctx.font="8px monospace";ctx.textAlign="center";' +
'for(var i=0;i<=6;i++){var v=i*5;var x=pad+(v/maxSNR)*gW;ctx.fillText(v+"",x,h-pb+12)}' +

// y ticks
'ctx.textAlign="right";' +
'for(var i=0;i<=4;i++){var v=i/4*maxC;var y=pt+(1-i/4)*gH;ctx.fillText(v.toFixed(0),pad-4,y+3)}}' +

// ── Send burst ──
'function sendBurst(){' +
'if(animating)return;' +
'var ber=computeBER();' +
'lastBurstSent=100;lastBurstErrors=0;' +
// create bits
'bits=[];' +
'for(var i=0;i<100;i++){' +
'var corrupted=Math.random()<ber;' +
'if(corrupted)lastBurstErrors++;' +
'bits.push({x:-0.1-i*0.015,corrupted:corrupted,yOff:(Math.random()-0.5)*12,speed:0.005+Math.random()*0.003})}' +
'totalSent+=100;totalErrors+=lastBurstErrors;' +
'animating=true;animateBits()}' +

// ── Animate bits ──
'function animateBits(){' +
'var allDone=true;' +
'for(var i=0;i<bits.length;i++){' +
'bits[i].x+=bits[i].speed;' +
'if(bits[i].x<1.1)allDone=false;' +
// check noise zone: corrupt at random
'var inNoise=bits[i].x>0.3&&bits[i].x<0.7;' +
'if(inNoise&&!bits[i].corrupted&&bits[i].x>0.45&&bits[i].x<0.55){' +
// small visual jitter
'bits[i].yOff+=(Math.random()-0.5)*2}}' +
'drawPipe();' +
'if(!allDone){animFrame=requestAnimationFrame(animateBits)}' +
'else{animating=false;bits=[];drawPipe();updateStats();notifyHeight()}}' +

// ── Draw all ──
'function drawAll(){drawPipe();drawCap();updateStats()}' +

// ── Param ──
'function onParam(){' +
'bandwidth=+document.getElementById("slBW").value;' +
'sigPower=+document.getElementById("slSig").value;' +
'noisePower=+document.getElementById("slNoise").value;' +
'txRate=+document.getElementById("slRate").value;' +
'document.getElementById("valBW").textContent=bandwidth+" "+T.hz;' +
'document.getElementById("valSig").textContent=sigPower;' +
'document.getElementById("valNoise").textContent=noisePower;' +
'document.getElementById("valRate").textContent=txRate+" "+T.bps;' +
'drawAll();notifyHeight()}' +

// ── Reset ──
'function doReset(){' +
'if(animFrame)cancelAnimationFrame(animFrame);' +
'animating=false;bits=[];' +
'totalSent=0;totalErrors=0;lastBurstSent=0;lastBurstErrors=0;' +
'drawAll();notifyHeight()}' +

// ── Stats ──
'function updateStats(){' +
'var box=document.getElementById("statsBox");' +
'var C=computeC();var snrDB=computeSNR_dB();var ber=computeBER();' +
'var overCap=txRate>C;' +
's="<span class=\\"hi\\">"+T.capacity+"</span> C = B\\u00D7log\\u2082(1+S/N) = <span class=\\"hi\\">"+C.toFixed(2)+" "+T.bps+"</span><br>";' +
's+=T.snr+": <span class=\\"hi\\">"+snrDB.toFixed(1)+" "+T.db+"</span>";' +
's+=" | "+T.txRate+": "+(overCap?"<span class=\\"warn\\">":"<span class=\\"hi\\">")+txRate+" "+T.bps+"</span><br>";' +
's+=T.ber+": "+(ber>0.01?"<span class=\\"warn\\">":"<span class=\\"hi\\">")+ber.toFixed(4)+"</span>";' +
'if(overCap)s+=" \\u26A0";' +
's+="<br>";' +
'if(totalSent>0){' +
's+=T.totalSent+": "+totalSent+" | "+T.totalErr+": <span class=\\"warn\\">"+totalErrors+"</span><br>";' +
'if(lastBurstSent>0){' +
's+=T.sent+": "+lastBurstSent+", "+T.errors+": <span class=\\"warn\\">"+lastBurstErrors+"</span>, ";' +
's+=T.success+": <span class=\\"hi\\">"+(lastBurstSent-lastBurstErrors)+"</span>"}}' +
'box.innerHTML=s}' +

// ── Height notification ──
'function notifyHeight(){' +
'var h=document.body.scrollHeight+20;' +
'try{window.ReactNativeWebView.postMessage(JSON.stringify({type:"height",value:h}))}catch(e){}}' +

// ── Init labels ──
'document.getElementById("lbl-pipe").textContent=T.pipe;' +
'document.getElementById("lbl-cap").textContent=T.cap;' +
'document.getElementById("lbl-ctrl").textContent=T.ctrl;' +
'document.getElementById("lbl-stats").textContent=T.stats;' +
'document.getElementById("lblBW").textContent=T.bw;' +
'document.getElementById("lblSig").textContent=T.sig;' +
'document.getElementById("lblNoise").textContent=T.noise;' +
'document.getElementById("lblRate").textContent=T.rate;' +
'document.getElementById("btnSend").textContent=T.send;' +
'document.getElementById("btnReset").textContent=T.reset;' +

// ── Init ──
'onParam();' +
'window.addEventListener("resize",function(){drawAll();notifyHeight()});' +
'setTimeout(notifyHeight,100);' +

'</script></body></html>';
}
