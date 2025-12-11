// profile.ts
Page({
  data: {
    username: '',
    userAvatar: '',
    userId: '',
    phone: '',
    balance: 0.00,
    remainingCount: 0
  },

  onLoad() {
    this.getUserInfoAndBalance();
  },

  getUserInfoAndBalance() {
    // 模拟获取用户信息和余额
    const mockUserInfo = {
      userId: `USER${Math.floor(Math.random() * 10000).toString().padStart(5, '0')}`,
      balance: Math.random() * 1000 + 100,
      phone: `138${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`
    };

    // 从本地存储获取用户信息
    const storedUserInfo = wx.getStorageSync('userInfo');
    if (storedUserInfo) {
      this.setData({
        username: storedUserInfo.username || '微信用户',
        userAvatar: storedUserInfo.userAvatar || '/images/avatar-placeholder.svg',
        userId: mockUserInfo.userId,
        balance: mockUserInfo.balance,
        phone: mockUserInfo.phone
      });
    } else {
      this.setData({
        username: '微信用户',
        userAvatar: '/images/avatar-placeholder.svg',
        userId: mockUserInfo.userId,
        balance: mockUserInfo.balance,
        phone: mockUserInfo.phone
      });
    }

    // 计算剩余次数（模拟）
    this.updateRemainingCount();
  },

  updateRemainingCount() {
    // 模拟获取剩余次数
    const usedCount = wx.getStorageSync('usedCount') || 0;
    const totalCount = 5;
    const remainingCount = Math.max(0, totalCount - usedCount);

    this.setData({
      remainingCount
    });
  },

  onRecharge() {
    wx.showModal({
      title: '充值',
      content: '充值功能开发中...',
      showCancel: false
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