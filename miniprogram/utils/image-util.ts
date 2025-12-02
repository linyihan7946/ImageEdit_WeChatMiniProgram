// image-util.ts - 图片处理工具函数

/**
 * 将本地图片文件转换为Base64字符串
 * @param imagePath 本地图片文件路径
 * @returns Promise<string> 返回Base64字符串
 */
export const imageToBase64 = (imagePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    try {
      // 使用微信小程序提供的FileSystemManager读取图片文件
      const fs = wx.getFileSystemManager();
      
      fs.readFile({
        filePath: imagePath,
        encoding: 'base64',
        success: (res) => {
          // 成功读取文件，返回base64字符串
          console.log('图片转Base64成功');
          // console.log('base64字符串:', res.data);
          resolve(res.data as string);
        },
        fail: (error) => {
          // 读取文件失败
          console.error('图片转Base64失败:', error);
          reject(new Error(`读取图片失败: ${error.errMsg || '未知错误'}`));
        }
      });
    } catch (error) {
      console.error('图片转Base64发生异常:', error);
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });
};

/**
 * 将本地图片文件转换为带前缀的完整Base64字符串（可直接用于img标签src）
 * @param imagePath 本地图片文件路径
 * @param mimeType 图片MIME类型，如image/jpeg, image/png等，不传入则自动推断
 * @returns Promise<string> 返回完整的Base64字符串，格式为data:[MIME类型];base64,[base64数据]
 */
export const imageToFullBase64 = async (imagePath: string, mimeType?: string): Promise<string> => {
  try {
    // 获取基础base64数据
    const base64Data = await imageToBase64(imagePath);
    
    // 自动推断MIME类型
    if (!mimeType) {
      // 根据文件扩展名推断MIME类型
      const parts = imagePath.split('.');
      const lastPart = parts.pop();
      const extension = lastPart ? lastPart.toLowerCase() : undefined;
      if (extension === 'jpg' || extension === 'jpeg') {
        mimeType = 'image/jpeg';
      } else if (extension === 'png') {
        mimeType = 'image/png';
      } else if (extension === 'gif') {
        mimeType = 'image/gif';
      } else if (extension === 'webp') {
        mimeType = 'image/webp';
      } else {
        // 默认MIME类型
        mimeType = 'image/jpeg';
      }
    }
    
    // 返回完整的带前缀的Base64字符串
    return `data:${mimeType};base64,${base64Data}`;
  } catch (error) {
    console.error('生成完整Base64字符串失败:', error);
    throw error instanceof Error ? error : new Error(String(error));
  }
};

/**
 * 检查图片文件大小
 * @param imagePath 本地图片文件路径
 * @returns Promise<number> 返回图片文件大小（单位：字节）
 */
export const getImageFileSize = (imagePath: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    try {
      const fs = wx.getFileSystemManager();
      fs.getFileInfo({
        filePath: imagePath,
        success: (res) => {
          resolve(res.size);
        },
        fail: (error) => {
          console.error('获取图片文件大小失败:', error);
          reject(new Error(`获取文件信息失败: ${error.errMsg || '未知错误'}`));
        }
      });
    } catch (error) {
      console.error('获取图片文件大小发生异常:', error);
      reject(error instanceof Error ? error : new Error(String(error)));
    }
  });
};

export default {
  imageToBase64,
  imageToFullBase64,
  getImageFileSize
};