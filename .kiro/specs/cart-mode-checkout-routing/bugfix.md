# Bugfix Requirements Document

## Introduction

The `CheckoutDialog` component does not correctly route to the appropriate delivery flow based on the cart's resolved fulfillment mode. The audit confirms: a cart can hold items of ONLY ONE strict mode (`instant` or `preorder`) — never both simultaneously — because `canAddItem` in `use-cart.ts` blocks strict-mode conflicts at add-time. Items with `effectiveMode = 'both'` are mode-neutral; they can coexist with either strict mode and follow the cart's dominant strict mode without locking the cart to any particular mode.

The core bug is that `requiresDeliverySlot` in `CheckoutDialog.tsx` is computed using only `cartHasPreorder` and a category-level heuristic. `cartHasInstant` is computed at line 684 but is never referenced anywhere in the expression — so a pure-instant cart (or a cart with strict `'instant'` items alongside `'both'` items) never shows the delivery slot picker unless the category is named "Roti" or has `requiresDeliverySlot` set.

**Minimum change**: Replace the `requiresDeliverySlot` computation block in `CheckoutDialog.tsx` so that strict-mode items (`'instant'` or `'preorder'`) exclusively determine whether the slot picker is shown, and fall back to `categoryData?.requiresDeliverySlot` only for all-`'both'` carts. The existing JSX branch (`cartHasPreorder ? <PreorderTabs> : <StandardSlots>`) inside the slot section is already correct and is NOT modified. Add `effectiveMode?: 'instant' | 'preorder' | 'both'` to the exported `CartItem` interface as a non-breaking addition.

Two concrete bugs are fixed:

1. **`requiresDeliverySlot` ignores `cartHasInstant`** — For a pure-instant cart (or a `'both'`+`'instant'` cart), `requiresDeliverySlot` falls back to `categoryData?.requiresDeliverySlot` or the "Roti" category-name heuristic instead of being driven by `cartHasInstant`. The Roti heuristic must only apply to all-`'both'` carts where no explicit strict mode is present.
2. **`CartItem` type is missing `effectiveMode`** — `client/src/types/cartItem.ts` exports a `CartItem` interface without `effectiveMode`, causing TypeScript error TS2339 wherever the field is accessed from an imported `CartItem`.

A third defensive requirement is preserved: if `cartHasInstant && cartHasPreorder` are both true (cannot happen via normal UX but theoretically possible), the checkout shows an error banner and blocks payment. The existing JSX handles the preorder path correctly; no changes are needed there.

---

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the cart contains items with `effectiveMode = 'instant'` and no items with `effectiveMode = 'preorder'` THEN the system evaluates `requiresDeliverySlot` using `categoryData?.requiresDeliverySlot` and the "Roti" category-name heuristic instead of setting it `true` based on `cartHasInstant`, causing the instant delivery-slot picker to be skipped for any non-Roti, non-flagged category.

1.2 WHEN the cart contains items with `effectiveMode = 'instant'` alongside items with `effectiveMode = 'both'` and no items with `effectiveMode = 'preorder'` THEN the system ignores `cartHasInstant` and falls back to the category heuristic, so the slot picker is not shown even though a strict instant mode is present.

1.3 WHEN the cart contains both items with `effectiveMode = 'instant'` and items with `effectiveMode = 'preorder'` (should not occur via normal UI) THEN the system silently renders the pre-order delivery UI because `cartHasPreorder` is evaluated first, without showing an error or blocking payment.

1.4 WHEN any component imports `CartItem` from `client/src/types/cartItem.ts` and reads `item.effectiveMode` THEN the system emits TypeScript error TS2339 because the exported `CartItem` interface does not declare `effectiveMode`, even though runtime cart items carry the field.

### Expected Behavior (Correct)

2.1 WHEN the cart contains at least one item with `effectiveMode = 'instant'` and no item with `effectiveMode = 'preorder'` THEN the system SHALL set `requiresDeliverySlot` to `true` based solely on `cartHasInstant`, regardless of `categoryData?.requiresDeliverySlot` or the category name. Items with `effectiveMode = 'both'` in the same cart SHALL NOT prevent this.

2.2 WHEN `requiresDeliverySlot` is `true` and the resolved cart mode is instant THEN the system SHALL render the existing instant delivery-slot `<Select>` component (populated from `/api/delivery-slots`) and SHALL NOT render the Pre-order Lunch/Dinner tabs. The `DeliveryTimeSelector`, `/api/delivery-slots` endpoint, and existing slot filtering, cutoff, capacity, and morning-restriction logic SHALL NOT be modified.

2.3 WHEN the cart contains both items with `effectiveMode = 'instant'` and items with `effectiveMode = 'preorder'` (defensive case — blocked by `canAddItem` in normal flow) THEN the system SHALL render a visible error banner in the delivery section, SHALL disable the payment button, and SHALL NOT render either the instant slot picker or the Pre-order Lunch/Dinner tabs.

2.4 WHEN any component imports `CartItem` from `client/src/types/cartItem.ts` and accesses `item.effectiveMode` THEN the TypeScript compiler SHALL NOT produce error TS2339. The field SHALL be declared as `effectiveMode?: 'instant' | 'preorder' | 'both'` so that out-of-union assignments produce a compile-time error. The addition SHALL be non-breaking — existing code that does not access `effectiveMode` SHALL compile without modification.

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the cart contains at least one item with `effectiveMode = 'preorder'` and no item with `effectiveMode = 'instant'` THEN the system SHALL CONTINUE TO render the pre-order delivery UI (existing Lunch/Dinner tabs synthesised from `adminSettings` and `chefData`) without querying `/api/delivery-slots` as the slot source. The existing `cartHasPreorder ? <PreorderTabs> : <StandardSlots>` JSX branch already handles this correctly and SHALL NOT be modified.

3.2 WHEN all cart items have `effectiveMode = 'both'` or have no `effectiveMode` set (no item has a strict `'instant'` or `'preorder'` mode) THEN the system SHALL CONTINUE TO evaluate `categoryData?.requiresDeliverySlot` to determine whether to show the slot picker. This fallback MUST NOT apply when any item has a strict mode.

3.3 WHEN `canAddItem` in `use-cart.ts` validates a new item against the existing cart THEN the system SHALL CONTINUE TO reject additions where a strict `'instant'` item conflicts with an existing strict `'preorder'` item, or vice versa. Items with `effectiveMode = 'both'` SHALL CONTINUE TO be accepted alongside either strict mode.

3.4 WHEN the instant delivery-slot component is rendered THEN the system SHALL CONTINUE TO apply all existing slot filtering, cutoff, capacity, and morning-restriction (08:00–10:59 disabled) logic without modification.

3.5 WHEN the pre-order Lunch/Dinner tab synthesis logic (backed by `adminSettings` and `chefData` queries) is executed for a resolved-preorder cart THEN the system SHALL CONTINUE TO operate exactly as today. The `/api/admin-settings` and `/api/chefs/:id` queries for pre-order slot synthesis SHALL NOT be modified.

3.6 WHEN checkout address validation, delivery fee calculation, payment processing, coupon/referral flows, or wallet flows are used THEN the system SHALL CONTINUE TO operate exactly as today. These flows are entirely outside the scope of this fix.

3.7 The `DeliveryTimeSelector` component, the `/api/delivery-slots` endpoint, and the pre-order Lunch/Dinner synthesis JSX inside the `<Select>` SHALL NOT be modified by this fix.

3.8 WHEN the "Roti" category-name heuristic (`categoryData?.name?.toLowerCase().includes('roti')`) is evaluated THEN it SHALL CONTINUE TO apply only for all-`'both'` carts (no strict mode on any item or chef). It SHALL NOT be applied when any cart item has a strict `'instant'` or `'preorder'` `effectiveMode`.

---

## Bug Condition Analysis

### How `'both'` Items Interact with Strict-Mode Items

Per the audit of `canAddItem` in `use-cart.ts`:
- `'both'` items are mode-neutral: the `itemMode !== 'both'` check means `'both'` items bypass the conflict check entirely and are never rejected.
- A `'both'` item CAN coexist with `'instant'` items in the same cart.
- A `'both'` item CAN coexist with `'preorder'` items in the same cart.
- Only two conflicting STRICT modes (`'instant'` vs. `'preorder'`) are blocked by `canAddItem`.
- In `CheckoutDialog`, the resolved cart mode is determined exclusively by strict-mode items. `'both'` items are ignored during mode resolution.

### Bug Condition Function

```pascal
FUNCTION resolveCartMode(cart)
  INPUT: cart of type CategoryCart (with items carrying effectiveMode at runtime)
  OUTPUT: 'instant' | 'preorder' | 'both-fallback' | 'mixed-error'

  // Only strict-mode items drive the resolved mode; 'both' items are ignored
  strictInstant  ← cart.items.some(i => i.effectiveMode = 'instant')
  strictPreorder ← cart.items.some(i => i.effectiveMode = 'preorder')

  IF strictInstant AND strictPreorder THEN
    RETURN 'mixed-error'      // Defensive: blocked by canAddItem in normal flow
  END IF
  IF strictInstant THEN
    RETURN 'instant'          // Includes 'both'+'instant' carts
  END IF
  IF strictPreorder THEN
    RETURN 'preorder'         // Includes 'both'+'preorder' carts
  END IF

  // All items are 'both' or effectiveMode is absent — use category flag fallback
  RETURN 'both-fallback'
END FUNCTION

FUNCTION isBugCondition(cart)
  INPUT: cart of type CategoryCart
  OUTPUT: boolean

  mode ← resolveCartMode(cart)

  // Bug 1.1 & 1.2: requiresDeliverySlot uses category heuristic instead of cartHasInstant
  instantCartBug ← mode = 'instant'

  // Bug 1.3: mixed-mode cart silently falls through to preorder UI
  mixedCartBug ← mode = 'mixed-error'

  // Bug 1.4: CartItem type missing effectiveMode field (compile-time, always present until fixed)
  typeBug ← true

  RETURN instantCartBug OR mixedCartBug OR typeBug
END FUNCTION
```

### Property: Fix Checking

```pascal
// Fix Checking — resolved-instant cart routes to instant delivery slot UI
FOR ALL cart WHERE resolveCartMode(cart) = 'instant' DO
  result ← CheckoutDialog.render(cart)
  ASSERT result.requiresDeliverySlot = true
  ASSERT result.showsInstantDeliverySlotComponent = true
  ASSERT result.usesDeliverySlotsAPI = true
  ASSERT result.showsPreorderUI = false
  ASSERT result.categoryHeuristicEvaluated = false  // heuristic NOT consulted for strict-mode carts
END FOR

// Fix Checking — mixed-mode cart is blocked with error (defensive)
FOR ALL cart WHERE resolveCartMode(cart) = 'mixed-error' DO
  result ← CheckoutDialog.render(cart)
  ASSERT result.showsErrorBanner = true
  ASSERT result.paymentBlocked = true
  ASSERT result.showsInstantUI = false
  ASSERT result.showsPreorderUI = false
  ASSERT result.deliverySlotsAPIQueried = false
  ASSERT result.adminSettingsAPIQueried = false
END FOR

// Fix Checking — CartItem type consistency
ASSERT TypeScript compiler emits NO TS2339 for item.effectiveMode after type fix
ASSERT TypeScript compiler DOES emit error for item.effectiveMode = "unknown"
```

### Property: Preservation Checking

```pascal
// Preservation — resolved-preorder cart still routes to preorder UI (unchanged JSX branch)
FOR ALL cart WHERE resolveCartMode(cart) = 'preorder' DO
  result ← CheckoutDialog.render(cart)
  ASSERT result.showsPreorderUI = true         // Lunch/Dinner tabs rendered
  ASSERT result.usesDeliverySlotsAPI = false   // /api/delivery-slots NOT queried
END FOR

// Preservation — all-'both' / absent effectiveMode still uses category flag fallback
// Roti name heuristic is preserved ONLY for this all-'both' case
FOR ALL cart WHERE resolveCartMode(cart) = 'both-fallback' DO
  result ← CheckoutDialog.render(cart)
  ASSERT result.categoryFlagEvaluated = true    // requiresDeliverySlot flag consulted
  ASSERT result.rotiNameHeuristicApplicable = true  // Roti heuristic applies only here
END FOR

// Preservation — /api/delivery-slots server logic is unmodified
FOR ALL request to /api/delivery-slots DO
  ASSERT F(request) = F'(request)  // server response identical before and after fix
END FOR

// Preservation — canAddItem still rejects strict mixed-mode additions
FOR ALL (existingCart, newItem) WHERE
    (existingCart has strict 'instant' items AND newItem.effectiveMode = 'preorder')
    OR (existingCart has strict 'preorder' items AND newItem.effectiveMode = 'instant')
DO
  ASSERT canAddItem(newItem).canAdd = false
END FOR

// Preservation — 'both' items can still be added alongside strict-mode items
FOR ALL (existingCart, newItem) WHERE
    existingCart has strict 'instant' or 'preorder' items AND newItem.effectiveMode = 'both'
DO
  ASSERT canAddItem(newItem).canAdd = true
END FOR
```
