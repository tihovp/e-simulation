const startBtn = document.getElementById('startSimulation');
const simulationSection = document.getElementById('simulationSection');
const dropBallBtn = document.getElementById('dropBall');
const betAmountInput = document.getElementById('betAmount');
const canvas = document.getElementById('plinkoCanvas');
const ctx = canvas.getContext('2d');

const chatbotToggle = document.getElementById('chatbotToggle');
const chatbotWindow = document.getElementById('chatbotWindow');
const chatbotClose = document.getElementById('chatbotClose');
const chatbotMessages = document.getElementById('chatbotMessages');
const optionBtns = document.querySelectorAll('.option-btn');

let totalBet = 0;
let totalWin = 0;
let animating = false;

const ROWS = 8;
const SLOTS = 9;
const PEG_RADIUS = 4;
const BALL_RADIUS = 8;

const multipliers = [5, 2, 1, 0.5, 0.2, 0.5, 1, 2, 5];

let canvasWidth, canvasHeight, pegSpacingX, pegSpacingY, startX, startY;

function initCanvas() {
  const containerWidth = canvas.parentElement.clientWidth - 48;
  canvasWidth = Math.min(containerWidth, 400);
  canvasHeight = canvasWidth * 1.3;

  canvas.width = canvasWidth;
  canvas.height = canvasHeight;

  pegSpacingX = canvasWidth / (SLOTS + 1);
  pegSpacingY = canvasHeight / (ROWS + 4);
  startX = canvasWidth / 2;
  startY = pegSpacingY;
}

function drawPegs() {
  ctx.fillStyle = '#0B7D5C';

  for (let row = 0; row < ROWS; row++) {
    const pegsInRow = row + 2;
    const offsetX = (canvasWidth - (pegsInRow - 1) * pegSpacingX) / 2;

    for (let col = 0; col < pegsInRow; col++) {
      const x = offsetX + col * pegSpacingX;
      const y = startY + (row + 1) * pegSpacingY;

      ctx.beginPath();
      ctx.arc(x, y, PEG_RADIUS, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawSlots() {
  const slotY = startY + (ROWS + 1) * pegSpacingY;
  const slotWidth = pegSpacingX * 0.8;
  const slotHeight = pegSpacingY * 1.5;

  ctx.font = 'bold 12px Montserrat';
  ctx.textAlign = 'center';

  for (let i = 0; i < SLOTS; i++) {
    const x = (i + 0.6) * pegSpacingX;

    const multiplier = multipliers[i];
    let color;
    if (multiplier >= 2) {
      color = '#0B7D5C';
    } else if (multiplier >= 1) {
      color = '#CDEFE3';
    } else {
      color = '#FF6B6B';
    }

    ctx.fillStyle = color;
    ctx.fillRect(x, slotY, slotWidth, slotHeight);

    ctx.fillStyle = multiplier >= 1 ? '#FFFFFF' : '#1A1A1A';
    ctx.fillText(`${multiplier}x`, x + slotWidth / 2, slotY + slotHeight / 2 + 5);
  }
}

function drawBoard() {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);
  drawPegs();
  drawSlots();
}

class Ball {
  constructor() {
    this.x = startX;
    this.y = startY;
    this.vx = 0;
    this.vy = 0;
    this.gravity = 0.4;
    this.bounce = 0.7;
    this.row = 0;
    this.finished = false;
  }

  update() {
    if (this.finished) return;

    this.vy += this.gravity;
    this.x += this.vx;
    this.y += this.vy;

    const currentRow = Math.floor((this.y - startY) / pegSpacingY) - 1;

    if (currentRow >= 0 && currentRow < ROWS && currentRow > this.row) {
      this.row = currentRow;
      const pegsInRow = currentRow + 2;
      const offsetX = (canvasWidth - (pegsInRow - 1) * pegSpacingX) / 2;

      for (let col = 0; col < pegsInRow; col++) {
        const pegX = offsetX + col * pegSpacingX;
        const pegY = startY + (currentRow + 1) * pegSpacingY;

        const dist = Math.sqrt((this.x - pegX) ** 2 + (this.y - pegY) ** 2);

        if (dist < BALL_RADIUS + PEG_RADIUS) {
          const angle = Math.atan2(this.y - pegY, this.x - pegX);
          this.x = pegX + Math.cos(angle) * (BALL_RADIUS + PEG_RADIUS);
          this.y = pegY + Math.sin(angle) * (BALL_RADIUS + PEG_RADIUS);

          this.vx = Math.cos(angle) * 3 * (Math.random() > 0.5 ? 1 : -1);
          this.vy = Math.abs(this.vy) * this.bounce;
        }
      }
    }

    if (this.x < BALL_RADIUS) {
      this.x = BALL_RADIUS;
      this.vx *= -this.bounce;
    }
    if (this.x > canvasWidth - BALL_RADIUS) {
      this.x = canvasWidth - BALL_RADIUS;
      this.vx *= -this.bounce;
    }

    const slotY = startY + (ROWS + 1) * pegSpacingY;
    if (this.y > slotY && !this.finished) {
      this.finished = true;
      const slotIndex = Math.floor(this.x / pegSpacingX);
      const finalSlot = Math.max(0, Math.min(SLOTS - 1, slotIndex));
      return finalSlot;
    }

    return null;
  }

  draw() {
    ctx.fillStyle = '#FF6B6B';
    ctx.beginPath();
    ctx.arc(this.x, this.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function animateBall() {
  const ball = new Ball();
  animating = true;
  dropBallBtn.disabled = true;

  function animate() {
    drawBoard();

    const result = ball.update();
    ball.draw();

    if (result !== null) {
      animating = false;
      dropBallBtn.disabled = false;
      updateResults(result);
      return;
    }

    requestAnimationFrame(animate);
  }

  animate();
}

function updateResults(slotIndex) {
  const betAmount = parseFloat(betAmountInput.value) || 1;
  const multiplier = multipliers[slotIndex];
  const winAmount = betAmount * multiplier;

  totalBet += betAmount;
  totalWin += winAmount;
  const netLoss = totalWin - totalBet;

  document.getElementById('winAmount').textContent = `${winAmount.toFixed(2)}$`;
  document.getElementById('totalBet').textContent = `${totalBet.toFixed(2)}$`;
  document.getElementById('totalWin').textContent = `${totalWin.toFixed(2)}$`;
  document.getElementById('netLoss').textContent = `${netLoss.toFixed(2)}$`;

  const netLossElement = document.getElementById('netLoss');
  if (netLoss < 0) {
    netLossElement.style.color = '#FF6B6B';
  } else {
    netLossElement.style.color = '#0B7D5C';
  }
}

startBtn.addEventListener('click', () => {
  document.querySelector('.hero').style.display = 'none';
  simulationSection.classList.add('active');
  initCanvas();
  drawBoard();
});

dropBallBtn.addEventListener('click', () => {
  if (!animating) {
    animateBall();
  }
});

window.addEventListener('resize', () => {
  if (simulationSection.classList.contains('active')) {
    initCanvas();
    drawBoard();
  }
});

chatbotToggle.addEventListener('click', () => {
  chatbotWindow.classList.toggle('active');
});

chatbotClose.addEventListener('click', () => {
  chatbotWindow.classList.remove('active');
});

const responses = {
  probability: {
    message: "Les jeux d'argent sont conçus pour que la maison gagne toujours. L'espérance mathématique est négative : tu perds en moyenne 30% de chaque mise. C'est programmé ainsi pour que les casinos et sites de jeux fassent des profits.",
  },
  resources: {
    message: "Si tu as besoin d'aide :\n\n• Ligne 1 800 461-0140 (24/7)\n• Site web : www.aideaujeu.gouv.qc.ca\n• Chat en ligne disponible\n\nTu n'es pas seul, des ressources existent.",
  },
  questions: {
    message: "Les probabilités dans les jeux d'argent sont fixes et défavorables. Chaque partie est indépendante : les résultats passés n'influencent pas les futurs. Il n'existe aucune stratégie pour battre le hasard sur le long terme.",
  },
};

optionBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    const responseType = btn.dataset.response;
    const response = responses[responseType];

    if (response) {
      const messageDiv = document.createElement('div');
      messageDiv.className = 'message bot-message';
      messageDiv.textContent = response.message;
      chatbotMessages.appendChild(messageDiv);

      chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }
  });
});
