/**
 * 割引率らくらく計算 - Main Application Entry Point
 * Orchestrates Calculator, CalculatorState, and CalculatorUI modules.
 * Pure Vanilla JS (ES2022) / Zero-Dependency.
 * (c) 2026 tk030. Released under the MIT License.
 */

(() => {
  'use strict';

  // --- State ---
  let state = window.CalculatorState.getDefaultState();

  // --- DOM Elements ---
  const elPrice = document.getElementById('input-price');
  const elDiscountsContainer = document.getElementById('discounts-container');
  const elBtnAddDiscount = document.getElementById('btn-add-discount');
  const elBtnReset = document.getElementById('btn-reset');
  const elBtnCopy = document.getElementById('btn-copy');
  const elBtnShare = document.getElementById('btn-share');
  const elFinalPrice = document.getElementById('final-price');
  const elEffectiveRate = document.getElementById('effective-rate');
  const elSavedAmount = document.getElementById('saved-amount');
  const elMisconceptionCard = document.getElementById('misconception-card');
  const elSimpleSumRate = document.getElementById('simple-sum-rate');
  const elMisconceptionText = document.getElementById('misconception-text');
  const elTimelineContainer = document.getElementById('timeline-container');
  const elToastContainer = document.getElementById('toast-container');
  const elRoundingRadios = document.querySelectorAll('input[name="rounding"]');

  // --- Core Render Routine ---
  const render = () => {
    const calcResult = window.Calculator.calculateDiscounts(state);
    const { formatCurrency, formatPercent } = window.Calculator;

    // 1. 最終数値サマリーの更新
    elFinalPrice.textContent = formatCurrency(calcResult.finalPrice);
    elEffectiveRate.textContent = formatPercent(calcResult.effectiveRate);
    elSavedAmount.textContent = formatCurrency(calcResult.savedAmount);

    // 2. 価格入力欄の同期
    if (document.activeElement !== elPrice) {
      elPrice.value = state.price;
    }

    // 3. 価格クイックチップのアクティブ状態
    document.querySelectorAll('.price-chip').forEach((chip) => {
      const p = Number(chip.dataset.price);
      chip.classList.toggle('active', p === Number(state.price));
    });

    // 4. 勘違い防止バナーの制御
    if (calcResult.cleanDiscounts.length >= 2 && calcResult.cleanDiscounts.some((d) => d > 0)) {
      elMisconceptionCard.style.display = 'block';
      elSimpleSumRate.textContent = `${formatPercent(calcResult.simpleSum)}%`;

      const firstStepText = `${calcResult.cleanDiscounts[0]}%引き`;
      const nextStepsText = calcResult.cleanDiscounts
        .slice(1)
        .map((d) => `${d}%引き`)
        .join('、さらに');

      elMisconceptionText.innerHTML = `
        割引後の価格に対して次の割引が順番に適用されるため（${firstStepText} → ${nextStepsText}）、<br>
        実質的な割引率は <strong>${formatPercent(calcResult.effectiveRate)}% OFF</strong>（¥${formatCurrency(calcResult.savedAmount)} 引き）となります。
      `;
    } else {
      elMisconceptionCard.style.display = 'none';
    }

    // 5. タイムライン描画
    window.CalculatorUI.renderTimeline(elTimelineContainer, calcResult, state.rounding);

    // 6. 状態保存
    window.CalculatorState.saveState(state);
  };

  // --- Event Listeners Initialization ---
  const initEvents = () => {
    // 通常価格の入力
    elPrice.addEventListener('input', (e) => {
      const val = Number(e.target.value);
      state.price = isNaN(val) ? 0 : val;
      render();
    });

    // 価格クイックチップ
    document.querySelectorAll('.price-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        const p = Number(chip.dataset.price);
        state.price = p;
        elPrice.value = p;
        render();
      });
    });

    // 割引追加ボタン
    elBtnAddDiscount.addEventListener('click', () => {
      state.discounts.push(10); // 新規割引のデフォルトを10%に設定
      window.CalculatorUI.renderDiscountInputs(elDiscountsContainer, state, render);
      render();
    });

    // リセットボタン
    elBtnReset.addEventListener('click', () => {
      state = window.CalculatorState.getDefaultState();
      window.CalculatorState.clearSavedState();
      elPrice.value = state.price;

      elRoundingRadios.forEach((radio) => {
        radio.checked = radio.value === state.rounding;
      });

      window.CalculatorUI.renderDiscountInputs(elDiscountsContainer, state, render);
      render();
      window.CalculatorUI.showToast(elToastContainer, '🔄 入力を初期状態にリセットしました');
    });

    // 端数処理ラジオボタン
    elRoundingRadios.forEach((radio) => {
      radio.addEventListener('change', (e) => {
        if (e.target.checked) {
          state.rounding = e.target.value;
          render();
        }
      });
    });

    // コピーボタン
    elBtnCopy.addEventListener('click', () => {
      const calcResult = window.Calculator.calculateDiscounts(state);
      window.CalculatorUI.copyResultToClipboard(calcResult, elToastContainer);
    });

    // 共有ボタン
    elBtnShare.addEventListener('click', () => {
      window.CalculatorUI.shareConditions(state, elToastContainer);
    });
  };

  // --- App Initialization ---
  const init = () => {
    state = window.CalculatorState.loadState();

    // UIの初期同期
    elPrice.value = state.price;
    elRoundingRadios.forEach((radio) => {
      radio.checked = radio.value === state.rounding;
    });

    window.CalculatorUI.renderDiscountInputs(elDiscountsContainer, state, render);
    initEvents();
    render();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
