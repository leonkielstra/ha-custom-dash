/** Serialized commands with coalescing and bounded optimistic confirmation.
 * Service completion is not a state acknowledgement. Ignore stale snapshots until
 * the requested value arrives; then let subsequent external changes flow through.
 */
export class ConfirmedCommand<T> {
  value?: T;
  error = '';
  sending = false;
  private queued?: T;
  private actual?: T;
  private timer?: ReturnType<typeof setTimeout>;
  private generation = 0;
  private cancelRequest?: () => void;
  constructor(
    private execute: (value: T) => Promise<unknown>,
    private matches: (actual: T, wanted: T) => boolean,
    private changed: () => void,
    private timeout = 5000,
  ) {}
  observe(actual: T) {
    this.actual = actual;
    if (
      !this.sending &&
      this.value !== undefined &&
      this.matches(actual, this.value)
    ) {
      this.clearTimer();
      this.value = undefined;
      this.changed();
    }
  }
  submit(value: T) {
    this.clearTimer();
    this.error = '';
    this.value = value;
    this.queued = value;
    this.changed();
    if (!this.sending) void this.flush();
  }
  private async flush() {
    const generation = this.generation;
    this.sending = true;
    while (this.queued !== undefined) {
      const target = this.queued;
      this.queued = undefined;
      let cancelDeadline = () => {};
      try {
        const deadline = new Promise<never>((_, reject) => {
          const timer = setTimeout(
            () => reject(new Error('Service timed out')),
            this.timeout,
          );
          cancelDeadline = () => {
            clearTimeout(timer);
            reject(new Error('Cancelled'));
          };
          this.cancelRequest = cancelDeadline;
        });
        await Promise.race([this.execute(target), deadline]);
      } catch {
        if (generation !== this.generation) return;
        if (this.queued === undefined) {
          this.value = undefined;
          this.error = 'Could not update. Please try again.';
        }
      } finally {
        cancelDeadline();
        if (this.cancelRequest === cancelDeadline)
          this.cancelRequest = undefined;
      }
      if (generation !== this.generation) return;
    }
    this.sending = false;
    if (this.value !== undefined) {
      if (this.actual !== undefined && this.matches(this.actual, this.value))
        this.value = undefined;
      else
        this.timer = setTimeout(() => {
          this.value = undefined;
          this.error = 'No confirmation received. Showing reported state.';
          this.changed();
        }, this.timeout);
    }
    this.changed();
  }
  private clearTimer() {
    clearTimeout(this.timer);
    this.timer = undefined;
  }
  reset() {
    this.generation++;
    this.cancelRequest?.();
    this.cancelRequest = undefined;
    this.clearTimer();
    this.queued = undefined;
    this.value = undefined;
    this.actual = undefined;
    this.sending = false;
    this.error = '';
  }
}
