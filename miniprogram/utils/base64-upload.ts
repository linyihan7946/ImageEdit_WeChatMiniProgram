import { API_URLS } from '../config/api';
import { imageToFullBase64 } from './image-util';

const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB per chunk

/**
 * Base64图片上传工具类
 * 用于处理图片上传到后端的逻辑，包括单块上传和分块上传
 */
class Base64Uploader {
  

  /**
   * 上传图片Base64到后端
   * 自动判断是否需要分块上传
   * @param imagePath 图片本地路径
   * @returns 上传结果
   */
  async uploadBase64ToBackend(imagePath: string): Promise<any> {
    try {
      wx.showLoading({ title: '转换中...' });
      
      // 转换为Base64
      const base64 = await imageToFullBase64(imagePath);
      // console.log('图片转换为Base64成功，长度:', base64.length);
      
      // 移除Base64前缀，只保留数据部分
      let pureBase64 = base64.replace(/^data:image\/\w+;base64,/, '');
      // console.log('移除前缀后的Base64长度:', pureBase64.length);
      
      // 判断是否需要分块上传
      if (pureBase64.length > CHUNK_SIZE) {
        // 分块上传逻辑
        // console.log('Base64数据过大，启用分块上传');
        return await this.uploadBase64InChunks(pureBase64, imagePath);
      } else {
        // 单块上传
        return await this.uploadSingleChunk(pureBase64, imagePath);
      }
    } catch (error) {
      console.error('上传Base64到后端失败:', error);
      throw error;
    } finally {
      wx.hideLoading();
    }
  }
  
  /**
   * 单块上传
   * @param pureBase64 Base64数据（已移除前缀）
   * @param imagePath 图片路径
   * @returns 上传结果
   */
  async uploadSingleChunk(pureBase64: string, imagePath: string): Promise<any> {
    try {
      // 对于大Base64数据的处理
      wx.showLoading({ title: '发送中...' });
      
      const response = await new Promise<any>((resolve, reject) => {
        wx.request({
          url: API_URLS.UPLOAD_BASE64_TO_COS,
          method: 'POST',
          timeout: 60000,
          data: {
            imageBase64: pureBase64,
            imageType: 'jpg',
            isChunk: false
          },
          header: {
            'content-type': 'application/json',
            'Authorization': `Bearer ${wx.getStorageSync('userToken')}`
          },
          success: resolve,
          fail: reject
        });
      });

      // console.log('单块上传响应:', response);

      if (response.statusCode === 200 && response.data && typeof response.data === 'object' && 'success' in response.data && response.data.success) {
        return response.data;
      } else {
        throw new Error((response.data && typeof response.data === 'object' && (response.data as any).message) || '上传失败');
      }
    } catch (error) {
      console.error('单块上传失败:', error);
      throw error;
    }
  }

  /**
   * 分块上传
   * @param pureBase64 Base64数据（已移除前缀）
   * @param imagePath 图片路径
   * @returns 上传结果
   */
  async uploadBase64InChunks(pureBase64: string, imagePath: string): Promise<any> {
    try {
      const totalChunks = Math.ceil(pureBase64.length / CHUNK_SIZE);
      
      // 先生成一个文件ID用于标识本次上传
      const fileId = `chunk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      wx.showToast({
        title: `开始分块上传(${totalChunks}块)`,
        icon: 'none'
      });

      // 上传所有分块
      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, pureBase64.length);
        const chunkData = pureBase64.substring(start, end);
        
        console.log(`上传分块 ${i + 1}/${totalChunks}，大小: ${chunkData.length}`);
        wx.showLoading({ title: `上传 ${i + 1}/${totalChunks}` });
        
        const response = await new Promise<any>((resolve, reject) => {
          wx.request({
            url: API_URLS.UPLOAD_BASE64_TO_COS,
            method: 'POST',
            timeout: 60000,
            data: {
              imageBase64: chunkData,
              imageType: 'jpg',
              isChunk: true,
              fileId: fileId,
              chunkIndex: i,
              totalChunks: totalChunks,
              merge: false
            },
            header: {
              'content-type': 'application/json',
              'Authorization': `Bearer ${wx.getStorageSync('userToken')}`
            },
            success: resolve,
            fail: reject
          });
        });
        
        console.log(`分块 ${i + 1} 上传响应:`, response);
        
        if (response.statusCode !== 200 || !response.data || !response.data.success) {
          throw new Error(`分块 ${i + 1} 上传失败: ${(response.data && typeof response.data === 'object' && (response.data as any).message) || '未知错误'}`);
        }
      }
      
      // 所有分块上传完成后，发送合并请求
      console.log('所有分块上传完成，发送合并请求...');
      wx.showLoading({ title: '合并中...' });
      
      const mergeResponse = await new Promise<any>((resolve, reject) => {
        wx.request({
          url: API_URLS.UPLOAD_BASE64_TO_COS,
          method: 'POST',
          timeout: 120000, // 合并可能需要更长时间
          data: {
            imageType: 'jpg',
            isChunk: true,
            fileId: fileId,
            merge: true
          },
          header: {
            'content-type': 'application/json',
            'Authorization': `Bearer ${wx.getStorageSync('userToken')}`
          },
          success: resolve,
          fail: reject
        });
      });
      
      console.log('合并请求响应:', mergeResponse);
      
      if (mergeResponse.statusCode === 200 && mergeResponse.data && mergeResponse.data.success) {
        wx.showToast({
          title: '分块上传成功',
          icon: 'success'
        });
        return mergeResponse.data;
      } else {
        throw new Error((mergeResponse.data && typeof mergeResponse.data === 'object' && (mergeResponse.data as any).message) || '合并失败');
      }
    } catch (error) {
      console.error('分块上传失败:', error);
      throw error;
    }
  }
}

// 导出单例
export const base64Uploader = new Base64Uploader();

// 导出便捷方法
export async function uploadImageToBackend(imagePath: string): Promise<any> {
  return base64Uploader.uploadBase64ToBackend(imagePath);
}