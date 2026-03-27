/**
 * Renormalization Group interactive simulation — self-contained HTML/JS/Canvas
 *
 * Features:
 * - NxN Ising model grid (64x64), cells colored by spin: up=teal, down=dark
 * - Metropolis-Hastings Monte Carlo steps with temperature control
 * - Temperature slider: 0 to 5.0 (Tc ≈ 2.27 marked)
 * - "Coarse Grain" button: Block spin transformation (2x2 → 1 majority vote)
 *   Grid shrinks: 64→32→16→8. Repeatable
 * - "Reset Scale" button: Return to original resolution
 * - Animate toggle: Run Monte Carlo steps continuously
 * - Stats: Temperature, Magnetization M, Energy E, Scale level, Phase label
 * - At low T: ordered. At Tc: fractal clusters (critical). At high T: random noise
 * - Dark/light theme, Korean/English bilingual
 */

export function getRenormSimulationHTML(isDark: boolean, lang: string): string {
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
'.panel{border:2px solid var(--border);background:var(--card);margin-bottom:8px;padding:12px;border-radius:8px}' +
'canvas{width:100%;display:block;border:2px solid var(--border);background:var(--card);border-radius:8px}' +
'.label{font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--text3);margin-bottom:6px}' +
'.row{display:flex;align-items:center;gap:8px;margin-bottom:10px}' +
'.row:last-child{margin-bottom:0}' +
'.ctrl-name{font-size:12px;font-weight:600;color:var(--text);min-width:56px;flex-shrink:0}' +
'.ctrl-val{font-size:12px;font-family:monospace;color:var(--teal);min-width:50px;text-align:right;flex-shrink:0}' +
'input[type=range]{flex:1;min-width:0;accent-color:var(--teal);height:20px}' +
'.btn-row{display:flex;gap:6px;margin-top:4px}' +
'.btn{flex:1;padding:10px 6px;border:2px solid var(--border);background:var(--surface);color:var(--text);font-size:12px;font-weight:700;text-align:center;cursor:pointer;letter-spacing:0.5px;-webkit-tap-highlight-color:transparent;min-height:44px;display:flex;align-items:center;justify-content:center;border-radius:8px}' +
'.btn:active{opacity:0.7}' +
'.btn-primary{background:var(--teal);border-color:var(--teal);color:#1A1816}' +
'.btn-stop{background:var(--accent);border-color:var(--accent);color:#1A1816}' +
'.stats{font-family:monospace;font-size:11px;line-height:2;color:var(--text2);border-radius:8px}' +
'.stats .hi{color:var(--teal);font-weight:700}' +
'.stats .warn{color:var(--accent);font-weight:700}' +
'.phase-tag{display:inline-block;padding:2px 8px;font-size:11px;font-weight:700;letter-spacing:0.5px}' +
'.phase-ord{background:var(--tealLight);color:var(--teal);border:1px solid var(--teal)}' +
'.phase-crit{background:var(--accent);color:#1A1816;border:1px solid var(--accent)}' +
'.phase-dis{background:var(--surface);color:var(--text3);border:1px solid var(--border)}' +
'.tc-mark{position:relative}' +
'.tc-label{position:absolute;font-size:9px;color:var(--accent);font-weight:700;top:-14px;transform:translateX(-50%)}' +
'</style></head><body>' +

// ── Grid Canvas Panel ──
'<div class="panel"><div class="label" id="lbl-grid"></div>' +
'<canvas id="cvGrid" height="280"></canvas></div>' +

// ── Controls Panel ──
'<div class="panel"><div class="label" id="lbl-ctrl"></div>' +
'<div class="row"><span class="ctrl-name" id="lbl-temp"></span>' +
'<input type="range" id="slTemp" min="0" max="500" value="227" oninput="onTemp()">' +
'<span class="ctrl-val" id="valTemp"></span></div>' +
'<div style="position:relative;height:2px;margin:-6px 64px 10px 64px;background:var(--border)">' +
'<div style="position:absolute;left:45.4%;top:-4px;width:2px;height:10px;background:var(--accent)"></div>' +
'<div style="position:absolute;left:45.4%;top:-16px;font-size:9px;color:var(--accent);font-weight:700;transform:translateX(-50%)">Tc\\u22482.27</div></div>' +
'<div class="btn-row">' +
'<div class="btn btn-primary" id="btnAnimate" onclick="toggleAnimate()"></div>' +
'<div class="btn" id="btnCoarse" onclick="coarseGrain()"></div>' +
'<div class="btn" id="btnResetScale" onclick="resetScale()"></div>' +
'<div class="btn" id="btnReset" onclick="fullReset()"></div>' +
'</div></div>' +

// ── Stats Panel ──
'<div class="panel"><div class="label" id="lbl-stats"></div>' +
'<div class="stats" id="statsBox"></div></div>' +

'<script>' +
'var LANG="' + lang + '";' +

// ── Labels ──
'var L={' +
'ko:{grid:"\\uC774\\uC9D5 \\uBAA8\\uB378",ctrl:"\\uCEE8\\uD2B8\\uB864",' +
'temp:"\\uC628\\uB3C4",stats:"\\uD1B5\\uACC4",' +
'animate:"\\u25B6 \\uC2DC\\uBBAC\\uB808\\uC774\\uC158",stop:"\\u25A0 \\uC815\\uC9C0",' +
'coarse:"\\uCD95\\uC18C (2x2\\u21921)",resetScale:"\\uC6D0\\uB798 \\uD574\\uC0C1\\uB3C4",' +
'reset:"\\u21BA \\uB9AC\\uC14B",' +
'tempLabel:"\\uC628\\uB3C4",mag:"\\uC790\\uD654 M",energy:"\\uC5D0\\uB108\\uC9C0 E",' +
'scale:"\\uC2A4\\uCF00\\uC77C",gridSize:"\\uACA9\\uC790 \\uD06C\\uAE30",' +
'phase:"\\uC704\\uC0C1",ordered:"\\uC815\\uB82C",critical:"\\uC784\\uACC4",disordered:"\\uBB34\\uC9C8\\uC11C",' +
'mcSteps:"MC \\uC2A4\\uD15D"},' +
'en:{grid:"ISING MODEL",ctrl:"CONTROLS",' +
'temp:"Temp",stats:"STATISTICS",' +
'animate:"\\u25B6 Simulate",stop:"\\u25A0 Stop",' +
'coarse:"Coarse (2x2\\u21921)",resetScale:"Reset Scale",' +
'reset:"\\u21BA Reset",' +
'tempLabel:"Temperature",mag:"Magnetization M",energy:"Energy E",' +
'scale:"Scale",gridSize:"Grid Size",' +
'phase:"Phase",ordered:"ORDERED",critical:"CRITICAL",disordered:"DISORDERED",' +
'mcSteps:"MC Steps"}' +
'};' +
'var T=L[LANG]||L.en;' +

// ── State ──
'var BASE=64;var N=BASE;' +
'var grid=[];' +
'var temperature=2.27;' +
'var animTimer=null;' +
'var mcSteps=0;' +
'var scaleLevel=0;' +
'var J=1;' + // coupling constant
'var history=[];' + // stored grids for undo

// ── Init grid (random or all +1) ──
'function initGrid(size,ordered){' +
'N=size;grid=[];' +
'for(var i=0;i<N*N;i++){grid[i]=ordered?1:(Math.random()<0.5?1:-1)}}' +

// ── Compute total energy ──
'function computeEnergy(){' +
'var E=0;' +
'for(var r=0;r<N;r++){for(var c=0;c<N;c++){' +
'var s=grid[r*N+c];' +
'var right=grid[r*N+((c+1)%N)];' +
'var down=grid[((r+1)%N)*N+c];' +
'E+=-J*s*right-J*s*down}}' +
'return E}' +

// ── Compute magnetization ──
'function computeMag(){' +
'var m=0;for(var i=0;i<N*N;i++)m+=grid[i];' +
'return m/(N*N)}' +

// ── Metropolis Monte Carlo step (one full sweep) ──
'function mcSweep(){' +
'var nn=N*N;' +
'for(var k=0;k<nn;k++){' +
'var i=Math.floor(Math.random()*nn);' +
'var r=Math.floor(i/N);var c=i%N;' +
'var s=grid[i];' +
// sum of neighbors (periodic boundary)
'var sumN=grid[r*N+((c+1)%N)]+grid[r*N+((c-1+N)%N)]+grid[((r+1)%N)*N+c]+grid[((r-1+N)%N)*N+c];' +
'var dE=2*J*s*sumN;' +
'if(dE<=0||Math.random()<Math.exp(-dE/temperature)){' +
'grid[i]=-s}}' +
'mcSteps++}' +

// ── Coarse grain: 2x2 block → majority vote ──
'function coarseGrain(){' +
'if(N<=4)return;' + // minimum size
'stopAnimate();' +
// Save current state
'history.push({grid:grid.slice(),N:N});' +
'var newN=Math.floor(N/2);' +
'var newGrid=[];' +
'for(var br=0;br<newN;br++){' +
'for(var bc=0;bc<newN;bc++){' +
'var r=br*2;var c=bc*2;' +
'var sum=grid[r*N+c]+grid[r*N+c+1]+grid[(r+1)*N+c]+grid[(r+1)*N+c+1];' +
'newGrid.push(sum>=0?1:-1)}}' +
'grid=newGrid;N=newN;scaleLevel++;' +
'drawAll();notifyHeight()}' +

// ── Reset to original scale ──
'function resetScale(){' +
'stopAnimate();' +
'if(history.length>0){' +
'var first=history[0];' +
'grid=first.grid;N=first.N;' +
'history=[];scaleLevel=0}' +
'drawAll();notifyHeight()}' +

// ── Canvas setup ──
'function setupCanvas(cv,h){var dpr=window.devicePixelRatio||1;' +
'var w=cv.parentElement.clientWidth-4;' +
'cv.style.width=w+"px";cv.style.height=h+"px";' +
'cv.width=w*dpr;cv.height=h*dpr;' +
'var ctx=cv.getContext("2d");ctx.scale(dpr,dpr);return{w:w,h:h}}' +

// ── Draw grid ──
'function drawGrid(){' +
'var cv=document.getElementById("cvGrid");' +
'var dim=setupCanvas(cv,280);var w=dim.w,h=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var surfaceC=cs.getPropertyValue("--surface").trim();' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var bgC=cs.getPropertyValue("--bg").trim();' +

// Calculate cell size to fit
'var maxGridPx=Math.min(w-8,h-8);' +
'var cellSize=Math.floor(maxGridPx/N);' +
'if(cellSize<1)cellSize=1;' +
'var gridPx=cellSize*N;' +
'var offX=Math.floor((w-gridPx)/2);' +
'var offY=Math.floor((h-gridPx)/2);' +

// Use ImageData for speed when grid is large
'if(N>=32){' +
'var imgData=ctx.createImageData(gridPx,gridPx);' +
'var d=imgData.data;' +
// parse teal color
'var tr=94,tg=234,tb=212;' + // #5EEAD4
'var dr,dg,db;' +
'if(document.documentElement.classList.contains("dark")){dr=26;dg=24;db=22}' + // #1A1816
'else{dr=245;dg=242;db=238}' + // #F5F2EE surface
'for(var r=0;r<N;r++){for(var c=0;c<N;c++){' +
'var spin=grid[r*N+c];' +
'var cr2=spin===1?tr:dr;var cg2=spin===1?tg:dg;var cb2=spin===1?tb:db;' +
'for(var py=0;py<cellSize;py++){for(var px=0;px<cellSize;px++){' +
'var idx=((r*cellSize+py)*gridPx+(c*cellSize+px))*4;' +
'd[idx]=cr2;d[idx+1]=cg2;d[idx+2]=cb2;d[idx+3]=255}}}}' +
'ctx.putImageData(imgData,offX,offY)' +
'}else{' +
// Small grid: draw cells with borders
'for(var r=0;r<N;r++){for(var c=0;c<N;c++){' +
'var spin=grid[r*N+c];' +
'ctx.fillStyle=spin===1?tealC:surfaceC;' +
'ctx.fillRect(offX+c*cellSize,offY+r*cellSize,cellSize,cellSize);' +
'if(cellSize>4){ctx.strokeStyle=borderC;ctx.lineWidth=0.5;' +
'ctx.strokeRect(offX+c*cellSize,offY+r*cellSize,cellSize,cellSize)}}}}' +

// Outer border
'ctx.strokeStyle=borderC;ctx.lineWidth=2;' +
'ctx.strokeRect(offX,offY,gridPx,gridPx);' +

// Scale label
'var cs2=cs.getPropertyValue("--text3").trim();' +
'ctx.fillStyle=cs2;ctx.font="10px -apple-system,sans-serif";ctx.textAlign="center";' +
'ctx.fillText(N+"\\u00D7"+N+(scaleLevel>0?" (\\u00D7"+(1<<scaleLevel)+" coarse)":""),w/2,h-2)}' +

// ── Animate toggle ──
'function toggleAnimate(){' +
'if(animTimer){stopAnimate();return}' +
'document.getElementById("btnAnimate").textContent=T.stop;' +
'document.getElementById("btnAnimate").className="btn btn-stop";' +
'animTimer=setInterval(function(){' +
'mcSweep();drawAll()},30)}' +

'function stopAnimate(){' +
'if(animTimer){clearInterval(animTimer);animTimer=null}' +
'document.getElementById("btnAnimate").textContent=T.animate;' +
'document.getElementById("btnAnimate").className="btn btn-primary"}' +

// ── Temperature slider ──
'function onTemp(){' +
'temperature=+document.getElementById("slTemp").value/100;' +
'document.getElementById("valTemp").textContent=temperature.toFixed(2);' +
'drawAll()}' +

'function syncTemp(){' +
'document.getElementById("slTemp").value=Math.round(temperature*100);' +
'document.getElementById("valTemp").textContent=temperature.toFixed(2)}' +

// ── Full reset ──
'function fullReset(){' +
'stopAnimate();' +
'history=[];scaleLevel=0;mcSteps=0;' +
'temperature=2.27;syncTemp();' +
'initGrid(BASE,false);' +
'drawAll();notifyHeight()}' +

// ── Phase detection ──
'function getPhase(){' +
'var Tc=2.27;' +
'if(temperature<Tc*0.85)return"ordered";' +
'if(temperature>Tc*1.15)return"disordered";' +
'return"critical"}' +

// ── Draw all ──
'function drawAll(){drawGrid();updateStats()}' +

// ── Update stats ──
'function updateStats(){' +
'var box=document.getElementById("statsBox");' +
'var M=computeMag();var E=computeEnergy();var ePerSpin=E/(N*N);' +
'var phase=getPhase();' +
'var phaseLabel=phase==="ordered"?T.ordered:phase==="critical"?T.critical:T.disordered;' +
'var phaseClass=phase==="ordered"?"phase-ord":phase==="critical"?"phase-crit":"phase-dis";' +
's="<span class=\\"hi\\">"+T.tempLabel+"</span>: "+temperature.toFixed(2);' +
'if(Math.abs(temperature-2.27)<0.15){s+=" <span class=\\"warn\\">\\u2248 Tc</span>"}' +
's+="<br>";' +
's+=T.mag+": <span class=\\"hi\\">"+M.toFixed(4)+"</span> (|M|="+Math.abs(M).toFixed(4)+")<br>";' +
's+=T.energy+": <span class=\\"warn\\">"+ePerSpin.toFixed(2)+"</span> /spin<br>";' +
's+=T.gridSize+": <span class=\\"hi\\">"+N+"\\u00D7"+N+"</span><br>";' +
's+=T.scale+": "+scaleLevel+" <span class=\\"warn\\">"+(scaleLevel>0?"("+BASE+"\\u2192"+N+")":"(original)")+"</span><br>";' +
's+=T.mcSteps+": "+mcSteps+"<br>";' +
's+=T.phase+": <span class=\\""+phaseClass+"\\">"+phaseLabel+"</span>";' +
'box.innerHTML=s}' +

// ── Height notification ──
'function notifyHeight(){var h=document.body.scrollHeight+20;' +
'try{window.ReactNativeWebView.postMessage(JSON.stringify({type:"height",value:h}))}catch(e){}}' +

// ── Init labels ──
'document.getElementById("lbl-grid").textContent=T.grid;' +
'document.getElementById("lbl-ctrl").textContent=T.ctrl;' +
'document.getElementById("lbl-temp").textContent=T.temp;' +
'document.getElementById("lbl-stats").textContent=T.stats;' +
'document.getElementById("btnAnimate").textContent=T.animate;' +
'document.getElementById("btnCoarse").textContent=T.coarse;' +
'document.getElementById("btnResetScale").textContent=T.resetScale;' +
'document.getElementById("btnReset").textContent=T.reset;' +

// ── Init ──
'initGrid(BASE,false);' +
'syncTemp();' +
// Pre-run some MC steps for visual appeal
'for(var i=0;i<20;i++)mcSweep();mcSteps=0;' +
'drawAll();' +
'window.addEventListener("resize",function(){drawAll();notifyHeight()});' +
'setTimeout(notifyHeight,100);' +

'</script></body></html>';
}
