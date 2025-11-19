import { API_URLS } from '../config/api';

/**
 * 图片编辑工具类
 * 封装IMAGE_EDIT相关的接口调用
 */
class ImageEditUtil {
  /**
   * 调用图片编辑接口，将图片转换为水彩画
   * @param imageUrl 待编辑的图片URL
   * @param instruction 编辑指令
   * @returns Promise<{ success: boolean; data?: { images: string[] }; error?: string }>
   */
  static async editImage(imageUrl: string, instruction: string = '将下面的手绘图变成漂亮的水彩画图'): Promise<{ 
    success: boolean; 
    data?: { images: string[] }; 
    error?: string 
  }> {
    return new Promise((resolve) => {
      const token = wx.getStorageSync('userToken');

      wx.request({
        url: API_URLS.IMAGE_EDIT,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: {
          instruction,
          imageUrls: [imageUrl]
        },
        success: (res) => {
          const data: any = res.data;
          if (res.statusCode === 200 && data && data.success) {
            resolve({
              success: true,
              data: { images: data.data.images || [] }
            });
          } else {
            resolve({
              success: false,
              error: '图片编辑失败: ' + (data?.message || '未知错误')
            });
          }
        },
        fail: (err) => {
          const errorMsg = '图片编辑请求失败: ' + err.errMsg;
          console.error(errorMsg);
          resolve({
            success: false,
            error: errorMsg
          });
        }
      });
    });
  }

  /**
   * 调用新版图片编辑接口
   * @param imageUrl 待编辑的图片URL
   * @param instruction 编辑指令
   * @returns Promise<{ success: boolean; data?: any; error?: string }>
   */
  static async editImageNew(imageUrl: string, instruction: string = '将下面的手绘图变成漂亮的水彩画图'): Promise<{ 
    success: boolean; 
    data?: any; 
    error?: string 
  }> {
    return new Promise((resolve) => {
      const token = wx.getStorageSync('userToken');

      wx.request({
        url: API_URLS.IMAGE_EDIT_NEW,
        method: 'POST',
        header: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        data: {
          instruction,
          imageUrls: [imageUrl]
        },
        success: (res) => {
          const data: any = res.data;
          if (res.statusCode === 200 && data && data.success) {
            resolve({
              success: true,
              data: data.data
            });
          } else {
            resolve({
              success: false,
              error: '图片编辑失败: ' + (data?.message || '未知错误')
            });
          }
        },
        fail: (err) => {
          const errorMsg = '图片编辑请求失败: ' + err.errMsg;
          console.error(errorMsg);
          resolve({
            success: false,
            error: errorMsg
          });
        }
      });
    });
  }

  /**
   * 处理图片编辑并显示结果提示
   * @param imageUrl 待编辑的图片URL
   * @param instruction 编辑指令
   * @returns Promise<string | null> 编辑后的图片URL，失败返回null
   */
  static async processAndShowEditResult(imageUrl: string, instruction?: string): Promise<string | null> {
    try {
      wx.showLoading({
        title: '图片编辑中...',
        mask: true
      });

      const result = await ImageEditUtil.editImage(imageUrl, instruction);

      wx.hideLoading();

      if (result.success && result.data?.images && result.data.images.length > 0) {
        wx.showToast({
          title: '图片编辑成功',
          icon: 'success'
        });
        return result.data.images[0]; // 返回第一个编辑后的图片URL
      } else {
        wx.showToast({
          title: result.error || '图片编辑失败，请重试',
          icon: 'none'
        });
        return null;
      }
    } catch (error) {
      wx.hideLoading();
      console.error('处理图片编辑异常:', error);
      wx.showToast({
        title: '图片编辑过程中出现异常',
        icon: 'none'
      });
      return null;
    }
  }
}

// 导出便捷方法
export const { editImage, editImageNew, processAndShowEditResult } = ImageEditUtil;

// 导出默认工具类实例
export default ImageEditUtil;