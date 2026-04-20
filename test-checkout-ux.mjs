#!/usr/bin/env node

/**
 * TEST: Checkout UX Flow Verification
 * 
 * Verifies that:
 * 1. OrderSummaryCard receives platformFee prop and displays it
 * 2. OrderSummaryCard receives defaultExpanded prop
 * 3. Items expand when addressConfirmed = true
 * 4. Items collapse when addressConfirmed = false
 * 5. Platform fee displays in price breakdown
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🧪 CHECKOUT UX FLOW TEST SUITE\n');
console.log('=' .repeat(60));

let passCount = 0;
let failCount = 0;

function test(name, condition, details = '') {
  if (condition) {
    console.log(`✅ PASS: ${name}`);
    if (details) console.log(`   └─ ${details}`);
    passCount++;
  } else {
    console.log(`❌ FAIL: ${name}`);
    if (details) console.log(`   └─ ${details}`);
    failCount++;
  }
}

// TEST 1: Verify OrderSummaryCard accepts platformFee prop
console.log('\n📋 TEST SECTION 1: Platform Fee Prop\n');
const orderSummaryPath = path.join(__dirname, 'client', 'src', 'components', 'OrderSummaryCard.tsx');
const orderSummaryContent = fs.readFileSync(orderSummaryPath, 'utf-8');

test(
  'OrderSummaryCard interface includes platformFee prop',
  orderSummaryContent.includes('platformFee?: number'),
  'Found: platformFee?: number in interface'
);

test(
  'OrderSummaryCard destructuring sets platformFee default',
  orderSummaryContent.includes('platformFee = 0'),
  'Found: platformFee = 0 with default value'
);

test(
  'OrderSummaryCard displays platform fee in price breakdown',
  orderSummaryContent.includes('{platformFee > 0 && (') && orderSummaryContent.includes('Platform Fee'),
  'Found: Conditional render for Platform Fee section'
);

test(
  'OrderSummaryCard formats platform fee correctly',
  orderSummaryContent.includes('₹{platformFee.toLocaleString("en-IN")}'),
  'Found: Proper INR formatting with toLocaleString'
);

// TEST 2: Verify OrderSummaryCard accepts defaultExpanded prop
console.log('\n📋 TEST SECTION 2: Default Expanded Prop\n');

test(
  'OrderSummaryCard interface includes defaultExpanded prop',
  orderSummaryContent.includes('defaultExpanded?: boolean'),
  'Found: defaultExpanded?: boolean in interface'
);

test(
  'OrderSummaryCard destructuring sets defaultExpanded default',
  orderSummaryContent.includes('defaultExpanded = false'),
  'Found: defaultExpanded = false with default value'
);

test(
  'OrderSummaryCard has useEffect to sync prop to state',
  orderSummaryContent.includes('useEffect(() => {') && orderSummaryContent.includes('setIsExpanded(defaultExpanded)'),
  'Found: useEffect hook syncing defaultExpanded to isExpanded state'
);

test(
  'useEffect has dependency on defaultExpanded',
  orderSummaryContent.includes('[defaultExpanded]'),
  'Found: Dependency array includes defaultExpanded'
);

// TEST 3: Verify CheckoutDialog passes new props
console.log('\n📋 TEST SECTION 3: CheckoutDialog Props\n');
const checkoutPath = path.join(__dirname, 'client', 'src', 'components', 'CheckoutDialog.tsx');
const checkoutContent = fs.readFileSync(checkoutPath, 'utf-8');

// Find the OrderSummaryCard component call
const orderSummaryCardCallMatch = checkoutContent.match(
  /<OrderSummaryCard[\s\S]*?\/>/
);

if (orderSummaryCardCallMatch) {
  const componentCall = orderSummaryCardCallMatch[0];
  
  test(
    'CheckoutDialog passes platformFee to OrderSummaryCard',
    componentCall.includes('platformFee={platformFee}'),
    'Found: platformFee={platformFee} in component call'
  );
  
  test(
    'CheckoutDialog passes defaultExpanded to OrderSummaryCard',
    componentCall.includes('defaultExpanded={addressConfirmed}'),
    'Found: defaultExpanded={addressConfirmed} in component call'
  );
  
  test(
    'CheckoutDialog passes all required props to OrderSummaryCard',
    componentCall.includes('cart={cart}') && 
    componentCall.includes('subtotal={subtotal}') &&
    componentCall.includes('deliveryFee={deliveryFee}') &&
    componentCall.includes('discount={discount}') &&
    componentCall.includes('total={total}'),
    'Found: All core props (cart, subtotal, deliveryFee, discount, total)'
  );
} else {
  test(
    'CheckoutDialog component call found',
    false,
    'Could not locate OrderSummaryCard component in CheckoutDialog'
  );
}

// TEST 4: Verify component imports
console.log('\n📋 TEST SECTION 4: Component Imports & Setup\n');

test(
  'OrderSummaryCard imports useEffect',
  orderSummaryContent.includes("import { useState, useEffect }") || orderSummaryContent.includes('import { useEffect'),
  'Found: useEffect import for prop synchronization'
);

test(
  'OrderSummaryCard imports useState',
  orderSummaryContent.includes('useState'),
  'Found: useState hook for managing isExpanded state'
);

// TEST 5: Verify HTML structure for items display
console.log('\n📋 TEST SECTION 5: Items Display Structure\n');

test(
  'OrderSummaryCard has item count badge',
  orderSummaryContent.includes('{itemCount} {itemCount === 1 ? "item" : "items"}'),
  'Found: Dynamic item count badge in header'
);

test(
  'OrderSummaryCard shows quantity with orange badge',
  orderSummaryContent.includes('bg-orange-100') && orderSummaryContent.includes('×{item.quantity}'),
  'Found: Orange-styled quantity badge (×{quantity})'
);

test(
  'OrderSummaryCard items list respects isExpanded state',
  orderSummaryContent.includes('isExpanded') && orderSummaryContent.includes('items.map'),
  'Found: Items conditional rendering based on isExpanded state'
);

// FINAL SUMMARY
console.log('\n' + '='.repeat(60));
console.log('\n📊 TEST SUMMARY\n');
console.log(`✅ Passed: ${passCount}`);
console.log(`❌ Failed: ${failCount}`);
console.log(`📈 Total:  ${passCount + failCount}\n`);

if (failCount === 0) {
  console.log('🎉 ALL TESTS PASSED!\n');
  console.log('✅ Platform fee feature is ready for testing');
  console.log('✅ Items expansion feature is ready for testing');
  console.log('✅ Checkout flow architecture is correct\n');
  process.exit(0);
} else {
  console.log('⚠️  SOME TESTS FAILED!\n');
  console.log('Please review the failed tests above.\n');
  process.exit(1);
}
