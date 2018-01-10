/* 五子棋对战 */

(function(w, d, b, undefined) {
  //最大值悔棋
  const MAX_RETURN = 100;
  //我
  let Human = {
    id: 0,
    pieces: [],
    lastReturnPiece: null
  };
  //电脑
  let Bot = {
    id: 1,
    pieces: [],
    lastReturnPiece: null
  };
  //当前为谁,默认为我
  let WHO = Human.id;
  //棋盘状态
  let boardStatus = null;
  //已经被占据的棋盘状态
  let havenBoardStatus = null;
  //棋盘单元格
  let unitClass = b.View.unitClass;
  //悔棋按钮类名
  let returnClass = b.View.returnClass;
  //撤销悔棋按钮类明
  let cancelReturnClass = b.View.cancelReturnClass;
  //重新开始
  let winRestart = b.View.winRestart;
  //悔棋按钮
  let returnBtn = d.querySelector(`.${returnClass}`);
  //撤销悔棋按钮
  let cancelReturnBtn = d.querySelector(`.${cancelReturnClass}`);

  /* 开始游戏 */
  function start() {
    //创建棋盘
    boardStatus = b.View.createBoard();
    havenBoardStatus = [...Bot.pieces, ...Human.pieces];
    d.addEventListener('click', e => {
      let el = e.target;
      let classList = el.classList;
      if (classList.contains(unitClass)) {
        //第一步是人开始
        humanStep(el);
      } else if (classList.contains(returnClass)) {
        //悔棋
        returnStep(el);
      } else if (classList.contains(cancelReturnClass)) {
        //撤销悔棋
        cancelReturnStep(el);
      } else if (classList.contains(winRestart)) {
        //重新开始
        reStart();
      }
    });
  }

  /* 重新开始 */
  function reStart() {
    Human.pieces = [];
    Human.lastReturnPiece = null;
    Bot.pieces = [];
    Bot.lastReturnPiece = null;
    boardStatus = null;
    WHO = Human.id;
    havenBoardStatus = [...Bot.pieces, ...Human.pieces];
    //重新创建棋盘
    boardStatus = b.View.createBoard();
  }

  /* 人下棋 */
  function humanStep(el) {
    //开始下棋
    if (WHO === Human.id) {
      let step = b.View.getStepValue(el);
      if (!~havenBoardStatus.indexOf(step)) {
        Human.pieces.push(step);
        havenBoardStatus = [...Bot.pieces, ...Human.pieces];
        b.View.createPiece(el, Human.id);
        if (isWinOver(Human.id, step, 5)) {
          b.View.winOver(WHO);
          return true;
        }
        setTimeout(() => {
          WHO = Bot.id;
          botStep();
        }, 333);
        if (returnBtn) {
          returnBtn.classList.remove('disabled');
        }
      }
    }
  }

  /* 悔棋 */
  function returnStep(el) {
    if (el.classList.contains('disabled')) {
      return false;
    }
    if (WHO == Human.id) {
      //人类先悔棋
      let lastHumanStep = Human.pieces.slice(-1)[0];
      if (lastHumanStep != undefined) {
        let lastHumanStepXY = computeXY(lastHumanStep);
        let lastHumanValue = computeValue(lastHumanStepXY[0], lastHumanStepXY[1]);
        Human.lastReturnPiece = Human.pieces.splice(Human.pieces.length - 1, 1)[0];
        havenBoardStatus = [...Bot.pieces, ...Human.pieces];
        b.View.cancelLastStep(lastHumanValue, Human.id);
        if (cancelReturnBtn) {
          cancelReturnBtn.classList.remove('disabled');
        }
        if (returnBtn) {
          returnBtn.classList.add('disabled');
        }
      }
      //机器人再悔棋
      setTimeout(() => {
        let lastBotStep = Bot.pieces.slice(-1)[0];
        if (lastBotStep != undefined) {
          let lastBotStepXY = computeXY(lastBotStep);
          let lastBotValue = computeValue(lastBotStepXY[0], lastBotStepXY[1]);
          Bot.lastReturnPiece = Bot.pieces.splice(Bot.pieces.length - 1, 1)[0];
          havenBoardStatus = [...Bot.pieces, ...Human.pieces];
          b.View.cancelLastStep(lastBotValue, Bot.id);
        }
      }, 333);
    }
  }

  //撤销悔棋
  function cancelReturnStep(el) {
    if (el.classList.contains('disabled')) {
      return false;
    }
    if (WHO === Human.id) {
      //人类先撤销悔棋
      Human.pieces.push(Human.lastReturnPiece);
      havenBoardStatus = [].concat(Bot.pieces, Human.pieces);
      b.View.createPiece(Human.lastReturnPiece, Human.id);
      WHO = Bot.id;
      if (returnBtn) {
        returnBtn.classList.remove('disabled');
      }
      if (cancelReturnBtn) {
        cancelReturnBtn.classList.add('disabled');
      }
      //机器人再撤销悔棋
      setTimeout(() => {
        Bot.pieces.push(Bot.lastReturnPiece);
        havenBoardStatus = [...Bot.pieces, ...Human.pieces];
        b.View.createPiece(Bot.lastReturnPiece, Bot.id);
        WHO = Human.id;
      }, 333);
    }
  }

  /* 机器人下棋 */
  function botStep() {
    if (WHO === Bot.id) {
      let step = computeBotStep();
      Bot.pieces.push(step);
      havenBoardStatus = [...Bot.pieces, ...Human.pieces];
      b.View.createPiece(step, WHO);
      if (isWinOver(Bot.id, step, 5)) {
        b.View.winOver(WHO);
        return true;
      }
      if (Bot.pieces.length === boardStatus.length / 2) {
        //平局
        b.View.drawOver();
        return true;
      }
      WHO = Human.id;
      return true;
    }
  }

  /* 计算机器人应该走的下一步 */
  function computeBotStep() {
    havenBoardStatus = [...Bot.pieces, ...Human.pieces];
    let botCanSteps = getCanWinStep(Bot.id);
    let humanCanSteps = getCanWinStep(Human.id);
    //机器人可以成五的棋
    for (let s of botCanSteps) {
      if (isWinOver(Bot.id, s, 5)) {
        return s;
      }
    }
    //人类可以成五的棋
    for (let s of humanCanSteps) {
      if (isWinOver(Human.id, s, 5)) {
        return s;
      }
    }
    //机器人可以成四的棋
    for (let s of botCanSteps) {
      if (isWinOver(Bot.id, s, 4)) {
        return s;
      }
    }
    //人类可以成四的棋
    for (let s of humanCanSteps) {
      if (isWinOver(Human.id, s, 4)) {
        return s;
      }
    }
    //否则，围剿对方
    let lastHumanStep = Human.pieces.slice(-1)[0];
    let lastHumanStepXY = computeXY(lastHumanStep);
    let canSteps = stepRound(lastHumanStep);
    for (let s of canSteps) {
      let value = computeValue(s[0], s[1]);
      if (~Human.pieces.indexOf(value)) {
        let tx = lastHumanStepXY[0] - s[0] + lastHumanStepXY[0];
        let ty = lastHumanStepXY[1] - s[1] + lastHumanStepXY[1];
        let tValue = computeValue(tx, ty);
        if (!~havenBoardStatus.indexOf(tValue)) {
          return tValue;
        }
      } else if (!~havenBoardStatus.indexOf(value)) {
        return value;
      }
    }
    //否则，随机走一步可以走的棋
    return botCanSteps[getRandom(0, botCanSteps.length - 1)];
  }

  /* 判断是否胜利，结束 */
  function isWinOver(who, step, num) {
    let size = boardStatus.gridUnitCount;
    let current = who === Human.id ? Human : Bot;
    if (current.pieces.length < num - 1) {
      return false;
    }
    let isWin = false;
    let [currentX, currentY] = computeXY(step);
    //水平方向
    for (let i = 0; i < num; i++) {
      let x = currentX - i;
      let y = currentY;
      let min = computeValue(0, currentY);
      let max = computeValue(size - 1, currentY);
      if (x >= 0) {
        let hSteps = [0, 1, 2, 3, 4]
          .slice(0, num)
          .map(v => computeValue(x + v, y))
          .filter(v => v === step || (v >= min && v <= max && ~current.pieces.indexOf(v)));
        if (hSteps.length === num) {
          //胜利
          return true;
        }
      }
    }
    //垂直方向
    for (let i = 0; i < num; i++) {
      let x = currentX;
      let y = currentY - i;
      let min = computeValue(currentX, 0);
      let max = computeValue(currentX, size - 1);
      if (y >= 0) {
        let hSteps = [0, 1, 2, 3, 4]
          .slice(0, num)
          .map(v => computeValue(x, y + v))
          .filter(v => v === step || (v >= min && v <= max && ~current.pieces.indexOf(v)));
        if (hSteps.length === num) {
          //胜利
          return true;
        }
      }
    }
    //45度方向
    for (let i = 0; i < num; i++) {
      let x = currentX + i;
      let y = currentY - i;
      let minX = Math.min(size - 1, currentX + currentY);
      let minY = currentY - (minX - currentX);
      let min = computeValue(minX, minY);
      let maxY = Math.min(size - 1, currentX + currentY);
      let maxX = currentX - (maxY - currentY);
      let max = computeValue(maxX, maxY);
      if (y >= 0 && x <= size - 1) {
        let hSteps = [0, 1, 2, 3, 4]
          .slice(0, num)
          .map(v => computeValue(x - v, y + v))
          .filter(v => v === step || (v >= min && v <= max && ~current.pieces.indexOf(v)));
        if (hSteps.length === num) {
          //胜利
          return true;
        }
      }
    }
    //135度方向
    for (let i = 0; i < num; i++) {
      let x = currentX - i;
      let y = currentY - i;
      let minX = Math.max(0, currentX - currentY);
      let minY = currentY - (currentX - minX);
      let min = computeValue(minX, minY);
      let maxX = Math.min(size - 1, currentX + size - currentY);
      let maxY = currentY + (maxX - currentX);
      let max = computeValue(maxX, maxY);
      if (y >= 0 && x >= 0) {
        let hSteps = [0, 1, 2, 3, 4]
          .slice(0, num)
          .map(v => computeValue(x + v, y + v))
          .filter(v => v === step || (v >= min && v <= max && ~current.pieces.indexOf(v)));
        if (hSteps.length === num) {
          //胜利
          return true;
        }
      }
    }
    return false;
  }

  /* 该棋子四周坐标 */
  function stepRound(step) {
    let min = boardStatus.gridBoard[0];
    let max = boardStatus.gridBoard.slice(-1)[0];
    let [x, y] = computeXY(step);
    return [
      [x - 1, y - 1],
      [x, y - 1],
      [x + 1, y - 1],
      [x - 1, y],
      [x + 1, y],
      [x - 1, y + 1],
      [x, y + 1],
      [x + 1, y + 1]
    ].filter(function(v) {
      return v[0] >= min && v[0] <= max && v[1] >= min && v[1] <= max;
    });
  }

  /* 获取所有可以走且可能获得胜利的棋 */
  function getCanWinStep(who) {
    let current = who === Human.id ? Human.pieces : Bot.pieces;
    return deduplicate(
      current
        .reduce((s, v) => [...s, ...stepRound(v)], [])
        .map(v => computeValue(v[0], v[1]))
        .filter(v => !~havenBoardStatus.indexOf(v))
    ).sort((a, b) => a < b);
  }

  /* 数组去重 */
  function deduplicate(d) {
    return Array.from(new Set(d));
  }

  /* 获取随机值 */
  function getRandom(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
  }

  /* 计算XY的坐标 */
  function computeXY(v) {
    let size = boardStatus.gridUnitCount;
    let y = Math.floor(v / size);
    let x = v % size;
    return [x, y];
  }

  /* 计算坐标值 */
  function computeValue(x, y) {
    let size = boardStatus.gridUnitCount;
    return y * size + x;
  }

  start();
})(window, document, window.GO);
