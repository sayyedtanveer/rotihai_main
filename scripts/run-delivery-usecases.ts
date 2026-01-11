import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { storage } from '../server/storage';

type UseCase = {
  id: number;
  chef: any;
  hasLocation: boolean;
  distance: number | null;
  orderAmount: number;
};

function expectedResult(hasLocation: boolean, distance: number | null, orderAmount: number, chef: any) {
  const defaultFee = (chef.defaultDeliveryFee as any) || 20;
  const feePerKm = (chef.deliveryFeePerKm as any) || 5;
  const freeDeliveryThreshold = (chef.freeDeliveryThreshold as any) || 200;

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
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const file = path.join(__dirname, 'delivery-fee-usecases.json');
  const raw = fs.readFileSync(file, 'utf-8');
  const cases: UseCase[] = JSON.parse(raw);

  console.log(`Loaded ${cases.length} use cases.`);

  let passed = 0;
  const failures: Array<{ usecase: UseCase; expected: any; actual: any }> = [];

  for (const u of cases) {
    const actual = await storage.calculateDeliveryFee(u.hasLocation, u.distance, u.orderAmount, u.chef);
    const expected = expectedResult(u.hasLocation, u.distance, u.orderAmount, u.chef);

    const ok = actual.deliveryFee === expected.deliveryFee && actual.isFreeDelivery === expected.isFreeDelivery;
    if (ok) passed++;
    else failures.push({ usecase: u, expected, actual });
  }

  console.log(`\nSummary: ${passed}/${cases.length} passed.`);
  if (failures.length > 0) {
    console.log('\nFailures:');
    for (const f of failures) {
      console.log(`\nUseCase #${f.usecase.id}: hasLocation=${f.usecase.hasLocation}, distance=${f.usecase.distance}, orderAmount=${f.usecase.orderAmount}`);
      console.log('Chef:', f.usecase.chef);
      console.log('Expected:', f.expected);
      console.log('Actual:  ', f.actual);
    }
    process.exit(2);
  } else {
    console.log('\nAll use cases passed.');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
