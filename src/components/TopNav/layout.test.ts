import { describe, expect, it, vi } from 'vitest';
import { calculateVisibleMenuCount, observeTopNavLayout } from './layout';

describe('calculateVisibleMenuCount', () => {
  it('uses the real item widths when all menus fit', () => {
    expect(calculateVisibleMenuCount({ containerWidth: 410, itemWidths: [90, 120, 80], overflowWidth: 100, gap: 6 })).toBe(3);
  });

  it('reserves the overflow menu width before folding items', () => {
    expect(calculateVisibleMenuCount({ containerWidth: 330, itemWidths: [90, 120, 120], overflowWidth: 100, gap: 6 })).toBe(2);
  });

  it('keeps the overflow entry usable in an extremely narrow container', () => {
    expect(calculateVisibleMenuCount({ containerWidth: 80, itemWidths: [90, 120], overflowWidth: 100, gap: 6 })).toBe(0);
  });

  it('recomputes when ResizeObserver reports a layout change and disconnects cleanly', () => {
    const update = vi.fn();
    const disconnect = vi.fn();
    let callback = () => undefined;
    const stop = observeTopNavLayout({} as Element, update, next => {
      callback = next;
      return { observe: vi.fn(), disconnect };
    });
    callback();
    expect(update).toHaveBeenCalledTimes(2);
    stop();
    expect(disconnect).toHaveBeenCalledOnce();
  });
});
