const mesh = document.querySelector("#mesh");
const columns = 4;
const rows = 4;
const newSet = new Set([2]);

const score = document.querySelector("#score");
const endGameLoseWindow = document.querySelector("#endgame-lose-window");
const endGameWinWindow = document.querySelector("#endgame-win-window");
const restartButtons = document.querySelectorAll(".restart-button");
const startButton = document.querySelector(".start-button");
const continueButton = document.querySelector(".continue-button");

const toggle = document.querySelector(".toggle-slider");
const modeFootnote = document.querySelector(".game-mode-footnote");

let cells = [];
let movesCount = 0;
let bestResultsArr = [];

function createGrid() {
  const gridSize = columns * rows;
  function createCell(x, y, i) {
    const cell = document.createElement("div");

    document.getElementById("mesh").append(cell);
    cell.classList.add("cell");
    cell.dataset.x = x;
    cell.dataset.y = y;
    cell.dataset.number = i;
  }

  for (let i = 0; i < gridSize; i++) {
    createCell(i % columns, Math.floor(i / columns), i);
  }
}

function getPlate(num) {
  return document.querySelector(`[data-index="${num}"]`, ".plate");
}

function createPlate(x, y, i) {
  const plate = document.createElement("div");
  const number = [...newSet][Math.floor(Math.random() * newSet.size)];

  plate.classList.add("plate");
  plate.textContent = number;
  plate.style.setProperty("--x", x);
  plate.style.setProperty("--y", y);
  plate.dataset.x = x;
  plate.dataset.y = y;
  plate.dataset.index = i;
  document.querySelector("#mesh").append(plate);
  changeColorByValue(plate);
}

function getRandomPlate() {
  let count = 0;
  if (mesh.childNodes.length < 33) {
    for (let i = 0; count < 1; i++) {
      const num = Math.round(Math.random() * 15);

      if (getPlate(num) === null) {
        createPlate(num % columns, Math.floor(num / columns), num);
        count++;
      }
    }
  }
}

function isEmpty(num) {
  return getPlate(num) === null;
}

window.addEventListener("keydown", (event) => {
  if (!document.body.classList.contains("cooldown")) {
    if (
      !endGameLoseWindow.classList.contains("hidden") ||
      !endGameWinWindow.classList.contains("hidden")
    ) {
    } else {
      keyDown(event);
    }
  }
});

document.addEventListener("touch", (event) => {
  keyDown({ key: event.detail });
});

function keyDown(event) {
  const command = {
    ArrowUp: moveUp,
    ArrowDown: moveDown,
    ArrowLeft: moveLeft,
    ArrowRight: moveRight,
  };
  command[event.key]?.();
  delay();
}

function delay() {
  document.body.classList.add("cooldown");
  setTimeout(() => document.body.classList.remove("cooldown"), 150);
}

function moveGroupPlates(groupType, promises) {
  groupType.forEach((group) => {
    for (let i = 1; i < group.length; i++) {
      const plate = getPlate(Number(group[i].dataset.number));
      let targetCell;

      if (plate !== null) {
        for (let j = i - 1; j >= 0; j--) {
          const plateUpper = getPlate(Number(group[j].dataset.number));
          if (
            plateUpper === null ||
            (plateUpper.textContent === plate.textContent &&
              !plateUpper.classList.contains("merged") &&
              !plateUpper.classList.contains("blocked"))
          ) {
            targetCell = group[j];
          } else {
            break;
          }
        }
      }

      if (!targetCell) {
        continue;
      }

      promises.push(waitForMoveEnd(plate));

      if (isEmpty(Number(targetCell.dataset.number)) === true) {
        changePosition(plate, targetCell);
        updatePositionInfo(plate);
      } else {
        changePosition(plate, targetCell);
        plate.classList.add("merged");
        updatePositionInfo(plate);
        addToMergeList();
      }
    }
  });
}

async function movePlates(groupType) {
  let promises = [];
  moveGroupPlates(groupType, promises);
  await Promise.all(promises);
  mergePlates();
  await waitForAnimationEnd(getRandomPlate());
  if (!anyMoves()) {
    showEndGameLoseWindow();
  }
  movesCount += 1;
}

function showEndGameLoseWindow() {
  endGameLoseWindow.classList.remove("hidden");
  document.querySelector(
    "#modal-lose-score"
  ).textContent = `Score: ${score.textContent}`;
  document.querySelector(
    "#modal-lose-moves"
  ).textContent = `Moves: ${movesCount}`;
}

function showEndGameWinWindow() {
  endGameWinWindow.classList.remove("hidden");
  document.querySelector(
    "#modal-win-score"
  ).textContent = `Score: ${score.textContent}`;
  document.querySelector(
    "#modal-win-moves"
  ).textContent = `Moves: ${movesCount}`;
}

restartButtons.forEach((e) =>
  e.addEventListener("click", () => {
    restartGame();
    newSet.clear();
    newSet.add(2);
  })
);

startButton.addEventListener("click", () => {
  startGame();
  newSet.clear();
  newSet.add(2);
});

function canGroupMove(groupType) {
  return groupType.some((cell, i) => {
    if (i === 0) {
      return false;
    }

    if (getPlate(Number(cell.dataset.number)) === null) {
      return false;
    }

    const plate = getPlate(Number(cell.dataset.number));

    const plateUpper = getPlate(Number(groupType[i - 1].dataset.number));
    if (
      plateUpper === null ||
      (plateUpper.textContent === plate.textContent &&
        !plateUpper.classList.contains("merged") &&
        !plateUpper.classList.contains("blocked"))
    ) {
      return true;
    } else {
      return false;
    }
  });
}

function canMove(groupType) {
  return groupType.some((groupType) => canGroupMove(groupType));
}

function anyMoves() {
  if (
    !canMove(groupByColumn()) &&
    !canMove(groupByColumnReverse()) &&
    !canMove(groupByRow()) &&
    !canMove(groupByRowReverse())
  ) {
    return false;
  } else {
    return true;
  }
}

function groupByColumn() {
  let columnOne = [];
  let columnTwo = [];
  let columnThree = [];
  let columnFour = [];
  let columns = [columnOne, columnTwo, columnThree, columnFour];
  cells.forEach((e) => {
    switch (e.dataset.x) {
      case "0":
        columnOne.push(e);
        break;
      case "1":
        columnTwo.push(e);
        break;
      case "2":
        columnThree.push(e);
        break;
      case "3":
        columnFour.push(e);
        break;
    }
  });
  return columns;
}

function groupByColumnReverse() {
  const columns = groupByColumn();
  const reversedColumns = [];
  columns.forEach((elem) => {
    const newColumn = [];
    for (let i = elem.length - 1; i >= 0; i--) {
      newColumn.push(elem[i]);
    }
    reversedColumns.push(newColumn);
  });
  return reversedColumns;
}

function groupByRow() {
  let rowOne = [];
  let rowTwo = [];
  let rowThree = [];
  let rowFour = [];
  let rows = [rowOne, rowTwo, rowThree, rowFour];
  cells.forEach((e) => {
    switch (e.dataset.y) {
      case "0":
        rowOne.push(e);
        break;
      case "1":
        rowTwo.push(e);
        break;
      case "2":
        rowThree.push(e);
        break;
      case "3":
        rowFour.push(e);
        break;
    }
  });
  return rows;
}

function groupByRowReverse() {
  const rows = groupByRow();
  const reversedRows = [];
  rows.forEach((elem) => {
    const newRow = [];
    for (let i = elem.length - 1; i >= 0; i--) {
      newRow.push(elem[i]);
    }
    reversedRows.push(newRow);
  });
  return reversedRows;
}

function startGame() {
  score.textContent = "0";
  createGrid();
  const cellsNodeList = Array.from(document.querySelectorAll(".cell"));
  cells = cellsNodeList;
  getRandomPlate();
  getRandomPlate();
  document.querySelector("#startgame-window").classList.add("hidden");
}

function restartGame() {
  movesCount = 0;
  clearMesh();
  startGame();
  endGameWinWindow.classList.add("hidden");
  endGameLoseWindow.classList.add("hidden");
}

function clearMesh() {
  Array.from(mesh.childNodes).forEach((child) => {
    child.remove();
  });
}

function getIndexByXY(plate) {
  const x = Number(plate.dataset.x);
  const y = Number(plate.dataset.y);
  const index = x + y * 4;
  return index;
}

function updatePositionInfo(plate) {
  plate.dataset.index = getIndexByXY(plate);
}

function changePosition(plate, newCell) {
  plate.style.setProperty("--y", newCell.dataset.y);
  plate.dataset.y = newCell.dataset.y;
  plate.style.setProperty("--x", newCell.dataset.x);
  plate.dataset.x = newCell.dataset.x;
}

function moveUp() {
  canMove(groupByColumn()) ? movePlates(groupByColumn()) : false;
  unblockPlates();
}

function moveDown() {
  canMove(groupByColumnReverse()) ? movePlates(groupByColumnReverse()) : false;
  unblockPlates();
}

function moveLeft() {
  canMove(groupByRow()) ? movePlates(groupByRow()) : false;
  unblockPlates();
}

function moveRight() {
  canMove(groupByRowReverse()) ? movePlates(groupByRowReverse()) : false;
  unblockPlates();
}

function mergePlates() {
  const platesForMerge = document.querySelectorAll(".merged");
  platesForMerge.forEach((elem) => {
    const elemIndex = elem.dataset.index;
    elem.remove();
    getPlate(elemIndex).textContent *= 2;
    score.textContent =
      Number(score.textContent) + Number(getPlate(elemIndex).textContent);
    changeColorByValue(getPlate(elemIndex));
  });
}

function addToMergeList() {
  const platesForMerge = document.querySelectorAll(".merged");
  platesForMerge.forEach((elem) => {
    const elemIndex = elem.dataset.index;
    getPlate(elemIndex).classList.add("blocked");
  });
}

function unblockPlates() {
  const blockedPlates = document.querySelectorAll(".blocked");
  blockedPlates.forEach((elem) => {
    elem.classList.remove("blocked");
  });
}

function waitForMoveEnd(plate) {
  return new Promise((resolve) => {
    plate.addEventListener("transitionend", resolve, { once: true });
  });
}

function waitForAnimationEnd() {
  return new Promise((resolve) => {
    document.addEventListener("animationend", resolve, { once: true });
  });
}

function changeColorByValue(plate) {
  switch (plate.textContent) {
    case "2": {
      plate.style.color = "#962e15";
      plate.style.backgroundColor = "#fe3f2d";
      plate.style.boxShadow = "0 0 2vmin rgba(254, 63, 45, 0.8)";
      break;
    }
    case "4": {
      plate.style.color = "#9b5605";
      plate.style.backgroundColor = "#ff8a1f";
      plate.style.boxShadow = "0 0 2vmin rgba(255, 138, 31, 0.8)";
      break;
    }
    case "8": {
      plate.style.color = "#9b7a05";
      plate.style.backgroundColor = "#ffcd07";
      plate.style.boxShadow = "0 0 2vmin rgba(255, 205, 7, 0.8)";
      break;
    }
    case "16": {
      newSet.add(4);
      plate.style.color = "#6d8813";
      plate.style.backgroundColor = "#d9f21c";
      plate.style.boxShadow = "0 0 2vmin rgba(217, 242, 28, 0.8)";
      break;
    }
    case "32": {
      plate.style.color = "#1c9432";
      plate.style.backgroundColor = "#1dee43";
      plate.style.boxShadow = "0 0 2vmin rgba(29, 238, 67, 0.8)";
      break;
    }
    case "64": {
      plate.style.color = "#1b9578";
      plate.style.backgroundColor = "#28fad0";
      plate.style.boxShadow = "0 0 2vmin rgba(40, 250, 208, 0.8)";
      break;
    }
    case "128": {
      plate.style.color = "#246ba5";
      plate.style.backgroundColor = "#4eb5ff";
      plate.style.boxShadow = "0 0 2vmin rgba(78, 181, 255, 0.8)";
      // if (toggle.classList.contains("mode-on")) {
      //   showEndGameWinWindow();
      // }
      break;
    }
    case "256": {
      plate.style.color = "#571492";
      plate.style.backgroundColor = "#a640ff";
      plate.style.boxShadow = "0 0 2vmin rgba(166, 64, 255, 0.8)";
      break;
    }
    case "512": {
      plate.style.color = "#5F169E";
      plate.style.backgroundColor = "#e827f2";
      plate.style.boxShadow = "0 0 2vmin rgba(232, 39, 242, 0.8)";
      break;
    }
    case "1024": {
      newSet.add(8);
      plate.style.color = "#9b144f";
      plate.style.backgroundColor = "#f01e72";
      plate.style.boxShadow = "0 0 2vmin rgba(240, 30, 114, 0.8)";
      break;
    }
    case "2048": {
      plate.style.color = "#838181";
      plate.style.backgroundColor = "#fef3f4";
      plate.style.boxShadow = "0 0 2vmin rgba(254, 243, 244, 0.8)";
      // showEndGameWinWindow();
      break;
    }
    case "4096": {
      plate.style.color = "#000000";
      plate.style.backgroundColor = "#fe0";
      plate.style.boxShadow = "0 0 2vmin rgba(254, 243, 0, 0.8)";
      // showEndGameWinWindow();
      break;
    }
  }
}

toggle.addEventListener("click", () => {
  toggle.classList.toggle("mode-on");
});

function gameModeSwitch() {
  // if (toggle.classList.contains("mode-on")) {
  //   modeFootnote.textContent = "To win, you need to get a tile 128";
  // } else {
  modeFootnote.textContent = "To win, you need to get a tile 2048";
  // }
}

continueButton.addEventListener("click", () => {
  endGameWinWindow.classList.add("hidden");
  toggle.classList.remove("mode-on");
});
