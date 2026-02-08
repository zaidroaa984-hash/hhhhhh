const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

class Ball {
    constructor(x, y, radius, color, number){
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.radius = radius;
        this.color = color;
        this.number = number;
        this.inHole = false;
    }

    draw(){
        if(this.inHole) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.stroke();
    }

    update(){
        if(this.inHole) return;
        this.x += this.vx;
        this.y += this.vy;

        // احتكاك بسيط
        this.vx *= 0.98;
        this.vy *= 0.98;

        // توقف الكرة إذا كانت بطيئة جدًا
        if(Math.abs(this.vx)<0.05) this.vx=0;
        if(Math.abs(this.vy)<0.05) this.vy=0;

        // ارتداد عن حدود الطاولة
        if(this.x - this.radius < 50 || this.x + this.radius > canvas.width-50){
            this.vx = -this.vx;
            this.x = Math.max(50 + this.radius, Math.min(this.x, canvas.width-50-this.radius));
        }
        if(this.y - this.radius < 50 || this.y + this.radius > canvas.height-50){
            this.vy = -this.vy;
            this.y = Math.max(50 + this.radius, Math.min(this.y, canvas.height-50-this.radius));
        }
    }
}

// إنشاء الكرات
let balls = [];
const colors = ['#fff', '#ff0000', '#0000ff', '#ffff00', '#00ff00', '#ff00ff', '#00ffff', '#000000'];
// كرة بيضاء
balls.push(new Ball(canvas.width/2, canvas.height/2+100, 20, '#fff', 0));
// كرات مصمتة
for(let i=1; i<=7; i++){
    balls.push(new Ball(canvas.width/2 + i*30, canvas.height/2 - i*20, 20, colors[i], i));
}
// كرات مخططة
for(let i=9; i<=15; i++){
    balls.push(new Ball(canvas.width/2 - (i-8)*30, canvas.height/2 - (i-8)*20, 20, colors[i-8], i));
}
// الكرة السوداء
balls.push(new Ball(canvas.width/2, canvas.height/2, 20, '#000', 8));

// التصويب بالسحب
let cueBall = balls[0];
let dragging = false;
let startX, startY;

canvas.addEventListener('touchstart', e=>{
    const touch = e.touches[0];
    const dx = touch.clientX - cueBall.x;
    const dy = touch.clientY - cueBall.y;
    if(Math.sqrt(dx*dx + dy*dy) < cueBall.radius){
        dragging = true;
        startX = touch.clientX;
        startY = touch.clientY;
    }
});

canvas.addEventListener('touchmove', e=>{
    if(!dragging) return;
    const touch = e.touches[0];
    ctx.clearRect(0,0,canvas.width,canvas.height);
    drawTable();
    balls.forEach(b=>b.draw());

    // رسم خط التصويب
    ctx.beginPath();
    ctx.moveTo(cueBall.x, cueBall.y);
    ctx.lineTo(touch.clientX, touch.clientY);
    ctx.strokeStyle = 'yellow';
    ctx.lineWidth = 3;
    ctx.stroke();
});

canvas.addEventListener('touchend', e=>{
    if(!dragging) return;
    const dx = startX - e.changedTouches[0].clientX;
    const dy = startY - e.changedTouches[0].clientY;
    cueBall.vx = dx * 0.2;
    cueBall.vy = dy * 0.2;
    dragging = false;
});

function drawTable(){
    // رسم الطاولة (حدود)
    ctx.fillStyle = '#0a5c0a';
    ctx.fillRect(50,50,canvas.width-100,canvas.height-100);
}

// فيزياء بسيطة للتصادم بين الكرات
function handleCollisions(){
    for(let i=0;i<balls.length;i++){
        for(let j=i+1;j<balls.length;j++){
            const b1 = balls[i];
            const b2 = balls[j];
            if(b1.inHole || b2.inHole) continue;
            const dx = b2.x - b1.x;
            const dy = b2.y - b1.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if(dist < b1.radius + b2.radius){
                // تبادل السرعة بشكل بسيط
                const angle = Math.atan2(dy, dx);
                const speed1 = Math.sqrt(b1.vx*b1.vx + b1.vy*b1.vy);
                const speed2 = Math.sqrt(b2.vx*b2.vx + b2.vy*b2.vy);
                const dir1 = Math.atan2(b1.vy, b1.vx);
                const dir2 = Math.atan2(b2.vy, b2.vx);

                b1.vx = speed2 * Math.cos(dir2 - angle);
                b1.vy = speed2 * Math.sin(dir2 - angle);
                b2.vx = speed1 * Math.cos(dir1 - angle);
                b2.vy = speed1 * Math.sin(dir1 - angle);

                // تصحيح موقع لتجنب التداخل
                const overlap = b1.radius + b2.radius - dist;
                b1.x -= overlap/2 * Math.cos(angle);
                b1.y -= overlap/2 * Math.sin(angle);
                b2.x += overlap/2 * Math.cos(angle);
                b2.y += overlap/2 * Math.sin(angle);
            }
        }
    }
}

// تحديث ورسم اللعبة
function animate(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    drawTable();
    handleCollisions();
    balls.forEach(b=>b.update());
    balls.forEach(b=>b.draw());
    requestAnimationFrame(animate);
}
animate();