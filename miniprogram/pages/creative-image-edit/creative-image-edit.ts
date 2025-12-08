// creative-image-edit.ts
import { uploadImageToBackend } from '../../utils/base64-upload';
import { API_URLS } from '../../config/api';

Page({
  data: {
    prompt: '', // 提示词
    imageUrls: [] as string[], // 已添加的图片URL数组
    isGenerating: false, // 是否正在生成图片
    generatedImageUrl: '', // 生成的图片URL
  },

  // 页面加载时
  onLoad() {
    // 检查登录状态
    const token = wx.getStorageSync('userToken');
    if (!token) {
      wx.redirectTo({
        url: '/pages/login/login'
      });
    }
  },

  // 提示词输入事件
  onPromptInput(e: any) {
    this.setData({
      prompt: e.detail.value
    });
  },

  // 选择图片
  onChooseImage() {
    const remainingCount = 10 - this.data.imageUrls.length;
    
    wx.chooseMedia({
      count: remainingCount,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        wx.showLoading({
          title: '上传图片中...',
        });

        try {
          // 上传所有选择的图片
          const uploadPromises = res.tempFiles.map(async (file) => {
            const result = await uploadImageToBackend(file.tempFilePath);
            return result.data.fileUrl;
          });

          const newImageUrls = await Promise.all(uploadPromises);
          
          // 更新图片URL数组
          this.setData({
            imageUrls: [...this.data.imageUrls, ...newImageUrls]
          });

          wx.hideLoading();
          wx.showToast({
            title: '图片上传成功',
            icon: 'success'
          });
        } catch (error) {
          wx.hideLoading();
          console.error('图片上传失败:', error);
          wx.showToast({
            title: '图片上传失败',
            icon: 'none'
          });
        }
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

  // 移除图片
  onRemoveImage(e: any) {
    const index = e.currentTarget.dataset.index;
    const newImageUrls = [...this.data.imageUrls];
    newImageUrls.splice(index, 1);
    
    this.setData({
      imageUrls: newImageUrls
    });
  },

  // 生成图片
  async onGenerateImage() {
    if (!this.data.prompt.trim()) {
      wx.showToast({
        title: '请输入提示词',
        icon: 'none'
      });
      return;
    }

    if (this.data.imageUrls.length === 0) {
      wx.showToast({
        title: '请至少添加一张图片',
        icon: 'none'
      });
      return;
    }

    this.setData({
      isGenerating: true
    });

    wx.showLoading({
      title: '生成图片中...',
    });

    try {
      const token = wx.getStorageSync('userToken');
      
      // 调用后端接口生成图片
      const response = await new Promise<any>((resolve, reject) => {
        wx.request({
          url: API_URLS.GEMINI_IMAGE_GENERATE,
          method: 'POST',
          header: {
            'Authorization': `Bearer ${token}`,
            'content-type': 'application/json'
          },
          data: {
            prompt: this.data.prompt,
            imageUrls: this.data.imageUrls
          },
          success: resolve,
          fail: reject
        });
      });

      if (response.statusCode === 200 && response.data && response.data.success) {
        const generatedImageUrl = response.data.data.imageUrl;
        
        this.setData({
          generatedImageUrl
        });

        wx.hideLoading();
        wx.showToast({
          title: '图片生成成功',
          icon: 'success'
        });
      } else {
        wx.hideLoading();
        wx.showToast({
          title: response.data?.message || '图片生成失败',
          icon: 'none'
        });
      }
    } catch (error) {
      wx.hideLoading();
      console.error('生成图片失败:', error);
      wx.showToast({
        title: '生成图片失败，请重试',
        icon: 'none'
      });
    } finally {
      this.setData({
        isGenerating: false
      });
    }
  },

  // 保存图片
  onSaveImage() {
    if (!this.data.generatedImageUrl) {
      wx.showToast({
        title: '没有可保存的图片',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: '保存中...',
    });

    wx.downloadFile({
      url: this.data.generatedImageUrl,
      success: (res) => {
        wx.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: () => {
            wx.hideLoading();
            wx.showToast({
              title: '保存成功',
              icon: 'success'
            });
          },
          fail: (err) => {
            wx.hideLoading();
            console.error('保存图片失败:', err);
            
            // 检查是否是权限问题
            if (err.errMsg.includes('auth')) {
              wx.showModal({
                title: '提示',
                content: '需要您授权保存图片到相册',
                confirmText: '去授权',
                success: (modalRes) => {
                  if (modalRes.confirm) {
                    wx.openSetting();
                  }
                }
              });
            } else {
              wx.showToast({
                title: '保存失败',
                icon: 'none'
              });
            }
          }
        });
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('下载图片失败:', err);
        wx.showToast({
          title: '保存失败',
          icon: 'none'
        });
      }
    });
  }
});