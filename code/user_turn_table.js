// 幸运转盘功能实现
var TURNTABLE = {
  type: '1',
  list: [],
  prizes:[],
  isTurntable: false,
  currentIndex: 1,
  targetSortIndex: -1,
  res:null
};

// 根据prize的sort值排列奖品，与图示顺序一致
// 图示顺序：
// 第一行：1, 2, 3
// 第二行：8, 抽奖按钮, 4
// 第三行：7, 6, 5
var sortToPosition = {
  1: { row: 1, col: 1 },
  2: { row: 1, col: 2 },
  3: { row: 1, col: 3 },
  4: { row: 2, col: 3 },
  5: { row: 3, col: 3 },
  6: { row: 3, col: 2 },
  7: { row: 3, col: 1 },
  8: { row: 2, col: 1 }
}

// 初始化幸运转盘
function initTurntable() {
  toggleTurntable('1');
}

// 切换转盘类型
function toggleTurntable(type) {
  if (TURNTABLE.isTurntable) return;
  TURNTABLE.type = type;
  
  // 更新标签样式
  $('.turntable-top-item').removeClass('is-active');
  $('.turntable-top-item').eq(type === '1' ? 0 : 1).addClass('is-active');
  
  getTurntableScrollList();
  getTurntableData();
}

// 获取转盘滚动列表
function getTurntableScrollList() {
  TURNTABLE.list = [];
  var fsText = TURNTABLE.type === '1' ? '金币抽奖' : '实物抽奖';
  
  // 调用接口获取数据
  $.ajax({
    url: hzRequestUrl + 'user/all_coin_info_list_no',
    type: 'GET',
    data: { fs: fsText },
    dataType: 'json',
    headers: {
      boxVersion: '1.0.0',
      token: $.cookie('hzusertoken')
    },
    success: function(res) {
      if (res.code === 200) {
        TURNTABLE.list = res.data
          .map((v) => {
            let text = '金币';
            if (v.fs === '金币抽奖' && v.title) {
              v.coin_num = v.title.slice(1).split('倍')[0] * 30 + text; // 30是每次消耗的金币数
              text = '';
            }
            v.text = text;
            return v;
          })
          .filter((v) => v.coin_num > 0 || v.fs === '实物抽奖');
        
        // 渲染滚动列表
        renderTurntableScrollList();
      }
    },
    error: function() {
      
    }
  });
}

// 渲染转盘滚动列表
function renderTurntableScrollList() {
  var list = TURNTABLE.list;
  var html = '';
  
  if (list.length > 0) {
    list.forEach(item => {
      html += `
        <li>
          <p>
            <span class="w-1/5">恭喜</span>
            <span class="w-2/5 color-red truncate">${item.nickname}</span>
            <span class="w-1/5">抽中</span>
            <span class="w-2/5 color-red">
              <text>${item.coin_num} </text>${item.text}
            </span>
          </p>
        </li>
      `;
    });
    
    // 循环滚动效果
    if (list.length > 10) {
      list.slice(0, 10).forEach(item => {
        html += `
          <li>
            <p>
              <span class="w-1/5">恭喜</span>
              <span class="w-2/5 color-red truncate">${item.nickname}</span>
              <span class="w-1/5">抽中</span>
              <span class="w-2/5 color-red">
                <text>${item.coin_num} </text>${item.text}
              </span>
            </p>
          </li>
        `;
      });
    }
  }
  
  $('#turntableScrollList').html(`<ul>${html}</ul>`);
  
  // 设置滚动动画
  var duration = list.length * 1 + 's';
  var height = `-${list.length * 48}px`;
  document.documentElement.style.setProperty('--turntable-duration', duration);
  document.documentElement.style.setProperty('--turntable-height', height);
}

// 获取转盘数据
function getTurntableData() {
  var url = TURNTABLE.type === '1' ? hzRequestUrl + 'business/luckyCoinSetup' : hzRequestUrl + 'business/luckyPrizeSetup';
  
  $.ajax({
    url: url,
    type: 'GET',
    dataType: 'json',
    headers: {
      boxVersion: '1.0.0',
      token: $.cookie('hzusertoken')
    },
    success: function(res) {
      if (res.code === 200) {
        renderTurntable(res.data);
        TURNTABLE.prizes = res.data.prizes;
      }
    },
    error: function() {
    }
  });
}

// 渲染转盘
function renderTurntable(data) {
  var canvas = document.getElementById('luckyCanvas');
  canvas.innerHTML = '';
  
  // 创建转盘容器
  var turntableContainer = document.createElement('div');
  turntableContainer.className = 'lucky-grid';
  
  // 创建背景
  var block = document.createElement('div');
  block.className = 'lucky-block';
  block.style.backgroundImage = `url(${data.blocksBackgroundImage})`;
  block.style.width = '501px';
  block.style.height = '445px';
  block.style.backgroundSize = '100% 100%';
  turntableContainer.appendChild(block);
  
  // 创建奖品区域
  var prizesContainer = document.createElement('div');
  prizesContainer.className = 'lucky-prizes';
  
  data.prizes.forEach((prize) => {
    var sort = parseInt(prize.sort);
    var position = sortToPosition[sort];
    if (position) {
      var prizeItem = document.createElement('div');
      prizeItem.className = 'lucky-prize';
      prizeItem.setAttribute('data-sort', sort);
      prizeItem.style.gridColumn = position.col;
      prizeItem.style.gridRow = position.row;
      prizeItem.innerHTML = `
        <div class="prize-img">
          <img src="${prize.imgUrl}" alt="${prize.text}">
        </div>
        <div class="prize-text">${prize.text !== '谢谢惠顾' ? prize.text : ''}</div>
      `;
      prizesContainer.appendChild(prizeItem);
    }
  });
  
  turntableContainer.appendChild(prizesContainer);
  
  // 创建按钮
  var button = document.createElement('div');
  button.className = 'lucky-button';
  button.innerHTML = `
    <div class="button-img">
      <img src="${data.buttonsBackgroundImage}" alt="抽奖">
    </div>
    <div class="button-text">${operationData.luckCoinConsume}金币/次</div>
  `;
  button.onclick = onStart;
  turntableContainer.appendChild(button);
  
  canvas.appendChild(turntableContainer);
}

// 开始抽奖
function onStart() {
  if (TURNTABLE.isTurntable) return;
  
  if (hzUserObj == null || operationData == null)
    return;
  
  if (hzUserObj.coin_num < operationData.luckCoinConsume) {
    layer.msg('金币不够了，快去赚取金币吧', { icon: 0 });
    return;
  }
  
  TURNTABLE.isTurntable = true;
  TURNTABLE.targetSortIndex = -1;

  // 开始黄色边框动画
  startBorderAnimation();
  
  // 调用抽奖接口
  var open_id = hzUserObj.open_id; // 假设用户的open_id
  var type = TURNTABLE.type;
  
  $.ajax({
    url: hzRequestUrl + 'user/startLucky',
    type: 'POST',
    data: { open_id: open_id, type: type },
    dataType: 'json',
    headers: {
      boxVersion: '1.0.0',
      token: $.cookie('hzusertoken')
    },
    success: function(res) {
      if (res.code === 200) {
        // 等待动画结束后处理结果
        setTimeout(() => {
          TURNTABLE.targetSortIndex = res.prize;
          TURNTABLE.res = res;
        }, 2000); // 等待动画结束
      } else {
        // 停止边框动画
        stopBorderAnimation();
        layer.msg('抽奖失败，请联系管理员', { icon: 5 });
        TURNTABLE.isTurntable = false;
      }
    },
    error: function() {
      // 停止边框动画
      stopBorderAnimation();
      layer.msg('网络错误，抽奖失败', { icon: 5 });
      TURNTABLE.isTurntable = false;
    }
  });
}

// 处理抽奖结果
function onEnd() {
  var res = TURNTABLE.res;
  if (res.data) {
    if (res.data.is_sw === 1) {
      var prize = TURNTABLE.prizes.find((v) => v.sort === res.prize);
      layer.msg(`恭喜获得${prize.title}，去个人中心查看订单信息！`);
    } else {
      layer.msg(`恭喜获得${res.data.coin_num}金币！`, { icon: 1 });
    }
  } else {
    layer.msg('手气不好，再试一次吧！', { icon: 0 });
  }
  TURNTABLE.isTurntable = false;
  getTurntableScrollList();
}

// 开始黄色边框动画
function startBorderAnimation() {
  var prizes = document.querySelectorAll('.lucky-prize');
  var currentSpeed = 100; // 初始速度
  var isSlowingDown = false; // 是否开始减速
  var slowdownSteps = 0; // 减速步骤
  
  // 清除之前的定时器
  if (TURNTABLE.borderAnimation) {
    clearInterval(TURNTABLE.borderAnimation);
    TURNTABLE.borderAnimation = null;
  }
  
  // 动画函数
  function animate() {
    // 清除当前边框
    prizes.forEach(prize => {
      prize.style.border = 'none';
    });
    console.log("currentSpeed is ", currentSpeed);
    
    // 为当前元素添加边框
    var currentSort = TURNTABLE.currentIndex;
    var currentPrize = document.querySelector(`.lucky-prize[data-sort="${currentSort}"]`);
    if (currentPrize) {
      currentPrize.style.border = '2px solid #FFD700';
      currentPrize.style.borderRadius = '10px';
    }

    // 检查是否需要减速
    if (TURNTABLE.targetSortIndex !== -1) {
      
      // 如果距离小于等于maxSlowdownSteps，开始减速
      if (!isSlowingDown) {
        isSlowingDown = true;
        slowdownSteps = 0;
      }
      
      // 减速处理
      if (isSlowingDown) {
        slowdownSteps++;
        currentSpeed = 100 + (slowdownSteps * 150); // 每步增加150ms，使最后几步更慢
        
        // 如果到达目标位置，停止动画
        if (currentSort === TURNTABLE.targetSortIndex) {
          console.log("到达目标位置", currentSort, TURNTABLE.targetSortIndex);
          stopBorderAnimation();
          onEnd();
          return;
        }
      }
    }
    
    // 移动到下一个元素
    TURNTABLE.currentIndex = TURNTABLE.currentIndex + 1;
    if (TURNTABLE.currentIndex > 8) {
      TURNTABLE.currentIndex = 1;
    }
    
    // 继续动画
    TURNTABLE.borderAnimation = setTimeout(animate, currentSpeed);
  }
  
  // 开始动画
  animate();
}

// 停止黄色边框动画到sortIndex对应的地方
function stopBorderAnimation() {
  if (TURNTABLE.borderAnimation) {
    clearTimeout(TURNTABLE.borderAnimation);
    TURNTABLE.borderAnimation = null;
  }
}

// 打开中奖记录弹窗
function openTurntableRecordsModal() {
  layer.open({
    type: 1,
    title: TURNTABLE.type === '1' ? '金币抽奖中奖记录' : '实物抽奖中奖记录',
    area: ['800px', '600px'],
    shade: 0.3,
    content: $('#turntableRecordsModal'),
    success: function () {
      layui.table.render({
        elem: '#turntableRecordsContent',
        id: 'turntableRecordsContent',
        url: hzRequestUrl + 'user/user_coin_info_list_no?fs=' + (TURNTABLE.type === '1' ? '金币抽奖' : '实物抽奖') + '&open_id=' + hzUserObj.open_id,
        method: 'get',
        headers: { boxVersion: '1.0.0', token:$.cookie('hzusertoken') },
        myPageName: 'pageNum',
        myLimitName: 'pageSize',
        page: true,          // 先不分页，滚动看
        limit: 10,
        parseData: function(res) {
          return {
            "code": 0,
            "msg": "",
            "count": res.count ? res.count : 0,
            "data": res.data ? res.data : []
          };
        },
        cols: [[
          // 显示序号
          { field: 'fs', title: '奖品名称', minwidth: 80, align: 'center' },
          { field: 'coin_num',  title: '价值', minwidth: 80, align: 'center' },
          { field: 'status', title: '状态', minwidth: 80, align: 'center', templet: function(){ return '已发放'; } },
          { field: 'updata_time',   title: '中奖时间',  minwidth: 140 }
        ]]
      });
    }
  });
}
