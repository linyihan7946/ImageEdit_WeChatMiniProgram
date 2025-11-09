// cos-upload.ts - 微信小程序上传本地文件到腾讯云COS的工具函数
import { API_URLS } from '../config/api';

// COS临时密钥接口返回的数据结构
export interface CosTempKeys {
  secretId: string;
  secretKey: string;
  sessionToken?: string;
  region: string;
  bucket: string;
  expiredTime: number;
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

// 直接上传配置选项
export interface DirectUploadOptions {
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
        url: API_URLS.GET_COS_KEYS,
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
    } catch (error) {
      console.error('获取COS临时密钥失败:', error);
      reject(error);
    }
  });
  return promise;
}

/**
 * 生成文件存储路径
 * @param options 上传选项
 * @returns 文件路径
 */
const generateFilePath = (options: UploadOptions): string => {
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
 * 直接上传文件到COS（使用传入的密钥信息）
 * @param options 直接上传选项，包含文件路径和COS密钥信息
 * @returns 上传后的文件URL
 */
export function directUploadFileToCos(options: DirectUploadOptions): Promise<string> {
  return new Promise((resolve, reject) => {
      getTempKeys().then((res) => {
        try { 
          const { secretId, secretKey, securityToken, region, bucket, expiredTime } = res;
          const { filePath, folder = '', fileName, fileType } = options;
          
          // 构建临时的UploadOptions用于生成文件路径
          const tempUploadOptions: UploadOptions = {
            filePath,
            folder,
            fileName,
            fileType,
            onProgress: options.onProgress
          };
          console.log(tempUploadOptions);
          
          // 生成文件路径
          const cosFilePath = generateFilePath(tempUploadOptions);
          console.log(cosFilePath);

          const dir = `https://${bucket}.cos.${region}.myqcloud.com`;
          const cosUploadUrl = `${dir}${cosFilePath}`;
          
          // 调用微信小程序上传API
          wx.uploadFile({
            url: cosUploadUrl,
            filePath: filePath,
            name: 'file',
            header: {
              'Authorization': '', // 不需要手动设置，COS会自动处理
              'x-cos-security-token': securityToken,
            },
            formData: {
              'key': cosFilePath, // 去掉开头的/
              'success_action_status': '200',
              'Signature': '', // 不需要手动设置，COS会自动处理
              'x-cos-security-token': securityToken,
              'Content-Type': '', // 不需要手动设置，微信会自动处理
            },
            success: (res: any) => {
              console.log("success:", res);
              console.log("上传功能成功")
              resolve(cosUploadUrl);
            },
            fail: (error) => {
              console.error('直接上传文件失败:', error);
              // throw new Error(`文件上传失败: ${error.errMsg || '未知错误'}`);
              reject(error);
            },
            complete: (res: any) => {
              console.log("complete:", res);
              console.log("上传功能完成")
              resolve(cosUploadUrl);
            },
          });

          // console.log('直接上传文件成功，URL:', cosUploadUrl);
          // return cosUploadUrl;
        } catch (error) {
          console.error('直接上传文件到COS失败:', error);
          // throw error;
          reject(error);
        }
      });
  });
}

export default {
  getTempKeys,
  directUploadFileToCos
};