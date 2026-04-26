
var coinRecord3 = null; // 累计签到3天奖励记录
var coinRecord7 = null; // 累计签到7天奖励记录
var coinRecord14 = null; // 累计签到14天奖励记录
var coinRecord21 = null; // 累计签到21天奖励记录
var coinRecord28 = null; // 累计签到28天奖励记录
var hzRequestUrl = 'https://hz.5cq.net/cq/'; // 替换为你的接口地址
//var hzRequestUrl = 'http://localhost:8000/cq/'; // 替换为你的接口地址
//var hzRequestUrl = 'http://192.168.1.89:8000/cq/' // 替换为你的接口地址

function getUserInfo() {
    var token = $.cookie('token');
    if (token == null || token == '') {
        return null;
    }

    var customer = getUser();
    if (!customer) {
        uiMsg('请先登录', { icon: 2 });
        if (typeof myLogin === 'function') myLogin();
        return;
    }

    setTimeout(function(){
        checkTimeCountMinites();
    }, 1500);

    getSignInfo();// 获取签到信息
}

function checkTimeCountMinites(){
    var customer = getUser();
    if (!customer) {
        uiMsg('请先登录', { icon: 2 });
        if (typeof myLogin === 'function') myLogin();
        return;
    }

    var minites = time_count / 60;

    for (var i = 1; i <= 4; i++) {
        var minite = 0;
        var fs = '';
        if (i == 1 && minites >= 30) {
            minite = 30;
            fs = ONLINE_REWARD_MAP[30].fs;
        } else if (i == 2 && minites >= 60) {
            minite = 60;
            fs = ONLINE_REWARD_MAP[60].fs;
        } else if (i == 3 && minites >= 120) {
            minite = 120;
            fs = ONLINE_REWARD_MAP[120].fs;
        } else if (i == 4 && minites >= 240) {
            minite = 240;
            fs = ONLINE_REWARD_MAP[240].fs;
        }

        if (fs == '') break;
        
        // 使用闭包保存当前循环的minite值
        (function(currentMinite) {
            $.ajax({
                url: hzRequestUrl + 'user/coin_info_today', // 按你实际接口
                type: 'GET',
                cache: false,
                headers: { 
                    boxVersion: '1.0.0', 
                    'token':$.cookie('hzusertoken')
                },
                dataType: 'json',
                data: { open_id: customer.openid, fs: fs, _t: Date.now() },
                success: function (response) {
                    console.log(response);
                    console.log("minites is " + currentMinite);
                    // if (response.code === 200 && response.data == null) {
                    //     $('#'+currentMinite+'minites').css('filter', 'grayscale(0%)');
                    //     console.log('签到'+currentMinite+'分钟奖励已领取');
                    // } else {
                    //     $('#'+currentMinite+'minites').css('filter', 'grayscale(100%)');
                    // }
                    $('#'+currentMinite+'minites').css('filter', 'grayscale(0%)');
                },
                error: function (xhr) { reject(xhr); }
            });
        })(minite);
    }
}

function updatePageByUserInfo(data){
    checkUserPhoneAndSfz();
    $('.phs-userinfo .phs-name').text(data.name);
    $('.headimg').attr('src', data.avatar);
    $('.phs-meta .lv').text(data.lv);
    $('.phs-meta .userid').text(data.id);
    $('.phs-meta .yxsc').text(data.total_yxsc);
    var coin_num_ = data.coin_num.replace(/\.\d+$/, '');
    $('.coin_num').text(coin_num_);
    $('.fuli').text(data.waelfare.replace(/\.\d+$/, ''));
    $('.money').text(data.money.replace(/\.\d+$/, ''));
    $('#bagGold').text('金币:' + coin_num_);
    $('#bagMoney').text('元宝:' + data.money.replace(/\.\d+$/, ''));
    $.cookie('up_id',data.id,{ path: '/' });
    // ✅ 把当前等级传进去做匹配
    getLevelList(data.lv);
    if (data.undone_num > 0) {
        $('#rwzx1').css("display", "inline-block");
        $('#rwzx2').show();
        $('#rwzx2').html(data.undone_num);
    } else {
        $('#rwzx1').css("display", "none");
    }
    
}

//获取盒子个人信息 NO USE
function getHzUser() {
    var customer = getUser();
    $.ajax({
        url: hzRequestUrl + 'user/get_user_info_h52',
        type: 'GET',
        headers: {
            boxVersion: '1.0.0',
            token: $.cookie('hzusertoken')
        },
        dataType: 'json',
        data: {
            open_id: customer.openid
        },
        success: function (response) {
            if (response.code === 200) {
                renewLoginCookies();
                var data = response.data;
                hzUserObj = data;
                checkUserPhoneAndSfz();
                $('.phs-userinfo .phs-name').text(data.name);
                $('.headimg').attr('src', data.avatar);
                $('.phs-meta .lv').text(data.lv);
                $('.phs-meta .yxsc').text(data.yxsc);
                $('.phs-meta .userid').text(data.id);
                var coin_num_ = data.coin_num.replace(/\.\d+$/, '');
                $('.coin_num').text(coin_num_);
                $('.fuli').text(data.waelfare.replace(/\.\d+$/, ''));
                $('.money').text(data.money.replace(/\.\d+$/, ''));
                $('#bagGold').text('金币:' + coin_num_);
                $('#bagMoney').text('元宝:' + data.money.replace(/\.\d+$/, ''));
                $.cookie('up_id',data.id,{ path: '/' });

                if (data.phone === null || data.phone === '') {
                    // 用户未绑定手机号
                    $('.phone-btn').text('去绑定');
                    $('.phone-btn').addClass('danger');
                    $('.phone-btn').off('click').on('click', function () {
                        // ✅ 优先用已有实现（你 user.html 里有 bindUser()）
                        if (typeof bindUser === 'function') {
                            bindUser();
                            return;
                        }

                        // ✅ 其次如果你真有 openPhoneBindPopup，就调用它
                        if (typeof openPhoneBindPopup === 'function') {
                            openPhoneBindPopup();
                            return;
                        }

                        // ✅ 最后兜底：手写弹窗（保留你原逻辑）
                        var html = '';
                        html += '<div class="tc login">';
                        html += '<form id="formBindUser">';
                        html += '<p><span>手机号：</span><input type="text" name="phoneUser" placeholder="手机号" maxlength="11" required></p>';
                        html += '<p><span>短信码：</span><input class="smscode" type="text" name="smsCodeUser" placeholder="手机验证码" maxlength="6" required>';
                        html += '<button type="button" id="sendCodeUser">发送验证</button></p>';
                        html += '<button type="button" id="bindUser" onclick="bindUserPhone()">绑定</button>';
                        html += '</form>';
                        html += '</div>';

                        layer.open({
                            type: 1,
                            title: "手机号绑定",
                            resize: !1,
                            move: !1,
                            zIndex: layer.zIndex,
                            area: ["460px", "250px"],
                            content: html,
                            success: function (layero) {
                                layer.setTop(layero);
                            },
                            end: function () {
                                // ✅ 不要直接 clearInterval(interval)，避免 interval 未定义或清错
                                if (window.__bindPhoneIntervalId) {
                                    window.clearInterval(window.__bindPhoneIntervalId);
                                    window.__bindPhoneIntervalId = null;
                                }
                            }
                        });
                    });
                } else {
                    // $('.phs-meta .phone').text(data.phone);
                    $('.phone-btn').text('已完成');
                    $('.phone-btn').removeClass('danger');
                    $('.phone-btn').off('click');
                }
                // ✅ 把当前等级传进去做匹配
                getLevelList(data.lv);
            } else {
                console.error('Failed to fetch customer info:', response.message);
                intervalId && window.clearInterval(intervalId);
            }
        },
        error: function (error) {
            console.error('Error fetching customer info:', error);
            intervalId && window.clearInterval(intervalId);
        }
    });
}
//获取签到信息
function getSignInfo() {
    var token = $.cookie('hzusertoken');
    if (!token) return;

    var customer = getUser();

    $.ajax({
        url: hzRequestUrl + 'user/user_report',
        type: 'GET',
        cache: false,
        headers: {
            boxVersion: '1.0.0',
            token: token
        },
        dataType: 'json',
        data: {
            open_id: customer.openid,
            _t: Date.now()
        },
        success: function (response) {
            if (!response) return;

            // ✅ 兼容后端：0/1/2/200 都是“正常返回”
            var code = String(response.code);
            var ok = (code === '0' || code === '1' || code === '2' || code === '200');
            if (!ok) {
                console.error('user_report unexpected code:', response.code, response);
                return;
            }

            var data = response.data || {};
            var msg = response.msg || '';

            $('.reportNum').text(data.day || '0');

            // ✅ 如果刚刚签到成功但报表接口还没体现出来：强制本次渲染为“今天已签”
            if (__todaySignedOverride) {
                if (!data.jt) {
                    data.jt = new Date().toISOString().replace('T', ' ').slice(0, 19);
                    var d = Number(data.day);
                    if (!Number.isFinite(d)) d = 0;
                    data.day = d + 1; // day 是“当月签到天数”，不要对 7 取 min
                    msg = '昨天已签到,当天已签到';
                }
                __todaySignedOverride = false;
            }

            renderPhsDays(data, msg);

            // if (response.data.jt) {
            //     $("#0minites").css('filter', 'grayscale(100%)');
            // } else {
            //     $("#0minites").css('filter', 'grayscale(0%)');
            // }
            $("#0minites").css('filter', 'grayscale(0%)');
        },
        error: function (xhr) {
            console.error('user_report error:', xhr);
        }
    });
}

// 防重复提交
var __signing = false;

// 本次页面周期内：刚刚完成了“今天签到”的标记（用于修正 UI 渲染）
var __todaySignedOverride = false;

// 从 msg 兜底判断今天是否已签到（仅兜底，优先用 jt）
function isTodaySignedByMsg(msg) {
    if (typeof msg !== 'string') return false;
    // 兼容你给的 msg： "昨天已签到,今天未签到"
    if (/今天未签到/.test(msg)) return false;
    return /今天已签到|今日已签到|今天已经签到|已签到/.test(msg);
}

// 统一判断“今天是否已签到”：以 jt 为准（后端约定：有 jt 就是今天已签）
function isTodaySigned(signData, msg) {
    return !!(signData && signData.jt);
}

/**
 * 渲染 7 天签到格子（今天位置随累计变化，7天一循环）
 */
function renderPhsDays(signData, msg) {
    var rewards = [
        { coin: 5, exp: 1 },
        { coin: 10, exp: 2 },
        { coin: 15, exp: 3 },
        { coin: 18, exp: 4 },
        { coin: 25, exp: 5 },
        { coin: 30, exp: 6 },
        { coin: 35, exp: 7 }
    ];

    var totalSigned = Number(signData && signData.day);
    if (!Number.isFinite(totalSigned)) totalSigned = 0;
    totalSigned = Math.max(0, totalSigned);

    // ✅ 用 jt 判断今天是否已签到
    var todaySigned = isTodaySigned(signData, msg);

    // 7天循环：取模定位
    var signedInCycle = totalSigned % 7; // 0..6
    if (todaySigned) {
        if (signedInCycle === 0 && totalSigned > 0) signedInCycle = 7; // 1..7
    }

    // 今天索引：已签落在已签最后一格；未签落在下一格
    var todayIndex = todaySigned ? (signedInCycle - 1) : signedInCycle;
    if (todayIndex < 0) todayIndex = 0;
    if (todayIndex > 6) todayIndex = 6;

    var html = '';
    for (var i = 0; i < 7; i++) {
        var r = rewards[i] || { coin: 0, exp: 0 };
        var isSigned = i < signedInCycle;
        var isToday = i === todayIndex;

        html += ''
            + '<div class="phs-day'
            + (isSigned ? ' signed' : '')
            + (isToday ? ' today' : '')
            + '" data-day="' + (i + 1) + '" data-today="' + (isToday ? '1' : '0') + '" data-signed="' + (isSigned ? '1' : '0') + '">'
            + '  <div class="d1">' + (isToday ? '今天' : ('第' + (i + 1) + '天')) + '</div>'
            + '  <div class="d2"></div>'
            + '  <div class="d3">金币+' + r.coin + ' 经验+' + r.exp + '</div>'
            + '</div>';
    }

    $('.phs-days').html(html);
}

// 仅允许点击“今天”这一格签到
$(document).off('click.phsSign').on('click.phsSign', '.phs-days .phs-day', function () {
    var $day = $(this);

    var token = $.cookie('hzusertoken');
    if (!token) {
        if (window.layer && layer.msg) layer.msg('请先登录');
        if (typeof myLogin === 'function') myLogin();
        return;
    }

    var label = ($day.find('.d1').text() || '').trim();
    var isToday = ($day.attr('data-today') === '1') || $day.hasClass('today') || label === '今天';
    var isSigned = ($day.attr('data-signed') === '1') || $day.hasClass('signed');

    if (!isToday) return;

    if (isSigned) {
        if (window.layer && layer.msg) layer.msg('今天已签到');
        return;
    }

    sign();
});

//点击签到
function sign(num) {
    if (__signing) return;

    var token = $.cookie('hzusertoken');
    if (!token) {
        uiMsg('请先登录', { icon: 2 });
        return;
    }

    __signing = true;

    fetchUserReport()
        .then(function (res) {
            var data = (res && res.data) || {};

            // ✅ 后端约定：有 jt 就是今天已签到
            if (data.jt) {
                if (num == 1) {
                    uiMsg('该奖励已领取', { icon: 0 });
                } else {
                    uiMsg('今天已签到', { icon: 1 });
                }
                // 顺便刷新一次UI，避免前端显示不一致
                renderPhsDays(data, res.msg || '');
                __signing = false;
                return Promise.reject('STOP'); // 中断后续 add_report
            }

            // 未签到：才真正调用 add_report
            var customer = getUser();
            return new Promise(function (resolve, reject) {
                $.ajax({
                    url: hzRequestUrl + 'user/add_report',
                    type: 'GET',
                    cache: false,
                    headers: {
                        boxVersion: '1.0.0',
                        'token':$.cookie('hzusertoken')
                    },
                    dataType: 'json',
                    data: { open_id: customer.openid, _t: Date.now() },
                    success: function (response) { resolve(response); },
                    error: function (xhr) { reject(xhr); }
                });
            });
        })
        .then(function (response) {
            console.log('Response from add_report:', response);

            if (response && String(response.code) === '200') {
                __todaySignedOverride = true;

                uiMsg(response.msg || '签到成功', {
                    icon: 1,
                    time: 1200,
                    end: function () {
                        // 先立刻让UI显示已签（避免等报表落库）
                        markTodaySignedInDom();

                        // 再同步后端状态
                        window.setTimeout(function () {
                            getSignInfo();
                            addCoin(1);
                        }, 1200);
                    }
                });
            } else {
                uiMsg((response && (response.msg || response.message)) || '签到失败', { icon: 2 });
            }
        })
        .catch(function (e) {
            // STOP 是我们手动中断，不算错误
            if (e !== 'STOP') console.error(e);
        })
        .finally(function () {
            __signing = false;
        });
}
//添加金币信息
function addCoin(type, callback, callback2) {
    var token = $.cookie('hzusertoken');
    if (token == null || token == '') return Promise.reject(new Error('no token'));

    var customer = getUser();
    $.ajax({
        url: hzRequestUrl + 'user/setCoin',
        type: 'POST',
        headers: {
            boxVersion: '1.0.0',
            'token':$.cookie('hzusertoken')
        },
        dataType: 'json',
        data: {
            open_id: customer.openid,
            type: type
        },
        success: function (response) {
            console.log('Response from addCoin:', response);
            if (response && String(response.code) === '200') {
                uiMsg(response.msg, { icon: 1 });
                getHzUser();
                if (typeof callback === 'function') callback();
            } else {
                uiMsg('奖励领取失败：' + ((response && (response.message || response.msg)) || ''), { icon: 2 });
                if (typeof callback2 === 'function') callback2();
            }
        },
        error: function (error) {
            console.error('Error during addCoin:', error);
            console.error('Error during addCoin status:', error.status);
            if (error.status === 429) {
                uiMsg('请求频率过快，请重试', { icon: 0 });
                if (typeof callback2 === 'function') callback2();
                return;
            }
            uiMsg('奖励领取请求出错，请稍后再试。', { icon: 2 });
            if (typeof callback2 === 'function') callback2();
        }
    });
}
function uiMsg(text, opts) {
    text = (text == null ? '' : String(text));
    opts = opts || {};

    var end = opts.end;
    if (typeof end === 'function') {
        // layer.msg 不吃 opts.end，需要当第三个参数传
        delete opts.end;
    }

    if (window.layer && typeof layer.msg === 'function') {
        return layer.msg(text, Object.assign({ time: 1800 }, opts), end);
    }

    console.log('[msg]', text);
    if (typeof end === 'function') end();
}

// 让“今天”格子立刻显示已签到（不依赖后端报表是否及时更新）
function markTodaySignedInDom() {
    var $today = $('.phs-days .phs-day.today');
    if (!$today.length) {
        $today = $('.phs-days .phs-day').filter(function () {
            return (($(this).find('.d1').text() || '').trim() === '今天')
                || $(this).attr('data-today') === '1';
        }).first();
    }
    if ($today.length) {
        $today.addClass('signed').attr('data-signed', '1');
    }
}
//查询单条金币记录
function getCoinRecord(fs) {
    return new Promise(function (resolve, reject) {
        var token = $.cookie('hzusertoken');
        if (!token) return reject(new Error('no token'));

        var customer = getUser();
        $.ajax({
            url: hzRequestUrl + 'user/coin_info_today', // 按你实际接口
            type: 'GET',
            cache: false,
            headers: { 
                boxVersion: '1.0.0', 
                'token':$.cookie('hzusertoken')
            },
            dataType: 'json',
            data: { open_id: customer.openid, fs: fs, _t: Date.now() },
            success: function (response) {
                if (String(response.code) === '200') return resolve(response.data);
                reject(new Error(response.message || response.msg || 'getCoinRecord failed'));
            },
            error: function (xhr) { reject(xhr); }
        });
    });
}
//获取用户等级列表
function getLevelList(currentLvName) {
    var list = levelInfoList;

    // ✅ 默认 1.00 倍
    var coinScale = 100;

    if (currentLvName) {
        var matched = list.find(function (it) {
            return String(it.level_name) === String(currentLvName);
        });
        var cs = matched && Number(matched.coin_scale);
        if (Number.isFinite(cs) && cs > 0) coinScale = cs;
    }

    $('.jiacheng').text((coinScale / 100).toFixed(2));

    var html = '';
    list.forEach(function (item) {
        html += '<div class="level-item">';
        html += '  <div class="level-name">' + (item.level_name || '') + '</div>';
        html += '  <div class="level-exp">经验要求: ' + (item.level_time || 0) + '</div>';
        html += '</div>';
    });
    $('.level-list').html(html);
}

// 在线时长奖励映射（按你后端 setCoin(type) 实际类型号调整）
var ONLINE_REWARD_MAP = {
    30: { type: 42, fs: '网页白银宝箱' },
    60: { type: 43, fs: '网页黄金宝箱' },
    120: { type: 44, fs: '网页铂金宝箱' },
    240: { type: 45, fs: '网页钻石宝箱' }
};

function parseMinuteFromText(text) {
    text = (text || '').trim();
    var m = text.match(/在线\s*(\d+)\s*分钟/);
    return m ? Number(m[1]) : NaN;
}

$('.game-btn').on('click', function () {
    // ✅ 这里直接打开游戏链接，避免不必要的接口调用和复杂逻辑
    window.open('http://hz.5cq.com/', '_blank');
});

$('.ts-btn').on('click', function () {
    // ✅ 这里直接打开特色好服链接，避免不必要的接口调用和复杂逻辑
    window.open('http://hz.5cq.com/', '_blank');
});

$('.more-btn').on('click', function () {
    // ✅ 这里直接打开更多链接，避免不必要的接口调用和复杂逻辑
    window.open('http://hz.5cq.com/', '_blank');
});

// ✅ 事件委托：在线奖励点击（只绑定一次，不怕 DOM 更新）
$(document).off('click.onlineReward').on('click.onlineReward', '.phs-chests .phs-chestcol', function (e) {
    var $col = $(this);

    // 1) 优先从列上取 data-minute（推荐你在 HTML 上加）
    var minute = Number($col.data('minute'));

    // 2) 否则从列内带 data-minute 的元素取（比如 .phs-tag）
    if (!Number.isFinite(minute)) {
        var $m = $col.find('[data-minute]').first();
        minute = Number($m.data('minute'));
    }

    // 3) 再兜底：从文字里解析 “在线30分钟”
    if (!Number.isFinite(minute)) {
        minute = parseMinuteFromText($col.text());
    }

    if (!Number.isFinite(minute) || minute <= 0) return; // 排除签到(0分钟)

    var cfg = ONLINE_REWARD_MAP[minute];
    if (!cfg) return;

    var cur = Number(time_count);  
    cur = parseInt(cur / 60);
    if (!Number.isFinite(cur)) cur = 0;

    // 未达标给提示（否则看起来像没反应）
    if (cur < minute) {
        uiMsg('未达成：还差' + (minute - cur) + '分钟', { icon: 2 });
        return;
    }

    if ($col.attr('data-claiming') === '1') return;
    $col.attr('data-claiming', '1');

    getCoinRecord(cfg.fs)
        .then(function (record) {
            var claimed = !(record == null || (Array.isArray(record) && record.length === 0) || record === '');
            if (claimed) {
                $col.attr('data-claimed', '1').addClass('claimed');
                uiMsg('该奖励已领取', { icon: 0 });
                return null;
            }
            return addCoin(cfg.type, function () {
                $col.attr('data-claimed', '1').addClass('claimed');
                return true;
            });
        })
        .catch(function (err) {
            console.error(err);
        })
        .finally(function () {
            $col.removeAttr('data-claiming');
        });
});

// 拉取签到报表（Promise）
function fetchUserReport() {
    return new Promise(function (resolve, reject) {
        var token = $.cookie('hzusertoken');
        if (!token) return reject(new Error('no token'));

        var customer = getUser();
        console.log('Fetching user report for open_id:', customer.openid);
        $.ajax({
            url: hzRequestUrl + 'user/user_report',
            type: 'GET',
            cache: false,
            headers: {
                boxVersion: '1.0.0',
                'token':$.cookie('hzusertoken')
            },
            dataType: 'json',
            data: { open_id: customer.openid, _t: Date.now() },
            success: function (res) {
                // 你的后端：code 0/1/2/200 都算正常
                var code = res ? String(res.code) : '';
                if (code === '0' || code === '1' || code === '2' || code === '200') {
                    return resolve(res);
                }
                reject(new Error((res && (res.msg || res.message)) || 'user_report failed'));
            },
            error: function (xhr) { reject(xhr); }
        });
    });
}

//金币兑换余额
function exchangeMoney(num) {
    var token = $.cookie('hzusertoken');
    if (!token) {
        uiMsg('请先登录', { icon: 2 });
        return;
    }

    var customer = getUser();
    var openId = customer ? (customer.open_id || customer.openid) : '';

    if (!openId) {
        uiMsg('未获取到用户 open_id', { icon: 2 });
        return;
    }

    $.ajax({
        url: hzRequestUrl + 'user/jbdhye',
        type: 'POST',
        headers: {
            boxVersion: '1.0.0',
            'token':$.cookie('hzusertoken')
        },
        dataType: 'json',
        data: {
            num: num,
            open_id: openId
        },
        success: function (response) {
            if (response.code === 200) {
                uiMsg(response.msg || '兑换成功', { icon: 1 });

                if (response.user_info) {
                    $('.coin_num').text(response.user_info.coin_num.toFixed(0) || 0);
                    $('.money').text(response.user_info.money.toFixed(0) || 0);
                } else {
                    getHzUser();
                }
            } else {
                uiMsg(response.msg || '兑换失败', { icon: 2 });
            }
        },
        error: function (error) {
            console.error('Error exchanging money:', error);
            uiMsg('兑换请求失败，请稍后再试', { icon: 2 });
        }
    });
}

function exchangeWelfare(num) {
    var token = $.cookie('hzusertoken');
    if (!token) {
        uiMsg('请先登录', { icon: 2 });
        return;
    }

    var customer = getUser();
    var openId = customer ? (customer.open_id || customer.openid) : '';

    if (!openId) {
        uiMsg('未获取到用户 open_id', { icon: 2 });
        return;
    }

    $.ajax({
        url: hzRequestUrl + 'user/coinToWelfare',
        type: 'POST',
        headers: {
            boxVersion: '1.0.0',
            'token': $.cookie('hzusertoken')
        },
        dataType: 'json',
        data: {
            open_id: openId,
            coin_num: num
        },
        success: function (response) {
            if (response.code === 200) {
                uiMsg(response.msg || '兑换成功', { icon: 1 });

                if (response.user_info) {
                    var nextCoin = String(response.user_info.coin_num == null ? 0 : response.user_info.coin_num).replace(/\.\d+$/, '');
                    var nextWelfare = String(response.user_info.waelfare == null ? 0 : response.user_info.waelfare).replace(/\.\d+$/, '');
                    $('.coin_num').text(nextCoin);
                    $('.fuli').text(nextWelfare);
                } else {
                    getHzUser();
                }
            } else {
                uiMsg(response.msg || '兑换失败', { icon: 2 });
            }
        },
        error: function (error) {
            console.error('Error exchanging welfare:', error);
            uiMsg('兑换请求失败，请稍后再试', { icon: 2 });
        }
    });
}

$(document)
    .off('click.exchangeWallet')
    .on('click.exchangeWallet', '#exchangeWalletBtn', function (e) {
        e.preventDefault();

        var customer = getUser();
        if (!customer) {
            uiMsg('请先登录', { icon: 2 });
            if (typeof myLogin === 'function') myLogin();
            return;
        }

        var currentCoin = Number($('.coin_num').text()) || 0;
        layer.closeAll();
        layer.open({
            type: 1,
            title: '兑换元宝',
            area: ['420px', '280px'],
            shadeClose: true,
            content:
                '<div style="padding:20px;">' +
                    '<div style="margin-bottom:12px;">兑换比例：200金币 = 1元宝</div>' +
                    '<div style="margin-bottom:12px;">当前金币：' + currentCoin + '</div>' +
                    '<div style="margin-bottom:12px;">' +
                        '<input id="exchangeCoinInput" type="number" min="200" step="200" placeholder="请输入兑换金币数量" ' +
                        'style="width:100%;height:36px;border:1px solid #ddd;padding:0 10px;box-sizing:border-box;" />' +
                    '</div>' +
                    '<div style="color:#999;">请输入 200 的整数倍</div>' +
                '</div>',
            btn: ['确认兑换', '取消'],
            yes: function (index) {
                var num = Number($('#exchangeCoinInput').val());

                if (!num || num < 200) {
                    uiMsg('最少兑换200金币', { icon: 2 });
                    return;
                }

                if (num % 200 !== 0) {
                    uiMsg('请输入200的整数倍', { icon: 2 });
                    return;
                }

                if (num > currentCoin) {
                    uiMsg('金币余额不足', { icon: 2 });
                    return;
                }

                exchangeMoney(num);
                layer.close(index);
            }
        });
    });

$(document)
    .off('click.exchangeWelfare')
    .on('click.exchangeWelfare', '#exchangeWelfareBtn', function (e) {
        e.preventDefault();

        var customer = getUser();
        if (!customer) {
            uiMsg('请先登录', { icon: 2 });
            if (typeof myLogin === 'function') myLogin();
            return;
        }

        var currentCoin = Number($('.coin_num').text()) || 0;
        var currentWelfare = Number($('.fuli').text()) || 0;

        layer.closeAll();
        layer.open({
            type: 1,
            title: '兑换补贴金',
            area: ['420px', '320px'],
            shadeClose: true,
            content:
                '<div style="padding:20px;">' +
                    '<div style="margin-bottom:12px;">兑换比例：100金币 = 1补贴金</div>' +
                    '<div style="margin-bottom:12px;">当前金币：' + currentCoin + '</div>' +
                    '<div style="margin-bottom:12px;">当前补贴金：' + currentWelfare + '</div>' +
                    '<div style="margin-bottom:12px;">' +
                        '<input id="exchangeWelfareInput" type="number" min="100" step="100" placeholder="请输入兑换金币数量" ' +
                        'style="width:100%;height:36px;border:1px solid #ddd;padding:0 10px;box-sizing:border-box;" />' +
                    '</div>' +
                    '<div style="color:#999;">请输入 100 的整数倍</div>' +
                '</div>',
            btn: ['确认兑换', '取消'],
            yes: function (index) {
                var num = Number($('#exchangeWelfareInput').val());

                if (!num || num < 100) {
                    uiMsg('最少兑换100金币', { icon: 2 });
                    return;
                }

                if (num % 100 !== 0) {
                    uiMsg('请输入100的整数倍', { icon: 2 });
                    return;
                }

                if (num > currentCoin) {
                    uiMsg('金币余额不足', { icon: 2 });
                    return;
                }

                exchangeWelfare(num);
                layer.close(index);
            }
        });
    });

function checkUserPhoneAndSfz() {
    if (typeof hzUserObj !== 'undefined' && hzUserObj) {
        if (hzUserObj.phone !== undefined && hzUserObj.phone !== null && hzUserObj.phone !== '') {
            // 已绑定手机号
            $('#bindPhoneBtn').text('改绑手机');
        }
        if (hzUserObj.sfz && hzUserObj.sfz !== '') {
            // 已实名认证
            $('#realNameBtn').text('已实名认证');
            $('#realNameBtn').removeClass('layui-btn-normal').addClass('layui-btn-disabled');
            $('#realNameBtn').prop('disabled', true);
        }
    }
}
//更新进度条
function updateProgressBar(minite) {

    var fs = '';
    if (minite == 30) {
        fs = ONLINE_REWARD_MAP[30].fs;
    } else if (minite == 60) {
        fs = ONLINE_REWARD_MAP[60].fs;
    } else if (minite == 120) {
        fs = ONLINE_REWARD_MAP[120].fs;
    } else if (minite == 240) {
        fs = ONLINE_REWARD_MAP[240].fs;
    }

    if (fs != '') {
        var customer = getUser();
        if (!customer) {
            uiMsg('请先登录', { icon: 2 });
            if (typeof myLogin === 'function') myLogin();
            return;
        }
        /*
        $.ajax({
            url: hzRequestUrl + 'user/coin_info_today', // 按你实际接口
            type: 'GET',
            cache: false,
            headers: { 
                boxVersion: '1.0.0', 
                'token':$.cookie('hzusertoken')
            },
            dataType: 'json',
            data: { open_id: customer.openid, fs: fs, _t: Date.now() },
            success: function (response) {
                // if (String(response.code) === '200' && response.data == null) {
                //     $('#'+minite+'minites').css('filter', 'grayscale(0%)');
                // } else {
                //     $('#'+minite+'minites').css('filter', 'grayscale(100%)');
                // }
                $('#'+minite+'minites').css('filter', 'grayscale(0%)');
            },
            error: function (xhr) { reject(xhr); }
        });
        */
    }

    if (minite <= 60)
        percent = minite * 50 / 60;
    else if (minite > 60 && minite <= 120)
        percent = 50 + (minite - 60) * 25 / 60;
    else if (minite > 120 && minite < 240)
        percent = 75 + (minite - 120) * 25 / 120;
    else if (minite >= 240) {
        $('.phs-bar .fill').css('width', '100%');
        return;
    }

    $('.phs-bar .fill').css('width', percent + '%');
}



function fillRedBagUseForm__deprecated() {
  $('#redBagServerName').val((window.gamePackPublishData && window.gamePackPublishData.name) || '');
  $('#redBagGameUrl').val((window.gamePackPublishData && window.gamePackPublishData.url) || '');
  $('#redBagCurrency').val('');
  $('#redBagAccount').val('');
  $('#redBagServer').val('');
  $('#redBagQQ').val('');
  $('#totalAmount').text('0');
}

function getRedBagFormData__legacy() {
  return {
    yxmc: $('#redBagServerName').val(),
    yxgw: $('#redBagGameUrl').val(),
    hbmc: $('#redBagCurrency').val(),
    czzh: $('#redBagAccount').val(),
    czqf: $('#redBagServer').val(),
    QQ: $('#redBagQQ').val()
  };
}

function validateRedBagForm__legacy(formData) {
  return formData.hbmc && formData.czzh && formData.czqf && formData.QQ;
}



function openRedBagUseDialog__legacy(redBagIds, redBagListDialog, totalAmount) {
  layui.use(['layer'], function(){
    var layer = layui.layer;

    fillRedBagUseForm();
    $('#totalAmount').text(redBagIds.length + ' 个红包，共 ' + totalAmount + ' 元');

    layer.open({
      type: 1,
      title: redBagIds.length > 1 ? '批量使用红包' : '使用红包',
      area: ['600px', 'auto'],
      shade: 0.3,
      shadeClose: true,
      content: $('#redBagUseModal'),
      btn: ['提交', '取消'],
      yes: function(index){
        var user = getUser ? getUser(1) : null;
        var open_id = user ? user.openid : '';

        if (!open_id) {
          layer.msg('请先登录');
          return;
        }

        var formData = getRedBagFormData();
        if (!validateRedBagForm(formData)) {
          layer.msg('请填写所有必填项');
          return;
        }

        submitRedBagBatch(redBagIds, open_id, formData, function(result){
          layer.close(index);

          if (redBagListDialog) {
            layer.close(redBagListDialog);
          }

          openRedBagDetailModal();

          if (result.successCount > 0) {
            // 层级要最高，否则会被遮挡
            layer.msg('成功使用 ' + result.successCount + ' 个红包', {zIndex: layer.zIndex + 1000});
          } else {
            layer.msg('红包使用失败');
          }
          
        });
      }
    });
  });
}
function submitRedBagBatch__legacy(redBagIds, open_id, formData, done) {
    var publishId = gamePackPublishData.id;
    console.log('Submitting red bag batch with data:', {
        open_id: open_id,
        red_bag_ids: redBagIds.join(','),
        yxmc: formData.yxmc,
        yxgw: formData.yxgw,
        hbmc: formData.hbmc,
        czzh: formData.czzh,
        czqf: formData.czqf,
        QQ: formData.QQ,
        publishId: publishId
    });
    return false; // 先阻止实际提交，等调试完再去掉
  $.ajax({
    url: hzRequestUrl + 'kill/use_red_bag',
    type: 'POST',
    dataType: 'json',
    data: {
    open_id: open_id,
    red_bag_ids: redBagIds.join(','),
    yxmc: formData.yxmc,
    yxgw: formData.yxgw,
    hbmc: formData.hbmc,
    czzh: formData.czzh,
    czqf: formData.czqf,
    QQ: formData.QQ
    },
    headers: {
    boxVersion: '1.0.0',
    token: $.cookie('hzusertoken')
    },
    success: function(res) {
      if (res && Number(res.code) === 200) {
        done({
            successCount: redBagIds.length
        });
      } else {
        failIds.push(currentId);
      }
    },
    error: function() {
      layer.msg('红包使用失败');
    }
  });

}
//检查js错误，正式环境需要注释掉
// (function ($) {
//   var oldAdd = $.event.add;
//   $.event.add = function (elem, types, handler, data, selector) {
//     if (selector) {
//       console.log('[delegate]', types, selector, elem);
//     }
//     return oldAdd.apply(this, arguments);
//   };

//   var oldMatches = $.find.matchesSelector;
//   $.find.matchesSelector = function (elem, expr) {
//     try {
//       return oldMatches.call(this, elem, expr);
//     } catch (err) {
//       console.error('Bad selector =>', expr, elem, err);
//       throw err;
//     }
//   };
// })(jQuery);

function escapeRedBagHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getRedBagDialogMeta(redBagIds, totalAmount) {
  var publishData = window.gamePackPublishData || {};
  return {
    title: publishData.name || '',
    url: publishData.url || '#',
    amount: Number(totalAmount) || 0,
    count: redBagIds.length
  };
}

function getRedBagFormData__deprecated() {
  return {
    yxmc: (window.gamePackPublishData && window.gamePackPublishData.name) || '',
    yxgw: (window.gamePackPublishData && window.gamePackPublishData.url) || '',
    hbmc: ($('#redbag_currency').val() || '').trim(),
    czzh: ($('#redbag_account').val() || '').trim(),
    czqf: ($('#redbag_server').val() || '').trim(),
    QQ: ($('#redbag_qq').val() || '').trim()
  };
}

function validateRedBagForm__deprecated(formData) {
  if (!formData.hbmc) return '请输入充值货币名称';
  if (!formData.czzh || formData.czzh.length < 4) return '请输入有效充值账号，至少4位';
  if (formData.czzh !== (($('#redbag_confirm_account').val() || '').trim())) return '两次输入的充值账号不一致';
  if (!formData.czqf) return '请输入充值区服';
  if (!formData.QQ) return '请输入联系QQ';
  return '';
}

function showRedBagUseSuccess(meta, formData) {
  layui.use(['layer'], function(){
    var layer = layui.layer;
    var targetUrl = meta.url || 'javascript:void(0);';
    var openTarget = meta.url && meta.url !== '#' ? ' target="_blank"' : '';
    var nowText = new Date().toLocaleString('zh-CN', { hour12: false });
    var html = '<div style="padding:18px 18px 20px;background:#fff;">';
    html += '<div style="text-align:center;line-height:1.3;">';
    html += '<div style="font-size:26px;color:#222;">￥' + escapeRedBagHtml(meta.amount) + '元</div>';
    html += '<div style="font-size:14px;color:#2c6ed5;margin-top:8px;">' + escapeRedBagHtml(meta.title) + '</div>';
    html += '<div style="font-size:14px;color:#2c6ed5;margin-top:2px;">';
    if (meta.url && meta.url !== '#') {
      html += '<a href="' + escapeRedBagHtml(targetUrl) + '"' + openTarget + ' style="color:#2c6ed5;text-decoration:none;">进入网站</a>';
    }
    html += '</div>';
    html += '</div>';
    html += '<div style="margin:16px 0 14px;text-align:center;color:#ff4d4f;font-size:14px;">使用流程：进入游戏 -> 联系充值NPC/客服 -> 按填写信息发放红包充值</div>';
    html += '<div style="position:relative;border:1px solid #e7e7e7;border-radius:8px;padding:16px 18px 14px;margin-bottom:16px;">';
    html += '<div style="position:absolute;right:14px;top:14px;color:#ff7875;border:3px solid #ff9c9c;border-radius:50%;width:86px;height:86px;transform:rotate(-18deg);display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;opacity:0.75;">成功</div>';
    html += '<div style="padding-right:98px;line-height:1.9;font-size:14px;color:#333;">';
    html += '<div><span style="display:inline-block;width:88px;font-weight:700;">充值货币</span>' + escapeRedBagHtml(formData.hbmc) + '</div>';
    html += '<div><span style="display:inline-block;width:88px;font-weight:700;">充值账号</span>' + escapeRedBagHtml(formData.czzh) + '</div>';
    html += '<div><span style="display:inline-block;width:88px;font-weight:700;">充值区服</span>' + escapeRedBagHtml(formData.czqf) + '</div>';
    html += '<div><span style="display:inline-block;width:88px;font-weight:700;">联系QQ</span>' + escapeRedBagHtml(formData.QQ) + '</div>';
    html += '<div><span style="display:inline-block;width:88px;font-weight:700;">红包数量</span>' + escapeRedBagHtml(meta.count) + '个</div>';
    html += '<div><span style="display:inline-block;width:88px;font-weight:700;">红包金额</span>' + escapeRedBagHtml(meta.amount) + '元真实充值</div>';
    html += '<div><span style="display:inline-block;width:88px;font-weight:700;">提交时间</span>' + escapeRedBagHtml(nowText) + '</div>';
    html += '</div>';
    html += '</div>';
    if (meta.url && meta.url !== '#') {
      html += '<a href="' + escapeRedBagHtml(targetUrl) + '"' + openTarget + ' style="display:block;width:100%;box-sizing:border-box;background:#1677ff;color:#fff;text-align:center;border-radius:6px;padding:13px 12px;font-size:16px;font-weight:700;text-decoration:none;">进入游戏</a>';
    }
    html += '</div>';

    layer.open({
      type: 1,
      shadeClose: true,
      title: false,
      closeBtn: 1,
      area: ['480px', 'auto'],
      content: html
    });
  });
}

function openRedBagUseDialog__deprecated(redBagIds, redBagListDialog, totalAmount) {
  layui.use(['layer'], function(){
    var layer = layui.layer;
    var meta = getRedBagDialogMeta(redBagIds, totalAmount);
    var html = '<div style="padding:20px;">';
    html += '<div style="text-align:center;margin-bottom:10px;">';
    html += '<div style="font-size:28px;color:#e53935;font-weight:700;">' + escapeRedBagHtml(meta.amount) + '元</div>';
    html += '<div style="font-size:14px;color:#1E88E5;margin-top:8px;">' + escapeRedBagHtml(meta.title) + '</div>';
    html += '<div style="font-size:12px;color:#999;margin-top:6px;">共 ' + escapeRedBagHtml(meta.count) + ' 个红包</div>';
    html += '</div>';
    html += '<p style="color:#d32f2f;text-align:center;margin:10px 0;">使用流程：进入游戏 -> 填写充值信息 -> 提交后由系统发放红包充值</p>';
    html += '<div style="margin:10px 0;"><label>充值货币</label><input id="redbag_currency" style="width:100%;padding:8px;margin-top:6px;border:1px solid #e0e0e0;border-radius:4px;" placeholder="请输入充值货币名称"></div>';
    html += '<div style="margin:10px 0;"><label>充值账号</label><input id="redbag_account" style="width:100%;padding:8px;margin-top:6px;border:1px solid #e0e0e0;border-radius:4px;" placeholder="请输入4位以上充值账号"></div>';
    html += '<div style="margin:10px 0;"><label>确认账号</label><input id="redbag_confirm_account" style="width:100%;padding:8px;margin-top:6px;border:1px solid #e0e0e0;border-radius:4px;" placeholder="请再次输入充值账号"></div>';
    html += '<div style="margin:10px 0;"><label>充值区服</label><input id="redbag_server" style="width:100%;padding:8px;margin-top:6px;border:1px solid #e0e0e0;border-radius:4px;" placeholder="请输入充值区服"></div>';
    html += '<div style="margin:10px 0;"><label>联系QQ</label><input id="redbag_qq" style="width:100%;padding:8px;margin-top:6px;border:1px solid #e0e0e0;border-radius:4px;" placeholder="请输入联系QQ"></div>';
    html += '<button id="useRedBagSubmitBtn" style="width:100%;padding:10px;background-color:#1E9FFF;color:#fff;border:none;border-radius:4px;margin-top:10px;">确定使用</button>';
    html += '<div style="font-size:12px;color:#999;text-align:center;margin-top:12px;line-height:1.4;">红包仅按当前填写信息进行发放，请务必核对充值账号与区服，提交后请留意联系QQ消息。</div>';
    html += '</div>';

    var dialogIndex = layer.open({
      type: 1,
      shadeClose: true,
      title: redBagIds.length > 1 ? '批量使用红包' : '使用红包',
      area: ['520px', 'auto'],
      content: html
    });

    $('#useRedBagSubmitBtn').off('click').on('click', function(){
      var user = getUser ? getUser(1) : null;
      var open_id = user ? user.openid : '';

      if (!open_id) {
        layer.msg('请先登录');
        return;
      }

      var formData = getRedBagFormData();
      var validateMsg = validateRedBagForm(formData);
      if (validateMsg) {
        layer.msg(validateMsg);
        return;
      }

      var $btn = $(this);
      if ($btn.data('submitting')) return;
      $btn.data('submitting', 1).text('提交中...');

      submitRedBagBatch(redBagIds, open_id, formData, function(result){
        $btn.removeData('submitting').text('确定使用');

        if (!result || !result.ok) {
          layer.msg((result && result.msg) || '红包使用失败');
          return;
        }

        layer.close(dialogIndex);
        if (redBagListDialog) {
          layer.close(redBagListDialog);
        }
        openRedBagDetailModal();
        showRedBagUseSuccess(meta, formData);
      });
    });
  });
}

function submitRedBagBatch__deprecated(redBagIds, open_id, formData, done) {
  $.ajax({
    url: hzRequestUrl + 'kill/use_red_bag',
    type: 'POST',
    dataType: 'json',
    data: {
      open_id: open_id,
      red_bag_ids: redBagIds.join(','),
      yxmc: formData.yxmc,
      yxgw: formData.yxgw,
      hbmc: formData.hbmc,
      czzh: formData.czzh,
      czqf: formData.czqf,
      QQ: formData.QQ
    },
    headers: {
      boxVersion: '1.0.0',
      token: $.cookie('hzusertoken')
    },
    success: function(res) {
      if (res && Number(res.code) === 200) {
        done({
          ok: true,
          successCount: redBagIds.length,
          msg: res.msg || ''
        });
        return;
      }

      done({
        ok: false,
        successCount: 0,
        msg: (res && (res.msg || res.message)) || '红包使用失败'
      });
    },
    error: function() {
      done({
        ok: false,
        successCount: 0,
        msg: '网络错误，红包使用失败'
      });
    }
  });
}

function fillRedBagUseForm() {
  if (typeof fillRedBagUseForm__deprecated === 'function') {
    return fillRedBagUseForm__deprecated.apply(this, arguments);
  }
}

function getRedBagFormData() {
  return getRedBagFormData__deprecated.apply(this, arguments);
}

function validateRedBagForm(formData) {
  return validateRedBagForm__deprecated.apply(this, arguments);
}

function openRedBagUseDialog(redBagIds, redBagListDialog, totalAmount) {
  return openRedBagUseDialog__deprecated.apply(this, arguments);
}

function submitRedBagBatch(redBagIds, open_id, formData, done) {
  var publishData = window.gamePackPublishData || {};
  var publishId = publishData.id || '';
  var token = $.cookie('hzusertoken') || $.cookie('usertoken') || $.cookie('token') || '';
  // Prefer the UI selection; fallback to publish defaults to avoid hardcoded "1".
  var partitionId = (formData && formData.partitionId) || publishData.partitionId || publishData.defaultPartitionId || '';

  if (!partitionId) {
    done({
      ok: false,
      successCount: 0,
      msg: '请选择充值区服'
    });
    return;
  }

  // Note: report/* 接口返回结构是 {result,msg,...} 没有 code 字段，用 admin.req 会被当成异常弹窗提示。
  $.ajax({
    url: (layui && layui.setter ? layui.setter.url : '') + 'report/hzManualRecharge',
    type: 'POST',
    dataType: 'json',
    data: {
      openId: open_id,
      publishId: publishId,
      redBagIds: redBagIds.join(','),
      cczh: formData.czzh,
      partitionId: partitionId,
      token: token,
      QQ: formData.QQ
    },
    success: function (res) {
      if (res && (res.result === true || res.result === 'true')) {
        done({
          ok: true,
          successCount: redBagIds.length,
          msg: res.msg || ''
        });
        return;
      }

      done({
        ok: false,
        successCount: 0,
        msg: (res && (res.msg || res.message)) || '红包使用失败'
      });
    },
    error: function () {
      done({
        ok: false,
        successCount: 0,
        msg: '网络错误，红包使用失败'
      });
    }
  });
}

function getRedBagFormData() {
  return {
    yxmc: (window.gamePackPublishData && window.gamePackPublishData.name) || '',
    yxgw: (window.gamePackPublishData && window.gamePackPublishData.url) || '',
    hbmc: '',
    czzh: ($('#redbag_account').val() || '').trim(),
    czqf: '',
    QQ: ($('#redbag_qq').val() || '').trim(),
    partitionId: ($('#partitionSelect').val() || '').toString()
  };
}

function validateRedBagForm(formData) {
  if (!formData.czzh || formData.czzh.length < 4) return '请输入有效充值账号，至少4位';
  if (formData.czzh !== (($('#redbag_confirm_account').val() || '').trim())) return '两次输入的充值账号不一致';
  if (!formData.partitionId) return '请选择充值区服';
  if (!formData.QQ) return '请输入联系QQ';
  return '';
}

function showRedBagUseSuccess(meta, formData) {
  layui.use(['layer'], function(){
    var layer = layui.layer;
    var targetUrl = meta.url || 'javascript:void(0);';
    var openTarget = meta.url && meta.url !== '#' ? ' target="_blank"' : '';
    var nowText = new Date().toLocaleString('zh-CN', { hour12: false });
    var html = '<div style="padding:18px 18px 20px;background:#fff;">';
    html += '<div style="text-align:center;line-height:1.3;">';
    html += '<div style="font-size:26px;color:#222;">￥' + escapeRedBagHtml(meta.amount) + '元</div>';
    html += '<div style="font-size:14px;color:#2c6ed5;margin-top:8px;">' + escapeRedBagHtml(meta.title) + '</div>';
    html += '<div style="font-size:14px;color:#2c6ed5;margin-top:2px;">';
    if (meta.url && meta.url !== '#') {
      html += '<a href="' + escapeRedBagHtml(targetUrl) + '"' + openTarget + ' style="color:#2c6ed5;text-decoration:none;">进入网站</a>';
    }
    html += '</div>';
    html += '</div>';
    html += '<div style="margin:16px 0 14px;text-align:center;color:#ff4d4f;font-size:14px;">使用流程：进入游戏 -> 联系充值NPC/客服 -> 按填写信息发放红包充值</div>';
    html += '<div style="position:relative;border:1px solid #e7e7e7;border-radius:8px;padding:16px 18px 14px;margin-bottom:16px;">';
    html += '<div style="position:absolute;right:14px;top:14px;color:#ff7875;border:3px solid #ff9c9c;border-radius:50%;width:86px;height:86px;transform:rotate(-18deg);display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:700;opacity:0.75;">成功</div>';
    html += '<div style="padding-right:98px;line-height:1.9;font-size:14px;color:#333;">';
    html += '<div><span style="display:inline-block;width:88px;font-weight:700;">充值账号</span>' + escapeRedBagHtml(formData.czzh) + '</div>';
    html += '<div><span style="display:inline-block;width:88px;font-weight:700;">联系QQ</span>' + escapeRedBagHtml(formData.QQ) + '</div>';
    html += '<div><span style="display:inline-block;width:88px;font-weight:700;">红包数量</span>' + escapeRedBagHtml(meta.count) + '个</div>';
    html += '<div><span style="display:inline-block;width:88px;font-weight:700;">红包金额</span>' + escapeRedBagHtml(meta.amount) + '元真实充值</div>';
    html += '<div><span style="display:inline-block;width:88px;font-weight:700;">提交时间</span>' + escapeRedBagHtml(nowText) + '</div>';
    html += '</div>';
    html += '</div>';
    if (meta.url && meta.url !== '#') {
      html += '<a href="' + escapeRedBagHtml(targetUrl) + '"' + openTarget + ' style="display:block;width:100%;box-sizing:border-box;background:#1677ff;color:#fff;text-align:center;border-radius:6px;padding:13px 12px;font-size:16px;font-weight:700;text-decoration:none;">进入游戏</a>';
    }
    html += '</div>';

    layer.open({
      type: 1,
      shadeClose: true,
      title: false,
      closeBtn: 1,
      area: ['480px', 'auto'],
      content: html
    });
  });
}

function openRedBagUseDialog(redBagIds, redBagListDialog, totalAmount) {
  layui.use(['layer'], function(){
    var layer = layui.layer;
    var meta = getRedBagDialogMeta(redBagIds, totalAmount);

    var publishData = window.gamePackPublishData || {};
    var publishId = publishData.id || '';
    if (!publishId) {
      layer.msg('未找到发布ID，无法获取区服');
      return;
    }

    // Note: report/* 接口返回结构是 {result,msg,...} 没有 code 字段，用 admin.req 会被当成异常弹窗提示。
    $.ajax({
      url: (layui && layui.setter ? layui.setter.url : '') + 'report/getPartitionsByGroupId',
      type: 'GET',
      dataType: 'json',
      data: { publishId: publishId },
      success: function(res) {
        var partitionOptions = '';
        if (res && (res.result === true || res.result === 'true') && res.platformResponse && res.platformResponse.length) {
          partitionOptions = res.platformResponse.map(function(p) {
            return '<option value="' + escapeRedBagHtml(p.id) + '">' + escapeRedBagHtml(p.name) + '</option>';
          }).join('');
        }

        if (!partitionOptions) {
          partitionOptions = '<option value="">暂无可选区服</option>';
        }

        var html = '<div style="padding:20px;">';
        html += '<div style="text-align:center;margin-bottom:10px;">';
        html += '<div style="font-size:28px;color:#e53935;font-weight:700;">' + escapeRedBagHtml(meta.amount) + '元</div>';
        html += '<div style="font-size:14px;color:#1E88E5;margin-top:8px;">' + escapeRedBagHtml(meta.title) + '</div>';
        html += '<div style="font-size:12px;color:#999;margin-top:6px;">共 ' + escapeRedBagHtml(meta.count) + ' 个红包</div>';
        html += '</div>';
        html += '<p style="color:#d32f2f;text-align:center;margin:10px 0;">使用流程：进入游戏 -> 填写充值账号 -> 选择充值区服 -> 提交后由系统发放红包充值</p>';
        html += '<div style="margin:10px 0;"><label>充值账号</label><input id="redbag_account" style="width:100%;padding:8px;margin-top:6px;border:1px solid #e0e0e0;border-radius:4px;" placeholder="请输入4位以上充值账号"></div>';
        html += '<div style="margin:10px 0;"><label>确认账号</label><input id="redbag_confirm_account" style="width:100%;padding:8px;margin-top:6px;border:1px solid #e0e0e0;border-radius:4px;" placeholder="请再次输入充值账号"></div>';
        html += '<div style="margin:10px 0;"><label>充值区服</label><select id="partitionSelect" style="width:100%;padding:8px;margin-top:6px;border:1px solid #e0e0e0;border-radius:4px;">' + partitionOptions + '</select></div>';
        html += '<div style="margin:10px 0;"><label>联系QQ</label><input id="redbag_qq" style="width:100%;padding:8px;margin-top:6px;border:1px solid #e0e0e0;border-radius:4px;" placeholder="请输入联系QQ"></div>';
        html += '<button id="useRedBagSubmitBtn" style="width:100%;padding:10px;background-color:#1E9FFF;color:#fff;border:none;border-radius:4px;margin-top:10px;">确定使用</button>';
        html += '<div style="font-size:12px;color:#999;text-align:center;margin-top:12px;line-height:1.4;">红包仅按当前填写的充值账号、区服和联系QQ进行处理，提交前请核对信息。</div>';
        html += '</div>';

        var dialogIndex = layer.open({
          type: 1,
          shadeClose: true,
          title: redBagIds.length > 1 ? '批量使用红包' : '使用红包',
          area: ['520px', 'auto'],
          content: html
        });

        $('#useRedBagSubmitBtn').off('click').on('click', function(){
          var user = getUser ? getUser(1) : null;
          var open_id = user ? user.openid : '';

          if (!open_id) {
            layer.msg('请先登录');
            return;
          }

          var formData = getRedBagFormData();
          var validateMsg = validateRedBagForm(formData);
          if (validateMsg) {
            layer.msg(validateMsg);
            return;
          }

          var $btn = $(this);
          if ($btn.data('submitting')) return;
          $btn.data('submitting', 1).text('提交中...');

          submitRedBagBatch(redBagIds, open_id, formData, function(result){
            $btn.removeData('submitting').text('确定使用');

            if (!result || !result.ok) {
              layer.msg((result && result.msg) || '红包使用失败');
              return;
            }

            // Close all related popups before showing the final success modal.
            layer.close(dialogIndex);
            if (redBagListDialog) {
              layer.close(redBagListDialog);
            }
            layer.closeAll('page');
            showRedBagUseSuccess(meta, formData);
          });
        });
      },
      error: function() {
        layer.msg('网络错误，获取区服信息失败');
      }
    });
  });
}
