/**
 * 割引率らくらく計算 - Web Application Logic
 * Zero-Dependency, Pure Vanilla JS (ES2022)
 * (c) 2026 tk030. Released under the MIT License.
 */

(() => {
  'use strict';

  // --- Constants & Config ---
  const STORAGE_KEY = 'discount_calculator_state_v1';
  const getDefaultState = () => ({
    price: 10000,
    discounts: [50, 30],
    rounding: 'round' // 'round' | 'floor' | 'ceil'
  });

  const PRESET_DISCOUNTS = [
    { label: '10%', value: 10 },
    { label: '20%', value: 20 },
    { label: '30%', value: 30 },
    { label: '半額 (50%)', value: 50 },
    { label: '70%', value: 70 }
  ];

  // --- State ---
  let state = getDefaultState();

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

  // --- Helper Functions ---
  const formatCurrency = (val) => {
    return Math.max(0, val).toLocaleString('ja-JP');
  };

  const formatPercent = (val) => {
    return Number(val.toFixed(1)).toString();
  };

  const applyRounding = (val, method) => {
    if (method === 'floor') return Math.floor(val);
    if (method === 'ceil') return Math.ceil(val);
    return Math.round(val);
  };

  // --- Core Calculation Engine ---
  const calculate = () => {
    const rawPrice = Number(state.price);
    const validPrice = isNaN(rawPrice) || rawPrice <= 0 ? 0 : rawPrice;
    
    // Filter out invalid discounts, clamp 0~100
    const cleanDiscounts = state.discounts.map(d => {
      const num = Number(d);
      if (isNaN(num)) return 0;
      return Math.min(100, Math.max(0, num));
    });

    let currentPrice = validPrice;
    let simpleSum = 0;
    const steps = [];

    // Step 0: Initial
    steps.push({
      step: 0,
      title: '通常価格',
      rate: 0,
      multiplier: 1,
      priceBefore: validPrice,
      discountAmount: 0,
      priceAfter: validPrice
    });

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

    const roundedFinalPrice = applyRounding(currentPrice, state.rounding);
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

  // --- Render Functions ---
  const render = () => {
    const calcResult = calculate();

    // 1. Final Summary Numbers
    elFinalPrice.textContent = formatCurrency(calcResult.finalPrice);
    elEffectiveRate.textContent = formatPercent(calcResult.effectiveRate);
    elSavedAmount.textContent = formatCurrency(calcResult.savedAmount);

    // 2. Price Input Sync
    if (document.activeElement !== elPrice) {
      elPrice.value = state.price;
    }

    // 3. Quick Price Chips Active State
    document.querySelectorAll('.price-chip').forEach(chip => {
      const p = Number(chip.dataset.price);
      chip.classList.toggle('active', p === Number(state.price));
    });

    // 4. Misconception Warning Banner
    if (calcResult.cleanDiscounts.length >= 2 && calcResult.cleanDiscounts.some(d => d > 0)) {
      elMisconceptionCard.style.display = 'block';
      elSimpleSumRate.textContent = `${formatPercent(calcResult.simpleSum)}%`;
      
      const firstStepText = `${calcResult.cleanDiscounts[0]}%引き`;
      const nextStepsText = calcResult.cleanDiscounts.slice(1).map(d => `${d}%引き`).join('、さらに');
      
      elMisconceptionText.innerHTML = `
        割引後の価格に対して次の割引が順番に適用されるため（${firstStepText} → ${nextStepsText}）、<br>
        実質的な割引率は <strong>${formatPercent(calcResult.effectiveRate)}% OFF</strong>（¥${formatCurrency(calcResult.savedAmount)} 引き）となります。
      `;
    } else {
      elMisconceptionCard.style.display = 'none';
    }

    // 5. Timeline Steps Render
    renderTimeline(calcResult);

    // 6. Save State
    saveState();
  };

  const renderTimeline = (calcResult) => {
    elTimelineContainer.innerHTML = '';

    calcResult.steps.forEach((step, idx) => {
      const isInitial = idx === 0;
      const isFinal = idx === calcResult.steps.length - 1;

      const stepEl = document.createElement('div');
      stepEl.className = `timeline-step ${isFinal ? 'final' : ''}`;
      stepEl.setAttribute('role', 'listitem');

      const dot = document.createElement('div');
      dot.className = 'timeline-dot';
      stepEl.appendChild(dot);

      const content = document.createElement('div');
      content.className = 'timeline-step-content';

      const header = document.createElement('div');
      header.className = 'timeline-step-header';

      const title = document.createElement('span');
      title.className = 'timeline-step-title';
      title.textContent = isInitial ? '① 元価格' : `ステップ ${idx}: ${step.title}`;
      header.appendChild(title);

      const price = document.createElement('span');
      price.className = 'timeline-step-price';
      const roundedStepPrice = applyRounding(step.priceAfter, state.rounding);
      price.textContent = `¥${formatCurrency(roundedStepPrice)}`;
      header.appendChild(price);

      content.appendChild(header);

      if (!isInitial) {
        const meta = document.createElement('div');
        meta.className = 'timeline-step-meta';

        const mult = document.createElement('span');
        mult.className = 'timeline-multiplier';
        mult.textContent = `× ${step.multiplier.toFixed(2)}`;
        meta.appendChild(mult);

        const diff = document.createElement('span');
        diff.className = 'timeline-diff';
        const roundedDiff = applyRounding(step.discountAmount, state.rounding);
        diff.textContent = `-¥${formatCurrency(roundedDiff)}`;
        meta.appendChild(diff);

        content.appendChild(meta);
      }

      stepEl.appendChild(content);
      elTimelineContainer.appendChild(stepEl);
    });
  };

  const renderDiscountInputs = () => {
    elDiscountsContainer.innerHTML = '';

    state.discounts.forEach((discount, idx) => {
      const item = document.createElement('div');
      item.className = 'discount-item';
      item.setAttribute('role', 'listitem');

      // Item Header
      const header = document.createElement('div');
      header.className = 'discount-item-header';

      const label = document.createElement('span');
      label.className = 'step-indicator';
      label.innerHTML = `<span class="step-badge">${idx + 1}</span> 割引 ${idx + 1}`;
      header.appendChild(label);

      // Remove Button
      const btnRemove = document.createElement('button');
      btnRemove.type = 'button';
      btnRemove.className = 'btn-remove-discount';
      btnRemove.title = 'この割引を削除';
      btnRemove.disabled = state.discounts.length <= 1;
      btnRemove.innerHTML = `
        <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
      btnRemove.addEventListener('click', () => {
        if (state.discounts.length > 1) {
          state.discounts.splice(idx, 1);
          renderDiscountInputs();
          render();
        }
      });
      header.appendChild(btnRemove);
      item.appendChild(header);

      // Input Row
      const inputRow = document.createElement('div');
      inputRow.className = 'discount-input-row';

      const wrapper = document.createElement('div');
      wrapper.className = 'input-percent-wrapper';

      const input = document.createElement('input');
      input.type = 'number';
      input.className = 'form-input';
      input.min = '0';
      input.max = '100';
      input.step = '1';
      input.inputMode = 'numeric';
      input.value = discount;
      input.setAttribute('aria-label', `割引 ${idx + 1} のパーセンテージ`);

      input.addEventListener('input', (e) => {
        let val = Number(e.target.value);
        if (val < 0) val = 0;
        if (val > 100) val = 100;
        state.discounts[idx] = isNaN(val) ? 0 : val;
        render();
      });

      const symbol = document.createElement('span');
      symbol.className = 'percent-symbol';
      symbol.textContent = '% OFF';

      wrapper.appendChild(input);
      wrapper.appendChild(symbol);
      inputRow.appendChild(wrapper);
      item.appendChild(inputRow);

      // Preset Chips for this discount
      const chipsContainer = document.createElement('div');
      chipsContainer.className = 'discount-chips';

      PRESET_DISCOUNTS.forEach(preset => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = `chip-btn ${Number(discount) === preset.value ? 'active' : ''}`;
        chip.textContent = preset.label;
        chip.addEventListener('click', () => {
          state.discounts[idx] = preset.value;
          input.value = preset.value;
          renderDiscountInputs();
          render();
        });
        chipsContainer.appendChild(chip);
      });

      item.appendChild(chipsContainer);
      elDiscountsContainer.appendChild(item);
    });
  };

  // --- Toast Notification System ---
  const showToast = (message, duration = 2500) => {
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    // Use textContent for safety against XSS
    const msgSpan = document.createElement('span');
    msgSpan.textContent = message;
    
    const icon = document.createElement('div');
    icon.innerHTML = `
      <svg class="icon-sm" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
    `;

    toast.appendChild(icon);
    toast.appendChild(msgSpan);
    elToastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-out');
      toast.addEventListener('animationend', () => {
        toast.remove();
      });
    }, duration);
  };

  // --- Clipboard Copy ---
  const copyResultToClipboard = async () => {
    const calc = calculate();
    const discountsText = calc.cleanDiscounts.map((d, i) => `${i + 1}段階目: ${d}% OFF`).join('\n');
    
    const text = [
      '【割引率らくらく計算 結果】',
      `元価格: ¥${formatCurrency(calc.validPrice)}`,
      '適用割引:',
      discountsText,
      '------------------------',
      `最終支払額: ¥${formatCurrency(calc.finalPrice)}`,
      `実質割引率: ${formatPercent(calc.effectiveRate)}% OFF`,
      `お得額: ¥${formatCurrency(calc.savedAmount)} 引き`,
      '------------------------',
      '#割引率らくらく計算'
    ].join('\n');

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
      }
      showToast('📋 計算結果をクリップボードにコピーしました！');
    } catch (err) {
      showToast('コピーに失敗しました。');
    }
  };

  // --- Share URL ---
  const shareConditions = async () => {
    const url = new URL(window.location.href);
    url.searchParams.set('p', state.price);
    url.searchParams.set('d', state.discounts.join(','));
    url.searchParams.set('r', state.rounding);

    const shareUrl = url.toString();
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      }
      showToast('🔗 条件付きURLをコピーしました！');
    } catch (err) {
      showToast('URLのコピーに失敗しました。');
    }
  };

  // --- State Persistence ---
  const saveState = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      // Storage unavailable or disabled
    }
  };

  const loadState = () => {
    // 1. First check URL query parameters
    const params = new URLSearchParams(window.location.search);
    if (params.has('p') || params.has('d')) {
      const p = Number(params.get('p'));
      if (!isNaN(p) && p > 0) state.price = p;

      const d = params.get('d');
      if (d) {
        const arr = d.split(',').map(Number).filter(n => !isNaN(n) && n >= 0 && n <= 100);
        if (arr.length > 0) state.discounts = arr;
      }

      const r = params.get('r');
      if (['round', 'floor', 'ceil'].includes(r)) {
        state.rounding = r;
      }
      return;
    }

    // 2. Otherwise load from LocalStorage
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          if (parsed.price) state.price = Number(parsed.price);
          if (Array.isArray(parsed.discounts) && parsed.discounts.length > 0) {
            state.discounts = parsed.discounts.map(Number);
          }
          if (parsed.rounding) state.rounding = parsed.rounding;
        }
      }
    } catch (e) {
      state = getDefaultState();
    }
  };

  // --- Event Listeners Initialization ---
  const initEvents = () => {
    // Price Input
    elPrice.addEventListener('input', (e) => {
      const val = Number(e.target.value);
      state.price = isNaN(val) ? 0 : val;
      render();
    });

    // Price Quick Chips
    document.querySelectorAll('.price-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const p = Number(chip.dataset.price);
        state.price = p;
        elPrice.value = p;
        render();
      });
    });

    // Add Discount Button
    elBtnAddDiscount.addEventListener('click', () => {
      state.discounts.push(10); // default new discount to 10%
      renderDiscountInputs();
      render();
    });

    // Reset Button
    elBtnReset.addEventListener('click', () => {
      state = getDefaultState();
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {}
      elPrice.value = state.price;
      // Sync radio buttons
      elRoundingRadios.forEach(radio => {
        radio.checked = radio.value === state.rounding;
      });
      renderDiscountInputs();
      render();
      showToast('🔄 入力を初期状態にリセットしました');
    });

    // Rounding Radio Change
    elRoundingRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        if (e.target.checked) {
          state.rounding = e.target.value;
          render();
        }
      });
    });

    // Copy Button
    elBtnCopy.addEventListener('click', copyResultToClipboard);

    // Share Button
    elBtnShare.addEventListener('click', shareConditions);
  };

  // --- App Initialization ---
  const init = () => {
    loadState();
    
    // Sync UI with loaded state
    elPrice.value = state.price;
    elRoundingRadios.forEach(radio => {
      radio.checked = radio.value === state.rounding;
    });

    renderDiscountInputs();
    initEvents();
    render();
  };

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
