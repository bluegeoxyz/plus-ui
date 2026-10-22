import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { describe, expect, it } from 'vitest';

const modules = ['warehouse', 'zone', 'location', 'materialCategory', 'unit', 'material', 'inbound', 'outbound', 'transfer', 'stocktake'];
const readView = (business: string) =>
  readFileSync(fileURLToPath(new URL(`./${business}/index.vue`, import.meta.url)), 'utf8');

describe('warehouse page mode integration', () => {
  for (const business of modules) {
    it(`${business} delegates page entry to the shared permission mode`, () => {
      const source = readView(business);
      expect(source).toContain('useWarehousePageMode({');
      expect(source).toMatch(new RegExp(`permissionPrefix:\\s*['"]warehouse:${business}['"]`));
      expect(source).toContain('openAdd:');
      expect(source).toContain('openEdit:');
      expect(source).toContain('if (!canList.value) return;');
      expect(source).toContain('v-if="canList"');
      expect(source).not.toContain('onMounted(');
    });
  }
});
