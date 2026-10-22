export interface TopNavLayoutMetrics {
  containerWidth: number;
  itemWidths: number[];
  overflowWidth: number;
  gap: number;
}

export const calculateVisibleMenuCount = ({
  containerWidth,
  itemWidths,
  overflowWidth,
  gap
}: TopNavLayoutMetrics): number => {
  if (itemWidths.length === 0 || containerWidth <= 0) return 0;

  const allMenusWidth = itemWidths.reduce((total, width) => total + width, 0) + gap * Math.max(0, itemWidths.length - 1);
  if (allMenusWidth <= containerWidth) return itemWidths.length;

  const availableWidth = Math.max(0, containerWidth - overflowWidth - gap);
  let usedWidth = 0;
  let visibleCount = 0;
  for (const width of itemWidths) {
    const nextWidth = usedWidth + (visibleCount > 0 ? gap : 0) + width;
    if (nextWidth > availableWidth) break;
    usedWidth = nextWidth;
    visibleCount += 1;
  }
  return visibleCount;
};

export interface ResizeObserverLike {
  observe(target: Element): void;
  disconnect(): void;
}

export type ResizeObserverFactory = (callback: () => void) => ResizeObserverLike;

export const observeTopNavLayout = (
  element: Element,
  update: () => void,
  createObserver: ResizeObserverFactory
): (() => void) => {
  const observer = createObserver(update);
  observer.observe(element);
  update();
  return () => observer.disconnect();
};
