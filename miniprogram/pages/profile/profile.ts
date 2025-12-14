import GLOBAL_CONFIG from "../../config/config";
import { dbUtils } from "../../utils/db-utils";

// profile.ts
Page({
  data: {
    username: '',
    userAvatar: '',
    userId: 0,
    phone: '',
    balance: '0.00',
    remainingCount: 0
  },

  onLoad() {
    this.getUserInfoAndBalance();
  },

  async getUserInfoAndBalance() {
    // 模拟获取用户信息和余额
    const userInfoResponse = await dbUtils.getUserInfo();
    if (!userInfoResponse.success) {
      return;
    }
    const balanceResponse = await dbUtils.getBalance();
    if (!balanceResponse.success) {
      return;
    }
    const userInfo = {
      userId: userInfoResponse.userInfo?.userId || 0,
      balance: balanceResponse.balance?.toString() || '0.00',
      phone: userInfoResponse.userInfo?.phone || ''
    };

    // 从本地存储获取用户信息
    this.setData({
      username: '微信用户',
      userAvatar: '/images/avatar-placeholder.svg',
      userId: userInfo.userId,
      balance: userInfo.balance,
      phone: userInfo.phone
    });

    // 计算剩余次数（模拟）
    this.updateRemainingCount();
  },

  updateRemainingCount() {
    // 模拟获取剩余次数
    const usedCount = wx.getStorageSync('usedCount') || 0;
    wx.setStorageSync('usedCount', usedCount);
    const totalCount = GLOBAL_CONFIG.freeEditCount;
    const purchasedCount = wx.getStorageSync('purchasedCount') || 0;
    const remainingCount = Math.max(0, totalCount + purchasedCount - usedCount);

    this.setData({
      remainingCount
    });
  },

  onRecharge() {
    wx.navigateTo({
      url: '/pages/recharge/recharge'
    });
  },

  onEditProfile() {
    wx.showModal({
      title: '编辑资料',
      content: '编辑资料功能开发中...',
      showCancel: false
    });
  },

  onLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          // 清除本地存储的用户信息
          wx.removeStorageSync('userInfo');
          wx.removeStorageSync('usedCount');
          
          // 跳转到登录页面
          wx.reLaunch({
            url: '/pages/login/login'
          });
        }
      }
    });
  },

  onShow() {
    // 页面显示时更新用户信息
    this.getUserInfoAndBalance();
  }
});