// ==========================================================
//  Fighting-game + 60s QUIZ TIMER (runs continuously) + AI punches
//  Players DO NOT MOVE – stand & hit from anywhere
// ==========================================================
kaboom({ width: 1280, height: 720, scale: 1, stretch: true, letterbox: true, debug: false });

/* --------------------  LOAD ASSETS  -------------------- */
loadSprite("background", "assets/background/background_layer_1.png");
loadSprite("trees",    "assets/background/background_layer_2.png");
loadSpriteAtlas("assets/oak_woods_tileset.png", {
    "ground-golden": { x: 16, y: 0, width: 16, height: 16 },
    "deep-ground":   { x: 16, y: 32, width: 16, height: 16 },
    "ground-silver": { x: 150, y: 0, width: 16, height: 16 }
});
loadSprite("shop", "assets/shop_anim.png", { sliceX: 6, anims: { default: { from: 0, to: 5, speed: 12, loop: true } } });
loadSprite("fence", "assets/fence_1.png");
loadSprite("sign",  "assets/sign.png");

["player1","player2"].forEach(id=>{
    loadSprite("idle-"+id,   "assets/idle-"+id+".png",   { sliceX: id==="player1"?8:4, anims:{ idle:{from:0,to:id==="player1"?7:3,speed:8,loop:true} } });
    loadSprite("attack-"+id, "assets/attack-"+id+".png", { sliceX: id==="player1"?6:4, anims:{ attack:{from:0,to:id==="player1"?5:3,speed:18} } });
    loadSprite("death-"+id,  "assets/death-"+id+".png",  { sliceX: id==="player1"?6:7, anims:{ death:{from:0,to:id==="player1"?5:6,speed:10,loop:false} } });
});

/* --------------------  SCENE  -------------------- */
scene("fight", () => {
    /* =====  background / ground / decor  ===== */
    const background = add([sprite("background"), scale(4)]);
    background.add([sprite("trees")]);
    const groundTiles = addLevel([
        "","","","","","","","","",
        "------#######-----------",
        "dddddddddddddddddddddddd",
        "dddddddddddddddddddddddd"
    ], { tileWidth: 16, tileHeight: 16, tiles: {
        "#": () => [sprite("ground-golden"), area(), body({ isStatic: true })],
        "-": () => [sprite("ground-silver"),  area(), body({ isStatic: true })],
        "d": () => [sprite("deep-ground"),    area(), body({ isStatic: true })]
    }});
    groundTiles.use(scale(4));
    background.add([sprite("shop"), pos(170, 15)]);
    [85,10].forEach(x=>background.add([sprite("fence"), pos(x,125)]));
    background.add([sprite("sign"),  pos(290,115)]);
    add([rect(16,720), area(), body({isStatic:true}), pos(-20,0)]);
    add([rect(16,720), area(), body({isStatic:true}), pos(1280,0)]);

    setGravity(1200);

    /* =====  PLAYER FACTORY (no movement)  ===== */
    function makePlayer(posX, posY, w, h, scaleFactor, id){
        const p = add([
            pos(posX, posY), scale(scaleFactor),
            area({ shape:new Rect(vec2(0), w, h) }), anchor("center"),
            body({ stickToPlatform: true }),
            { health: 500, id,
              sprites:{ idle:"idle-"+id, attack:"attack-"+id, death:"death-"+id } }
        ]);
        p.use(sprite(p.sprites.idle)); p.play("idle");
        return p;
    }
    const player1 = makePlayer(200, 100, 16, 42, 4, "player1");
    const player2 = makePlayer(1000,200,16,52,4,"player2");
    player2.flipX = true;   // AI faces left

    /* =====  60-S QUESTION TIMER (digits only, centre)  ===== */
    const timerDigits = add([text("60", { size: 80 }), pos(center().x, 90), anchor("center"), color(255,255,255)]);
    let timeLeft = 60;
    let timerRunning = false;
    function startQuestionTimer(){ timeLeft=60; timerRunning=true; timerDigits.text="60"; }
    /*  start once and never stop  */
    timerRunning = true;

    loop(0.05,()=>{
        if (!timerRunning) return;
        timeLeft=Math.max(0,timeLeft-0.05);
        timerDigits.text=Math.ceil(timeLeft);
        if (timeLeft<=0){ declareWinner("TIME'S UP – AI WINS!"); }
    });

    /* =====  QUIZ DATA (injected via index.html loader)  ===== */
    const questions = Array.isArray(window.questions) ? window.questions : [];
    let questionActive = false;
    function getRandomQuestion(){ return questions.length ? questions[Math.floor(Math.random()*questions.length)] : null; }

    /* =====  SHOW QUESTION  ===== */
    function showQuestion(){
        if (questionActive) return;
        questionActive = true;
        //  NO startQuestionTimer() here – timer runs continuously
        add([rect(width(),height()), pos(0,0), color(0,0,0), opacity(0.55), "quizOverlay"]);
        const q = getRandomQuestion();
        if (!q) return; // no questions loaded
        const boxX = width()/2 - 220, boxY = height()/2 - 220;
        add([rect(440,220), pos(boxX,boxY), color(30,30,30), outline(2), "quizOverlay"]);
        add([text(q.q, { size: 20, width: 420 }), pos(boxX+10,boxY+12), color(255,255,255), "quizOverlay"]);
        q.options.forEach((opt,i)=>{
            const btnY = boxY + 60 + i*40;
            const btn = add([rect(400,34), pos(boxX+20,btnY), color(80,80,80), outline(1), area(), "quizOption", {value:opt}]);
            add([text(String.fromCharCode(65+i)+". "+opt, { size: 18 }), pos(boxX+28,btnY+6), "quizOptionText"]);
            btn.onClick(()=>{
                const correct = (opt === q.answer);
                if (correct){ doAttackPlayer1(); } else { hurtPlayer1(); }
                //  NO stopQuestionTimer() here – keep countdown running
                destroyAll("quizOverlay"); destroyAll("quizOption"); destroyAll("quizOptionText"); questionActive=false;
            });
        });
    }
    onKeyPress("space", showQuestion);

    /* =====  ATTACK HELPERS  ===== */
    function doAttackPlayer1(){
        if (player1.health===0) return;
        player1.use(sprite(player1.sprites.attack)); player1.play("attack", { onEnd:()=>{
            player1.use(sprite(player1.sprites.idle)); player1.play("idle");
        }});
        player2.health-=50; if (player2.health<0) player2.health=0;
        tween(player2HealthBar.width, player2.health, 0.5, v=>player2HealthBar.width=v, easings.easeOutSine);
        checkWinLose();
    }
    function hurtPlayer1(){
        player1.health-=50; if (player1.health<0) player1.health=0;
        tween(player1HealthBar.width, player1.health, 0.5, v=>player1HealthBar.width=v, easings.easeOutSine);
        checkWinLose();
    }

    /* =====  HEALTH BARS + WIN TEXT  ===== */
    const p1HealthContainer = add([rect(500,70), area(), outline(5), pos(90,20), color(200,0,0)]);
    const player1HealthBar  = p1HealthContainer.add([rect(498,65), color(0,180,0), pos(498,70-2.5), rotate(180)]);
    const p2HealthContainer = add([rect(500,70), area(), outline(5), pos(690,20), color(200,0,0)]);
    const player2HealthBar  = p2HealthContainer.add([rect(498,65), color(0,180,0), pos(2.5,2.5)]);

    const winningText = add([text(""), area(), anchor("center"), pos(center())]);
    let gameOver = false;
    onKeyDown("enter", ()=> gameOver ? go("fight") : null);

    function declareWinner(msg){
        if (gameOver) return; gameOver = true;
        winningText.text = msg;
        if (player1.health === 0){ player1.use(sprite(player1.sprites.death)); player1.play("death"); }
        if (player2.health === 0){ player2.use(sprite(player2.sprites.death)); player2.play("death"); }
    }
    function checkWinLose(){
        if (player1.health===0 && player2.health===0) declareWinner("TIE!");
        else if (player1.health===0) declareWinner("Player 2 Wins!");
        else if (player2.health===0) declareWinner("Player 1 Wins!");
    }

    /* =====  AI – punch every 9s (flip back to left after punch)  ===== */
    const aiInterval = setInterval(()=>{
        if (gameOver) return;
        player2.use(sprite(player2.sprites.attack)); player2.play("attack", { onEnd:()=>{
            player2.use(sprite(player2.sprites.idle)); player2.play("idle");
            player2.flipX = true;   //  ALWAYS face left again
        }});
        player1.health-=50; if (player1.health<0) player1.health=0;
        tween(player1HealthBar.width, player1.health, 0.5, v=>player1HealthBar.width=v, easings.easeOutSine);
        checkWinLose();
    }, 9000);

    /* =====  HIT DETECTION (unchanged)  ===== */
    player1.onCollide(player2.id+"attackHitbox", ()=>{
        if (gameOver) return; if (player1.health>0){
            player1.health-=50; if (player1.health<0) player1.health=0;
            tween(player1HealthBar.width,player1.health,0.5,v=>player1HealthBar.width=v,easings.easeOutSine);
            checkWinLose();
        }
    });
    player2.onCollide(player1.id+"attackHitbox", ()=>{
        if (gameOver) return; if (player2.health>0){
            player2.health-=50; if (player2.health<0) player2.health=0;
            tween(player2HealthBar.width,player2.health,0.5,v=>player2HealthBar.width=v,easings.easeOutSine);
            checkWinLose();
        }
    });

}); // end scene

go("fight");