//全局通用方法
var admin = {};

//请求
admin.req = function (options) {

  //参数初始化
  options.data = options.data || {};
  options.headers = options.headers || {};

  //携带token
  if ($.cookie('token') != null){
    options.headers[jaxui.request.tokenName] = $.cookie('token') ;
  }

  return $.ajax($.extend({
    type: 'post'
    ,dataType: 'json'
    ,success: function(res){
      if (jaxui.response.statusCode.nologin == res.code){
        $.removeCookie(jaxui.request.tokenName,{ path: '/'});
        $.removeCookie('user',{ path: '/'});
        //myLogin();
      }

      //登录失败
      else if (22222 == res.code){
        iosOverlay({
          text: "登录失败",
          duration: 2e3,
//          icon: "../jaxui/images/cross.png"
        });
//        $("#login-button").removeAttr("disabled");
      }
      else{
        $.cookie('user', $.cookie('user'), { expires: expiresTime(), path: '/' });
        $.cookie('token', $.cookie('token'),{ expires: expiresTime(), path: '/' });
        typeof options.done === 'function' && options.done(res);
      }

    }
    ,error: function(e, code){
    }
  }, options));
};

//获取html传来参数
admin.getHtmlParams = function (param) {
  var reg = new RegExp("(^|&)"+ param +"=([^&]*)(&|$)");
  var r = window.location.search.substr(1).match(reg);
  if(r!=null)return  unescape(r[2]); return null;
};


//退出登录
admin.logout = function(){
  $.removeCookie(jaxui.request.tokenName,{ path: '/'});
  $.removeCookie('user',{ path: '/'});
  window.location.href = './../index.html';
};



//form转json
(function($){
  $.fn.toField=function(){
    var serializeObj={};
    var array=this.serializeArray();
    var str=this.serialize();
    $(array).each(function(){
      if(serializeObj[this.name]){
        if($.isArray(serializeObj[this.name])){
          serializeObj[this.name].push(this.value);
        }else{
          serializeObj[this.name]=[serializeObj[this.name],this.value];
        }
      }else{
        serializeObj[this.name]=this.value;
      }
    });
    return serializeObj;
  };
})(jQuery);






