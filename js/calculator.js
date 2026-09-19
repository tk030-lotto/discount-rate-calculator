/**
 * 割引率らくらく計算 - Calculation Core
 * Pure Calculation Functions (Zero DOM Dependency, Node.js & Browser compatible)
 * (c) 2026 tk030. Released under the MIT License.
 */

((root) => {
  'use strict';

  /**
   * 端数処理（四捨五入 / 切り捨て / 切り上げ）
   * @param {number} val
   * @param {'round' | 'floor' | 'ceil'} method
   * @returns {number}
   */
  const applyRounding = (val, method = 'round') => {
    if (method === 'floor') return Math.floor(val);
    if (method === 'ceil') return Math.ceil(val);
    return Math.round(val);
  };

  /**
   * 金額表示用カンマ区切りフォーマット
   * @param {number} num
   * @returns {string}
   */
  const formatCurrency = (num) => {
    return Math.round(num).toLocaleString('ja-JP');
  };

  /**
   * 割引率表示用フォーマット（整数または小数第1位）
   * @param {number} num
   * @returns {string}
   */
  const formatPercent = (num) => {
    if (Number.isInteger(num)) return num.toString();
    return num.toFixed(1);
  };

  /**
   * 複数割引の順次適用計算
   * @param {Object} params
   * @param {number|string} params.price 元価格
   * @param {Array<number|string>} params.discounts 割引率の配列
   * @param {'round' | 'floor' | 'ceil'} [params.rounding='round'] 端数処理方法
   * @returns {Object} 計算結果オブジェクト
   */
  const calculateDiscounts = ({ price, discounts = [], rounding = 'round' }) => {
    const rawPrice = Number(price);
    const validPrice = isNaN(rawPrice) || rawPrice <= 0 ? 0 : rawPrice;

    // 割引率の安全なクランプ (0% 〜 100%)
    const cleanDiscounts = (Array.isArray(discounts) ? discounts : []).map((d) => {
      const num = Number(d);
      if (isNaN(num)) return 0;
      return Math.min(100, Math.max(0, num));
    });

    let currentPrice = validPrice;
    let simpleSum = 0;
    const steps = [];

    // Step 0: 元価格
    steps.push({
      step: 0,
      title: '通常価格',
      rate: 0,
      multiplier: 1,
      priceBefore: validPrice,
      discountAmount: 0,
      priceAfter: validPrice
    });

    // 各ステップの順次適用計算
    cleanDiscounts.forEach((rate, idx) => {
      simpleSum += rate;
      const multiplier = Math.max(0, 1 - rate / 100);
      const nextPrice = currentPrice * multiplier;
      const discountAmount = currentPrice - nextPrice;

      steps.push({
        step: idx + 1,
        title: idx === 0 ? `${rate}% OFF` : `さらに ${rate}% OFF`,
        rate: rate,
        multiplier: multiplier,
        priceBefore: currentPrice,
        discountAmount: discountAmount,
        priceAfter: nextPrice
      });

      currentPrice = nextPrice;
    });

    // 最終表示用丸め処理
    const roundedFinalPrice = applyRounding(currentPrice, rounding);
    const savedAmount = Math.max(0, validPrice - roundedFinalPrice);
    const effectiveRate = validPrice > 0 ? ((validPrice - roundedFinalPrice) / validPrice) * 100 : 0;

    return {
      validPrice,
      cleanDiscounts,
      simpleSum,
      finalPrice: roundedFinalPrice,
      savedAmount,
      effectiveRate,
      steps
    };
  };

  const Calculator = {
    applyRounding,
    formatCurrency,
    formatPercent,
    calculateDiscounts
  };

  // Node.js (CommonJS) / ブラウザ両対応
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = Calculator;
  } else {
    root.Calculator = Calculator;
  }
})(typeof window !== 'undefined' ? window : globalThis);
