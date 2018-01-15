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
      let best = bestStep(botCanFour.filter(v => isWinOver(botId, v, 5, true)), 4, botId);
      if (best) {
        return best;
      }
    }
    //阻止人类成四
    if (humanCanFour.length) {
      let best = bestStep(humanCanFour.filter(v => isWinOver(humanId, v, 5, true)), 4, humanId);
      if (best) {
        return best;
      }
    }
    //阻止人类成三
    if (humanCanThree.length) {
      let best = bestStep(humanCanThree.filter(v => isWinOver(humanId, v, 5, true)), 3, humanId);
      if (best) {
        return best;
      }
    }
    //自己能成三，则成三
    if (botCanThree.length) {
      let best = bestStep(botCanThree.filter(v => isWinOver(botId, v, 5, true)), 3, botId);
      if (best) {
        return best;
      }
    }
    //阻止人类成二
    if (humanCanTow.length) {
      let best = bestStep(humanCanTow.filter(v => isWinOver(humanId, v, 5, true)), 2, humanId);
      if (best) {
        return best;
      }
    }
    //自己能成二，则成二
    if (botCanTow.length) {
      let best = bestStep(botCanTow.filter(v => isWinOver(botId, v, 5, true)), 2, botId);
      if (best) {
        return best;
      }
    }
    //否则，随机走一步可以走的棋子
    return botCanSteps[getRandom(0, botCanSteps.length - 1)];
  }

  /* 算出最优的一个位置 */
  function bestStep(steps, num, who) {
    let havenBoardStatus = [...Bot.pieces, ...Human.pieces];
    let boardMin = boardStatus.gridBoard[0];
    let boardMax = boardStatus.gridBoard.slice(-1)[0];
    let size = boardStatus.gridUnitCount;
    let current = who === Bot.id ? Bot.pieces : Human.pieces;
    let target, rounds, value, maxValue;
    if (!Array.isArray(steps) || !steps.length) {
      return null;
    }
    let store = new Map();
    for (let s of steps) {
      let [x, y] = computeXY(s);
      let min, max, minX, minY, maxX, maxY, targetX, targetY, iPosition, iIndex, iFlag;
      value = 0;
      maxValue = 0;
      //水平方向
      min = Math.max(computeValue(0, y), boardMin);
      max = Math.min(computeValue(size - 1, y), boardMax);
      iIndex = num;
      while (iIndex) {
        targetX = Math.min(x + num - 1 - iIndex, size - 1);
        target = computeValue(targetX, y);
        if (target === s || (target >= min && target <= max && ~current.indexOf(target))) {
          iPosition = num - 2;
          iFlag = true;
          while (iPosition > 0 && iFlag) {
            iFlag = target === s || ~current.indexOf(computeValue(targetX - iPosition, y));
            iPosition = iPosition - 1;
          }
          if (iFlag) {
            value = 0;
            rounds =
              stepRound(target)
                .map(([x, y]) => computeValue(x, y))
                .filter(v => ~current.indexOf(v)).length + 1;
            let left = computeValue(x - 1, y);
            let right = computeValue(targetX + 1, y);
            if (left >= min) {
              if (~current.indexOf(left)) {
                value += 10;
              } else if (!~havenBoardStatus.indexOf(left)) {
                value += 1;
              }
            }
            if (right <= max) {
              if (~current.indexOf(right)) {
                value += 10;
              } else if (!~havenBoardStatus.indexOf(right)) {
                value += 1;
              }
            }
            maxValue = Math.max(maxValue, value * rounds);
          }
        }
        iIndex = iIndex - 1;
      }
      iIndex = num;
      while (iIndex) {
        targetX = Math.max(0, x - num + 1 + iIndex);
        target = computeValue(targetX, y);
        if (target === s || (target >= min && target <= max && ~current.indexOf(target))) {
          iPosition = num - 2;
          iFlag = true;
          while (iPosition > 0 && iFlag) {
            iFlag = target === s || ~current.indexOf(computeValue(targetX + iPosition, y));
            iPosition = iPosition - 1;
          }
          if (iFlag) {
            value = 0;
            rounds =
              stepRound(target)
                .map(([x, y]) => computeValue(x, y))
                .filter(v => ~current.indexOf(v)).length + 1;
            let left = computeValue(targetX - 1, y);
            let right = computeValue(x + 1, y);
            if (left >= min) {
              if (~current.indexOf(left)) {
                value += 10;
              } else if (!~havenBoardStatus.indexOf(left)) {
                value += 1;
              }
            }
            if (right <= max) {
              if (~current.indexOf(right)) {
                value += 10;
              } else if (!~havenBoardStatus.indexOf(right)) {
                value += 1;
              }
            }
            maxValue = Math.max(maxValue, value * rounds);
          }
        }
        iIndex = iIndex - 1;
      }

      //垂直方向
      min = Math.max(computeValue(x, 0), boardMin);
      max = Math.min(computeValue(x, size - 1), boardMax);
      iIndex = num;
      while (iIndex) {
        targetY = Math.min(size - 1, y + num - 1 - iIndex);
        target = computeValue(x, targetY);
        if (target === s || (target >= min && target <= max && ~current.indexOf(target))) {
          iPosition = num - 2;
          iFlag = true;
          while (iPosition > 0 && iFlag) {
            iFlag = target === s || ~current.indexOf(computeValue(x, targetY - iPosition));
            iPosition = iPosition - 1;
          }
          if (iFlag) {
            value = 0;
            rounds =
              stepRound(target)
                .map(([x, y]) => computeValue(x, y))
                .filter(v => ~current.indexOf(v)).length + 1;
            let up = computeValue(x, y - 1);
            let down = computeValue(x, targetY + 1);
            if (up >= min) {
              if (~current.indexOf(up)) {
                value += 10;
              } else if (!~havenBoardStatus.indexOf(up)) {
                value += 1;
              }
            }
            if (down <= max) {
              if (~current.indexOf(down)) {
                value += 10;
              } else if (!~havenBoardStatus.indexOf(down)) {
                value += 1;
              }
            }
            maxValue = Math.max(maxValue, value * rounds);
          }
        }
        iIndex = iIndex - 1;
      }
      iIndex = num;
      while (iIndex) {
        targetY = Math.max(y - num + 1 + iIndex, 0);
        target = computeValue(x, targetY);
        if (target === s || (target >= min && target <= max && ~current.indexOf(target))) {
          iPosition = num - 2;
          iFlag = true;
          while (iPosition > 0 && iFlag) {
            iFlag = target === s || ~current.indexOf(computeValue(x, targetY + iPosition));
            iPosition = iPosition - 1;
          }
          if (iFlag) {
            value = 0;
            rounds =
              stepRound(target)
                .map(([x, y]) => computeValue(x, y))
                .filter(v => ~current.indexOf(v)).length + 1;
            let up = computeValue(x, targetY - 1);
            let down = computeValue(x, y + 1);
            if (up >= min) {
              if (~current.indexOf(up)) {
                value += 10;
              } else if (!~havenBoardStatus.indexOf(up)) {
                value += 1;
              }
            }
            if (down <= max) {
              if (~current.indexOf(down)) {
                value += 10;
              } else if (!~havenBoardStatus.indexOf(down)) {
                value += 1;
              }
            }
            maxValue = Math.max(maxValue, value * rounds);
          }
        }
        iIndex = iIndex - 1;
      }

      //45度方向
      minX = Math.min(size - 1, x + y);
      minY = y - (minX - x);
      min = Math.max(computeValue(minX, minY), boardMin);
      maxY = Math.min(size - 1, x + y);
      maxX = x - (maxY - y);
      max = Math.min(computeValue(maxX, maxY), boardMax);
      iIndex = num;
      while (iIndex) {
        targetX = Math.max(0, x - num + 1 + iIndex);
        targetY = Math.min(size - 1, y + num - 1 - iIndex);
        target = computeValue(targetX, targetY);
        if (target === s || (target >= min && target <= max && ~current.indexOf(target))) {
          iPosition = num - 2;
          iFlag = true;
          while (iPosition > 0 && iFlag) {
            iFlag = target === s || ~current.indexOf(computeValue(targetX + iPosition, targetY - iPosition));
            iPosition = iPosition - 1;
          }
          if (iFlag) {
            value = 0;
            rounds =
              stepRound(target)
                .map(([x, y]) => computeValue(x, y))
                .filter(v => ~current.indexOf(v)).length + 1;
            let rightUp = computeValue(x + 1, y + 1);
            let leftDown = computeValue(targetX - 1, targetY - 1);
            if (rightUp >= min) {
              if (~current.indexOf(rightUp)) {
                value += 10;
              } else if (!~havenBoardStatus.indexOf(rightUp)) {
                value += 1;
              }
            }
            if (leftDown <= max) {
              if (~current.indexOf(leftDown)) {
                value += 10;
              } else if (!~havenBoardStatus.indexOf(leftDown)) {
                value += 1;
              }
            }
            maxValue = Math.max(maxValue, value * rounds);
          }
        }
        iIndex = iIndex - 1;
      }
      iIndex = num;
      while (iIndex) {
        targetX = Math.min(size - 1, x + num - 1 - iIndex);
        targetY = Math.max(0, y - num + 1 + iIndex);
        target = computeValue(targetX, targetY);
        if (target === s || (target >= min && target <= max && ~current.indexOf(target))) {
          iPosition = num - 2;
          iFlag = true;
          while (iPosition > 0 && iFlag) {
            iFlag = target === s || ~current.indexOf(computeValue(targetX - iPosition, targetY + iPosition));
            iPosition = iPosition - 1;
          }
          if (iFlag) {
            value = 0;
            rounds =
              stepRound(target)
                .map(([x, y]) => computeValue(x, y))
                .filter(v => ~current.indexOf(v)).length + 1;
            let rightUp = computeValue(targetX + 1, targetY - 1);
            let leftDown = computeValue(x - 1, y + 1);
            if (rightUp >= min) {
              if (~current.indexOf(rightUp)) {
                value += 10;
              } else if (!~havenBoardStatus.indexOf(rightUp)) {
                value += 1;
              }
            }
            if (leftDown <= max) {
              if (~current.indexOf(leftDown)) {
                value += 10;
              } else if (!~havenBoardStatus.indexOf(leftDown)) {
                value += 1;
              }
            }
            maxValue = Math.max(maxValue, value * rounds);
          }
        }
        iIndex = iIndex - 1;
      }

      //135度方向
      minX = Math.max(0, x - y);
      minY = y - (x - minX);
      min = Math.max(computeValue(minX, minY), boardMin);
      maxX = Math.min(size - 1, x + size - y);
      maxY = y + (maxX - x);
      max = Math.min(computeValue(maxX, maxY), boardMax);
      iIndex = num;
      while (iIndex) {
        targetX = Math.min(size - 1, x + num - 1 - iIndex);
        targetY = Math.min(size - 1, y + num - 1 - iIndex);
        target = computeValue(targetX, targetY);
        if (target === s || (target >= min && target <= max && ~current.indexOf(target))) {
          iPosition = num - 2;
          iFlag = true;
          while (iPosition > 0 && iFlag) {
            iFlag = target === s || ~current.indexOf(computeValue(targetX - iPosition, targetY - iPosition));
            iPosition = iPosition - 1;
          }
          if (iFlag) {
            value = 0;
            rounds =
              stepRound(target)
                .map(([x, y]) => computeValue(x, y))
                .filter(v => ~current.indexOf(v)).length + 1;
            let leftUp = computeValue(x - 1, y - 1);
            let rightDown = computeValue(targetX + 1, targetY + 1);
            if (leftUp >= min) {
              if (~current.indexOf(leftUp)) {
                value += 10;
              } else if (!~havenBoardStatus.indexOf(leftUp)) {
                value += 1;
              }
            }
            if (rightDown <= max) {
              if (~current.indexOf(rightDown)) {
                value += 10;
              } else if (!~havenBoardStatus.indexOf(rightDown)) {
                value += 1;
              }
            }
            maxValue = Math.max(maxValue, value * rounds);
          }
        }
        iIndex = iIndex - 1;
      }
      iIndex = num;
      while (iIndex) {
        targetX = Math.max(0, x - num + 1 + iIndex);
        targetY = Math.max(0, y - num + 1 + iIndex);
        target = computeValue(targetX, targetY);
        if (target === s || (target >= min && target <= max && ~current.indexOf(target))) {
          iPosition = num - 2;
          iFlag = true;
          while (iPosition > 0 && iFlag) {
            iFlag = target === s || ~current.indexOf(computeValue(targetX + iPosition, targetY + iPosition));
            iPosition = iPosition - 1;
          }
          if (iFlag) {
            value = 0;
            rounds =
              stepRound(target)
                .map(([x, y]) => computeValue(x, y))
                .filter(v => ~current.indexOf(v)).length + 1;
            let leftUp = computeValue(targetX - 1, targetY - 1);
            let rightDown = computeValue(x + 1, y + 1);
            if (leftUp >= min) {
              if (~current.indexOf(leftUp)) {
                value += 10;
              } else if (!~havenBoardStatus.indexOf(leftUp)) {
                value += 1;
              }
            }
            if (rightDown <= max) {
              if (~current.indexOf(rightDown)) {
                value += 10;
              } else if (!~havenBoardStatus.indexOf(rightDown)) {
                value += 1;
              }
            }
            maxValue = Math.max(maxValue, value * rounds);
          }
        }
        iIndex = iIndex - 1;
      }

      store.set(s, maxValue);
    }
    let r = Array.from(store).filter(([k, s]) => s > 0);
    if (r.length) {
      return r.sort((a, b) => a[1] < b[1])[0][0];
    }
    return null;
  }

  /* 判断是否胜利，结束 */
  function isWinOver(who, step, num, canWinOver = false) {
    let havenBoardStatus = [...Bot.pieces, ...Human.pieces];
    let size = boardStatus.gridUnitCount;
    let current = who === Human.id ? Human : Bot;
    if (!canWinOver && current.pieces.length < num - 1) {
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
          .filter(
            v =>
              v === step ||
              (v >= min && v <= max && (~current.pieces.indexOf(v) || (canWinOver && !~havenBoardStatus.indexOf(v))))
          );
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
          .filter(
            v =>
              v === step ||
              (v >= min && v <= max && (~current.pieces.indexOf(v) || (canWinOver && !~havenBoardStatus.indexOf(v))))
          );
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
          .filter(
            v =>
              v === step ||
              (v >= min && v <= max && (~current.pieces.indexOf(v) || (canWinOver && !~havenBoardStatus.indexOf(v))))
          );
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
          .filter(
            v =>
              v === step ||
              (v >= min && v <= max && (~current.pieces.indexOf(v) || (canWinOver && !~havenBoardStatus.indexOf(v))))
          );
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
    let value;
    return [
      [x - 1, y - 1],
      [x, y - 1],
      [x + 1, y - 1],
      [x - 1, y],
      [x + 1, y],
      [x - 1, y + 1],
      [x, y + 1],
      [x + 1, y + 1]
    ].filter(function([x, y]) {
      value = computeValue(x, y);
      return value >= min && value <= max;
    });
  }

  /* 获取所有可以走且可能获得胜利的棋 */
  function getCanWinStep(who) {
    let current = who === Human.id ? Human.pieces : Bot.pieces;
    let havenBoardStatus = [...Human.pieces, ...Bot.pieces];
    if (!current.length) {
      return [...boardStatus.gridBoard].filter(v => !~havenBoardStatus.indexOf(v));
    }
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
