// 全局配置文件
export const GLOBAL_CONFIG = {
  
  // 图片最大大小限制 (MB)
  MAX_IMAGE_SIZE: 10,
  
  // 图片最大尺寸限制
  MAX_IMAGE_WIDTH: 4096,
  MAX_IMAGE_HEIGHT: 4096,
  
  // API 请求超时时间 (ms)
  API_TIMEOUT: 30000,
  
  // 缓存过期时间 (ms)
  CACHE_EXPIRE_TIME: 3600000, // 1小时
  
  // 支持的图片格式
  SUPPORTED_IMAGE_FORMATS: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
  
  // 页面标题配置
  PAGE_TITLES: {
    INDEX: '水印克星',
    LOGIN: '用户登录',
    REGISTER: '用户注册',
    WATERMARK_REMOVE: '图片去水印',
    LOGS: '操作日志'
  },
  
  // 提示文案
  MESSAGES: {
    USAGE_LIMIT_EXCEEDED: '当天免费次数已用完，如需继续使用请充值！',
    PROCESSING: '正在处理...',
    PROCESS_SUCCESS: '处理完成',
    PROCESS_FAILURE: '处理失败，请重试',
    IMAGE_TOO_LARGE: '图片大小超过限制，请选择更小的图片',
    IMAGE_FORMAT_NOT_SUPPORTED: '不支持的图片格式',
    NETWORK_ERROR: '网络请求失败，请检查网络连接',
    LOGIN_REQUIRED: '请先登录',
    SAVE_SUCCESS: '保存成功',
    SAVE_FAILURE: '保存失败，请重试'
  },
  
  // 每天免费使用图片编辑的次数
  freeEditCount: 3,
  
  // 菜品用料图参考图
  dishIngredientReferenceImage: '',
  
  // 扣款金额
  deductAmount: 0.5,
};

// 导出默认配置
export default GLOBAL_CONFIG;
