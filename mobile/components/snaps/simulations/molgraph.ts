/**
 * Molecular Graph Representation interactive simulation — self-contained HTML/JS/Canvas
 *
 * Features:
 * - Left canvas: Molecular graph — atoms as colored circles with element symbols,
 *   bonds as lines (single/double). Force-directed layout
 * - Right area: Adjacency matrix heatmap (NxN)
 * - Molecule presets: H2O, Ethanol, Caffeine, Benzene, Aspirin
 * - Node tap: Select atom → highlight neighbors + adjacency matrix row
 * - "Message Pass" button: GNN-style 1-hop message passing animation
 * - Feature View toggle: Show atom properties overlay
 * - Drag nodes to rearrange graph layout
 * - Stats: Node count, edge count, selected atom info, message passing hops
 * - Dark/light theme, Korean/English bilingual
 */

export function getMolGraphSimulationHTML(isDark: boolean, lang: string): string {
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
'.btn{flex:1;padding:10px 6px;border:2px solid var(--border);background:var(--surface);color:var(--text);font-size:12px;font-weight:700;text-align:center;cursor:pointer;letter-spacing:0.5px;-webkit-tap-highlight-color:transparent;min-height:44px;display:flex;align-items:center;justify-content:center}' +
'.btn:active{opacity:0.7}' +
'.btn-primary{background:var(--teal);border-color:var(--teal);color:#1A1816}' +
'.btn-stop{background:var(--accent);border-color:var(--accent);color:#1A1816}' +
'.btn-on{background:var(--tealLight);border-color:var(--teal);color:var(--teal)}' +
'.stats{font-family:monospace;font-size:11px;line-height:2;color:var(--text2)}' +
'.stats .hi{color:var(--teal);font-weight:700}' +
'.stats .warn{color:var(--accent);font-weight:700}' +
'.preset-row{display:flex;gap:6px;margin-bottom:8px;flex-wrap:wrap}' +
'.preset{flex:1;min-width:50px;padding:10px 4px;border:2px solid var(--border);background:var(--surface);color:var(--text2);font-size:10px;font-weight:700;text-align:center;cursor:pointer;letter-spacing:0.3px;min-height:44px;display:flex;align-items:center;justify-content:center}' +
'.preset:active{opacity:0.7}' +
'.preset.active{border-color:var(--teal);color:var(--teal)}' +
'</style></head><body>' +

// ── Graph Canvas Panel ──
'<div class="panel"><div class="label" id="lbl-graph"></div>' +
'<canvas id="cvGraph" height="260"></canvas></div>' +

// ── Adjacency Matrix Panel ──
'<div class="panel"><div class="label" id="lbl-adj"></div>' +
'<canvas id="cvAdj" height="200"></canvas></div>' +

// ── Controls Panel ──
'<div class="panel"><div class="label" id="lbl-ctrl"></div>' +
'<div class="preset-row" id="presetRow"></div>' +
'<div class="btn-row">' +
'<div class="btn btn-primary" id="btnMsg" onclick="messagePass()"></div>' +
'<div class="btn" id="btnFeature" onclick="toggleFeature()"></div>' +
'<div class="btn" id="btnReset" onclick="onReset()"></div>' +
'</div></div>' +

// ── Stats Panel ──
'<div class="panel"><div class="label" id="lbl-stats"></div>' +
'<div class="stats" id="statsBox"></div></div>' +

'<script>' +
'var LANG="' + lang + '";' +

// ── Labels ──
'var L={' +
'ko:{graph:"\\uBD84\\uC790 \\uADF8\\uB798\\uD504",adj:"\\uC778\\uC811 \\uD589\\uB82C",ctrl:"\\uCEE8\\uD2B8\\uB864",' +
'stats:"\\uD1B5\\uACC4",' +
'msgPass:"\\uBA54\\uC2DC\\uC9C0 \\uD328\\uC2F1",feature:"\\uD53C\\uCC98 \\uBCF4\\uAE30",reset:"\\u21BA \\uB9AC\\uC14B",' +
'nodes:"\\uB178\\uB4DC",edges:"\\uC5E3\\uC9C0",selected:"\\uC120\\uD0DD\\uB428",' +
'element:"\\uC6D0\\uC18C",degree:"\\uCC28\\uC218",hops:"\\uBA54\\uC2DC\\uC9C0 \\uD328\\uC2F1 \\uD6C5",' +
'neighbors:"\\uC774\\uC6C3",none:"\\uC5C6\\uC74C",tapHint:"\\uC6D0\\uC790\\uB97C \\uD0ED\\uD558\\uC5EC \\uC120\\uD0DD",' +
'featureOn:"\\uD53C\\uCC98 \\uC228\\uAE30\\uAE30",dragHint:"\\uB4DC\\uB798\\uADF8\\uD558\\uC5EC \\uBC30\\uCE58 \\uBCC0\\uACBD"},' +
'en:{graph:"MOLECULAR GRAPH",adj:"ADJACENCY MATRIX",ctrl:"CONTROLS",' +
'stats:"STATISTICS",' +
'msgPass:"Message Pass",feature:"Features",reset:"\\u21BA Reset",' +
'nodes:"Nodes",edges:"Edges",selected:"Selected",' +
'element:"Element",degree:"Degree",hops:"Msg-Pass Hops",' +
'neighbors:"Neighbors",none:"None",tapHint:"Tap atom to select",' +
'featureOn:"Hide Features",dragHint:"Drag to rearrange"}' +
'};' +
'var T=L[LANG]||L.en;' +

// ── Atom element colors + properties ──
'var ELEM={' +
'C:{color:"#6B7280",z:6,name:"Carbon"},' +
'O:{color:"#DC2626",z:8,name:"Oxygen"},' +
'N:{color:"#2563EB",z:7,name:"Nitrogen"},' +
'H:{color:"#A8A29E",z:1,name:"Hydrogen"},' +
'S:{color:"#EAB308",z:16,name:"Sulfur"}};' +

// ── Molecule definitions ──
// Each: {name, atoms:[{el,x,y}], bonds:[[i,j,order]]}
'var MOLECULES={' +

// H2O
'H2O:{name:"H\\u2082O",atoms:[' +
'{el:"O",x:0.5,y:0.4},' +
'{el:"H",x:0.3,y:0.65},' +
'{el:"H",x:0.7,y:0.65}],' +
'bonds:[[0,1,1],[0,2,1]]},' +

// Ethanol C2H5OH
'Ethanol:{name:"C\\u2082H\\u2085OH",atoms:[' +
'{el:"C",x:0.3,y:0.4},' +
'{el:"C",x:0.5,y:0.4},' +
'{el:"O",x:0.7,y:0.4},' +
'{el:"H",x:0.82,y:0.4},' +
'{el:"H",x:0.3,y:0.2},' +
'{el:"H",x:0.15,y:0.5},' +
'{el:"H",x:0.15,y:0.35},' +
'{el:"H",x:0.5,y:0.2},' +
'{el:"H",x:0.5,y:0.6}],' +
'bonds:[[0,1,1],[1,2,1],[2,3,1],[0,4,1],[0,5,1],[0,6,1],[1,7,1],[1,8,1]]},' +

// Benzene C6H6
'Benzene:{name:"C\\u2086H\\u2086",atoms:[' +
'{el:"C",x:0.5,y:0.2},' +
'{el:"C",x:0.67,y:0.3},' +
'{el:"C",x:0.67,y:0.5},' +
'{el:"C",x:0.5,y:0.6},' +
'{el:"C",x:0.33,y:0.5},' +
'{el:"C",x:0.33,y:0.3},' +
'{el:"H",x:0.5,y:0.08},' +
'{el:"H",x:0.82,y:0.24},' +
'{el:"H",x:0.82,y:0.56},' +
'{el:"H",x:0.5,y:0.72},' +
'{el:"H",x:0.18,y:0.56},' +
'{el:"H",x:0.18,y:0.24}],' +
'bonds:[[0,1,2],[1,2,1],[2,3,2],[3,4,1],[4,5,2],[5,0,1],' +
'[0,6,1],[1,7,1],[2,8,1],[3,9,1],[4,10,1],[5,11,1]]},' +

// Caffeine C8H10N4O2
'Caffeine:{name:"C\\u2088H\\u2081\\u2080N\\u2084O\\u2082",atoms:[' +
// Ring 1 (pyrimidine-like): N1-C2-N3-C4-C5-C6
'{el:"N",x:0.3,y:0.3},' +   // 0 N1
'{el:"C",x:0.42,y:0.22},' +  // 1 C2
'{el:"N",x:0.55,y:0.3},' +   // 2 N3
'{el:"C",x:0.55,y:0.45},' +  // 3 C4
'{el:"C",x:0.42,y:0.52},' +  // 4 C5
'{el:"C",x:0.3,y:0.45},' +   // 5 C6
// Ring 2 (imidazole): C4-N7-C8-N9-C5
'{el:"N",x:0.65,y:0.52},' +  // 6 N7
'{el:"C",x:0.68,y:0.65},' +  // 7 C8
'{el:"N",x:0.55,y:0.68},' +  // 8 N9
// Oxygens
'{el:"O",x:0.42,y:0.08},' +  // 9 =O on C2
'{el:"O",x:0.18,y:0.52},' +  // 10 =O on C6
// Methyl H (simplified — show CH3 as single H representative)
'{el:"C",x:0.18,y:0.2},' +   // 11 CH3 on N1
'{el:"C",x:0.65,y:0.22},' +  // 12 CH3 on N3
'{el:"C",x:0.48,y:0.8},' +   // 13 CH3 on N9
'{el:"H",x:0.78,y:0.72}],' + // 14 H on C8
'bonds:[[0,1,1],[1,2,1],[2,3,1],[3,4,2],[4,5,1],[5,0,1],' +
'[3,6,1],[6,7,2],[7,8,1],[8,4,1],' +
'[1,9,2],[5,10,2],' +
'[0,11,1],[2,12,1],[8,13,1],[7,14,1]]},' +

// Aspirin C9H8O4
'Aspirin:{name:"C\\u2089H\\u2088O\\u2084",atoms:[' +
// Benzene ring
'{el:"C",x:0.35,y:0.25},' +  // 0
'{el:"C",x:0.48,y:0.18},' +  // 1
'{el:"C",x:0.6,y:0.25},' +   // 2
'{el:"C",x:0.6,y:0.4},' +    // 3
'{el:"C",x:0.48,y:0.47},' +  // 4
'{el:"C",x:0.35,y:0.4},' +   // 5
// Carboxyl group
'{el:"C",x:0.22,y:0.2},' +   // 6
'{el:"O",x:0.22,y:0.07},' +  // 7 =O
'{el:"O",x:0.1,y:0.28},' +   // 8 -OH
// Acetyl group
'{el:"O",x:0.72,y:0.2},' +   // 9 ester O
'{el:"C",x:0.84,y:0.25},' +  // 10 C=O
'{el:"O",x:0.84,y:0.38},' +  // 11 =O
'{el:"C",x:0.92,y:0.15},' +  // 12 CH3
// Hydrogens (key positions)
'{el:"H",x:0.48,y:0.06},' +  // 13
'{el:"H",x:0.7,y:0.45},' +   // 14
'{el:"H",x:0.48,y:0.58},' +  // 15
'{el:"H",x:0.28,y:0.48},' +  // 16
'{el:"H",x:0.04,y:0.22},' +  // 17 OH
'{el:"H",x:0.92,y:0.06},' +  // 18
'{el:"H",x:0.98,y:0.22},' +  // 19
'{el:"H",x:0.88,y:0.08}],' + // 20
'bonds:[[0,1,2],[1,2,1],[2,3,2],[3,4,1],[4,5,2],[5,0,1],' +
'[0,6,1],[6,7,2],[6,8,1],' +
'[2,9,1],[9,10,1],[10,11,2],[10,12,1],' +
'[1,13,1],[3,14,1],[4,15,1],[5,16,1],[8,17,1],[12,18,1],[12,19,1],[12,20,1]]}}' +
';' +

// ── State ──
'var curMol="H2O";' +
'var atoms=[];var bonds=[];' +
'var selectedAtom=-1;' +
'var msgHops=0;' +
'var msgReach=[];' + // set of atom indices reached by message passing
'var showFeatures=false;' +
'var dragIdx=-1;var dragging=false;' +

// ── Load molecule ──
'function loadMol(key){' +
'curMol=key;selectedAtom=-1;msgHops=0;msgReach=[];' +
'var mol=MOLECULES[key];' +
'atoms=mol.atoms.map(function(a){return{el:a.el,x:a.x,y:a.y}});' +
'bonds=mol.bonds.map(function(b){return{i:b[0],j:b[1],order:b[2]}});' +
'updatePresets();drawAll();notifyHeight()}' +

// ── Adjacency helpers ──
'function getAdj(){' +
'var n=atoms.length;var adj=[];' +
'for(var i=0;i<n;i++){adj[i]=[];for(var j=0;j<n;j++)adj[i][j]=0}' +
'for(var b=0;b<bonds.length;b++){adj[bonds[b].i][bonds[b].j]=bonds[b].order;adj[bonds[b].j][bonds[b].i]=bonds[b].order}' +
'return adj}' +

'function getNeighbors(idx){' +
'var nb=[];' +
'for(var b=0;b<bonds.length;b++){' +
'if(bonds[b].i===idx)nb.push(bonds[b].j);' +
'if(bonds[b].j===idx)nb.push(bonds[b].i)}' +
'return nb}' +

'function getDegree(idx){return getNeighbors(idx).length}' +

// ── Message passing ──
'function messagePass(){' +
'if(selectedAtom<0)return;' +
'msgHops++;' +
'if(msgHops===1){msgReach=[selectedAtom]}' +
// BFS expand by 1 hop
'var newReach=msgReach.slice();' +
'for(var k=0;k<msgReach.length;k++){' +
'var nb=getNeighbors(msgReach[k]);' +
'for(var j=0;j<nb.length;j++){' +
'if(newReach.indexOf(nb[j])<0)newReach.push(nb[j])}}' +
'msgReach=newReach;' +
'drawAll();notifyHeight()}' +

// ── Canvas setup ──
'function setupCanvas(cv,h){var dpr=window.devicePixelRatio||1;' +
'var w=cv.parentElement.clientWidth-4;' +
'cv.style.width=w+"px";cv.style.height=h+"px";' +
'cv.width=w*dpr;cv.height=h*dpr;' +
'var ctx=cv.getContext("2d");ctx.scale(dpr,dpr);return{w:w,h:h}}' +

// ── Draw molecular graph ──
'function drawGraph(){' +
'var cv=document.getElementById("cvGraph");' +
'var dim=setupCanvas(cv,260);var w=dim.w,h=dim.h;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var accentC=cs.getPropertyValue("--accent").trim();' +
'var textC=cs.getPropertyValue("--text").trim();' +
'var text3C=cs.getPropertyValue("--text3").trim();' +
'var surfaceC=cs.getPropertyValue("--surface").trim();' +
'var bgC=cs.getPropertyValue("--bg").trim();' +

'var pad=20;var gw=w-2*pad;var gh=h-2*pad;' +

// Determine atom radius based on count
'var R=atoms.length<=6?18:atoms.length<=15?13:10;' +

// Convert normalized coords to canvas
'function toX(nx){return pad+nx*gw}' +
'function toY(ny){return pad+ny*gh}' +

// Draw bonds
'for(var b=0;b<bonds.length;b++){' +
'var bond=bonds[b];' +
'var a1=atoms[bond.i];var a2=atoms[bond.j];' +
'var x1=toX(a1.x),y1=toY(a1.y),x2=toX(a2.x),y2=toY(a2.y);' +
// Color bond if both atoms in msgReach
'var inReach=msgReach.indexOf(bond.i)>=0&&msgReach.indexOf(bond.j)>=0;' +
'ctx.strokeStyle=inReach?tealC:borderC;' +
'ctx.lineWidth=inReach?3:2;' +
'if(bond.order===1){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke()}' +
'else{' +
// Double bond: two parallel lines
'var dx=x2-x1;var dy=y2-y1;var len=Math.sqrt(dx*dx+dy*dy);' +
'if(len>0){var nx2=-dy/len*3;var ny2=dx/len*3;' +
'ctx.beginPath();ctx.moveTo(x1+nx2,y1+ny2);ctx.lineTo(x2+nx2,y2+ny2);ctx.stroke();' +
'ctx.beginPath();ctx.moveTo(x1-nx2,y1-ny2);ctx.lineTo(x2-nx2,y2-ny2);ctx.stroke()}}}' +

// Draw atoms
'for(var i=0;i<atoms.length;i++){' +
'var a=atoms[i];var x=toX(a.x);var y=toY(a.y);' +
'var inReach2=msgReach.indexOf(i)>=0;' +
'var isSelected=i===selectedAtom;' +
'var isNeighbor=selectedAtom>=0&&getNeighbors(selectedAtom).indexOf(i)>=0;' +

// Glow for message reach
'if(inReach2){ctx.fillStyle=tealC;ctx.globalAlpha=0.2;' +
'ctx.beginPath();ctx.arc(x,y,R+6,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1}' +

// Atom circle
'var elemInfo=ELEM[a.el]||{color:"#888",z:0};' +
'ctx.fillStyle=elemInfo.color;' +
'if(isSelected){ctx.fillStyle=tealC}' +
'else if(isNeighbor){ctx.fillStyle=accentC}' +
'ctx.beginPath();ctx.arc(x,y,R,0,Math.PI*2);ctx.fill();' +

// Border
'ctx.strokeStyle=isSelected?tealC:isNeighbor?accentC:borderC;' +
'ctx.lineWidth=isSelected?3:2;' +
'ctx.stroke();' +

// Element symbol
'ctx.fillStyle="#FFF";ctx.font="bold "+(R>14?"13":"10")+"px -apple-system,sans-serif";' +
'ctx.textAlign="center";ctx.textBaseline="middle";' +
'ctx.fillText(a.el,x,y);' +

// Feature overlay
'if(showFeatures){' +
'ctx.fillStyle=textC;ctx.font="9px monospace";ctx.textAlign="left";' +
'ctx.fillText("Z="+elemInfo.z,x+R+3,y-4);' +
'ctx.fillText("d="+getDegree(i),x+R+3,y+8)}}' +

// Hint text
'ctx.fillStyle=text3C;ctx.font="9px -apple-system,sans-serif";ctx.textAlign="center";' +
'ctx.fillText(T.tapHint+" / "+T.dragHint,w/2,h-4)}' +

// ── Draw adjacency matrix ──
'function drawAdj(){' +
'var cv=document.getElementById("cvAdj");' +
'var n=atoms.length;' +
'var matH=Math.min(200,Math.max(100,n*16+30));' +
'var dim=setupCanvas(cv,matH);var w=dim.w,h=matH;' +
'var ctx=cv.getContext("2d");ctx.clearRect(0,0,w,h);' +
'var cs=getComputedStyle(document.documentElement);' +
'var borderC=cs.getPropertyValue("--border").trim();' +
'var tealC=cs.getPropertyValue("--teal").trim();' +
'var accentC=cs.getPropertyValue("--accent").trim();' +
'var text3C=cs.getPropertyValue("--text3").trim();' +
'var surfaceC=cs.getPropertyValue("--surface").trim();' +

'var adj=getAdj();' +
'var pad=28;var matSize=Math.min(w-pad-10,h-pad-10);' +
'var cellSize=Math.floor(matSize/n);' +
'if(cellSize<4)cellSize=4;' +
'var mw=cellSize*n;' +
'var offX=Math.floor((w-mw)/2+pad/2);' +
'var offY=pad;' +

// Row/col labels
'ctx.fillStyle=text3C;ctx.font="8px monospace";ctx.textAlign="center";ctx.textBaseline="middle";' +
'for(var i=0;i<n;i++){' +
'var lbl=atoms[i].el+(i<10?i:"");' +
'ctx.fillText(lbl,offX+i*cellSize+cellSize/2,offY-10);' +
'ctx.fillText(lbl,offX-14,offY+i*cellSize+cellSize/2)}' +

// Matrix cells
'for(var r=0;r<n;r++){for(var c=0;c<n;c++){' +
'var val=adj[r][c];' +
'var cx=offX+c*cellSize;var cy=offY+r*cellSize;' +
'var isHighlightRow=r===selectedAtom||c===selectedAtom;' +
'if(val>0){ctx.fillStyle=isHighlightRow?tealC:(val===2?accentC:"rgba(94,234,212,0.5)")}' +
'else{ctx.fillStyle=isHighlightRow?"rgba(94,234,212,0.08)":surfaceC}' +
'ctx.fillRect(cx,cy,cellSize-1,cellSize-1)}}' +

// Grid lines
'ctx.strokeStyle=borderC;ctx.lineWidth=0.5;' +
'for(var i=0;i<=n;i++){' +
'ctx.beginPath();ctx.moveTo(offX+i*cellSize,offY);ctx.lineTo(offX+i*cellSize,offY+n*cellSize);ctx.stroke();' +
'ctx.beginPath();ctx.moveTo(offX,offY+i*cellSize);ctx.lineTo(offX+n*cellSize,offY+i*cellSize);ctx.stroke()}}' +

// ── Presets ──
'var PRESET_KEYS=["H2O","Ethanol","Benzene","Caffeine","Aspirin"];' +
'function updatePresets(){' +
'var box=document.getElementById("presetRow");box.innerHTML="";' +
'for(var i=0;i<PRESET_KEYS.length;i++){' +
'var k=PRESET_KEYS[i];' +
'var div=document.createElement("div");' +
'div.className=k===curMol?"preset active":"preset";' +
'div.textContent=MOLECULES[k].name;' +
'div.setAttribute("onclick","loadMol(\\x27"+k+"\\x27)");' +
'box.appendChild(div)}}' +

// ── Feature toggle ──
'function toggleFeature(){' +
'showFeatures=!showFeatures;' +
'document.getElementById("btnFeature").textContent=showFeatures?T.featureOn:T.feature;' +
'document.getElementById("btnFeature").className=showFeatures?"btn btn-on":"btn";' +
'drawAll()}' +

// ── Reset ──
'function onReset(){' +
'selectedAtom=-1;msgHops=0;msgReach=[];showFeatures=false;' +
'document.getElementById("btnFeature").textContent=T.feature;' +
'document.getElementById("btnFeature").className="btn";' +
'loadMol(curMol)}' +

// ── Draw all ──
'function drawAll(){drawGraph();drawAdj();updateStats();notifyHeight()}' +

// ── Update stats ──
'function updateStats(){' +
'var box=document.getElementById("statsBox");' +
'var s=T.nodes+": <span class=\\"hi\\">"+atoms.length+"</span> &nbsp; "+T.edges+": <span class=\\"hi\\">"+bonds.length+"</span><br>";' +
'if(selectedAtom>=0){' +
'var a=atoms[selectedAtom];var elemInfo=ELEM[a.el]||{z:0,name:a.el};' +
's+=T.selected+": <span class=\\"hi\\">#"+selectedAtom+" "+a.el+"</span> ("+elemInfo.name+")<br>";' +
's+=T.element+": Z=<span class=\\"warn\\">"+elemInfo.z+"</span> &nbsp; "+T.degree+": <span class=\\"warn\\">"+getDegree(selectedAtom)+"</span><br>";' +
'var nb=getNeighbors(selectedAtom);' +
's+=T.neighbors+": "+nb.map(function(n2){return atoms[n2].el+n2}).join(", ")+"<br>"}' +
'else{s+=T.selected+": "+T.none+"<br>"}' +
's+=T.hops+": <span class=\\"hi\\">"+msgHops+"</span>";' +
'if(msgReach.length>0){s+=" ("+msgReach.length+"/"+atoms.length+" reached)"}' +
'box.innerHTML=s}' +

// ── Tap / Drag handling on graph canvas ──
'var touchStart={x:0,y:0};var hasMoved=false;' +
'function findAtomAt(px,py){' +
'var cv=document.getElementById("cvGraph");var rect=cv.getBoundingClientRect();' +
'var x=px-rect.left;var y=py-rect.top;' +
'var pad2=20;var gw=rect.width-2*pad2;var gh=rect.height-2*pad2;' +
'var R2=atoms.length<=6?18:atoms.length<=15?13:10;' +
'for(var i=0;i<atoms.length;i++){' +
'var ax=pad2+atoms[i].x*gw;var ay=pad2+atoms[i].y*gh;' +
'var dx=x-ax;var dy=y-ay;' +
'if(dx*dx+dy*dy<(R2+8)*(R2+8))return i}' +
'return-1}' +

'function onPointerDown(px,py){' +
'touchStart={x:px,y:py};hasMoved=false;' +
'var idx=findAtomAt(px,py);' +
'if(idx>=0){dragIdx=idx;dragging=true}}' +

'function onPointerMove(px,py){' +
'if(!dragging||dragIdx<0)return;' +
'var dx=px-touchStart.x;var dy=py-touchStart.y;' +
'if(Math.abs(dx)>3||Math.abs(dy)>3)hasMoved=true;' +
'var cv=document.getElementById("cvGraph");var rect=cv.getBoundingClientRect();' +
'var pad2=20;var gw=rect.width-2*pad2;var gh=rect.height-2*pad2;' +
'var nx=(px-rect.left-pad2)/gw;var ny=(py-rect.top-pad2)/gh;' +
'nx=Math.max(0.05,Math.min(0.95,nx));ny=Math.max(0.05,Math.min(0.95,ny));' +
'atoms[dragIdx].x=nx;atoms[dragIdx].y=ny;' +
'drawAll()}' +

'function onPointerUp(){' +
'if(dragging&&!hasMoved&&dragIdx>=0){' +
// Tap — select atom
'selectedAtom=dragIdx===selectedAtom?-1:dragIdx;' +
'msgHops=0;msgReach=[];' +
'drawAll()}' +
'dragging=false;dragIdx=-1}' +

// Touch events
'document.addEventListener("DOMContentLoaded",function(){' +
'var cv=document.getElementById("cvGraph");' +
'cv.addEventListener("touchstart",function(e){e.preventDefault();var t=e.touches[0];onPointerDown(t.clientX,t.clientY)},{passive:false});' +
'cv.addEventListener("touchmove",function(e){if(!dragging)return;e.preventDefault();var t=e.touches[0];onPointerMove(t.clientX,t.clientY)},{passive:false});' +
'cv.addEventListener("touchend",function(){onPointerUp()});' +
'cv.addEventListener("mousedown",function(e){onPointerDown(e.clientX,e.clientY)});' +
'document.addEventListener("mousemove",function(e){if(dragging)onPointerMove(e.clientX,e.clientY)});' +
'document.addEventListener("mouseup",function(){onPointerUp()})});' +

// ── Height notification ──
'function notifyHeight(){var h=document.body.scrollHeight+20;' +
'try{window.ReactNativeWebView.postMessage(JSON.stringify({type:"height",value:h}))}catch(e){}}' +

// ── Init labels ──
'document.getElementById("lbl-graph").textContent=T.graph;' +
'document.getElementById("lbl-adj").textContent=T.adj;' +
'document.getElementById("lbl-ctrl").textContent=T.ctrl;' +
'document.getElementById("lbl-stats").textContent=T.stats;' +
'document.getElementById("btnMsg").textContent=T.msgPass;' +
'document.getElementById("btnFeature").textContent=T.feature;' +
'document.getElementById("btnReset").textContent=T.reset;' +

// ── Init ──
'loadMol("H2O");' +
'window.addEventListener("resize",function(){drawAll();notifyHeight()});' +
'setTimeout(notifyHeight,100);' +

'</script></body></html>';
}
