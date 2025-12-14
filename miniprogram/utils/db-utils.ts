import { API_URLS } from "../config/api";

export class dbUtils {

    // 获取用户信息
    static async getUserInfo(): Promise<{ userInfo?: {
        userId: number,
        nickname: string | undefined, 
        avatarUrl: string | undefined,
        registerTime: Date,
        lastLoginTime: Date | undefined,
        status: number,
        phone: string | undefined
    } | null, success: boolean }> {
        const token = wx.getStorageSync('userToken');
      
        if (!token) {
            throw new Error('用户未登录');
        }
        const userInfoResponse = await new Promise<any>((resolve, reject) => {
          wx.request({
            url: API_URLS.USER_INFO,
            method: 'GET',
            header: {
              'Authorization': `Bearer ${token}`,
              'content-type': 'application/json'
            },
            success: resolve,
            fail: reject
          });
        })
        // 处理用户信息响应
      let userInfo: {
        userId: number,
        nickname: string | undefined, 
        avatarUrl: string | undefined,
        registerTime: Date,
        lastLoginTime: Date | undefined,
        status: number,
        phone: string | undefined
    } | null = null;
      if (userInfoResponse.statusCode === 200 && userInfoResponse.data && userInfoResponse.data.success) {
        userInfo = userInfoResponse.data.data;
      } else {
        console.error('获取用户信息失败:', userInfoResponse.data?.message || '未知错误');
      }
      return { userInfo, success: userInfo !== null };
    }
    
  /**
   * 获取用户信息和余额
   * @returns Promise<{ userInfo?: any; balance?: number; success: boolean }>
   */
  static async getBalance(): Promise<{ balance?: number, success: boolean }> {
    try {
      const token = wx.getStorageSync('userToken');
      
      if (!token) {
        throw new Error('用户未登录');
      }

      // 并行请求用户信息和余额
      const balanceResponse = await 
        new Promise<any>((resolve, reject) => {
          wx.request({
            url: API_URLS.USER_BALANCE,
            method: 'GET',
            header: {
              'Authorization': `Bearer ${token}`,
              'content-type': 'application/json'
            },
            data: {
              userId: wx.getStorageSync('userId') || 0
            },
            success: resolve,
            fail: reject
          });
        });

      // 处理余额响应
      let balance = 0;
      if (balanceResponse.statusCode === 200 && balanceResponse.data && balanceResponse.data.success) {
        balance = parseFloat(balanceResponse.data.data.balance) || 0;
      } else {
        console.error('获取用户余额失败:', balanceResponse.data?.message || '未知错误');
      }

      return {
        balance,
        success: true
      };
    } catch (error) {
      console.error('获取用户信息和余额失败:', error);
      return {
        success: false
      };
    }
  }
}
