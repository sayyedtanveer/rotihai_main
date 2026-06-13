/// <reference types="jest" />
// @ts-ignore
const { storage } = require('../storage-runtime');

describe('Delivery partner payout', () => {
  beforeAll(() => {
    // Stub the slab lookup to deterministic slabs
    (storage as any).getDeliveryPartnerPayoutByPincodeAndDistance = jest.fn(async (pincode: string | null, distance: number) => {
      const slabs = [
        { id: 's1', minDistance: 0.0, maxDistance: 1.2, payoutAmount: 10, pincode: null, isActive: true },
        { id: 's2', minDistance: 1.2, maxDistance: 1.5, payoutAmount: 15, pincode: null, isActive: true },
        { id: 's3', minDistance: 1.5, maxDistance: 3.0, payoutAmount: 20, pincode: null, isActive: true },
      ];

      for (const slab of slabs) {
        if (distance >= slab.minDistance && distance <= slab.maxDistance) {
          return slab as any;
        }
      }
      return undefined;
    });
  });

  test('uses provided adjusted distance without internal inflation', async () => {
    const adjustedDistance = 0.98; // km
    const payout = await storage.calculateDeliveryPartnerPayout(adjustedDistance, '560001');
    expect(payout).toBe(10);
  });

  test('returns default for null/zero distances', async () => {
    expect(await storage.calculateDeliveryPartnerPayout(null)).toBe(10);
    expect(await storage.calculateDeliveryPartnerPayout(0)).toBe(10);
  });
});
