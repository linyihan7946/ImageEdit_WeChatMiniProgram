// index.ts
import { API_URLS } from '../../config/api';

Component({
  data: {
    username: '',
    userAvatar: ''
  },
  
  lifetimes: {
    attached() {
      // 组件挂载时检查登录状态并获取用户信息
      this.checkLoginStatus();
    }
  },
  
  methods: {
    // 检查登录状态并获取用户信息
    checkLoginStatus() {
      const token = wx.getStorageSync('userToken');
      const userInfo = wx.getStorageSync('userInfo');
      
      if (!token) {
        // 如果没有登录，跳转到登录页面
        wx.redirectTo({
          url: '/pages/login/login'
        });
        return;
      }
      
      // 更新用户信息
      if (userInfo && userInfo.nickName) {
        this.setData({
          username: userInfo.nickName,
          userAvatar: userInfo.avatarUrl || ''
        });
        console.log('从userInfo设置微信昵称:', userInfo.nickName);
      } else {
        // 如果没有完整的用户信息，尝试从单独存储的username获取
        const username = wx.getStorageSync('username');
        if (username) {
          this.setData({
            username: username
          });
          console.log('从单独存储获取微信昵称:', username);
        } else {
          console.log('未获取到微信昵称');
        }
      }
    },
    
    // 退出登录
    onLogout() {
      wx.showModal({
        title: '确认退出',
        content: '确定要退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            // 清除本地存储的登录状态和用户信息
            wx.removeStorageSync('userToken');
            wx.removeStorageSync('userInfo');
            wx.removeStorageSync('username');
            
            // 跳转到登录页面
            wx.redirectTo({
              url: '/pages/login/login'
            });
          }
        }
      });
    },
    
    // 手绘变彩图按钮点击事件
    onColorizePress() {
      // 这里可以添加手绘变彩图的逻辑
      console.log('手绘变彩图按钮被点击')
      // 示例：可以跳转到图片选择页面或者直接调起图片选择器
      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          console.log('选择的图片:', res.tempFiles[0])
          // 这里可以处理选择的图片，比如上传到服务器进行彩绘处理
          const userInfo = getApp().globalData.userInfo;
          wx.request({
            url: API_URLS.IMAGE_EDIT,
            method: 'POST',
            data: {
              code: getApp().globalData.code,
              userInfo: userInfo,
              instruction: '将手绘图变成彩图', 
              imageUrls: [res.tempFiles[0].tempFilePath]
            },
            success: (res) => {
              const data: any = res.data;
              if (res.statusCode === 200 && data && data.success) {
                  const images = data.data.images;
                  if (images.length > 0) {
                    // 假设服务器返回的是第一个编辑后的图片URL
                    const editedImageUrl = images[0];
                    console.log('编辑后的图片URL:', editedImageUrl);
                  }
                  wx.showToast({
                    title: '图片编辑成功',
                    icon: 'success'
                  });
              } else {
                wx.showToast({
                  title: '图片编辑失败，请重试',
                  icon: 'none'
                });
              }
            },
            fail: (err) => {
              const tip = '图片编辑请求失败:';
              console.error(tip, err);
              wx.showToast({
                title: tip + err.errMsg,
                icon: 'none'
              });
            }
          });
        },
        fail: (err) => {
          console.error('选择图片失败:', err)
        }
      })
    }
  }
})
