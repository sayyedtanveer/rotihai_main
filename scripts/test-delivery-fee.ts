import 'dotenv/config';
import { storage } from '../server/storage';

type ChefLike = {
  id?: string;
  defaultDeliveryFee?: number;
  deliveryFeePerKm?: number;
  freeDeliveryThreshold?: number;
};

function expectedResult(hasLocation: boolean, distance: number | null, orderAmount: number, chef: ChefLike) {
  const defaultFee = chef.defaultDeliveryFee ?? 20;
  const feePerKm = chef.deliveryFeePerKm ?? 5;
  const freeDeliveryThreshold = chef.freeDeliveryThreshold ?? 200;

  let deliveryFee = defaultFee;
  let isFree = false;

  if (hasLocation && distance !== null && distance > 0) {
    deliveryFee = Math.ceil(distance * feePerKm);
  } else {
    deliveryFee = defaultFee;
  }

  if (orderAmount >= freeDeliveryThreshold) {
    isFree = true;
    deliveryFee = 0;
  }

  return { deliveryFee, isFreeDelivery: isFree };
}

async function main() {
  // Chef templates to exercise different settings
  const chefTemplates: ChefLike[] = [
    { id: 'c1', defaultDeliveryFee: 20, deliveryFeePerKm: 5, freeDeliveryThreshold: 200 },
    { id: 'c2', defaultDeliveryFee: 30, deliveryFeePerKm: 10, freeDeliveryThreshold: 500 },
    { id: 'c3', defaultDeliveryFee: 0, deliveryFeePerKm: 2, freeDeliveryThreshold: 100 },
    { id: 'c4', /* use defaults */ },
  ];

  const distances = [null, 0, 0.5, 1.9, 2, 2.1, 3.4, 5, 7.7, 12.3, 25.6];
  const subtotals = [0, 49.99, 99.99, 100, 149.99, 199.99, 200, 250, 499.99, 500, 1000];
  const hasLocationOptions = [true, false];

  const tests: Array<{
    id: number;
    chef: ChefLike;
    distance: number | null;
    orderAmount: number;
    hasLocation: boolean;
  }> = [];

  // Generate cross-product and stop when we reach ~100 cases
  let id = 1;
  outer: for (const chef of chefTemplates) {
    for (const hasLocation of hasLocationOptions) {
      for (const dist of distances) {
        for (const subtotal of subtotals) {
          tests.push({ id: id++, chef, distance: dist, orderAmount: subtotal, hasLocation });
          if (tests.length >= 100) break outer;
        }
      }
    }
  }

  console.log(`Running ${tests.length} delivery-fee tests...`);

  let passed = 0;
  const failures: Array<{ test: any; expected: any; actual: any }> = [];

  for (const t of tests) {
    const actual = await storage.calculateDeliveryFee(t.hasLocation, t.distance, t.orderAmount, t.chef as any);
    const expected = expectedResult(t.hasLocation, t.distance, t.orderAmount, t.chef);

    const ok = actual.deliveryFee === expected.deliveryFee && actual.isFreeDelivery === expected.isFreeDelivery;

    if (ok) {
      passed++;
    } else {
      failures.push({ test: t, expected, actual });
    }
  }

  console.log(`\nSummary: ${passed}/${tests.length} tests passed.`);
  if (failures.length > 0) {
    console.log('\nFailures (up to 10 shown):');
    for (let i = 0; i < Math.min(10, failures.length); i++) {
      const f = failures[i];
      console.log(`\nTest #${f.test.id}: chef=${f.test.chef.id || 'template'}, hasLocation=${f.test.hasLocation}, distance=${f.test.distance}, subtotal=${f.test.orderAmount}`);
      console.log('Expected:', f.expected);
      console.log('Actual:  ', f.actual);
    }
  }

  if (failures.length > 0) {
    console.error('\nSome tests failed.');
    process.exit(2);
  } else {
    console.log('\nAll tests passed. Delivery fee logic matches expected behavior.');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
