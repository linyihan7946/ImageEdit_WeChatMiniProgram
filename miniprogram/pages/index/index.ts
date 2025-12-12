// index.ts
import { getTempKeys } from '../../utils/cos-upload';
import { uploadImageToBackend } from '../../utils/base64-upload';
import { processAndShowEditResult } from '../../utils/image-edit';
import { API_URLS } from '../../config/api';
import GLOBAL_CONFIG from '../../config/config';

Component({
  data: {
    username: '',
    userAvatar: '',
    filePath: '',
    originalImagePath: '', // 原始图片路径
    processedImageUrl: '', // 处理后的图片URL
    isShowingOriginal: false, // 当前是否显示原始图片
    remainingCount: 0 // 剩余图片编辑次数
  },
  
  lifetimes: {
    attached() {
      // 组件挂载时检查登录状态并获取用户信息
      this.checkLoginStatus();
      // 获取并显示剩余编辑次数
      this.updateRemainingCount();
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
    
    // 检查当天剩余图片编辑次数
    async checkRemainingEditCount(): Promise<boolean> {
      try {
        const todayUsage = await this.getUserDailyUsage();
        const remainingCount = GLOBAL_CONFIG.freeEditCount - todayUsage;
        console.log('当天已使用次数:', todayUsage, '剩余次数:', remainingCount);
        
        // 更新显示的剩余次数
        this.setData({
          remainingCount: remainingCount
        });
        
        if (remainingCount <= 0) {
          wx.showToast({
            title: GLOBAL_CONFIG.MESSAGES.USAGE_LIMIT_EXCEEDED,
            icon: 'none',
            duration: 3000
          });
          return false;
        }
        return true;
      } catch (error) {
        console.error('检查剩余编辑次数失败:', error);
        // 发生错误时默认允许跳转，避免影响用户体验
        return true;
      }
    },
    
    // 更新剩余编辑次数并显示
    async updateRemainingCount() {
      try {
        const todayUsage = await this.getUserDailyUsage();
        const purchasedCount = wx.getStorageSync('purchasedCount') || 0;
        const remainingCount = GLOBAL_CONFIG.freeEditCount + purchasedCount - todayUsage;
        console.log('更新剩余次数显示:', remainingCount);
        this.setData({
          remainingCount: Math.max(0, remainingCount)
        });
      } catch (error) {
        console.error('更新剩余次数失败:', error);
        // 发生错误时默认显示最大值
        const purchasedCount = wx.getStorageSync('purchasedCount') || 0;
        this.setData({
          remainingCount: GLOBAL_CONFIG.freeEditCount + purchasedCount
        });
      }
    },

    // 切换图片显示（长按事件）
    onToggleImage() {
      this.setData({
        isShowingOriginal: !this.data.isShowingOriginal
      });
      wx.showToast({
        title: this.data.isShowingOriginal ? '显示原图' : '显示处理后的图片',
        icon: 'none',
        duration: 1500
      });
    },

    // 豆包出图去水印按钮点击事件
    async onDoubaoRemoveWatermark() {
      console.log('开始点豆包图片出水印流程');

      // 检查登录状态
      const isLoggedIn = await this.checkLoginStatus();
      if (!isLoggedIn) {
        return;
      }
      
      // 检查剩余编辑次数
      const hasRemainingCount = await this.checkRemainingEditCount();
      if (!hasRemainingCount) {
        return;
      }

      // 跳转到专门的去水印页面
      wx.navigateTo({
        url: '/pages/watermark-remove/watermark-remove',
        success: () => {
          console.log('成功跳转到去水印页面');
        },
        fail: (error) => {
          console.error('跳转到去水印页面失败:', error);
          wx.showToast({
            title: '页面跳转失败，请重试',
            icon: 'none'
          });
        }
      });
    },
    
    // 创意图片编辑按钮点击事件
    async onCreativeImageEdit() {
      console.log('创意图片编辑按钮被点击');
      
      // 检查登录状态
      const isLoggedIn = await this.checkLoginStatus();
      if (!isLoggedIn) {
        return;
      }
      
      // 检查剩余编辑次数
      const hasRemainingCount = await this.checkRemainingEditCount();
      if (!hasRemainingCount) {
        return;
      }
      
      // 跳转到创意图片编辑页面
      wx.navigateTo({
        url: '/pages/creative-image-edit/creative-image-edit',
        success: () => {
          console.log('成功跳转到创意图片编辑页面');
        },
        fail: (error) => {
          console.error('跳转到创意图片编辑页面失败:', error);
          wx.showToast({
            title: '页面跳转失败，请重试',
            icon: 'none'
          });
        }
      });
    },
    
    // 菜品食材用料图按钮点击事件
    async onDishIngredientEdit() {
      console.log('菜品食材用料图按钮被点击');
      
      // 检查登录状态
      const isLoggedIn = await this.checkLoginStatus();
      if (!isLoggedIn) {
        return;
      }
      
      // 检查剩余编辑次数
      const hasRemainingCount = await this.checkRemainingEditCount();
      if (!hasRemainingCount) {
        return;
      }
      
      // 跳转到菜品食材用料图页面
      wx.navigateTo({
        url: '/pages/dish-ingredient-edit/dish-ingredient-edit',
        success: () => {
          console.log('成功跳转到菜品食材用料图页面');
        },
        fail: (error) => {
          console.error('跳转到菜品食材用料图页面失败:', error);
          wx.showToast({
            title: '页面跳转失败，请重试',
            icon: 'none'
          });
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

      // 检查剩余编辑次数
      const hasRemainingCount = await this.checkRemainingEditCount();
      if (!hasRemainingCount) {
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
