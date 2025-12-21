// photo-restoration.ts
import { uploadImageToBackend } from '../../utils/base64-upload';
import { API_URLS } from '../../config/api';
import { dbUtils } from '../../utils/db-utils';
import GLOBAL_CONFIG from '../../config/config';
import { getClosestImageAspectRatio } from '../../utils/image-util';
import ImageEditUtil from '../../utils/image-edit';

Component({
  data: {
    selectedImageUrl: '', // 选择的图片路径
    restoredImageUrl: '', // 翻新后的图片URL
    isProcessing: false, // 是否正在处理
  },
  
  lifetimes: {
    attached() {
      // 页面加载时的初始化逻辑
    }
  },
  
  methods: {
    // 选择图片
    onSelectImage() {
      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const imagePath = res.tempFiles[0].tempFilePath;
          this.setData({
            selectedImageUrl: imagePath,
            restoredImageUrl: '' // 清空之前的结果
          });
        },
        fail: (err) => {
          console.error('选择图片失败:', err);
          wx.showToast({
            title: '选择图片失败',
            icon: 'none'
          });
        }
      });
    },
    
    // 重新选择图片
    onSelectNewImage() {
      this.setData({
        selectedImageUrl: '',
        restoredImageUrl: ''
      });
    },
    
    // 老照片翻新
    async onRestorePhoto() {
      if (!this.data.selectedImageUrl) {
        wx.showToast({
          title: '请先选择图片',
          icon: 'none'
        });
        return;
      }
      
      // 检查剩余编辑次数
      const hasRemainingCount = await this.checkRemainingEditCount();
      if (!hasRemainingCount) {
        return;
      }
      
      this.setData({ isProcessing: true });
      wx.showLoading({ title: '正在翻新图片...' });
      
      try {
        // 上传图片到服务器
        const uploadResult = await uploadImageToBackend(this.data.selectedImageUrl);
        const imageUrl = uploadResult.data.fileUrl;
        
        // 调用Gemini图片生成接口进行老照片翻新
        const ratio = await getClosestImageAspectRatio(imageUrl);
        const prompt = '将这张老照片进行翻新处理，修复损坏部分，增强清晰度和色彩，使其看起来更清晰、鲜艳。';
        const restoredImageUrl = await ImageEditUtil.callGeminiImageGenerate(imageUrl, prompt, ratio);
        
        this.setData({
          restoredImageUrl: restoredImageUrl,
          isProcessing: false
        });
        
      } catch (error) {
        console.error('图片翻新失败:', error);
        wx.showToast({
          title: '图片翻新失败，请重试',
          icon: 'none'
        });
      } finally {
        wx.hideLoading();
        this.setData({ isProcessing: false });
      }
    },
    
    // 保存图片到相册
    onSaveImage() {
      if (!this.data.restoredImageUrl) {
        wx.showToast({
          title: '没有可保存的图片',
          icon: 'none'
        });
        return;
      }
      
      wx.saveImageToPhotosAlbum({
        filePath: this.data.restoredImageUrl,
        success: () => {
          wx.showToast({
            title: '图片已保存到相册',
            icon: 'success'
          });
        },
        fail: (err) => {
          console.error('保存图片失败:', err);
          wx.showToast({
            title: '保存图片失败，请重试',
            icon: 'none'
          });
        }
      });
    },
    
    // 检查当天剩余图片编辑次数
    async checkRemainingEditCount(): Promise<boolean> {
      try {
        const todayUsage = await dbUtils.getUserDailyUsage();
        const remainingCount = GLOBAL_CONFIG.freeEditCount - todayUsage;
        
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
    }
  }
});