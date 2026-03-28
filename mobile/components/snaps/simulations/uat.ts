/**
 * Universal Approximation Theorem interactive simulation — self-contained HTML/JS/Canvas
 *
 * Features:
 * - Target function (preset or user-drawn) vs sigmoid sum approximation
 * - N (neuron count) slider: 1-30
 * - Individual sigmoid components visualization
 * - Fit button runs gradient descent to optimize parameters
 * - MSE error display
 * - Draw mode: user draws target curve by dragging on canvas
 * - Dark/light theme, Korean/English bilingual
 */

export function getUATSimulationHTML(isDark: boolean, lang: string): string {
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
'body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:var(--bg);color:var(--text);padding:0 6px;-webkit-user-select:none;user-select:none;overflow-x:hidden}' +
'.panel{border:2px solid var(--border);background:var(--card);margin-bottom:8px;padding:12px;border-radius:8px;overflow:hidden}' +
'canvas{width:100%;display:block;background:var(--card);border-radius:6px}' +
'.label{font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--text3);margin-bottom:6px}' +
'.row{display:flex;align-items:center;gap:8px;margin-bottom:10px}' +
'.row:last-child{margin-bottom:0}' +
'.ctrl-name{font-size:12px;font-weight:600;color:var(--text);min-width:40px;flex-shrink:0}' +
'.ctrl-val{font-size:12px;font-family:monospace;color:var(--teal);min-width:44px;text-align:right;flex-shrink:0;white-space:nowrap}' +
'input[type=range]{flex:1;min-width:0;accent-color:var(--teal);height:20px}' +
'.btn-row{display:flex;gap:6px;margin-top:4px}' +
'.btn{flex:1;padding:10px 6px;border:2px solid var(--border);background:var(--surface);color:var(--text);font-size:12px;font-weight:700;text-align:center;cursor:pointer;letter-spacing:0.5px;-webkit-tap-highlight-color:transparent;border-radius:8px;min-width:0;overflow:hidden}' +
'.btn:active{opacity:0.7}' +
'.btn-primary{background:var(--teal);border-color:var(--teal);color:#1A1816}' +
'.btn-stop{background:var(--accent);border-color:var(--accent);color:#1A1816}' +
'.preset-row{display:flex;gap:6px;margin-bottom:8px}' +
'.preset{flex:1;padding:10px 4px;border:2px solid var(--border);background:var(--surface);color:var(--text2);font-size:11px;font-weight:700;text-align:center;cursor:pointer;letter-spacing:0.3px;border-radius:8px;min-width:0;overflow:hidden;min-height:44px;display:flex;align-items:center;justify-content:center}' +
'.preset:active{opacity:0.7}' +
'.preset.active{border-color:var(--teal);color:var(--teal)}' +
'.toggle-row{display:flex;gap:6px;margin-bottom:8px}' +
'.toggle{flex:1;padding:10px 4px;border:2px solid var(--border);background:var(--surface);color:var(--text2);font-size:11px;font-weight:700;text-align:center;cursor:pointer}' +
'.toggle:active{opacity:0.7}' +
'.toggle.on{border-color:var(--teal);color:var(--teal);background:var(--tealLight)}' +
'.stats{font-family:monospace;font-size:11px;line-height:2;color:var(--text2);border-radius:8px;overflow-wrap:break-word;word-break:break-word}' +
'.stats .hi{color:var(--teal);font-weight:700}' +
'.stats .warn{color:var(--accent);font-weight:700}' +
'.stats .gn{color:var(--green);font-weight:700}' +
'</style></head><body>' +

// ── Main Canvas ──
'<div class="panel"><div class="label" id="lbl-canvas"></div>' +
'<canvas id="cv" height="200"></canvas></div>' +

// ── Presets ──
'<div class="panel"><div class="label" id="lbl-target"></div>' +
'<div class="preset-row">' +
'<div class="preset active" id="pre0" onclick="onPreset(0)"></div>' +
'<div class="preset" id="pre1" onclick="onPreset(1)"></div>' +
'<div class="preset" id="pre2" onclick="onPreset(2)"></div>' +
'<div class="preset" id="pre3" onclick="onPreset(3)"></div>' +
'<div class="preset" id="pre4" onclick="onPreset(4)"></div>' +
'</div></div>' +

// ── Parameters ──
'<div class="panel"><div class="label" id="lbl-params"></div>' +
'<div class="row"><span class="ctrl-name" id="lbl-n"></span>' +
'<input type="range" id="slN" min="1" max="30" value="5" oninput="onN()">' +
'<span class="ctrl-val" id="valN"></span></div>' +
'<div class="toggle-row">' +
'<div class="toggle" id="togComp" onclick="toggleComp()"></div>' +
'</div>' +
'<div class="btn-row">' +
'<div class="btn btn-primary" id="btnFit" onclick="onFit()"></div>' +
'<div class="btn" id="btnReset" onclick="onReset()"></div>' +
'</div></div>' +

// ── Stats ──
'<div class="panel"><div class="label" id="lbl-stats"></div>' +
'<div class="stats" id="statsBox"></div></div>' +

'<script>' +
'var LANG="' + lang + '";' +

// ── Labels ──
'var L={' +
'ko:{canvas:"\\uBC94\\uC6A9 \\uADFC\\uC0AC \\uC815\\uB9AC",target:"\\uBAA9\\uD45C \\uD568\\uC218",params:"\\uD30C\\uB77C\\uBBF8\\uD130",stats:"\\uD1B5\\uACC4",' +
'neurons:"\\uB274\\uB7F0(N)",showComp:"\\uC131\\uBD84 \\uD45C\\uC2DC",fit:"\\uD559\\uC2B5",reset:"\\u21BA \\uB9AC\\uC14B",' +
'sin:"sin(x)",step:"\\uACC4\\uB2E8",bump:"\\uBC94\\uD504",zigzag:"\\uC9C0\\uADF8\\uC7AC\\uADF8",draw:"\\uADF8\\uB9AC\\uAE30",' +
'mse:"\\uC624\\uCC28(MSE)",nNeurons:"\\uB274\\uB7F0 \\uC218",epoch:"\\uC5D0\\uD3ED",fitting:"\\uD559\\uC2B5 \\uC911...",done:"\\uC644\\uB8CC",' +
'perfect:"\\u2713 \\uC644\\uBCBD \\uADFC\\uC0AC",targetL:"\\uBAA9\\uD45C",approxL:"\\uADFC\\uC0AC",' +
'drawHint:"\\uCE94\\uBC84\\uC2A4\\uC5D0 \\uB4DC\\uB798\\uADF8\\uD558\\uC5EC \\uBAA9\\uD45C \\uD568\\uC218\\uB97C \\uADF8\\uB9AC\\uC138\\uC694"},' +
'en:{canvas:"UNIVERSAL APPROXIMATION",target:"TARGET FUNCTION",params:"PARAMETERS",stats:"STATISTICS",' +
'neurons:"Neurons(N)",showComp:"Show Components",fit:"Fit",reset:"\\u21BA Reset",' +
'sin:"sin(x)",step:"Step",bump:"Bump",zigzag:"Zigzag",draw:"Draw",' +
'mse:"Error(MSE)",nNeurons:"Neurons",epoch:"Epoch",fitting:"Fitting...",done:"Done",' +
'perfect:"\\u2713 Perfect Fit",targetL:"Target",approxL:"Approx",' +
'drawHint:"Drag on canvas to draw target function"}' +
'};' +
'var T=L[LANG]||L.en;' +

// ── State ──
'var N=5;var showComp=false;var presetIdx=0;var fitting=false;var epoch=0;' +
'var SAMPLES=100;var targetY=[];var drawMode=false;var drawnY=null;' +
// Sigmoid params: a (amplitude), w (weight), b (bias)
'var params=[];' +

// ── Preset target functions ──
'function targetFn(idx,x){' +
'if(drawnY&&idx===4)return 0;' + // draw mode uses drawnY
'var t=x/SAMPLES*6-3;' + // map to [-3,3]
'if(idx===0)return Math.sin(t*1.5)*0.8;' + // sin
'if(idx===1)return t>0?0.7:-0.7;' + // step
'if(idx===2)return Math.exp(-t*t*2)*1.2-0.3;' + // bump
'if(idx===3){var p=((t+3)/6*4)%2;return(p<1?p:2-p)*1.4-0.7}' + // zigzag
'return 0}' +

// ── Generate target samples ──
'function genTarget(){' +
'targetY=[];' +
'if(presetIdx===4&&drawnY){for(var i=0;i<SAMPLES;i++){targetY[i]=drawnY[i]||0};return}' +
'for(var i=0;i<SAMPLES;i++){targetY[i]=targetFn(presetIdx,i)}}' +

// ── Init params for N neurons ──
'function initParams(){' +
'params=[];' +
'for(var i=0;i<N;i++){' +
'params.push({a:(Math.random()-0.5)*2,w:1+Math.random()*3,b:-3+6*i/(Math.max(N-1,1))})}' +
'}' +

// ── Sigmoid ──
'function sigmoid(x){return 1/(1+Math.exp(-x))}' +

// ── Evaluate approximation at sample index ──
'function approx(idx){' +
'var x=idx/SAMPLES*6-3;var sum=0;' +
'for(var j=0;j<params.length;j++){' +
'sum+=params[j].a*sigmoid(params[j].w*x+params[j].b)}' +
'return sum}' +

// ── Evaluate single component ──
'function component(j,idx){' +
'var x=idx/SAMPLES*6-3;' +
'return params[j].a*sigmoid(params[j].w*x+params[j].b)}' +

// ── Compute MSE ──
'function computeMSE(){' +
'var sum=0;for(var i=0;i<SAMPLES;i++){var d=targetY[i]-approx(i);sum+=d*d}' +
'return sum/SAMPLES}' +

// ── Canvas DPR setup ──
'function setupCanvas(cv,h){' +
'var dpr=window.devicePixelRatio||1;' +
'var w=cv.parentElement.clientWidth-4;' +
'cv.style.width=w+"px";cv.style.height=h+"px";' +
'cv.width=w*dpr;cv.height=h*dpr;' +
'var ctx=cv.getContext("2d");ctx.scale(dpr,dpr);return{w:w,h:h}}' +

// ── Draw ──
'function draw(){' +
'var cv=document.getElementById("cv");' +
'var dim=setupCanvas(cv,200);var w=dim.w,h=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var textC=cs.getPropertyValue("--text3").trim();' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var accentC=cs.getPropertyValue("--accent").trim();' +
'var pad=8;var midY=h/2;var scaleY=h/3;' +

// Axes
'ctx.strokeStyle=borderC;ctx.lineWidth=1;' +
'ctx.beginPath();ctx.moveTo(pad,midY);ctx.lineTo(w-pad,midY);ctx.stroke();' +
'ctx.beginPath();ctx.moveTo(pad,pad);ctx.lineTo(pad,h-pad);ctx.stroke();' +

// Component sigmoids (thin colored lines)
'if(showComp&&params.length>0){' +
'var compColors=["#EF4444","#F59E0B","#8B5CF6","#EC4899","#3B82F6","#10B981","#F97316","#6366F1","#14B8A6","#E11D48"];' +
'for(var j=0;j<params.length;j++){' +
'ctx.strokeStyle=compColors[j%compColors.length];ctx.lineWidth=1;ctx.globalAlpha=0.5;ctx.beginPath();' +
'for(var i=0;i<SAMPLES;i++){' +
'var sx=pad+(w-2*pad)*i/(SAMPLES-1);' +
'var sy=midY-component(j,i)*scaleY;' +
'if(i===0)ctx.moveTo(sx,sy);else ctx.lineTo(sx,sy)}' +
'ctx.stroke();ctx.globalAlpha=1}}' +

// Target curve (gray thick)
'ctx.strokeStyle=textC;ctx.lineWidth=2.5;ctx.beginPath();' +
'for(var i=0;i<SAMPLES;i++){' +
'var sx=pad+(w-2*pad)*i/(SAMPLES-1);' +
'var sy=midY-targetY[i]*scaleY;' +
'if(i===0)ctx.moveTo(sx,sy);else ctx.lineTo(sx,sy)}ctx.stroke();' +

// Approximation curve (teal)
'ctx.strokeStyle=tealC;ctx.lineWidth=2;ctx.beginPath();' +
'for(var i=0;i<SAMPLES;i++){' +
'var sx=pad+(w-2*pad)*i/(SAMPLES-1);' +
'var sy=midY-approx(i)*scaleY;' +
'if(i===0)ctx.moveTo(sx,sy);else ctx.lineTo(sx,sy)}ctx.stroke();' +

// Legend
'ctx.font="10px -apple-system,sans-serif";ctx.textAlign="left";' +
'ctx.strokeStyle=textC;ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(pad+4,pad+6);ctx.lineTo(pad+20,pad+6);ctx.stroke();' +
'ctx.fillStyle=textC;ctx.fillText(T.targetL,pad+24,pad+10);' +
'ctx.strokeStyle=tealC;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(pad+70,pad+6);ctx.lineTo(pad+86,pad+6);ctx.stroke();' +
'ctx.fillStyle=tealC;ctx.fillText(T.approxL,pad+90,pad+10);' +

'updateStats();notifyHeight()}' +

// ── Drawing on canvas ──
'var isDrawing=false;' +
'function startDraw(e){' +
'if(presetIdx!==4)return;' +
'isDrawing=true;drawnY=new Array(SAMPLES);' +
'addDrawPoint(e)}' +
'function moveDraw(e){if(!isDrawing)return;addDrawPoint(e)}' +
'function endDraw(){if(!isDrawing)return;isDrawing=false;' +
// fill gaps with linear interpolation
'var last=-1;' +
'for(var i=0;i<SAMPLES;i++){' +
'if(drawnY[i]!==undefined){' +
'if(last>=0&&last<i-1){for(var j=last+1;j<i;j++){drawnY[j]=drawnY[last]+(drawnY[i]-drawnY[last])*(j-last)/(i-last)}}' +
'last=i}}' +
// fill remaining with 0
'for(var i=0;i<SAMPLES;i++){if(drawnY[i]===undefined)drawnY[i]=0}' +
'genTarget();draw()}' +

'function addDrawPoint(e){' +
'var cv=document.getElementById("cv");var rect=cv.getBoundingClientRect();' +
'var touch=e.touches?e.touches[0]:e;' +
'var px=touch.clientX-rect.left;var py=touch.clientY-rect.top;' +
'var idx=Math.round((px/rect.width)*SAMPLES);' +
'if(idx<0)idx=0;if(idx>=SAMPLES)idx=SAMPLES-1;' +
'var val=(0.5-py/rect.height)*2*1.2;' +
'drawnY[idx]=val}' +

'(function(){' +
'var cv=document.getElementById("cv");' +
'cv.addEventListener("touchstart",function(e){e.preventDefault();startDraw(e)});' +
'cv.addEventListener("touchmove",function(e){e.preventDefault();moveDraw(e)});' +
'cv.addEventListener("touchend",function(e){endDraw()});' +
'cv.addEventListener("mousedown",function(e){startDraw(e)});' +
'cv.addEventListener("mousemove",function(e){moveDraw(e)});' +
'cv.addEventListener("mouseup",function(){endDraw()})' +
'})();' +

// ── Fit (gradient descent on sigmoid params) ──
'var fitId=null;' +
'function onFit(){' +
'if(fitting){fitting=false;document.getElementById("btnFit").textContent=T.fit;' +
'document.getElementById("btnFit").className="btn btn-primary";return}' +
'fitting=true;epoch=0;initParams();' +
'document.getElementById("btnFit").textContent="\\u25A0 Stop";' +
'document.getElementById("btnFit").className="btn btn-stop";' +
'fitLoop()}' +

'function fitLoop(){' +
'if(!fitting)return;' +
'var learnRate=0.02;var batchSize=20;' +
// mini-batch gradient descent
'for(var iter=0;iter<batchSize;iter++){' +
'for(var j=0;j<params.length;j++){' +
'var ga=0,gw=0,gb=0;' +
'for(var i=0;i<SAMPLES;i++){' +
'var x=i/SAMPLES*6-3;' +
'var z=params[j].w*x+params[j].b;' +
'var sig=sigmoid(z);' +
'var err=approx(i)-targetY[i];' +
'ga+=err*sig;' +
'gw+=err*params[j].a*sig*(1-sig)*x;' +
'gb+=err*params[j].a*sig*(1-sig)}' +
'params[j].a-=learnRate*ga/SAMPLES;' +
'params[j].w-=learnRate*gw/SAMPLES;' +
'params[j].b-=learnRate*gb/SAMPLES}' +
'epoch++}' +
'draw();' +
'var mse=computeMSE();' +
'if(mse<0.001||epoch>=2000){' +
'fitting=false;' +
'document.getElementById("btnFit").textContent=T.fit;' +
'document.getElementById("btnFit").className="btn btn-primary";' +
'draw();return}' +
'fitId=requestAnimationFrame(fitLoop)}' +

// ── N slider ──
'function onN(){' +
'N=+document.getElementById("slN").value;' +
'document.getElementById("valN").textContent=N;' +
'initParams();draw()}' +

// ── Presets ──
'function onPreset(idx){' +
'presetIdx=idx;' +
'for(var i=0;i<5;i++){document.getElementById("pre"+i).className=i===idx?"preset active":"preset"}' +
'if(idx===4){drawnY=null}' +
'genTarget();initParams();draw()}' +

// ── Component toggle ──
'function toggleComp(){showComp=!showComp;' +
'document.getElementById("togComp").className=showComp?"toggle on":"toggle";' +
'draw()}' +

// ── Reset ──
'function onReset(){fitting=false;epoch=0;initParams();' +
'document.getElementById("btnFit").textContent=T.fit;' +
'document.getElementById("btnFit").className="btn btn-primary";' +
'draw()}' +

// ── Stats ──
'function updateStats(){' +
'var mse=computeMSE();' +
'var s="<span class=\\"hi\\">"+T.nNeurons+"</span>: "+N+"<br>";' +
's+="<span class=\\"hi\\">"+T.mse+"</span>: "+mse.toFixed(6)+"<br>";' +
'if(epoch>0)s+=T.epoch+": "+epoch+"<br>";' +
'if(fitting)s+="<span class=\\"warn\\">"+T.fitting+"</span><br>";' +
'else if(epoch>0)s+=T.done+"<br>";' +
'if(mse<0.005)s+="<span class=\\"gn\\">"+T.perfect+"</span>";' +
'document.getElementById("statsBox").innerHTML=s}' +

// ── Height notification ──
'function notifyHeight(){' +
'var h=document.body.scrollHeight+20;' +
'try{window.ReactNativeWebView.postMessage(JSON.stringify({type:"height",value:h}))}catch(e){}}' +

// ── Init labels ──
'document.getElementById("lbl-canvas").textContent=T.canvas;' +
'document.getElementById("lbl-target").textContent=T.target;' +
'document.getElementById("lbl-params").textContent=T.params;' +
'document.getElementById("lbl-stats").textContent=T.stats;' +
'document.getElementById("lbl-n").textContent=T.neurons;' +
'document.getElementById("valN").textContent="5";' +
'document.getElementById("togComp").textContent=T.showComp;' +
'document.getElementById("btnFit").textContent=T.fit;' +
'document.getElementById("btnReset").textContent=T.reset;' +
'document.getElementById("pre0").textContent=T.sin;' +
'document.getElementById("pre1").textContent=T.step;' +
'document.getElementById("pre2").textContent=T.bump;' +
'document.getElementById("pre3").textContent=T.zigzag;' +
'document.getElementById("pre4").textContent=T.draw;' +

// ── Init ──
'genTarget();initParams();draw();' +
'window.addEventListener("resize",function(){draw()});' +
'setTimeout(notifyHeight,100);' +

'</script></body></html>';
}
