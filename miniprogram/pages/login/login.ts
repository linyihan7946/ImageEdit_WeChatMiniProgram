// login.ts
import { API_URLS } from '../../config/api';

Page({
  data: {
    loading: false
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

  // 微信一键登录
  onWechatLogin(e: any) {
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
    
    // 调用后端登录接口
    wx.request({
      url: API_URLS.USER_LOGIN,
      method: 'POST',
      data: {
        code: getApp().globalData.code,
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

          // 登录成功后跳转到首页
          setTimeout(() => {
            wx.redirectTo({
              url: '/pages/index/index',
              success: () => {
                console.log('登录成功，跳转首页');
              },
              fail: (err) => {
                console.error('跳转失败:', err);
                wx.showToast({
                  title: '跳转失败，请重试',
                  icon: 'none'
                });
              }
            });
          }, 1500);
        } else {
          this.setData({ loading: false });
          wx.showToast({
            title: '登录失败，请重试',
            icon: 'none'
          });
        }
      },
      fail: (err) => {
        console.error('登录请求失败:', err);
        this.setData({ loading: false });
        wx.showToast({
          title: '网络错误，请重试',
          icon: 'none'
        });
      }
    });
  }
});