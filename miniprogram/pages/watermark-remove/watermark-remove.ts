// watermark-remove.ts
import { uploadImageToBackend } from '../../utils/base64-upload';
import { processAndShowEditResult } from '../../utils/image-edit';
import { API_URLS } from '../../config/api';
import { GLOBAL_CONFIG } from '../../config/config';


Page({
  data: {
    originalImagePath: '', // 原始图片路径
    processedImageUrl: '', // 处理后的图片URL
    isShowingOriginal: false, // 当前是否显示原始图片
    isProcessing: false, // 是否正在处理
    todayUsage: 0, // 今日使用次数
    GLOBAL_CONFIG // 全局配置，供wxml使用
  },

  onLoad() {
    // 页面加载时检查登录状态和今日使用次数
    this.checkLoginStatus();
    this.getUserDailyUsage();
  },

  // 检查登录状态
  async checkLoginStatus(): Promise<boolean> {
    const token = wx.getStorageSync('userToken');
    if (!token) {
      wx.redirectTo({
        url: '/pages/login/login'
      });
      return false;
    }
    return true;
  },

  // 获取用户当天使用次数
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
      
      let todayUsage = 0;
      if (response.statusCode === 200 && response.data && response.data.success) {
        todayUsage = response.data.data.todayUsage || 0;
      }
      
      this.setData({ todayUsage });
      return todayUsage;
    } catch (error) {
      console.error('获取用户当天使用次数失败:', error);
      return 0;
    }
  },

  // 选择图片
  chooseImage() {
    if (this.data.todayUsage >= GLOBAL_CONFIG.freeEditCount) {
      wx.showToast({
        title: GLOBAL_CONFIG.MESSAGES.USAGE_LIMIT_EXCEEDED,
        icon: 'none',
        duration: 3000
      });
      return;
    }

    wx.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const imagePath = res.tempFilePaths[0];
        console.log('选择的图片路径:', imagePath);
        this.processImage(imagePath);
      },
      fail: (error) => {
        console.error('选择图片失败:', error);
      }
    });
  },

  // 处理图片
  async processImage(imagePath: string) {
    this.setData({ isProcessing: true });
    
    wx.showLoading({
      title: GLOBAL_CONFIG.MESSAGES.PROCESSING,
      mask: true
    });
    
    try {
      // 获取图片信息以计算长宽比
      const imageInfo: {width: number, height: number} = await new Promise<any>((resolve, reject) => {
        wx.getImageInfo({
          src: imagePath,
          success: resolve,
          fail: reject
        });
      });
      console.log("图片信息:", imageInfo);
      
      // 定义可选的长宽比列表
      const aspectRatios = [
        { ratio: '21:9', value: 21/9 },
        { ratio: '16:9', value: 16/9 },
        { ratio: '4:3', value: 4/3 },
        { ratio: '3:2', value: 3/2 },
        { ratio: '1:1', value: 1 },
        { ratio: '4:5', value: 4/5 },
        { ratio: '3:4', value: 3/4 },
        { ratio: '2:3', value: 2/3 },
        { ratio: '9:16', value: 9/16 },
        { ratio: '5:4', value: 5/4 }
      ];
      
      // 计算图片的实际长宽比
      const actualRatio = imageInfo.width / imageInfo.height;
      
      // 找到最接近的长宽比
      let closestRatio = aspectRatios[0];
      let minDiff = Math.abs(actualRatio - closestRatio.value);
      
      for (const item of aspectRatios) {
        const diff = Math.abs(actualRatio - item.value);
        if (diff < minDiff) {
          minDiff = diff;
          closestRatio = item;
        }
      }
      
      console.log(`图片实际长宽比: ${actualRatio.toFixed(4)}, 最接近的预设比例: ${closestRatio.ratio}`);
      
      // 上传图片到后端
      const uploadResult = await uploadImageToBackend(imagePath);
      const imageUrl = uploadResult.data.fileUrl;
      
      // 调用去水印API，传入最接近的长宽比
      const editResult = await processAndShowEditResult(
        imageUrl, 
        '移除图片上的水印，保持原图内容不变',
        closestRatio.ratio
      );
      
      if (editResult) {
        console.log('去水印后的图片URL:', editResult);
        // 保存图片结果
        this.setData({
          originalImagePath: imagePath,
          processedImageUrl: editResult,
          isShowingOriginal: false
        });
        
        // 更新使用次数
        this.setData({
          todayUsage: this.data.todayUsage + 1
        });
      }
    } catch (error) {
      console.error('图片处理失败:', error);
      wx.showToast({
        title: GLOBAL_CONFIG.MESSAGES.PROCESS_FAILURE,
        icon: 'none'
      });
    } finally {
      this.setData({ isProcessing: false });
      wx.hideLoading();
    }
  },

  // 长按显示原图
  onShowOriginal() {
    this.setData({
      isShowingOriginal: true
    });
    wx.showToast({
      title: '显示原图',
      icon: 'none',
      duration: 1000
    });
  },

  // 松开按钮显示处理后的图片
  onShowProcessed() {
    this.setData({
      isShowingOriginal: false
    });
    wx.showToast({
      title: '显示处理后的图片',
      icon: 'none',
      duration: 1000
    });
  },

  // 切换图片显示（兼容旧的长按事件）
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

  // 保存处理后的图片
  saveImage() {
    const imageUrl = this.data.isShowingOriginal ? this.data.originalImagePath : this.data.processedImageUrl;

    wx.downloadFile({
      url: imageUrl,
      success: (res) => {
        const tempFilePath = res.tempFilePath;
        // 先检查用户是否授权保存图片到相册
        wx.getSetting({
          success: (res) => {
            // 如果没有授权，则请求授权
            if (!res.authSetting['scope.writePhotosAlbum']) {
              wx.authorize({
                scope: 'scope.writePhotosAlbum',
                success: () => {
                  // 授权成功后保存图片
                  this.saveImageToAlbum(tempFilePath);
                },
                fail: (authError) => {
                  console.error('授权失败:', authError);
                  // 如果用户拒绝授权，提示用户手动开启
                  wx.showModal({
                    title: '保存失败',
                    content: '需要您授权保存图片到相册，请在设置中开启权限',
                    confirmText: '去设置',
                    success: (modalRes) => {
                      if (modalRes.confirm) {
                        // 打开设置页面让用户手动授权
                        wx.openSetting();
                      }
                    }
                  });
                }
              });
            } else {
              // 已经授权，直接保存图片
              this.saveImageToAlbum(tempFilePath);
            }
          },
          fail: (error) => {
            console.error('获取设置失败:', error);
            wx.showToast({
              title: '保存失败',
              icon: 'none'
            });
          }
        });
      }
    })
  },
  
  // 保存图片到相册的具体实现
  saveImageToAlbum(filePath: string) {
    wx.saveImageToPhotosAlbum({
      filePath: filePath,
      success: () => {
        wx.showToast({
          title: GLOBAL_CONFIG.MESSAGES.SAVE_SUCCESS,
          icon: 'success'
        });
      },
      fail: (error) => {
        console.error('保存图片到相册失败:', error);
        wx.showToast({
          title: GLOBAL_CONFIG.MESSAGES.SAVE_FAILURE,
          icon: 'none'
        });
      }
    });
  }
});
