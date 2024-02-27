import * as dat from '/node_modules/dat.gui/build/dat.gui.module.js';
import * as THREE from 'three';

const BALLSPEED = 0.3;
const BALLSPEEDMAX = 0.5;
const PADDLESPEED = 0.2;

const gui = new dat.GUI();

var fieldWidth = 50;
var fieldDepth = 1;
var fieldHeight = fieldWidth / 2;
var fieldTop = (fieldHeight / 2);
var fieldBottom = -(fieldHeight / 2);
var fieldLeft = -(fieldWidth / 2);
var fieldRight = fieldWidth / 2;
var paddleWidth = fieldWidth / 70;
var paddleHeight = fieldHeight / 3.5;
var gameShouldStart = true;
var gameStarted = false;
var darkBackground = true;
var scoreText = document.getElementById("score");
var darkColour = 0x111111;
var lightColour = 0xeeeeee;
var powerupSpeed = 1;
var enablePowerups = false;

// AI mode
let aiMode = false;
let aiLastUpdateTime = 0;
let aiReactionTime = 500; // Adjusted AI reaction time
let aiMarginError = 10;
let aiDifficultyAdjustmentFactor = 0.1;
var mode = "local";
var pauseScreen = document.getElementById("pauseScreen");
var ctx = pauseScreen.getContext("2d");
ctx.fillStyle = "black";
ctx.fillRect(0, 0, pauseScreen.width, pauseScreen.height);
ctx.fillStyle = "white";
ctx.textAlign = "center";
ctx.textBaseline = "middle";
ctx.font = "30px Arial"
ctx.fillText("select a mode to play", pauseScreen.width / 2, pauseScreen.height / 2);

let playerTwoName = 'Player2';

let upArrowPressed = false, downArrowPressed = false;
let wKeyPressed = false, sKeyPressed = false;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

const renderer = new THREE.WebGLRenderer({
    canvas: document.querySelector('canvas'),
    antialias: true
});
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild( renderer.domElement );

// camera
camera.position.x = 13;
camera.position.y = -15;
camera.position.z = 15.5;

camera.rotation.x = 0.62;
camera.rotation.y = 0.28;
camera.rotation.z = 0.35;

// create field
var fieldGeometry = new THREE.BoxGeometry(fieldWidth, fieldHeight, fieldDepth, 1, 1, 1);
var fieldMaterial = new THREE.MeshPhongMaterial({ color: darkColour, side: THREE.BackSide, shininess: 30});
var field = new THREE.Mesh(fieldGeometry, fieldMaterial);
field.position.set(0, 0, 0);
field.receiveShadow = true;
scene.add(field);

const ambientLight = new THREE.AmbientLight(0xffffff, 1)
scene.add(ambientLight)
const pointLight = new THREE.PointLight(0xffffff, 0.5)
pointLight.position.x = 2
pointLight.position.y = 3
pointLight.position.z = 4
scene.add(pointLight)

var spotlight = new THREE.DirectionalLight(0xe069ff, 1);
spotlight.intensity = 0.9;
spotlight.position.x = -220;
spotlight.position.y = 177;
spotlight.position.z = 200;
spotlight.castShadow = true;
scene.add(spotlight);

var light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0, -300, 200);
light.castShadow = true;

light.shadow.mapSize.width = 1024;
light.shadow.mapSize.height = 1024;
light.shadow.camera.near = 0.5;
light.shadow.camera.far = 500;
light.intensity = 2;
scene.add(light);

// dat.gui
const cameraFolder = gui.addFolder('Camera')
cameraFolder.add(camera.position, 'x', -100, 100).name('Position X').onChange(cameraLog);
cameraFolder.add(camera.position, 'y', -100, 100).name('Position Y').onChange(cameraLog);
cameraFolder.add(camera.position, 'z', -100, 100).name('Position Z').onChange(cameraLog);
cameraFolder.add(camera.rotation, 'x', -Math.PI, Math.PI).name('Rotation X').onChange(cameraLog);
cameraFolder.add(camera.rotation, 'y', -Math.PI, Math.PI).name('Rotation Y').onChange(cameraLog);
cameraFolder.add(camera.rotation, 'z', -Math.PI, Math.PI).name('Rotation Z').onChange(cameraLog);

const fieldFolder = gui.addFolder('field')
fieldFolder.add(field.position, 'x', -100, 100).name('Position X').listen();
fieldFolder.add(field.position, 'y', -100, 100).name('Position Y').listen();
fieldFolder.add(field.position, 'z', -100, 100).name('Position Z').listen();
fieldFolder.add(field.rotation, 'x', -Math.PI, Math.PI).name('Rotation X').listen();
fieldFolder.add(field.rotation, 'y', -Math.PI, Math.PI).name('Rotation Y').listen();
fieldFolder.add(field.rotation, 'z', -Math.PI, Math.PI).name('Rotation Z').listen();
fieldFolder.addColor({ materialColor: field.material.color }, 'materialColor').name('Material Color').onFinishChange(function(colorValue) {
    var color = new THREE.Color(colorValue);
    // Update material color of the 'field' object
    field.material.color.set(color);
});
const spotlightFolder = gui.addFolder('spotlight');
spotlightFolder.add(spotlight, 'intensity', 0, 2).name('Intensity');
spotlightFolder.add(spotlight.position, 'x', -500, 500).name('Position X');
spotlightFolder.add(spotlight.position, 'y', -500, 500).name('Position Y');
spotlightFolder.add(spotlight.position, 'z', -500, 500).name('Position Z');
// Define initial color for the material
var initialColor = '#ff0000';

// Function to update material color
function updateMaterialColor(colorValue) {
    var color = new THREE.Color(colorValue);
    // Recreate material with the new color
    var newMaterial = new THREE.MeshBasicMaterial({ color: color });
    // Update material of the 'field' object
    field.material = newMaterial;
}

// Add color controller to the folder and directly assign functionality for color change
fieldFolder.addColor({ materialColor: initialColor }, 'materialColor').name('Material Color').onChange(updateMaterialColor);


spotlightFolder.add(spotlight, 'intensity', 0, 2).name('Intensity');

const lightFolder = gui.addFolder('light')
lightFolder.add(light, 'intensity', 0, 2).name('Intensity');
const params = {
    sliderValue: 0
};
lightFolder.add(light.position, 'x', -500, 500).name('Position X');
lightFolder.add(light.position, 'y', -500, 500).name('Position Y');
lightFolder.add(light.position, 'z', -500, 500).name('Position Z');
lightFolder.addColor(light, 'color').name('Color').onFinishChange(function(colorValue) {
    console.log(colorValue);
});

light.position.x = -21;
light.position.y = -485;
light.position.z = 199;
light.intensity = 5;
light.color.set(0xe069ff);

function cameraLog()
{
    console.log(camera.position);
    console.log(camera.rotation);
}

cameraFolder.open()

class paddle {
    constructor(){
        this.geometry = new THREE.BoxGeometry(paddleWidth, paddleHeight, 0.5, 1, 1, 1);
        this.material = new THREE.MeshLambertMaterial({ color: lightColour, side: THREE.BackSide });
        this.object = new THREE.Mesh(this.geometry, this.material);
        this.x = 0;
        this.y = window.innerHeight / 2 - paddleHeight / 2;
        this.width = paddleWidth;
        this.height = paddleHeight;
        this.dy = 0;
        this.score = 0;
        this.speed = BALLSPEED;
    }
};

function getRandomNumberBetween(firstNumber, secondNumber)
{
    var randomNumber = (Math.random() < 0.5 ? -1 : 1) * (firstNumber + Math.random() * secondNumber);
    return (randomNumber);
}

class Ball {
    constructor(colour){
        this.radius = fieldWidth / 100;
        this.geometry = new THREE.SphereGeometry(this.radius, 32, 32);
        this.material = new THREE.MeshBasicMaterial({color: colour});
        this.object = new THREE.Mesh(this.geometry, this.material);
        this.x = 0;
        this.y = 0;
        this.speed = BALLSPEED;
        this.dx = 0;
        this.dy = 0;
        this.active = false;
        this.reset();
    }
    normalizeDirection(){
        let length = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
        this.dx /= length;
        this.dy /= length;
    }
    reset(){
        this.object.position.x = 0;
        this.object.position.y = 0;
        this.dx = getRandomNumberBetween(0.2, 0.6);
        this.dy = getRandomNumberBetween(0.2, 0.6);
        this.normalizeDirection();
    }
};

class enlargePaddle extends Ball {
    constructor(){
        super("yellow");
        this.scale = 0.2;
    }
    power(paddle){
        paddle.object.scale.y += this.scale;
        removePowerup();
    }
};

class speedUpBall extends Ball {
    constructor(){
        super("red");
    }
    power(paddle){
        paddle.speed = 1.50;
        paddle.material.color.set(0xff0000);
        removePowerup();
    }
};

var powerup = new Ball("#bbbbbb");

var ball = new Ball("#eeeeee");
scene.add(ball.object);
ball.object.castShadow = true;
ball.object.receiveShadow = true;

const ballFolder = gui.addFolder('ball');
ballFolder.add(ball.object.position, 'z', -100, 100).name('Position Z').listen();

// create paddle
var leftPaddle = new paddle();
var rightPaddle = new paddle();
leftPaddle.object.position.x = -(fieldWidth / 2) + leftPaddle.width;
rightPaddle.object.position.x = fieldWidth / 2 - leftPaddle.width;
leftPaddle.object.receiveShadow = true;
rightPaddle.object.receiveShadow = true;
rightPaddle.object.position.z += fieldDepth;
leftPaddle.object.position.z += fieldDepth;
rightPaddle.object.castShadow = true;
leftPaddle.object.castShadow = true;
rightPaddle.object.receiveShadow = true;
leftPaddle.object.receiveShadow = true;
scene.add(leftPaddle.object);
scene.add(rightPaddle.object);

var dottedLineGeometry = new THREE.BufferGeometry();
var positions = new Float32Array([
    0, -(fieldHeight / 2) + 1, 0,  
    0, (fieldHeight / 2) - 1, 0    
]);
dottedLineGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3)); 

var dottedLineMaterial = new THREE.LineDashedMaterial({
    color: 0xFFD1DC,
    dashSize: 0.5,
    gapSize: 0.5, 
    opacity: 0.5
});

var dottedLine = new THREE.Line(dottedLineGeometry, dottedLineMaterial);
dottedLine.computeLineDistances();
scene.add(dottedLine);

function animate() {
    if (gameStarted){
        requestAnimationFrame( animate );
        renderer.render( scene, camera );
        movePaddles();
        if (mode === 'AI') moveAIPaddle();
        moveBall();
        movePowerup();
        drawScore();
    }
}

animate();

function checkWinner() {
    let winnerName, loserName, score;
    if (leftPaddle.score == 5 || rightPaddle.score == 5) {
        if (leftPaddle.score == 5) {
            winnerName = window.playerOne || 'Player1';
            loserName = playerTwoName || 'Player2';
        } else {
            winnerName = playerTwoName || 'Player2';
            loserName = window.playerOne || 'Player1';
        }
        score = `${leftPaddle.score} - ${rightPaddle.score}`;
        alert(`${winnerName} wins!`);
        // updateStats(winnerName, loserName);
        // submitMatchHistory(winnerName, loserName, score);
        resetGame();
        resetGameFlags();
    }
}

// --------------------------- PONG ----------------------------

function removePowerup(){
    scene.remove(powerup.object);
    powerup.active = false;
}

function movePaddles() {
    if (wKeyPressed && leftPaddle.object.position.y < fieldTop - leftPaddle.height / 2) 
        leftPaddle.object.position.y += PADDLESPEED;
    if (sKeyPressed && (leftPaddle.object.position.y > fieldBottom + leftPaddle.height / 2)) 
        leftPaddle.object.position.y -= PADDLESPEED;
    if (upArrowPressed && rightPaddle.object.position.y < fieldTop - leftPaddle.height / 2) 
        rightPaddle.object.position.y += PADDLESPEED;
    if (downArrowPressed  && (rightPaddle.object.position.y > fieldBottom + rightPaddle.height / 2)) 
        rightPaddle.object.position.y -= PADDLESPEED;
}

function movePowerup() {
    randomizePowerup();
    if (powerup.active == true){
        powerup.object.position.x += powerup.dx * powerup.speed;
        powerup.object.position.y += powerup.dy * powerup.speed;
        if (powerup.object.position.y + powerup.radius > fieldTop) powerup.dy = Math.abs(powerup.dy) * -1;
        else if (powerup.object.position.y - powerup.radius < fieldBottom) powerup.dy = Math.abs(powerup.dy);
        if (powerup.object.position.x < leftPaddle.object.position.x + leftPaddle.width && powerup.object.position.y > leftPaddle.object.position.y - leftPaddle.height / 2 && powerup.object.position.y < leftPaddle.object.position.y + leftPaddle.height / 2)
            powerup.power(leftPaddle);
        else if (powerup.object.position.x > rightPaddle.object.position.x - rightPaddle.width && powerup.object.position.y > rightPaddle.object.position.y - leftPaddle.height / 2 && powerup.object.position.y < rightPaddle.object.position.y + rightPaddle.height / 2) {
            powerup.power(rightPaddle);
        }
        if (powerup.object.position.x + powerup.radius > fieldRight || powerup.object.position.x - powerup.radius < fieldLeft)  
            removePowerup();
    }
}

function randomizePowerup() {
    if (powerup.active == false && enablePowerups == true){
        let random = Math.round(Math.random() * 2);
        if (random == 1) {
            powerup = new enlargePaddle();
            scene.add(powerup.object);
            powerup.active = true;
        } else if (random == 2){
            powerup = new speedUpBall();
            scene.add(powerup.object);
            powerup.active = true;
        }
    }
}

function moveBall() {    
    // Wall collision (top/bottom)
    if (ball.object.position.y + ball.radius > fieldTop) ball.dy = Math.abs(ball.dy) * -1;
    else if (ball.object.position.y - ball.radius < fieldBottom) ball.dy = Math.abs(ball.dy);

    // Paddle collision
    if (ball.object.position.x < leftPaddle.object.position.x + leftPaddle.width && ball.object.position.y > leftPaddle.object.position.y - leftPaddle.height / 2 && ball.object.position.y < leftPaddle.object.position.y + leftPaddle.height / 2){
        ball.dx = Math.abs(ball.dx);
        paddleCollision(leftPaddle);
    }
    else if (ball.object.position.x > rightPaddle.object.position.x - rightPaddle.width && ball.object.position.y > rightPaddle.object.position.y - leftPaddle.height / 2 && ball.object.position.y < rightPaddle.object.position.y + rightPaddle.height / 2){
        ball.dx = Math.abs(ball.dx) * -1;
        paddleCollision(rightPaddle);
    }
    else if (ball.object.position.x + ball.radius > fieldRight || ball.object.position.x - ball.radius < fieldLeft) {
        if (ball.object.position.x + ball.radius > fieldRight) leftPaddle.score++;
        else rightPaddle.score++;
        checkWinner();
        ball.reset();
        paddlesReset();
    }
    // Reset ball if it goes out of bounds
    ball.object.position.y += (ball.dy * ball.speed) * powerupSpeed;
    ball.object.position.x += (ball.dx * ball.speed) * powerupSpeed;
}

function paddlesReset()
{
    rightPaddle.speed = 1;
    leftPaddle.speed = 1;
    if (darkBackground = true){
        rightPaddle.material.color.set(lightColour);
        leftPaddle.material.color.set(lightColour);
    }
    else {
        rightPaddle.material.color.set(darkColour);
        leftPaddle.material.color.set(lightColour);
    }
}

function paddleCollision(paddle) {
    if (Math.abs(ball.dx) < BALLSPEEDMAX) ball.dx *= 1.10; ball.dy *= 1.10;
    powerupSpeed = paddle.speed;
}

function drawScore() {
    scoreText.textContent = "Player 1 " + window.playerOne + " : " + leftPaddle.score +  "Player two" + playerTwoName + " : " + rightPaddle.score;
}

// // AI paddle movement
function moveAIPaddle() {
    if (aiMode && Date.now() - aiLastUpdateTime > aiReactionTime) {
        aiLastUpdateTime = Date.now();
        aiAdjustDifficulty();
        let aiPredictBallY = aiPredictBallPosition();
        
        let aiPaddleCenter = leftPaddle.object.position.y;
        let aiTargetY = aiPredictBallY + (Math.random() * 2 - 1) * aiMarginError;
        if (aiTargetY < aiPaddleCenter) {
            wKeyPressed = true;  // AI attempts to move up
            sKeyPressed = false;
        } else if (aiTargetY > aiPaddleCenter) {
            sKeyPressed = true;  // AI attempts to move down
            wKeyPressed = false;
        } else {
            wKeyPressed = false;
            sKeyPressed = false; // AI stays
        }

        // Apply AI paddle movement based on flags
        if (wKeyPressed && (leftPaddle.object.position.y < fieldTop - leftPaddle.height / 2))
            leftPaddle.object.position.y += 0.1; 
        else if (sKeyPressed && (leftPaddle.object.position.y > fieldBottom + leftPaddle.height / 2))
            leftPaddle.object.position.y -= 0.1; 
        }
    }

function aiAdjustDifficulty() {
    // Adjustments for AI difficulty
    let scoreDiff = leftPaddle.score - rightPaddle.score;
    if (scoreDiff > 2 || scoreDiff < -2) {
        let adjustment = aiReactionTime * aiDifficultyAdjustmentFactor;
        aiReactionTime += scoreDiff > 2 ? -adjustment : adjustment;
        aiMarginError += scoreDiff > 2 ? -adjustment : adjustment;
    }
    aiReactionTime = Math.max(500, Math.min(aiReactionTime, 1500));
    aiMarginError = Math.max(10, Math.min(aiMarginError, 50));
}

function aiPredictBallPosition() {
    // Optimized AI prediction logic
    let futureBallX = ball.object.position.x;
    let futureBallY = ball.object.position.y;
    let futureBallDx = ball.dx;
    let futureBallDy = ball.dy;

    if (futureBallDx <= 0)
        return ball.object.position.y;
    while (futureBallX < fieldRight - leftPaddle.width) {
        futureBallX += futureBallDx;
        futureBallY += futureBallDy;
        if (futureBallY - ball.radius < fieldBottom || futureBallY + ball.radius > fieldBottom)
            futureBallDy *= -1;
    }
    return futureBallY;
}


// // Event listeners
document.addEventListener("keydown", function(event) {
    console.log(event.keyCode);
    switch (event.keyCode) {
        case 87: // W key
            wKeyPressed = gameShouldStart && true;
            break;
        case 83: // S key
            sKeyPressed = gameShouldStart && true;
            break;
        case 38: // Up arrow
            upArrowPressed = gameShouldStart && true;
            event.preventDefault();
            break;
        case 40: // Down arrow
            downArrowPressed = gameShouldStart && true;
            event.preventDefault();
            break;
        case 13: // Enter key
            if (!gameStarted) {
                gameStarted = true;
                gameShouldStart = true;
                ctx.beginPath();
                ctx.clearRect(0, 0, pauseScreen.width, pauseScreen.height);
                setPongCanvas();
                animate();
            }
            break;
        case 32:
            resetCamera();
            break;
        }
});

document.addEventListener("keyup", function(event) {
    switch (event.keyCode) {
        case 87: // W key
        wKeyPressed = false;
        break;
        case 83: // S key
        sKeyPressed = false;
        break;
        case 38: // Up arrow
        upArrowPressed = false;
        event.preventDefault();
        break;
        case 40: // Down arrow
        downArrowPressed = false;
        event.preventDefault();
        break;
    }
});

document.getElementById('enablePowerups').addEventListener('click', function() {
    var button = document.getElementById('enablePowerups');
    if (button.textContent.includes('OFF')) {
        button.textContent = button.textContent.replace('OFF', 'ON');
        enablePowerups = true;
      } else {
        button.textContent = button.textContent.replace('ON', 'OFF');
        enablePowerups = false;
      }
});

document.getElementById('changeBackgroundColour').addEventListener('click', function() {
    
    if (darkBackground == true){
        field.material.color.setHex(0x030626);
    }
    else{
        field.material.color.setHex(darkColour);
    }
    darkBackground = !darkBackground;
});

document.getElementById('playPongButtonLocal').addEventListener('click', function() {
    mode = 'local';
    const enteredName = document.getElementById('player2NameInput').value;
    playerTwoName = enteredName.trim() || 'Player2';
    resetGame();
    setPauseScreen();
});

// AI mode button
document.getElementById('playPongButtonAI').addEventListener('click', function() {
    mode = 'AI';
    aiMode = true;
    resetGame();
    setPauseScreen();
});

function resetGame() {
    leftPaddle.score = 0;
    rightPaddle.score = 0;
    ball.reset();
    gameShouldStart = true;
    gameStarted = false;
}

function setPauseScreen() {
    ctx.clearRect(0, 0, pauseScreen.width, pauseScreen.height);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, pauseScreen.width, pauseScreen.height);
    ctx.fillStyle = "white";
    ctx.fillText("press ENTER to play", pauseScreen.width / 2, pauseScreen.height / 2);
}

function setPongCanvas() {
    document.getElementById('pongCanvas').style.display = 'block';
}

function resetGameFlags() {
    gameShouldStart = false;
    gameStarted = false;
}
