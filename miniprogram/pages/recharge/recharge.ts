// recharge.ts
Page({
  data: {
    currentBalance: '0.00', // 当前余额
    selectedPackageId: null, // 选中的套餐ID
    packages: [ // 充值套餐列表
      {
        id: 1,
        amount: 10,
        price: 10,
        desc: '充值10元'
      },
      {
        id: 2,
        amount: 20,
        price: 20,
        desc: '充值20元'
      },
      {
        id: 3,
        amount: 30,
        price: 30,
        desc: '充值30元'
      },
      {
        id: 4,
        amount: 40,
        price: 40,
        desc: '充值40元'
      },
      {
        id: 5,
        amount: 50,
        price: 50,
        desc: '充值50元'
      },
      {
        id: 6,
        amount: 100,
        price: 100,
        desc: '充值100元'
      }
    ]
  },
  
  onLoad() {
    // 页面加载时获取当前余额
    this.updateCurrentBalance();
  },
  
  // 更新当前余额
  updateCurrentBalance() {
    // 从本地存储获取当前余额并格式化为两位小数
    const currentBalance = wx.getStorageSync('currentBalance');
    
    this.setData({
      currentBalance
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
        title: '请选择充值金额',
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
      // 更新本地存储的当前余额
      const currentBalance = parseFloat(wx.getStorageSync('currentBalance') || '0.00');
      const newBalance = parseFloat((currentBalance + selectedPackage.amount).toFixed(2));
      
      wx.setStorageSync('currentBalance', newBalance);
      
      // 更新当前余额显示
      this.updateCurrentBalance();
      
      wx.hideLoading();
      
      // 显示充值成功提示
      wx.showToast({
        title: `充值成功！金额：¥${selectedPackage.amount}`,
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