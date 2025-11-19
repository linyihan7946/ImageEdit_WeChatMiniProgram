// index.ts
import { getTempKeys } from '../../utils/cos-upload';
import { uploadImageToBackend } from '../../utils/base64-upload';
import { processAndShowEditResult } from '../../utils/image-edit';
import { API_URLS } from '../../config/api';

Component({
  data: {
    username: '',
    userAvatar: '',
    filePath: ''
  },
  
  lifetimes: {
    attached() {
      // 组件挂载时检查登录状态并获取用户信息
      this.checkLoginStatus();
    }
  },
  
  methods: {
    // 获取用户当天去水印使用次数
    async getUserDailyUsage(): Promise<number> {
      try {
        const token = wx.getStorageSync('userToken');
        const response = await new Promise<any>((resolve, reject) => {
          wx.request({
            url: API_URLS.USER_DAILY_USAGE,
            method: 'GET',
            header: {
              'Authorization': `Bearer ${token}`,
              'content-type': 'application/json'
            },
            success: resolve,
            fail: reject
          });
        });
        
        if (response.statusCode === 200 && response.data && response.data.success) {
          return response.data.data.todayUsage || 0;
        }
        return 0;
      } catch (error) {
        console.error('获取用户当天使用次数失败:', error);
        return 0;
      }
    },

    // 豆包出图去水印按钮点击事件
    async onDoubaoRemoveWatermark() {
      console.log('开始点豆包图片出水印流程');

      // 检查登录状态
      const isLoggedIn = await this.checkLoginStatus();
      if (!isLoggedIn) {
        return;
      }

      // 检查今日使用次数
      const todayUsage = await this.getUserDailyUsage();
      console.log('用户当天使用次数:', todayUsage);
      if (todayUsage >= 3) {
        wx.showToast({
          title: '当天免费次数已用完，如需继续使用请充值！',
          icon: 'none',
          duration: 3000
        });
        return;
      }

      wx.showLoading({
        title: '准备中...',
        mask: true
      });
      
      // 选择图片
      wx.chooseImage({
        count: 1,
        sizeType: ['original', 'compressed'],
        sourceType: ['album', 'camera'],
        success: async (res) => {
          wx.hideLoading();
          const imagePath = res.tempFilePaths[0];
          console.log('选择的图片路径:', imagePath);
          
          try {
            wx.showLoading({
              title: '正在处理...',
              mask: true
            });
            
            // 上传图片到后端
            const uploadResult = await uploadImageToBackend(imagePath);
            const imageUrl = uploadResult.data.fileUrl;
            
            // 这里可以调用专门的去水印API或使用现有接口处理
            const editResult = await processAndShowEditResult(
              imageUrl, 
              '移除图片上的水印，保持原图内容不变'
            );
            
            if (editResult) {
              console.log('去水印后的图片URL:', editResult);
              // 可以添加显示或保存处理后图片的逻辑
            }
          } catch (error) {
            wx.hideLoading();
            console.error('去水印处理失败:', error);
            wx.showToast({
              title: '处理失败，请重试',
              icon: 'none'
            });
          }
        },
        fail: (error) => {
          wx.hideLoading();
          console.error('选择图片失败:', error);
        }
      });
    },
    
    // 检查登录状态并获取用户信息
    checkLoginStatus(): boolean {
      const token = wx.getStorageSync('userToken');
      const userInfo = wx.getStorageSync('userInfo');
      
      if (!token) {
        // 如果没有登录，跳转到登录页面
        wx.redirectTo({
          url: '/pages/login/login'
        });
        return false;
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
      
      return true;
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
    
    // 获取cos的授权按钮点击事件
    onTest() {
      wx.showLoading({ title: '正在获取授权...' });
      // directUploadFileToCos({
      //   filePath: res.tempFiles[0].tempFilePath,
      //   fileName: 'test.jpg',
      //   fileType: 'image/jpeg',
      // }).then((url) => {
      //   console.log('上传到COS成功，URL:', url);
      // })
      getTempKeys()
        .then((keys) => {
          wx.hideLoading();
          console.log('成功获取COS临时密钥:', keys);
          wx.showToast({
            title: '获取授权成功',
            icon: 'success'
          });
        })
        .catch((error) => {
          wx.hideLoading();
          console.error('获取COS授权失败:', error);
          wx.showToast({
            title: '获取授权失败',
            icon: 'error'
          });
        });
    },

    // 手绘变彩图
    async onColorizePress() {
      // 检查登录状态
      const isLoggedIn = await this.checkLoginStatus();
      if (!isLoggedIn) {
        return;
      }

      // 检查今日使用次数
      const todayUsage = await this.getUserDailyUsage();
      console.log('用户当天使用次数:', todayUsage);
      if (todayUsage >= 3) {
        wx.showToast({
          title: '当天免费次数已用完，如需继续使用请充值！',
          icon: 'none',
          duration: 3000
        });
        return;
      }

      console.log('手绘变彩图按钮被点击')
      // 示例：可以跳转到图片选择页面或者直接调起图片选择器
      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        success: async (res) => {
          

          // 这里可以处理选择的图片，比如上传到服务器进行彩绘处理
          const userInfo = getApp().globalData.userInfo;
          const imagePath = res.tempFiles[0].tempFilePath;
          console.log('选择的图片:', imagePath)
          
          // 调用工具类中的方法上传图片
          const result = await uploadImageToBackend(imagePath);
          const imageUrl = result.data.fileUrl;
          
          // 调用图片编辑工具类处理图片
          const editedImageUrl = await processAndShowEditResult(imageUrl, '将下面的手绘图变成漂亮的水彩画图');
          if (editedImageUrl) {
            console.log('编辑后的图片URL:', editedImageUrl);
            // 这里可以添加处理编辑后图片的逻辑
          }

          // directUploadFileToCos({
          //   filePath: res.tempFiles[0].tempFilePath,
          //   folder: 'uploads'
          // }).then((url) => {
          //   console.log('上传到COS成功，URL:', url);
          // })

          // // 方法2：
          // wx.request({
          //   url: API_URLS.IMAGE_EDIT_NEW,
          //   method: 'POST',
          //   data: {
          //     code: getApp().globalData.code,
          //     userInfo: userInfo,
          //     instruction: '将下面的手绘图变成漂亮的水彩画图', 
          //     imageUrl: res.tempFiles[0].tempFilePath,
          //     aspectRatio: "9:16",
          //     mime_type:  "image/jpeg"
          //   },
          //   success: (res) => {
          //     const data: any = res.data;
          //     console.log('图片编辑新接口返回数据:', data);
          //     if (res.statusCode === 200 && data && data.success) {
          //         const images = data.data.images;
          //         if (images.length > 0) {
          //           // 假设服务器返回的是第一个编辑后的图片URL
          //           const editedImageUrl = images[0];
          //           console.log('编辑后的图片URL:', editedImageUrl);
          //         }
          //         wx.showToast({
          //           title: '图片编辑成功',
          //           icon: 'success'
          //         });
          //     } else {
          //       wx.showToast({
          //         title: '图片编辑失败，请重试',
          //         icon: 'none'
          //       });
          //     }
          //   },
          //   fail: (err) => {
          //     const tip = '图片编辑请求失败:';
          //     console.error(tip, err);
          //     wx.showToast({
          //       title: tip + err.errMsg,
          //       icon: 'none'
          //     });
          //   }
          // });
        },
        fail: (err) => {
          console.error('选择图片失败:', err)
        }
      })
    }
  }
})
