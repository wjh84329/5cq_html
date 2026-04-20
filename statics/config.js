//全局配置中心
var zhaoff = {
    logo:'/statics/images/banner.png',
    logo1:'/statics/images/logo.png',
    logo2:'/statics/images/banner.png',
    logo3:'/statics/images/logo.png',
    title:'-1PK.COM',//html标签名-1PK.COM
    keywords:'-1PK.COM',
    description:'-1PK.COM',
    head_left_title:'备用同步域名:www.1pk.com',//网站左侧展示内容
    head_center_advert:'&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;网站数据匀采集互联网,如发现跑路服,涉及诈骗,赌博等违法行为请联系我们举报QQ：3067585 ',//网站中间公告
    first_title:[//一级标题功能参数配置['一级功能名称'，'一级功能名称（小）','url=false提示正在开发中',true:显示热门|false:默认不显示,['index']=默认选中的]
      ['首页','HOME','/index.html',false,['index','']],
      ['广告排行','AD. RANKING','/code/ranking.html',true,['ranking']],
      ['手游排行','MA.RANKING','/code/phoneRank.html',true,['phoneRank']],
      ['广告筛选','FA.NETWORK','/code/fastscreen.html',false,['fastscreen']],
      ['黑名单','BLACK LIST','/code/report.html',false,['report','']],
      ['招聘交易','RECRUIT·TRADE','/code/recruTran.html',false,['recruTran','recruTran_edit']],
      ['免费资源','F·RESOURCES','/code/forumFunction.html',true,['forumFunction','forumFunction_edit']],
      ['玩家群.主播','玩家群.主播','/code/playerGroup.html',false,['playerGroup']],
      ['品牌大服','BRAND SERVER','/code/ppdf.html',true,['ppdf','']],
      ['新闻公告','NEWS','/code/journalism.html',false,['journalism']],
      ['发布站点','PUBLISH SITES','/code/publishSites.html',false,['publishSites']],
      ['工具导航','SITE NAVIGATION','/code/resourceNavigation.html',false,['resourceNavigation']]
    ],

    friendurl://友情链接
        '<dl class="links-list">\n' +
        '            <dt>友情链接：</dt>\n' +
        '            <dd>\n' +
        '                <ul class="links-list-ul">\n' +
        '                    <li><a href="https://www.zhaoff.com" target="_blank">传奇SF</a></li>\n' +
        '                    <li><a href="https://www.zhaoff.com" target="_blank">传奇私服</a></li>\n' +
        '                    <li><a href="https://www.zhaoff.com" target="_blank">新开传奇</a></li>\n' +
        '                    <li><a href="https://www.zhaoff.com" target="_blank">传奇辅助</a></li>\n' +
        '                    <li><a href="https://www.zhaoff.com" target="_blank">单机传奇</a></li>\n' +
        '                    <li><a href="https://www.zhaoff.com" target="_blank">传奇版本库</a></li>\n' +
        '                    <li><a href="https://www.zhaoff.com" target="_blank">传奇在线查广告</a></li>\n' +
        '                </ul>' +
        '            </dd>' +
        '        </dl>' ,


    bottom://底部
        '   <p>拒绝盗版游戏 注意自我保护 谨防受骗上当 适度游戏益脑 沉迷游戏伤身 合理安排时间 享受健康生活</p>\n' +
        '   <p>*注释：本站发布所有游戏信息，均来自互联网，与本站无关。请玩家仔细辨认游戏信息的真实性，避免上当受骗!</p>\n' +
        '   <p>传奇资源站-为更多寻找<a target="_blank" href="https://www.zhaoff.com">新开传奇网站</a>的传奇SF玩家提供的一个开放性的<a target="_blank" href="https://www.zhaoff.com">传奇SF</a>发布网交流平台。</p>\n' +
        '   <p>2016-2020 www.zhaoff.com All Rights Reserved.<a href="https://www.zhaoff.com/sitemap.html" target="_blank"> 网站地图</a></p>\n'+
        '   <p><a target="_blank" href="http://www.beian.miit.gov.cn"  rel="nofollow" >苏ICP备20000882号-3</a></p>\n',



    //传奇资源-板块图标
    bk:{
        1:'/statics/images/block/cqbb.gif',//传奇版本图片
        2:'/statics/images/block/cqjb.gif',//传奇脚本
        3:'/statics/images/block/cqgj.gif',//传奇工具
        4:'/statics/images/block/wzym.gif',//网站源码
        5:'/statics/images/block/cqsc.gif',//传奇素材
        6:'/statics/images/block/zhzy.gif'//综合资源
    },


    jyxqms:' *联系卖家时，请说是在5cq网站上看到的，谢谢！',
    jywxts:'<span>温馨提示：</span>请务必进行平台担保交易，切勿线下交易，谨防上当受骗！ 传奇圈网站为您保障交易安全！',

    cusurl:'/statics/images/logo.gif',
    vipurl:'https://jq.qq.com/?_wv=1027&k=BkVnYYIE',//注册vip跳转连接

    is_vip0:'/statics/images/is_vip/yong.gif',
    is_vip1:'/statics/images/is_vip/chuan.gif',

    tzeditqr:'/statics/images/wx.jpg' //帖子详情右侧二维码


};





//初始化操作
//head赋值
zhaoff.inithead = function (id) {
    $("#head").css("height","270px");
    var headhtml =
        '<div class=" newhead header">\n' +
        '   <div class="header-fr" >\n' +
        '       <div id="userName" style="font-size:13px;display: flex"></div>' +
        '    </div>' +
        '</div>'+
        '<div class="logo" style="background: url(/statics/images/banner.png) no-repeat center top;height: 480px !important;">\n' +
        // '<img src="'+zhaoff.logo+'"/>\n' +
        // '</div>\n'+
        // '<div class="logo1">\n' +
        // '<img src="'+zhaoff.logo1+'"/>\n' +
        '</div>\n';

    $(id).html(headhtml);
}


//初始化操作
//head赋值
zhaoff.initheadArticle = function (id) {
    $("#head").css("height","270px");
    var headhtml =
        '<div class=" newhead header" style="top:200px">\n' +
        '   <div class="header-fr" >\n' +
        '       <div id="userName" style="font-size:13px;display: flex"></div>' +
        '    </div>' +
        '</div>'+
        '<div class="logo">\n' +
        '<img src="'+zhaoff.logo+'"/>\n' +
        '</div>\n'+
        '<div class="logo1">\n' +
        '<img src="'+zhaoff.logo1+'"/>\n' +
        '</div>\n';

    $(id).html(headhtml);
}

var a = location.href;
var b = a.split("/");
var c = b.slice(b.length - 1, b.length).toString(String).split(".");
var htmlid = c.slice(0, 1)[0];
console.log(htmlid);






//一级标题赋值
zhaoff.initftitle = function (id) {
    //一级标题被选中的索引
    var titlehtml = '<div class="nav clearfix" id="cdmenu" style="overflow:initial;position: relative" id="">\n';
    var titles = zhaoff.first_title;
    for (var i in titles){

        var active = false;
        var arr = titles[i][4];
        for (var ids in arr){
            if (arr[ids] == htmlid){
                active = true;
            }
        }

        if (typeof titles[i][5] == 'undefined')titles[i][5]='';
        titlehtml +=
            '<a href="'+(titles[i][2]?titles[i][2]:"javascript:;")+'" target="'+titles[i][5]+'"   onclick="openActive(\''+titles[i][0]+'\',\''+titles[i][2]+'\','+i+');" class=" '+(active?"active ":"")+' clearfix" style="cursor: pointer">\n' +
            '   <img style="display:'+(titles[i][3]?"block":"none" )+';"  src="/statics/images/hot.gif" class="icon">\n' +
            '   <div>\n' +
            '       <p>'+titles[i][0]+'</p>\n' +
            '       <p>'+titles[i][1]+'</p>\n' +
            '   </div>\n' +
			'   <em></em>\n' +
            '</a>\n';

    }
    titlehtml += '</div>\n';
    $(id).html(titlehtml);
}


//执行点击一级标题方法
var openActive = function(name,flag,index){
    if (flag == 'false'){
        layer.msg(name+' 正在开发中敬请期待!!!');
        return false;
    }
}

var regPos = /^\d+(\.\d+)?$/; //非负浮点数
var regNeg = /^(-(([0-9]+\.[0-9]*[1-9][0-9]*)|([0-9]*[1-9][0-9]*\.[0-9]+)|([0-9]*[1-9][0-9]*)))$/; //负浮点数
// if(!regPos.test(htmlid) && !regNeg.test(htmlid)){
//     //head标签元素赋值
//     document.title = document.title + zhaoff.title;
//     var meta = document.getElementsByTagName("meta");
//     for (var i in meta){
//         if (meta[i].name == 'keywords'){
//             meta[i].content = meta[i].content+zhaoff.keywords;
//         }
//         else if (meta[i].name == 'description'){
//             meta[i].content = meta[i].content+zhaoff.description;
//         }
//     };
// }


//底部
//zhaoff.initbhtml = function (id) {
//    var bottomhtml =
//        ' <div class="flink" id="friendurl">'+zhaoff.friendurl+'</div>\n' +
//        '    <div class="footer">\n' +
//        '        <p class="info"style="text-align:center;line-height:24px;padding:12px 0;margin-top:15px;color:#666;border-top:1px solid #dbe7ed;"></p>\n' +
//        '        <div id="bottom">'+zhaoff.bottom+'</div>\n'  +
//        '    </div>\n';
//    $(id).html(bottomhtml);
//};
//}



//var flag = true;
//var script = document.getElementsByTagName("script");
//for (var i in script){
//    var str = script[i].src+"";
//    if (str.indexOf("https://hm.baidu.com/hm.js") != -1){
//        flag = false;
//    };
//};

//if (flag && htmlid != "wz"&&htmlid!='brand'){
 //   document.write(
 //       '<script>'+
 //       '	var hmbaidu = 1;'+
//        '	var _hmt = _hmt || [];'+
//        '	(function() {'+
//        '	var hm = document.createElement("script");'+
//        '	hm.src = "https://hm.baidu.com/hm.js?f1b4f0487ec5fe7f4f72bf2bd57d969e";'+
//        '	var s = document.getElementsByTagName("script")[0]; '+
//        '	s.parentNode.insertBefore(hm, s);'+
//        '	})();'+
//        '</script>'+
//        '<script>' +
//        '(function(){' +
//        '    var bp = document.createElement(\'script\');' +
//        '    var curProtocol = window.location.protocol.split(\':\')[0];' +
//        '    if (curProtocol === \'https\') {' +
//        '        bp.src = \'https://zz.bdstatic.com/linksubmit/push.js\';' +
//        '    }' +
//        '    else {' +
//        '        bp.src = \'http://push.zhanzhang.baidu.com/push.js\';' +
//        '    }' +
 //       '    var s = document.getElementsByTagName("script")[0];' +
//        '    s.parentNode.insertBefore(bp, s);' +
//        '})();' +
 //       '</script>'

		
		
		
		


























