// register.ts

Page({
  data: {
    username: '',
    password: '',
    confirmPassword: '',
    loading: false
  },

  // 用户名输入
  onUsernameInput(e: any) {
    this.setData({
      username: e.detail.value
    });
  },

  // 密码输入
  onPasswordInput(e: any) {
    this.setData({
      password: e.detail.value
    });
  },

  // 确认密码输入
  onConfirmPasswordInput(e: any) {
    this.setData({
      confirmPassword: e.detail.value
    });
  },

  // 注册按钮点击
  onRegister() {
    const { username, password, confirmPassword } = this.data;

    // 表单验证
    if (!username) {
      wx.showToast({
        title: '请输入用户名',
        icon: 'none'
      });
      return;
    }

    if (!password) {
      wx.showToast({
        title: '请输入密码',
        icon: 'none'
      });
      return;
    }

    if (password !== confirmPassword) {
      wx.showToast({
        title: '两次输入的密码不一致',
        icon: 'none'
      });
      return;
    }

    if (password.length < 6) {
      wx.showToast({
        title: '密码长度不能少于6位',
        icon: 'none'
      });
      return;
    }

    this.setData({ loading: true });

    // 模拟注册请求
    setTimeout(() => {
      // 在实际应用中，这里应该调用真实的注册API
      // 模拟注册成功，生成token
      const mockToken = 'mock_token_' + Date.now();
      
      // 保存登录状态到本地存储
      wx.setStorageSync('userToken', mockToken);
      wx.setStorageSync('username', username);
      
      this.setData({ loading: false });
      
      wx.showToast({
        title: '注册成功',
        icon: 'success'
      });

      // 注册成功后跳转到首页
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/index/index'
        });
      }, 1500);
    }, 1500);
  },

  // 返回登录页面
  goToLogin() {
    wx.navigateBack();
  }
});