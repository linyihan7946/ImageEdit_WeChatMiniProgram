// cos-upload.ts - 微信小程序上传本地文件到腾讯云COS的工具函数
import { API_URLS } from '../config/api';

// COS临时密钥接口返回的数据结构
export interface CosTempKeys {
  TmpSecretId: string;
  TmpSecretKey: string;
  XCosSecurityToken: string;
  ExpiredTime: number;
}

// 上传配置选项
export interface UploadOptions {
  // 本地文件路径
  filePath: string;
  // 存储在COS的文件夹路径，默认为空
  folder?: string;
  // 文件名，不传则自动生成
  fileName?: string;
  // 文件类型，不传则从文件路径推断
  fileType?: string;
  // 上传进度回调
  onProgress?: (progress: number) => void;
}

// 腾讯云COS配置（需根据实际情况修改）
const COS_CONFIG = {
  // 存储桶名称，格式：BucketName-APPID
  Bucket: 'your-bucket-name-1250000000',
  // COS区域，如 ap-guangzhou, ap-shanghai 等
  Region: 'ap-guangzhou',
  // 获取临时密钥的接口（使用api.ts中配置的URL）
  TEMP_KEY_URL: API_URLS.GET_COS_KEYS,
};

// 临时密钥缓存
let tempKeysCache: CosTempKeys | null = null;
let tempKeysExpireTime = 0;

/**
 * 获取临时密钥
 * @returns 临时密钥对象
 */
export const getTempKeys = (): Promise<any> => {
  const promise: Promise<CosTempKeys> = new Promise((resole, reject) => {
    // 检查缓存的密钥是否有效
    const now = Math.floor(Date.now() / 1000);
    if (tempKeysCache && now < tempKeysExpireTime - 300) { // 提前5分钟过期
      return resole(tempKeysCache);
    }

    try {
      // 调用后端接口获取临时密钥
      wx.request({
        url: COS_CONFIG.TEMP_KEY_URL,
        method: 'GET',
        header: {
          'content-type': 'application/json',
        },
        success: (res) => {
          console.log(res);
          const data: any = res.data;
          if (res.statusCode === 200 && data && data.data) {
            const tempKeys = data.data;
            tempKeysCache = tempKeys;
            tempKeysExpireTime = tempKeys.ExpiredTime;
            resole(tempKeys);
          } else {
            throw new Error(data.message || '获取临时密钥失败');
          }
        },
        fail: (err) => {
          reject(err);
        }
      });
      // console.log(response);

      // if (response.statusCode !== 200 || !response.data.success) {
      //   throw new Error(response.data.message || '获取临时密钥失败');
      // }

      // const tempKeys = response.data.data;
      // tempKeysCache = tempKeys;
      // tempKeysExpireTime = tempKeys.ExpiredTime;
      
      // return tempKeys;
    } catch (error) {
      console.error('获取COS临时密钥失败:', error);
      throw new Error('获取COS临时密钥失败，请稍后重试');
      reject();
    }
  });
  return promise;
}

/**
 * 生成文件存储路径
 * @param options 上传选项
 * @returns 文件路径
 */
export const generateFilePath = (options: UploadOptions): string => {
  let { folder = '', fileName, filePath, fileType } = options;
  
  // 确保文件夹路径以/开头但不以/结尾
  if (folder && !folder.startsWith('/')) {
    folder = `/${folder}`;
  }
  if (folder && folder.endsWith('/')) {
    folder = folder.slice(0, -1);
  }
  
  // 如果没有指定文件名，生成随机文件名
  if (!fileName) {
    // 如果没有指定文件类型，从文件路径推断
    if (!fileType) {
      const match = filePath.match(/\.([^.]+)$/);
      fileType = match ? match[1] : 'bin';
    }
    
    // 生成随机文件名
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    fileName = `${timestamp}-${random}.${fileType}`;
  }
  
  return `${folder}/${fileName}`;
};

/**
 * 生成签名
 * @param tempKeys 临时密钥
 * @param options 签名选项
 * @returns 签名对象
 */
export const generateAuthorization = (tempKeys: CosTempKeys, options: any): any => {
  return {
    TmpSecretId: tempKeys.TmpSecretId,
    TmpSecretKey: tempKeys.TmpSecretKey,
    SecurityToken: tempKeys.XCosSecurityToken,
    StartTime: Math.floor(Date.now() / 1000),
    ExpiredTime: tempKeys.ExpiredTime,
  };
};

/**
 * 上传单个文件到COS
 * @param options 上传选项
 * @returns 上传后的文件URL
 */
export const uploadFileToCos = async (options: UploadOptions): Promise<string> => {
  try {
    // 获取临时密钥
    const tempKeys = await getTempKeys();
    
    // 生成文件路径
    const cosFilePath = generateFilePath(options);
    
    // 调用微信小程序上传API
    const uploadResult = await wx.uploadFile({
      // COS上传地址，格式：https://Bucket.Region.myqcloud.com/ObjectName
      url: `https://${COS_CONFIG.Bucket}.cos.${COS_CONFIG.Region}.myqcloud.com${cosFilePath}`,
      filePath: options.filePath,
      name: 'file',
      header: {
        'Authorization': '', // 不需要手动设置，COS会自动处理
        'x-cos-security-token': tempKeys.XCosSecurityToken,
      },
      formData: {
        'key': cosFilePath.replace(/^\//, ''), // 去掉开头的/
        'success_action_status': '200',
        'Signature': '', // 不需要手动设置，COS会自动处理
        'x-cos-security-token': tempKeys.XCosSecurityToken,
        'Content-Type': '', // 不需要手动设置，微信会自动处理
      },
      success: () => {},
      fail: (error) => {
        console.error('文件上传失败:', error);
        throw new Error(`文件上传失败: ${error.errMsg || '未知错误'}`);
      },
      complete: () => {},
    });

    // 生成可访问的文件URL
    const fileUrl = `https://${COS_CONFIG.Bucket}.cos.${COS_CONFIG.Region}.myqcloud.com${cosFilePath}`;
    
    console.log('文件上传成功，URL:', fileUrl);
    return fileUrl;
  } catch (error) {
    console.error('上传文件到COS失败:', error);
    throw error;
  }
};

export default {
  getTempKeys,
  uploadFileToCos
};