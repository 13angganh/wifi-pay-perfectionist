// T13-01 — useAxisLock: satu gerakan jari menggeser SATU sumbu (tidak diagonal), tidak menangkap bila sumbu tak bisa
// digeser, dan tidak menyambung ke halaman saat sudah di ujung tabel. jsdom tidak punya layout/TouchEvent bersentuhan,
// jadi ukuran digeser lewat defineProperty dan event dibuat manual (touches + timeStamp).
import { describe, it, expect } from 'vitest';
import { render, act } from '@testing-library/react';
import { useRef } from 'react';
import { useAxisLock } from '../useAxisLock';

function Box() {
  const ref = useRef<HTMLDivElement>(null);
  useAxisLock(ref);
  return <div ref={ref} data-testid="box" />;
}

function size(el: HTMLElement, v: { sw: number; cw: number; sh: number; ch: number }) {
  Object.defineProperty(el, 'scrollWidth',  { configurable: true, value: v.sw });
  Object.defineProperty(el, 'clientWidth',  { configurable: true, value: v.cw });
  Object.defineProperty(el, 'scrollHeight', { configurable: true, value: v.sh });
  Object.defineProperty(el, 'clientHeight', { configurable: true, value: v.ch });
}

/** Kirim satu event sentuh; kembalikan apakah event dibatalkan (preventDefault = dikunci oleh hook). */
function touch(el: HTMLElement, type: 'touchstart' | 'touchmove', x: number, y: number, ts: number): boolean {
  const ev = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(ev, 'touches', { value: [{ clientX: x, clientY: y }] });
  Object.defineProperty(ev, 'timeStamp', { value: ts });
  act(() => { el.dispatchEvent(ev); });
  return ev.defaultPrevented;
}

describe('T13-01 useAxisLock', () => {
  it('gerakan diagonal dominan-X hanya menggeser scrollLeft (scrollTop tetap), event dikunci', () => {
    const { getByTestId } = render(<Box />);
    const el = getByTestId('box');
    size(el, { sw: 900, cw: 300, sh: 800, ch: 300 });
    touch(el, 'touchstart', 200, 200, 0);
    const prevented = touch(el, 'touchmove', 150, 190, 16);   // geser kiri 50, atas 10 → dominan X
    expect(prevented).toBe(true);
    expect(el.scrollLeft).toBe(50);
    expect(el.scrollTop).toBe(0);
    touch(el, 'touchmove', 100, 140, 32);                      // terus diagonal: tetap hanya X (sumbu sudah terkunci)
    expect(el.scrollLeft).toBe(100);
    expect(el.scrollTop).toBe(0);
  });

  it('gerakan diagonal dominan-Y hanya menggeser scrollTop (scrollLeft tetap)', () => {
    const { getByTestId } = render(<Box />);
    const el = getByTestId('box');
    size(el, { sw: 900, cw: 300, sh: 800, ch: 300 });
    touch(el, 'touchstart', 200, 200, 0);
    expect(touch(el, 'touchmove', 190, 140, 16)).toBe(true);   // atas 60, kiri 10 → dominan Y
    expect(el.scrollTop).toBe(60);
    expect(el.scrollLeft).toBe(0);
  });

  it('sumbu yang tak bisa digeser TIDAK ditangkap: dibiarkan ke halaman (tidak di-preventDefault)', () => {
    const { getByTestId } = render(<Box />);
    const el = getByTestId('box');
    size(el, { sw: 900, cw: 300, sh: 300, ch: 300 });          // hanya bisa horizontal
    touch(el, 'touchstart', 200, 200, 0);
    expect(touch(el, 'touchmove', 190, 100, 16)).toBe(false);  // vertikal → milik halaman
    expect(el.scrollTop).toBe(0);
    expect(el.scrollLeft).toBe(0);
    touch(el, 'touchmove', 150, 90, 32);                       // gerakan yang sama dibiarkan sampai jari diangkat
    expect(el.scrollLeft).toBe(0);
  });

  it('tidak menyambung ke halaman: di ujung tabel gerakan tetap dikunci (tidak melempar scroll ke halaman)', () => {
    const { getByTestId } = render(<Box />);
    const el = getByTestId('box');
    size(el, { sw: 900, cw: 300, sh: 800, ch: 300 });
    el.scrollLeft = 600;                                       // sudah di ujung kanan
    touch(el, 'touchstart', 200, 200, 0);
    expect(touch(el, 'touchmove', 150, 200, 16)).toBe(true);   // masih ditangkap walau tak bisa bergeser lagi
  });

  it('gerakan di bawah ambang 6 px belum mengunci sumbu apa pun', () => {
    const { getByTestId } = render(<Box />);
    const el = getByTestId('box');
    size(el, { sw: 900, cw: 300, sh: 800, ch: 300 });
    touch(el, 'touchstart', 200, 200, 0);
    expect(touch(el, 'touchmove', 197, 198, 16)).toBe(false);
    expect(el.scrollLeft).toBe(0);
    expect(el.scrollTop).toBe(0);
  });
});
