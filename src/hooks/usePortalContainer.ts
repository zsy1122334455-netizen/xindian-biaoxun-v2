import { useState, useEffect } from 'react';

/**
 * 稳定地获取弹层 Portal 的挂载容器（模拟手机壳 #mobile-shell）。
 *
 * 关键：绝不兜底到 document.body。
 * 一旦挂到 body，弹层的 absolute 定位会脱离手机壳、相对整个页面定位，
 * 在桌面预览下就会偏移到浏览器窗口左上角。
 * 宁可短暂返回 null（弹层暂不渲染），也不挂到 body。
 *
 * #mobile-shell 是 App 根容器，组件 useEffect 执行时它必然已存在，
 * 因此首次即可取到；保留一次轮询仅为极端兜底。
 */
export function usePortalContainer(): HTMLElement | null {
  const [container, setContainer] = useState<HTMLElement | null>(
    typeof document !== 'undefined'
      ? document.getElementById('mobile-shell')
      : null
  );

  useEffect(() => {
    if (container) return;

    let cancelled = false;
    let tries = 0;

    const tick = () => {
      if (cancelled) return;
      const el = document.getElementById('mobile-shell');
      if (el) {
        setContainer(el);
        return;
      }
      tries += 1;
      if (tries < 30) {
        requestAnimationFrame(tick);
      }
      // 超过 30 帧仍取不到则放弃，但绝不回退到 body
    };

    tick();

    return () => {
      cancelled = true;
    };
  }, [container]);

  return container;
}
