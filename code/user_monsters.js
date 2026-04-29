/**
 * 金币打怪功能模块
 * 包含打怪配置、怪物列表、抽奖等功能
 */

// ====== 金币打怪功能 ======
var killConfig = {};
var monsters = [];

// 背包物品完整数据数组
var bagItemsData = [];
// 选中物品数组
var selectedItemsArray = [];
var latestKillBagPayload = null;
var pendingKillBagPayload = null;
var currentKillDrawRequest = null;
var isKillRewardVisible = false;
var spinMinPendingDuration = 900;

function generateKillDrawRequestId() {
  return 'kill_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
}

function shouldDelayKillBagUpdate() {
  return !!currentKillDrawRequest || !!isKillRewardVisible;
}

function flushPendingKillBagPayload() {
  if (shouldDelayKillBagUpdate() || !pendingKillBagPayload) {
    return false;
  }

  var payload = pendingKillBagPayload;
  pendingKillBagPayload = null;
  applyKillBagPayload(payload);
  return true;
}

function getKillDrawTargetAngle(monsterId, idIndexMap) {
  var monsterIdToAngle = {
    1: 0,
    2: 45,
    4: 90,
    7: 135,
    6: 180,
    5: 225,
    3: 270,
    0: 315
  };
  return monsterIdToAngle[idIndexMap[monsterId]] || 0;
}

function resetKillDrawRequestState() {
  if (currentKillDrawRequest && currentKillDrawRequest.readyTimer) {
    clearTimeout(currentKillDrawRequest.readyTimer);
  }
  currentKillDrawRequest = null;
}

function failKillDrawRequest(message) {
  var request = currentKillDrawRequest;
  if (request && request.pointer && request.pointer.length) {
    resetPointerSpin(request.pointer);
  }

  isSpinning = false;
  resetKillDrawRequestState();
  flushPendingKillBagPayload();

  layui.use(['layer'], function() {
    layui.layer.msg(message || '抽奖失败');
  });
}

function applyKillBagPayload(data) {
  if (!data) return;

  latestKillBagPayload = data;

  var items = data.list || data.data || [];
  var redItems = data.red_list || [];
  bagItemsData = items;
  $('.bag-slot').empty();

  var currentSlotIndex = 0;
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var slot = $('.bag-slot').eq(currentSlotIndex);
    if (slot.length && item.usable_num > 0) {
      var itemHtml = `
        <div class="bag-item" data-id="${item.id}" data-item-id="${item.item_id}" data-exp="${item.exp || 0}" data-mark="${item.mark || ''}" data-num="${item.usable_num}" data-title="${item.item_title || '未知物品'}" data-value-min="${item.value_min || 0}" data-value-max="${item.value_max || 0}" style="width: 100%; height: 100%; position: relative; cursor: pointer;">
          <img src="${item.item_images || '../statics/images/01.png'}" style="width: 100%; height: 100%;">
          <div style="position: absolute; bottom: 0; right: 0; background: rgba(0, 0, 0, 0.5); color: #fff; font-size: 10px; padding: 1px 3px;">${item.usable_num}</div>
        </div>
      `;
      slot.html(itemHtml);
      currentSlotIndex++;
    }
  }

  for (var j = 0; j < redItems.length; j++) {
    var redItem = redItems[j];
    var redSlot = $('.bag-slot').eq(currentSlotIndex);
    if (redSlot.length) {
      var redHtml = `
        <div class="bag-item red-bag" data-id="${redItem.id}" data-red="true" data-amount="${redItem.amount || 0}" style="width: 100%; height: 100%; position: relative; cursor: default;">
          <img src="${redItem.red_image || '../statics/images/01.png'}" style="width: 100%; height: 100%;">
        </div>
      `;
      redSlot.html(redHtml);
      currentSlotIndex++;
    }
  }

  bindBagItemEvents();
}

function processKillDrawResult(payload) {
  if (!payload || !payload.monster || !currentKillDrawRequest) {
    return false;
  }

  var requestId = String(payload.request_id || '');
  if (requestId && currentKillDrawRequest.requestId && requestId !== currentKillDrawRequest.requestId) {
    return false;
  }

  if (currentKillDrawRequest.resolved) {
    return true;
  }

  var elapsedMs = Date.now() - (currentKillDrawRequest.startedAt || 0);
  var waitMs = spinMinPendingDuration - elapsedMs;
  if (waitMs > 0) {
    currentKillDrawRequest.pendingPayload = payload;
    if (currentKillDrawRequest.readyTimer) {
      clearTimeout(currentKillDrawRequest.readyTimer);
    }
    currentKillDrawRequest.readyTimer = setTimeout(function() {
      if (!currentKillDrawRequest || currentKillDrawRequest.resolved) {
        return;
      }

      var queuedPayload = currentKillDrawRequest.pendingPayload;
      currentKillDrawRequest.pendingPayload = null;
      currentKillDrawRequest.readyTimer = null;

      if (queuedPayload) {
        processKillDrawResult(queuedPayload);
      }
    }, waitMs);
    return true;
  }

  currentKillDrawRequest.resolved = true;

  var targetMonsterId = payload.monster.id;
  var monsterName = payload.monster.title || '未知怪物';
  var targetAngle = getKillDrawTargetAngle(targetMonsterId, currentKillDrawRequest.idIndexMap || {});
  var pointer = currentKillDrawRequest.pointer;

  if (pointer && pointer.length) {
    var finishDurationMs = finishPointerSpin(pointer, targetAngle);

    setTimeout(function() {
      if (pointer && pointer[0]) {
        pointer.css('transition', 'none');
        pointer.css('transform', 'rotate(' + targetAngle + 'deg)');
      }

      lastAngle = targetAngle;
      spinCurrentAngle = targetAngle;
      showRewards(payload.rewards, monsterName, payload.red_bag);
      isSpinning = false;
      resetKillDrawRequestState();
    }, finishDurationMs + 80);

    return true;
  }

  showRewards(payload.rewards, monsterName, payload.red_bag);
  isSpinning = false;
  resetKillDrawRequestState();
  return true;
}

function handleKillDrawResultMessage(message) {
  var payload = message && message.data ? message.data : null;
  processKillDrawResult(payload);
}

function handleKillBagUpdatedMessage(message) {
  var customer = getUser();
  if (!customer) return;

  var currentOpenId = String(customer.openid || customer.open_id || '');
  var pushedOpenId = String((message && message.open_id) || (message && message.data && message.data.user && message.data.user.open_id) || '');
  if (currentOpenId && pushedOpenId && currentOpenId !== pushedOpenId) {
    return;
  }

  if (message && message.data) {
    if (shouldDelayKillBagUpdate()) {
      pendingKillBagPayload = message.data;
      return;
    }
    applyKillBagPayload(message.data);
  }
}

window.handleKillDrawResultMessage = handleKillDrawResultMessage;
window.handleKillBagUpdatedMessage = handleKillBagUpdatedMessage;

// 一开始就去初始化背包数据
$(function() {
  initBagGrid();
  loadBagItems();
});

// 初始化金币打怪
function initKillMonster() {
  // 获取配置
  getKillConfig();
  // 获取怪物列表
  getMonsterList();
}

// 获取打怪配置
function getKillConfig() {
  $.ajax({
    url: hzRequestUrl + 'kill/get_kill_config',
    type: 'GET',
    dataType: 'json',
    success: function(res) {
      if (res && res.data) {
        killConfig = res.data;
        // 应用指针和背景图片
        if (killConfig.start_btn_image) {
          $('.phs-slot.mid .phs-pointer').css('background-image', 'url(' + killConfig.start_btn_image + ')');
        }
        if (killConfig.start_btn_bg) {
          $('.phs-slot.mid').css('background-image', 'url(' + killConfig.start_btn_bg + ')');
        }
        if (killConfig.monster_bg) {
          $('.phs-slot:not(.mid)').css('background-image', 'url(' + killConfig.monster_bg + ')');
        }
      }
    },
    error: function() {
      console.log('获取打怪配置失败');
    }
  });
}

// 获取怪物列表
function getMonsterList() {
  var customer = getUser();
  if (!customer) return;
  
  $.ajax({
    url: hzRequestUrl + 'kill/monster_list',
    type: 'GET',
    data: {
      open_id: customer.openid
    },
    headers: {
      'boxVersion': '1.0.0',
      'token':$.cookie('hzusertoken')
    },
    dataType: 'json',
    success: function(res) {
      if (res && res.data && res.data.monsters) {
        monsters = res.data.monsters;
        // 更新怪物格子
        updateMonsterSlots();
      }
      $('#personHome').show();
    },
    error: function() {
      console.log('获取怪物列表失败');
      $('#personHome').show();
    }
  });
}

var lastAngle = 0;
var spinCurrentAngle = 0;
var spinPendingTimer = null;
var spinPendingStartTime = 0;
var spinPendingBaseAngle = 0;
var spinPendingSpeed = 3800;
var spinFinishDuration = 1.1;
var spinFinishExtraCircles = 2;

// 更新怪物格子
function updateMonsterSlots() {
  var monsterSlots = $('.phs-slot:not(.mid)');
  monsterSlots.each(function(index) {
    if (monsters[index]) {
      var monster = monsters[index];
      // 更新怪物图片
      $(this).find('.phs-img').css('background-image', 'url(' + monster.images + ')');
      // 更新怪物标题
      $(this).find('.phs-cap').text(monster.title);
    }
  });
}

// 标记是否正在抽奖
var isSpinning = false;

function stopPendingPointerSpin() {
  if (spinPendingTimer) {
    clearInterval(spinPendingTimer);
    spinPendingTimer = null;
  }
}

function normalizeAngle(angle) {
  var normalized = angle % 360;
  if (normalized < 0) {
    normalized += 360;
  }
  return normalized;
}

function startPendingPointerSpin(pointer) {
  if (!pointer || !pointer.length) {
    return;
  }

  stopPendingPointerSpin();
  spinPendingBaseAngle = lastAngle;
  spinCurrentAngle = spinPendingBaseAngle;
  spinPendingStartTime = Date.now();

  pointer.css('transition', 'none');
  pointer.css('transform', 'rotate(' + spinCurrentAngle + 'deg)');

  spinPendingTimer = setInterval(function() {
    var elapsedSeconds = (Date.now() - spinPendingStartTime) / 1000;
    spinCurrentAngle = spinPendingBaseAngle + elapsedSeconds * spinPendingSpeed;
    pointer.css('transform', 'rotate(' + spinCurrentAngle + 'deg)');
  }, 16);
}

function finishPointerSpin(pointer, targetAngle) {
  if (!pointer || !pointer.length) {
    return 0;
  }

  stopPendingPointerSpin();

  var currentAngle = spinCurrentAngle || lastAngle;
  var currentNormalized = normalizeAngle(currentAngle);
  var finalTargetAngle = normalizeAngle(targetAngle);
  var diffAngle = normalizeAngle(finalTargetAngle - currentNormalized);
  var totalAngle = currentAngle + 360 * spinFinishExtraCircles + diffAngle;
  var finishDurationMs = Math.max(420, Math.round(spinFinishDuration * 1000));

  pointer.css('transition', 'transform ' + (finishDurationMs / 1000) + 's ease-out');
  pointer.css('transform', 'rotate(' + totalAngle + 'deg)');

  spinCurrentAngle = totalAngle;
  return finishDurationMs;
}

function resetPointerSpin(pointer) {
  stopPendingPointerSpin();

  if (!pointer || !pointer.length) {
    return;
  }

  pointer.css('transition', 'transform 0.25s ease-out');
  pointer.css('transform', 'rotate(' + lastAngle + 'deg)');
  spinCurrentAngle = lastAngle;

  setTimeout(function() {
    if (pointer && pointer.length) {
      pointer.css('transition', 'none');
      pointer.css('transform', 'rotate(' + lastAngle + 'deg)');
    }
  }, 260);
}

// 点击指针抽奖
function spinPointer() {
  var customer = getUser(1);
  if (!customer) return;

  // 防止重复点击
  if (isSpinning) return;
  // 检查金币是否足够
  var consumeCoin = killConfig.consume_coin || 100;
  var customer = hzUserObj;
  if (!customer) return;
  var userCoin = parseInt(customer.coin_num) || 0;

  if (userCoin < consumeCoin) {
    layui.use(['layer'], function() {
      var layer = layui.layer;
      layer.msg('金币不足');
    });
    return;
  }

  // 打开背包
  openMyBag();

  // 获取用户信息
  var customer = getUser(1);
  if (!customer) {
    return;
  }

  // 设置正在抽奖状态
  isSpinning = true;
  var pointer = $('.phs-pointer');
  startPendingPointerSpin(pointer);

  console.log('monsters', monsters);
  var id_index_monsters = {};
  for (var i = 0; i < monsters.length; i++) {
    id_index_monsters[monsters[i].id] = i;
  }
  console.log('id_index_monsters', id_index_monsters);

  var requestId = generateKillDrawRequestId();
  currentKillDrawRequest = {
    requestId: requestId,
    pointer: pointer,
    idIndexMap: id_index_monsters,
    resolved: false,
    startedAt: Date.now(),
    pendingPayload: null,
    readyTimer: null
  };

  // 同时请求后端接口
  $.ajax({
    url: hzRequestUrl + 'kill/draw',
    type: 'POST',
    data: {
      open_id: customer.openid,
      request_id: requestId
    },
    headers: {
      'boxVersion': '1.0.0',
      'token':$.cookie('hzusertoken')
    },
    dataType: 'json',
    success: function(res) {
      if (!currentKillDrawRequest) {
        return;
      }

      if (currentKillDrawRequest.resolved) {
        return;
      }

      if (res && res.data && res.data.monster) {
        processKillDrawResult(res.data);
        return;
      }

      failKillDrawRequest('抽奖失败');
    },
    error: function() {
      if (!currentKillDrawRequest || currentKillDrawRequest.resolved) {
        return;
      }

      failKillDrawRequest('抽奖失败');
    }
  });
}

// 显示奖励信息
function showRewards(rewards, monsterName, redBag) {
  isKillRewardVisible = true;
  var rewardHtml = '';
  if (rewards && rewards.length > 0) {
    for (var i = 0; i < rewards.length; i++) {
      var reward = rewards[i];
      rewardHtml += `
        <div style="display: flex; align-items: center; margin-bottom: 5px; margin-left: 10px;">
          <img src="${reward.item_images || '../statics/images/01.png'}" style="width: 42px; height: 42px; margin-right: 15px;">
          <div style="font-size: 14px; margin-right: 20px;">${reward.item_title || '未知物品'}</div>
          
        </div>
      `;
    }
  }
  if(redBag && redBag.amount > 0){
    rewardHtml += `
        <div style="display: flex; align-items: center; margin-bottom: 5px; margin-left: 10px;">
          <img src="${redBag.red_image || '../statics/images/01.png'}" style="width: 42px; height: 42px; margin-right: 15px;">
          <div style="font-size: 14px; margin-right: 20px;">红包奖励：${redBag.amount}元</div>
          
        </div>
      `;
  }
  layui.use(['layer'], function() {
    var layer = layui.layer;
    var dialog = layer.open({
      type: 1,
      title: `野怪 [${monsterName}] 爆的物品`,
      area: ['260px', 'auto'],
      shadeClose: true,
      shade: 0.5,
      content: rewardHtml,
      zIndex: layer.zIndex + 100,
      btn: ['放入到背包'],
      end: function() {
        isKillRewardVisible = false;
        flushPendingKillBagPayload();
        // 关闭奖励框后，刷新背包数据
        loadBagItems();
      },
      yes: function(index, layero) {
        layer.close(index);
      }
    });
  });
}

// 打开打怪规则弹窗
function openArenaRuleModal(){
  layer.closeAll();
  layui.use(['layer'], function(){
    var layer = layui.layer;
    layer.open({
      type: 1,
      title: '打怪规则',
      area: ['980px','720px'],
      shade: 0.3,
      content: $('#arenaRuleModal'),
      success: function() {
        loadLevelMonsters();
      }
    });
  });
}

// 加载等级和怪物信息
function loadLevelMonsters() {
  // 获取打怪配置（包含消耗金币数）
  $.ajax({
    url: hzRequestUrl + 'kill/get_kill_config',
    type: 'GET',
    dataType: 'json',
    success: function(res) {
      if (res && res.data) {
        var consumeCoin = res.data.consume_coin || 30;
        // 更新消耗金币数
        $('.ar-rules div:first').text('1. 每次打怪需消耗 ' + consumeCoin + ' 金币。');
      }
    },
    error: function() {
      console.log('获取打怪配置失败');
    }
  });

  // 获取等级和怪物信息
  $.ajax({
    url: hzRequestUrl + 'kill/level_monsters1',
    type: 'GET',
    dataType: 'json',
    success: function(res) {
      if (res && res.data) {
        var levels = res.data.levels || res.data || [];

        // 清空现有内容
        $('.ar-title, .ar-grid').remove();
        
        // 存储所有等级和怪物信息
        var allHtml = '';
        
        // 动态生成等级和怪物列表
        for (var i = 0; i < levels.length; i++) {
          var level = levels[i];
          var startLevel = level.start_level;
          var endLevel = level.end_level;
          var levelHtml = `
            <div class="ar-title">会员等级${startLevel}到等级${endLevel}可打怪物</div>
            <div class="ar-grid">
          `;
          var monsters = level.monsters || [];
          for (var j = 0; j < monsters.length; j++) {
            var monster = monsters[j];
            var monsterImage = monster.images || '';
            var monsterName = monster.title || monster.name || '';
            levelHtml += `
              <div class="ar-item">
                <div class="ar-pic" ${monsterImage ? 'style="background-image: url(' + monsterImage + '); background-size: cover; background-position: center;"' : ''}></div>
                <div class="ar-name">${monsterName}</div>
              </div>
            `;
          }
          levelHtml += `
            </div>
          `;
          allHtml += levelHtml;
        }
        
        // 一次性添加所有内容到 .ar-rules 后面
        $('.ar-rules').after(allHtml);
      }
    },
    error: function() {
      console.log('获取等级和怪物信息失败');
    }
  });
}


var BAG_IMG_URL = "../statics/images/bags.png"; // TODO: 如路径不同改这里
var BAG_TITLE_H = 52; // 预估 layer 标题栏高度，用于避免内容被挤出滚动条

function getTopLayer(){
  // 优先用父窗口 layer（避免被 iframe/父层遮挡）
  if (window.parent && window.parent.layer) return window.parent.layer;
  if (window.layui && layui.layer) return layui.layer;
  return window.layer;
}

function openMyBag(){
  var L = getTopLayer();
  if (!L) return;

  // 预加载图片，按真实尺寸开弹窗，保证“背景就是整张图”
  var img = new Image();
  img.onload = function(){
    // 设置容器为图片真实尺寸
    var w = img.naturalWidth || img.width || 980;
    var h = img.naturalHeight || img.height || 650;
    $("#bagWrap")
      .css({ width: w + "px", height: h + "px" })
      .css("background-image", 'url("' + BAG_IMG_URL + '")');

        // 用 layer 的置顶机制，别用写死 zIndex
    var dialog = L.open({
      type: 1,
      title: "我的背包 - 鼠标双击物品可回收",
      shade: 0, // 去掉背景遮罩
      skin: "bag-layer",
      area: [ w + "px", (h + BAG_TITLE_H) + "px" ],
      zIndex: L.zIndex,
      content: $("#myBagModal"),
      success: function(layero){
        L.setTop(layero);
        
        // 确保关闭按钮可点击
        setTimeout(function() {
          // 为关闭按钮添加点击事件
          var closeBtn = layero.find('.layui-layer-close, .layui-layer-close1, .layui-layer-close2');
          closeBtn.off('click').on('click', function(e) {
            e.stopPropagation();
            L.close(dialog);
          });
        }, 1);
      }
    });
  };
  img.onerror = function(){
    // 找不到图片时给个提示，方便你定位路径
    if (L.msg) L.msg("bags.png 加载失败，请检查路径：" + BAG_IMG_URL);
  };
  img.src = BAG_IMG_URL;
}

// 初始化背包格子
function initBagGrid() {
  var bagItems = $('.bag-items');
  bagItems.empty();
  
  // 创建120个格子
  var gridHtml = `
    <div class="bag-grid">
  `;
  
  for (var i = 0; i < 120; i++) {
    gridHtml += `
      <div class="bag-slot" data-slot-index="${i}"></div>
    `;
  }
  
  gridHtml += `
    </div>
  `;
  
  bagItems.append(gridHtml);
}

// 加载背包数据
function loadBagItems() {
  console.log("load背包数据");
  // 清空选中数组
  selectedItemsArray = [];
  // 清空背包物品数据数组
  bagItemsData = [];
  var customer = getUser();
  if (!customer) return;

  if (!shouldDelayKillBagUpdate() && latestKillBagPayload && latestKillBagPayload.user && latestKillBagPayload.user.open_id === customer.openid) {
    applyKillBagPayload(latestKillBagPayload);
  }

  $.ajax({
    url: hzRequestUrl + 'kill/bag_list',
    type: 'GET',
    dataType: 'json',
    data: {
      open_id: customer.openid,
      limit: 120
    },
    headers: {
      'boxVersion': '1.0.0',
      'token':$.cookie('hzusertoken')
    },
    success: function(res) {
      console.log('背包数据:', res);
      if (res && res.data) {
        console.log('物品列表:', res.data.list || []);
        console.log('红包列表:', res.data.red_list || []);
        if (shouldDelayKillBagUpdate()) {
          pendingKillBagPayload = res.data;
          return;
        }
        applyKillBagPayload(res.data);
      }
    },
    error: function() {
      console.log('加载背包数据失败');
    }
  });
}

// 绑定物品事件
function bindBagItemEvents() {
  // 双击回收 - 只对非红包物品绑定
  $('.bag-item:not(.red-bag)').off('dblclick').on('dblclick', function() {
    var id = $(this).data('item-id');
    var valueMin = $(this).data('value-min');
    var valueMax = $(this).data('value-max');
    var num = $(this).data('num');
    var title = $(this).data('title');
    var exp = $(this).data('exp');
    recycleItem(id, valueMin, valueMax, num, title, exp);
  });

  // 单击选中/取消选中 - 只对非红包物品绑定
  $('.bag-item:not(.red-bag)').off('click').on('click', function(e) {
    e.stopPropagation();
    var itemId = $(this).data('id');
    if ($(this).hasClass('selected')) {
      // 取消选中
      $(this).removeClass('selected');
      $(this).find('.selected-overlay').remove();
      // 从选中数组中移除
      selectedItemsArray = selectedItemsArray.filter(function(item) {
        return item.id !== itemId;
      });
    } else {
      // 选中
      $(this).addClass('selected');
      $(this).append('<div class="selected-overlay" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(255, 204, 0, 0.5); pointer-events: none;"></div>');
      // 从 bagItemsData 中找到完整的物品数据
      var item = bagItemsData.find(function(item) {
        return item.id == itemId;
      });
      if (item) {
        // 添加到选中数组
        selectedItemsArray.push(item);
      }
    }
  });

  // 悬停效果 - 对所有物品绑定，但红包显示特殊内容
  $('.bag-item').off('mouseenter mouseleave').on('mouseenter', function() {
    // 判断物品所在列
    var slot = $(this).closest('.bag-slot');
    var slotIndex = slot.index('.bag-slot');
    var col = slotIndex % 12 + 1; // 计算列数（1-12）
    var tooltipStyle = 'position: absolute; top: 110%; background: rgba(0, 0, 0, 0.7); color: #fff; font-size: 12px; padding: 5px; border-radius: 8px; z-index: 1000; white-space: nowrap;border-color: rgba(216, 226, 75, 0.5); border-width: 1px; border-style: solid;';
    
    // 最后三列（10、11、12列）使用right:0
    if (col >= 10) {
      tooltipStyle += ' right: -5px; margin-right: 5px;';
    } else {
      tooltipStyle += ' left: 0; margin-left: 5px;';
    }
    
    // 检查是否是红包
    if ($(this).hasClass('red-bag')) {
      // 红包的提示
      var amount = $(this).data('amount') || 0;
      var tooltipContent = `红包：额度有${amount}<br>无法回收，可在红包服中使用`;
      $(this).append(`<div class="bag-item-tooltip" style="${tooltipStyle}">${tooltipContent}</div>`);
    } else {
      // 普通物品的提示
      var valueMin = $(this).data('value-min');
      var valueMax = $(this).data('value-max');
      var itemTitle = $(this).data('title') || '未知物品';
      var valueExp = $(this).data('exp') || 0;
      var valueText = '';
      var mark = $(this).data('mark')||'';
      if (valueMin === valueMax) {
        valueText = '价值' + valueMin + '金币';
      } else {
        valueText = '价值' + valueMin + '到' + valueMax + '金币';
      }
      if(valueExp > 0){
        valueText += '<br>经验+' + valueExp;
      }
      // 添加 mark 字段显示
      if(mark){
        valueText += '<br><span style="white-space: pre-wrap; word-break: break-word; color: #999; font-size: 12px;">' + mark + '</span>';
      }
      $(this).append(`<div class="bag-item-tooltip" style="${tooltipStyle}">${itemTitle}<br>${valueText}</div>`);
    }
  }).on('mouseleave', function() {
    // 隐藏提示气泡
    $(this).find('.bag-item-tooltip').remove();
  });
}

// 回收物品
function recycleItem(id, valueMin, valueMax, num, title, exp) {
  // 获取物品名称
  var itemTitle = title;
  var maxNum = num;
  layui.use(['layer'], function() {
    var layer = layui.layer;
    var expTextPer = '';
    if(exp > 0){
      expTextPer = '，' + exp + '经验';
    }
    var modalContent = `
      <div style="padding: 20px;">
        <div style="display: flex;align-items: center;justify-content: space-between;">
          <div>每个获得：${valueMin === valueMax ? valueMin : valueMin + '到' + valueMax}金币${expTextPer}</div>
          <div>
            <label>数量：</label>
            <input type="number" id="recycleNum" value="${num}" min="1" max="${num}" style="width: 45px; padding: 5px;">
          </div>
        </div>
      </div>
    `;

    var expText = '';
    if(exp > 0){
      expText = '，' + exp * num + '经验';
    }

    modalContent += `<div style="position: absolute; left: 10px; padding: 10px; border-radius: 4px;">
      <span id="recycleValue" style="font-weight: bold; color: #333;">将获得：${valueMin === valueMax ? valueMin * num : valueMin * num + '到' + valueMax * num}金币${expText}</span>
    </div>`;

    var dialog = layer.open({
      type: 1,
      title: `确认回收${itemTitle}吗？`,
      area: ['350px', '250px'],
      shade: 0.3,
      zIndex: layer.zIndex + 100, // 提高层级，确保比背包高
      content: modalContent,
      btn: ['确定'],
      success: function(layero) {
        // 为输入框添加change事件监听器
        $(layero).find('#recycleNum').on('change', function() {
          var currentNum = parseInt($(this).val()) || 1;
          // 验证输入值
          if (currentNum < 1) currentNum = 1;
          if (currentNum > maxNum) currentNum = maxNum;
          // 更新输入框值
          $(this).val(currentNum);
          // 更新将获得的金币数量
          var valueText = valueMin === valueMax ? valueMin * currentNum : valueMin * currentNum + '到' + valueMax * currentNum;
          if(exp > 0){
            valueText += '，' + exp * currentNum + '经验';
          }
          
          // 更新将获得的金币数量
          $(layero).find('#recycleValue').text('将获得：' + valueText);
        });
      },
      yes: function(index, layero) {
        // 绑定确认按钮点击事件
        var num = parseInt($('#recycleNum').val()) || 1;
        // 验证输入值
        if (num < 1) {
          layer.msg('数量不能小于1', {zIndex: layer.zIndex + 200});
          return;
        }
        if (num > maxNum) {
          layer.msg('数量不能超过' + maxNum, {zIndex: layer.zIndex + 200});
          return;
        }
        var customer = getUser(1);

        console.log("customer:", customer);


        // 调用回收接口
        $.ajax({
          url: hzRequestUrl + 'kill/recycle_items',
          type: 'POST',
          contentType: 'application/json',
          data: JSON.stringify({
            open_id: customer.openid,
            items: [{
              item_id: id,
              num: num
            }]
          }),
          headers: {
            'boxVersion': '1.0.0',
            'token':$.cookie('hzusertoken')
          },
          dataType: 'json',
          success: function(res) {
            if (res && res.code === 200) {
              layer.close(dialog);
              // 展示回收结果
              showRecycleResult(res.data);
              // 刷新背包数据
              loadBagItems();
            } else {
              layer.msg('回收失败：' + (res.msg || '未知错误'));
            }
          },
          error: function() {
            layer.msg('回收失败：网络错误');
          }
        });
      }
    });
  });
}

// 批量回收功能
function recycleSelectedItems(){
  if (selectedItemsArray.length === 0) {
    var L = getTopLayer();
    if (L && L.msg) L.msg("请选择物品", {zIndex: L.zIndex + 100});
    return;
  }
  
  // 构建选中物品信息
  var itemsHtml = '<table style="width: 100%; border-collapse: collapse; text-align: center;font-size: 14px;">';
  var itemCount = selectedItemsArray.length;
  selectedItemsArray.forEach(function(item, index) {
    itemsHtml += `
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 10px; vertical-align: middle;">
          <div style="display: flex; align-items: center; justify-content: center;">
            <img src="${item.item_images || '../statics/images/01.png'}" style="width: 42px; height: 42px; margin-right: 10px;">
            <span>${item.item_title || '未知物品'}</span>
          </div>
        </td>
        <td style="padding: 10px; vertical-align: middle;">
          <div style="display: flex; align-items: center; justify-content: center;">
            <span>${item.usable_num}件</span>
          </div>
        </td>
        <td style="padding: 10px; vertical-align: middle;">
          <span>金币+${item.value_min === item.value_max ? + item.value_min * item.usable_num : item.value_min * item.usable_num + '到' + item.value_max * item.usable_num}</span>
          <span style="display:${item.exp > 0 ? 'block' : 'none'}; ">经验+${item.exp * item.usable_num}</span>
          </td>
      </tr>
    `;
  });
  itemsHtml += '</table>';

  var minValue = 0;
  var maxValue = 0;
  var expExp = 0;
  selectedItemsArray.forEach(function(item) {
    minValue += item.value_min * item.usable_num;
    maxValue += item.value_max * item.usable_num;
    expExp += item.exp * item.usable_num;
  });
  
  // 样式调整下，放在左下角
  itemsHtml += `<div style="position: absolute; bottom: 10px; left: 10px; padding: 10px; border-radius: 4px;">
    <span style="font-weight: bold; color: #333;">将获得：${minValue === maxValue ? minValue : minValue + '到' + maxValue}金币</span>
    <span style="font-weight: bold; color: #333;">，${expExp}经验</span>
  </div>`;
  
  // 计算弹窗高度
  var baseHeight = 160; // 基础高度
  var itemHeight = 60; // 每个物品的高度
  var totalHeight = baseHeight + itemCount * itemHeight; // 动态高度
  
  var L = getTopLayer();
  var dialog = L.open({
    type: 1,
    title: '批量回收',
    area: ['400px', totalHeight + 'px'],
    shade: 0.3,
    content: itemsHtml,
    btn: ['在线回收'],
    zIndex: L.zIndex + 100,
    yes: function(index, layero) {
        // 构建回收物品列表
      var items = [];
      selectedItemsArray.forEach(function(oneItem) {
        items.push({
          item_id: oneItem.item_id,
          num: oneItem.usable_num
        });
      });
      
      // 调用回收接口
      var customer = getUser();
      if (!customer) return;
      
      $.ajax({
        url: hzRequestUrl + 'kill/recycle_items',
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
          open_id: customer.openid,
          items: items
        }),
        headers: {
          'boxVersion': '1.0.0',
          'token':$.cookie('hzusertoken')
        },
        dataType: 'json',
        success: function(res) {
          if (res && res.code === 200) {
            L.close(dialog);
            // 展示回收结果
            showRecycleResult(res.data);
            // 刷新背包数据
            loadBagItems();
          } else {
            L.msg('回收失败：' + (res.msg || '未知错误'), {zIndex: L.zIndex + 100});
          }
        },
        error: function() {
          L.msg('回收失败：网络错误', {zIndex: L.zIndex + 100});
        }
      });
    }
  });
}

// 展示回收结果
function showRecycleResult(data) {
  var totalCoin = data.total_coin || 0;
  var totalExp = data.total_exp || 0;
  var items = data.items || [];
  
  // 构建物品表格
  var tableHtml = `
    <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
      <thead>
        <tr style="background-color: #f5f5f5;">
          <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">物品名</th>
          <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">数量</th>
          <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">金币数</th>
          <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">经验数</th>
        </tr>
      </thead>
    <tbody>`;
  
  items.forEach(function(item) {
    tableHtml += `
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd;">${item.item_title || '未知物品'}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${item.num || 0}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${item.coin || 0}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${item.exp || 0}</td>
      </tr>
    `;
  });
  
  tableHtml += `
      </tbody>
    </table>
  `;
  
  // 构建弹框内容
  var modalContent = `
    <div style="padding: 20px;">
      <div style="margin-bottom: 20px; text-align: center; font-size: 18px; font-weight: bold;">回收总金币数：${totalCoin}，总经验数：${totalExp}</div>
      ${tableHtml}
    </div>`;
  
  // 计算弹窗高度（增加一些额外的高度以确保没有滚动条）
  var baseHeight = 180; // 基础高度
  var itemHeight = 45; // 每个物品的高度
  var totalHeight = baseHeight + items.length * itemHeight; // 动态高度
  
  var L = getTopLayer();
  var dialog = L.open({
    type: 1,
    title: '回收结果',
    area: ['450px', totalHeight + 'px'],
    shadeClose: true,
    shade: 0.3,
    content: modalContent,
    zIndex: L.zIndex + 100,
  });
}


// ====== 打怪记录和回收记录功能 ======
// 弹窗HTML结构
var killRecordModalHTML = `
  <div id="killRecordModal" style="display:none;">
    <div style="padding:20px;">
      <table id="killRecordTable" style="width:100%; border-collapse:collapse; font-size:13px;">
        <thead>
          <tr style="background-color:#f5f5f5;">
            <th style="padding:10px; border:1px solid #ddd; text-align:left; width:200px;">时间</th>
            <th style="padding:10px; border:1px solid #ddd; text-align:left;">内容</th>
          </tr>
        </thead>
        <tbody id="killRecordBody">
          <!-- 数据将通过JS动态填充 -->
        </tbody>
      </table>
      <div id="killRecordPagination" style="margin-top:20px; text-align:center;">
        <!-- 分页控件将通过JS动态填充 -->
      </div>
    </div>
  </div>
`;

var recycleRecordModalHTML = `
  <div id="recycleRecordModal" style="display:none;">
    <div style="padding:20px;">
      <table id="recycleRecordTable" style="width:100%; border-collapse:collapse; font-size:13px;">
        <thead>
          <tr style="background-color:#f5f5f5;">
            <th style="padding:10px; border:1px solid #ddd; text-align:left; width:200px;">时间</th>
            <th style="padding:10px; border:1px solid #ddd; text-align:left;">内容</th>
          </tr>
        </thead>
        <tbody id="recycleRecordBody">
          <!-- 数据将通过JS动态填充 -->
        </tbody>
      </table>
      <div id="recycleRecordPagination" style="margin-top:20px; text-align:center;">
        <!-- 分页控件将通过JS动态填充 -->
      </div>
    </div>
  </div>
`;

// 添加弹窗HTML到body
$(document.body).append(killRecordModalHTML);
$(document.body).append(recycleRecordModalHTML);

// 打开打怪记录弹窗
function openKillRecordModal() {
  layer.closeAll();
  layui.use(['layer'], function() {
    var layer = layui.layer;
    layer.open({
      type: 1,
      title: '打怪记录',
      area: ['800px', '600px'],
      shade: 0.3,
      content: $('#killRecordModal'),
      success: function() {
        // 加载第一页数据
        loadKillRecord(1);
      }
    });
  });
}

// 加载打怪记录数据
function loadKillRecord(page) {
  if (loading) {
    layer.msg('手速太快了，我有点跟不上！')
    return;
  }
  loading = true;
  open_id = getUser(1).openid || '';
  var limit = 10;

  $.ajax({
    url: hzRequestUrl + 'kill/kill_record_list',
    type: 'GET',
    data: {
      open_id: open_id,
      page: page,
      limit: limit
    },
    headers: {
      'boxVersion': '1.0.0',
      'token':$.cookie('hzusertoken')
    },
    dataType: 'json',
    success: function(res) {
      loading = false;
      if (res && res.data) {
        var rows = res.data.rows || [];
        var total = res.data.total || 0;
        var totalPages = Math.ceil(total / limit);

        // 清空表格
        $('#killRecordBody').empty();

        // 填充数据
        for (var i = 0; i < rows.length; i++) {
          var row = rows[i];
          var time = row.updata_time || '';
          var content = row.title || '';
          if (content === '打怪抽奖消耗' && row.coin_num) {
            content += row.coin_num;
          }
          var tr = '<tr><td style="padding:10px; border:1px solid #ddd;">' + time + '</td><td style="padding:10px; border:1px solid #ddd;">' + content + '</td></tr>';
          $('#killRecordBody').append(tr);
        }

        // 生成分页
        generatePagination('killRecordPagination', page, totalPages, total, loadKillRecord);
      }
    },
    error: function() {
      loading = false;
      alert('加载数据失败');
    }
  });
}

// 打开回收记录弹窗
function openRecycleRecordModal() {
  layer.closeAll();
  layui.use(['layer'], function() {
    var layer = layui.layer;
    layer.open({
      type: 1,
      title: '回收记录',
      area: ['800px', '600px'],
      shade: 0.3,
      content: $('#recycleRecordModal'),
      success: function() {
        // 加载第一页数据
        loadRecycleRecord(1);
      }
    });
  });
}

var loading = false;

// 加载回收记录数据
function loadRecycleRecord(page) {
  if (loading) {
    layer.msg('手速太快了，我有点跟不上！')
    return;
  }
  loading = true;
  open_id = getUser(1).openid || '';
  var limit = 10;

  $.ajax({
    url: hzRequestUrl + 'kill/exchange_record_list',
    type: 'GET',
    data: {
      open_id: open_id,
      page: page,
      limit: limit
    },
    headers: {
      'boxVersion': '1.0.0',
      'token':$.cookie('hzusertoken')
    },
    dataType: 'json',
    success: function(res) {
      loading = false;
      if (res && res.data) {
        var rows = res.data.rows || [];
        var total = res.data.total || 0;
        var totalPages = Math.ceil(total / limit);

        // 清空表格
        $('#recycleRecordBody').empty();

        // 填充数据
        for (var i = 0; i < rows.length; i++) {
          var row = rows[i];
          var time = row.create_time || '';
          var aa = Math.abs(row.change_num || 0);
          var bb = row.item_title || '';
          var cc = row.coin_num || 0;
          var content = '回收了' + aa + '个' + bb + '，获得' + cc + '金币';
          var tr = '<tr><td style="padding:10px; border:1px solid #ddd;">' + time + '</td><td style="padding:10px; border:1px solid #ddd;">' + content + '</td></tr>';
          $('#recycleRecordBody').append(tr);
        }

        // 生成分页
        generatePagination('recycleRecordPagination', page, totalPages, total, loadRecycleRecord);
      }
    },
    error: function() {
      loading = false;
      alert('加载数据失败');
    }
  });
}
