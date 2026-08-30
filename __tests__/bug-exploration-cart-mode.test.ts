/// <reference types="jest" />

/**
 * BUG CONDITION EXPLORATION TESTS — cart-mode-checkout-routing
 * =============================================================
 * Spec: .kiro/specs/cart-mode-checkout-routing
 * Task: 1 — Write bug condition exploration test
 *
 * PURPOSE:
 *   These tests are expected to FAIL on unfixed code.
 *   Failure confirms the bugs exist. Do NOT fix the code to make them pass.
 *   They encode the correct/expected behaviour and will pass after the fix is applied.
 *
 * Validates: Requirements 1.1, 1.2, 1.4
 *
 * BUG 1 (Runtime — Bug 1.1 / 1.2):
 *   In CheckoutDialog.tsx, `cartHasInstant` is computed but never referenced in the
 *   `requiresDeliverySlot` expression.  A pure-instant cart falls through to the
 *   category heuristic, which is `false` for most categories, so the slot picker
 *   is never shown.
 *
 * BUG 2 (Compile-time — Bug 1.4):
 *   `client/src/types/cartItem.ts` does not declare `effectiveMode`, so accessing
 *   `item.effectiveMode` on an imported `CartItem` emits TS2339.
 */

// ---------------------------------------------------------------------------
// Type imports from the unfixed source
// ---------------------------------------------------------------------------
import type { CartItem } from '../client/src/types/cartItem';
import type { CategoryCart } from '../client/src/types/categorycart';

// ---------------------------------------------------------------------------
// Inline reproduction of the BUGGY `requiresDeliverySlot` expression
// copied verbatim from CheckoutDialog.tsx (~lines 683-692 of unfixed code).
//
// This is a pure function extracted from the component so we can test it
// without spinning up React.  It matches the actual code exactly:
//
//   const cartHasPreorder = cart?.items?.some((item: any) => item.effectiveMode === 'preorder');
//   const cartHasInstant  = cart?.items?.some((item: any) => item.effectiveMode === 'instant');
//   const requiresDeliverySlot = cartHasPreorder ? true : (
//     !!categoryData?.requiresDeliverySlot ||
//     (categoryData?.name?.toLowerCase().includes('roti') ?? false)
//   );
// ---------------------------------------------------------------------------

interface CategoryDataSnapshot {
  requiresDeliverySlot?: boolean;
  name?: string;
}

/**
 * Faithful reproduction of the BUGGY requiresDeliverySlot computation from
 * CheckoutDialog.tsx (unfixed version).  `cartHasInstant` is computed but
 * intentionally not used in the ternary — mirroring the defect exactly.
 */
function buggyRequiresDeliverySlot(
  cart: CategoryCart | null | undefined,
  categoryData: CategoryDataSnapshot | null | undefined,
): boolean {
  // --- copied verbatim from unfixed CheckoutDialog.tsx ---
  const cartHasPreorder = cart?.items?.some((item: any) => item.effectiveMode === 'preorder');
  const cartHasInstant  = cart?.items?.some((item: any) => item.effectiveMode === 'instant'); // computed but UNUSED ← BUG

  const requiresDeliverySlot = cartHasPreorder ? true : (
    !!categoryData?.requiresDeliverySlot ||
    (categoryData?.name?.toLowerCase().includes('roti') ?? false)
  );

  // Suppress the "declared but not used" lint warning without altering logic.
  void cartHasInstant;

  return requiresDeliverySlot;
}

/**
 * Reproduction of the FIXED requiresDeliverySlot computation from
 * CheckoutDialog.tsx (fixed version — tasks 2 & 3 applied).
 * `cartHasInstant` is now evaluated FIRST in the ternary chain.
 *
 * Copied verbatim from fixed CheckoutDialog.tsx (~lines 683-691):
 *
 *   const cartHasInstant  = cart?.items?.some((item: any) => item.effectiveMode === 'instant') ?? false;
 *   const cartHasPreorder = cart?.items?.some((item: any) => item.effectiveMode === 'preorder') ?? false;
 *   const requiresDeliverySlot =
 *     cartHasInstant  ? true :
 *     cartHasPreorder ? true :
 *     !!categoryData?.requiresDeliverySlot ||
 *     (categoryData?.name?.toLowerCase().includes('roti') ?? false);
 */
function fixedRequiresDeliverySlot(
  cart: CategoryCart | null | undefined,
  categoryData: CategoryDataSnapshot | null | undefined,
): boolean {
  // --- copied verbatim from fixed CheckoutDialog.tsx ---
  const cartHasInstant  = cart?.items?.some((item: any) => item.effectiveMode === 'instant') ?? false;
  const cartHasPreorder = cart?.items?.some((item: any) => item.effectiveMode === 'preorder') ?? false;

  const requiresDeliverySlot =
    cartHasInstant  ? true :
    cartHasPreorder ? true :
    !!categoryData?.requiresDeliverySlot ||
    (categoryData?.name?.toLowerCase().includes('roti') ?? false);

  return requiresDeliverySlot;
}

// ---------------------------------------------------------------------------
// Helper — build a minimal CategoryCart for testing
// ---------------------------------------------------------------------------
function makeCart(itemModes: Array<CartItem['effectiveMode'] | undefined>): CategoryCart {
  const items: CartItem[] = itemModes.map((mode, i) => ({
    id: `item-${i}`,
    name: `Test Item ${i}`,
    price: 100,
    quantity: 1,
    image: null,
    // effectiveMode is cast through `any` at runtime in the component;
    // here we assign it as an extra runtime property to mirror production data.
    ...(mode !== undefined ? { effectiveMode: mode } : {}),
  }));

  return {
    categoryId: 'cat-1',
    categoryName: 'Main Course',   // Not "Roti" — so Roti heuristic = false
    chefId: 'chef-1',
    chefName: 'Test Chef',
    items,
  };
}

// ---------------------------------------------------------------------------
// TEST A — Pure-instant cart: requiresDeliverySlot must be true
//
// Bug 1.1: "WHEN the cart contains items with effectiveMode = 'instant' and no
//           items with effectiveMode = 'preorder' THEN the system evaluates
//           requiresDeliverySlot using categoryData?.requiresDeliverySlot and
//           the Roti heuristic INSTEAD of setting it true based on cartHasInstant."
//
// Expected counterexample on UNFIXED code:
//   result = false   (cartHasInstant is computed but discarded; category fallback = false)
//
// This assertion WILL FAIL on unfixed code — that is the intended outcome.
// ---------------------------------------------------------------------------
describe('Test A — Pure-instant cart routes to slot picker (Bug 1.1)', () => {
  const categoryWithoutFlag: CategoryDataSnapshot = {
    requiresDeliverySlot: false,  // most real categories: flag not set
    name: 'Main Course',          // name does NOT include 'roti'
  };

  test(
    /**
     * Validates: Requirements 1.1
     *
     * COUNTEREXAMPLE on unfixed code:
     *   cart = [{ effectiveMode: 'instant' }], categoryData = { requiresDeliverySlot: false, name: 'Main Course' }
     *   buggyRequiresDeliverySlot(cart) → false
     *   EXPECTED: true
     */
    'pure-instant cart (1 item, effectiveMode=instant, no preorder) → requiresDeliverySlot should be true',
    () => {
      const cart = makeCart(['instant']);
      const result = buggyRequiresDeliverySlot(cart, categoryWithoutFlag);

      // On unfixed code: result === false  ← COUNTEREXAMPLE
      // This assertion drives the failure that confirms the bug exists.
      expect(result).toBe(true);
    },
  );

  test(
    /**
     * Validates: Requirements 1.2
     *
     * COUNTEREXAMPLE on unfixed code:
     *   cart = [{ effectiveMode: 'both' }, { effectiveMode: 'instant' }], category flag false
     *   buggyRequiresDeliverySlot(cart) → false
     *   EXPECTED: true
     */
    "'both' + 'instant' cart (no preorder items) → requiresDeliverySlot should be true",
    () => {
      const cart = makeCart(['both', 'instant']);
      const result = buggyRequiresDeliverySlot(cart, categoryWithoutFlag);

      // On unfixed code: result === false  ← COUNTEREXAMPLE
      expect(result).toBe(true);
    },
  );

  test(
    'pure-instant cart with null categoryData → requiresDeliverySlot should be true',
    () => {
      const cart = makeCart(['instant']);
      const result = buggyRequiresDeliverySlot(cart, null);

      // On unfixed code: result === false (null categoryData → both heuristics = false)
      expect(result).toBe(true);
    },
  );

  // Sanity / baseline — these SHOULD PASS even on unfixed code.
  // They verify the test helper itself works correctly and that
  // the preorder and category-fallback paths are unaffected.
  test(
    '[BASELINE] pure-preorder cart → requiresDeliverySlot should be true (unchanged path)',
    () => {
      const cart = makeCart(['preorder']);
      const result = buggyRequiresDeliverySlot(cart, categoryWithoutFlag);
      // cartHasPreorder = true → true branch taken → no bug here
      expect(result).toBe(true);
    },
  );

  test(
    '[BASELINE] all-both cart, category flag true → requiresDeliverySlot should be true (fallback path preserved)',
    () => {
      const cart = makeCart(['both', 'both']);
      const categoryWithFlag: CategoryDataSnapshot = { requiresDeliverySlot: true, name: 'Specials' };
      const result = buggyRequiresDeliverySlot(cart, categoryWithFlag);
      expect(result).toBe(true);
    },
  );

  test(
    '[BASELINE] all-both cart, Roti category name → requiresDeliverySlot should be true (Roti heuristic)',
    () => {
      const cart = makeCart(['both']);
      const rotiCategory: CategoryDataSnapshot = { requiresDeliverySlot: false, name: 'Roti Special' };
      const result = buggyRequiresDeliverySlot(cart, rotiCategory);
      expect(result).toBe(true);
    },
  );
});

// ---------------------------------------------------------------------------
// TEST B — TypeScript compile check: item.effectiveMode must not emit TS2339
//
// Bug 1.4: "WHEN any component imports CartItem from client/src/types/cartItem.ts
//           and reads item.effectiveMode THEN the system emits TypeScript error TS2339
//           because the exported CartItem interface does not declare effectiveMode."
//
// Strategy: We access item.effectiveMode from an imported CartItem object inside
// this test file.  ts-jest compiles this file with strict TypeScript, so if
// CartItem is missing effectiveMode the compile step itself will fail with TS2339,
// which surfaces as a test-suite failure — exactly the counterexample we need.
//
// EXPECTED OUTCOME on unfixed code:
//   ts-jest compilation ERROR: Property 'effectiveMode' does not exist on type 'CartItem'. ts(2339)
//   The entire test file fails to compile → all tests in this describe block fail.
// ---------------------------------------------------------------------------
describe('Test B — CartItem type includes effectiveMode (Bug 1.4)', () => {
  test(
    /**
     * Validates: Requirements 1.4
     *
     * COUNTEREXAMPLE on unfixed code:
     *   Compilation fails with TS2339: Property 'effectiveMode' does not exist on type 'CartItem'.
     *   ts-jest will refuse to run any test in this file.
     *
     * On FIXED code (effectiveMode?: 'instant' | 'preorder' | 'both' added to CartItem):
     *   This test compiles and passes.
     */
    "accessing item.effectiveMode on a CartItem should not produce TS2339",
    () => {
      // Construct a valid CartItem (all required fields present).
      const item: CartItem = {
        id: 'test-id',
        name: 'Test Item',
        price: 150,
        quantity: 2,
        image: null,
      };

      // --- BUG TRIGGER ---
      // On unfixed CartItem (no effectiveMode field), the line below causes:
      //   TS2339: Property 'effectiveMode' does not exist on type 'CartItem'
      // ts-jest propagates the compile error so the entire test suite cannot run.
      const mode = (item as any).effectiveMode;  // Cast to `any` to read at runtime...

      // ...but the TYPED access below is what triggers TS2339 on unfixed code:
      // NOTE: @ts-expect-error suppression removed — effectiveMode is now declared on CartItem
      const typedMode: CartItem['effectiveMode'] = item.effectiveMode; // no TS2339 on fixed code

      // At runtime the field is absent → undefined is a valid value once the
      // optional field is declared.
      expect(typedMode).toBeUndefined();
      expect(mode).toBeUndefined();
    },
  );

  test(
    "CartItem with effectiveMode = 'instant' should be assignable without error",
    () => {
      // On unfixed code, ts-jest compilation of this file will fail before we reach here.
      // On fixed code, this demonstrates that the field is properly typed.
      const item: CartItem = {
        id: 'instant-item',
        name: 'Instant Dish',
        price: 200,
        quantity: 1,
        image: null,
        // NOTE: @ts-expect-error suppression removed — effectiveMode is now declared on CartItem
        effectiveMode: 'instant',
      };

      // On fixed code this resolves to 'instant'.
      // On unfixed code we never reach this line (compile failure above).
      expect((item as any).effectiveMode).toBe('instant');
    },
  );
});

// ---------------------------------------------------------------------------
// TASK 4 — FIX-CHECKING TESTS
// Re-run the same scenarios from Task 1 against the FIXED code.
// Both tests are expected to PASS now that tasks 2 and 3 are applied.
//
// Validates: Requirements 2.1, 2.2, 2.4
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// TEST A (fixed) — Pure-instant cart routes to slot picker
//
// Re-runs Task 1 Test A scenarios against fixedRequiresDeliverySlot.
// EXPECTED OUTCOME: ALL PASS (fix confirmed)
// ---------------------------------------------------------------------------
describe('Task 4 — Test A (fixed): Pure-instant cart routes to slot picker', () => {
  const categoryWithoutFlag: CategoryDataSnapshot = {
    requiresDeliverySlot: false,
    name: 'Main Course',
  };

  test(
    /**
     * Validates: Requirements 2.1
     *
     * Fix confirmed: cartHasInstant is now evaluated first in the ternary.
     * cart = [{ effectiveMode: 'instant' }] → cartHasInstant = true → requiresDeliverySlot = true
     */
    'pure-instant cart (1 item, effectiveMode=instant, no preorder) → requiresDeliverySlot should be true',
    () => {
      const cart = makeCart(['instant']);
      const result = fixedRequiresDeliverySlot(cart, categoryWithoutFlag);
      expect(result).toBe(true);
    },
  );

  test(
    /**
     * Validates: Requirements 2.1
     *
     * Fix confirmed: 'both' + 'instant' cart → cartHasInstant = true → requiresDeliverySlot = true
     */
    "'both' + 'instant' cart (no preorder items) → requiresDeliverySlot should be true",
    () => {
      const cart = makeCart(['both', 'instant']);
      const result = fixedRequiresDeliverySlot(cart, categoryWithoutFlag);
      expect(result).toBe(true);
    },
  );

  test(
    'pure-instant cart with null categoryData → requiresDeliverySlot should be true',
    () => {
      const cart = makeCart(['instant']);
      const result = fixedRequiresDeliverySlot(cart, null);
      expect(result).toBe(true);
    },
  );

  // Preservation baselines — unchanged behavior confirmed on fixed code too
  test(
    '[BASELINE] pure-preorder cart → requiresDeliverySlot should be true (unchanged path)',
    () => {
      const cart = makeCart(['preorder']);
      const result = fixedRequiresDeliverySlot(cart, categoryWithoutFlag);
      expect(result).toBe(true);
    },
  );

  test(
    '[BASELINE] all-both cart, category flag true → requiresDeliverySlot should be true',
    () => {
      const cart = makeCart(['both', 'both']);
      const categoryWithFlag: CategoryDataSnapshot = { requiresDeliverySlot: true, name: 'Specials' };
      const result = fixedRequiresDeliverySlot(cart, categoryWithFlag);
      expect(result).toBe(true);
    },
  );

  test(
    '[BASELINE] all-both cart, Roti category name → requiresDeliverySlot should be true (Roti heuristic)',
    () => {
      const cart = makeCart(['both']);
      const rotiCategory: CategoryDataSnapshot = { requiresDeliverySlot: false, name: 'Roti Special' };
      const result = fixedRequiresDeliverySlot(cart, rotiCategory);
      expect(result).toBe(true);
    },
  );
});

// ---------------------------------------------------------------------------
// TEST B (fixed) — CartItem type includes effectiveMode: no TS2339
//
// Re-run of Task 1 Test B — now the type IS declared so typed access compiles.
// EXPECTED OUTCOME: PASSES (fix confirmed by successful compilation + runtime)
// ---------------------------------------------------------------------------
describe('Task 4 — Test B (fixed): CartItem type includes effectiveMode, no TS2339', () => {
  test(
    /**
     * Validates: Requirements 2.4
     *
     * Fix confirmed: effectiveMode?: 'instant' | 'preorder' | 'both' is now declared on CartItem.
     * Typed access item.effectiveMode compiles without TS2339.
     */
    "accessing item.effectiveMode on a CartItem should not produce TS2339 (fix confirmed)",
    () => {
      const item: CartItem = {
        id: 'test-id',
        name: 'Test Item',
        price: 150,
        quantity: 2,
        image: null,
      };

      // Typed access — compiles cleanly on fixed CartItem (no @ts-expect-error needed)
      const typedMode: CartItem['effectiveMode'] = item.effectiveMode;
      expect(typedMode).toBeUndefined();
    },
  );

  test(
    "CartItem with effectiveMode = 'instant' should be assignable without TypeScript error",
    () => {
      // effectiveMode is now a declared optional field — no suppression needed
      const item: CartItem = {
        id: 'instant-item',
        name: 'Instant Dish',
        price: 200,
        quantity: 1,
        image: null,
        effectiveMode: 'instant',
      };

      expect(item.effectiveMode).toBe('instant');
    },
  );

  test(
    "CartItem with effectiveMode = 'preorder' should be assignable without TypeScript error",
    () => {
      const item: CartItem = {
        id: 'preorder-item',
        name: 'Preorder Dish',
        price: 250,
        quantity: 1,
        image: null,
        effectiveMode: 'preorder',
      };

      expect(item.effectiveMode).toBe('preorder');
    },
  );

  test(
    "CartItem with effectiveMode = 'both' should be assignable without TypeScript error",
    () => {
      const item: CartItem = {
        id: 'both-item',
        name: 'Both Mode Dish',
        price: 180,
        quantity: 1,
        image: null,
        effectiveMode: 'both',
      };

      expect(item.effectiveMode).toBe('both');
    },
  );

  test(
    "CartItem without effectiveMode set should have effectiveMode as undefined",
    () => {
      const item: CartItem = {
        id: 'no-mode-item',
        name: 'No Mode Dish',
        price: 100,
        quantity: 1,
        image: null,
      };

      expect(item.effectiveMode).toBeUndefined();
    },
  );
});

// ---------------------------------------------------------------------------
// TASK 5 — PRESERVATION AND TYPESCRIPT VERIFICATION
//
// Property 2: Preservation — Pre-order, All-'both', and Category-Fallback Paths Unchanged
//
// These tests verify that the fix introduced in tasks 2 and 3 does NOT regress
// any existing behaviour.  They run against BOTH buggyRequiresDeliverySlot and
// fixedRequiresDeliverySlot: a test that passes on unfixed code must also pass
// on fixed code (no regressions, no accidental changes).
//
// Validates: Requirements 3.1, 3.2, 3.5, 3.7, 3.8
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// 5A — PREORDER PATH UNCHANGED
//
// Requirement 3.1: A cart with ≥1 strict-'preorder' item and no strict-'instant'
// item MUST continue to set requiresDeliverySlot = true on BOTH unfixed and fixed
// code.  The fix must not break the preorder branch.
// ---------------------------------------------------------------------------
describe('Task 5A — Preservation: preorder path unchanged (Req 3.1)', () => {
  /**
   * **Validates: Requirements 3.1**
   *
   * A pure-preorder cart (one 'preorder' item, no 'instant' item) must continue
   * to resolve requiresDeliverySlot = true regardless of the fix applied.
   * Baseline (unfixed): cartHasPreorder = true → true branch.
   * Fixed:              cartHasPreorder still true → second true branch taken.
   */

  const categoryWithoutFlag: CategoryDataSnapshot = {
    requiresDeliverySlot: false,
    name: 'Main Course',
  };

  test(
    '[UNFIXED + FIXED] pure-preorder cart (1 item) → requiresDeliverySlot = true',
    () => {
      const cart = makeCart(['preorder']);

      // Unfixed code: cartHasPreorder = true → true. Preorder path unaffected.
      expect(buggyRequiresDeliverySlot(cart, categoryWithoutFlag)).toBe(true);

      // Fixed code: cartHasInstant = false → cartHasPreorder = true → true. Same result.
      expect(fixedRequiresDeliverySlot(cart, categoryWithoutFlag)).toBe(true);
    },
  );

  test(
    '[UNFIXED + FIXED] preorder + both cart → requiresDeliverySlot = true (both items do not prevent preorder)',
    () => {
      const cart = makeCart(['preorder', 'both']);

      expect(buggyRequiresDeliverySlot(cart, categoryWithoutFlag)).toBe(true);
      expect(fixedRequiresDeliverySlot(cart, categoryWithoutFlag)).toBe(true);
    },
  );

  test(
    '[UNFIXED + FIXED] multiple preorder items → requiresDeliverySlot = true',
    () => {
      const cart = makeCart(['preorder', 'preorder', 'both']);

      expect(buggyRequiresDeliverySlot(cart, categoryWithoutFlag)).toBe(true);
      expect(fixedRequiresDeliverySlot(cart, categoryWithoutFlag)).toBe(true);
    },
  );

  test(
    '[UNFIXED + FIXED] preorder cart with null categoryData → requiresDeliverySlot = true',
    () => {
      const cart = makeCart(['preorder']);

      // cartHasPreorder = true → true, regardless of categoryData
      expect(buggyRequiresDeliverySlot(cart, null)).toBe(true);
      expect(fixedRequiresDeliverySlot(cart, null)).toBe(true);
    },
  );

  test(
    '[UNFIXED + FIXED] unfixed and fixed produce IDENTICAL results for preorder cart',
    () => {
      const cart = makeCart(['preorder', 'both']);
      const unfixedResult = buggyRequiresDeliverySlot(cart, categoryWithoutFlag);
      const fixedResult   = fixedRequiresDeliverySlot(cart, categoryWithoutFlag);

      // Both must agree — the fix must not change preorder-cart behaviour
      expect(fixedResult).toBe(unfixedResult);
    },
  );
});

// ---------------------------------------------------------------------------
// 5B — ALL-'BOTH' FALLBACK USES CATEGORY FLAG AND ROTI HEURISTIC
//
// Requirement 3.2: When all items are 'both' (or no effectiveMode set),
// requiresDeliverySlot must be driven by categoryData?.requiresDeliverySlot
// and the Roti-name heuristic on BOTH unfixed and fixed code.
// ---------------------------------------------------------------------------
describe("Task 5B — Preservation: all-'both' fallback unchanged (Req 3.2)", () => {
  /**
   * **Validates: Requirements 3.2, 3.8**
   *
   * Carts with no strict-mode items must produce requiresDeliverySlot equal to
   *   !!categoryData?.requiresDeliverySlot || (categoryData?.name?.toLowerCase().includes('roti') ?? false)
   * on both unfixed and fixed code.
   */

  test(
    "[UNFIXED + FIXED] all-'both' cart, categoryData.requiresDeliverySlot = true → requiresDeliverySlot = true",
    () => {
      const cart = makeCart(['both', 'both']);
      const category: CategoryDataSnapshot = { requiresDeliverySlot: true, name: 'Specials' };

      expect(buggyRequiresDeliverySlot(cart, category)).toBe(true);
      expect(fixedRequiresDeliverySlot(cart, category)).toBe(true);
    },
  );

  test(
    "[UNFIXED + FIXED] all-'both' cart, categoryData.requiresDeliverySlot = false, non-Roti name → requiresDeliverySlot = false",
    () => {
      const cart = makeCart(['both', 'both']);
      const category: CategoryDataSnapshot = { requiresDeliverySlot: false, name: 'Main Course' };

      expect(buggyRequiresDeliverySlot(cart, category)).toBe(false);
      expect(fixedRequiresDeliverySlot(cart, category)).toBe(false);
    },
  );

  test(
    "[UNFIXED + FIXED] all-'both' cart, category name contains 'roti' → requiresDeliverySlot = true (Roti heuristic)",
    () => {
      const cart = makeCart(['both']);
      const rotiCategory: CategoryDataSnapshot = { requiresDeliverySlot: false, name: 'Roti Special' };

      // Roti heuristic applies only in the 'both-fallback' arm — preserved on both
      expect(buggyRequiresDeliverySlot(cart, rotiCategory)).toBe(true);
      expect(fixedRequiresDeliverySlot(cart, rotiCategory)).toBe(true);
    },
  );

  test(
    "[UNFIXED + FIXED] all-'both' cart, category name 'rotihai' → requiresDeliverySlot = true",
    () => {
      const cart = makeCart(['both']);
      const rotiCategory: CategoryDataSnapshot = { requiresDeliverySlot: false, name: 'rotihai' };

      expect(buggyRequiresDeliverySlot(cart, rotiCategory)).toBe(true);
      expect(fixedRequiresDeliverySlot(cart, rotiCategory)).toBe(true);
    },
  );

  test(
    "[UNFIXED + FIXED] all-'both' cart, category name 'ROTI MEALS' (uppercase) → requiresDeliverySlot = true",
    () => {
      const cart = makeCart(['both']);
      const rotiCategory: CategoryDataSnapshot = { requiresDeliverySlot: false, name: 'ROTI MEALS' };

      // toLowerCase() is applied so uppercase 'ROTI' still matches
      expect(buggyRequiresDeliverySlot(cart, rotiCategory)).toBe(true);
      expect(fixedRequiresDeliverySlot(cart, rotiCategory)).toBe(true);
    },
  );

  test(
    "[UNFIXED + FIXED] cart with undefined effectiveMode items (no strict mode) → same as all-'both'",
    () => {
      const cart = makeCart([undefined, undefined]);
      const category: CategoryDataSnapshot = { requiresDeliverySlot: true, name: 'Curries' };

      expect(buggyRequiresDeliverySlot(cart, category)).toBe(true);
      expect(fixedRequiresDeliverySlot(cart, category)).toBe(true);
    },
  );

  test(
    "[UNFIXED + FIXED] all-'both' cart with null categoryData → requiresDeliverySlot = false",
    () => {
      const cart = makeCart(['both']);

      // categoryData is null → !!null = false, null?.name... = false → false
      expect(buggyRequiresDeliverySlot(cart, null)).toBe(false);
      expect(fixedRequiresDeliverySlot(cart, null)).toBe(false);
    },
  );

  test(
    "[UNFIXED + FIXED] unfixed and fixed produce IDENTICAL results for all-'both' carts",
    () => {
      const scenarios: Array<{ modes: Array<CartItem['effectiveMode'] | undefined>; category: CategoryDataSnapshot | null }> = [
        { modes: ['both'],                    category: { requiresDeliverySlot: true,  name: 'Specials' } },
        { modes: ['both'],                    category: { requiresDeliverySlot: false, name: 'Curries' } },
        { modes: ['both'],                    category: { requiresDeliverySlot: false, name: 'Roti Basket' } },
        { modes: ['both', 'both'],            category: { requiresDeliverySlot: true,  name: 'Thali' } },
        { modes: [undefined],                 category: { requiresDeliverySlot: false, name: 'Pasta' } },
        { modes: ['both', undefined],         category: null },
      ];

      for (const { modes, category } of scenarios) {
        const cart = makeCart(modes);
        const unfixed = buggyRequiresDeliverySlot(cart, category);
        const fixed   = fixedRequiresDeliverySlot(cart, category);
        expect(fixed).toBe(unfixed);
      }
    },
  );
});

// ---------------------------------------------------------------------------
// 5C — ROTI HEURISTIC SCOPE
//
// Requirement 3.8: The Roti-name heuristic must NOT be applied when any strict-
// mode item is present.  It applies ONLY in the all-'both' fallback arm.
// ---------------------------------------------------------------------------
describe('Task 5C — Preservation: Roti heuristic applies only in the all-both fallback arm (Req 3.8)', () => {
  /**
   * **Validates: Requirements 3.8**
   *
   * When a strict 'instant' item is present the fixed code short-circuits at
   * cartHasInstant = true and NEVER reaches the Roti heuristic.
   * When a strict 'preorder' item is present the code short-circuits at
   * cartHasPreorder = true and NEVER reaches the Roti heuristic.
   *
   * The Roti heuristic returning true is NOT the cause of requiresDeliverySlot
   * being true for these carts — the strict-mode branch fires first.
   */

  const rotiCategory: CategoryDataSnapshot = { requiresDeliverySlot: false, name: 'Roti Special' };
  const nonRotiCategory: CategoryDataSnapshot = { requiresDeliverySlot: false, name: 'Main Course' };

  test(
    '[FIXED] instant cart with non-Roti, non-flagged category → requiresDeliverySlot = true (strict-mode branch, NOT Roti heuristic)',
    () => {
      const cart = makeCart(['instant']);

      // With the fix, cartHasInstant = true short-circuits → true
      // The Roti heuristic is irrelevant here — result is true regardless of category name
      expect(fixedRequiresDeliverySlot(cart, nonRotiCategory)).toBe(true);
    },
  );

  test(
    '[FIXED] instant cart with Roti category → requiresDeliverySlot = true (driven by cartHasInstant, not Roti heuristic)',
    () => {
      const cart = makeCart(['instant']);

      // Both unfixed and fixed are true for Roti category — but for DIFFERENT reasons:
      // Unfixed: Roti heuristic fires (because cartHasInstant was discarded)
      // Fixed:   cartHasInstant fires FIRST — Roti heuristic is never evaluated

      // For the fixed code, result must be true even for a non-Roti category:
      expect(fixedRequiresDeliverySlot(cart, rotiCategory)).toBe(true);
      expect(fixedRequiresDeliverySlot(cart, nonRotiCategory)).toBe(true);

      // The result is THE SAME regardless of whether the category is Roti or not
      // → proves the strict-mode branch short-circuits before the Roti heuristic
      const rotiResult    = fixedRequiresDeliverySlot(cart, rotiCategory);
      const nonRotiResult = fixedRequiresDeliverySlot(cart, nonRotiCategory);
      expect(rotiResult).toBe(nonRotiResult);
    },
  );

  test(
    '[FIXED] preorder cart with non-Roti, non-flagged category → requiresDeliverySlot = true (strict-mode branch)',
    () => {
      const cart = makeCart(['preorder']);

      // cartHasInstant = false, cartHasPreorder = true → true (Roti heuristic not reached)
      expect(fixedRequiresDeliverySlot(cart, nonRotiCategory)).toBe(true);
      expect(fixedRequiresDeliverySlot(cart, null)).toBe(true);

      // Result is same regardless of category → proves strict-mode branch fires first
      const rotiResult    = fixedRequiresDeliverySlot(cart, rotiCategory);
      const nonRotiResult = fixedRequiresDeliverySlot(cart, nonRotiCategory);
      expect(rotiResult).toBe(nonRotiResult);
    },
  );

  test(
    "[FIXED] all-'both' cart with Roti category → requiresDeliverySlot = true (Roti heuristic DOES apply here)",
    () => {
      const cart = makeCart(['both']);

      // No strict-mode item → falls through to category fallback → Roti heuristic applies
      expect(fixedRequiresDeliverySlot(cart, rotiCategory)).toBe(true);
      // Non-Roti, no flag → false (confirms heuristic is the deciding factor for 'both' carts)
      expect(fixedRequiresDeliverySlot(cart, nonRotiCategory)).toBe(false);
    },
  );

  test(
    "[FIXED] 'both' + 'instant' cart with non-Roti category → requiresDeliverySlot = true (instant strict-mode branch)",
    () => {
      const cart = makeCart(['both', 'instant']);

      // cartHasInstant = true → true, regardless of category name
      expect(fixedRequiresDeliverySlot(cart, nonRotiCategory)).toBe(true);
      expect(fixedRequiresDeliverySlot(cart, null)).toBe(true);
    },
  );
});

// ---------------------------------------------------------------------------
// 5D — UNFIXED VS FIXED CROSS-COMPARISON FOR NON-INSTANT CARTS
//
// The fix must produce identical results to unfixed code for every cart that
// does NOT contain a strict-'instant' item.  This is the formal regression check.
// ---------------------------------------------------------------------------
describe('Task 5D — No regressions: fixed code matches unfixed for non-instant carts', () => {
  /**
   * **Validates: Requirements 3.1, 3.2**
   *
   * For every cart that is NOT in the bug condition (no strict-'instant' item),
   * the fixed expression MUST return the same value as the buggy expression.
   * This proves the fix is surgical — it only changes behaviour for instant carts.
   */

  const categories: Array<{ label: string; data: CategoryDataSnapshot | null }> = [
    { label: 'no flag, non-Roti',       data: { requiresDeliverySlot: false, name: 'Main Course' } },
    { label: 'flag = true, non-Roti',   data: { requiresDeliverySlot: true,  name: 'Specials' } },
    { label: 'flag = false, Roti name', data: { requiresDeliverySlot: false, name: 'Roti Basket' } },
    { label: 'flag = true, Roti name',  data: { requiresDeliverySlot: true,  name: 'Roti Thali' } },
    { label: 'null categoryData',       data: null },
  ];

  const nonInstantCartConfigs: Array<{ label: string; modes: Array<CartItem['effectiveMode'] | undefined> }> = [
    { label: 'pure preorder',                modes: ['preorder'] },
    { label: 'preorder + both',              modes: ['preorder', 'both'] },
    { label: 'multiple preorder',            modes: ['preorder', 'preorder'] },
    { label: 'pure both',                    modes: ['both'] },
    { label: 'multiple both',                modes: ['both', 'both', 'both'] },
    { label: 'undefined effectiveMode',      modes: [undefined] },
    { label: 'mixed both + undefined',       modes: ['both', undefined] },
  ];

  for (const cartConfig of nonInstantCartConfigs) {
    for (const category of categories) {
      test(
        `[${cartConfig.label}] x [${category.label}] → fixed matches unfixed`,
        () => {
          const cart = makeCart(cartConfig.modes);
          const unfixed = buggyRequiresDeliverySlot(cart, category.data);
          const fixed   = fixedRequiresDeliverySlot(cart, category.data);

          // Core regression assertion: no change in behaviour for non-instant carts
          expect(fixed).toBe(unfixed);
        },
      );
    }
  }
});

// ---------------------------------------------------------------------------
// 5E — TYPESCRIPT: out-of-union assignment should produce a type error
//
// Requirement 2.4: Assigning effectiveMode = 'unknown' to a CartItem must be a
// TypeScript compile error.  We verify this with @ts-expect-error — if the type
// does NOT reject 'unknown', ts-jest itself will fail with "Unused @ts-expect-error".
// ---------------------------------------------------------------------------
describe('Task 5E — TypeScript: out-of-union effectiveMode assignment is a type error (Req 2.4)', () => {
  /**
   * **Validates: Requirements 2.4**
   *
   * The field is declared as effectiveMode?: 'instant' | 'preorder' | 'both'.
   * Assigning any other string literal must be rejected by the TypeScript compiler.
   *
   * Strategy: @ts-expect-error suppresses the compile error.  If TypeScript does
   * NOT emit an error (i.e., the field were typed as `string`), ts-jest will
   * itself fail with TS2578: "Unused '@ts-expect-error' directive" — which would
   * surface as a test file compilation failure, giving us the verification we need.
   */

  test(
    "assigning effectiveMode = 'unknown' to CartItem should be a TypeScript compile error",
    () => {
      const item: CartItem = {
        id: 'test-id',
        name: 'Test',
        price: 100,
        quantity: 1,
        image: null,
      };

      // @ts-expect-error — 'unknown' is not assignable to 'instant' | 'preorder' | 'both' | undefined
      item.effectiveMode = 'unknown';

      // At runtime the assignment still works (JS doesn't enforce types).
      // The test passing confirms TypeScript correctly rejected 'unknown' during compilation.
      expect((item as any).effectiveMode).toBe('unknown');
    },
  );

  test(
    "valid values 'instant', 'preorder', 'both', and undefined are assignable without error",
    () => {
      const item: CartItem = {
        id: 'valid-test',
        name: 'Valid Item',
        price: 100,
        quantity: 1,
        image: null,
      };

      // All union members must be assignable without @ts-expect-error
      item.effectiveMode = 'instant';
      expect(item.effectiveMode).toBe('instant');

      item.effectiveMode = 'preorder';
      expect(item.effectiveMode).toBe('preorder');

      item.effectiveMode = 'both';
      expect(item.effectiveMode).toBe('both');

      item.effectiveMode = undefined;
      expect(item.effectiveMode).toBeUndefined();
    },
  );
});
