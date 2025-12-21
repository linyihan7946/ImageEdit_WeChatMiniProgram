// dish-ingredient-edit.ts
import { uploadImageToBackend } from '../../utils/base64-upload';
import { API_URLS } from '../../config/api';
import GLOBAL_CONFIG from '../../config/config';
import { getClosestImageAspectRatio } from '../../utils/image-util';

Component({
  data: {
    selectedImagePath: '', // 选中的图片路径
    generatedImageUrl: '' // 生成的图片URL
  },
  
  lifetimes: {
    attached() {
      // 组件挂载时的初始化操作
      console.log('菜品食材用料图页面已加载');
    }
  },
  
  methods: {
    // 选择图片
    onSelectImage() {
      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album'],
        success: (res) => {
          console.log('选择图片成功:', res);
          const tempFilePath = res.tempFiles[0].tempFilePath;
          this.setData({
            selectedImagePath: tempFilePath,
            generatedImageUrl: '' // 清空之前的生成结果
          });
          // 选择图片后直接生成用料图
          this.onGenerateImage();
        },
        fail: (error) => {
          console.error('选择图片失败:', error);
          wx.showToast({
            title: '选择图片失败，请重试',
            icon: 'none'
          });
        }
      });
    },
    
    // 生成图片
    async onGenerateImage() {
      if (!this.data.selectedImagePath) {
        wx.showToast({
          title: '请先选择图片',
          icon: 'none'
        });
        return;
      }
      
      try {
        // 上传图片到后端
        const uploadResult = await uploadImageToBackend(this.data.selectedImagePath);
        const imageUrl = uploadResult.data.fileUrl;
        console.log('图片上传成功:', imageUrl);
        // 使用从配置获取的参考图链接，如果没有则使用空字符串
        const imageUrls = [imageUrl, GLOBAL_CONFIG.dishIngredientReferenceImage || ""];

        const aspectRatio = await getClosestImageAspectRatio(GLOBAL_CONFIG.dishIngredientReferenceImage);

        wx.showLoading({
          title: '生成图片中...',
        });
        
        // 调用GEMINI_IMAGE_GENERATE接口生成用料图
        const prompt = '根据图1的菜，生成类似图2的这个菜的食材跟调料用量图。';
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
              prompt,
              imageUrls,
              aspectRatio
            },
            timeout: 300000, // 设置超时时间为300秒
            success: resolve,
            fail: reject
          });
        });
        console.log("后端结果返回")
        if (response.statusCode === 200 && response.data && response.data.success) {
          const images = response.data.data.images || [];
          let generatedImageUrl = '';
          if (images && images.length > 0) {
            generatedImageUrl = images[0];
          }
          console.log('Generated image URL:', generatedImageUrl);
          
          // 先隐藏加载框
          wx.hideLoading();
          
          // 然后更新数据显示图片
          this.setData({
            generatedImageUrl
          });
          
          // 最后显示成功提示
          wx.showToast({
            title: '图片生成成功',
            icon: 'success'
          });
          
          console.log('Current generatedImageUrl:', this.data.generatedImageUrl);
        } else {
          // 先隐藏加载框
          wx.hideLoading();
          
          // 然后显示失败提示
          wx.showToast({
            title: response.data?.message || '图片生成失败',
            icon: 'none'
          });
        }
      } catch (error) {
        console.error('生成图片失败:', error);
        // 先隐藏加载框
        wx.hideLoading();
        // 然后显示失败提示
        wx.showToast({
          title: '生成图片失败，请重试',
          icon: 'none'
        });
      }
    },
    

    
    // 保存图片到相册
    onSaveImage() {
      if (!this.data.generatedImageUrl) {
        return;
      }
      
      wx.showLoading({
        title: '保存中...',
        mask: true
      });
      
      // 下载图片到本地
      wx.downloadFile({
        url: this.data.generatedImageUrl,
        success: (res) => {
          if (res.statusCode === 200) {
            // 保存图片到相册
            wx.saveImageToPhotosAlbum({
              filePath: res.tempFilePath,
              success: () => {
                wx.hideLoading();
                wx.showToast({
                  title: '保存成功',
                  icon: 'success'
                });
              },
              fail: (error) => {
                wx.hideLoading();
                console.error('保存图片到相册失败:', error);
                if (error.errMsg.indexOf('auth deny') !== -1) {
                  wx.showModal({
                    title: '授权提示',
                    content: '需要您授权保存图片到相册',
                    success: (modalRes) => {
                      if (modalRes.confirm) {
                        wx.openSetting({
                          success: (settingRes) => {
                            if (settingRes.authSetting['scope.writePhotosAlbum']) {
                              this.onSaveImage();
                            }
                          }
                        });
                      }
                    }
                  });
                } else {
                  wx.showToast({
                    title: '保存失败，请重试',
                    icon: 'none'
                  });
                }
              }
            });
          } else {
            wx.hideLoading();
            console.error('下载图片失败:', res);
            wx.showToast({
              title: '保存失败，请重试',
              icon: 'none'
            });
          }
        },
        fail: (error) => {
          wx.hideLoading();
          console.error('下载图片失败:', error);
          wx.showToast({
            title: '保存失败，请重试',
            icon: 'none'
          });
        }
      });
    }
  }
});