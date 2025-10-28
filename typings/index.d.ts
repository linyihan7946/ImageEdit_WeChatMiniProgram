/// <reference path="./types/index.d.ts" />

interface IAppOption {
  globalData: {
    code?: string,
    userInfo?: WechatMiniprogram.UserInfo,
  }
  userInfoReadyCallback?: WechatMiniprogram.GetUserInfoSuccessCallback,
}