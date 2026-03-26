/**
 * Graph Neural Networks interactive simulation — self-contained HTML/JS/Canvas
 *
 * Features:
 * - Force-directed graph layout with draggable nodes
 * - Graph presets: Social Network (2 clusters) / Tree / Grid / Ring
 * - Message passing animation — particles flowing along edges
 * - Node colors blend/mix after receiving messages (aggregation)
 * - Aggregation mode: Sum / Mean / Max
 * - Node tap: highlight receptive field (1-hop, 2-hop circles)
 * - Layer count slider: observe over-smoothing at 4+ layers
 * - Auto Propagate continuous mode
 * - Dark/light theme, Korean/English bilingual
 */

export function getGNNSimulationHTML(isDark: boolean, lang: string): string {
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
'.preset-row{display:flex;gap:6px;margin-bottom:8px}' +
'.preset{flex:1;padding:12px 4px;border:2px solid var(--border);background:var(--surface);color:var(--text2);font-size:10px;font-weight:700;text-align:center;cursor:pointer;letter-spacing:0.3px}' +
'.preset:active{opacity:0.7}' +
'.preset.active{border-color:var(--teal);color:var(--teal)}' +
'</style></head><body>' +

// ── Main Canvas Panel ──
'<div class="panel"><div class="label" id="lbl-main"></div>' +
'<canvas id="cvMain" height="320"></canvas></div>' +

// ── Graph Preset Panel ──
'<div class="panel"><div class="label" id="lbl-graph"></div>' +
'<div class="preset-row">' +
'<div class="preset active" id="pre0" onclick="onPreset(0)"></div>' +
'<div class="preset" id="pre1" onclick="onPreset(1)"></div>' +
'<div class="preset" id="pre2" onclick="onPreset(2)"></div>' +
'<div class="preset" id="pre3" onclick="onPreset(3)"></div>' +
'</div></div>' +

// ── Controls Panel ──
'<div class="panel"><div class="label" id="lbl-ctrl"></div>' +
// Aggregation presets
'<div class="preset-row">' +
'<div class="preset active" id="agg0" onclick="onAgg(0)"></div>' +
'<div class="preset" id="agg1" onclick="onAgg(1)"></div>' +
'<div class="preset" id="agg2" onclick="onAgg(2)"></div>' +
'</div>' +
'<div class="btn-row">' +
'<div class="btn btn-primary" id="btnPass" onclick="doMessagePass()"></div>' +
'<div class="btn" id="btnAuto" onclick="toggleAuto()"></div>' +
'<div class="btn" id="btnReset" onclick="onReset()"></div>' +
'</div></div>' +

// ── Stats Panel ──
'<div class="panel"><div class="label" id="lbl-stats"></div>' +
'<div class="stats" id="statsBox"></div></div>' +

'<script>' +
'var LANG="' + lang + '";' +

// ── Labels ──
'var L={' +
'ko:{main:"\\uADF8\\uB798\\uD504 \\uC2E0\\uACBD\\uB9DD",graph:"\\uADF8\\uB798\\uD504 \\uD0C0\\uC785",ctrl:"\\uCEE8\\uD2B8\\uB864",stats:"\\uD1B5\\uACC4",' +
'pre0:"\\uC18C\\uC15C \\uB124\\uD2B8\\uC6CC\\uD06C",pre1:"\\uD2B8\\uB9AC",pre2:"\\uADF8\\uB9AC\\uB4DC",pre3:"\\uB9C1",' +
'pass:"\\u27A1 \\uBA54\\uC2DC\\uC9C0 \\uC804\\uB2EC",auto:"\\u25B6 \\uC790\\uB3D9 \\uC804\\uD30C",autoStop:"\\u25A0 \\uC815\\uC9C0",reset:"\\u21BA \\uB9AC\\uC14B",' +
'aggSum:"Sum",aggMean:"Mean",aggMax:"Max",' +
'layer:"\\uB808\\uC774\\uC5B4",nodes:"\\uB178\\uB4DC",edges:"\\uC5E3\\uC9C0",selected:"\\uC120\\uD0DD\\uB428",' +
'smoothing:"\\uACFC\\uB3C4 \\uD3C9\\uD65C\\uD654 \\uBC1C\\uC0DD \\u2014 \\uBAA8\\uB4E0 \\uB178\\uB4DC \\uC0C9\\uC0C1 \\uC720\\uC0AC",' +
'tapHint:"\\uB178\\uB4DC\\uB97C \\uD0ED\\uD558\\uC5EC \\uC218\\uC6A9 \\uC601\\uC5ED \\uD655\\uC778"},' +
'en:{main:"GRAPH NEURAL NETWORK",graph:"GRAPH TYPE",ctrl:"CONTROLS",stats:"STATISTICS",' +
'pre0:"Social Net",pre1:"Tree",pre2:"Grid",pre3:"Ring",' +
'pass:"\\u27A1 Message Pass",auto:"\\u25B6 Auto Propagate",autoStop:"\\u25A0 Stop",reset:"\\u21BA Reset",' +
'aggSum:"Sum",aggMean:"Mean",aggMax:"Max",' +
'layer:"Layer",nodes:"Nodes",edges:"Edges",selected:"Selected",' +
'smoothing:"Over-smoothing detected \\u2014 all node colors converging",' +
'tapHint:"Tap a node to see receptive field"}' +
'};' +
'var T=L[LANG]||L.en;' +

// ── State ──
'var nodes=[];var edges=[];' +
'var layerCount=0;var aggMode=0;' + // 0=Mean, 1=Sum, 2=Max
'var selectedNode=-1;' +
'var autoRunning=false;var autoTimer=null;' +
'var dragging=-1;var dragOx=0,dragOy=0;' +
'var particles=[];' + // message animation particles
'var animFrame2=null;' +
'var presetIdx=0;' +
'var canvasW=300,canvasH=320;' +

// ── Node color palette (HSL-based for blending) ──
'var INIT_COLORS=["#EF4444","#F59E0B","#10B981","#3B82F6","#8B5CF6","#EC4899","#14B8A6","#F97316","#6366F1","#84CC16",' +
'"#DC2626","#D97706","#059669","#2563EB","#7C3AED","#DB2777","#0D9488","#EA580C","#4F46E5","#65A30D",' +
'"#EF4444","#F59E0B","#10B981","#3B82F6","#8B5CF6"];' +

// ── Graph generators ──
'function makeSocial(){' +
'nodes=[];edges=[];' +
// Two clusters
'var n1=6,n2=6;' +
'for(var i=0;i<n1;i++){' +
'var angle=i/n1*Math.PI*2;' +
'nodes.push({x:0.3+Math.cos(angle)*0.15,y:0.5+Math.sin(angle)*0.15,color:INIT_COLORS[i],origColor:INIT_COLORS[i]})}' +
'for(var i=0;i<n2;i++){' +
'var angle=i/n2*Math.PI*2;var ci=n1+i;' +
'nodes.push({x:0.7+Math.cos(angle)*0.15,y:0.5+Math.sin(angle)*0.15,color:INIT_COLORS[ci],origColor:INIT_COLORS[ci]})}' +
// Intra-cluster edges
'for(var i=0;i<n1;i++){for(var j=i+1;j<n1;j++){if(Math.random()<0.5)edges.push([i,j])}}' +
'for(var i=0;i<n2;i++){for(var j=i+1;j<n2;j++){if(Math.random()<0.5)edges.push([n1+i,n1+j])}}' +
// Bridge edges
'edges.push([2,n1+1]);edges.push([4,n1+3])}' +

'function makeTree(){' +
'nodes=[];edges=[];' +
// Binary tree depth 3
'var positions=[[0.5,0.12],[0.3,0.35],[0.7,0.35],[0.15,0.58],[0.38,0.58],[0.62,0.58],[0.85,0.58],' +
'[0.08,0.82],[0.22,0.82],[0.32,0.82],[0.44,0.82],[0.56,0.82],[0.68,0.82],[0.78,0.82],[0.92,0.82]];' +
'for(var i=0;i<15;i++){' +
'nodes.push({x:positions[i][0],y:positions[i][1],color:INIT_COLORS[i],origColor:INIT_COLORS[i]})}' +
'for(var i=0;i<7;i++){' +
'var l=2*i+1,r=2*i+2;' +
'if(l<15)edges.push([i,l]);if(r<15)edges.push([i,r])}}' +

'function makeGrid(){' +
'nodes=[];edges=[];' +
'var rows=4,cols=4;' +
'for(var r=0;r<rows;r++){for(var c=0;c<cols;c++){' +
'var idx=r*cols+c;' +
'nodes.push({x:0.2+c*0.2,y:0.15+r*0.2,color:INIT_COLORS[idx],origColor:INIT_COLORS[idx]})}}' +
'for(var r=0;r<rows;r++){for(var c=0;c<cols;c++){' +
'var idx=r*cols+c;' +
'if(c<cols-1)edges.push([idx,idx+1]);' +
'if(r<rows-1)edges.push([idx,idx+cols])}}}' +

'function makeRing(){' +
'nodes=[];edges=[];' +
'var n=12;' +
'for(var i=0;i<n;i++){' +
'var angle=i/n*Math.PI*2-Math.PI/2;' +
'nodes.push({x:0.5+Math.cos(angle)*0.32,y:0.5+Math.sin(angle)*0.32,color:INIT_COLORS[i],origColor:INIT_COLORS[i]})}' +
'for(var i=0;i<n;i++)edges.push([i,(i+1)%n])}' +

'var graphGens=[makeSocial,makeTree,makeGrid,makeRing];' +

// ── Canvas DPR setup ──
'function setupCanvas(cv,h){' +
'var dpr=window.devicePixelRatio||1;' +
'var w=cv.parentElement.clientWidth-4;' +
'cv.style.width=w+"px";cv.style.height=h+"px";' +
'cv.width=w*dpr;cv.height=h*dpr;' +
'canvasW=w;canvasH=h;' +
'var ctx=cv.getContext("2d");ctx.scale(dpr,dpr);return{w:w,h:h}}' +

// ── Force-directed layout step ──
'function forceStep(){' +
'var n=nodes.length;if(n<2)return;' +
'var forces=[];for(var i=0;i<n;i++)forces.push({fx:0,fy:0});' +
// Repulsion between all pairs
'for(var i=0;i<n;i++){for(var j=i+1;j<n;j++){' +
'var dx=nodes[i].x-nodes[j].x;var dy=nodes[i].y-nodes[j].y;' +
'var d=Math.sqrt(dx*dx+dy*dy)+0.001;' +
'var f=0.0008/(d*d);' +
'forces[i].fx+=dx/d*f;forces[i].fy+=dy/d*f;' +
'forces[j].fx-=dx/d*f;forces[j].fy-=dy/d*f}}' +
// Attraction along edges
'for(var e=0;e<edges.length;e++){' +
'var a=edges[e][0],b=edges[e][1];' +
'var dx=nodes[b].x-nodes[a].x;var dy=nodes[b].y-nodes[a].y;' +
'var d=Math.sqrt(dx*dx+dy*dy)+0.001;' +
'var f=(d-0.15)*0.08;' +
'forces[a].fx+=dx/d*f;forces[a].fy+=dy/d*f;' +
'forces[b].fx-=dx/d*f;forces[b].fy-=dy/d*f}' +
// Center gravity
'for(var i=0;i<n;i++){forces[i].fx+=(0.5-nodes[i].x)*0.005;forces[i].fy+=(0.5-nodes[i].y)*0.005}' +
// Apply
'for(var i=0;i<n;i++){' +
'if(i===dragging)continue;' +
'nodes[i].x+=Math.max(-0.02,Math.min(0.02,forces[i].fx));' +
'nodes[i].y+=Math.max(-0.02,Math.min(0.02,forces[i].fy));' +
'nodes[i].x=Math.max(0.05,Math.min(0.95,nodes[i].x));' +
'nodes[i].y=Math.max(0.05,Math.min(0.95,nodes[i].y))}}' +

// ── Get neighbors ──
'function getNeighbors(nodeIdx){' +
'var nbrs=[];' +
'for(var e=0;e<edges.length;e++){' +
'if(edges[e][0]===nodeIdx)nbrs.push(edges[e][1]);' +
'if(edges[e][1]===nodeIdx)nbrs.push(edges[e][0])}' +
'return nbrs}' +

// ── K-hop neighborhood ──
'function getKHopNodes(nodeIdx,k){' +
'var visited=new Set();visited.add(nodeIdx);' +
'var current=[nodeIdx];' +
'var layers=[new Set([nodeIdx])];' +
'for(var hop=0;hop<k;hop++){' +
'var next=[];var hopSet=new Set();' +
'for(var ci=0;ci<current.length;ci++){' +
'var nbrs=getNeighbors(current[ci]);' +
'for(var ni=0;ni<nbrs.length;ni++){' +
'if(!visited.has(nbrs[ni])){visited.add(nbrs[ni]);next.push(nbrs[ni]);hopSet.add(nbrs[ni])}}}' +
'layers.push(hopSet);current=next}' +
'return layers}' +

// ── Color parsing / mixing helpers ──
'function hexToRGB(hex){' +
'var r=parseInt(hex.slice(1,3),16);var g=parseInt(hex.slice(3,5),16);var b=parseInt(hex.slice(5,7),16);' +
'return[r,g,b]}' +
'function rgbToHex(r,g,b){' +
'return "#"+((1<<24)+(Math.round(r)<<16)+(Math.round(g)<<8)+Math.round(b)).toString(16).slice(1)}' +

// ── Message passing ──
'function doMessagePass(){' +
'layerCount++;' +
'var newColors=[];' +
'for(var i=0;i<nodes.length;i++){' +
'var nbrs=getNeighbors(i);' +
'if(nbrs.length===0){newColors.push(nodes[i].color);continue}' +
// Collect neighbor colors + self
'var colors=[hexToRGB(nodes[i].color)];' +
'for(var j=0;j<nbrs.length;j++){colors.push(hexToRGB(nodes[nbrs[j]].color))}' +
// Aggregate
'var r,g,b;' +
'if(aggMode===0){' + // Mean
'r=0;g=0;b=0;for(var c=0;c<colors.length;c++){r+=colors[c][0];g+=colors[c][1];b+=colors[c][2]}' +
'r/=colors.length;g/=colors.length;b/=colors.length}' +
'else if(aggMode===1){' + // Sum (clamped)
'r=0;g=0;b=0;for(var c=0;c<colors.length;c++){r+=colors[c][0];g+=colors[c][1];b+=colors[c][2]}' +
'r=Math.min(255,r/2);g=Math.min(255,g/2);b=Math.min(255,b/2)}' +
'else{' + // Max
'r=0;g=0;b=0;for(var c=0;c<colors.length;c++){if(colors[c][0]>r)r=colors[c][0];if(colors[c][1]>g)g=colors[c][1];if(colors[c][2]>b)b=colors[c][2]}}' +
'newColors.push(rgbToHex(r,g,b))}' +
// Spawn animation particles
'spawnParticles();' +
// Apply new colors
'for(var i=0;i<nodes.length;i++){nodes[i].color=newColors[i]}' +
'drawGraph();updateStats();notifyHeight()}' +

// ── Spawn particles on edges ──
'function spawnParticles(){' +
'particles=[];' +
'for(var e=0;e<edges.length;e++){' +
'particles.push({edge:e,t:0,dir:1});' +
'particles.push({edge:e,t:1,dir:-1})}}' +

// ── Auto propagate ──
'function toggleAuto(){' +
'autoRunning=!autoRunning;' +
'document.getElementById("btnAuto").textContent=autoRunning?T.autoStop:T.auto;' +
'document.getElementById("btnAuto").className=autoRunning?"btn btn-stop":"btn";' +
'if(autoRunning){autoTimer=setInterval(function(){doMessagePass()},1200)}' +
'else{if(autoTimer){clearInterval(autoTimer);autoTimer=null}}}' +

// ── Draw ──
'function drawGraph(){' +
'var cv=document.getElementById("cvMain");' +
'var dim=setupCanvas(cv,320);var w=dim.w,h=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var textC=cs.getPropertyValue("--text").trim();' +
'var text3C=cs.getPropertyValue("--text3").trim();' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var isDk=document.documentElement.classList.contains("dark");' +
'function toX(v){return 10+v*(w-20)}' +
'function toY(v){return 10+v*(h-20)}' +

// Draw receptive field if node selected
'if(selectedNode>=0&&layerCount>0){' +
'var layers=getKHopNodes(selectedNode,Math.min(layerCount,4));' +
// Draw hop circles from outer to inner
'var hopColors=[isDk?"rgba(94,234,212,0.06)":"rgba(94,234,212,0.06)",' +
'isDk?"rgba(94,234,212,0.12)":"rgba(94,234,212,0.10)",' +
'isDk?"rgba(94,234,212,0.18)":"rgba(94,234,212,0.16)",' +
'isDk?"rgba(94,234,212,0.25)":"rgba(94,234,212,0.22)"];' +
'var radii=[80,55,35,20];' +
'for(var hop=Math.min(layers.length-1,3);hop>=1;hop--){' +
'var s2=layers[hop];s2.forEach(function(ni){' +
'ctx.beginPath();ctx.arc(toX(nodes[ni].x),toY(nodes[ni].y),radii[hop-1],0,Math.PI*2);' +
'ctx.fillStyle=hopColors[hop-1];ctx.fill()})}}' +

// Draw edges
'ctx.lineWidth=1.5;' +
'for(var e=0;e<edges.length;e++){' +
'var a=edges[e][0],b=edges[e][1];' +
'ctx.strokeStyle=borderC;' +
'ctx.beginPath();ctx.moveTo(toX(nodes[a].x),toY(nodes[a].y));' +
'ctx.lineTo(toX(nodes[b].x),toY(nodes[b].y));ctx.stroke()}' +

// Draw particles
'for(var p=0;p<particles.length;p++){' +
'var pt=particles[p];' +
'var a=edges[pt.edge][0],b=edges[pt.edge][1];' +
'var px=toX(nodes[a].x)+(toX(nodes[b].x)-toX(nodes[a].x))*pt.t;' +
'var py=toY(nodes[a].y)+(toY(nodes[b].y)-toY(nodes[a].y))*pt.t;' +
'ctx.beginPath();ctx.arc(px,py,3,0,Math.PI*2);' +
'ctx.fillStyle=tealC;ctx.globalAlpha=0.8;ctx.fill();ctx.globalAlpha=1}' +

// Draw nodes
'var nodeR=12;' +
'for(var i=0;i<nodes.length;i++){' +
'var nx=toX(nodes[i].x),ny=toY(nodes[i].y);' +
'ctx.beginPath();ctx.arc(nx,ny,nodeR,0,Math.PI*2);' +
'ctx.fillStyle=nodes[i].color;ctx.fill();' +
// Selection ring
'if(i===selectedNode){ctx.strokeStyle=tealC;ctx.lineWidth=3}' +
'else{ctx.strokeStyle=isDk?"#000":"#fff";ctx.lineWidth=2}' +
'ctx.stroke();' +
// Node index label
'ctx.fillStyle=isDk?"#000":"#fff";ctx.font="bold 8px monospace";ctx.textAlign="center";ctx.textBaseline="middle";' +
'ctx.fillText(i.toString(),nx,ny)}' +

// Hint text
'ctx.fillStyle=text3C;ctx.font="9px -apple-system,sans-serif";ctx.textAlign="center";' +
'ctx.fillText(T.tapHint,w/2,h-4);' +
'}' +

// ── Animation loop for force + particles ──
'var layoutTimer=null;' +
'function startLayout(){' +
'if(layoutTimer)return;' +
'var tick=0;' +
'layoutTimer=setInterval(function(){' +
'forceStep();' +
// Animate particles
'var alive=[];' +
'for(var p=0;p<particles.length;p++){' +
'particles[p].t+=particles[p].dir*0.06;' +
'if(particles[p].t>=0&&particles[p].t<=1)alive.push(particles[p])}' +
'particles=alive;' +
'drawGraph();' +
'tick++;if(tick>120&&particles.length===0){clearInterval(layoutTimer);layoutTimer=null}' +
'},50)}' +

// ── Touch handling ──
'function initTouch(){' +
'var cv=document.getElementById("cvMain");' +
'function getPos(e){' +
'var rect=cv.getBoundingClientRect();var t=e.touches?e.touches[0]:e;' +
'return{x:(t.clientX-rect.left)/(rect.width),y:(t.clientY-rect.top)/(rect.height)}}' +

// Adjust for canvas padding
'function toCv(pos){return{x:(pos.x*canvasW-10)/(canvasW-20),y:(pos.y*canvasH-10)/(canvasH-20)}}' +

'cv.addEventListener("touchstart",function(e){' +
'var pos=getPos(e);var cvp=toCv(pos);' +
'var closest=-1;var minD=0.06;' +
'for(var i=0;i<nodes.length;i++){' +
'var dx=nodes[i].x-cvp.x;var dy=nodes[i].y-cvp.y;' +
'var d=Math.sqrt(dx*dx+dy*dy);' +
'if(d<minD){minD=d;closest=i}}' +
'if(closest>=0){dragging=closest;selectedNode=closest;drawGraph();updateStats();e.preventDefault()}' +
'},{passive:false});' +

'cv.addEventListener("touchmove",function(e){' +
'if(dragging<0)return;e.preventDefault();' +
'var pos=getPos(e);var cvp=toCv(pos);' +
'nodes[dragging].x=Math.max(0.05,Math.min(0.95,cvp.x));' +
'nodes[dragging].y=Math.max(0.05,Math.min(0.95,cvp.y));' +
'drawGraph()},{passive:false});' +

'cv.addEventListener("touchend",function(){dragging=-1});' +
'cv.addEventListener("touchcancel",function(){dragging=-1})}' +

// ── Preset ──
'function onPreset(idx){' +
'presetIdx=idx;' +
'for(var i=0;i<4;i++){document.getElementById("pre"+i).className=i===idx?"preset active":"preset"}' +
'if(autoRunning)toggleAuto();' +
'graphGens[idx]();layerCount=0;selectedNode=-1;particles=[];' +
'if(layoutTimer){clearInterval(layoutTimer);layoutTimer=null}' +
'startLayout();updateStats();notifyHeight()}' +

// ── Aggregation mode ──
'function onAgg(idx){' +
'aggMode=idx;' +
'for(var i=0;i<3;i++){document.getElementById("agg"+i).className=i===idx?"preset active":"preset"}}' +

// ── Reset ──
'function onReset(){' +
'if(autoRunning)toggleAuto();' +
'graphGens[presetIdx]();layerCount=0;selectedNode=-1;particles=[];' +
'if(layoutTimer){clearInterval(layoutTimer);layoutTimer=null}' +
'startLayout();updateStats();notifyHeight()}' +

// ── Update stats ──
'function updateStats(){' +
'var box=document.getElementById("statsBox");' +
'var s="<span class=\\"hi\\">"+T.layer+"</span> "+layerCount+"<br>";' +
's+=T.nodes+": "+nodes.length+" | "+T.edges+": "+edges.length+"<br>";' +
'if(selectedNode>=0){' +
's+=T.selected+": <span class=\\"warn\\">Node "+selectedNode+"</span><br>";' +
'var nbrs=getNeighbors(selectedNode);' +
's+="1-hop: ["+nbrs.join(", ")+"]<br>";' +
's+="Color: <span style=\\"color:"+nodes[selectedNode].color+"\\">"+nodes[selectedNode].color+"</span><br>"}' +
// Over-smoothing detection
'if(layerCount>=4){' +
'var allSimilar=true;var refRGB=hexToRGB(nodes[0].color);' +
'for(var i=1;i<nodes.length;i++){' +
'var c=hexToRGB(nodes[i].color);' +
'var diff=Math.abs(c[0]-refRGB[0])+Math.abs(c[1]-refRGB[1])+Math.abs(c[2]-refRGB[2]);' +
'if(diff>60){allSimilar=false;break}}' +
'if(allSimilar){s+="<br><span class=\\"warn\\">"+T.smoothing+"</span>"}}' +
'box.innerHTML=s}' +

// ── Height notification ──
'function notifyHeight(){' +
'var h=document.body.scrollHeight+20;' +
'try{window.ReactNativeWebView.postMessage(JSON.stringify({type:"height",value:h}))}catch(e){}}' +

// ── Init labels ──
'document.getElementById("lbl-main").textContent=T.main;' +
'document.getElementById("lbl-graph").textContent=T.graph;' +
'document.getElementById("lbl-ctrl").textContent=T.ctrl;' +
'document.getElementById("lbl-stats").textContent=T.stats;' +
'document.getElementById("pre0").textContent=T.pre0;' +
'document.getElementById("pre1").textContent=T.pre1;' +
'document.getElementById("pre2").textContent=T.pre2;' +
'document.getElementById("pre3").textContent=T.pre3;' +
'document.getElementById("agg0").textContent=T.aggMean;' +
'document.getElementById("agg1").textContent=T.aggSum;' +
'document.getElementById("agg2").textContent=T.aggMax;' +
'document.getElementById("btnPass").textContent=T.pass;' +
'document.getElementById("btnAuto").textContent=T.auto;' +
'document.getElementById("btnReset").textContent=T.reset;' +

// ── Init ──
'makeSocial();startLayout();initTouch();updateStats();' +
'window.addEventListener("resize",function(){drawGraph();notifyHeight()});' +
'setTimeout(notifyHeight,100);' +

'</script></body></html>';
}
