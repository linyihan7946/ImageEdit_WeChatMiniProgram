import GLOBAL_CONFIG from "../../config/config";
import { dbUtils } from "../../utils/db-utils";

// profile.ts
Page({
  data: {
    username: '',
    userAvatar: '',
    userId: 0,
    phone: '',
    remainingCount: 0
  },

  onLoad() {
    this.getUserInfoAndBalance();
  },

  async getUserInfoAndBalance() {
    // 模拟获取用户信息
    const userInfoResponse = await dbUtils.getUserInfo();
    if (!userInfoResponse.success) {
      return;
    }
    const userInfo = {
      userId: userInfoResponse.userInfo?.userId || 0,
      phone: userInfoResponse.userInfo?.phone || ''
    };

    // 从本地存储获取用户信息
    this.setData({
      username: '微信用户',
      userAvatar: '/images/avatar-placeholder.svg',
      userId: userInfo.userId,
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

  onEditProfile() {
    wx.showModal({
      title: '编辑资料',
      content: '编辑资料功能开发中...',
      showCancel: false
    });
  },


  onShow() {
    // 页面显示时更新用户信息
    this.getUserInfoAndBalance();
  }
});