const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const livesEl = document.getElementById("lives");
const levelEl = document.getElementById("level");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayText = document.getElementById("overlay-text");
const overlayEyebrow = document.getElementById("overlay-eyebrow");
const startBtn = document.getElementById("start-btn");
const pauseBtn = document.getElementById("pause-btn");

const W = canvas.width, H = canvas.height;
const keys = {};
let player, aliens, bullets, enemyBullets, particles, stars;
let score = 0, best = Number(localStorage.getItem("spaceInvadersBest") || 0);
let lives = 3, level = 1, running = false, paused = false, gameOver = false;
let lastTime = 0, alienDirection = 1, alienStepTimer = 0, fireCooldown = 0;
bestEl.textContent = formatScore(best);

function formatScore(n) { return String(n).padStart(6, "0"); }
function resetGame() {
  score = 0; lives = 3; level = 1; gameOver = false; paused = false;
  player = { x: W / 2 - 19, y: H - 55, w: 38, h: 24, speed: 330, invulnerable: 0 };
  bullets = []; enemyBullets = []; particles = []; alienDirection = 1;
  stars = Array.from({length: 75}, () => ({x: Math.random()*W, y: Math.random()*H, r: Math.random()*1.5+.3, a: Math.random()*.6+.2}));
  makeAliens(); updateHud();
}
function makeAliens() {
  aliens = [];
  const rows = Math.min(3 + Math.floor((level-1)/2), 5), cols = 10;
  for (let r=0; r<rows; r++) for (let c=0; c<cols; c++) {
    aliens.push({x: 92+c*64, y: 68+r*43, w: 29, h: 22, row:r, alive:true, phase:Math.random()*6});
  }
}
function updateHud() {
  scoreEl.textContent = formatScore(score);
  bestEl.textContent = formatScore(best);
  livesEl.textContent = lives > 0 ? ("♥ ".repeat(lives)).trim() : "—";
  levelEl.textContent = String(level).padStart(2,"0");
}
function showOverlay(title, text, button, eyebrow="INCOMING TRANSMISSION") {
  overlayTitle.textContent = title; overlayText.textContent = text;
  startBtn.textContent = button; overlayEyebrow.textContent = eyebrow;
  overlay.classList.remove("hidden");
}
function startGame() {
  if (gameOver || !player) resetGame();
  running = true; paused = false; overlay.classList.add("hidden");
  pauseBtn.disabled = false; pauseBtn.textContent = "Ⅱ PAUSE";
  lastTime = performance.now(); requestAnimationFrame(loop);
}
function endGame(won=false) {
  running = false; gameOver = true; pauseBtn.disabled = true;
  showOverlay(won ? "Sector cleared!" : "Game over", won ? `Галактика спасена! Твой счет: ${formatScore(score)}.` : `Твой счет: ${formatScore(score)}. Попробуй еще раз!`, "↻ PLAY AGAIN", won ? "MISSION COMPLETE" : "SIGNAL LOST");
}
function togglePause() {
  if (!running || gameOver) return;
  paused = !paused;
  if (paused) { running = false; pauseBtn.textContent = "▶ RESUME"; showOverlay("Game paused", "Передохни, пилот. Захватчики ждут.", "▶ RESUME", "SYSTEM PAUSED"); }
  else startGame();
}
function addExplosion(x,y,color,count=10) {
  for(let i=0;i<count;i++) particles.push({x,y,vx:(Math.random()-.5)*180,vy:(Math.random()-.5)*180,life:.3+Math.random()*.45,color,size:2+Math.random()*3});
}
function hit(a,b) { return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y; }

function update(dt) {
  if (keys.ArrowLeft || keys.a || keys.A) player.x -= player.speed*dt;
  if (keys.ArrowRight || keys.d || keys.D) player.x += player.speed*dt;
  player.x = Math.max(12, Math.min(W-player.w-12, player.x));
  player.invulnerable = Math.max(0, player.invulnerable-dt);
  fireCooldown -= dt;
  if ((keys.Space || keys[" "]) && fireCooldown <= 0) {
    bullets.push({x:player.x+player.w/2-2,y:player.y-10,w:4,h:13,vy:-480});
    fireCooldown=.24;
  }
  for(const b of bullets) b.y += b.vy*dt;
  bullets = bullets.filter(b=>b.y>-20);
  for(const b of enemyBullets) b.y += b.vy*dt;
  enemyBullets = enemyBullets.filter(b=>b.y<H+20);

  alienStepTimer += dt;
  const alive = aliens.filter(a=>a.alive);
  const speed = .42 / (1 + (aliens.length-alive.length)*.018) / (1+level*.09);
  if(alienStepTimer > speed) {
    alienStepTimer = 0;
    let edge = false;
    for(const a of alive) if((a.x+alienDirection*14<12)||(a.x+a.w+alienDirection*14>W-12)) edge=true;
    if(edge) { alienDirection *= -1; for(const a of alive) a.y += 17; }
    else for(const a of alive) a.x += alienDirection*14;
    if(Math.random() < .36 && alive.length) {
      const shooter = alive[Math.floor(Math.random()*alive.length)];
      enemyBullets.push({x:shooter.x+shooter.w/2-2,y:shooter.y+shooter.h,w:4,h:11,vy:180+level*18});
    }
  }
  for(const b of bullets) for(const a of aliens) if(a.alive && hit(b,a)) {
    a.alive=false; b.y=-50; score += (5-a.row)*10; addExplosion(a.x+a.w/2,a.y+a.h/2,a.row===0?"#b7ff65":"#4deaff",8); updateHud(); break;
  }
  for(const b of enemyBullets) if(player.invulnerable<=0 && hit(b,player)) {
    b.y=H+50; lives--; player.invulnerable=1.4; addExplosion(player.x+player.w/2,player.y,"#ff7096",18); updateHud();
    if(lives<=0) { endGame(false); return; }
  }
  if(aliens.some(a=>a.alive && a.y+a.h>=player.y-5)) { endGame(false); return; }
  particles.forEach(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;});
  particles=particles.filter(p=>p.life>0);
  if(!aliens.some(a=>a.alive)) {
    level++;
    if(level>5) { score+=500; if(score>best){best=score;localStorage.setItem("spaceInvadersBest",best);} updateHud(); endGame(true); return; }
    makeAliens(); enemyBullets=[]; alienDirection=1; updateHud();
  }
  if(score>best) { best=score; localStorage.setItem("spaceInvadersBest",best); }
  updateHud();
}
function drawShip(x,y,w,h,color="#4deaff") {
  ctx.fillStyle=color;
  ctx.fillRect(x+w*.42,y,w*.16,h*.22);
  ctx.fillRect(x+w*.30,y+h*.22,w*.40,h*.22);
  ctx.fillRect(x+w*.18,y+h*.44,w*.64,h*.24);
  ctx.fillRect(x,y+h*.68,w,h*.22);
  ctx.fillRect(x+w*.12,y+h*.90,w*.18,h*.1);
  ctx.fillRect(x+w*.70,y+h*.90,w*.18,h*.1);
}
function drawAlien(a) {
  const color = a.row===0 ? "#b7ff65" : a.row===1 ? "#4deaff" : "#c69aff";
  ctx.fillStyle=color;
  const p=3, x=a.x, y=a.y;
  ctx.fillRect(x+6,y,17,3); ctx.fillRect(x+3,y+3,23,3);
  ctx.fillRect(x,y+6,29,8); ctx.fillRect(x+3,y+14,5,4); ctx.fillRect(x+21,y+14,5,4);
  ctx.fillRect(x+6,y+18,5,4); ctx.fillRect(x+18,y+18,5,4);
  ctx.fillStyle="#07101a"; ctx.fillRect(x+6,y+7,4,4); ctx.fillRect(x+19,y+7,4,4);
}
function draw() {
  ctx.fillStyle="#050a12"; ctx.fillRect(0,0,W,H);
  for(const s of stars) { ctx.globalAlpha=s.a*(.75+.25*Math.sin(performance.now()/700+s.x)); ctx.fillStyle="#a8d9ff"; ctx.fillRect(s.x,s.y,s.r,s.r); }
  ctx.globalAlpha=1;
  ctx.strokeStyle="#14263a"; ctx.setLineDash([3,9]); ctx.beginPath(); ctx.moveTo(0,H-28); ctx.lineTo(W,H-28); ctx.stroke(); ctx.setLineDash([]);
  aliens.forEach(a=>{if(a.alive)drawAlien(a);});
  bullets.forEach(b=>{ctx.fillStyle="#b7ff65";ctx.shadowColor="#b7ff65";ctx.shadowBlur=12;ctx.fillRect(b.x,b.y,b.w,b.h);});
  ctx.shadowBlur=0;
  enemyBullets.forEach(b=>{ctx.fillStyle="#ff7096";ctx.fillRect(b.x,b.y,b.w,b.h);});
  if(player && (!player.invulnerable || Math.floor(performance.now()/100)%2===0)) drawShip(player.x,player.y,player.w,player.h);
  particles.forEach(p=>{ctx.globalAlpha=Math.max(0,p.life);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,p.size,p.size);}); ctx.globalAlpha=1;
}
function loop(time) {
  if(!running) return;
  const dt=Math.min((time-lastTime)/1000,.04); lastTime=time;
  update(dt); draw();
  if(running) requestAnimationFrame(loop);
}
document.addEventListener("keydown",e=>{
  if(["ArrowLeft","ArrowRight","Space"].includes(e.code)) e.preventDefault();
  keys[e.code==="Space"?"Space":e.key]=true;
  if(e.code==="Space") keys.Space=true;
});
document.addEventListener("keyup",e=>{keys[e.code==="Space"?"Space":e.key]=false;});
startBtn.addEventListener("click",()=>{ if(paused && !gameOver){paused=false;startGame();} else startGame(); });
pauseBtn.addEventListener("click",togglePause);
resetGame(); draw();
