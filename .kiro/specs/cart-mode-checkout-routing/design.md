# cart-mode-checkout-routing Bugfix Design

## Overview

Two bugs prevent `CheckoutDialog` from correctly routing to the delivery slot UI for instant-mode carts. Both are fixed with minimum changes to two files.

**Bug 1 — `requiresDeliverySlot` ignores `cartHasInstant`**
In `CheckoutDialog.tsx`, `cartHasInstant` is computed but never referenced in the `requiresDeliverySlot` expression. A pure-instant cart (or a `'both'`+`'instant'` cart) falls through to the category flag and Roti-name heuristic, so the slot picker is never shown for most categories.

**Bug 2 — `CartItem` type is missing `effectiveMode`**
`client/src/types/cartItem.ts` does not declare `effectiveMode`, causing TypeScript error TS2339 wherever the field is accessed from an imported `CartItem`.

Fix scope: two files, minimum changes. The existing JSX branch (`cartHasPreorder ? <PreorderTabs> : <StandardSlots>`) is already correct and is not touched.

---

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug — a cart resolves to instant mode but `requiresDeliverySlot` is `false`, so the instant delivery slot picker is never shown.
- **Property (P)**: The desired behavior — any cart with at least one strict-`'instant'` item (and no strict-`'preorder'` item) SHALL set `requiresDeliverySlot = true` and show the existing instant slot picker.
- **Preservation**: All existing behavior for preorder carts, all-`'both'` carts, `canAddItem`, slot filtering logic, and payment flows that must not change.
- **`effectiveMode`**: A per-item field set server-side via a priority chain: product.fulfillmentMode → chef.fulfillmentMode → `'both'`. Determines whether an item is instant, preorder, or mode-neutral.
- **Mode-neutral item**: An item with `effectiveMode = 'both'`; can coexist with either strict mode and does not lock the cart to any mode.
- **Strict-mode item**: An item with `effectiveMode = 'instant'` or `'preorder'`; drives the cart's resolved mode.

---

## Bug Details

### Bug Condition

The bug manifests when a cart contains at least one strict-`'instant'` item and no strict-`'preorder'` item. The `requiresDeliverySlot` expression only checks `cartHasPreorder` as its `true`-returning condition; `cartHasInstant` is computed then discarded. The expression falls back to `categoryData?.requiresDeliverySlot || rotiHeuristic`, which is `false` for most categories.

**Formal Specification:**
```
FUNCTION isBugCondition(cart)
  INPUT: cart of type CategoryCart
  OUTPUT: boolean

  strictInstant  ← cart.items.some(i => i.effectiveMode === 'instant')
  strictPreorder ← cart.items.some(i => i.effectiveMode === 'preorder')

  // Bug: instant cart not routed to slot picker because cartHasInstant is unused
  RETURN strictInstant AND NOT strictPreorder
END FUNCTION
```

**Note:** The `effectiveMode` TS2339 is a compile-time bug (always present until the type is fixed); it is not represented as a runtime cart condition.

### Examples

- **Pure instant cart** (1× product with `effectiveMode = 'instant'`): today `requiresDeliverySlot = false` → slot picker never shown. After fix: `true`.
- **`'both'` + `'instant'` cart** (1× `'both'` item + 1× `'instant'` item): today `cartHasInstant = true` but `requiresDeliverySlot` falls back to category flag → slot picker skipped. After fix: `true` driven by `cartHasInstant`.
- **Pure `'both'` cart** (all items `effectiveMode = 'both'` or absent): today `requiresDeliverySlot` correctly uses `categoryData?.requiresDeliverySlot` + Roti heuristic. This behavior is **preserved unchanged**.
- **Pure preorder cart** (1× `'preorder'` item): today `requiresDeliverySlot = true` → Lunch/Dinner tabs shown. This behavior is **preserved unchanged**.

---

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Pre-order carts (≥1 strict-`'preorder'` item, no strict-`'instant'` item) continue to render the existing Lunch/Dinner tabs; `requiresDeliverySlot = true` continues to be driven by `cartHasPreorder`.
- All-`'both'` (or no-strict-mode) carts continue to use `categoryData?.requiresDeliverySlot` and the Roti-name heuristic as the sole driver of `requiresDeliverySlot`.
- The Roti-name heuristic (`categoryData?.name?.toLowerCase().includes('roti')`) applies only when no strict-mode item is present.
- `canAddItem` in `use-cart.ts` continues to block strict-mode conflicts and allow `'both'` items alongside either strict mode — no changes to that file.
- The `cartHasPreorder ? <PreorderTabs> : <StandardSlots>` JSX branch inside the slot section is untouched.
- All slot filtering, cutoff, capacity, morning-restriction logic, `/api/delivery-slots` query, `adminSettings` query, `chefData` query, `DeliveryTimeSelector`, payment, wallet, coupon, and referral flows are untouched.

**Scope:**
All inputs where no cart item has `effectiveMode = 'instant'` are unaffected by this fix.

---

## Hypothesized Root Cause

The `requiresDeliverySlot` expression was written before instant-mode items were fully supported. The developer computed `cartHasInstant` as a preparatory step but never integrated it into the expression, so the result defaults to the existing category-flag path:

```typescript
// BEFORE (buggy) — cartHasInstant is computed but unused
const cartHasPreorder = cart?.items?.some((item: any) => item.effectiveMode === 'preorder');
const cartHasInstant  = cart?.items?.some((item: any) => item.effectiveMode === 'instant');

const requiresDeliverySlot = cartHasPreorder ? true : (
  !!categoryData?.requiresDeliverySlot ||
  (categoryData?.name?.toLowerCase().includes('roti') ?? false)
);
```

`cartHasInstant` is computed but the ternary only branches on `cartHasPreorder`. For an instant-only cart, `cartHasPreorder` is `false` and the expression falls to the category heuristic, which is `false` for most categories.

The `CartItem` type omission is a straightforward gap — the interface was not updated when `effectiveMode` was added to the runtime cart item shape in `use-cart.ts`.

---

## Correctness Properties

Property 1: Bug Condition — Instant Cart Routes to Slot Picker

_For any_ cart where `isBugCondition(cart)` is true (at least one item with `effectiveMode = 'instant'`, no item with `effectiveMode = 'preorder'`), the fixed `CheckoutDialog` SHALL set `requiresDeliverySlot = true` based on `cartHasInstant`, SHALL render the existing instant delivery-slot `<Select>` component (backed by `/api/delivery-slots`), and SHALL NOT consult `categoryData?.requiresDeliverySlot` or the Roti-name heuristic.

**Validates: Requirements 2.1, 2.2**

Property 2: Preservation — Pre-order, All-`'both'`, and Category-Fallback Paths Unchanged

_For any_ cart where `isBugCondition(cart)` is false (no strict-`'instant'` item), the fixed `CheckoutDialog` SHALL produce the same `requiresDeliverySlot` result and the same rendered delivery section as the original code:
- `'preorder'` carts: `requiresDeliverySlot = true`, Lunch/Dinner tabs rendered.
- `'both-fallback'` carts: `requiresDeliverySlot` driven by `categoryData?.requiresDeliverySlot` and the Roti heuristic.

**Validates: Requirements 3.1, 3.2, 3.5, 3.7, 3.8**

---

## Fix Implementation

### File 1: `client/src/types/cartItem.ts`

Add one optional field to the exported `CartItem` interface. Non-breaking — no other changes.

**Before:**
```typescript
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string | null;
  chefId?: string;
  chefName?: string;
  categoryId?: string;
  offerPercentage?: number;
  specialInstructions?: string;
}
```

**After:**
```typescript
export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string | null;
  chefId?: string;
  chefName?: string;
  categoryId?: string;
  offerPercentage?: number;
  specialInstructions?: string;
  effectiveMode?: 'instant' | 'preorder' | 'both';
}
```

---

### File 2: `client/src/components/CheckoutDialog.tsx`

Replace only the `requiresDeliverySlot` computation block (~lines 683–692).

**Before:**
```typescript
const cartHasPreorder = cart?.items?.some((item: any) => item.effectiveMode === 'preorder');
const cartHasInstant  = cart?.items?.some((item: any) => item.effectiveMode === 'instant');

const requiresDeliverySlot = cartHasPreorder ? true : (
  !!categoryData?.requiresDeliverySlot ||
  (categoryData?.name?.toLowerCase().includes('roti') ?? false)
);
```

**After:**
```typescript
const cartHasInstant  = cart?.items?.some((item: any) => item.effectiveMode === 'instant') ?? false;
const cartHasPreorder = cart?.items?.some((item: any) => item.effectiveMode === 'preorder') ?? false;

const requiresDeliverySlot =
  cartHasInstant  ? true :   // instant cart → show existing slot picker
  cartHasPreorder ? true :   // preorder cart → show existing Lunch/Dinner tabs
  !!categoryData?.requiresDeliverySlot ||
  (categoryData?.name?.toLowerCase().includes('roti') ?? false);  // 'both' fallback unchanged
```

Key points:
- `cartHasInstant` is now evaluated before `cartHasPreorder` in the ternary chain.
- Both still result in `true` for `requiresDeliverySlot`, so the preorder path is unaffected.
- The final arm (all-`'both'` fallback) is identical to the old fallback — Roti heuristic preserved exactly.
- The `cartHasPreorder ? <PreorderTabs> : <StandardSlots>` JSX branch inside the slot section is NOT touched; it correctly routes to the right UI once `requiresDeliverySlot` is `true`.

That is the complete fix. Nothing else changes.

---

## What Is NOT Changed

| Component / File | Protected Behavior |
|---|---|
| `use-cart.ts` — `canAddItem` | Mode conflict enforcement; `'both'` item permissiveness |
| `CheckoutDialog.tsx` — `cartHasPreorder ? <PreorderTabs> : <StandardSlots>` JSX | Pre-order vs instant slot rendering branch |
| `CheckoutDialog.tsx` — `deliverySlots` query | `/api/delivery-slots` fetch and slot data |
| `CheckoutDialog.tsx` — `slotCutoffMap`, `preorderLunchSlots`, `preorderDinnerSlots` useMemos | Slot filtering, morning restriction, cutoff, capacity logic |
| `CheckoutDialog.tsx` — `adminSettings`, `chefData`, `rotiSettings` queries | Pre-order slot synthesis data sources |
| `CheckoutDialog.tsx` — `DeliveryTimeSelector` | Slot selection component |
| `CheckoutDialog.tsx` — payment, wallet, coupon, referral flows | Order payment logic |
| `server/routes.ts` — `effectiveMode` computation | Priority chain: product → chef → `'both'` |
| `/api/delivery-slots` endpoint | Server-side slot generation |

---

## Testing Strategy

### Exploratory Bug Condition Checking

**Goal:** Surface counterexamples demonstrating the bug on unfixed code. Confirm the root cause before applying the fix.

**Test Cases (run against UNFIXED code):**

1. **Pure-instant cart**: Cart with one item where `effectiveMode = 'instant'`. Assert `requiresDeliverySlot === true`. Will **fail** — evaluates to `false` today.
2. **`'both'` + `'instant'` cart**: Cart with one `'both'` item and one `'instant'` item, no `'preorder'` items. Assert `requiresDeliverySlot === true`. Will **fail** — `cartHasInstant` is not consulted.
3. **TypeScript compile check**: Import `CartItem` from `cartItem.ts` and access `item.effectiveMode`. Assert no TS2339. Will **fail** until the type is updated.

**Expected Counterexamples:**
- `requiresDeliverySlot` evaluates to `false` for instant carts because `cartHasInstant` is never consulted.
- TS2339 on `item.effectiveMode` from the exported type.

### Fix Checking

```pascal
// Property 1: Instant cart routes to slot picker
FOR ALL cart WHERE isBugCondition(cart) = true DO
  result ← CheckoutDialog.render_fixed(cart)
  ASSERT result.requiresDeliverySlot = true
  ASSERT result.showsInstantDeliverySlotComponent = true
  ASSERT result.showsPreorderUI = false
  ASSERT result.categoryHeuristicEvaluated = false
END FOR

// Type fix
ASSERT TypeScript compiler emits NO TS2339 for item.effectiveMode
ASSERT TypeScript compiler DOES emit error for item.effectiveMode = "unknown"
```

### Preservation Checking

```pascal
// Property 2a: Preorder cart path unchanged
FOR ALL cart WHERE resolveCartMode(cart) = 'preorder' DO
  result_before ← CheckoutDialog.render_unfixed(cart)
  result_after  ← CheckoutDialog.render_fixed(cart)
  ASSERT result_after.requiresDeliverySlot = result_before.requiresDeliverySlot
  ASSERT result_after.showsPreorderUI = true
END FOR

// Property 2b: All-'both' / no-strict-mode cart path unchanged
FOR ALL cart WHERE resolveCartMode(cart) = 'both-fallback' DO
  result_before ← CheckoutDialog.render_unfixed(cart)
  result_after  ← CheckoutDialog.render_fixed(cart)
  ASSERT result_after.requiresDeliverySlot = result_before.requiresDeliverySlot
  ASSERT result_after.rotiHeuristicApplied = result_before.rotiHeuristicApplied
END FOR
```

### Unit Tests

- `requiresDeliverySlot` is `true` for a cart with one `'instant'` item (no `categoryData` needed).
- `requiresDeliverySlot` is `true` for a cart with one `'both'` + one `'instant'` item.
- `requiresDeliverySlot` is `true` for a cart with one `'preorder'` item (existing behavior preserved).
- `requiresDeliverySlot` uses `categoryData.requiresDeliverySlot` when all items are `'both'`.
- `requiresDeliverySlot` uses the Roti-name heuristic only when all items are `'both'`.
- `CartItem` interface compiles without TS2339 after adding `effectiveMode`.
- Assignment of `effectiveMode = 'unknown'` triggers a TypeScript compile error.

### Property-Based Tests

- Generate random carts where `strictInstant && !strictPreorder`. Assert `requiresDeliverySlot = true` on fixed code.
- Generate random carts with no strict-mode items. Assert `requiresDeliverySlot` matches `categoryData?.requiresDeliverySlot || rotiHeuristic` exactly (preservation).
- Generate random preorder carts (varying item counts, mix with `'both'` items). Assert behavior is identical before and after fix (preservation).
