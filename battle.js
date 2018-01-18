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
      if (Bot.pieces.length === boardStatus.gridBoard.length / 2) {
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
    //计算可走的棋子
    botCanFour = botCanFour.map(v => canWinOver(botId, v, 4)).filter(v => !!v);
    botCanThree = botCanThree.map(v => canWinOver(botId, v, 3)).filter(v => !!v);
    botCanTow = botCanTow.map(v => canWinOver(botId, v, 2)).filter(v => !!v);
    humanCanFour = humanCanFour.map(v => canWinOver(humanId, v, 4)).filter(v => !!v);
    humanCanThree = humanCanThree.map(v => canWinOver(humanId, v, 3)).filter(v => !!v);
    humanCanTow = humanCanTow.map(v => canWinOver(humanId, v, 2)).filter(v => !!v);
    //计算可走棋子的权重
    botCanFour = computeWeight(botCanFour, 4, botId);
    botCanThree = computeWeight(botCanThree, 3, botId);
    botCanTow = computeWeight(botCanTow, 2, botId);
    humanCanFour = computeWeight(humanCanFour, 4, humanId);
    humanCanThree = computeWeight(humanCanThree, 3, humanId);
    humanCanTow = computeWeight(humanCanTow, 2, humanId);

    //自己能成四，则成四
    if (botCanFour.length) {
      //成多个四
      let best = botCanFour.reduce((s, v) => {
        let vl = v.win.length;
        let sl = s.win.length;
        if (vl > sl) {
          return v;
        } else if (vl === sl && v.right >= s.right) {
          return v;
        } else {
          return s;
        }
      });
      if (best && best.win.length > 1) {
        return best.current;
      }
      //成四阻四
      if (humanCanFour.length) {
        best = botCanFour.reduce(
          (s, v) => {
            let inHuman = humanCanFour.filter(hv => hv.current === v.current);
            if (inHuman.length && v.right >= s.right) {
              return v;
            }
            return s;
          },
          { right: -1, win: [] }
        );
      }
      if (best && best.win.length) {
        return best.current;
      }
      //成四成三
      if (botCanThree.length) {
        best = botCanFour.reduce(
          (s, v) => {
            let inBot = botCanThree.filter(hv => hv.current === v.current);
            if (inBot.length && v.right >= s.right) {
              return v;
            }
            return s;
          },
          { right: -1, win: [] }
        );
      }
      if (best && best.win.length) {
        return best.current;
      }
      //成四阻三
      if (humanCanThree.length) {
        best = botCanFour.reduce(
          (s, v) => {
            let inHuman = humanCanThree.filter(hv => hv.current === v.current);
            if (inHuman.length && v.right >= s.right) {
              return v;
            }
            return s;
          },
          { right: -1, win: [] }
        );
      }
      if (best && best.win.length) {
        return best.current;
      }
      //成四
      best = botCanFour.reduce((s, v) => {
        return v.right >= s.right ? v : s;
      });
      if (best && best.right > 1 && best.win.length) {
        return best.current;
      }
    }
    //阻止人类成四
    if (humanCanFour.length) {
      //成四成四
      let best = humanCanFour.reduce((s, v) => {
        let vl = v.win.length;
        let sl = s.win.length;
        if (vl > sl) {
          return v;
        } else if (vl === sl && v.right >= s.right) {
          return v;
        } else {
          return s;
        }
      });
      if (best && best.win.length > 1) {
        return best.current;
      }
      //成四成三
      if (humanCanThree.length) {
        best = humanCanFour.reduce(
          (s, v) => {
            let inHuman = humanCanThree.filter(hv => hv.current === v.current);
            if (inHuman.length && v.right >= s.right) {
              return v;
            }
            return s;
          },
          { right: -1, win: [] }
        );
        if (best && best.win.length) {
          return best.current;
        }
      }
      //成四成二
      if (humanCanTow.length) {
        best = humanCanFour.reduce(
          (s, v) => {
            let inHuman = humanCanTow.filter(hv => hv.current === v.current);
            if (inHuman.length && v.right >= s.right) {
              return v;
            }
            return s;
          },
          { right: -1, win: [] }
        );
        if (best && best.win.length) {
          return best.current;
        }
      }
      //成四
      best = humanCanFour.reduce((s, v) => {
        return v.right >= s.right ? v : s;
      });
      if (best && best.win.length) {
        return best.current;
      }
    }
    //自己能成三，则成三
    if (botCanThree.length) {
      //成多个三
      let best = botCanThree.reduce((s, v) => {
        let vl = v.win.length;
        let sl = s.win.length;
        if (vl > sl) {
          return v;
        } else if (vl === sl && v.right >= s.right) {
          return v;
        } else {
          return s;
        }
      });
      if (best && best.win.length > 1) {
        return best.current;
      }
      //成三阻三
      if (humanCanThree.length) {
        best = botCanThree.reduce(
          (s, v) => {
            let inHuman = humanCanThree.filter(hv => hv.current === v.current);
            if (inHuman.length && v.right >= s.right) {
              return v;
            }
            return s;
          },
          { right: -1, win: [] }
        );
      }
      if (best && best.win.length) {
        return best.current;
      }
      //成四
      if (botCanFour.length) {
        best = botCanFour.reduce((s, v) => {
          return v.right >= s.right ? v : s;
        });
        if (best && best.win.length) {
          return best.current;
        }
      }
      //成三
      best = botCanThree.reduce((s, v) => {
        return v.right >= s.right ? v : s;
      });
      if (best && best.right > 1 && best.win.length) {
        return best.current;
      }
    }
    //阻止人类成三
    if (humanCanThree.length) {
      //成多个三
      let best = humanCanThree.reduce((s, v) => {
        let vl = v.win.length;
        let sl = s.win.length;
        if (vl > sl) {
          return v;
        } else if (vl === sl && v.right >= s.right) {
          return v;
        } else {
          return s;
        }
      });
      if (best && best.win.length > 1) {
        return best.current;
      }
      //成三
      best = humanCanThree.reduce((s, v) => {
        return v.right >= s.right ? v : s;
      });
      if (best && best.right > 1 && best.win.length) {
        return best.current;
      }
      //成三
      if (botCanThree.length) {
        best = botCanThree.reduce((s, v) => {
          return v.right >= s.right ? v : s;
        });
        if (best && best.win.length) {
          return best.current;
        }
      }
      //成三
      best = humanCanThree.reduce((s, v) => {
        return v.right >= s.right ? v : s;
      });
      if (best && best.win.length) {
        return best.current;
      }
    }
    //自己能成二，则成二
    if (botCanTow.length) {
      //成多个二
      let best = botCanTow.reduce((s, v) => {
        let vl = v.win.length;
        let sl = s.win.length;
        if (vl > sl) {
          return v;
        } else if (vl === sl && v.right >= s.right) {
          return v;
        } else {
          return s;
        }
      });
      if (best && best.win.length > 1) {
        return best.current;
      }
      //成二阻二
      if (humanCanTow.length) {
        best = botCanTow.reduce(
          (s, v) => {
            let inHuman = humanCanTow.filter(hv => hv.current === v.current);
            if (inHuman.length && v.right >= s.right) {
              return v;
            }
            return s;
          },
          { right: -1, win: [] }
        );
      }
      if (best && best.win.length) {
        return best.current;
      }
      //成二
      best = humanCanTow.reduce((s, v) => {
        return v.right >= s.right ? v : s;
      });
      if (best && best.win.length) {
        return best.current;
      }
    }
    //阻止人类成二
    if (humanCanTow.length) {
      //成多个二
      let best = humanCanTow.reduce((s, v) => {
        let vl = v.win.length;
        let sl = s.win.length;
        if (vl > sl) {
          return v;
        } else if (vl === sl && v.right >= s.right) {
          return v;
        } else {
          return s;
        }
      });
      if (best && best.win.length > 1) {
        return best.current;
      }
      //成二
      best = humanCanTow.reduce((s, v) => {
        return v.right >= s.right ? v : s;
      });
      if (best && best.win.length) {
        return best.current;
      }
    }
    //否则，随机走一步可以走的棋子
    return botCanSteps[getRandom(0, botCanSteps.length - 1)];
  }

  /* 判断是否胜利，结束 */
  function isWinOver(who, step, num) {
    let havenBoardStatus = [...Bot.pieces, ...Human.pieces];
    let size = boardStatus.gridUnitCount;
    let current = who === Human.id ? Human : Bot;
    if (current.pieces.length < num - 1) {
      return false;
    }
    let [currentX, currentY] = computeXY(step);
    //水平方向
    for (let i = 0; i < num; i++) {
      let x = currentX - i;
      let y = currentY;
      let [min, max] = minMaxHorizontal(x, y);
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
      let [min, max] = minMaxVertical(x, y);
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
      let [min, max] = minMax45Degree(x, y);
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
      let [min, max] = minMax135degree(x, y);
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

  /* 该子能否为以后提供胜利的基础 */
  function canWinOver(who, step, num) {
    let size = boardStatus.gridUnitCount;
    let [currentX, currentY] = computeXY(step);
    let result = [];
    //水平方向
    for (let i = 0; i < 5; i++) {
      let x = currentX - i;
      let y = currentY;
      let [min, max] = minMaxHorizontal(x, y);
      if (x >= 0) {
        let hSteps = [0, 1, 2, 3, 4].map(v => computeValue(x + v, y));
        hSteps = ifCanWinOver(hSteps, step, min, max, num, who);
        if (hSteps.length === 5) {
          //胜利
          hSteps = computeLine(hSteps, step, who);
          let hsMinX = 0;
          let hsMaxX = 0;
          if (hSteps.length) {
            hsMinX = computeXY(hSteps[0])[0];
            hsMaxX = computeXY(hSteps[hSteps.length - 1])[0];
          }
          if (Math.abs(hsMaxX - hsMinX) < num) {
            result.push({ direction: '水平方向', steps: hSteps });
          }
        }
      }
    }
    //垂直方向
    for (let i = 0; i < 5; i++) {
      let x = currentX;
      let y = currentY - i;
      let [min, max] = minMaxVertical(x, y);
      if (y >= 0) {
        let hSteps = [0, 1, 2, 3, 4].map(v => computeValue(x, y + v));
        hSteps = ifCanWinOver(hSteps, step, min, max, num, who);
        if (hSteps.length === 5) {
          //胜利
          hSteps = computeLine(hSteps, step, who);
          let hsMinY = 0;
          let hsMaxY = 0;
          if (hSteps.length) {
            hsMinY = computeXY(hSteps[0])[1];
            hsMaxY = computeXY(hSteps[hSteps.length - 1])[1];
          }
          if (Math.abs(hsMaxY - hsMinY) < num) {
            result.push({ direction: '垂直方向', steps: hSteps });
          }
        }
      }
    }
    //45度方向
    for (let i = 0; i < 5; i++) {
      let x = currentX + i;
      let y = currentY - i;
      let [min, max] = minMax45Degree(x, y);
      if (y >= 0 && x <= size - 1) {
        let hSteps = [0, 1, 2, 3, 4].map(v => computeValue(x - v, y + v));
        hSteps = ifCanWinOver(hSteps, step, min, max, num, who);
        if (hSteps.length === 5) {
          //胜利
          hSteps = computeLine(hSteps, step, who);
          let hsMinY = 0;
          let hsMaxY = 0;
          if (hSteps.length) {
            hsMinY = computeXY(hSteps[0])[1];
            hsMaxY = computeXY(hSteps[hSteps.length - 1])[1];
          }
          if (Math.abs(hsMaxY - hsMinY) < num) {
            result.push({ direction: '45度方向', steps: hSteps });
          }
        }
      }
    }
    //135度方向
    for (let i = 0; i < 5; i++) {
      let x = currentX - i;
      let y = currentY - i;
      let [min, max] = minMax135degree(x, y);
      if (y >= 0 && x >= 0) {
        let hSteps = [0, 1, 2, 3, 4].map(v => computeValue(x + v, y + v));
        hSteps = ifCanWinOver(hSteps, step, min, max, num, who);
        if (hSteps.length === 5) {
          //胜利
          hSteps = computeLine(hSteps, step, who);
          let hsMinY = 0;
          let hsMaxY = 0;
          if (hSteps.length) {
            hsMinY = computeXY(hSteps[0])[1];
            hsMaxY = computeXY(hSteps[hSteps.length - 1])[1];
          }
          if (Math.abs(hsMaxY - hsMinY) < num) {
            result.push({ direction: '135度方向', steps: hSteps });
          }
        }
      }
    }
    return result.length
      ? { current: step, win: deduplicate(result, (s, v) => !arrayInArray(s.map(v => v.steps), v.steps)) }
      : null;
  }

  /* 判断该子能否为以后提供胜利的基础 */
  function ifCanWinOver(steps, step, min, max, num, who) {
    let current = who === Human.id ? Human : Bot;
    let others = who === Human.id ? Bot : Human;
    let includes = 0;
    steps = steps.filter((v, i) => {
      if (v === step) {
        includes += 1;
        return true;
      }
      let r = v >= min && v <= max;
      r = r && (~current.pieces.indexOf(v) || !~others.pieces.indexOf(v));
      if (~current.pieces.indexOf(v)) {
        includes += 1;
      }
      return r;
    });
    return includes === num ? steps : [];
  }

  /* 计算连线 */
  function computeLine(steps, step, who) {
    let current = who === Human.id ? Human.pieces : Bot.pieces;
    return steps.filter(v => v === step || ~current.indexOf(v));
  }

  /* 计算权重 */
  function computeWeight(steps, num, who) {
    let havenBoardStatus = [...Bot.pieces, ...Human.pieces];
    let currents = who === Human.id ? Human.pieces : Bot.pieces;
    let winLen, winSteps, winMin, winMax, winDir, winWeight, lineMin, lineMax, outerMin, outerMax;
    return steps.map(step => {
      currentStep = step.current;
      let right = step.win.reduce((s, w) => {
        winWeight = 0;
        winDir = w.direction;
        winSteps = w.steps;
        winLen = winSteps.length;
        winMin = winSteps[0];
        winMax = winSteps[winLen - 1];
        let [minX, minY] = computeXY(winMin);
        let [maxX, maxY] = computeXY(winMax);
        if (winDir === '水平方向') {
          [lineMin, lineMax] = minMaxHorizontal(minX, maxY);
          outerMin = computeValue(minX - 1, minY);
          outerMax = computeValue(maxX + 1, maxY);
        } else if (winDir === '垂直方向') {
          [lineMin, lineMax] = minMaxVertical(minX, minY);
          outerMin = computeValue(minX, minY - 1);
          outerMax = computeValue(maxX, maxY + 1);
        } else if (winDir === '45度方向') {
          [lineMin, lineMax] = minMax45Degree(minX, minY);
          outerMin = computeValue(minX + 1, minY - 1);
          outerMax = computeValue(maxX - 1, maxY + 1);
        } else if (winDir === '135度方向') {
          [lineMin, lineMax] = minMax135degree(minX, minY);
          outerMin = computeValue(minX - 1, minY - 1);
          outerMax = computeValue(maxX + 1, maxY + 1);
        }
        if (outerMin >= lineMin && outerMin <= lineMax) {
          if (~currents.indexOf(outerMin)) {
            winWeight += 10;
          } else if (!~havenBoardStatus.indexOf(outerMin)) {
            winWeight += 1;
          }
        }
        if (outerMax >= lineMin && outerMax <= lineMax) {
          if (~currents.indexOf(outerMax)) {
            winWeight += 10;
          } else if (!~havenBoardStatus.indexOf(outerMax)) {
            winWeight += 1;
          }
        }
        return s + winWeight;
      }, 0);
      step['right'] = right;
      return step;
    });
  }

  /* 当前坐标的水平方向的最大最小值 */
  function minMaxHorizontal(x, y) {
    let size = boardStatus.gridUnitCount;
    let min = computeValue(0, y);
    let max = computeValue(size - 1, y);
    return [min, max];
  }

  /* 当前坐标的垂直方向的最大最小值 */
  function minMaxVertical(x, y) {
    let size = boardStatus.gridUnitCount;
    let min = computeValue(x, 0);
    let max = computeValue(x, size - 1);
    return [min, max];
  }

  /* 当前坐标的45度方向最大最小值 */
  function minMax45Degree(x, y) {
    let size = boardStatus.gridUnitCount;
    let minX = Math.min(size - 1, x + y);
    let minY = Math.max(0, y - (minX - x));
    let min = computeValue(minX, minY);
    let maxY = Math.min(size - 1, x + y);
    let maxX = Math.max(0, x - (maxY - y));
    let max = computeValue(maxX, maxY);
    return [min, max];
  }

  /* 当前坐标的135度方向最大最小值 */
  function minMax135degree(x, y) {
    let size = boardStatus.gridUnitCount;
    let minX = Math.max(0, x - y);
    let minY = Math.max(0, y - (x - minX));
    let min = computeValue(minX, minY);
    let maxX = Math.min(size - 1, x + size - y);
    let maxY = Math.min(size - 1, y + (maxX - x));
    let max = computeValue(maxX, maxY);
    return [min, max];
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
        .filter(v => !~havenBoardStatus.indexOf(v)),
      (s, v) => !~s.indexOf(v)
    );
  }

  /* 数组去重 */
  function deduplicate(d, fn) {
    return d.reduce((s, v) => {
      return fn(s, v) ? [...s, v] : s;
    }, []);
    // return Array.from(new Set(d));
  }

  /* 判断数组是否包含数组 */
  function arrayInArray(s, d) {
    return s.filter(sv => {
      let r = sv.length === d.length;
      r = r && d.reduce((s, v) => s && ~sv.indexOf(v), true);
      return r;
    }).length;
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
