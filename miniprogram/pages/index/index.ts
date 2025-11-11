// index.ts
import { API_URLS } from '../../config/api';
import { directUploadFileToCos, getTempKeys } from '../../utils/cos-upload';
import { imageToFullBase64 } from '../../utils/image-util';
import { uploadImageToBackend } from '../../utils/base64-upload';

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
    
    // 测试图片转Base64按钮点击事件
    onTestImageToBase64() {
      wx.showLoading({ title: '准备中...' });
      
      // 选择图片
      wx.chooseImage({
        count: 1,
        sizeType: ['original', 'compressed'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          wx.hideLoading();
          const imagePath = res.tempFilePaths[0];
          console.log('选择的图片路径:', imagePath);
          
          wx.showLoading({ title: '转换中...' });
          
          // 调用图片转Base64函数
          imageToFullBase64(imagePath)
            .then((base64) => {
              wx.hideLoading();
              console.log('图片转换为Base64成功:', base64);
              
              // 显示转换结果
              wx.showModal({
                title: '转换成功',
                content: `Base64字符串长度: ${base64.length}\n首100字符: ${base64.substring(0, 100)}...`,
                showCancel: true,
                confirmText: '复制部分内容',
                success: (res) => {
                  if (res.confirm) {
                    // 复制部分Base64内容到剪贴板
                    wx.setClipboardData({
                      data: base64.substring(0, 200),
                      success: () => {
                        wx.showToast({
                          title: '已复制部分内容',
                          icon: 'success'
                        });
                      }
                    });
                  }
                }
              });
            })
            .catch((error) => {
              wx.hideLoading();
              console.error('图片转换为Base64失败:', error);
              wx.showToast({
                title: '转换失败',
                icon: 'error'
              });
            });
        },
        fail: (error) => {
          wx.hideLoading();
          console.error('选择图片失败:', error);
        }
      });
    },
    
    // 发送Base64到后端按钮点击事件
    async onUploadBase64ToBackend() {
      try {
        // 选择图片
        const chooseResult = await new Promise<any>((resolve, reject) => {
          wx.chooseImage({
            count: 1,
            sizeType: ['compressed'], // 使用压缩图片以减小Base64大小
            sourceType: ['album', 'camera'],
            success: resolve,
            fail: reject
          });
        });

        const imagePath = chooseResult.tempFilePaths[0];
        console.log('选择的图片路径:', imagePath);
        
        // 调用工具类中的方法上传图片
        const result = await uploadImageToBackend(imagePath);
        
        // 显示成功提示
        wx.showModal({
          title: '上传成功',
          content: `后端返回成功！\n文件URL: ${result.data.fileUrl}`,
          showCancel: false
        });
      } catch (error) {
        console.error('上传Base64到后端失败:', error);
        wx.showModal({
          title: '上传失败',
          content: (error as any).message || '请稍后重试',
          showCancel: false
        });
        
        // 针对不同错误类型给出提示
        if ((error as any).message && (error as any).message.includes('413')) {
          wx.showToast({
            title: '文件过大，已启用分块上传',
            icon: 'none'
          });
        }
      }
    },
    
    // 获取cos的授权按钮点击事件
    onGetCosAuth() {
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
    onColorizePress() {
      // 这里可以添加手绘变彩图的逻辑
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
          // 方法1：
          wx.request({
            url: API_URLS.IMAGE_EDIT,
            method: 'POST',
            data: {
              code: getApp().globalData.code,
              userInfo: userInfo,
              instruction: '将下面的手绘图变成漂亮的水彩画图', 
              imageUrls: [imageUrl]
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
