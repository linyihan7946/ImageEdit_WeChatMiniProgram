import { API_URLS } from "./config/api"
import GLOBAL_CONFIG from "./config/config"

// app.ts
App<IAppOption>({
  globalData: {
    code: ''
  },
  onLaunch() {

    // 登录
    wx.login({
      success: async res => {
        console.log(res.code)
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
        this.globalData.code = res.code;

        const response = await new Promise<any>((resolve, reject) => {
          wx.request({
            url: API_URLS.GET_CONFIG,
            method: 'GET',
            timeout: 10000,
            success: resolve,
            fail: reject
          });
        });
        
        if (response.statusCode === 200 && response.data && response.data.success) {
          const config = response.data.data;
          GLOBAL_CONFIG.dishIngredientReferenceImage = config.dishIngredientReferenceImage || '';
          console.log('配置信息加载成功:', config);
        } else {
          console.error('获取配置信息失败:', response.data?.message || '未知错误');
        }
      },
    })
  },
})