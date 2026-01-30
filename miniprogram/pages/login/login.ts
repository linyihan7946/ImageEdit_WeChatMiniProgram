// login.ts
import { API_URLS } from '../../config/api';

Page({
  data: {
    loading: false,
    agreed: false
  },

  onLoad() {
    // 检查是否已登录
    this.checkLoginStatus();
  },

  // 检查登录状态
  checkLoginStatus() {
    const token = wx.getStorageSync('userToken');
    if (token) {
      // 如果有token，直接跳转到首页
      wx.redirectTo({
        url: '/pages/index/index',
        success: () => {
          console.log('已登录，自动跳转首页');
        },
        fail: (err) => {
          console.error('自动跳转失败:', err);
        }
      });
    }
  },

  // 协议同意状态变更
  onAgreementChange(e: any) {
    this.setData({
      agreed: e.detail.value.includes('agree')
    });
  },

  // 跳转到用户协议页面
  navigateToUserAgreement() {
    wx.navigateTo({
      url: '/pages/user-agreement/user-agreement'
    });
  },

  // 跳转到隐私声明页面
  navigateToPrivacyPolicy() {
    wx.navigateTo({
      url: '/pages/privacy-policy/privacy-policy'
    });
  },

  // 微信一键登录
  onWechatLogin(e: any) {
    if (!this.data.agreed) {
      // 用户未同意协议
      wx.showToast({
        title: '请先阅读并同意用户协议和隐私声明',
        icon: 'none'
      });
      return;
    }

    if (!e.detail.userInfo) {
      // 用户拒绝授权
      wx.showToast({
        title: '授权失败，请重试',
        icon: 'none'
      });
      return;
    }

    this.setData({ loading: true });

    // 获取微信用户信息
    const userInfo = e.detail.userInfo;
    console.log('获取到的用户信息:', userInfo);
    
    // 重新获取code，防止code过期或已被使用
    wx.login({
      success: (loginRes) => {
        if (loginRes.code) {
          console.log('获取新的登录code:', loginRes.code);
          // 更新全局code
          getApp().globalData.code = loginRes.code;

          // 调用后端登录接口
          wx.request({
            url: API_URLS.USER_LOGIN,
            method: 'POST',
            data: {
              code: loginRes.code,
              userInfo: userInfo
            },
            success: (res) => {
              const data: any = res.data;
              if (res.statusCode === 200 && data && data.token) {
                
                // 保存登录状态到本地存储
                wx.setStorageSync('userToken', data.token);
                wx.setStorageSync('userInfo', userInfo);
                wx.setStorageSync('username', userInfo.nickName);
                
                this.setData({ loading: false });
                
                wx.showToast({
                  title: '登录成功',
                  icon: 'success'
                });
                
                // 延迟跳转，让用户看到提示
                setTimeout(() => {
                  wx.redirectTo({
                    url: '/pages/index/index'
                  });
                }, 1500);
              } else {
                this.setData({ loading: false });
                wx.showToast({
                  title: data.message || '登录失败',
                  icon: 'none'
                });
              }
            },
            fail: (err) => {
              console.error('登录请求失败:', err);
              this.setData({ loading: false });
              wx.showToast({
                title: '网络请求失败',
                icon: 'none'
              });
            }
          });
        } else {
          console.error('获取登录code失败:', loginRes.errMsg);
          this.setData({ loading: false });
          wx.showToast({
            title: '获取登录凭证失败',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('wx.login调用失败:', err);
        this.setData({ loading: false });
        wx.showToast({
          title: '微信登录服务调用失败',
          icon: 'none'
        });
      }
    });
  }
});