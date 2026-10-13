# Implementation Plan

## Overview

This spec fixes two bugs in `CheckoutDialog.tsx` and `client/src/types/cartItem.ts` that prevent instant-mode carts from being routed to the delivery slot picker. Task 1 writes exploration tests to confirm the bugs exist on unfixed code. Tasks 2 and 3 apply the minimum-change fixes. Tasks 4 and 5 verify the fixes and confirm no regressions.

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1"] },
    { "wave": 2, "tasks": ["2"] },
    { "wave": 3, "tasks": ["3"] },
    { "wave": 4, "tasks": ["4"] },
    { "wave": 5, "tasks": ["5"] }
  ]
}
```

Tasks execute sequentially: each task depends on the previous one completing successfully.

## Tasks

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Instant Cart Not Routed to Slot Picker
  - **CRITICAL**: This test MUST FAIL on unfixed code — failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior — it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists on unfixed code
  - **Scoped PBT Approach**: Scope the property to the concrete failing case(s) for reproducibility
  - Test A — Pure-instant cart: Build a `CategoryCart` where one item has `effectiveMode = 'instant'` and no item has `effectiveMode = 'preorder'`. Invoke the `requiresDeliverySlot` expression from `CheckoutDialog.tsx` (~lines 683–692 of unfixed code). Assert the result is `true`. Will evaluate to `false` (or the category heuristic value) on unfixed code — this is the counterexample.
  - Test B — TypeScript compile check: Import `CartItem` from `client/src/types/cartItem.ts` and access `item.effectiveMode`. Assert no TS2339 is emitted. Will fail until the type is updated.
  - Run both tests against UNFIXED code
  - **EXPECTED OUTCOME**: Tests FAIL (this is correct — it proves the bugs exist)
  - Document counterexamples found (e.g., `requiresDeliverySlot = false` for `[{effectiveMode:'instant'}]` cart, TS2339 on `item.effectiveMode`)
  - Mark task complete when tests are written, run, and all failures are documented
  - _Requirements: 1.1, 1.2, 1.4_

- [x] 2. Fix `CartItem` type — add `effectiveMode` field
  - Edit `client/src/types/cartItem.ts`
  - Add `effectiveMode?: 'instant' | 'preorder' | 'both'` as an optional field to the exported `CartItem` interface
  - The addition is non-breaking: existing code that does not access `effectiveMode` compiles without modification
  - Out-of-union assignments (e.g., `effectiveMode = 'unknown'`) must produce a TypeScript compile error after the fix
  - Verify the interface matches the `CartItem` shape already in `use-cart.ts` (that file already declares `effectiveMode?: string`; the exported type now narrows it to the union)
  - _Bug_Condition: TS2339 on item.effectiveMode when imported from cartItem.ts_
  - _Expected_Behavior: TypeScript compiler emits NO TS2339 for item.effectiveMode; DOES emit error for item.effectiveMode = "unknown"_
  - _Requirements: 1.4, 2.4_

- [x] 3. Fix `requiresDeliverySlot` computation in `CheckoutDialog.tsx`
  - Edit `client/src/components/CheckoutDialog.tsx`
  - Replace the buggy computation block (~lines 683–692) with:
    ```typescript
    const cartHasInstant  = cart?.items?.some((item: any) => item.effectiveMode === 'instant') ?? false;
    const cartHasPreorder = cart?.items?.some((item: any) => item.effectiveMode === 'preorder') ?? false;

    const requiresDeliverySlot =
      cartHasInstant  ? true :   // instant cart → show existing slot picker
      cartHasPreorder ? true :   // preorder cart → show existing Lunch/Dinner tabs
      !!categoryData?.requiresDeliverySlot ||
      (categoryData?.name?.toLowerCase().includes('roti') ?? false);  // 'both' fallback unchanged
    ```
  - `cartHasInstant` is now evaluated before `cartHasPreorder` in the ternary chain
  - The all-`'both'` fallback arm is identical to the old fallback — Roti heuristic preserved
  - The `cartHasPreorder ? <PreorderTabs> : <StandardSlots>` JSX branch inside the slot section is NOT touched
  - No other changes to `CheckoutDialog.tsx`
  - _Bug_Condition: isBugCondition(cart) where strictInstant = true AND NOT strictPreorder_
  - _Expected_Behavior: requiresDeliverySlot = true for instant carts_
  - _Preservation: Pre-order, all-'both', and Roti-heuristic paths produce identical results to unfixed code_
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 3.8_

- [x] 4. Fix-checking tests — verify the fix works
  - **Property 1: Expected Behavior** - Instant Cart Routes to Slot Picker
  - **IMPORTANT**: Re-run the SAME tests from task 1 — do NOT write new tests
  - After completing tasks 2 and 3, re-run both bug-condition tests from task 1 against the FIXED code
  - Test A (pure-instant cart): `requiresDeliverySlot === true` — **EXPECTED OUTCOME**: PASSES
  - Test B (TypeScript compile check): no TS2339 on `item.effectiveMode` — **EXPECTED OUTCOME**: PASSES
  - When both tests pass, it confirms the fix satisfies the expected behavior
  - _Requirements: 2.1, 2.2, 2.4_

- [x] 5. Preservation and TypeScript verification
  - **Property 2: Preservation** - Pre-order, All-`'both'`, and Category-Fallback Paths Unchanged
  - **Preorder path**: Create a cart with one `'preorder'` item and no `'instant'` item. Assert `requiresDeliverySlot === true` on both unfixed and fixed code. Verify the `cartHasPreorder ? <PreorderTabs>` branch is not affected.
  - **All-`'both'` fallback**: Create carts where every item has `effectiveMode = 'both'` or `undefined`. Assert `requiresDeliverySlot` equals `!!categoryData?.requiresDeliverySlot || rotiHeuristic` on both unfixed and fixed code. Test with `categoryData.requiresDeliverySlot = true`, `false`, and category name containing `'roti'`.
  - **Roti-heuristic scope**: Assert `categoryData?.name?.toLowerCase().includes('roti')` is not evaluated when any strict-mode item is present (it applies only to the `'both'` fallback arm).
  - **TypeScript**: Run `tsc --noEmit` from the `client/` directory. Confirm zero TS2339 errors for `item.effectiveMode` references and zero new TypeScript errors introduced by tasks 2 and 3. Confirm assigning `effectiveMode = 'unknown'` to a `CartItem` produces a TypeScript error.
  - Verify all preservation tests PASS on UNFIXED code (baseline), then PASS again on FIXED code (no regressions)
  - Confirm `use-cart.ts` was NOT modified
  - Confirm the `cartHasPreorder ? <PreorderTabs> : <StandardSlots>` JSX branch was NOT modified
  - Confirm all slot filtering, cutoff, capacity, morning-restriction, payment, wallet, coupon, and referral flows are untouched
  - _Requirements: 3.1, 3.2, 3.5, 3.7, 3.8_

## Notes

- Task 1 uses the bugfix workflow: the exploration tests are **expected to fail** on unfixed code. Failure = success for task 1.
- Tasks 2 and 3 are the actual code fixes. They are independent of each other and could be applied in either order, but the dependency graph sequences them to keep task 4's re-run clean.
- Task 4 re-runs the exact same tests from task 1 — no new test files needed.
- Task 5 performs a broader TypeScript compile check and verifies no preservation regressions.
- Only two files are modified by this fix: `client/src/types/cartItem.ts` (task 2) and `client/src/components/CheckoutDialog.tsx` (task 3).
