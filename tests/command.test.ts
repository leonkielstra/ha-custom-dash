import { afterEach, expect, it, vi } from 'vitest';
import { ConfirmedCommand } from '../src/ha/command';
const tick = async () => {
  await Promise.resolve();
  await Promise.resolve();
};
afterEach(() => vi.useRealTimers());
it('ignores stale state, then accepts confirmation and later external changes', async () => {
  const command = new ConfirmedCommand(
    vi.fn().mockResolvedValue(undefined),
    (a: number, b) => a === b,
    vi.fn(),
  );
  command.observe(10);
  command.submit(50);
  await tick();
  command.observe(10);
  expect(command.value).toBe(50);
  command.observe(50);
  expect(command.value).toBeUndefined();
  command.observe(20);
  expect(command.value).toBeUndefined();
  command.reset();
});
it('serializes and coalesces newer changes while a service is pending', async () => {
  let resolve!: () => void;
  const execute = vi
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise<void>((done) => {
          resolve = done;
        }),
    )
    .mockResolvedValue(undefined);
  const command = new ConfirmedCommand(
    execute,
    (a: number, b) => a === b,
    vi.fn(),
  );
  command.submit(20);
  command.submit(40);
  command.submit(80);
  expect(execute.mock.calls).toEqual([[20]]);
  resolve();
  await tick();
  expect(execute.mock.calls).toEqual([[20], [80]]);
  expect(command.value).toBe(80);
  command.reset();
});
it('handles confirmation that arrives before the service promise resolves', async () => {
  const command = new ConfirmedCommand(
    vi.fn().mockResolvedValue(undefined),
    (a: number, b) => a === b,
    vi.fn(),
  );
  command.submit(60);
  command.observe(60);
  await tick();
  expect(command.value).toBeUndefined();
});
it('rolls back rejected services and unconfirmed successful requests', async () => {
  vi.useFakeTimers();
  const command = new ConfirmedCommand(
    vi.fn().mockRejectedValue(new Error('Failure')),
    (a: number, b) => a === b,
    vi.fn(),
  );
  command.submit(60);
  await tick();
  expect(command.value).toBeUndefined();
  expect(command.error).toContain('Could not update');
  const waiting = new ConfirmedCommand(
    vi.fn().mockResolvedValue(undefined),
    (a: number, b) => a === b,
    vi.fn(),
    100,
  );
  waiting.submit(60);
  await tick();
  await vi.advanceTimersByTimeAsync(100);
  expect(waiting.value).toBeUndefined();
  expect(waiting.error).toContain('No confirmation');
});
it('discards an old request after reconfiguration/disconnection and clears timers', async () => {
  vi.useFakeTimers();
  let resolve!: () => void;
  const execute = vi
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise<void>((done) => {
          resolve = done;
        }),
    )
    .mockResolvedValue(undefined);
  const command = new ConfirmedCommand(
    execute,
    (a: number, b) => a === b,
    vi.fn(),
  );
  command.submit(10);
  command.reset();
  command.submit(90);
  await tick();
  resolve();
  await tick();
  expect(command.value).toBe(90);
  command.reset();
  expect(vi.getTimerCount()).toBe(0);
});
it('bounds a service that never resolves and lets the user retry', async () => {
  vi.useFakeTimers();
  const execute = vi
    .fn()
    .mockImplementationOnce(() => new Promise(() => {}))
    .mockResolvedValue(undefined);
  const command = new ConfirmedCommand(
    execute,
    (a: number, b) => a === b,
    vi.fn(),
    100,
  );
  command.submit(40);
  await vi.advanceTimersByTimeAsync(100);
  expect(command.value).toBeUndefined();
  expect(command.sending).toBe(false);
  expect(command.error).toContain('Could not update');
  command.submit(80);
  await vi.advanceTimersByTimeAsync(0);
  command.observe(80);
  expect(command.error).toBe('');
  expect(command.value).toBeUndefined();
  command.reset();
});
