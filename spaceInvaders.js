//canvas and basics selectors
const canvas = document.querySelector('#gameCanvas');
const gameContainer = document.querySelector('#game_container');
const scoreEl = document.querySelector('#score');
const endGameModal = new bootstrap.Modal(
  document.getElementById('endGameModal'),
  {
    backdrop: 'static',
  }
);
const newGameBtn = document.querySelector('#newGame');
const newGameModalBtn = document.querySelector('#newGameModal');
const endGameMessage = document.querySelector('#endGameMessage');
const scoreboardDropdownEL = document.querySelector('#scoreboard_dropdown');
const playerNameEL = document.querySelector('#players_name');
confirmName;
const confrimBtn = document.querySelector('#confirmName');
const inputForNameEl = document.querySelector('#name_input');

const c = canvas.getContext('2d');

canvas.width = 1024;
canvas.height = 576;

let invincibilityMode = true;

let highScoreList = [{ name: 'Anonymous', score: 0 }];

const storageKey = 'highscore';

if (localStorage.getItem(storageKey)) {
  const storage = JSON.parse(localStorage.getItem(storageKey));
  highScoreList = storage;
  uploadHighScoreList(highScoreList);
}

//Classes
///////////////////////////////////////////////////////////

class Player {
  constructor() {
    this.velocity = {
      x: 0,
      y: 0,
    };

    this.rotation = 0;
    this.opacity = 1;

    const image = new Image();
    image.src = './images/SpaceshipCarlosAlface2019/xenis-blue-a-1.png';
    image.onload = () => {
      const scale = 0.4;
      this.image = image;
      this.width = image.width * scale;
      this.height = image.height * scale;
      this.position = {
        x: canvas.width / 2 - this.width / 2,
        y: canvas.height - this.height - 20,
      };
    };
  }
  draw() {
    // c.fillStyle = 'red';
    // c.fillRect(this.position.x, this.position.y, this.width, this.height);
    c.save();
    c.globalAlpha = this.opacity;
    c.translate(
      player.position.x + player.width / 2,
      player.position.y + player.height / 2
    );
    c.rotate(this.rotation);

    c.translate(
      -player.position.x - player.width / 2,
      -player.position.y - player.height / 2
    );

    c.drawImage(
      this.image,
      this.position.x,
      this.position.y,
      this.width,
      this.height
    );
    c.restore();
  }

  update() {
    if (this.image) {
      this.draw();
      this.position.x += this.velocity.x;
    }
  }
}

class Projectile {
  constructor({ position, velocity, color = 'red' }) {
    this.position = position;
    this.velocity = velocity;

    this.color = color;
    this.radius = 4;
  }

  draw() {
    c.beginPath();
    c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    c.fillStyle = this.color;
    c.fill();
    c.closePath();
  }
  update() {
    this.draw();
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
  }
}

class Particle {
  constructor({ position, velocity, radius, color, fades }) {
    this.position = position;
    this.velocity = velocity;

    this.radius = radius;
    this.color = color;
    this.opacity = 1;
    this.fades = fades;
  }

  draw() {
    c.save();
    c.globalAlpha = this.opacity;
    c.beginPath();
    c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    c.fillStyle = this.color;
    c.fill();
    c.closePath();
    c.restore();
  }
  update() {
    this.draw();
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    if (this.fades) this.opacity -= 0.01;
  }
}

class Enemy {
  constructor({ position }, imgPath, enemyLevel, wave, enemyColor, galaxy) {
    this.velocity = {
      x: 0,
      y: 0,
    };
    this.imgPath = imgPath;
    this.rotation = 0;
    this.opacity = 0;
    this.enemyLevel = enemyLevel;
    this.wave = wave;
    this.hitPoints = wave;
    this.galaxy = galaxy;

    this.enemyColor = enemyColor;

    const image = new Image();
    image.src = imgPath;
    image.onload = () => {
      const scale = 0.4;
      this.image = image;
      this.width = image.width * scale;
      this.height = image.height * scale;
      this.position = {
        x: position.x,
        y: position.y,
      };
    };
  }
  draw() {
    // c.fillStyle = 'red';
    // c.fillRect(this.position.x, this.position.y, this.width, this.height);
    c.save();
    c.globalAlpha = this.opacity;
    c.translate(
      player.position.x + player.width / 2,
      player.position.y + player.height / 2
    );
    c.rotate(this.rotation);

    c.translate(
      -player.position.x - player.width / 2,
      -player.position.y - player.height / 2
    );

    c.drawImage(
      this.image,
      this.position.x,
      this.position.y,
      this.width,
      this.height
    );
    c.restore();
  }

  update({ velocity }) {
    if (this.image) {
      this.draw();
      this.position.x += velocity.x;
      this.position.y += velocity.y;
    }
  }

  shoot(enemyProjectiles) {
    enemyProjectiles.push(
      new EnemyProjectile(
        {
          position: {
            x: this.position.x + this.width / 2,
            y: this.position.y + this.height,
          },
          velocity: {
            x: 0,
            y: 5 + this.enemyLevel / 2 + this.galaxy * 0.05,
          },
        },
        this.enemyLevel,
        this.enemyColor[this.enemyLevel]
      )
    );
  }

  appear() {
    gsap.to(this, {
      delay: 0.2,
      opacity: 1,
      duration: 0.25,
    });
  }
}

class EnemyProjectile {
  constructor(
    { position, velocity, width = 4, height = 15 },
    enemyLevel,
    color
  ) {
    this.position = position;
    this.velocity = velocity;

    this.width = width;
    this.height = height;
    this.enemyLevel = enemyLevel;
    this.color = color;
  }

  draw() {
    c.fillStyle = this.color;
    c.fillRect(this.position.x, this.position.y, this.width, this.height);
  }
  update() {
    this.draw();
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
  }
}

class Grid {
  constructor(enemyLevel = 'g', wave, enemyColors, galaxy) {
    const columns = 10;
    const rows = 2;
    this.enemyColors = enemyColors;
    this.galaxy = galaxy;

    this.position = {
      x: 0,
      y: 0,
    };
    this.velocity = {
      x: 3,
      y: 0,
    };
    this.enemies = [];
    this.enemyLevel = enemyLevel;
    this.wave = wave;

    this.width = columns * 50;

    for (let x = 0; x < columns; x++) {
      for (let y = 0; y < rows; y++) {
        this.enemies.push(
          new Enemy(
            {
              position: {
                x: x * (40 + (30 * wave) / 2),
                y: y * (40 + (40 * wave) / 2),
              },
            },
            `./images/SpaceshipCarlosAlface2018/spaceships/${
              this.enemyLevel
            }-0${4 - this.wave}.png`,
            currentEnemyLevel,
            this.wave,
            this.enemyColors,
            this.galaxy
          )
        );
      }
    }
  }

  update() {
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    this.velocity.y = 0;

    if (this.position.x + this.width >= canvas.width || this.position.x <= 0) {
      this.velocity.x = -this.velocity.x * 1.01;
      this.velocity.y = 30;
    }
  }
}

class Bomb {
  static radius = 30;
  constructor({ position, velocity }) {
    this.position = position;
    this.velocity = velocity;
    this.radius = 0;
    this.color = 'red';
    this.opacity = 1;
    this.active = false;

    gsap.to(this, {
      radius: 30,
    });
  }

  draw() {
    c.save();
    c.globalAlpha = this.opacity;
    c.beginPath();
    c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    c.closePath();
    c.fillStyle = this.color;
    c.fill();
    c.restore();
  }
  update() {
    this.draw();
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    if (
      this.position.x + this.radius + this.velocity.x >= canvas.width ||
      this.position.x - this.radius + this.velocity.x <= 0
    ) {
      this.velocity.x = -this.velocity.x;
    } else if (
      this.position.y + this.radius + this.velocity.y >= canvas.height ||
      this.position.y - this.radius + this.velocity.y <= 0
    ) {
      this.velocity.y = -this.velocity.y;
    }
  }

  explode() {
    this.velocity.x = 0;
    this.velocity.y = 0;
    this.active = true;
    gsap.to(this, {
      radius: 200,
      color: 'white',
    });
    gsap.to(this, {
      delay: 0.1,
      opacity: 0,
      duration: 0.15,
    });
  }
}

class PowerUp {
  constructor({ position, velocity }) {
    this.position = position;
    this.velocity = velocity;

    this.radius = 15;
  }

  draw() {
    c.beginPath();
    c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    c.fillStyle = 'yellow';
    c.fill();
    c.closePath();
  }
  update() {
    this.draw();
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
  }
}

//Execution
///////////////////////////////////////////////////////////

// Functions
////////////////////////////////////////////
function randomBetweenCanvas(min, max) {
  return Math.random() * (max - min) + min;
}

function starsInBackground() {
  for (let i = 0; i < 100; i++) {
    particles.push(
      new Particle({
        position: {
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
        },
        velocity: {
          x: 0,
          y: Math.random() / 0.9,
        },
        radius: Math.random() * 1.5,
        color: 'white',
      })
    );
  }
}

function createParticles({ object, color, fades }) {
  for (let i = 0; i < 15; i++) {
    particles.push(
      new Particle({
        position: {
          x: object.position.x + object.width / 2,
          y: object.position.y + object.height / 2,
        },
        velocity: {
          x: (Math.random() - 0.5) * 2,
          y: (Math.random() - 0.5) * 2,
        },
        radius: Math.random() * 2,
        color: color || 'purple',
        fades: fades,
      })
    );
  }
}

function createScoreLabel({ score = 1, object }) {
  const scoreLabel = document.createElement('label');
  scoreLabel.innerText = object.wave;
  scoreLabel.style.position = 'absolute';
  scoreLabel.style.color = 'white';
  scoreLabel.style.top = object.position.y + 'px';
  scoreLabel.style.left = object.position.x + 'px';
  scoreLabel.style.userSelect = 'none';

  gameContainer.appendChild(scoreLabel);

  gsap.to(scoreLabel, {
    opacity: 0,
    y: -30,
    duration: 0.75,
    onComplete: () => {
      gameContainer.removeChild(scoreLabel);
    },
  });
}
function createLevelLabel({ text, level, duration, heigthFactor = 0 }) {
  const levelLabel = document.createElement('label');
  levelLabel.innerText = `${text}: ${level}`;
  levelLabel.style.position = 'absolute';
  levelLabel.style.color = 'white';
  levelLabel.style.fontSize = '20px';
  levelLabel.style.textAlign = 'center';
  levelLabel.style.width = '100px';
  levelLabel.style.top = canvas.height / 2 + heigthFactor + 'px';
  levelLabel.style.left = canvas.width / 2 + 'px';
  levelLabel.style.userSelect = 'none';

  gameContainer.appendChild(levelLabel);

  gsap.to(levelLabel, {
    opacity: 0,
    y: -30,
    duration: duration,
    onComplete: () => {
      gameContainer.removeChild(levelLabel);
    },
  });
}

function createGetReadyLabel({ text, playerName, duration }) {
  const getReadyLabel = document.createElement('label');
  getReadyLabel.innerText = `${text}, ${playerName}!`;
  getReadyLabel.style.position = 'absolute';
  getReadyLabel.style.color = 'white';
  getReadyLabel.style.fontSize = '30px';
  getReadyLabel.style.textAlign = 'center';
  getReadyLabel.style.width = '300px';
  getReadyLabel.style.top = canvas.height / 2 + 'px';
  getReadyLabel.style.left = canvas.width / 2 + 'px';
  getReadyLabel.style.userSelect = 'none';

  gameContainer.appendChild(getReadyLabel);

  gsap.to(getReadyLabel, {
    opacity: 0,
    y: -30,
    duration: duration,
    onComplete: () => {
      gameContainer.removeChild(getReadyLabel);
    },
  });
}

function createModalWindow(score) {
  endGameMessage.innerHTML = `
  <p>
    Congratulations, ${playerName}! You scored ${score} points.
  </p>
  <p>
    Number of galaxies visited: ${galaxy}
  </p>`;
  setTimeout(() => {
    endGameModal.show();
  }, 2005);
}

function rectangularCollision({ rectangle1, rectangle2 }) {
  return (
    rectangle1.position.y + rectangle1.height >= rectangle2.position.y &&
    rectangle1.position.x + rectangle1.width >= rectangle2.position.x &&
    rectangle1.position.x <= rectangle2.position.x + rectangle2.width
    // mising detection for bottom
  );
}

function refreshOrRemovePowerUps() {
  for (let i = powerUps.length - 1; i >= 0; i--) {
    const powerUp = powerUps[i];
    if (powerUp.position.x - powerUp.radius >= canvas.width)
      powerUps.splice(i, 1);
    else powerUp.update();
  }
}

function endGame() {
  highScoreList.push({ name: playerName, score: score });
  topTen(highScoreList);
  setTimeout(() => {
    player.opacity = 0;
    game.over = true;
  }, 0);

  setTimeout(() => {
    game.active = false;
  }, 2000);
  createParticles({ object: player, color: 'white', fades: true });

  createModalWindow(score);
  uploadHighScoreList(highScoreList);
}

function createNewGame(timeout) {
  c.clearRect(0, 0, canvas.width, canvas.height);
  scoreEl.innerText = '0';

  createGetReadyLabel({
    text: 'Get ready',
    playerName: playerName,
    duration: 2,
  });

  setTimeout(() => {
    setUpAllVariables();
    starsInBackground();
    animate();
    createLevelLabel({
      text: 'Galaxy',
      level: galaxy,
      duration: 3,
      heigthFactor: 50,
    });
    createLevelLabel({ text: 'Wave', level: wave, duration: 1.5 });
  }, timeout);
}

function newGameListener(element) {
  element.addEventListener('click', (e) => {
    setTimeout(() => {
      game.over = true;
      game.active = false;
    }, 200);
    e.preventDefault;
    element.disabled = true;
    endGameModal.hide();
    createNewGame(2000);
    setTimeout(() => {
      element.disabled = false;
    }, 5000);
  });
}

function topTen(highScore) {
  const orderedScore = highScore;
  orderedScore.sort(function (a, b) {
    return b.score - a.score;
  });
  if (orderedScore.length > 10) orderedScore.length = 10;
  return orderedScore;
}

function uploadHighScoreList(highScore) {
  scoreboardDropdownEL.innerHTML = '';

  for (let i = 0; i < highScore.length; i++) {
    const html = `<a class="dropdown-item text-white" href="#">${i + 1}. ${
      highScore[i].name
    }: ${highScore[i].score} points</a>`;
    const highScoreElem = document.createElement('li');
    highScoreElem.classList.add('bg-grey-900');
    highScoreElem.innerHTML = html;
    scoreboardDropdownEL.appendChild(highScoreElem);
  }
  //check for local storage
  if (window.localStorage === undefined) {
    return;
  }

  if (highScore.length > 0) {
    localStorage.setItem(storageKey, JSON.stringify(highScore));

    return;
  }
}

// Variables
////////////////////////////////////////
///////////////////////////////////////
let playerName = 'Anonymous';
function setUpAllVariables() {
  player = new Player();
  projectiles = [];
  enemyProjectiles = [];
  grids = [];
  particles = [];
  bombs = [];
  powerUps = [];
  score = 0;
  shootingON = true;
  currentEnemyLevel = 1;
  wave = 1;
  waveEnded = false;
  galaxy = 1;
  frames = 0;
  randomInterval = Math.floor(Math.random() * 500 + 500);
  spawnBuffer = 500;
  game = {
    over: false,
    active: true,
  };
}
let player = new Player();
let projectiles = [];
let enemyProjectiles = [];
let grids = [];
let particles = [];
let bombs = [];
let powerUps = [];
let score = 0;
let shootingON = true;

const keys = {
  leftKey: {
    pressed: false,
    keyValue: 'ArrowLeft',
  },
  rightKey: {
    pressed: false,
    keyValue: 'ArrowRight',
  },
  shootKey: {
    pressed: false,
    keyValue: ' ',
  },
};
const enemyLevels = {
  1: 'g',
  2: 'a',
  3: 'b',
  4: 'd',
  5: 'f',
  6: 'h',
  7: 'j',
  8: 'i',
  9: 'c',
  10: 'e',
};
const enemyColorScaling = {
  1: 'purple',
  2: 'yellow',
  3: 'green',
  4: 'ivory',
  5: 'orange',
  6: 'greenyellow',
  7: 'brown',
  8: 'grey',
  9: 'red',
  10: 'lightskyblue',
};

let currentEnemyLevel = 1;
let wave = 1;
let waveEnded = false;
let galaxy = 1;

let frames = 0;
let randomInterval = Math.floor(Math.random() * 500 + 500);
let spawnBuffer = 500;
let game = {
  over: false,
  active: true,
};

//Load Stars
starsInBackground();
// Animation Frames
//////////////////////////////////////////
//////////////////////////////////////////

function animate() {
  if (!game.active) return;
  // repeat black screen in background
  requestAnimationFrame(animate);
  c.fillStyle = 'black';
  c.fillRect(0, 0, canvas.width, canvas.height);

  //Refreshing and removing powerups
  refreshOrRemovePowerUps();
  //spawning powerUps

  if (frames % 500 === 0) {
    powerUps.push(
      new PowerUp({
        position: {
          x: 0,
          y: Math.random() * 300 + 15,
        },
        velocity: {
          x: 5,
          y: 0,
        },
      })
    );
  }

  // spawning bombs
  if (frames % 300 === 0 && bombs.length <= 2) {
    bombs.push(
      new Bomb({
        position: {
          x: randomBetweenCanvas(Bomb.radius, canvas.width - Bomb.radius),
          y: randomBetweenCanvas(Bomb.radius, canvas.height - Bomb.radius),
        },
        velocity: {
          x: (Math.random() - 0.5) * 6,
          y: (Math.random() - 0.5) * 6,
        },
      })
    );
  }
  // removing exploded bombs from bombs array
  for (let i = bombs.length - 1; i >= 0; i--) {
    const bomb = bombs[i];

    if (bomb.opacity <= 0) {
      bombs.splice(i, 1);
    } else {
      bomb.update();
    }
  }
  // update player movement
  player.update();

  // ALL about particles
  particles.forEach((particle, ind) => {
    // putting STARS on top of screen when they leave bottom
    if (particle.position.y - particle.radius >= canvas.height) {
      particle.position.x = Math.random() * canvas.width;
      particle.position.y = -particle.radius;
    }
    // particles when enemy is destroyed and removing them
    if (particle.opacity <= 0) {
      setTimeout(() => {
        particles.splice(ind, 1);
      }, 0);
    } else {
      particle.update();
    }
  });

  // Enemy PROJECTILES
  enemyProjectiles.forEach((enemyProjectile, index) => {
    //Projectile leaves screen - removing them from array
    if (enemyProjectile.position.y + enemyProjectile.height >= canvas.height) {
      setTimeout(() => {
        enemyProjectiles.splice(index, 1);
      }, 0);
    }
    enemyProjectile.update();
    //projectile hits the player -- GAME OVER
    if (
      rectangularCollision({
        rectangle1: enemyProjectile,
        rectangle2: player,
      }) &&
      !game.over
    ) {
      enemyProjectiles.splice(index, 1);
      endGame();
    }
  });
  // Projectile collision with Bombs and Powerups
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const projectile = projectiles[i];

    // Check if it colides with bomb then do effect
    for (let j = bombs.length - 1; j >= 0; j--) {
      const bomb = bombs[j];
      if (
        Math.hypot(
          projectile.position.x - bomb.position.x,
          projectile.position.y - bomb.position.y
        ) <
          projectile.radius + bomb.radius &&
        !bomb.active
      ) {
        projectiles.splice(i, 1);
        bomb.explode();
      }
    }
    // Check if it colides with powerup then do effect
    for (let j = powerUps.length - 1; j >= 0; j--) {
      const powerUp = powerUps[j];
      if (
        Math.hypot(
          projectile.position.x - powerUp.position.x,
          projectile.position.y - powerUp.position.y
        ) <
        projectile.radius + powerUp.radius
      ) {
        projectiles.splice(i, 1);
        powerUps.splice(j, 1);
        player.powerUp = 'MachineGun';
        setTimeout(() => {
          player.powerUp = null;
        }, 5000);
      }
    }
    // remove projectile from game if leaves screen
    if (projectile.position.y + projectile.radius <= 0) {
      projectiles.splice(i, 1);
    } else {
      projectile.update();
    }
  }

  // ENEMY GRIDS
  grids.forEach((grid, gridIndex) => {
    grid.update();

    //spawn enemy projectiles
    if (frames % 100 === 0 && grid.enemies.length > 0) {
      grid.enemies[Math.floor(Math.random() * grid.enemies.length)].shoot(
        enemyProjectiles
      );
      if (galaxy > 40) {
        grid.enemies[Math.floor(Math.random() * grid.enemies.length)].shoot(
          enemyProjectiles
        );
      }
    }
    // detect collision of enemy and bombs
    for (let i = grid.enemies.length - 1; i >= 0; i--) {
      const enemy = grid.enemies[i];

      enemy.update({ velocity: grid.velocity });
      enemy.appear();
      //if bomb explosion touches enemy, remove enemy
      for (let j = bombs.length - 1; j >= 0; j--) {
        const bomb = bombs[j];
        const enemyRadius = 20;
        if (
          Math.hypot(
            enemy.position.x - bomb.position.x,
            enemy.position.y - bomb.position.y
          ) <
            enemyRadius + bomb.radius &&
          bomb.active
        ) {
          score += enemy.wave;
          scoreEl.innerText = score;
          grid.enemies.splice(i, 1);
          createScoreLabel({ object: enemy });
          createParticles({
            object: enemy,
            color: enemyColorScaling[enemy.enemyLevel],
            fades: true,
          });
        }
      }

      //projectile hits enemy
      projectiles.forEach((projectile, indProj) => {
        if (
          projectile.position.y - projectile.radius <=
            enemy.position.y + enemy.height &&
          projectile.position.x + projectile.radius >= enemy.position.x &&
          projectile.position.x - projectile.radius <=
            enemy.position.x + enemy.width &&
          projectile.position.y - projectile.radius >= enemy.position.y
        ) {
          //Finding right enemy and projectile that collided
          setTimeout(() => {
            const enemyFound = grid.enemies.find(
              (thisEnemy) => thisEnemy == enemy
            );

            const projectileFound = projectiles.find(
              (thisProjectile) => thisProjectile == projectile
            );
            //remove enemy and projectile
            if (enemyFound && projectileFound) {
              //dynamic score label
              score += enemy.wave;

              scoreEl.innerText = score;

              createScoreLabel({ object: enemy });
              createParticles({
                object: enemy,
                color: enemyColorScaling[enemy.enemyLevel],
                fades: true,
              });

              grid.enemies.splice(i, 1);
              projectiles.splice(indProj, 1);
            }
            // Shortening grid size when collumns of enemies are deleted when 0 remove grid from grids
            if (grid.enemies.length > 0) {
              const firstEnemy = grid.enemies[0];
              const lastEnemy = grid.enemies[grid.enemies.length - 1];

              grid.width =
                lastEnemy.position.x - firstEnemy.position.x + lastEnemy.width;
              grid.position.x = firstEnemy.position.x;
            } else {
              grids.splice(gridIndex, 1);
            }
          }, 0);
        }
      });
      // remove player if enemy touches it
      if (
        rectangularCollision({
          rectangle1: enemy,
          rectangle2: player,
        })
      ) {
        endGame();
      }
    } // end of enemy loop
  });

  //Increasing Player Movement Speed and Rotation
  if (keys.leftKey.pressed && player.position.x >= 0) {
    player.velocity.x = -7;
    player.rotation = -0.15;
  } else if (
    keys.rightKey.pressed &&
    player.position.x <= canvas.width - player.width
  ) {
    player.velocity.x = 7;
    player.rotation = 0.15;
  } else {
    player.velocity.x = 0;
    player.rotation = 0;
  }

  //Spawn new Grid of enemies
  if (frames % 400 == 0) {
    //spawnBuffer = spawnBuffer < 0 ? 0 : spawnBuffer;
    if (waveEnded) {
      wave++;
    }
    if (wave > 3) {
      wave = 1;
      galaxy++;
      createLevelLabel({
        text: 'Galaxy',
        level: galaxy,
        duration: 2.5,
        heigthFactor: 50,
      });
    }
    if (waveEnded) {
      createLevelLabel({ text: 'Wave', level: wave, duration: 1.5 });
      waveEnded = false;
    }

    grids.push(
      new Grid(enemyLevels[currentEnemyLevel], wave, enemyColorScaling, galaxy)
    );
    if (currentEnemyLevel < 10) currentEnemyLevel++;
    else {
      currentEnemyLevel = 1;
      waveEnded = true;
    }

    //randomInterval = Math.floor(Math.random() * 500 + 500);
    //spawnBuffer -= 2;
  }

  //powerUp effect

  if (
    keys.shootKey.pressed &&
    player.powerUp === 'MachineGun' &&
    frames % 2 === 0
  ) {
    projectiles.push(
      new Projectile({
        position: {
          x: player.position.x + player.width / 2,
          y: player.position.y,
        },
        velocity: { x: 0, y: -15 },
        color: 'yellow',
      })
    );
  }
  // increasing frames variable
  frames++;
}

//createNewGame(0);

// Controls
//////////////////////////////////////////////////////

addEventListener('keydown', ({ key }) => {
  if (game.over) return;
  switch (key) {
    case keys.leftKey.keyValue:
      keys.leftKey.pressed = true;
      break;
    case keys.rightKey.keyValue:
      keys.rightKey.pressed = true;
      break;
  }
});

addEventListener('keypress', ({ key }) => {
  if (game.over) return;
  if (keys.shootKey.keyValue === key && shootingON) {
    shootingON = false;
    keys.shootKey.pressed = true;
    projectiles.push(
      new Projectile({
        position: {
          x: player.position.x + player.width / 2,
          y: player.position.y,
        },
        velocity: { x: 0, y: -15 },
      })
    );
  }
});

addEventListener('keyup', ({ key }) => {
  switch (key) {
    case keys.leftKey.keyValue:
      keys.leftKey.pressed = false;
      break;
    case keys.rightKey.keyValue:
      keys.rightKey.pressed = false;
      break;
    case keys.shootKey.keyValue:
      keys.shootKey.pressed = false;
      shootingON = true;
      break;
  }
});

confrimBtn.addEventListener('click', (e) => {
  e.preventDefault();
  if (inputForNameEl.value.trim() !== '') {
    const name = inputForNameEl.value;
    playerNameEL.innerText = `Hi, ${name}`;
    playerName = name;
  }
  inputForNameEl.value = '';
  confrimBtn.blur();
});

newGameListener(newGameBtn);

newGameListener(newGameModalBtn);
