// ====== 任务中心功能 ======
function loadTaskDetail() {
  var customer = getUser(1);
  if (!customer) return;

  // 检查全局变量operationData是否有值
  if (Object.keys(operationData).length === 0) {
      // 如果没有值，调用接口获取
      admin.req({
      url: hzRequestUrl + 'business/operation'
      }).done(function(operationRes) {
      if (operationRes && operationRes.data) {
          // 存储到全局变量
          operationData = operationRes.data;
          
          // 获取用户签到天数
          loadTaskDetailWithOperationData(operationData, customer);
      }
      }).fail(function() {
      console.error('获取任务奖励信息失败');
      });
  } else {
      // 如果有值，直接使用
      loadTaskDetailWithOperationData(operationData, customer);
  }
}

// 使用operationData加载任务详情
function loadTaskDetailWithOperationData(operationData, customer) {

  // 渲染日常任务
  renderDailyTasks(operationData);

  // 获取用户签到天数
  $.ajax({
    url: hzRequestUrl + 'user/user_report',
    type: 'GET',
    dataType: 'json',
    data: {
      open_id: customer.openid
    },
    headers: {
      'boxVersion': '1.0.0',
      'token':$.cookie('hzusertoken')
    },
    success: function(reportRes) {
      var signDay = 0;
      if (reportRes && reportRes.data && reportRes.data.day) {
        signDay = reportRes.data.day;
      }
      // 渲染月度任务
      renderMonthlyTasks(operationData, signDay);
    },
    error: function() {
      console.log("渲染日常任务失败");
      console.error('获取用户签到天数失败');
      // 即使获取失败，也渲染任务列表
      renderMonthlyTasks(operationData, 0);
    }
  });
}

// 渲染日常任务
function renderDailyTasks(operationData) {
  var customer = getUser(1);
  var lookGameNumber = operationData.lookGameNumber || 10;
  var dailyTasks = [
    {
      id: 7,
      name: '邀请好友分享链接并识别到点开一次',
      reward: 10
    },
    {
      id: 1,
      name: '浏览个人中心的游戏' + lookGameNumber + '次',
      reward: operationData.lookGame || '0'
    },
    {
      id: 2,
      name: '游戏在线30分钟[白银宝箱]',
      reward: operationData.boxCoin30 || '0-0'
    },
    {
      id: 3,
      name: '游戏在线60分钟[黄金宝箱]',
      reward: operationData.boxCoin60 || '0-0'
    },
    {
      id: 4,
      name: '游戏在线120分钟[铂金宝箱]',
      reward: operationData.boxCoin120 || '0-0'
    },
    {
      id: 5,
      name: '游戏在线240分钟[钻石宝箱]',
      reward: operationData.boxCoin240 || '0-0'
    }
  ];
  
  var html = '';
  dailyTasks.forEach(function(task) {
    var rewardText = task.reward;
    // 处理范围值
    if (String(task.reward).includes('-')) {
      var range = String(task.reward).split('-');
      var min = parseInt(range[0]) / 2;
      var max = parseInt(range[1]) / 2;
      rewardText = Math.floor(min) + '-' + Math.floor(max);
    }
    
    // 为不同任务设置不同的点击事件
    var clickEvent = '';
    if (task.id === 7) {
      clickEvent = "leftMenu(this, 11); openInviteFriendModal();";
    } else if (task.id === 1) {
      clickEvent = "leftMenu(this, 11); openAllGameModal();";
    } else if ([2, 3, 4, 5].includes(task.id)) {
      clickEvent = "window.open('https://hz.5cq.com/', '_blank');";
    }
    
    html += `
      <div class="task-card" data-task-id="${task.id}" style="border: 1px solid #ff9800; border-radius: 8px; padding: 15px; background: rgba(255, 152, 0, 0.1); transition: all 0.3s ease; cursor: pointer; position: relative;" onclick="${clickEvent}" onmouseover="this.style.transform='scale(1.02)'; this.style.boxShadow='0 4px 12px rgba(255, 152, 0, 0.3)';" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none';">
        <h4 style="margin-top: 0; margin-bottom: 10px;">${task.name}</h4>
        <div style="color: #ff6a00; font-weight: bold;">奖励：${rewardText} 金币</div>
        <div class="bx_status_${task.id}" style="margin-top: 10px; color: #999; font-size: 14px;">状态：进行中</div>
        <button class="claim-btn-${task.id}" onclick="event.stopPropagation(); claimTaskReward(${task.id})" style="position: absolute; right: 15px; bottom: 15px; background: linear-gradient(135deg, #ff9800, #ff6a00); color: white; border: none; padding: 8px 20px; border-radius: 20px; cursor: pointer; font-size: 13px; font-weight: bold; box-shadow: 0 2px 8px rgba(255, 152, 0, 0.4); display: none;" onmouseover="this.style.transform='scale(1.1)'; this.style.boxShadow='0 4px 12px rgba(255, 152, 0, 0.6)';" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 2px 8px rgba(255, 152, 0, 0.4)';">领取</button>
      </div>
    `;
  });
  
  $('#dailyTasks').html(html);
  
  // 获取任务 1 的进度
  if (customer && customer.openid) {
    admin.req({
      url: baseUrl + 'ranking/countTodayPublishBrowse',
      data: {
        openid: customer.openid
      },
      success: function(res) {
        if (res) {
          var completedCount = res.data;
          var statusElement = $('.bx_status_1');
          var isCompleted = completedCount >= lookGameNumber;
          var statusText = isCompleted ? '已完成 ✅' : '进行中';
          var statusClass = isCompleted ? 'color: #22c55e;' : 'color: #999;';
          statusElement.html(`状态：${statusText} (已浏览 ${completedCount}/${lookGameNumber} 次)`);
          statusElement.attr('style', `margin-top: 10px; ${statusClass} font-size: 14px;`);
          
          // 显示或隐藏领取按钮
          var claimBtn = $('.claim-btn-1');
          if (isCompleted) {
            // 检查是否已领取
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
                id: 1
              },
              success: function(checkRes) {
                if (checkRes && checkRes.code === 200 && checkRes.data === true) {
                  claimBtn.show();
                  callback(1);
                } else {
                  claimBtn.show();
                }
              },
              error: function(err) {
                console.error('检查任务 1 领取状态失败:', err);
                claimBtn.show();
              }
            });
          } else {
            claimBtn.hide();
          }
        }
      },
      error: function(err) {
        console.error('获取任务 1 进度失败:', err);
      }
    });
  }

  // 获取任务2的进度
  var minutes = Number(hzUserObj.yxsc || 0);
  
  // 定义任务配置数组
  var onlineTasks = [
    { id: 2, requiredMinutes: 30 },
    { id: 3, requiredMinutes: 60 },
    { id: 4, requiredMinutes: 120 },
    { id: 5, requiredMinutes: 240 }
  ];
  
  // 循环处理每个在线时长任务
  onlineTasks.forEach(function(task) {
    var taskElement = $('.bx_status_' + task.id);
    var taskCompleted = minutes >= task.requiredMinutes;
    var taskText = taskCompleted ? '已完成 ✅' : '进行中';
    var taskClass = taskCompleted ? 'color: #22c55e;' : 'color: #999;';
    taskElement.html(`状态：${taskText} (已在线 ${minutes}/${task.requiredMinutes} 分钟)`);
    taskElement.attr('style', `margin-top: 10px; ${taskClass} font-size: 14px;`);
    
    // 显示或隐藏领取按钮
    var claimBtn = $('.claim-btn-' + task.id);
    if (taskCompleted) {
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
          id: task.id
        },
        success: function(checkRes) {
          if (checkRes && checkRes.code === 200 && checkRes.data === true) {
            claimBtn.show();
            callback(task.id);
          } else {
            claimBtn.show();
          }
        },
        error: function(err) {
          console.error('检查任务' + task.id + '领取状态失败:', err);
          claimBtn.show();
        }
      });
    } else {
      claimBtn.hide();
    }
  });


    


  // 获取任务七的进度
  $.ajax({
    url: hzRequestUrl + 'kill/today_share_count',
    type: 'GET',
    headers: {
        boxVersion: '1.0.0',
        'token':$.cookie('hzusertoken')
    },
    dataType: 'json',
    data: {
        open_id: customer.openid
    },
    success: function (response) {
        if (response.code === 200) {
            var shareCount = Number(response.data.today_share_count);
            
            // 更新任务七的状态（10 次分享）
            var task7Element = $('.bx_status_7');
            var task7Completed = shareCount >= 10;
            var task7Text = task7Completed ? '已完成 ✅' : '进行中';
            var task7Class = task7Completed ? 'color: #22c55e;' : 'color: #999;';
            task7Element.html(`状态：${task7Text} (已分享 ${shareCount}/10 次)`);
            task7Element.attr('style', `margin-top: 10px; ${task7Class} font-size: 14px;`);
            
            // 显示或隐藏领取按钮
            var claimBtn7 = $('.claim-btn-7');
            if (task7Completed) {
              task7Element.html(`状态：${task7Text} (已分享 ${shareCount}/10 次)[奖励已自动发放]`);
              //claimBtn7.show();
            } else {
              claimBtn7.hide();
            }
        } else {
            console.error('Failed to fetch game time info:', response.message);
        }
    },
    error: function (error) {
        console.error('Error fetching game time info:', error);
    }
  });
}

// 渲染月度任务
function renderMonthlyTasks(operationData, signDay) {
  var customer = getUser(1);
  var monthlyTasks = [
    {
      id: 'a',
      name: '每月签到 3 天',
      required: 3,
      reward: operationData.signlnCoin3 || '0'
    },
    {
      id: 'b',
      name: '每月签到 7 天',
      required: 7,
      reward: operationData.signlnCoin7 || '0'
    },
    {
      id: 'c',
      name: '每月签到 14 天',
      required: 14,
      reward: operationData.signlnCoin14 || '0'
    },
    {
      id: 'd',
      name: '每月签到 28 天',
      required: 28,
      reward: operationData.signlnCoin28 || '0'
    }
  ];
  
  var html = '';
  monthlyTasks.forEach(function(task) {
    var isCompleted = signDay >= task.required;
    var statusText = isCompleted ? '已完成 ✅' : '进行中';
    var statusClass = isCompleted ? 'color: #22c55e;' : 'color: #999;';
    
    html += `
      <div class="task-card" data-task-id="${task.id}" style="border: 1px solid #ff9800; border-radius: 8px; padding: 15px; background: rgba(255, 152, 0, 0.1); transition: all 0.3s ease; cursor: pointer; position: relative;" onclick="leftMenu(this, 11);" onmouseover="this.style.transform='scale(1.02)'; this.style.boxShadow='0 4px 12px rgba(255, 152, 0, 0.3)';" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none';">
        <h4 style="margin-top: 0; margin-bottom: 10px;">${task.name}</h4>
        <div style="color: #ff6a00; font-weight: bold;">奖励：${task.reward} 金币</div>
        <div style="margin-top: 10px; font-size: 14px; ${statusClass}">状态：${statusText} (已签到 ${signDay}/${task.required} 天)</div>
        <button class="claim-btn-${task.id}" onclick="event.stopPropagation(); claimTaskReward('${task.id}')" style="display:none;position: absolute; right: 15px; bottom: 15px; background: linear-gradient(135deg, #ff9800, #ff6a00); color: white; border: none; padding: 8px 20px; border-radius: 20px; cursor: pointer; font-size: 13px; font-weight: bold; box-shadow: 0 2px 8px rgba(255, 152, 0, 0.4); " onmouseover="this.style.transform='scale(1.1)'; this.style.boxShadow='0 4px 12px rgba(255, 152, 0, 0.6)';" onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 2px 8px rgba(255, 152, 0, 0.4)';">领取</button>
      </div>
    `;
  });
  
  $('#monthlyTasks').html(html);
  
  // 为每个已完成的任务检查是否已领取
  if (customer && customer.openid) {
    monthlyTasks.forEach(function(task) {
      var isCompleted = signDay >= task.required;
      if (isCompleted) {
        var claimBtn = $('.claim-btn-' + task.id);
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
            id: task.id
          },
          success: function(checkRes) {
            if (checkRes && checkRes.code === 200 && checkRes.data === true) {
              claimBtn.show();
              callback(task.id);
            } else {
              claimBtn.show();
            }
          },
          error: function(err) {
            console.error('检查月度任务' + task.id + '领取状态失败:', err);
            claimBtn.show();
          }
        });
      }
    });
  }
}

// 显示日常任务说明弹窗
function showDailyTaskHelp() {
  var helpContent = '日常任务是获得金币的主要渠道。<br>任务1需要在个人中心的邀请好友按钮的弹框中完成，每次都可以获得10金币。'; // TODO: 请在此处填写具体的说明内容
  var html = `
    <div id="dailyTaskHelpModal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 10000; display: flex; justify-content: center; align-items: center;" onclick="closeDailyTaskHelp()">
      <div style="background: #fff; padding: 30px; border-radius: 12px; max-width: 500px; width: 90%; position: relative; box-shadow: 0 4px 20px rgba(0,0,0,0.3);" onclick="event.stopPropagation()">
        <h3 style="margin-top: 0; color: #ff6a00; border-bottom: 2px solid #ff9800; padding-bottom: 10px;">日常任务说明</h3>
        <div style="margin: 20px 0; line-height: 1.8; color: #333; font-size: 14px;">
          ${helpContent}
        </div>
        <button onclick="closeDailyTaskHelp()" style="background: #ff9800; color: #fff; border: none; padding: 10px 30px; border-radius: 6px; cursor: pointer; font-size: 14px; margin-top: 15px;">关闭</button>
      </div>
    </div>
  `;
  $('body').append(html);
}

// 关闭日常任务说明弹窗
function closeDailyTaskHelp() {
  $('#dailyTaskHelpModal').remove();
}

// 领取任务奖励的统一函数
function claimTaskReward(taskId) {

  $('.claim-btn-' + taskId).prop('disabled', true);

  if (taskId === 'a') {
    addCoin(2, callback.bind(null, taskId), callback2.bind(null, taskId));
  } else if (taskId === 'b') {
    addCoin(3, callback.bind(null, taskId), callback2.bind(null, taskId));
  } else if (taskId === 'c') {
    addCoin(4, callback.bind(null, taskId), callback2.bind(null, taskId));
  } else if (taskId === 'd') {
    addCoin(5, callback.bind(null, taskId), callback2.bind(null, taskId));
  } else if(taskId === 7) {
    layer.msg('系统已自动发放');
  } else if(taskId === 1) {
    addCoin(10, callback.bind(null, taskId), callback2.bind(null, taskId)); // 10
  } else if(taskId === 2) {
    addCoin(11, callback.bind(null, taskId), callback2.bind(null, taskId));
  } else if(taskId === 3) {
    addCoin(12, callback.bind(null, taskId), callback2.bind(null, taskId));
  } else if(taskId === 4) {
    addCoin(13, callback.bind(null, taskId), callback2.bind(null, taskId));
  } else if(taskId === 5) {
    addCoin(14, callback.bind(null, taskId), callback2.bind(null, taskId));
  }
}

function callback2(taskId, response) {
  $('.claim-btn-' + taskId).prop('disabled', false);
}

function callback(taskId, response) {
  $('.claim-btn-' + taskId).prop('disabled', true);
  // 领完奖励后，把按钮置灰，不让再点击，把背景颜色改成灰色
  $('.claim-btn-' + taskId).css('background', '#ccc');
  // 把 hover 的样式去掉
  $('.claim-btn-' + taskId).removeAttr('onmouseover').removeAttr('onmouseout');
  // box-shadow 也去掉
  $('.claim-btn-' + taskId).css('box-shadow', 'none');
  // 把领取改成已领取
  $('.claim-btn-' + taskId).text('已领取');
}