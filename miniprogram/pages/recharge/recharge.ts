// recharge.ts
Page({
  data: {
    remainingCount: 0, // 当前剩余次数
    selectedPackageId: null, // 选中的套餐ID
    packages: [ // 充值套餐列表
      {
        id: 1,
        count: 10,
        price: 5,
        desc: '10次图片编辑'
      },
      {
        id: 2,
        count: 20,
        price: 10,
        desc: '20次图片编辑'
      },
      {
        id: 3,
        count: 30,
        price: 15,
        desc: '30次图片编辑'
      },
      {
        id: 4,
        count: 40,
        price: 20,
        desc: '40次图片编辑'
      },
      {
        id: 5,
        count: 50,
        price: 25,
        desc: '50次图片编辑'
      },
      {
        id: 6,
        count: 100,
        price: 50,
        desc: '100次图片编辑'
      }
    ]
  },
  
  onLoad() {
    // 页面加载时获取当前剩余次数
    this.updateRemainingCount();
  },
  
  // 更新剩余次数
  updateRemainingCount() {
    // 从本地存储获取当前剩余次数
    const usedCount = wx.getStorageSync('usedCount') || 0;
    const totalCount = 5; // 默认初始次数
    const purchasedCount = wx.getStorageSync('purchasedCount') || 0;
    const remainingCount = Math.max(0, totalCount + purchasedCount - usedCount);
    
    this.setData({
      remainingCount
    });
  },
  
  // 选择充值套餐
  onSelectPackage(e: any) {
    const packageId = e.currentTarget.dataset.id;
    this.setData({
      selectedPackageId: packageId
    });
  },
  
  // 确认充值
  onRecharge() {
    if (!this.data.selectedPackageId) {
      wx.showToast({
        title: '请选择充值套餐',
        icon: 'none'
      });
      return;
    }
    
    // 获取选中的套餐
    const selectedPackage = this.data.packages.find(pkg => pkg.id === this.data.selectedPackageId);
    if (!selectedPackage) return;
    
    // 模拟支付过程
    wx.showLoading({
      title: '充值中...'
    });
    
    // 模拟支付延迟
    setTimeout(() => {
      // 更新本地存储的购买次数
      const currentPurchasedCount = wx.getStorageSync('purchasedCount') || 0;
      const newPurchasedCount = currentPurchasedCount + selectedPackage.count;
      
      wx.setStorageSync('purchasedCount', newPurchasedCount);
      
      // 更新当前剩余次数
      this.updateRemainingCount();
      
      wx.hideLoading();
      
      // 显示充值成功提示
      wx.showToast({
        title: `充值成功！获得${selectedPackage.count}次`,
        icon: 'success'
      });
      
      // 延迟关闭页面
      setTimeout(() => {
        this.onClose();
      }, 1500);
    }, 1500);
  },
  
  // 关闭页面
  onClose() {
    wx.navigateBack();
  }
});