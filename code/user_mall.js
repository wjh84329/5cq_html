/**
 * 金币商城功能模块
 * 包含商品列表、兑换记录、商品兑换等功能
 */

// ====== 金币商城功能 ======
// 加载商品列表
function loadMallGoods(page) {
  var pageSize = 20;
  var activeType = $('.mall-tab-btn.active').data('type');

  $.ajax({
    url: hzRequestUrl + 'Goods/goods_list',
    type: 'GET',
    data: {
      pageNum: page,
      pageSize: pageSize
    },
    dataType: 'json',
    success: function(res) {
      console.log('商品列表 API 响应:', res);
      if (res && res.code === 200 && res.data) {
        var goods = res.data || [];
        
        // 根据标签类型筛选商品
        if (activeType === 'virtual') {
          goods = goods.filter(item => item.type == 1);
        } else if (activeType === 'physical') {
          goods = goods.filter(item => item.type == 0);
        }
        
        var total = goods.length;
        var totalPages = Math.ceil(total / pageSize);

        console.log('商品列表数据:', goods);
        console.log('商品总数:', total);
        console.log('总页数:', totalPages);

        // 清空商品列表
        $('#mallGoodsContent').empty();

        // 填充商品
        for (var i = 0; i < goods.length; i++) {
          var item = goods[i];
          var goodsType = item.type == 1 ? 'virtual' : 'physical';
          var goodsHtml = `
            <div class="mall-goods-item" 
                 data-id="${item.id}" 
                 data-name="${item.title || ''}" 
                 data-price="${item.price || 0}" 
                 data-type="${goodsType}" 
                 data-stock="${item.num || 0}" 
                 data-image="${item.img || ''}">
              <div class="mall-goods-image">
                <img src="${item.img || '../statics/images/01.png'}">
              </div>
              <div class="mall-goods-title" title="${item.title || ''}">${item.title || ''}</div>
              <div class="mall-goods-price">${item.price || 0} 金币</div>
              <button class="mall-buy-btn">立即兑换</button>
            </div>
          `;
          $('#mallGoodsContent').append(goodsHtml);
        }

        // 生成分页
        generatePagination('mallGoodsPagination', page, totalPages, total, loadMallGoods);
      } else {
        console.error('商品列表 API 响应格式不正确:', res);
        alert('加载商品列表失败：响应格式不正确');
      }
    },
    error: function(xhr, status, error) {
      console.error('加载商品列表失败:', status, error);
      console.error('XHR 响应:', xhr.responseText);
      alert('加载商品列表失败：' + error);
    }
  });
}

// 加载兑换记录
function loadMallOrders(page) {
  var pageSize = 20;
  var open_id = getUser(1).openid || '';

  $.ajax({
    url: hzRequestUrl + 'goods/order_list',
    type: 'GET',
    data: {
      pageNum: page,
      pageSize: pageSize,
      open_id: open_id
    },
    headers: {
      'boxVersion': '1.0.0',
      'token':$.cookie('hzusertoken')
    },
    dataType: 'json',
    success: function(res) {
      console.log('兑换记录 API 响应:', res);
      if (res && res.code === 200 && res.data) {
        var orders = res.data || [];
        var total = orders.length;
        var totalPages = Math.ceil(total / pageSize);

        console.log('兑换记录数据:', orders);
        console.log('订单总数:', total);
        console.log('总页数:', totalPages);

        // 清空订单列表
        $('#mallOrderBody').empty();

        // 填充订单
        if (orders.length > 0) {
          for (var i = 0; i < orders.length; i++) {
            var order = orders[i];
            var tr = `
              <tr>
                <td style="padding:10px; border:1px solid #ddd;">${order.coin_goods_title || ''}</td>
                <td style="padding:10px; border:1px solid #ddd;">
                  <img src="${order.coin_goods_img || '../statics/images/01.png'}" style="width: 50px; height: 50px; object-fit: cover;">
                </td>
                <td style="padding:10px; border:1px solid #ddd;">${order.order_type == 1 ? '虚拟商品' : '实体商品'}</td>
                <td style="padding:10px; border:1px solid #ddd;">${order.order_statu == 1 ? '已完成' : '未完成'}</td>
                <td style="padding:10px; border:1px solid #ddd;">${order.consignee_name || ''}</td>
                <td style="padding:10px; border:1px solid #ddd;">${order.consignee_phone || ''}</td>
                <td style="padding:10px; border:1px solid #ddd;">${order.consignee_address || order.ptzh || ''}</td>
                <td style="padding:10px; border:1px solid #ddd;">
                  ${order.order_statu == 0 ? '<a href="javascript:;" class="editOrderBtn" data-id="' + order.id + '" data-type="' + order.order_type + '" data-name="' + (order.consignee_name || '') + '" data-phone="' + (order.consignee_phone || '') + '" data-address="' + (order.consignee_address || order.ptzh || '') + '" style="color: #0066cc; text-decoration: none;">修改订单信息</a>' : ''}
                </td>
              </tr>
            `;
            $('#mallOrderBody').append(tr);
          }
        } else {
          // 显示没有数据的提示
          var emptyTr = `
            <tr>
              <td colspan="8" style="padding:20px; border:1px solid #ddd; text-align:center;">暂无兑换记录</td>
            </tr>
          `;
          $('#mallOrderBody').append(emptyTr);
        }

        // 生成分页
        generatePagination('mallOrderPagination', page, totalPages, total, loadMallOrders);
      } else {
        console.error('兑换记录 API 响应格式不正确:', res);
        alert('加载兑换记录失败：响应格式不正确');
      }
    },
    error: function(xhr, status, error) {
      console.error('加载兑换记录失败:', status, error);
      console.error('XHR 响应:', xhr.responseText);
      alert('加载兑换记录失败：' + error);
    }
  });
}

// 商品兑换
$(document)
  .off('click.mallBuy')
  .on('click.mallBuy', '.mall-buy-btn', function() {
    var id = $(this).closest('.mall-goods-item').data('id');
    var name = $(this).closest('.mall-goods-item').data('name');
    var price = $(this).closest('.mall-goods-item').data('price');
    var type = $(this).closest('.mall-goods-item').data('type');
    var stock = $(this).closest('.mall-goods-item').data('stock');
    var image = $(this).closest('.mall-goods-item').data('image');

    // 显示兑换弹窗
    var modalContent = '';
    if (type === 'virtual') {
      // 虚拟商品兑换弹窗
      modalContent = `
        <div style="padding: 20px; width: 100%; box-sizing: border-box;">
          <div style="display: flex; margin-bottom: 20px;">
            <div style="margin-right: 20px;">
              <img src="${image || '../statics/images/01.png'}" style="width: 100px; height: 100px; object-fit: contain;">
            </div>
            <div>
              <h3 style="margin-bottom: 10px;">${name}</h3>
              <p style="margin-bottom: 5px;">商品库存：${stock || 0} 个</p>
              <p style="margin-bottom: 5px;">商品价格：<b style="color: #ff0000;">${price} 金币</b></p>
            </div>
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: inline-block; width: 80px;"><span style="color: #ff0000;">*</span> 电话：</label>
            <input type="text" id="phone" style="width: 250px; padding: 8px; border: 1px solid #ddd; border-radius: 3px;">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: inline-block; width: 80px;"><span style="color: #ff0000;">*</span> 账户：</label>
            <input type="text" id="account1" style="width: 250px; padding: 8px; border: 1px solid #ddd; border-radius: 3px;">
          </div>
          <div style="text-align: center; margin-top: 30px;">
            <button id="cancelExchange" style="margin-right: 20px; padding: 8px 25px; background: #ccc; color: #333; border: 0; border-radius: 3px; cursor: pointer;">取消</button>
            <button id="confirmExchange" style="padding: 8px 25px; background: #d60000; color: #fff; border: 0; border-radius: 3px; cursor: pointer;">兑换</button>
          </div>
        </div>
      `;
    } else {
      // 实体商品兑换弹窗
      modalContent = `
        <div style="padding: 20px; width: 100%; box-sizing: border-box;">
          <div style="display: flex; margin-bottom: 20px;">
            <div style="margin-right: 20px;">
              <img src="${image || '../statics/images/01.png'}" style="width: 100px; height: 100px; object-fit: contain;">
            </div>
            <div>
              <h3 style="margin-bottom: 10px;">${name}</h3>
              <p style="margin-bottom: 5px;">商品库存：${stock || 0} 个</p>
              <p style="margin-bottom: 5px;">商品价格：<b style="color: #ff0000;">${price} 金币</b></p>
            </div>
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: inline-block; width: 80px;"><span style="color: #ff0000;">*</span> 联系人：</label>
            <input type="text" id="recipient" style="width: 250px; padding: 8px; border: 1px solid #ddd; border-radius: 3px;">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: inline-block; width: 80px;"><span style="color: #ff0000;">*</span> 电话：</label>
            <input type="text" id="phone" style="width: 250px; padding: 8px; border: 1px solid #ddd; border-radius: 3px;">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: inline-block; width: 80px; vertical-align: top; white-space: nowrap;"><span style="color: #ff0000;">*</span> 收货地址：</label>
            <textarea id="address" style="width: 250px; height: 80px; padding: 8px; border: 1px solid #ddd; border-radius: 3px; resize: none;"></textarea>
          </div>
          <div style="text-align: center; margin-top: 30px;">
            <button id="cancelExchange" style="margin-right: 20px; padding: 8px 25px; background: #ccc; color: #333; border: 0; border-radius: 3px; cursor: pointer;">取消</button>
            <button id="confirmExchange" style="padding: 8px 25px; background: #d60000; color: #fff; border: 0; border-radius: 3px; cursor: pointer;">兑换</button>
          </div>
        </div>
      `;
    }

    layui.use(['layer'], function() {
      var layer = layui.layer;
      var dialog = layer.open({
        type: 1,
        title: '商品兑换',
        area: type === 'virtual' ? ['450px', '380px'] : ['450px', '480px'],
        shade: 0.3,
        content: modalContent,
        success: function() {
          // 绑定确认按钮点击事件
          $('#confirmExchange').off('click').on('click', function() {
            // 表单验证
            var phone = $('#phone').val().trim();
            if (!phone) {
              layer.msg('请输入电话');
              return;
            }
            
            if (type === 'physical') {
              var recipient = $('#recipient').val().trim();
              var address = $('#address').val().trim();
              if (!recipient) {
                layer.msg('请输入联系人');
                return;
              }
              if (!address) {
                layer.msg('请输入收货地址');
                return;
              }
            } else {
              var account = $('#account1').val().trim();
              if (!account) {
                layer.msg('请输入账户');
                return;
              }
            }
            
            // 弹出确认提示框
            layer.confirm('确认兑换吗？', {
              title: '提示',
              btn: ['确认', '取消']
            }, function(index) {
              // 确认
              layer.close(index);
              
              // 先调用 setCoin 接口
              var open_id = getUser(1).openid || '';
              $.ajax({
                url: hzRequestUrl + 'user/setCoin',
                type: 'POST',
                headers: {
                  'boxVersion': '1.0.0',
                  'token':$.cookie('hzusertoken')
                },
                data: {
                  open_id: open_id,
                  type: 38,
                  goods_id: id
                },
                dataType: 'json',
                success: function(res) {
                  if (res && res.code === 200) {
                    // 再调用 add_order 接口
                    var orderData = {
                      coin_goods_id: id,
                      open_id: open_id,
                      consignee_phone: phone,
                      order_type: type === 'virtual' ? 1 : 0
                    };
                    if (type === 'physical') {
                      orderData.consignee_name = $('#recipient').val().trim();
                      orderData.consignee_address = $('#address').val().trim();
                    } else {
                      orderData.consignee_address = $('#account').val().trim();
                    }

                    $.ajax({
                      url: hzRequestUrl + 'goods/add_order',
                      type: 'POST',
                      data: orderData,
                      dataType: 'json',
                      headers: {
                        'boxVersion': '1.0.0',
                        'token':$.cookie('hzusertoken')
                      },
                      success: function(res) {
                        if (res && res.code === 200) {
                          layer.msg('兑换成功');
                          layer.close(dialog);
                        } else {
                          layer.msg('兑换失败：' + (res.msg || '未知错误'));
                        }
                      },
                      error: function() {
                        layer.msg('兑换失败：网络错误');
                      }
                    });
                  } else {
                    layer.msg('兑换失败：' + (res.msg || '金币不足'));
                  }
                },
                error: function() {
                  layer.msg('兑换失败：网络错误');
                }
              });
            });
          });

          // 绑定取消按钮点击事件
          $('#cancelExchange').off('click').on('click', function() {
            layer.close(dialog);
          });
        }
      });
    });
  });

// 标签页切换
$(document)
  .off('click.mallTab')
  .on('click.mallTab', '.mall-tab-btn', function() {
    // 切换激活状态
    $('.mall-tab-btn').removeClass('active').css({'background': '#fff', 'color': '#000'});
    $(this).addClass('active').css({'background': '#ff6a00', 'color': '#fff'});

    // 这里可以根据标签类型加载不同的商品列表
    var type = $(this).data('type');
    loadMallGoods(1); // 暂时统一加载所有商品
  })
  // 修改订单信息
  .off('click.editOrder')
  .on('click.editOrder', '.editOrderBtn', function() {
    var id = $(this).data('id');
    var type = $(this).data('type'); // 1: 虚拟商品，0: 实体商品
    var name = $(this).data('name');
    var phone = $(this).data('phone');
    var address = $(this).data('address');

    // 根据订单类型生成不同的弹窗内容
    var modalContent;
    if (type === 1) { // 虚拟商品
      modalContent = `
        <div style="padding: 20px; width: 400px; box-sizing: border-box;">
          <h3 style="margin-bottom: 20px;">修改订单信息</h3>
          <div style="margin-bottom: 15px;">
            <label style="display: inline-block; width: 80px;"><span style="color: #ff0000;">*</span> 电话：</label>
            <input type="text" id="editPhone" style="width: 250px; padding: 8px; border: 1px solid #ddd; border-radius: 3px;" value="${phone}">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: inline-block; width: 80px;"><span style="color: #ff0000;">*</span> 账户：</label>
            <input type="text" id="editAccount" style="width: 250px; padding: 8px; border: 1px solid #ddd; border-radius: 3px;" value="${address}">
          </div>
          <div style="text-align: center; margin-top: 30px;">
            <button id="cancelEdit" style="margin-right: 20px; padding: 8px 25px; background: #ccc; color: #333; border: 0; border-radius: 3px; cursor: pointer;">取消</button>
            <button id="confirmEdit" style="padding: 8px 25px; background: #d60000; color: #fff; border: 0; border-radius: 3px; cursor: pointer;">确认</button>
          </div>
        </div>
      `;
    } else { // 实体商品
      modalContent = `
        <div style="padding: 20px; width: 400px; box-sizing: border-box;">
          <h3 style="margin-bottom: 20px;">修改订单信息</h3>
          <div style="margin-bottom: 15px;">
            <label style="display: inline-block; width: 80px;"><span style="color: #ff0000;">*</span> 联系人：</label>
            <input type="text" id="editRecipient" style="width: 250px; padding: 8px; border: 1px solid #ddd; border-radius: 3px;" value="${name}">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: inline-block; width: 80px;"><span style="color: #ff0000;">*</span> 电话：</label>
            <input type="text" id="editPhone" style="width: 250px; padding: 8px; border: 1px solid #ddd; border-radius: 3px;" value="${phone}">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: inline-block; width: 80px; vertical-align: top;"><span style="color: #ff0000;">*</span> 收货地址：</label>
            <textarea id="editAddress" style="width: 250px; height: 80px; padding: 8px; border: 1px solid #ddd; border-radius: 3px; resize: none;">${address}</textarea>
          </div>
          <div style="text-align: center; margin-top: 30px;">
            <button id="cancelEdit" style="margin-right: 20px; padding: 8px 25px; background: #ccc; color: #333; border: 0; border-radius: 3px; cursor: pointer;">取消</button>
            <button id="confirmEdit" style="padding: 8px 25px; background: #d60000; color: #fff; border: 0; border-radius: 3px; cursor: pointer;">确认</button>
          </div>
        </div>
      `;
    }

    layui.use(['layer'], function() {
      var layer = layui.layer;
      var dialog = layer.open({
        type: 1,
        title: '修改订单信息',
        area: type === 1 ? ['450px', '280px'] : ['450px', '400px'],
        shade: 0.3,
        content: modalContent,
        success: function() {
          // 绑定确认按钮点击事件
          $('#confirmEdit').off('click').on('click', function() {
            // 表单验证
            var editPhone = $('#editPhone').val().trim();
            var editAddress;
            
            if (!editPhone) {
              layer.msg('请输入电话');
              return;
            }
            
            if (type === 1) { // 虚拟商品
              editAddress = $('#editAccount').val().trim();
              if (!editAddress) {
                layer.msg('请输入账户');
                return;
              }
            } else { // 实体商品
              var editRecipient = $('#editRecipient').val().trim();
              editAddress = $('#editAddress').val().trim();
              if (!editRecipient) {
                layer.msg('请输入联系人');
                return;
              }
              if (!editAddress) {
                layer.msg('请输入收货地址');
                return;
              }
            }
            
            // 构建请求数据
            var data = {
              id: id,
              consignee_phone: editPhone,
              consignee_address: editAddress
            };
            
            if (type !== 1) { // 实体商品添加联系人
              data.consignee_name = $('#editRecipient').val().trim();
            }
            
            // 调用 update_order 接口
            $.ajax({
              url: hzRequestUrl + 'goods/update_order',
              type: 'POST',
              headers: {
                'boxVersion': '1.0.0',
                'token':$.cookie('hzusertoken')
              },
              data: data,
              dataType: 'json',
              success: function(res) {
                if (res && res.code === 200) {
                  layer.msg('修改成功');
                  layer.close(dialog);
                  // 刷新订单列表
                  loadMallOrders(1);
                } else {
                  layer.msg('修改失败：' + (res.msg || '未知错误'));
                }
              },
              error: function() {
                layer.msg('修改失败：网络错误');
              }
            });
          });

          // 绑定取消按钮点击事件
          $('#cancelEdit').off('click').on('click', function() {
            layer.close(dialog);
          });
        }
      });
    });
  });

