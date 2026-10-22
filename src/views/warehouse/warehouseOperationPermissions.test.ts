import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { describe, expect, it } from 'vitest';

const readView = (business: string) =>
  readFileSync(fileURLToPath(new URL(`./${business}/index.vue`, import.meta.url)), 'utf8');

const documentPermissions = ['query', 'add', 'edit', 'confirm', 'complete', 'cancel', 'remove', 'export'];

describe('warehouse document operation permissions', () => {
  for (const business of ['inbound', 'outbound', 'transfer', 'stocktake']) {
    it(`${business} declares every controller operation permission`, () => {
      const source = readView(business);
      for (const action of documentPermissions) {
        expect(source).toContain(`warehouse:${business}:${action}`);
      }
    });

    it(`${business} keeps state and permission conditions together`, () => {
      const source = readView(business);
      expect(source).toMatch(new RegExp(`v-if="[^"]*DRAFT[^"]*"[\\s\\S]{0,120}v-hasPermi="\\['warehouse:${business}:edit'\\]"`));
      expect(source).toMatch(new RegExp(`v-if="[^"]*DRAFT[^"]*"[\\s\\S]{0,120}v-hasPermi="\\['warehouse:${business}:confirm'\\]"`));
      expect(source).toMatch(new RegExp(`v-if="[^"]*CONFIRMED[^"]*"[\\s\\S]{0,120}v-hasPermi="\\['warehouse:${business}:complete'\\]"`));
      expect(source).toMatch(new RegExp(`v-if="[^"]*DRAFT[^"]*CONFIRMED[^"]*"[\\s\\S]{0,120}v-hasPermi="\\['warehouse:${business}:cancel'\\]"`));
      expect(source).toMatch(new RegExp(`v-if="[^"]*DRAFT[^"]*"[\\s\\S]{0,120}v-hasPermi="\\['warehouse:${business}:remove'\\]"`));
    });
  }

  it('zone and location row actions use their own edit/remove permissions', () => {
    for (const business of ['zone', 'location']) {
      const source = readView(business);
      expect(source).toContain(`v-hasPermi="['warehouse:${business}:edit']" link type="primary"`);
      expect(source).toContain(`v-hasPermi="['warehouse:${business}:remove']" link type="danger"`);
    }
  });
});
