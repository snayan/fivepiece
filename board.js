/* 五子棋界面 */

(function(w, d, undefined) {
  //棋盘单元格默认值
  let gridUnitCount = 10;
  //单元格默认大小
  let gridUnitWidth = 50;
  //棋盘
  let gridBoard = [];
  //容器
  let el = d.querySelector('#goBang');
  //棋盘单元格
  let unitClass = 'board_unit';
  //悔棋按钮
  let returnClass = 'btn_return';
  //撤销悔棋按钮
  let cancelReturnClass = 'btn_cancelReturn';
  //重新开始
  let winRestart = 'win_btn';

  /* 创建棋盘 */
  function createBoard() {
    gridBoard = [];
    let board = '';
    let value = 0;
    let elWidth, vUnit;
    if (el) {
      elWidth = el.getBoundingClientRect().width;
      vUnit = Math.floor(elWidth / gridUnitWidth);
      gridUnitCount = Math.max(gridUnitCount, vUnit);
      gridUnitWidth = elWidth / gridUnitCount;
      for (let i = 0; i < gridUnitCount; i++) {
        for (let j = 0; j < gridUnitCount; j++) {
          gridBoard.push(value);
          board += createUnit(value, j, i);
          value = value + 1;
        }
      }
      board = '<ul class="board">' + board + '</ul>';
    } else {
      board = '<p>初始化游戏失败！</p>';
    }
    el.innerHTML = board;
    return {
      gridUnitCount: gridUnitCount,
      gridUnitWidth: gridUnitWidth,
      gridBoard: gridBoard
    };
  }

  /* 创建棋盘单元格 */
  function createUnit(v, x, y) {
    let boundary = '';
    let boundaryStyle = '';
    if (x === 0) {
      boundary = '<i class="board_boundary left"></i>';
    } else if (x === gridUnitCount - 1) {
      boundary = '<i class="board_boundary right"></i>';
    }
    if (y === 0) {
      boundary += '<i class="board_boundary top"></i>';
    } else if (y === gridUnitCount - 1) {
      boundary += '<i class="board_boundary bottom"></i>';
    }
    return (
      '<li class="' +
      unitClass +
      '" style="height:' +
      gridUnitWidth +
      'px;width:' +
      gridUnitWidth +
      'px;" data-value=' +
      v +
      '><span></span>' +
      boundary +
      '</li>'
    );
  }

  /* 创建一个棋子 */
  function createPiece(el, who) {
    //who:0表示白棋，1表示黑棋
    if (typeof el === 'number') {
      el = d.querySelector('.' + unitClass + '[data-value="' + el + '"]');
    }
    let piece = el && el.querySelector('span');
    if (piece) {
      piece.style.background = who === 1 ? '#000000' : '#ffffff';
      piece.style.display = 'block';
    }
  }

  /* 销毁一个棋子 */
  function cancelLastStep(el, who) {
    //who:0表示白棋，1表示黑棋
    if (typeof el === 'number') {
      el = d.querySelector('.' + unitClass + '[data-value="' + el + '"]');
    }
    let piece = el && el.querySelector('span');
    if (piece) {
      piece.style.background = 'none';
      piece.style.display = 'none';
    }
  }

  /* 获取棋子的值 */
  function getStepValue(el) {
    return +el.getAttribute('data-value');
  }

  /* 胜利，结束 */
  function winOver(who) {
    //who:0表示白棋，1表示黑棋
    let winner = document.createElement('p');
    winner.textContent = (who === 0 ? '恭喜你，获胜！' : '哈哈，愚蠢的你，输了！') + '';
    winner.className = 'win_txt';
    let reStart = document.createElement('button');
    reStart.textContent = '重新开始';
    reStart.className = 'win_btn';
    let winEl = document.createElement('div');
    winEl.className = 'win';
    winEl.appendChild(winner);
    winEl.appendChild(reStart);
    if (el) {
      el.appendChild(winEl);
    }
    //悔棋按钮
    var returnBtn = d.querySelector('.' + returnClass);
    //撤销悔棋按钮
    var cancelReturnBtn = d.querySelector('.' + cancelReturnClass);
    if (returnBtn) {
      returnBtn.classList.add('disabled');
    }
    if (cancelReturnBtn) {
      cancelReturnBtn.classList.add('disabled');
    }
  }

  /* 平局 */
  function drawOver() {
    //who:0表示白棋，1表示黑棋
    let draw = document.createElement('p');
    draw.textContent = '平局！';
    draw.className = 'win_txt';
    let reStart = document.createElement('button');
    reStart.textContent = '重新开始';
    reStart.className = 'win_btn';
    let winEl = document.createElement('div');
    winEl.className = 'win';
    winEl.appendChild(draw);
    winEl.appendChild(reStart);
    if (el) {
      el.appendChild(winEl);
    }
    //悔棋按钮
    var returnBtn = d.querySelector('.' + returnClass);
    //撤销悔棋按钮
    var cancelReturnBtn = d.querySelector('.' + cancelReturnClass);
    if (returnBtn) {
      returnBtn.classList.add('disabled');
    }
    if (cancelReturnBtn) {
      cancelReturnBtn.classList.add('disabled');
    }
  }

  //挂到命名空间下
  if (typeof w.GO === 'undefined') {
    w.GO = {};
  }
  w.GO.View = {
    createBoard: createBoard,
    createPiece: createPiece,
    cancelLastStep: cancelLastStep,
    getStepValue: getStepValue,
    winOver: winOver,
    drawOver: drawOver,
    unitClass: unitClass,
    returnClass: returnClass,
    cancelReturnClass: cancelReturnClass,
    winRestart: winRestart
  };
})(window, document);
