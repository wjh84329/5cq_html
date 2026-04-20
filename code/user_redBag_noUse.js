// 页面加载时检查红包 不用检查，红包功能暂时不用
// $(function(){
//   checkRedBags();
// });

// 红包数据管理
var redBagData = [];

// 检查红包
function checkRedBags(){
  admin.req({
    url: baseUrl + 'jax/welfare/selectWelfareAll_new'
  }).done(function(res){
    console.log('红包接口返回数据:', res);
    if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
      redBagData = res.data;
      $('#redBagCount').text(redBagData.length);
      $('#redBagBtnContainer').show();
    } else {
      $('#redBagBtnContainer').hide();
    }
  }).fail(function(){
    console.log('获取红包失败');
    $('#redBagBtnContainer').hide();
  });
}

// 打开红包弹窗
function openRedBagModal(){
  layui.use(['layer'], function(){
    var layer = layui.layer;
    
    if (redBagData.length === 0) {
      layer.msg('暂无红包');
      return;
    }
    
    // 构建红包HTML
    var redBagHtml = '<div style="padding: 20px;"><div class="red-bag-list" style="display: flex; flex-wrap: wrap; gap: 20px;">';
    
    redBagData.forEach(function(bag, index){
    var countdown = calculateCountdown(bag.deadline);
    redBagHtml += '<div style="width: 200px; text-align: center;">' +
        '<img src="../statics/images/redbag2.png" style="width: 120px; height: 120px; margin-bottom: 10px; cursor: pointer;" data-id="' + bag.id + '" data-money="' + (bag.money || 0) + '">' +
        '<div style="font-size: 14px; margin-bottom: 5px;" class="countdown" data-deadline="' + bag.deadline + '">倒计时: ' + countdown.days + '天' + countdown.hours + '小时' + countdown.minutes + '分钟' + countdown.seconds + '秒</div>' +
        '<div style="font-size: 14px; margin-bottom: 5px;">剩余数量: ' + (bag.occupy || 0) + '/' + (bag.total || 0) + '</div>' +
        '</div>';
    });
    
    redBagHtml += '</div></div>';
    
    layer.open({
      type: 1,
      title: '可抢红包',
      area: ['800px', '300px'],
      shade: 0.3,
      content: redBagHtml,
      end: function(){
        // 弹窗关闭时刷新红包信息
        checkRedBags();
      }
    });
    
    // 实时更新倒计时
    var countdownInterval = setInterval(function(){
    $('.countdown').each(function(){
        var deadline = $(this).data('deadline');
        var countdown = calculateCountdown(deadline);
        $(this).text('倒计时: ' + countdown.days + '天' + countdown.hours + '小时' + countdown.minutes + '分钟' + countdown.seconds + '秒');
    });
    }, 1000);
    
    // 点击红包图片抢红包
    setTimeout(function(){
      $('.layui-layer-content').on('click', 'img[data-id]', function(){
        var welfareid = $(this).data('id');
        var money = $(this).data('money');
        
        // 获取open_id
        var user = getUser ? getUser(1) : null;
        var open_id = user ? user.openid : '';
        
        if (!open_id) {
        layer.msg('请先登录');
        return;
        }
        
        // 抢红包
        admin.req({
        url: baseUrl + 'jax/welfare/seckill_new',
        data: {
            open_id: open_id,
            welfareid: welfareid
        }
        }).done(function(res){
        if (res.code === 0) {
            layer.msg('恭喜成功抢到红包，价值' + money + '元');
        } else {
            layer.msg(res.msg || '抢红包失败');
        }
        // 刷新红包信息
        checkRedBags();
        // 直接更新弹窗内容
        setTimeout(function(){
            if (redBagData.length === 0) {
            $('.layui-layer-content').html('<div style="padding: 20px; text-align: center;">暂无红包</div>');
            return;
            }
            
            // 构建新的红包列表HTML
            var newRedBagListHtml = '';
            
            redBagData.forEach(function(bag, index){
            var countdown = calculateCountdown(bag.deadline);
            newRedBagListHtml += '<div style="width: 200px; text-align: center;">' +
                '<img src="../statics/images/redbag2.png" style="width: 120px; height: 120px; margin-bottom: 10px; cursor: pointer;" data-id="' + bag.id + '" data-money="' + (bag.money || 0) + '">' +
                '<div style="font-size: 14px; margin-bottom: 5px;" class="countdown" data-deadline="' + bag.deadline + '">倒计时: ' + countdown.days + '天' + countdown.hours + '小时' + countdown.minutes + '分钟' + countdown.seconds + '秒</div>' +
                '<div style="font-size: 14px; margin-bottom: 5px;">剩余数量: ' + (bag.occupy || 0) + '/' + (bag.total || 0) + '</div>' +
                '</div>';
            });
            
            // 只更新红包列表部分
            $('.red-bag-list').html(newRedBagListHtml);
            
            // 重新绑定点击事件
            $('.layui-layer-content').off('click', 'img[data-id]').on('click', 'img[data-id]', function(){
            var welfareid = $(this).data('id');
            var money = $(this).data('money');
            
            // 获取open_id
            var user = getUser ? getUser(1) : null;
            var open_id = user ? user.openid : '';
            
            if (!open_id) {
                layer.msg('请先登录');
                return;
            }
            
            // 抢红包
            admin.req({
                url: baseUrl + 'jax/welfare/seckill_new',
                data: {
                open_id: open_id,
                welfareid: welfareid
                }
            }).done(function(res){
                if (res.code === 0) {
                layer.msg('恭喜成功抢到红包，价值' + money + '元');
                } else {
                layer.msg(res.msg || '抢红包失败');
                }
                // 刷新红包信息
                checkRedBags();
                // 直接更新弹窗内容
                setTimeout(function(){
                if (redBagData.length === 0) {
                    $('.layui-layer-content').html('<div style="padding: 20px; text-align: center;">暂无红包</div>');
                    return;
                }
                
                // 构建新的红包列表HTML
                var newRedBagListHtml = '';
                
                redBagData.forEach(function(bag, index){
                    var countdown = calculateCountdown(bag.deadline);
                    newRedBagListHtml += '<div style="width: 200px; text-align: center;">' +
                    '<img src="../statics/images/redbag2.png" style="width: 120px; height: 120px; margin-bottom: 10px; cursor: pointer;" data-id="' + bag.id + '" data-money="' + (bag.money || 0) + '">' +
                    '<div style="font-size: 14px; margin-bottom: 5px;" class="countdown" data-deadline="' + bag.deadline + '">倒计时: ' + countdown.days + '天' + countdown.hours + '小时' + countdown.minutes + '分钟' + countdown.seconds + '秒</div>' +
                    '<div style="font-size: 14px; margin-bottom: 5px;">剩余数量: ' + (bag.occupy || 0) + '/' + (bag.total || 0) + '</div>' +
                    '</div>';
                });
                
                // 只更新红包列表部分
                $('.red-bag-list').html(newRedBagListHtml);
                }, 500);
            }).fail(function(){
                layer.msg('网络异常，请稍后再试');
                // 刷新红包信息
                checkRedBags();
            });
            });
        }, 500);
        }).fail(function(){
          layer.msg('网络异常，请稍后再试');
          // 刷新红包信息
          checkRedBags();
        });
      });
    }, 100);
    
    // 清除倒计时定时器
    layer.on('close', function(){
      clearInterval(countdownInterval);
    });
  });
}

// 计算倒计时
function calculateCountdown(deadline) {
  if (!deadline) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  
  var now = new Date().getTime();
  var endTime = new Date(deadline).getTime();
  var distance = endTime - now;
  
  if (distance < 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  
  var days = Math.floor(distance / (1000 * 60 * 60 * 24));
  var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  var seconds = Math.floor((distance % (1000 * 60)) / 1000);
  
  return { days, hours, minutes, seconds };
}