// API接口配置文件
const API_BASE_URL = 'http://localhost:3000';

export const API_URLS = {
  // 基础URL
  API_BASE_URL: API_BASE_URL,
  
  // 用户相关接口
  USER_LOGIN: `${API_BASE_URL}/api/wechat/login`,
  
  // 图片编辑接口
  IMAGE_EDIT: `${API_BASE_URL}/edit-image`,

  // 图片编辑新接口
  IMAGE_EDIT_NEW: `${API_BASE_URL}/edit-image-new`,
  
  // COS临时密钥接口
  GET_COS_KEYS: `${API_BASE_URL}/api/cos/temp-keys`,
  
  // Base64上传到COS接口
  UPLOAD_BASE64_TO_COS: `${API_BASE_URL}/api/upload-base64-to-cos`,
};