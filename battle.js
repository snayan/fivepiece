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
    let botId = Bot.id;
    let humanId = Human.id;
    let botCanFive = [],
      botCanFour = [],
      botCanThree = [],
      botCanTow = [];
    let humanCanFive = [],
      humanCanFour = [],
      humanCanThree = [],
      humanCanTow = [];

    for (let s of botCanSteps) {
      if (isWinOver(botId, s, 5)) {
        //机器人可以成五的棋
        botCanFive.push(s);
      } else if (isWinOver(botId, s, 4)) {
        //机器人可以成四的棋
        botCanFour.push(s);
      } else if (isWinOver(botId, s, 3)) {
        //机器人可以成三的棋
        botCanThree.push(s);
      } else if (isWinOver(botId, s, 2)) {
        //机器人可以成二的棋
        botCanTow.push(s);
      }
    }

    for (let s of humanCanSteps) {
      if (isWinOver(humanId, s, 5)) {
        //人类可以成五的棋
        humanCanFive.push(s);
      } else if (isWinOver(humanId, s, 4)) {
        //人类可以成四的棋
        humanCanFour.push(s);
      } else if (isWinOver(humanId, s, 3)) {
        //人类可以成三的棋
        humanCanThree.push(s);
      } else if (isWinOver(humanId, s, 2)) {
        //人类可以成二的棋
        humanCanTow.push(s);
      }
    }
    //自己能成五，则成五
    if (botCanFive.length) {
      return botCanFive[0];
    }
    //阻止人类成五
    if (humanCanFive.length) {
      return humanCanFive[0];
    }
    //自己能成四，则成四
    if (botCanFour.length) {
      let best = bestStep(botCanFour, 4, botId);
      if (best) {
        return best;
      }
    }
    //阻止人类成四
    if (humanCanFour.length) {
      let best = bestStep(humanCanFour, 4, humanId);
      if (best) {
        return best;
      }
    }
    //自己能成三，则成三
    if (botCanThree.length) {
      let best = bestStep(botCanThree, 3, botId);
      if (best) {
        return best;
      }
    }
    //阻止人类成三
    if (humanCanThree.length) {
      let best = bestStep(humanCanThree, 3, humanId);
      if (best) {
        return best;
      }
    }
    //自己能成二，则成二
    if (botCanTow.length) {
      let best = bestStep(botCanTow, 2, botId);
      if (best) {
        return best;
      }
    }
    //阻止人类成二
    if (humanCanTow.length) {
      let best = bestStep(humanCanTow, 2, humanId);
      if (best) {
        return best;
      }
    }
    //否则，随机走一步可以走的棋子
    return botCanSteps[getRandom(0, botCanSteps.length - 1)];
  }

  /* 算出最优的一个位置 */
  function bestStep(steps, num, who) {
    let size = boardStatus.gridUnitCount;
    let current = who === Bot.id ? Bot.pieces : Human.pieces;
    let target, rounds, value, maxValue;
    if (!Array.isArray(steps) || !steps.length) {
      return null;
    }
    let store = new Map();
    for (let s of steps) {
      let [x, y] = computeXY(s);
      let min, max, minX, minY, maxX, maxY, iPosition, iFlag;
      value = 0;
      maxValue = 0;
      //水平方向
      min = computeValue(0, y);
      max = computeValue(size - 1, y);
      target = computeValue(x + num - 1, y);
      if (~current.indexOf(target)) {
        iPosition = num - 1;
        iFlag = true;
        while (iPosition > 0 && iFlag) {
          iFlag = ~current.indexOf(computeValue(x + num - 1 - iPosition, y));
          iPosition = iPosition - 1;
        }
        if (iFlag) {
          rounds =
            stepRound(target)
              .map(v => computeValue(v))
              .filter(v => ~current.indexOf(v)).length + 1;
          let left = computeValue(x - 1, y);
          let right = computeValue(x + num - 1 + 1, y);
          if (left >= min) {
            value = 1;
          }
          if (right <= max) {
            value = 2;
          }
          maxValue = Math.max(maxValue, value * rounds);
        }
      }
      target = computeValue(x - num + 1, y);
      if (~current.indexOf(target)) {
        iPosition = num - 1;
        iFlag = true;
        while (iPosition > 0 && iFlag) {
          iFlag = ~current.indexOf(computeValue(x - num + 1 + iPosition, y));
          iPosition = iPosition - 1;
        }
        if (iFlag) {
          rounds =
            stepRound(target)
              .map(v => computeValue(v))
              .filter(v => ~current.indexOf(v)).length + 1;
          let left = computeValue(x - num + 1 - 1, y);
          let right = computeValue(x + 1, y);
          if (left >= min) {
            value = 1;
          }
          if (right <= max) {
            value = 2;
          }
          maxValue = Math.max(maxValue, value * rounds);
        }
      }
      //垂直方向
      min = computeValue(x, 0);
      max = computeValue(x, size - 1);
      target = computeValue(x, y + num - 1);
      if (~current.indexOf(target)) {
        iPosition = num - 1;
        iFlag = true;
        while (iPosition > 0 && iFlag) {
          iFlag = ~current.indexOf(computeValue(x, y + num - 1 - iPosition));
          iPosition = iPosition - 1;
        }
        if (iFlag) {
          rounds =
            stepRound(target)
              .map(v => computeValue(v))
              .filter(v => ~current.indexOf(v)).length + 1;
          let up = computeValue(x, y - 1);
          let down = computeValue(x, y + num - 1 + 1);
          if (up >= min) {
            value = 1;
          }
          if (down <= max) {
            value = 2;
          }
          maxValue = Math.max(maxValue, value * rounds);
        }
      }
      target = computeValue(x, y - num + 1);
      if (~current.indexOf(target)) {
        iPosition = num - 1;
        iFlag = true;
        while (iPosition > 0 && iFlag) {
          iFlag = ~current.indexOf(computeValue(x, y - num + 1 + iPosition));
          iPosition = iPosition - 1;
        }
        if (iFlag) {
          rounds =
            stepRound(target)
              .map(v => computeValue(v))
              .filter(v => ~current.indexOf(v)).length + 1;
          let up = computeValue(x, y - num + 1 - 1);
          let down = computeValue(x, y + 1);
          if (up >= min) {
            value = 1;
          }
          if (down <= max) {
            value = 2;
          }
          maxValue = Math.max(maxValue, value * rounds);
        }
      }
      //45度方向
      minX = Math.min(size - 1, x + y);
      minY = y - (minX - x);
      min = computeValue(minX, minY);
      maxY = Math.min(size - 1, x + y);
      maxX = x - (maxY - y);
      max = computeValue(maxX, maxY);
      target = computeValue(x - num + 1, y + num + 1);
      if (~current.indexOf(target)) {
        iPosition = num - 1;
        iFlag = true;
        while (iPosition > 0 && iFlag) {
          iFlag = ~current.indexOf(computeValue(x - num + 1 + iPosition, y + num + 1 - iPosition));
          iPosition = iPosition - 1;
        }
        if (iFlag) {
          rounds =
            stepRound(target)
              .map(v => computeValue(v))
              .filter(v => ~current.indexOf(v)).length + 1;
          let rightUp = computeValue(x + 1, y + 1);
          let leftDown = computeValue(x - num + 1 - 1, y + num + 1 - 1);
          if (up >= min) {
            value = 1;
          }
          if (down <= max) {
            value = 2;
          }
          maxValue = Math.max(maxValue, value * rounds);
        }
      }
      target = computeValue(x + num - 1, y - num + 1);
      if (~current.indexOf(target)) {
        iPosition = num - 1;
        iFlag = true;
        while (iPosition > 0 && iFlag) {
          iFlag = ~current.indexOf(computeValue(x + num - 1 - iPosition, y - num + 1 + iPosition));
          iPosition = iPosition - 1;
        }
        if (iFlag) {
          rounds =
            stepRound(target)
              .map(v => computeValue(v))
              .filter(v => ~current.indexOf(v)).length + 1;
          let rightUp = computeValue(x + num - 1 + 1, y - num + 1 - 1);
          let leftDown = computeValue(x - 1, y + 1);
          if (rightUp >= min) {
            value = 1;
          }
          if (leftDown <= max) {
            value = 2;
          }
          maxValue = Math.max(maxValue, value * rounds);
        }
      }
      //135度方向
      minX = Math.max(0, x - y);
      minY = y - (x - minX);
      min = computeValue(minX, minY);
      maxX = Math.min(size - 1, x + size - y);
      maxY = y + (maxX - x);
      max = computeValue(maxX, maxY);
      target = computeValue(x + num - 1, y + num - 1);
      if (~current.indexOf(target)) {
        iPosition = num - 1;
        iFlag = true;
        while (iPosition > 0 && iFlag) {
          iFlag = ~current.indexOf(computeValue(x + num - 1 - iPosition, y + num - 1 - iPosition));
          iPosition = iPosition - 1;
        }
        if (iFlag) {
          rounds =
            stepRound(target)
              .map(v => computeValue(v))
              .filter(v => ~current.indexOf(v)).length + 1;
          let leftUp = computeValue(x - 1, y - 1);
          let rightDown = computeValue(x + num - 1 + 1, y + num - 1 + 1);
          if (leftUp >= min) {
            value = 1;
          }
          if (rightDown <= max) {
            value = 2;
          }
          maxValue = Math.max(maxValue, value * rounds);
        }
      }
      target = computeValue(x - num + 1, y - num + 1);
      if (~current.indexOf(target)) {
        iPosition = num - 1;
        iFlag = true;
        while (iPosition > 0 && iFlag) {
          iFlag = ~current.indexOf(computeValue(x - num + 1 + iPosition, y - num + 1 + iPosition));
          iPosition = iPosition - 1;
        }
        if (iFlag) {
          rounds =
            stepRound(target)
              .map(v => computeValue(v))
              .filter(v => ~current.indexOf(v)).length + 1;
          let leftUp = computeValue(x - num + 1 - 1, y - num + 1 - 1);
          let rightDown = computeValue(x + 1, y + 1);
          if (leftUp >= min) {
            value = 1;
          }
          if (rightDown <= max) {
            value = 2;
          }
          maxValue = Math.max(maxValue, value * rounds);
        }
      }
      store.set(s, maxValue);
    }
    let r = Array.from(store);
    if (r.length) {
      return r.sort((a, b) => a[1] < b[1])[0][0];
    }
    return null;
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

  /* 计算权重 */
  function computeWeight(x, y, num) {
    let value = 0;
    let size = boardStatus.gridUnitCount;
    let min = computeValue(0, y);
    let max = computeValue(size - 1, y);
    let left = computeValue(x - 1, y);
    let right = computeValue(x + num - 1 + 1, y);
    if (left >= min) {
      value = value + 1;
    }
    if (right <= max) {
      value = value + 1;
    }
    return value;
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
