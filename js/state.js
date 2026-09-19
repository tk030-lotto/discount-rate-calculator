/**
 * 割引率らくらく計算 - State Management
 * Handles application state, presets, URL parameters, and LocalStorage persistence.
 * (c) 2026 tk030. Released under the MIT License.
 */

((root) => {
  'use strict';

  const STORAGE_KEY = 'discount_calculator_state_v1';

  const PRESET_DISCOUNTS = [
    { label: '10%', value: 10 },
    { label: '20%', value: 20 },
    { label: '30%', value: 30 },
    { label: '半額(50%)', value: 50 },
    { label: '70%', value: 70 }
  ];

  /**
   * デフォルト状態の生成
   */
  const getDefaultState = () => ({
    price: 10000,
    discounts: [50, 30],
    rounding: 'round' // 'round' | 'floor' | 'ceil'
  });

  /**
   * LocalStorageへの保存
   */
  const saveState = (state) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // プライベートモード等での例外を安全に無視
    }
  };

  /**
   * 状態の復元（URLクエリパラメータ優先 → LocalStorage → デフォルト）
   */
  const loadState = () => {
    const state = getDefaultState();

    // 1. URLクエリパラメータの確認
    const params = new URLSearchParams(window.location.search);
    if (params.has('p') || params.has('d')) {
      const p = Number(params.get('p'));
      if (!isNaN(p) && p > 0) {
        state.price = p;
      }

      const d = params.get('d');
      if (d) {
        const arr = d
          .split(',')
          .map(Number)
          .filter((n) => !isNaN(n) && n >= 0 && n <= 100);
        if (arr.length > 0) {
          state.discounts = arr;
        }
      }

      const r = params.get('r');
      if (['round', 'floor', 'ceil'].includes(r)) {
        state.rounding = r;
      }
      return state;
    }

    // 2. LocalStorageからの読み込み
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          if (parsed.price && !isNaN(Number(parsed.price)) && Number(parsed.price) > 0) {
            state.price = Number(parsed.price);
          }
          if (Array.isArray(parsed.discounts) && parsed.discounts.length > 0) {
            const validDiscounts = parsed.discounts
              .map(Number)
              .filter((n) => !isNaN(n) && n >= 0 && n <= 100);
            if (validDiscounts.length > 0) {
              state.discounts = validDiscounts;
            }
          }
          if (['round', 'floor', 'ceil'].includes(parsed.rounding)) {
            state.rounding = parsed.rounding;
          }
        }
      }
    } catch (e) {
      // パースエラー等の場合はデフォルト値を使用
    }

    return state;
  };

  /**
   * 保存済み状態のリセット
   */
  const clearSavedState = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
  };

  root.CalculatorState = {
    STORAGE_KEY,
    PRESET_DISCOUNTS,
    getDefaultState,
    saveState,
    loadState,
    clearSavedState
  };
})(typeof window !== 'undefined' ? window : globalThis);
