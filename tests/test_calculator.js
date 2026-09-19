/**
 * 割引率らくらく計算 - Unit Test Suite for Calculation Engine
 * Run with: node tests/test_calculator.js
 * (c) 2026 tk030. Released under the MIT License.
 */

const assert = require('assert');
const Calculator = require('../js/calculator.js');

let passedTests = 0;
let failedTests = 0;

const test = (title, fn) => {
  try {
    fn();
    console.log(`  ✅ PASS: ${title}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${title}`);
    console.error(`     Error: ${err.message}`);
    failedTests++;
  }
};

console.log('\n=== 割引率らくらく計算: 計算コア単体テスト実行 ===\n');

// 1. 基本仕様ケース
test('10,000円 -> 50%OFF -> 30%OFF ＝ 3,500円 / 65.0% OFF', () => {
  const res = Calculator.calculateDiscounts({ price: 10000, discounts: [50, 30] });
  assert.strictEqual(res.finalPrice, 3500);
  assert.strictEqual(res.savedAmount, 6500);
  assert.strictEqual(res.effectiveRate, 65);
  assert.strictEqual(res.simpleSum, 80);
});

// 2. 単一割引
test('10,000円 -> 20%OFF ＝ 8,000円 / 20.0% OFF', () => {
  const res = Calculator.calculateDiscounts({ price: 10000, discounts: [20] });
  assert.strictEqual(res.finalPrice, 8000);
  assert.strictEqual(res.savedAmount, 2000);
  assert.strictEqual(res.effectiveRate, 20);
});

// 3. 3段階割引
test('10,000円 -> 50% -> 20% -> 10% ＝ 3,600円 / 64.0% OFF', () => {
  const res = Calculator.calculateDiscounts({ price: 10000, discounts: [50, 20, 10] });
  assert.strictEqual(res.finalPrice, 3600);
  assert.strictEqual(res.savedAmount, 6400);
  assert.strictEqual(res.effectiveRate, 64);
});

// 4. 100%割引
test('10,000円 -> 100%OFF ＝ 0円 / 100.0% OFF', () => {
  const res = Calculator.calculateDiscounts({ price: 10000, discounts: [100] });
  assert.strictEqual(res.finalPrice, 0);
  assert.strictEqual(res.savedAmount, 10000);
  assert.strictEqual(res.effectiveRate, 100);
});

// 5. 100%後の追加割引（0円継続）
test('10,000円 -> 100% -> 50% ＝ 0円 / 100.0% OFF', () => {
  const res = Calculator.calculateDiscounts({ price: 10000, discounts: [100, 50] });
  assert.strictEqual(res.finalPrice, 0);
  assert.strictEqual(res.savedAmount, 10000);
  assert.strictEqual(res.effectiveRate, 100);
});

// 6. 端数丸め処理（四捨五入 / 切捨て / 切上げ）
test('1,980円 -> 30% -> 20% 端数処理', () => {
  // 1980 * 0.7 * 0.8 = 1108.8
  const resRound = Calculator.calculateDiscounts({ price: 1980, discounts: [30, 20], rounding: 'round' });
  const resFloor = Calculator.calculateDiscounts({ price: 1980, discounts: [30, 20], rounding: 'floor' });
  const resCeil = Calculator.calculateDiscounts({ price: 1980, discounts: [30, 20], rounding: 'ceil' });

  assert.strictEqual(resRound.finalPrice, 1109);
  assert.strictEqual(resFloor.finalPrice, 1108);
  assert.strictEqual(resCeil.finalPrice, 1109);
});

// 7. 異常系・境界値（価格0、負数、100%超クランプ、負数割引率クランプ、非数値）
test('異常系: 価格<=0 は 0円として安全に処理', () => {
  const resZero = Calculator.calculateDiscounts({ price: 0, discounts: [50] });
  const resNegative = Calculator.calculateDiscounts({ price: -5000, discounts: [50] });
  assert.strictEqual(resZero.finalPrice, 0);
  assert.strictEqual(resZero.effectiveRate, 0);
  assert.strictEqual(resNegative.finalPrice, 0);
});

test('異常系: 割引率のクランプ (120% -> 100%, -20% -> 0%)', () => {
  const resOver = Calculator.calculateDiscounts({ price: 10000, discounts: [120] });
  const resUnder = Calculator.calculateDiscounts({ price: 10000, discounts: [-20] });
  assert.strictEqual(resOver.finalPrice, 0);
  assert.strictEqual(resUnder.finalPrice, 10000);
});

test('異常系: 非数値入力の安全処理 (NaN -> 0)', () => {
  const resNaN = Calculator.calculateDiscounts({ price: 'abc', discounts: ['invalid'] });
  assert.strictEqual(resNaN.finalPrice, 0);
  assert.strictEqual(resNaN.cleanDiscounts[0], 0);
});

test('空の割引配列: 元価格がそのまま維持される', () => {
  const resEmpty = Calculator.calculateDiscounts({ price: 10000, discounts: [] });
  assert.strictEqual(resEmpty.finalPrice, 10000);
  assert.strictEqual(resEmpty.effectiveRate, 0);
  assert.strictEqual(resEmpty.steps.length, 1);
});

// 8. フォーマット関数のテスト
test('フォーマット関数: カンマ区切りおよびパーセント表示', () => {
  assert.strictEqual(Calculator.formatCurrency(1234567), '1,234,567');
  assert.strictEqual(Calculator.formatPercent(50), '50');
  assert.strictEqual(Calculator.formatPercent(65.5), '65.5');
});

console.log(`\n========================================`);
console.log(`結果: ${passedTests} 件成功 / ${failedTests} 件失敗`);
console.log(`========================================\n`);

if (failedTests > 0) {
  process.exit(1);
}
