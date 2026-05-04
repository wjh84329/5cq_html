var TASK_DETAIL_STATE = {
  seq: 0,
  openId: '',
  bound: false,
  autoBound: false,
  claimedMap: {},
  snapshotMap: {},
  lastLoadAt: 0,
  lastPreloadAt: 0,
  preloadTimer: null,
  autoRefreshTimer: null,
  autoRefreshInterval: 1
};

// localStorage helpers for persisting claimed monthly rewards per user
function getTaskClaimedStorageKey(openId) {
  return 'hz_task_claimed_v1:' + String(openId || '');
}

function loadClaimedMapForOpenId(openId) {
  try {
    if (!openId) return;
    var key = getTaskClaimedStorageKey(openId);
    var raw = localStorage.getItem(key);
    if (!raw) return;
    var obj = JSON.parse(raw) || {};
    TASK_DETAIL_STATE.claimedMap = TASK_DETAIL_STATE.claimedMap || {};
    Object.keys(obj).forEach(function (claimType) {
      var cacheKey = getTaskClaimCacheKey(openId, claimType);
      TASK_DETAIL_STATE.claimedMap[cacheKey] = !!obj[claimType];
    });
  } catch (e) {
    console.error('loadClaimedMapForOpenId error', e);
  }
}

function saveClaimedMapForOpenId(openId) {
  try {
    if (!openId) return;
    var key = getTaskClaimedStorageKey(openId);
    var map = TASK_DETAIL_STATE.claimedMap || {};
    var obj = {};
    var prefix = String(openId) + ':';
    Object.keys(map).forEach(function (k) {
      if (String(k).indexOf(prefix) === 0) {
        var claimType = String(k).slice(prefix.length);
        obj[claimType] = !!map[k];
      }
    });
    localStorage.setItem(key, JSON.stringify(obj));
  } catch (e) {
    console.error('saveClaimedMapForOpenId error', e);
  }
}

var TASK_DAILY_DEFS = [
  { id: 7, claimId: null },
  { id: 1, claimId: 10 },
  { id: 2, claimId: 11 },
  { id: 3, claimId: 12 },
  { id: 4, claimId: 13 },
  { id: 5, claimId: 14 }
];

var TASK_MONTHLY_DEFS = [
  { id: 'a', required: 3, claimId: 2 },
  { id: 'b', required: 7, claimId: 3 },
  { id: 'c', required: 14, claimId: 4 },
  { id: 'd', required: 28, claimId: 5 }
];

function getTaskCustomer() {
  var customer = getUser(1);
  if (!customer || !customer.openid) {
    return null;
  }
  return customer;
}

function getTaskClaimCacheKey(openId, taskId) {
  return String(openId || '') + ':' + String(taskId);
}

function getTaskClaimType(taskId) {
  var normalizedTaskId = String(taskId);
  var dailyTask = TASK_DAILY_DEFS.filter(function (item) {
    return String(item.id) === normalizedTaskId;
  })[0];
  if (dailyTask) {
    return dailyTask.claimId;
  }

  var monthlyTask = TASK_MONTHLY_DEFS.filter(function (item) {
    return String(item.id) === normalizedTaskId;
  })[0];
  return monthlyTask ? monthlyTask.claimId : null;
}

function isTaskRequestCurrent(seq, openId) {
  return seq === TASK_DETAIL_STATE.seq && String(openId || '') === String(TASK_DETAIL_STATE.openId || '');
}

function getTaskSnapshot(openId) {
  var finalOpenId = String(openId || TASK_DETAIL_STATE.openId || '');
  if (!finalOpenId) {
    return null;
  }

  return TASK_DETAIL_STATE.snapshotMap[finalOpenId] || null;
}

function ensureTaskSnapshot(openId) {
  var finalOpenId = String(openId || TASK_DETAIL_STATE.openId || '');
  if (!finalOpenId) {
    return null;
  }

  if (!TASK_DETAIL_STATE.snapshotMap[finalOpenId] || typeof TASK_DETAIL_STATE.snapshotMap[finalOpenId] !== 'object') {
    TASK_DETAIL_STATE.snapshotMap[finalOpenId] = {
      status: {
        daily: {},
        monthly: {}
      },
      buttons: {}
    };
  }

  return TASK_DETAIL_STATE.snapshotMap[finalOpenId];
}

function hasTaskStatusSnapshot(openId, section, taskId) {
  var snapshot = getTaskSnapshot(openId);
  if (!snapshot || !snapshot.status || !snapshot.status[section]) {
    return false;
  }

  return Object.prototype.hasOwnProperty.call(snapshot.status[section], String(taskId));
}

function hasTaskButtonSnapshot(openId, taskId) {
  var snapshot = getTaskSnapshot(openId);
  if (!snapshot || !snapshot.buttons) {
    return false;
  }

  return Object.prototype.hasOwnProperty.call(snapshot.buttons, String(taskId));
}

function applyTaskSnapshot(openId) {
  var snapshot = getTaskSnapshot(openId);
  if (!snapshot) {
    return;
  }

  ['daily', 'monthly'].forEach(function (section) {
    var sectionMap = snapshot.status && snapshot.status[section] ? snapshot.status[section] : {};
    Object.keys(sectionMap).forEach(function (taskId) {
      var item = sectionMap[taskId] || {};
      setTaskStatus(section, taskId, item.text || '状态：读取中...', !!item.completed, !!item.isLoading);
    });
  });

  Object.keys(snapshot.buttons || {}).forEach(function (taskId) {
    setTaskClaimButton(taskId, snapshot.buttons[taskId] || {});
  });
}

function bindTaskDetailEvents() {
  if (TASK_DETAIL_STATE.bound) {
    return;
  }

  TASK_DETAIL_STATE.bound = true;

  $('#dailyTasks, #monthlyTasks')
    .off('click.taskClaim')
    .on('click.taskClaim', '.task-card__btn', function (event) {
      event.preventDefault();
      event.stopPropagation();
      claimTaskReward($(this).attr('data-claim-id'));
    });

  $('#dailyTasks')
    .off('click.taskAction')
    .on('click.taskAction', '.task-card--clickable', function () {
      handleTaskCardAction($(this).attr('data-task-id'));
    });
}

function ensureOperationDataObject() {
  if (!window.operationData || typeof window.operationData !== 'object') {
    window.operationData = {};
  }
  return window.operationData;
}

function getTaskOperationData() {
  var cached = ensureOperationDataObject();
  if (Object.keys(cached).length > 0) {
    return Promise.resolve(cached);
  }

  return new Promise(function (resolve, reject) {
    admin.req({
      url: hzRequestUrl + 'business/operation'
    }).done(function (res) {
      if (res && res.data) {
        window.operationData = res.data;
        resolve(window.operationData);
        return;
      }
      reject(new Error('operation empty'));
    }).fail(function (err) {
      reject(err instanceof Error ? err : new Error('operation failed'));
    });
  });
}

function getTaskReportResponse() {
  if (typeof fetchUserReport === 'function') {
    return fetchUserReport();
  }

  var customer = getTaskCustomer();
  if (!customer) {
    return Promise.reject(new Error('no open_id'));
  }

  return new Promise(function (resolve, reject) {
    $.ajax({
      url: hzRequestUrl + 'user/user_report',
      type: 'GET',
      dataType: 'json',
      data: {
        open_id: customer.openid
      },
      headers: {
        'boxVersion': '1.0.0',
        'token': $.cookie('hzusertoken')
      },
      success: function (res) {
        resolve(res || {});
      },
      error: function (err) {
        reject(err instanceof Error ? err : new Error('user_report failed'));
      }
    });
  });
}

function getTaskBrowseProgress(customer) {
  return new Promise(function (resolve, reject) {
    admin.req({
      url: baseUrl + 'ranking/countTodayPublishBrowse',
      data: {
        openid: customer.openid
      },
      success: function (res) {
        resolve(Number(res && res.data) || 0);
      },
      error: function (err) {
        reject(err instanceof Error ? err : new Error('browse progress failed'));
      }
    });
  });
}

function getTaskShareProgress(customer) {
  return new Promise(function (resolve, reject) {
    $.ajax({
      url: hzRequestUrl + 'kill/today_share_count',
      type: 'GET',
      headers: {
        'boxVersion': '1.0.0',
        'token': $.cookie('hzusertoken')
      },
      dataType: 'json',
      data: {
        open_id: customer.openid
      },
      success: function (res) {
        if (res && Number(res.code) === 200) {
          resolve(Number(res.data && res.data.today_share_count) || 0);
          return;
        }
        reject(new Error('share progress failed'));
      },
      error: function (err) {
        reject(err instanceof Error ? err : new Error('share progress failed'));
      }
    });
  });
}

function checkTaskClaimStatus(customer, taskId) {
  var claimType = getTaskClaimType(taskId);
  if (claimType == null) {
    return Promise.resolve(false);
  }

  var cacheKey = getTaskClaimCacheKey(customer.openid, claimType);
  if (Object.prototype.hasOwnProperty.call(TASK_DETAIL_STATE.claimedMap, cacheKey)) {
    return Promise.resolve(!!TASK_DETAIL_STATE.claimedMap[cacheKey]);
  }

  return new Promise(function (resolve) {
    $.ajax({
      url: hzRequestUrl + 'user/checkCoin',
      type: 'GET',
      headers: {
        'boxVersion': '1.0.0',
        'token': $.cookie('hzusertoken')
      },
      dataType: 'json',
      data: {
        open_id: customer.openid,
        id: claimType
      },
      success: function (res) {
        var claimed = !!(res && Number(res.code) === 200 && res.data === true);
        TASK_DETAIL_STATE.claimedMap[cacheKey] = claimed;
        resolve(claimed);
      },
      error: function () {
        resolve(false);
      }
    });
  });
}

function formatTaskRewardText(reward, isRangeHalf) {
  var rewardText = reward == null ? '0' : String(reward);
  if (!isRangeHalf || rewardText.indexOf('-') === -1) {
    return rewardText;
  }

  var parts = rewardText.split('-');
  var min = Math.floor((parseInt(parts[0], 10) || 0) / 2);
  var max = Math.floor((parseInt(parts[1], 10) || 0) / 2);
  return min + '-' + max;
}

function buildDailyTasks(operationData) {
  var lookGameNumber = Number(operationData.lookGameNumber) || 10;
  return [
    {
      id: 7,
      title: '邀请好友分享链接并识别到点开一次',
      rewardText: '10',
      clickable: true
    },
    {
      id: 1,
      title: '浏览个人中心的游戏' + lookGameNumber + '次',
      rewardText: formatTaskRewardText(operationData.lookGame || '0', false),
      clickable: true,
      required: lookGameNumber
    },
    {
      id: 2,
      title: '游戏在线30分钟[白银宝箱]',
      rewardText: formatTaskRewardText(operationData.boxCoin30 || '0-0', true),
      clickable: true,
      required: 30
    },
    {
      id: 3,
      title: '游戏在线60分钟[黄金宝箱]',
      rewardText: formatTaskRewardText(operationData.boxCoin60 || '0-0', true),
      clickable: true,
      required: 60
    },
    {
      id: 4,
      title: '游戏在线120分钟[铂金宝箱]',
      rewardText: formatTaskRewardText(operationData.boxCoin120 || '0-0', true),
      clickable: true,
      required: 120
    },
    {
      id: 5,
      title: '游戏在线240分钟[钻石宝箱]',
      rewardText: formatTaskRewardText(operationData.boxCoin240 || '0-0', true),
      clickable: true,
      required: 240
    }
  ];
}

function buildMonthlyTasks(operationData) {
  return [
    {
      id: 'a',
      title: '每月签到 3 天',
      rewardText: formatTaskRewardText(operationData.signlnCoin3 || '0', false),
      required: 3
    },
    {
      id: 'b',
      title: '每月签到 7 天',
      rewardText: formatTaskRewardText(operationData.signlnCoin7 || '0', false),
      required: 7
    },
    {
      id: 'c',
      title: '每月签到 14 天',
      rewardText: formatTaskRewardText(operationData.signlnCoin14 || '0', false),
      required: 14
    },
    {
      id: 'd',
      title: '每月签到 28 天',
      rewardText: formatTaskRewardText(operationData.signlnCoin28 || '0', false),
      required: 28
    }
  ];
}

function ensureTaskCardSkeleton(containerSelector, tasks, section) {
  var $container = $(containerSelector);
  var expectedIds = tasks.map(function (task) {
    return String(task.id);
  }).join(',');
  var currentIds = $container.find('.task-card').map(function () {
    return String($(this).attr('data-task-id'));
  }).get().join(',');

  if (currentIds === expectedIds && $container.find('.task-card').length === tasks.length) {
    return;
  }

  var html = tasks.map(function (task) {
    var taskId = String(task.id);
    var claimId = String(task.id);
    var clickableClass = task.clickable ? ' task-card--clickable' : '';
    return [
      '<div class="task-card' + clickableClass + '" data-section="' + section + '" data-task-id="' + taskId + '">',
      '  <h4 class="task-card__title"></h4>',
      '  <div class="task-card__reward"></div>',
      '  <div class="task-card__status is-loading">状态：读取中...</div>',
      '  <button type="button" class="task-card__btn claim-btn-' + claimId + '" data-claim-id="' + claimId + '">领取</button>',
      '</div>'
    ].join('');
  }).join('');

  $container.html(html);
}

function syncTaskCardMeta(containerSelector, tasks) {
  tasks.forEach(function (task) {
    var $card = $(containerSelector + ' .task-card[data-task-id="' + task.id + '"]');
    $card.toggleClass('task-card--clickable', !!task.clickable);
    $card.find('.task-card__title').text(task.title);
    $card.find('.task-card__reward').text('奖励：' + task.rewardText + ' 金币');
  });
}

function setTaskStatus(section, taskId, text, completed, isLoading) {
  var $status = $('.task-card[data-section="' + section + '"][data-task-id="' + taskId + '"] .task-card__status');
  if (!$status.length) {
    return;
  }

  $status.text(text);
  $status.removeClass('is-done is-loading');
  if (isLoading) {
    $status.addClass('is-loading');
  } else if (completed) {
    $status.addClass('is-done');
  }

  var snapshot = ensureTaskSnapshot(TASK_DETAIL_STATE.openId);
  if (snapshot && snapshot.status && snapshot.status[section]) {
    snapshot.status[section][String(taskId)] = {
      text: text,
      completed: !!completed,
      isLoading: !!isLoading
    };
  }
}

function setTaskClaimButton(taskId, options) {
  var $button = $('.claim-btn-' + taskId);
  if (!$button.length) {
    return;
  }

  var visible = !!options.visible;
  var claimed = !!options.claimed;
  var disabled = !!options.disabled;
  var text = options.text || (claimed ? '已领取' : '领取');

  $button.text(text);
  $button.prop('disabled', disabled || claimed);
  $button.toggleClass('is-claimed', claimed);
  $button.css('display', visible ? 'inline-flex' : 'none');

  var snapshot = ensureTaskSnapshot(TASK_DETAIL_STATE.openId);
  if (snapshot && snapshot.buttons) {
    snapshot.buttons[String(taskId)] = {
      visible: visible,
      claimed: claimed,
      disabled: disabled,
      text: text
    };
  }
}

function isTaskStatusLoading(section, taskId) {
  var $status = $('.task-card[data-section="' + section + '"][data-task-id="' + taskId + '"] .task-card__status');
  if (!$status.length) {
    return false;
  }

  return $status.hasClass('is-loading');
}

function applyClaimStatus(customer, seq, taskId, buttonVisibleWhenUnclaimed) {
  var numericTaskId = taskId;
  checkTaskClaimStatus(customer, numericTaskId).then(function (claimed) {
    if (!isTaskRequestCurrent(seq, customer.openid)) {
      return;
    }

    setTaskClaimButton(taskId, {
      visible: claimed ? true : buttonVisibleWhenUnclaimed,
      claimed: claimed,
      disabled: claimed,
      text: claimed ? '已领取' : '领取'
    });
  });
}

function renderDailyTaskProgress(seq, customer, operationData) {
  var dailyTasks = buildDailyTasks(operationData);
  var openId = customer.openid;
  dailyTasks.forEach(function (task) {
    if (!hasTaskButtonSnapshot(openId, task.id)) {
      setTaskClaimButton(task.id, {
        visible: false,
        claimed: false,
        disabled: false,
        text: '领取'
      });
    }
    if (!hasTaskStatusSnapshot(openId, 'daily', task.id)) {
      setTaskStatus('daily', task.id, '状态：读取中...', false, true);
    }
  });

  var browseTask = dailyTasks.filter(function (task) {
    return task.id === 1;
  })[0];

  getTaskBrowseProgress(customer).then(function (count) {
    if (!isTaskRequestCurrent(seq, customer.openid)) {
      return;
    }

    var done = count >= browseTask.required;
    setTaskStatus('daily', 1, '状态：' + (done ? '已完成 ✅' : '进行中') + ' (已浏览 ' + count + '/' + browseTask.required + ' 次)', done, false);
    if (done) {
      applyClaimStatus(customer, seq, 1, true);
    } else {
      setTaskClaimButton(1, { visible: false, claimed: false, disabled: false, text: '领取' });
    }
  }).catch(function () {
    if (!isTaskRequestCurrent(seq, customer.openid)) {
      return;
    }
    if (isTaskStatusLoading('daily', 1)) {
      setTaskStatus('daily', 1, '状态：读取失败', false, false);
    }
  });

  var onlineMinutes = Number(hzUserObj && hzUserObj.yxsc) || 0;
  [2, 3, 4, 5].forEach(function (taskId) {
    var task = dailyTasks.filter(function (item) {
      return item.id === taskId;
    })[0];
    var done = onlineMinutes >= task.required;
    setTaskStatus('daily', taskId, '状态：' + (done ? '已完成 ✅' : '进行中') + ' (已在线 ' + onlineMinutes + '/' + task.required + ' 分钟)', done, false);
    if (done) {
      applyClaimStatus(customer, seq, taskId, true);
    } else {
      setTaskClaimButton(taskId, { visible: false, claimed: false, disabled: false, text: '领取' });
    }
  });

  getTaskShareProgress(customer).then(function (shareCount) {
    if (!isTaskRequestCurrent(seq, customer.openid)) {
      return;
    }

    var done = shareCount >= 10;
    var text = '状态：' + (done ? '已完成 ✅' : '进行中') + ' (已分享 ' + shareCount + '/10 次)';
    if (done) {
      text += ' [奖励已自动发放]';
    }
    setTaskStatus('daily', 7, text, done, false);
    setTaskClaimButton(7, { visible: false, claimed: done, disabled: true, text: done ? '已发放' : '领取' });
  }).catch(function () {
    if (!isTaskRequestCurrent(seq, customer.openid)) {
      return;
    }
    if (isTaskStatusLoading('daily', 7)) {
      setTaskStatus('daily', 7, '状态：读取失败', false, false);
    }
  });
}

function renderMonthlyTaskProgress(seq, customer, operationData, signDay) {
  var monthlyTasks = buildMonthlyTasks(operationData);
  monthlyTasks.forEach(function (task) {
    var done = Number(signDay) >= Number(task.required);
    setTaskStatus('monthly', task.id, '状态：' + (done ? '已完成 ✅' : '进行中') + ' (已签到 ' + signDay + '/' + task.required + ' 天)', done, false);
    if (done) {
      applyClaimStatus(customer, seq, task.id, true);
    } else {
      setTaskClaimButton(task.id, { visible: false, claimed: false, disabled: false, text: '领取' });
    }
  });
}

function primeTaskCardPlaceholders(customer, operationData) {
  if (!customer || !customer.openid) {
    return;
  }

  var openId = customer.openid;

  buildDailyTasks(operationData).forEach(function (task) {
    if (!hasTaskButtonSnapshot(openId, task.id)) {
      setTaskClaimButton(task.id, {
        visible: false,
        claimed: false,
        disabled: false,
        text: '领取'
      });
    }
    if (!hasTaskStatusSnapshot(openId, 'daily', task.id)) {
      setTaskStatus('daily', task.id, '状态：读取中...', false, true);
    }
  });

  buildMonthlyTasks(operationData).forEach(function (task) {
    if (!hasTaskButtonSnapshot(openId, task.id)) {
      setTaskClaimButton(task.id, {
        visible: false,
        claimed: false,
        disabled: false,
        text: '领取'
      });
    }
    if (!hasTaskStatusSnapshot(openId, 'monthly', task.id)) {
      setTaskStatus('monthly', task.id, '状态：读取中...', false, true);
    }
  });
}

function getTaskCachedSignDay(openId) {
  if (typeof getUserReportCachedResponse !== 'function') {
    return null;
  }

  var cached = getUserReportCachedResponse(openId);
  if (!cached || !cached.data) {
    return null;
  }

  var signDay = Number(cached.data.day);
  return Number.isFinite(signDay) ? signDay : null;
}

function scheduleTaskDetailPreload(reason, delay) {
  var customer = getTaskCustomer();
  if (!customer || !$('#dailyTasks').length || !$('#monthlyTasks').length) {
    return;
  }

  if (TASK_DETAIL_STATE.preloadTimer) {
    clearTimeout(TASK_DETAIL_STATE.preloadTimer);
  }

  TASK_DETAIL_STATE.preloadTimer = setTimeout(function () {
    TASK_DETAIL_STATE.preloadTimer = null;

    var now = Date.now();
    var hasSnapshot = !!getTaskSnapshot(customer.openid);
    if (
      hasSnapshot &&
      String(TASK_DETAIL_STATE.openId || '') === String(customer.openid) &&
      now - Number(TASK_DETAIL_STATE.lastPreloadAt || 0) < 4000
    ) {
      applyTaskSnapshot(customer.openid);
      return;
    }

    TASK_DETAIL_STATE.lastPreloadAt = now;
    loadTaskDetail();
  }, typeof delay === 'number' ? delay : 0);
}

function isTaskDetailVisible() {
  return $('#taskDetail').is(':visible');
}

function stopTaskDetailAutoRefresh() {
  if (TASK_DETAIL_STATE.autoRefreshTimer) {
    clearTimeout(TASK_DETAIL_STATE.autoRefreshTimer);
    TASK_DETAIL_STATE.autoRefreshTimer = null;
  }
}

function scheduleTaskDetailAutoRefresh(reason, delay) {
  stopTaskDetailAutoRefresh();

  TASK_DETAIL_STATE.autoRefreshTimer = setTimeout(function () {
    TASK_DETAIL_STATE.autoRefreshTimer = null;

    if (!isTaskDetailVisible() || document.hidden) {
      return;
    }

    loadTaskDetail();
    scheduleTaskDetailAutoRefresh(reason || 'poll', TASK_DETAIL_STATE.autoRefreshInterval);
  }, typeof delay === 'number' ? delay : TASK_DETAIL_STATE.autoRefreshInterval);
}

function bindTaskDetailAutoRefresh() {
  if (TASK_DETAIL_STATE.autoBound) {
    return;
  }

  TASK_DETAIL_STATE.autoBound = true;

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      stopTaskDetailAutoRefresh();
      return;
    }

    if (isTaskDetailVisible()) {
      loadTaskDetail();
      scheduleTaskDetailAutoRefresh('visibility', TASK_DETAIL_STATE.autoRefreshInterval);
    }
  });

  window.addEventListener('pageshow', function () {
    if (!document.hidden && isTaskDetailVisible()) {
      loadTaskDetail();
      scheduleTaskDetailAutoRefresh('pageshow', TASK_DETAIL_STATE.autoRefreshInterval);
    }
  });

  window.addEventListener('pagehide', function () {
    stopTaskDetailAutoRefresh();
  });
}

function startTaskDetailAutoRefresh(reason) {
  bindTaskDetailAutoRefresh();
  loadTaskDetail();
  scheduleTaskDetailAutoRefresh(reason || 'enter', TASK_DETAIL_STATE.autoRefreshInterval);
}

function handleTaskCardAction(taskId) {
  var id = String(taskId);
  if (id === '7') {
    if (typeof openInviteFriendModal === 'function') {
      openInviteFriendModal();
    }
    return;
  }

  if (id === '1') {
    if (typeof openAllGameModal === 'function') {
      openAllGameModal();
    }
    return;
  }

  if (id === '2' || id === '3' || id === '4' || id === '5') {
    window.open('https://hz.5cq.com/', '_blank');
  }
}

function loadTaskDetail() {
  var customer = getTaskCustomer();
  if (!customer) {
    return;
  }

  var now = Date.now();
  if (
    String(TASK_DETAIL_STATE.openId || '') === String(customer.openid) &&
    now - Number(TASK_DETAIL_STATE.lastLoadAt || 0) < 300
  ) {
    applyTaskSnapshot(customer.openid);
    return;
  }

  bindTaskDetailEvents();
  TASK_DETAIL_STATE.seq += 1;
  TASK_DETAIL_STATE.openId = customer.openid;
  // load persisted claimed state for this user from localStorage
  try { loadClaimedMapForOpenId(customer.openid); } catch (e) {}
  TASK_DETAIL_STATE.lastLoadAt = now;
  var seq = TASK_DETAIL_STATE.seq;

  getTaskOperationData().then(function (opData) {
    if (!isTaskRequestCurrent(seq, customer.openid)) {
      return;
    }

    var dailyTasks = buildDailyTasks(opData);
    var monthlyTasks = buildMonthlyTasks(opData);
    ensureTaskCardSkeleton('#dailyTasks', dailyTasks, 'daily');
    ensureTaskCardSkeleton('#monthlyTasks', monthlyTasks, 'monthly');
    syncTaskCardMeta('#dailyTasks', dailyTasks);
    syncTaskCardMeta('#monthlyTasks', monthlyTasks);
    applyTaskSnapshot(customer.openid);
    primeTaskCardPlaceholders(customer, opData);

    var cachedSignDay = getTaskCachedSignDay(customer.openid);
    if (cachedSignDay !== null) {
      renderMonthlyTaskProgress(seq, customer, opData, cachedSignDay);
    }

    renderDailyTaskProgress(seq, customer, opData);

    return getTaskReportResponse().then(function (reportRes) {
      if (!isTaskRequestCurrent(seq, customer.openid)) {
        return;
      }
      var signDay = Number(reportRes && reportRes.data && reportRes.data.day) || 0;
      renderMonthlyTaskProgress(seq, customer, opData, signDay);
    }).catch(function () {
      if (!isTaskRequestCurrent(seq, customer.openid)) {
        return;
      }
      buildMonthlyTasks(opData).forEach(function (task) {
        if (isTaskStatusLoading('monthly', task.id)) {
          setTaskStatus('monthly', task.id, '状态：读取失败', false, false);
        }
      });
    });
  }).catch(function (err) {
    console.error('加载任务中心失败:', err);
  });
}

function showDailyTaskHelp() {
  var helpContent = '日常任务是获得金币的主要渠道。<br>任务1需要在个人中心的邀请好友按钮的弹框中完成，每次都可以获得10金币。';
  var html = [
    '<div id="dailyTaskHelpModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; justify-content: center; align-items: center;" onclick="closeDailyTaskHelp()">',
    '  <div style="background: #fff; padding: 30px; border-radius: 12px; max-width: 500px; width: 90%; position: relative; box-shadow: 0 4px 20px rgba(0,0,0,0.3);" onclick="event.stopPropagation()">',
    '    <h3 style="margin-top: 0; color: #ff6a00; border-bottom: 2px solid #ff9800; padding-bottom: 10px;">日常任务说明</h3>',
    '    <div style="margin: 20px 0; line-height: 1.8; color: #333; font-size: 14px;">' + helpContent + '</div>',
    '    <button onclick="closeDailyTaskHelp()" style="background: #ff9800; color: #fff; border: none; padding: 10px 30px; border-radius: 6px; cursor: pointer; font-size: 14px; margin-top: 15px;">关闭</button>',
    '  </div>',
    '</div>'
  ].join('');
  $('body').append(html);
}

function closeDailyTaskHelp() {
  $('#dailyTaskHelpModal').remove();
}

function claimTaskReward(taskId) {
  var normalizedTaskId = String(taskId);
  var $button = $('.claim-btn-' + normalizedTaskId);
  var claimType = getTaskClaimType(normalizedTaskId);
  if ($button.prop('disabled')) {
    return;
  }

  $button.prop('disabled', true);

  if (normalizedTaskId === '7') {
    layer.msg('系统已自动发放');
    $button.prop('disabled', false);
  } else if (claimType != null) {
    addCoin(claimType, callback.bind(null, normalizedTaskId), callback2.bind(null, normalizedTaskId));
  } else {
    $button.prop('disabled', false);
  }
}

function callback2(taskId) {
  var $button = $('.claim-btn-' + taskId);
  if ($button.hasClass('is-claimed')) {
    return;
  }
  $button.prop('disabled', false);
}

function callback(taskId) {
  var customer = getUser();
  var claimType = getTaskClaimType(taskId);
  if (customer && customer.openid) {
    if (claimType != null) {
      TASK_DETAIL_STATE.claimedMap[getTaskClaimCacheKey(customer.openid, claimType)] = true;
    }
  }

  // persist claimed state for this user
  try { saveClaimedMapForOpenId(customer.openid); } catch (e) {}

  setTaskClaimButton(taskId, {
    visible: true,
    claimed: true,
    disabled: true,
    text: '已领取'
  });
}
