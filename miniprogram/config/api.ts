// API接口配置文件
const API_BASE_URL = 'http://localhost:3000';
// const API_BASE_URL = 'http://119.29.233.6:3000';

export const API_URLS = {
  // 基础URL
  API_BASE_URL: API_BASE_URL,
  
  // 用户相关接口
  USER_LOGIN: `${API_BASE_URL}/api/wechat/login`,
  USER_INFO: `${API_BASE_URL}/api/user/info`,
  
  // 图片编辑接口
  IMAGE_EDIT: `${API_BASE_URL}/edit-image`,

  // 图片编辑新接口
  IMAGE_EDIT_NEW: `${API_BASE_URL}/edit-image-new`,
  
  // COS临时密钥接口
  GET_COS_KEYS: `${API_BASE_URL}/api/cos/temp-keys`,
  
  // Base64上传到COS接口
  UPLOAD_BASE64_TO_COS: `${API_BASE_URL}/api/upload-base64-to-cos`,

  // 用户当天使用次数接口
  USER_DAILY_USAGE: `${API_BASE_URL}/api/user/today-usage`,

  // 用户余额接口
  USER_BALANCE: `${API_BASE_URL}/api/balance`,

  // Gemini图片生成接口
  GEMINI_IMAGE_GENERATE: `${API_BASE_URL}/gemini-image-generate`,

  // 获取配置信息接口
  GET_CONFIG: `${API_BASE_URL}/api/config`,
};