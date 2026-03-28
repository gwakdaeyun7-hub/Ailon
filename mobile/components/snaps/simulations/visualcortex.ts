/**
 * Visual Cortex & CNN — Hierarchical Feature Detection interactive simulation
 *
 * Improvements (2026-03-28):
 * - Scientific fix: V2->V1 for complex cells, = -> approx, year 1959->1959,1962
 * - V1 2x2 heatmap layout (cells ~17px vs old 8px)
 * - Filter energy bar chart (makes classification transparent)
 * - Canvas dimension caching + RAF throttle (performance)
 * - gridCoord oy bug fix
 * - Auto-select first filter + tap hint
 * - AI Bridge inlined as V1 subtitle
 * - Improved contrast and label sizes
 */

export function getVisualCortexSimulationHTML(isDark: boolean, lang: string): string {
  const themeClass = isDark ? 'dark' : '';

  return '<!DOCTYPE html>' +
'<html class="' + themeClass + '"><head><meta charset="utf-8">' +
'<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">' +
'<style>' +
':root{--bg:#FFFFFF;--card:#FFFFFF;--text:#000;--text2:#57534E;--text3:#78716C;' +
'--border:#E7E5E4;--surface:#F5F2EE;--teal:#5EEAD4;--tealLight:#F0FDFA;' +
'--accent:#B45309;--red:#DC2626;--green:#15803D}' +
'.dark{--bg:#1A1816;--card:#231F1D;--text:#E7E5E4;--text2:#A8A29E;--text3:#78716C;' +
'--border:#302B28;--surface:#211D1B;--teal:#5EEAD4;--tealLight:#112525;' +
'--accent:#F59E0B;--red:#F87171;--green:#4ADE80}' +
'*{box-sizing:border-box;margin:0;padding:0}' +
'body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:var(--bg);color:var(--text);padding:0 6px;-webkit-user-select:none;user-select:none;overflow-x:hidden}' +
'.panel{border:2px solid var(--border);background:var(--card);margin-bottom:8px;padding:12px;border-radius:8px;overflow:hidden}' +
'canvas{width:100%;display:block;background:var(--card);border-radius:6px}' +
'#cvInput,#cvV1{touch-action:none}' +
'.label{font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--text3);margin-bottom:4px}' +
'.sub-label{font-size:10px;font-weight:600;color:var(--teal);margin-bottom:8px;line-height:1.4}' +
'.row{display:flex;align-items:center;gap:8px;margin-bottom:10px}' +
'.row:last-child{margin-bottom:0}' +
'.btn{flex:1;padding:10px 6px;border:2px solid var(--border);background:var(--surface);color:var(--text);font-size:12px;font-weight:700;text-align:center;cursor:pointer;letter-spacing:0.5px;-webkit-tap-highlight-color:transparent;border-radius:8px;min-width:0;overflow:hidden;min-height:44px;display:flex;align-items:center;justify-content:center}' +
'.btn:active{opacity:0.7}' +
'.btn-primary{background:var(--teal);border-color:var(--teal);color:#1A1816}' +
'.stats{font-family:monospace;font-size:11px;line-height:2;color:var(--text2);border-radius:8px;overflow-wrap:break-word;word-break:break-word}' +
'.stats .hi{color:var(--teal);font-weight:700}' +
'.stats .warn{color:var(--accent);font-weight:700}' +
'.preset-row{display:flex;gap:6px;margin-bottom:8px}' +
'.preset{flex:1;padding:14px 4px;border:2px solid var(--border);background:var(--surface);color:var(--text2);font-size:11px;font-weight:700;text-align:center;cursor:pointer;letter-spacing:0.3px;min-height:44px;border-radius:8px;overflow:hidden}' +
'.preset:active{opacity:0.7}' +
'.preset.active{border-color:var(--teal);color:var(--teal);background:var(--tealLight)}' +
'</style></head><body>' +

// ── Panel 1: Input Image ──
'<div class="panel"><div class="label" id="lbl-input"></div>' +
'<canvas id="cvInput" height="220"></canvas>' +
'<div class="preset-row" style="margin-top:8px">' +
'<div class="preset" id="pre0" onclick="onPreset(0)"></div>' +
'<div class="preset" id="pre1" onclick="onPreset(1)"></div>' +
'<div class="preset" id="pre2" onclick="onPreset(2)"></div>' +
'<div class="preset" id="pre3" onclick="onPreset(3)"></div>' +
'<div class="preset" id="preClear" onclick="clearGrid()"></div>' +
'</div></div>' +

// ── Panel 2: V1 Conv Layer (2x2 + energy bars + AI Bridge subtitle) ──
'<div class="panel"><div class="label" id="lbl-v1"></div>' +
'<div class="sub-label" id="lbl-bridge"></div>' +
'<canvas id="cvV1" height="340"></canvas></div>' +

// ── Panel 3: V2 Pooling + Classification ──
'<div class="panel"><div class="label" id="lbl-v2"></div>' +
'<canvas id="cvV2" height="120"></canvas></div>' +

// ── Panel 4: Kernel Detail ──
'<div class="panel"><div class="label" id="lbl-kernel"></div>' +
'<div class="stats" id="kernelBox"></div></div>' +

'<script>' +
'var LANG="' + lang + '";' +

// ── Labels (scientific fixes: V2->V1, = -> approx, 1959->1959,1962) ──
'var L={' +
'ko:{input:"\\uC785\\uB825 \\uC774\\uBBF8\\uC9C0 (8\\u00D78)",' +
'v1:"V1 \\uB2E8\\uC21C\\uC138\\uD3EC \\u2248 Conv Layer \\u2014 \\uBC29\\uD5A5\\uBCC4 \\uC5E3\\uC9C0 \\uAC10\\uC9C0",' +
'v2:"V1 \\uBCF5\\uD569\\uC138\\uD3EC \\u2248 Pooling \\u2014 \\uC704\\uCE58 \\uBD88\\uBCC0 \\uD2B9\\uC9D5 \\uACB0\\uD569",' +
'kernel:"\\uD544\\uD130 \\uCEE4\\uB110",' +
'preV:"| \\uC218\\uC9C1\\uC120",preC:"\\u2514 \\uCF54\\uB108",preX:"+ \\uC2ED\\uC790",preD:"/ \\uB300\\uAC01\\uC120",clear:"\\uC9C0\\uC6B0\\uAE30",' +
'hori:"\\uC218\\uD3C9",vert:"\\uC218\\uC9C1",diagR:"\\uB300\\uAC01(\\\\)",diagL:"\\uB300\\uAC01(/)",' +
'pool:"\\uD480\\uB9C1",recog:"\\uC778\\uC2DD",' +
'edge:"\\uC5E3\\uC9C0",corner:"\\uCF54\\uB108",cross:"\\uC2ED\\uC790",blob:"\\uBE14\\uB86D",diag:"\\uB300\\uAC01\\uC120",none:"\\uC5C6\\uC74C",' +
'tapFilter:"\\u2191 \\uD544\\uD130\\uB97C \\uD0ED\\uD558\\uBA74 \\uCEE4\\uB110\\uC774 \\uD45C\\uC2DC\\uB429\\uB2C8\\uB2E4",' +
'selFilter:"\\uC120\\uD0DD\\uB41C \\uD544\\uD130",' +
'drawHint:"\\uADF8\\uB9AC\\uB4DC\\uB97C \\uD0ED/\\uB4DC\\uB798\\uADF8\\uD558\\uC5EC \\uADF8\\uB9AC\\uC138\\uC694",' +
'aiBridge:"Hubel & Wiesel(1959, 1962): \\uC2DC\\uAC01 \\uD53C\\uC9C8 \\uB274\\uB7F0\\uC774 \\uD2B9\\uC815 \\uBC29\\uD5A5\\uC5D0 \\uC120\\uD0DD\\uC801\\uC73C\\uB85C \\uBC18\\uC751 \\u2192 CNN\\uC758 \\uC9C1\\uC811\\uC801 \\uC601\\uAC10",' +
'energy:"\\uD544\\uD130 \\uD65C\\uC131\\uB3C4"},' +
'en:{input:"INPUT IMAGE (8\\u00D78)",' +
'v1:"V1 SIMPLE CELL \\u2248 Conv Layer \\u2014 EDGE DETECTION",' +
'v2:"V1 COMPLEX CELL \\u2248 Pooling \\u2014 POSITION-INVARIANT FEATURE",' +
'kernel:"FILTER KERNEL",' +
'preV:"| Vert",preC:"\\u2514 Corner",preX:"+ Cross",preD:"/ Diag",clear:"Clear",' +
'hori:"Horiz",vert:"Vert",diagR:"Diag(\\\\)",diagL:"Diag(/)",' +
'pool:"Pooling",recog:"Recognition",' +
'edge:"Edge",corner:"Corner",cross:"Cross",blob:"Blob",diag:"Diagonal",none:"None",' +
'tapFilter:"\\u2191 Tap a filter to see the kernel",' +
'selFilter:"Selected Filter",' +
'drawHint:"Tap/drag to draw on the grid",' +
'aiBridge:"Hubel & Wiesel(1959, 1962): Visual cortex neurons respond selectively to orientations \\u2192 Direct inspiration for CNNs",' +
'energy:"Filter Activation"}' +
'};' +
'var T=L[LANG]||L.en;' +

// ── State ──
'var GRID=8,grid=[];' +
'var filters=[' +
'{name:"hori",k:[[-1,-1,-1],[0,0,0],[1,1,1]]},' +
'{name:"vert",k:[[-1,0,1],[-1,0,1],[-1,0,1]]},' +
'{name:"diagL",k:[[0,-1,-1],[1,0,-1],[1,1,0]]},' +
'{name:"diagR",k:[[-1,-1,0],[-1,0,1],[0,1,1]]}];' +
'var convOuts=[],poolOuts=[];' +
'var selFilter=0;' +
'var isDragging=false,drawVal=1;' +
'var canvasCache={};' +
'var rafPending=false;' +
'var lastTouchTime=0;' +

// ── Canvas DPR setup with caching ──
'function setupCanvas(cv,h){' +
'var id=cv.id;var dpr=window.devicePixelRatio||1;' +
'var w=cv.parentElement.clientWidth-4;' +
'if(canvasCache[id]&&canvasCache[id].w===w&&canvasCache[id].h===h){' +
'var ctx=cv.getContext("2d");ctx.setTransform(dpr,0,0,dpr,0,0);return canvasCache[id]}' +
'cv.style.width=w+"px";cv.style.height=h+"px";' +
'cv.width=w*dpr;cv.height=h*dpr;' +
'var ctx=cv.getContext("2d");ctx.scale(dpr,dpr);' +
'canvasCache[id]={w:w,h:h};return canvasCache[id]}' +

// ── Init grid ──
'function initGrid(){grid=[];for(var r=0;r<GRID;r++){grid[r]=[];for(var c=0;c<GRID;c++)grid[r][c]=0}}' +

// ── Presets ──
'var PRESETS=[' +
'function(){initGrid();for(var r=0;r<GRID;r++)grid[r][4]=255},' +
'function(){initGrid();for(var r=0;r<5;r++)grid[r][2]=255;for(var c=2;c<6;c++)grid[4][c]=255},' +
'function(){initGrid();for(var r=0;r<GRID;r++)grid[r][3]=255;for(var r=0;r<GRID;r++)grid[r][4]=255;for(var c=0;c<GRID;c++){grid[3][c]=255;grid[4][c]=255}},' +
'function(){initGrid();for(var i=0;i<GRID;i++){grid[i][i]=255;if(i+1<GRID)grid[i][i+1]=255}}' +
'];' +

'function setActivePreset(idx){' +
'for(var i=0;i<4;i++)document.getElementById("pre"+i).className="preset"+(i===idx?" active":"");' +
'document.getElementById("preClear").className="preset"+(idx===-2?" active":"")}' +
'function onPreset(idx){PRESETS[idx]();compute();drawAll();setActivePreset(idx);notifyHeight()}' +
'function clearGrid(){initGrid();compute();drawAll();setActivePreset(-2);notifyHeight()}' +

// ── 2D Convolution ──
'function convolve(img,kernel,inSz){' +
'var kSz=kernel.length;var oSz=inSz-kSz+1;' +
'var out=[];' +
'for(var r=0;r<oSz;r++){out[r]=[];for(var c=0;c<oSz;c++){' +
'var s=0;for(var kr=0;kr<kSz;kr++){for(var kc=0;kc<kSz;kc++){' +
's+=img[r+kr][c+kc]*kernel[kr][kc]}}' +
'out[r][c]=s}}return out}' +

// ── Max Pooling 2x2 ──
'function maxPool(m,sz){' +
'var oSz=Math.floor(sz/2);var out=[];' +
'for(var r=0;r<oSz;r++){out[r]=[];for(var c=0;c<oSz;c++){' +
'var mx=-Infinity;' +
'for(var dr=0;dr<2;dr++){for(var dc=0;dc<2;dc++){' +
'var v=m[r*2+dr]&&m[r*2+dr][c*2+dc];' +
'if(v!==undefined&&v>mx)mx=v}}' +
'out[r][c]=mx}}return out}' +

// ── Compute all layers ──
'function compute(){' +
'var norm=[];for(var r=0;r<GRID;r++){norm[r]=[];for(var c=0;c<GRID;c++)norm[r][c]=grid[r][c]/255}' +
'convOuts=[];for(var f=0;f<filters.length;f++){convOuts.push(convolve(norm,filters[f].k,GRID))}' +
'poolOuts=[];var convSz=GRID-2;' +
'for(var f=0;f<filters.length;f++){poolOuts.push(maxPool(convOuts[f],convSz))}}' +

// ── Classification (returns {label, sums}) ──
'function classify(){' +
'var sums=[0,0,0,0];' +
'for(var f=0;f<4;f++){' +
'var p=poolOuts[f];if(!p)return{label:T.none,sums:sums};' +
'for(var r=0;r<p.length;r++)for(var c=0;c<p[r].length;c++)sums[f]+=Math.abs(p[r][c])}' +
'var total=sums[0]+sums[1]+sums[2]+sums[3];' +
'if(total<0.5)return{label:T.none,sums:sums};' +
'var hR=sums[0]/total,vR=sums[1]/total;' +
'var dLR=sums[2]/total,dRR=sums[3]/total;' +
'var label;' +
'if(hR>0.15&&vR>0.15&&(hR+vR)>0.55)label=T.cross;' +
'else if(dLR>0.35||dRR>0.35)label=T.diag;' +
'else if(hR>0.3&&vR>0.12)label=T.corner;' +
'else if(vR>0.3&&hR>0.12)label=T.corner;' +
'else if(vR>0.35)label=T.edge+" ("+T.vert+")";' +
'else if(hR>0.35)label=T.edge+" ("+T.hori+")";' +
'else label=T.blob;' +
'return{label:label,sums:sums}}' +

// ── Draw input grid ──
'function drawInput(){' +
'var cv=document.getElementById("cvInput");' +
'var dim=setupCanvas(cv,220);var w=dim.w,h=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var textC=cs.getPropertyValue("--text").trim();' +
'var text3C=cs.getPropertyValue("--text3").trim();' +
'var cellSz=Math.min((w-20)/GRID,(h-30)/GRID);' +
'var ox=(w-cellSz*GRID)/2,oy=14;' +
'for(var r=0;r<GRID;r++){for(var c=0;c<GRID;c++){' +
'var x=ox+c*cellSz,y=oy+r*cellSz;' +
'var v=grid[r][c];' +
'if(v>0){ctx.fillStyle=textC;ctx.globalAlpha=v/255;ctx.fillRect(x,y,cellSz,cellSz);ctx.globalAlpha=1}' +
'ctx.strokeStyle=borderC;ctx.lineWidth=1;ctx.strokeRect(x,y,cellSz,cellSz)}}' +
'ctx.fillStyle=text3C;ctx.font="10px -apple-system,sans-serif";ctx.textAlign="center";' +
'ctx.fillText(T.drawHint,w/2,oy+cellSz*GRID+16)}' +

// ── Draw V1 (2x2 layout + energy bars) ──
'function drawV1(){' +
'var cv=document.getElementById("cvV1");' +
'var dim=setupCanvas(cv,340);var w=dim.w,h=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var accentC=cs.getPropertyValue("--accent").trim();' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var text3C=cs.getPropertyValue("--text3").trim();' +
'var surfaceC=cs.getPropertyValue("--surface").trim();' +
'var names=[T.hori,T.vert,T.diagL,T.diagR];' +
'var convSz=GRID-2;' +
// 2x2 layout calculations
'var gap=10;var availW=(w-gap*3)/2;' +
'var maxCellH=(h-130)/(convSz*2);' +
'var cellSz=Math.min(availW/convSz,maxCellH,20);' +
'var gridW=cellSz*convSz;' +
'var labelH=14;var rowGap=6;var rowH=gridW+labelH;' +
'var pos=[[gap,8],[gap+gridW+gap,8],[gap,8+rowH+rowGap],[gap+gridW+gap,8+rowH+rowGap]];' +
// Draw 4 filter heatmaps in 2x2
'for(var f=0;f<4;f++){' +
'var ox=pos[f][0],oy=pos[f][1];' +
'var maxAbs=0.001;' +
'for(var r=0;r<convSz;r++)for(var c=0;c<convSz;c++){var av=Math.abs(convOuts[f][r][c]);if(av>maxAbs)maxAbs=av}' +
// Selection highlight
'if(f===selFilter){ctx.strokeStyle=tealC;ctx.lineWidth=2.5;' +
'ctx.strokeRect(ox-3,oy-3,gridW+6,gridW+6)}' +
// Cells
'for(var r=0;r<convSz;r++){for(var c=0;c<convSz;c++){' +
'var v=convOuts[f][r][c]/maxAbs;' +
'var x=ox+c*cellSz,y=oy+r*cellSz;' +
'if(v>0){ctx.fillStyle=tealC;ctx.globalAlpha=Math.min(1,v*0.85);ctx.fillRect(x+0.5,y+0.5,cellSz-1,cellSz-1);ctx.globalAlpha=1}' +
'else if(v<0){ctx.fillStyle=accentC;ctx.globalAlpha=Math.min(1,Math.abs(v)*0.85);ctx.fillRect(x+0.5,y+0.5,cellSz-1,cellSz-1);ctx.globalAlpha=1}' +
'ctx.strokeStyle=borderC;ctx.lineWidth=0.5;ctx.strokeRect(x+0.5,y+0.5,cellSz-1,cellSz-1)}}' +
// Label (bold+teal if selected)
'ctx.fillStyle=f===selFilter?tealC:text3C;' +
'ctx.font=(f===selFilter?"bold ":"")+"10px -apple-system,sans-serif";' +
'ctx.textAlign="center";ctx.fillText(names[f],ox+gridW/2,oy+gridW+12,gridW)}' +
// ── Energy bars ──
'var barY=pos[2][1]+gridW+labelH+10;' +
'var barL=gap+24;var barMaxW=w-barL-gap-36;' +
'var sums=[0,0,0,0];var maxSum=0.001;' +
'for(var f=0;f<4;f++){' +
'for(var r=0;r<convSz;r++)for(var c=0;c<convSz;c++)sums[f]+=Math.abs(convOuts[f][r][c]);' +
'if(sums[f]>maxSum)maxSum=sums[f]}' +
'var shortN=["H","V","/","\\\\"];' +
'for(var f=0;f<4;f++){' +
'var by=barY+f*14;' +
'ctx.fillStyle=f===selFilter?tealC:text3C;ctx.font="bold 10px monospace";ctx.textAlign="right";' +
'ctx.fillText(shortN[f],barL-4,by+10);' +
'ctx.fillStyle=surfaceC;ctx.fillRect(barL,by+1,barMaxW,10);' +
'var bw=barMaxW*(sums[f]/maxSum);' +
'ctx.globalAlpha=f===selFilter?0.9:0.35;ctx.fillStyle=tealC;' +
'ctx.fillRect(barL,by+1,bw,10);ctx.globalAlpha=1;' +
'ctx.fillStyle=text3C;ctx.font="9px monospace";ctx.textAlign="left";' +
'ctx.fillText(sums[f].toFixed(1),barL+barMaxW+4,by+10)}' +
// Tap hint
'ctx.fillStyle=text3C;ctx.font="10px -apple-system,sans-serif";ctx.textAlign="center";' +
'ctx.fillText(T.tapFilter,w/2,barY+4*14+16)}' +

// ── Draw V2 (pooled + classification) ──
'function drawV2(){' +
'var cv=document.getElementById("cvV2");' +
'var dim=setupCanvas(cv,120);var w=dim.w,h=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var accentC=cs.getPropertyValue("--accent").trim();' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var text3C=cs.getPropertyValue("--text3").trim();' +
'var poolSz=poolOuts[0]?poolOuts[0].length:3;' +
'var cellSz=Math.min((w*0.6)/(poolSz*4+12),(h-30)/poolSz);' +
'var gap=((w*0.6)-cellSz*poolSz*4)/5;' +
'for(var f=0;f<4;f++){' +
'var ox=gap+(cellSz*poolSz+gap)*f;var oy=16;' +
'if(!poolOuts[f])continue;' +
'var maxAbs=0.001;' +
'for(var r=0;r<poolSz;r++)for(var c=0;c<poolOuts[f][r].length;c++){var av=Math.abs(poolOuts[f][r][c]);if(av>maxAbs)maxAbs=av}' +
'for(var r=0;r<poolSz;r++){for(var c=0;c<poolOuts[f][r].length;c++){' +
'var v=poolOuts[f][r][c]/maxAbs;' +
'var x=ox+c*cellSz,y=oy+r*cellSz;' +
'if(v>0){ctx.fillStyle=tealC;ctx.globalAlpha=Math.min(1,v*0.8);ctx.fillRect(x,y,cellSz,cellSz);ctx.globalAlpha=1}' +
'else if(v<0){ctx.fillStyle=accentC;ctx.globalAlpha=Math.min(1,Math.abs(v)*0.8);ctx.fillRect(x,y,cellSz,cellSz);ctx.globalAlpha=1}' +
'ctx.strokeStyle=borderC;ctx.lineWidth=0.5;ctx.strokeRect(x,y,cellSz,cellSz)}}}' +
// Classification result
'var cls=classify();' +
'var rxStart=w*0.65;' +
'ctx.fillStyle=text3C;ctx.font="10px -apple-system,sans-serif";ctx.textAlign="left";' +
'ctx.fillText(T.recog+":",rxStart,28);' +
'ctx.fillStyle=tealC;ctx.font="bold 16px -apple-system,sans-serif";' +
'ctx.fillText(cls.label,rxStart,52);' +
// Pool label
'ctx.fillStyle=text3C;ctx.font="10px -apple-system,sans-serif";ctx.textAlign="center";' +
'var poolTotalW=gap+(cellSz*poolSz+gap)*4;' +
'ctx.fillText(T.pool+" (2\\u00D72 max)",poolTotalW/2,oy+cellSz*poolSz+12)}' +

// ── Draw kernel detail ──
'function drawKernel(){' +
'var box=document.getElementById("kernelBox");' +
'if(selFilter<0){box.innerHTML="<span style=\\"color:var(--text3)\\">"+T.tapFilter+"</span>";return}' +
'var f=filters[selFilter];' +
'var names=[T.hori,T.vert,T.diagL,T.diagR];' +
'var s="<span class=\\"hi\\">"+T.selFilter+": "+names[selFilter]+"</span><br>";' +
's+="<table style=\\"border-collapse:collapse;margin-top:4px\\">";' +
'for(var r=0;r<3;r++){s+="<tr>";for(var c=0;c<3;c++){' +
'var v=f.k[r][c];' +
'var bg=v>0?"var(--tealLight)":v<0?"rgba(180,83,9,0.15)":"transparent";' +
'var col=v>0?"var(--teal)":v<0?"var(--accent)":"var(--text3)";' +
's+="<td style=\\"width:32px;height:32px;text-align:center;border:1px solid var(--border);font:bold 13px monospace;color:"+col+";background:"+bg+"\\">"+(v>0?"+":"")+v+"</td>"}' +
's+="</tr>"}s+="</table>";' +
'box.innerHTML=s}' +

// ── Draw all ──
'function drawAll(){drawInput();drawV1();drawV2();drawKernel()}' +

// ── Canvas touch/draw handlers ──
'function gridCoord(ev,cv){' +
'var rect=cv.getBoundingClientRect();' +
'var w=rect.width,h=rect.height;' +
'var cellSz=Math.min((w-20)/GRID,(h-30)/GRID);' +
'var ox=(w-cellSz*GRID)/2,oy=14;' +
'var sx=ev.clientX-rect.left,sy=ev.clientY-rect.top;' +
'var c=Math.floor((sx-ox)/cellSz),r=Math.floor((sy-oy)/cellSz);' +
'if(r>=0&&r<GRID&&c>=0&&c<GRID)return{r:r,c:c};return null}' +

'var cvIn=null;' +
'function onDown(ev){' +
'ev.preventDefault();' +
'var t=ev.touches?ev.touches[0]:ev;' +
'var g=gridCoord(t,cvIn);if(!g)return;' +
'isDragging=true;drawVal=grid[g.r][g.c]>0?0:255;' +
'grid[g.r][g.c]=drawVal;compute();drawAll();setActivePreset(-1)}' +

'function onMove(ev){' +
'if(!isDragging)return;ev.preventDefault();' +
'var t=ev.touches?ev.touches[0]:ev;' +
'var g=gridCoord(t,cvIn);if(!g)return;' +
'grid[g.r][g.c]=drawVal;' +
'if(!rafPending){rafPending=true;requestAnimationFrame(function(){compute();drawAll();rafPending=false})}}' +

'function onUp(){isDragging=false}' +

// ── V1 tap handler (2x2 layout) ──
'function onV1Tap(ev){' +
'var cv=document.getElementById("cvV1");' +
'var rect=cv.getBoundingClientRect();' +
'var sx=ev.clientX-rect.left;' +
'var sy=ev.clientY-rect.top;' +
'var w=rect.width,h=rect.height;' +
'var convSz=GRID-2;' +
'var gap=10;var availW=(w-gap*3)/2;' +
'var maxCellH=(h-130)/(convSz*2);' +
'var cellSz=Math.min(availW/convSz,maxCellH,20);' +
'var gridW=cellSz*convSz;' +
'var labelH=14;var rowGap=6;var rowH=gridW+labelH;' +
'var pos=[[gap,8],[gap+gridW+gap,8],[gap,8+rowH+rowGap],[gap+gridW+gap,8+rowH+rowGap]];' +
'for(var f=0;f<4;f++){' +
'var ox=pos[f][0],oy=pos[f][1];' +
'if(sx>=ox&&sx<=ox+gridW&&sy>=oy&&sy<=oy+gridW){selFilter=f;drawAll();notifyHeight();return}}' +
'selFilter=-1;drawAll();notifyHeight()}' +

// ── Height notification ──
'function notifyHeight(){' +
'var h=document.body.scrollHeight+20;' +
'try{window.ReactNativeWebView.postMessage(JSON.stringify({type:"height",value:h}))}catch(e){}}' +

// ── Init labels ──
'document.getElementById("lbl-input").textContent=T.input;' +
'document.getElementById("lbl-v1").textContent=T.v1;' +
'document.getElementById("lbl-bridge").textContent=T.aiBridge;' +
'document.getElementById("lbl-v2").textContent=T.v2;' +
'document.getElementById("lbl-kernel").textContent=T.kernel;' +
'document.getElementById("pre0").textContent=T.preV;' +
'document.getElementById("pre1").textContent=T.preC;' +
'document.getElementById("pre2").textContent=T.preX;' +
'document.getElementById("pre3").textContent=T.preD;' +
'document.getElementById("preClear").textContent=T.clear;' +

// ── Init ──
'initGrid();PRESETS[0]();compute();' +
'document.getElementById("pre0").className="preset active";' +
'setTimeout(function(){' +
'cvIn=document.getElementById("cvInput");' +
'cvIn.addEventListener("mousedown",onDown);' +
'cvIn.addEventListener("mousemove",onMove);' +
'cvIn.addEventListener("mouseup",onUp);' +
'cvIn.addEventListener("mouseleave",onUp);' +
'cvIn.addEventListener("touchstart",onDown,{passive:false});' +
'cvIn.addEventListener("touchmove",onMove,{passive:false});' +
'cvIn.addEventListener("touchend",onUp);' +
// V1 touch + click (avoid double-fire)
'var cvV1=document.getElementById("cvV1");' +
'cvV1.addEventListener("touchend",function(ev){' +
'lastTouchTime=Date.now();var t=ev.changedTouches[0];onV1Tap(t)},{passive:true});' +
'cvV1.addEventListener("click",function(ev){' +
'if(Date.now()-lastTouchTime<400)return;onV1Tap(ev)});' +
'drawAll();notifyHeight()},50);' +
'window.addEventListener("resize",function(){canvasCache={};drawAll();notifyHeight()});' +
'setTimeout(notifyHeight,200);' +

'</script></body></html>';
}
