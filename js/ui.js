/**
 * 割引率らくらく計算 - UI Components & DOM Renderer
 * Manages rendering, timeline generation, toast notifications, clipboard copy, and Web Share API.
 * (c) 2026 tk030. Released under the MIT License.
 */

((root) => {
  'use strict';

  /**
   * トースト通知の表示
   * @param {HTMLElement} container
   * @param {string} message
   * @param {number} [duration=2500]
   */
  const showToast = (container, message, duration = 2500) => {
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';

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
    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-out');
      toast.addEventListener('animationend', () => {
        toast.remove();
      });
    }, duration);
  };

  /**
   * タイムラインのレンダリング
   */
  const renderTimeline = (container, calcResult, rounding) => {
    if (!container) return;
    container.innerHTML = '';

    const { formatCurrency, applyRounding } = root.Calculator;

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
      title.textContent = isInitial ? '通常価格' : `ステップ ${idx}: ${step.title}`;
      header.appendChild(title);

      const price = document.createElement('span');
      price.className = 'timeline-step-price';
      const roundedStepPrice = applyRounding(step.priceAfter, rounding);
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
        const roundedDiff = applyRounding(step.discountAmount, rounding);
        diff.textContent = `-¥${formatCurrency(roundedDiff)}`;
        meta.appendChild(diff);

        content.appendChild(meta);
      }

      stepEl.appendChild(content);
      container.appendChild(stepEl);
    });
  };

  /**
   * 割引入力リストの動的レンダリング
   */
  const renderDiscountInputs = (container, state, onUpdate) => {
    if (!container) return;
    container.innerHTML = '';

    const { PRESET_DISCOUNTS } = root.CalculatorState;

    state.discounts.forEach((discount, idx) => {
      const item = document.createElement('div');
      item.className = 'discount-item';
      item.setAttribute('role', 'listitem');

      // ヘッダー
      const header = document.createElement('div');
      header.className = 'discount-item-header';

      const label = document.createElement('span');
      label.className = 'step-indicator';
      label.innerHTML = `<span class="step-badge">${idx + 1}</span> 割引 ${idx + 1}`;
      header.appendChild(label);

      // 削除ボタン
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
          renderDiscountInputs(container, state, onUpdate);
          onUpdate();
        }
      });
      header.appendChild(btnRemove);
      item.appendChild(header);

      // 入力行
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
        onUpdate();
      });

      const symbol = document.createElement('span');
      symbol.className = 'percent-symbol';
      symbol.textContent = '% OFF';

      wrapper.appendChild(input);
      wrapper.appendChild(symbol);
      inputRow.appendChild(wrapper);
      item.appendChild(inputRow);

      // クイックプリセットチップ
      const chipsContainer = document.createElement('div');
      chipsContainer.className = 'discount-chips';

      PRESET_DISCOUNTS.forEach((preset) => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = `chip-btn ${Number(discount) === preset.value ? 'active' : ''}`;
        chip.textContent = preset.label;
        chip.addEventListener('click', () => {
          state.discounts[idx] = preset.value;
          input.value = preset.value;
          renderDiscountInputs(container, state, onUpdate);
          onUpdate();
        });
        chipsContainer.appendChild(chip);
      });

      item.appendChild(chipsContainer);
      container.appendChild(item);
    });
  };

  /**
   * 計算結果のクリップボードコピー
   */
  const copyResultToClipboard = async (calcResult, toastContainer) => {
    const { formatCurrency, formatPercent } = root.Calculator;
    const discountsText = calcResult.cleanDiscounts
      .map((d, i) => `${i + 1}段階目: ${d}% OFF`)
      .join('\n');

    const text = [
      '【割引率らくらく計算 結果】',
      `元価格: ¥${formatCurrency(calcResult.validPrice)}`,
      '適用割引:',
      discountsText,
      '------------------------',
      `最終支払額: ¥${formatCurrency(calcResult.finalPrice)}`,
      `実質割引率: ${formatPercent(calcResult.effectiveRate)}% OFF`,
      `お得額: ¥${formatCurrency(calcResult.savedAmount)} 引き`,
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
      showToast(toastContainer, '📋 計算結果をクリップボードにコピーしました！');
    } catch (err) {
      showToast(toastContainer, 'コピーに失敗しました。');
    }
  };

  /**
   * 条件付きURLの共有（Web Share API 優先 + クリップボードフォールバック）
   */
  const shareConditions = async (state, toastContainer) => {
    const url = new URL(window.location.href);
    url.searchParams.set('p', state.price);
    url.searchParams.set('d', state.discounts.join(','));
    url.searchParams.set('r', state.rounding);

    const shareUrl = url.toString();

    // モバイル環境などで Web Share API が利用可能な場合は優先起動
    if (navigator.share) {
      try {
        await navigator.share({
          title: '割引率らくらく計算',
          text: `通常価格 ¥${state.price} に対する複数割引の計算結果です。`,
          url: shareUrl
        });
        return;
      } catch (err) {
        // ユーザーキャンセル時は何もしない
        if (err.name === 'AbortError') return;
      }
    }

    // Web Share API 非対応または失敗時はクリップボードコピー
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
      }
      showToast(toastContainer, '🔗 条件付きURLをコピーしました！');
    } catch (err) {
      showToast(toastContainer, 'URLのコピーに失敗しました。');
    }
  };

  root.CalculatorUI = {
    showToast,
    renderTimeline,
    renderDiscountInputs,
    copyResultToClipboard,
    shareConditions
  };
})(typeof window !== 'undefined' ? window : globalThis);
