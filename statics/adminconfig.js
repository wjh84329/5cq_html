/**
 * jaxui 全局配置
 * Create by xl-Song on 2020-03-03 12:04:26
 */
//document.write("<script language=javascript src='/statics/js/jquery-3.2.1.min.js'></script>");
//document.write("<script language=javascript src='/jaxui/bootstrap-3.3.7/old/bootstrap.min.js'></script>");
//document.write("<script language=javascript src='/statics/js/jquery.cookie.js'></script> ");
document.write("<script language=javascript src='/statics/admin.js'></script>");
// var baseUrl ="http://1pk.com/server/"
// var baseUrl ="http://39.106.145.49:8086/server/"
// var baseUrl ="https://wx.1pk.com/server/"
// var baseUrl ="http://jaxone.5cq.com/server/"
var baseUrl ="https://kkw.5cq.com/server/"
// var baseUrl ="http://localhost:8086/server/"
//全局参数配置
var jaxui = {

  url:baseUrl, //请求URL地址
  //nologinurl:"/views/login.html",//未登录跳转页面
  //titlelogo:"/jaxui/images/bg.jpg",//浏览器标签logo

  customer:($.cookie("user")==''||$.cookie("user")==null?null:JSON.parse($.cookie("user"))),

  //公司初始信息
  company:{
    name : "xxxx有限公司",//公司名称
    describe : "xxxx公司",//公司描述
    url : "https://xxxx.com",//公司网址
    valid : "2020" //运营时间
  },
  //开发者
  develop:{
    name : "徐州言语网络科技有限公司",
    describe : "软件开发公司",//公司描述
    url : "https://zhaoff.com",//公司网址
  },


  //自定义响应字段
  request:{
    tokenName:"token"
  }

  //自定义响应字段
  ,response: {
    statusName: 'code' //数据状态的字段名称
    ,statusCode: {
      ok: 0 //数据状态一切正常的状态码
      ,nologin: 1//未登录用户
      ,kickout: 401 //用户在别处登录
      ,error:500 //代码报错
    }
    ,msgName: 'msg' //状态信息的字段名称
    ,dataName: 'data' //数据详情的字段名称
  }

};


//框架初始化
// var init = function() {
//   if (document.getElementById("name") != null) document.getElementById("name").innerText = jaxui.company.name;
//   if (document.getElementById("describe") != null) document.getElementById("describe").innerText = jaxui.company.name;
//   if (document.getElementById("url") != null) document.getElementById("url").innerText = jaxui.company.name;
//
//   if (document.getElementById("name") != null) document.getElementById("name").innerText = jaxui.develop.name;
//   if (document.getElementById("describe") != null) document.getElementById("describe").innerText = jaxui.develop.name;
//   if (document.getElementById("url") != null) document.getElementById("url").innerText = jaxui.develop.name;
// }

//页面标签logo
//document.write(' <link rel="icon" href="'+jaxui.titlelogo+'" type="image/x-icon"/>');

//共用css引用，注意先后次序
//document.write('<link rel="stylesheet" href="/jaxui/bootstrap-3.3.7/old/bootstrap.css">');


//共用js引用，注意先后次序
//document.write("<script language=javascript src='/statics/js/jquery-3.2.1.min.js'></script>");
//document.write("<script language=javascript src='/jaxui/bootstrap-3.3.7/old/bootstrap.min.js'></script>");
//document.write("<script language=javascript src='/statics/admin.js'></script>");



//init();
