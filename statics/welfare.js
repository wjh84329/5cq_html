//socket服务对象
var socketserver;
//socket封装对象
var socket = {};
//socket配置信息
// var protocol = (window.location.protocol == 'http:') ? 'ws://' : 'wss://';
var protocol = 'ws://';
// var host = window.location.host;
// var host = "wx.1pk.com";
// var host = "jaxone.5cq.com";
var host = "120.55.68.91";
console.log('host是'+host)
var port = ':12345';
var info = {
    // url: protocol + host + port + "/ws",
    url: protocol + host   + "/ws",
    reconnect: true,//是否断线重连，默认是
    reconnectTime: 1000,//断线重连间隔时间
};
//接口地址url
socket.info = {
    // url: protocol + host + port + "/ws",
    url: protocol + host  + "/ws",
    reconnect: true,//是否断线重连，默认是
    reconnectTime: 1000,//断线重连间隔时间
};

socket.receive = "receiveMsg";//默认接收消息回调的方法名，可以自定义
/**
 * socket 初始化
 * Create by xl-Song on 2020-05-09 18:34:06
 */
var reconnectstate = 0;//重连计数
var lydarr = [];
socket.init = function (info) {
    console.log(info.url);
    var initflag = false;
    var colseflag = true;
    if (typeof info != "undefined") {
        if (typeof info.url != "undefined") socket.info.url = info.url;
        if (typeof info.reconnect != "undefined") socket.info.reconnect = info.reconnect;
        if (typeof info.reconnectTime != "undefined") socket.info.reconnectTime = info.reconnectTime;
    }
    if (typeof (WebSocket) == "undefined") {
        console.log("您的浏览器不支持WebSocket");
    } else {
        //实现化WebSocket对象，指定要连接的服务器地址与端口  建立连接
        //等同于socket = new WebSocket("ws://localhost:8888/xxxx/im/25");
        //var socketUrl="${request.contextPath}/im/"+$("#userId").val();
        var socketUrl = socket.info.url;
        if (socketserver != null) {
            socketserver.close();
            socketserver = null;
        }
        try {
            socketserver = new WebSocket(socketUrl);
        } catch (e) {
            console.log(e);
        }
        //打开事件
        socketserver.onopen = function () {
            initflag = true;
            colseflag = false;
            reconnectstate = 0;
        };
        //获得消息事件
        socketserver.onmessage = function (msg) {
            //eval(socket.receive)(msg.data);
            var map = JSON.parse(msg.data);
            if (map['lyd'] != null) {
                var mapLyd=map['lyd'].split(",");
                var lyd= window.localStorage.getItem("lyd");//获取
                if(lyd==null){
                    lyd='';
                }
                var newtime = mapLyd[1].replace(" ","").replace(":","");
                lyd+=(mapLyd[0]+newtime);
                console.log("这里是推送过来的消息:"+lyd);
                window.localStorage.setItem("lyd",lyd);//获取
                // var lyd = map['lyd'].split(",");
                // huidiao(lyd[0], lyd[1]);
                window.location.reload();
            } else if (map['state'] != null) {
                window.localStorage.setItem("state", map["state"]);
                var state = map["state"];
                if (state == "1") {
                    window.localStorage.setItem("state", 0);
                    bind();
                } else {
                    if (state == '3') {
                        layer.alert('登录成功', {
                            title: '提示',
                            icon: 1,
                            skin: 'layer-ext-moon' //该皮肤由layer.seaning.com友情扩展。关于皮肤的扩展规则，去这里查阅
                        }, function () {
                            layer.closeAll();
                            window.location.reload();
                        })
                    } else {
                        layer.closeAll();
                        window.location.reload();
                    }

                }
            } else {
                for (var key in map) {
                    if (map[key] == '' || map[key] == null) {
                        //移除数据的时候 清空该条数据的定时器;
                        window.clearInterval(map.get(key));
                        $("#welfare" + key).remove();
                    } else {
                        initData(map[key]);
                    }
                }
            }
        };
        //关闭事件
        socketserver.onclose = function () {
            if (socket.info.reconnect && colseflag) {
                var rectime = setTimeout(function () {
                    console.log("正在尝试重连" + (reconnectstate++));
                    socket.init(info);
                    if (initflag) clearTimeout(rectime);
                }, socket.info.reconnectTime);
            } else {
                console.log("wsserver关闭");
            }
        };
        //发生了错误事件
        socketserver.onerror = function (event) {
            console.log("websocket发生了错误");
        }

        //监听窗口关闭事件，当窗口关闭时，主动去关闭websocket连接，防止连接还没断开就关闭窗口，server端会抛异常。
        window.onbeforeunload = function () {
            socketserver.close();
        }
    }

};


socket.init(info);


/**
 * 发送消息
 * Create by xl-Song on 2020-05-09 18:36:38
 */
socket.sendMsg = function (e) {
    try {
        socketserver.send(e);
    } catch (err) {
        var tryTime = 0;
        // 重试10次，每次之间间隔3秒
        if (tryTime < 5) {
            var t1 = setTimeout(function () {
                tryTime++;
                socketserver.send(e);
                console.log(tryTime)
            }, 1000);
        } else {
            console.error("重连失败.");
        }
    }
};


var map = new Map;


;(function ($, window, document) {
    //定义Code的构造函数
    var Welfare = function (ele, opt) {
        this.$element = ele;
        if (socketserver == null) {
            socket.init(info);
            //每次加载的时候从新 清空历史定时器，并清空map；---否则会有冗余数据
            for (var key in map) {
                window.clearInterval(map.get(key));
            }
            map = new Map;
        }
    };
    //定义Code的方法
    Welfare.prototype = {
        destroy: function (ele) {
            for (var key in map) {
                window.clearInterval(map.get(key));
            }
            $(ele).empty();
        },
        getData: function (ele, options) {
            var uuid = window.localStorage.getItem("uuid");
            if (uuid != null) {
                options.data.uuid = uuid;
            }
            $.ajax({
                url: options.url,
                type: 'POST',
                async: false,
                // processData: false,
                // contentType: false,
                data: options.data,
                timeout: 10000,    //超时时间
                dataType: 'json',    //返回的数据格式：json/xml/html/script/jsonp/text
                success: function (data) {
                    if (uuid == null) {
                        window.localStorage.setItem("uuid", data.uuid);
                    }
                    socket.sendMsg(window.localStorage.getItem("uuid"));
                    window.localStorage.setItem("state", data.state);
                    data = data.list;
                    if (data.length != 0) {
                        var html = initTable();
                        ele.html(html);
                        //加载数据--->
                        for (var i in data) {
                            initData(data[i]);
                        }
                        // var lyd = window.localStorage.getItem("lyd");
                        // console.log(lyd);
                        // if (lyd != null && typeof lyd != 'undefined') {
                        //     lyd = JSON.parse(lyd);
                        //     var newlyd = {};
                        //     for (var a in lydarr) {
                        //         if (typeof lyd[lydarr[a]] != 'undefined') {
                        //             newlyd[lydarr[a]] = lyd[lydarr[a]];
                        //         }
                        //     }
                        //     window.localStorage.setItem("lyd", JSON.stringify(newlyd));
                        // }

                    } else {
                        //window.localStorage.removeItem("lyd");
                    }
                },
                error: function () {

                }
            });
        }
    };

    //在插件中使用codeVerify对象
    $.fn.welfare = function (options) {
        var welfare = new Welfare(this, options);
        welfare.getData(this, options);
    };
    $.fn.destroy = function () {
        var welfare = new Welfare(this);
        welfare.destroy(this);
    };

})(jQuery, window, document);



var width1 = "14%";
var width2 = "12%";
var width3 = "16%";
var width4 = "11%";
var width5 = "25%";
var width6 = "10%";
var width7 = "8%";
var width8 = "3%";

function getNow() {
    var date = new Date();
    var month = date.getMonth() + 1;
    var day = date.getDate();
    if (month < 10) {
        month = "0" + month;
    }
    if (day < 10) {
        day = "0" + day;
    }
    return month + "-" + day;
}


function initTable(data) {
    var html = '';
    html += '<table cellPadding = "0" cellSpacing = "0" width = "100%" className = "rankingtable" id = "welfareTable" style="border-collapse:separate; border-spacing:1px 1px;background-color: #0f93d8;table-layout:fixed;margin-bottom: 5px">';
    html += '<thead id="welfareTableTH" style="solid 1px #2aaae3">';
    html += '<th width = "' + width1 + '" style="text-align:center;height:32px;color: white">新区名称</th>';
    html += '<th width = "' + width2 + '" style="text-align:center;height:32px;color: white">IP</th>';
    html += '<th width = "' + width3 + '" style="text-align:center;height:32px;color: white">开机时间</th>';
    html += '<th width = "' + width4 + '" style="text-align:center;height:32px;color: white">线路</th>';
    html += '<th width = "' + width5 + '" style="text-align:center;height:32px;color: white">免费充值</th>';
    html += '<th width = "' + width6 + '" style="text-align:center;height:32px;color: white">领取记录</th>';
    html += '<th width = "' + width7 + '" style="text-align:center;height:32px;color: white">主页地址</th>';
    html += '<th width = "' + width8 + '" style="text-align:center;height:32px;color: white">举报</th>';
    html += '</thead>';
    html += '<tbody id="welfareTableTB">';
    html += '</tbody>';
    html += '</table>';
    return html;
}

function initData(data) {
    var html = '';
    var tdStyle = "overflow: hidden;white-space: nowrap;text-overflow: ellipsis;text-align:center;height:30px;";
    if (data != null) {
        var e;
        //说明表格中有数据---刷新一下
        if ($("#welfare" + data.id).length > 0) {
            window.clearInterval(map.get(data.id));
            html += '<td width = "' + width1 + '" style="' + tdStyle + '"><a href="' + data.weburl + '" target="_blank">' + (data.name == null ? '' : data.name) + '</a></td>';
            html += '<td width = "' + width2 + '" style="' + tdStyle + '"><a href="' + data.weburl + '" target="_blank">' + (data.ip == null ? '' : data.ip) + '</a></td>';
            html += '<td width = "' + width3 + '" style="' + tdStyle + ' color: red;font-weight:500">' + getNow() + '/全天推荐</td>';
            html += '<td width = "' + width4 + '" style="' + tdStyle + '">' + (data.line == null ? '' : data.line) + '</td>';
            html += '<td width = "' + width5 + '" style="' + tdStyle + '">';
            html += '<div style="width: 160px;display:inline-block;">';
            html += '送充值:<span style="color:red;">' + data.money + '</span>元&nbsp;&nbsp;&nbsp;&nbsp;';
            html += '<span style="color:red;">' + data.occupy + '</span>/';
            html += '<span style="color:red;">' + data.total + '</span>&nbsp;&nbsp;&nbsp;&nbsp;';
            html += '</div>';
            html += '<span id="g' + data.id + '_">' + getButtonHtml(data.id, data.state, data.granttime) + '</span>';

            html += '</td>';
            html += '<td width = "' + width6 + '" style="' + tdStyle + '"><a href="/code/query.html?id=' + data.id + '" style="color: #ff0000" target="_blank">领取记录</a></td>';
            html += '<td width = "' + width7 + '" style="' + tdStyle + '"><a href="' + data.weburl + '" target="_blank">进入网站</a></td>';
            html += '<td width = "' + width8 + '" style="' + tdStyle + '"><span onclick="report('+JSON.stringify(data.name).replace(/"/g, '&quot;')+','+JSON.stringify(data.weburl).replace(/"/g, '&quot;')+')"><img src="/statics/images/report.png"></span></td>';
            $("#welfare" + data.id).html(html);
        } else {
            html += '<tr id="welfare' + data.id + '" style="background:#ffff00;line-height: 30px">';
            html += '<td width = "' + width1 + '" style="' + tdStyle + '"><a href="' + data.weburl + '" target="_blank">' + (data.name == null ? '' : data.name) + '</a></td>';
            html += '<td width = "' + width2 + '" style="' + tdStyle + '"><a href="' + data.weburl + '" target="_blank">' + (data.ip == null ? '' : data.ip) + '</a></td>';
            html += '<td width = "' + width3 + '" style="' + tdStyle + ' color: red;font-weight:500">' + getNow() + '/全天推荐</td>';
            html += '<td width = "' + width4 + '" style="' + tdStyle + '">' + (data.line == null ? '' : data.line) + '</td>';
            html += '<td width = "' + width5 + '" style="' + tdStyle + '">';
            html += '<div style="width: 160px;display:inline-block;">';
            html += '送充值:<span style="color:red;">' + data.money + '</span>元&nbsp;&nbsp;&nbsp;&nbsp;';
            html += '<span style="color:red;">' + data.occupy + '</span>/';
            html += '<span style="color:red;">' + data.total + '</span>&nbsp;&nbsp;&nbsp;&nbsp;';
            html += '</div>';
            html += '<span id="g' + data.id + '_">' + getButtonHtml(data.id, data.state, data.granttime) + '</span>';

            html += '</td>';
            html += '<td width = "' + width6 + '" style="' + tdStyle + '"><a href="/code/query.html?id=' + data.id + '" style="color: #ff0000" target="_blank">领取记录</a></td>';
            html += '<td width = "' + width7 + '" style="' + tdStyle + '"><a href="' + data.weburl + '" target="_blank">进入网站</a></td>';
            html += '<td width = "' + width8 + '" style="' + tdStyle + '"><span onclick="report('+JSON.stringify(data.name).replace(/"/g, '&quot;')+','+JSON.stringify(data.weburl).replace(/"/g, '&quot;')+')"><img src="/statics/images/report.png"></span></td>';
            html += '</tr>';
            $("#welfareTableTB").append(html);
        }
    }
}


function bind() {
    var html = '';
    html += '<div class="tc login">';
    html += '<form id="formBind"">';
    html += '<p><span>手机号：</span><input type="text" name="phone" placeholder="手机号" maxlength="11" required></p>';
    html += '<p><span>短信码：</span><input class="smscode" type="text" name="smsCode" placeholder="手机验证码" maxlength="6" required>';
    html += '<button type="button" id="sendCode">发送验证</button></p>'
    html += '<button type="button" id="bind" onclick="bindPhone()">绑定</button>'
    html += '</form>';
    html += '</div>';
    layer.open({
        type: 1,
        title: "手机号绑定",
        resize: !1,
        move: !1,
        zIndex: 8990,
        area: ["460px", "360px"],
        content: html
    })
}

var x;
$("#sendCode").live('click', function () {
    var a = $("#formBind input[name='phone']").val()
    if (!a) {
        return layer.msg("手机号不能为空！", {
            icon: 2
        })
    }
    var n = /^[1]([3-9])[0-9]{9}$/;
    if (!n.test(a)) {
        return layer.msg("手机号格式不正确！", {
            icon: 2
        });
    }
    var text = $("#sendCode").text();
    if (text == '发送验证' || text == '重新发送') {
        $.ajax({
            url: baseUrl + "jax/welfare/sendCode",
            type: "POST",
            data: {
                phone: a
            },
            dataType: "JSON",
            success: function (e) {
                if(e.code=='0'){
                    x = e.data;
                    var counttime = 60;
                    $("#sendCode").text(60);
                    var interval = setInterval(function () {
                        if (counttime > 0) {
                            counttime--;
                            $("#sendCode").text(counttime);
                        } else {
                            window.clearInterval(interval);
                            $("#sendCode").text("重新发送");
                        }
                    }, 1000); //反复执行函数本身
                }else{
                    layer.msg(e.msg);
                }
            },

        })
    }
})


var bindPhone = function () {
    var a = $("#formBind input[name='phone']").val()
    if (!a) {
        return layer.msg("手机号不能为空！", {
            icon: 2
        })
    }
    var n = /^[1]([3-9])[0-9]{9}$/;
    if (!n.test(a)) {
        return layer.msg("手机号格式不正确！", {
            icon: 2
        });
    }
    var b = $("#formBind input[name='smsCode']").val();
    if (!b) {
        return layer.msg("验证码不能为空！", {
            icon: 2
        })
    }

    $.ajax({
        url: baseUrl + "jax/welfare/bind",
        type: "POST",
        data: {
            phone: a, sms: b, token: x, uuid: window.localStorage.getItem("uuid")
        },
        dataType: "JSON",
        success: function (e) {
            if (e.code == '0') {
                layer.msg("绑定成功");
                window.location.reload();
            } else {
                layer.msg(e.msg);
            }
        },
    })
    //验证
}


function getButtonHtml(id, state, time) {
    var color = '';
    var text = '';
    var width = '54px';
    var kq = '';
    var isLogin = window.localStorage.getItem("state");


    if (isLogin == '3') {
        if (state == 1) {
            text = '开抢';
            color = '#2747c3';
            kq = 'onclick="lookGift(' + JSON.stringify(id).replace(/"/g, '&quot;') + ')"';
        } else if (state == 2) {
            //这里应该是倒计时
            width = '80px';
            text = '-----';
            getTime(id, time);
            color = '#ff0000';
        } else if (state == 4) {
            var lspancss = "margin-left: 10px;"
            var ykdhtml = '';
            var lyd = window.localStorage.getItem("lyd");
            var newtime = time.replace(" ","").replace(":","");
            if (lyd != null && lyd != '') {
                if (lyd.indexOf(id + newtime) > -1) {
                    ykdhtml = '<span id="lyd' + id + newtime + '" style="visibility:visible;left: 10px;bottom: 5px;width: 8px!important;height: 8px;border-radius: 50%!important;position: relative;display: inline-block;background-color: #FF5722;"></span>'
                } else {
                    ykdhtml = '<span id="lyd' + id + newtime + '" style="visibility:hidden;left: 10px;bottom: 5px;width: 8px!important;height: 8px;border-radius: 50%!important;position: relative;display: inline-block;background-color: #FF5722;"></span>'
                }
            }
            // var newtime = time.replace(" ","").replace(":","");
            // var lyd = window.localStorage.getItem("lyd");
            // lydarr.push("lyd"+id+newtime);
            // var lspancss = "";
            // var ykdhtml = '';
            // if(lyd == null){
            //     var obj = {};
            //     obj["lyd"+id+newtime] = true;
            //     lyd = JSON.stringify(obj);
            //     window.localStorage.setItem("lyd",lyd)
            // }
            //
            // if(typeof lyd != "undefined" && JSON.parse(lyd)["lyd"+id+newtime] == true ){
            //     lspancss = "margin-left: 10px;"
            //     ykdhtml = '<span id="lyd'+id+newtime+'" style="visibility:visible;left: 10px;bottom: 5px;width: 8px!important;height: 8px;border-radius: 50%!important;position: relative;display: inline-block;background-color: #FF5722;"></span>'
            // }else{
            //     ykdhtml = '<span id="lyd'+id+newtime+'" style="visibility:hidden;left: 10px;bottom: 5px;width: 8px!important;height: 8px;border-radius: 50%!important;position: relative;display: inline-block;background-color: #FF5722;"></span>'
            // }


            text = '<span style="' + lspancss + '">查看</span>' + ykdhtml;
            color = '#2aaae3';
            kq = 'onclick="ck(' + JSON.stringify(id).replace(/"/g, '&quot;') + ',\'' + newtime + '\')"';
        }
    } else {
        if (state != 3) {
            text = '开抢';
            color = '#2747c3';//
            kq = 'onclick="lookGift(' + JSON.stringify(id).replace(/"/g, '&quot;') + ')"';
        }
    }
    if (state == 3) {
        text = '已抢光';
        color = '#909090';
    }
    var html = '<span id="g' + id + '" ' + kq + ' style="color: #fff;padding:0px 10px 0 10px;display: inline-block;border: 1px solid ' + color + ';min-width: ' + width + ';background: ' + color + ';height: 23px;line-height: 23px;border-radius: 4px;font-weight: normal;cursor: pointer;">' + text + '</span>';
    return html;
}


var huidiao = function (id, time) {

    // var newtime = time.replace(" ","").replace(":","");
    // var lyd = window.localStorage.getItem("lyd");
    // $("#lyd"+id+newtime).css("visibility","visible");
    // if(typeof lyd == 'undefined' || lyd == null || lyd == ''){
    //     var obj = {};obj["lyd"+id+newtime] = true;
    //     lyd = obj;
    //     window.localStorage.setItem("lyd",JSON.stringify(lyd));
    // }else{
    //     lyd = JSON.parse(lyd);
    //     if(typeof lyd["lyd"+id+newtime] == 'undefined' || lyd["lyd"+id+newtime] == false){
    //         lyd["lyd"+id+newtime] = true;
    //     }
    //     window.localStorage.setItem("lyd",JSON.stringify(lyd));
    // }
}


function ck(welfareid, time) {
    var lyd = window.localStorage.getItem("lyd");
    if(lyd!=null&&lyd!=''){
        lyd=lyd.replace(welfareid+time,'');
        window.localStorage.setItem("lyd",lyd);
        $("#lyd" + welfareid + time).css("visibility", "hidden");
    }
    // lyd["lyd" + welfareid + time] = false;
    // window.localStorage.setItem("lyd", JSON.stringify(lyd));
    // $("#lyd" + welfareid + time).css("visibility", "hidden");
     var uuid = window.localStorage.getItem("uuid");
    $.ajax({
        url: baseUrl + "jax/welfare/selectOrderByUUid",
        type: 'POST',
        async: false,
        data: {uuid: uuid, welfareid: welfareid},
        timeout: 10000,    //超时时间
        dataType: 'json',
        success: function (data) {
            var order = data.order;
            if (order != null) {
                var html = '';
                html += '<div class="tc tc1">';
                html += '<h1>' + order.mony + '元</h1>';
                html += '<h2>' + order.name + '</h2>';
                html += '<p>游戏帐号：' + order.login + '</p>';
                html += '<p>充值区服：' + order.region + '</p>';
                html += '<p>领取时间：' + order.receive_date + '</p>';
                html += '<p>处理时间：<font style="color: red">' + (order.handle_date == null ? '' : order.handle_date) + '</font></p>';
                var s = '';
                if (order.state == 1) {
                    s = '还未到账';
                } else {
                    s = order.remarks;
                }
                html += '<p>当前状态：' + s + '</p>';
                html += '<center><em>备注：一般10分钟左右到账</em><em style="color:red;font-weight:bold;">显示到账，但实际未到账，举报QQ：271758</em></center>';
                html += '</div>';
                layer.open({
                    type: 1,
                    title: "查看",
                    shade: [.8, "#393D49"],
                    shadeClose: !0,
                    resize: !1,
                    move: !1,
                    zIndex: 8990,
                    area: ["460px", "500px"],
                    content: html
                })
            }

        }
    });
}


function getTime(id, time) {
    time = time + ":00";
    time = new Date(time);
    var date = new Date();
    var diff = parseInt((time.getTime() - date.getTime()) / 1000);
    //计算出相差天数
    var v = '';
    map.set(id, setInterval(function () {
        diff = diff - 1;
        if (diff > (60 * 60)) {
            v = "还有" + parseInt(diff / (60 * 60)) + '小时';
        } else {
            if (diff > 60) {
                v = "还有" + parseInt((diff / 60)) + '分钟';
            } else {
                v = "还有" + diff + "秒";
            }
        }
        $("#g" + id).text(v);
        if (diff <= 0) {
            var html = getButtonHtml(id, 1);
            $("#g" + id + "_").html(getButtonHtml(id, 1));
        }
    }, 1000)); //反复执行函数本身

}


var lookGift = function (id) {
    var isLogin = window.localStorage.getItem("state");
    if (isLogin == '0' || isLogin == '2') {
        $.ajax({
            url: baseUrl + "jax/welfare/getqr",
            type: "POST",
            data: {
                uuid: window.localStorage.getItem("uuid")
            },
            dataType: "JSON",
            success: function (e) {
                layer.open({
                    type: 1,
                    title: "微信扫码登录",
                    resize: !1,
                    move: !1,
                    zIndex: 8990,
                    area: ["360px", "360px"],
                    content: '<div class="tc"><h1>请用微信扫码登录</h1><center><img src="' + e.qr + '" height="200" width="200"></img></center></div>',
                })
            },

        })
    } else if (isLogin == '1') {
        bind();
    } else {
        //订单
        var formData = new FormData();
        formData.append("id", id);
        $.ajax({
            url: baseUrl + "jax/welfare/getArea",
            type: 'POST',
            async: false,
            data: {id: id},
            timeout: 10000,    //超时时间
            dataType: 'json',
            success: function (data) {
                console.log(data);
                data = data.welfare;
                if(data!=null){
                    var list = data.areaList;
                    var html = '';
                    html += '<div class="tc">';
                    html += '<h1>' + data.money + '</h1>';
                    html += '<h2>' + data.name + '</h2>';
                    html += '<h3>数量：' + data.occupy + '/' + data.total + '</h3>';
                    html += '<div id="formReceive">';
                    html += '<input type="text" name="id" value="' + data.id + '" hidden>';
                    html += '<p><span>游戏账号：</span><input type="text" name="login" placeholder="游戏账号" required=""></p>';
                    html += '<p><span>确认账号：</span><input type="text" name="checklogin" placeholder="请再输入一次游戏帐号" required=""></p>';
                    html += '<p>';
                    html += '<span>充值区服：</span>';
                    html += '<span>';
                    if (list.length != 0) {
                        html += '<select name="region">';
                        for (var i in list) {
                            html += '<option value="' + list[i].areaname + '">' + list[i].areaname + '</option>';
                        }
                        html += '</select>'
                    } else {
                        html += '<input type="text" name="region" placeholder="游戏开区名称" maxlength="255" required="">';
                    }
                    html += '</span>';
                    html += '</p>';
                    html += '<em>备注：请输入要充值的区【<a href="' + data.acquisition + '" target="_blank">前去查看</a>】</em>';
                    html += '<em style="color:red;font-weight:bold;">禁止多抢、代抢，发现无条件封号</em>';
                    html += '<button onclick="addOrder()">开抢</button>';
                    html += '</div>';
                    html += '</div>';
                    layer.open({
                        type: 1,
                        skin: 'layui-layer-demo', //样式类名
                        closeBtn: 0, //不显示关闭按钮
                        anim: 2,
                        area: ['460px', '530px'],
                        shadeClose: true, //开启遮罩关闭
                        content: html
                    });
                }

            },
        });
    }
}

var addOrder = function () {
    var html = '';
    html += '<div class="widgets__img_check_box" id="select" style="width:248px;height:250px;margin:0 auto;">';
    html += '<div class="widgets__img_display">';
    html += '<div class="widgets__img_cnt">'
    html += '<img src1="a.jpg" class="widgets__img_src"/>';
    html += '<canvas class="widgets__img_fragment_hollow"></canvas>';
    html += '<div class="widgets__img_fragment_cnt">';
    html += '<canvas class="widgets__img_fragment widgets__img_fragment_shadow"></canvas>';
    html += '<canvas class="widgets__img_fragment widgets__img_fragment_content"></canvas>';
    html += '</div>';
    html += '<div class="widgets__icon_refresh"></div>';
    html += '</div>';
    html += '</div>';
    html += '<div class="widgets__smooth_cnt">';
    html += '<div class="widgets__smooth_bar"></div>';
    html += '<div class="widgets__smooth_circle"></div>';
    html += '</div>';
    html += '</div>';

    $(".layui-layer").css("box-shadow","");
    $("#layui-layer2").css("background","rgb(128, 128, 128,0)");
    var index = layer.open({
        type: 1,
        title: false,
        closeBtn: 0,
        shade:0.3,
        shadeClose: true,
        area: ['1', '1'],
        skin: 'yourclass',
        content: html
    });
    init(index);
    //$(".layui-layer").css("box-shadow","1px 1px 50px rgba(0, 0, 0, .3)");

}

function init(index) {
    var s = WIDGETS.imgSmoothCheck({
        selector: "#select",
        data: ["/statics/images/tx1.png", "/statics/images/tx2.png", "/statics/images/tx3.png"],
        imgHeight: 100,
        imgWidth: 200,
        allowableErrorValue: 3,
        success: function () {
            layer.close(index);
            submitFunction();
        },
        error: function (res) {
            layer.msg("验证失败，请从新验证");
            s.refresh();
        }
    });










//     var arr = ["新春快乐", "阖家快乐", "恭贺新禧", "万事如意", "张灯结彩", "恭喜发财", "假期愉快", "大吉大利"];
// //创建随机成语
//     var math = arr[Math.floor(Math.random() * (arr.length - 1))];
//
//     $('#minbox').html(`请依次点击: <span>${math}</span>`)
//
// //创建一个位置数组
//     var place = [{left: '0px', top: '0px'}, {left: '200px', top: '0px'}, {left: '0px', top: '100px'}, {
//         left: '200px',
//         top: '100px'
//     }]
//
// // var left=Math.floor(Math.random()*(boxs[0].offsetWidth-51)) ;
// // 			var top=Math.floor(Math.random()*(boxs[0].offsetHeight-51));
//
// //随机打乱位置数组
//     place.sort(() => {
//         return Math.random() - 0.5
//     })
//
// //创建一个数组用于与最终结果验证
//     var verify = []
//
// //遍历随机成语并创建标签
//     for (i in math) {
//         verify.push(i)
//         //创建随机左边位置
//         var left = Math.floor(Math.random() * (150))
//         var top = Math.floor(Math.random() * (50));
//
//         //创建存放span的div对象
//         divs = $('<div class="fl"></div>')
//         //给div定位
//         divs.css({
//             left: place[i].left,
//             top: place[i].top
//         })
//
//
//         //创建储存文字的span标签
//         span = $(`<span>${math[i]}</span>`)
//         //随机span的位置
//         span.css({
//             left: left + 'px',
//             top: top + 'px'
//         })
//
//         span.data('index', i);
//         span.data('judge', 'true');
//         divs.append(span);
//         $('#box').append(divs)
//
//     }
//
// //span点击事件
//     var cspan = []
//     $('#box .fl span').live("click", function () {
//         if ($(this).data('judge') == 'true') {
//             cspan.push($(this).data('index'))
//             $(this).data('judge', 'false')
//             console.log(cspan)
//
//         } else {
//             console.log('重复点击')
//         }
//     })
//
//     var a = 0
// //大盒子点击事件,用于生成小绿点
//     $('#box').live("click", function (event) {
//         a++;
//         var rad = $(`<div class='radio'>${a}</div>`)
//         rad.css({
//             left: event.pageX - $(this).offset().left - 15 + 'px',
//             top: event.pageY - $(this).offset().top - 15 + 'px'
//         })
//
//         $(this).append(rad)
//         if (a == 4) {
//             if (cspan.join() == verify.join()) {
//                 $('#minbox').addClass('size')
//                 $('#minbox').html('验证成功')
//                 $('.fl').css('display', 'none')
//                 $('.radio').css('opacity', '0')
//                 layer.close(index);
//                 submitFunction();
//             } else {
//                 $('.fl').css('display', 'none')
//                 $('.radio').css('opacity', '0')
//                 $('#minbox').html('验证失败')
//                 $('#minbox').css('color', 'red')
//                 cspan = [];
//                 init(index);
//             }
//             a = 0
//         }
//     })
}


var submitFunction = function () {
    var account = $("#formReceive input[name='login']").val();
    var checklogin = $("#formReceive  input[name='checklogin']").val();
    var region = $("#formReceive  select[name='region']").val();
    var welfareid = $("#formReceive  input[name='id']").val();
    if (region == null || region == '') {
        region = $("#formReceive  input[name='region']").val();
    }


    if (account == null || account == '') {
        layer.msg("请输入游戏账号");
        return;
    }
    if (checklogin == null || checklogin == '') {
        layer.msg("请验证账号");
        return;
    }
    if (region == null || region == '') {
        layer.msg("请选择充值大区");
        return;
    }

    if (account != checklogin) {
        layer.msg("账号输入不一直");
        return;
    }
    var uuid = window.localStorage.getItem("uuid");
    if (uuid != null) {
        $.ajax({
            url: baseUrl + "jax/welfare/seckill",
            type: 'POST',
            async: false,
            data: {uuid: uuid, account: account, region: region, welfareid: welfareid},
            timeout: 10000,    //超时时间
            dataType: 'json',
            success: function (data) {
                layer.closeAll();
                layer.msg(data.message);
                if (data.message == '抢充值成功') {
                    $.ajax({
                        url: baseUrl + "jax/welfare/selectOrderByUUid",
                        type: 'POST',
                        async: false,
                        data: {uuid: uuid, welfareid: welfareid},
                        timeout: 10000,    //超时时间
                        dataType: 'json',
                        success: function (data) {
                            var order = data.order;
                            if (order != null) {
                                var html = '';
                                html += '<div class="tc tc1">';
                                html += '<h1>' + order.mony + '元</h1>';
                                html += '<h2>' + order.name + '</h2>';
                                html += '<p>游戏帐号：' + order.login + '</p>';
                                html += '<p>充值区服：' + order.region + '</p>';
                                html += '<p>领取时间：' + order.receive_date + '</p>';
                                html += '<p>处理时间：<font style="color: red">' + (order.handle_date == null ? '' : order.handle_date) + '</font></p>';
                                var s = '';
                                if (order.state == 1) {
                                    s = '还未到账';
                                } else {
                                    s = order.remarks;
                                }
                                html += '<p>当前状态：' + s + '</p>';
                                html += '<center><em>备注：一般10分钟左右到账</em><em style="color:red;font-weight:bold;">显示到账，但实际未到账，举报QQ：271758</em></center>';
                                html += '</div>';
                                layer.open({
                                    type: 1,
                                    title: "领取成功",
                                    shade: [.8, "#393D49"],
                                    shadeClose: !0,
                                    resize: !1,
                                    move: !1,
                                    zIndex: 8990,
                                    area: ["460px", "500px"],
                                    content: html
                                })
                            }

                        }
                    });
                    layer.alert('领取成功<br/>您今日领取次数还剩' + data.count + '次', {
                        title: '提示',
                        icon: 1,
                        skin: 'layer-ext-moon' //该皮肤由layer.seaning.com友情扩展。关于皮肤的扩展规则，去这里查阅
                    }, function () {
                        layer.closeAll();
                        window.location.reload();
                    })

                } else {

                }
                //layer.msg(data.message)
            }
        });
    } else {
        layer.msg("请用微信扫码登录");
    }
}

// 让ie支持map
function Map() {
    this.elements = new Array();
// 获取Map元素个数
    this.size = function () {
        return this.elements.length;
    },
// 判断Map是否为空
        this.isEmpty = function () {
            return (this.elements.length < 1);
        },
// 删除Map所有元素
        this.clear = function () {
            this.elements = new Array();
        },
// 向Map中增加元素（key, value)
        this.put = function (_key, _value) {
            if (this.containsKey(_key) == true) {
                if (this.containsValue(_value)) {
                    if (this.remove(_key) == true) {
                        this.elements.push({
                            key: _key,
                            value: _value
                        });
                    }
                } else {
                    this.elements.push({
                        key: _key,
                        value: _value
                    });
                }
            } else {
                this.elements.push({
                    key: _key,
                    value: _value
                });
            }
        },
// 向Map中增加元素（key, value)
        this.set = function (_key, _value) {
            if (this.containsKey(_key) == true) {
                if (this.containsValue(_value)) {
                    if (this.remove(_key) == true) {
                        this.elements.push({
                            key: _key,
                            value: _value
                        });
                    }
                } else {
                    this.elements.push({
                        key: _key,
                        value: _value
                    });
                }
            } else {
                this.elements.push({
                    key: _key,
                    value: _value
                });
            }
        },
// 删除指定key的元素，成功返回true，失败返回false
        this.remove = function (_key) {
            var bln = false;
            try {
                for (i = 0; i < this.elements.length; i++) {
                    if (this.elements[i].key == _key) {
                        this.elements.splice(i, 1);
                        return true;
                    }
                }
            } catch (e) {
                bln = false;
            }
            return bln;
        },
// 删除指定key的元素，成功返回true，失败返回false
        this.delete = function (_key) {
            var bln = false;
            try {
                for (i = 0; i < this.elements.length; i++) {
                    if (this.elements[i].key == _key) {
                        this.elements.splice(i, 1);
                        return true;
                    }
                }
            } catch (e) {
                bln = false;
            }
            return bln;
        },
// 获取指定key的元素值value，失败返回null
        this.get = function (_key) {
            try {
                for (i = 0; i < this.elements.length; i++) {
                    if (this.elements[i].key == _key) {
                        return this.elements[i].value;
                    }
                }
            } catch (e) {
                return null;
            }
        },
// set指定key的元素值value
        this.setValue = function (_key, _value) {
            var bln = false;
            try {
                for (i = 0; i < this.elements.length; i++) {
                    if (this.elements[i].key == _key) {
                        this.elements[i].value = _value;
                        return true;
                    }
                }
            } catch (e) {
                bln = false;
            }
            return bln;
        },
// 获取指定索引的元素（使用element.key，element.value获取key和value），失败返回null
        this.element = function (_index) {
            if (_index < 0 || _index >= this.elements.length) {
                return null;
            }
            return this.elements[_index];
        },
// 判断Map中是否含有指定key的元素
        this.containsKey = function (_key) {
            var bln = false;
            try {
                for (i = 0; i < this.elements.length; i++) {
                    if (this.elements[i].key == _key) {
                        bln = true;
                    }
                }
            } catch (e) {
                bln = false;
            }
            return bln;
        },
// 判断Map中是否含有指定key的元素
        this.has = function (_key) {
            var bln = false;
            try {
                for (i = 0; i < this.elements.length; i++) {
                    if (this.elements[i].key == _key) {
                        bln = true;
                    }
                }
            } catch (e) {
                bln = false;
            }
            return bln;
        },
// 判断Map中是否含有指定value的元素
        this.containsValue = function (_value) {
            var bln = false;
            try {
                for (i = 0; i < this.elements.length; i++) {
                    if (this.elements[i].value == _value) {
                        bln = true;
                    }
                }
            } catch (e) {
                bln = false;
            }
            return bln;
        },
// 获取Map中所有key的数组（array）
        this.keys = function () {
            var arr = new Array();
            for (i = 0; i < this.elements.length; i++) {
                arr.push(this.elements[i].key);
            }
            return arr;
        },
// 获取Map中所有value的数组（array）
        this.values = function () {
            var arr = new Array();
            for (i = 0; i < this.elements.length; i++) {
                arr.push(this.elements[i].value);
            }
            return arr;
        };
    /**
     * map遍历数组
     * @param callback [function] 回调函数；
     * @param context [object] 上下文；
     */
    this.forEach = function forEach(callback, context) {
        context = context || window;
//IE6-8下自己编写回调函数执行的逻辑
        var newAry = new Array();
        for (var i = 0; i < this.elements.length; i++) {
            if (typeof callback === 'function') {
                var val = callback.call(context, this.elements[i].value, this.elements[i].key, this.elements);
                newAry.push(this.elements[i].value);
            }
        }
        return newAry;
    }
}
