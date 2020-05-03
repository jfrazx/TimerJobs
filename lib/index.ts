import {
  ITimerJobs,
  ITimerJobsOptions,
  TimerCallback,
  EmitLevels,
} from './interfaces';
import { isInteger, not, isObject, isFunction } from './helpers';
import { Options } from './options';
import { Emitter } from './emitter';

type TimerPredicate = (
  timer: TimerJobs,
  index: number,
  timers: TimerJobs[],
) => boolean;

export class TimerJobs implements ITimerJobs {
  busy = false;
  callback: Function;
  errors: Error[] = [];
  executions: number = 0;
  hasStarted: boolean = false;

  private options: Options;
  private _emitter: Emitter;

  // NodeJS.Timer id
  timer: NodeJS.Timeout;

  // manipulate internally
  private _countdown: number;

  private start_wait: number = 0;

  // array of all timers
  static timers: TimerJobs[] = [];

  constructor(options?: ITimerJobsOptions);
  constructor(callback?: TimerCallback, options?: ITimerJobsOptions);
  constructor(callback?: any, options: ITimerJobsOptions = {}) {
    if (isObject(callback)) {
      options = callback;
      callback = null;
    }

    if (not(isFunction(callback))) {
      throw new Error('TimerJobs Error: a callback must be provided');
    }

    this.options = new Options(options);
    this._emitter = new Emitter(this, this.options);
    const { countdown, autoStart } = this.options;

    // if we don't run forever, we'll run countdown times
    this.countdown = countdown;

    // the jobtimer
    this.timer = null;
    this.busy = false;

    this.callback = callback;

    if (autoStart) {
      this.start();
    }

    TimerJobs.timers.push(this);
  }

  static set emitter(value: any) {
    Emitter.emitter = value;
  }

  static get emitter() {
    return Emitter.emitter;
  }

  /**
   * Start the timer unless it is already started
   * @return <void>
   */
  public start(): void {
    if (!this.timer) {
      const opts = this.options;
      this.start_wait = Date.now();
      this.hasStarted = true;

      if (this.countdown < 1) {
        this.countdown = opts.countdown;
      }

      this.timer = setInterval(this.go.bind(this), opts.interval);
      this.emit('jobStart', null, this);

      if (opts.immediate) {
        this.go();
      }
    }
  }

  private emit(event: string, error?: Error, ...args: any[]): void {
    this._emitter.emit(event, {
      error,
      args,
    });
  }

  /**
   * Is the timer stopped?
   * @return <Boolean>
   */
  public stopped(): boolean {
    return this.timer === null;
  }

  /**
   * Is the timer started?
   * @return <boolean>
   */
  public started(): boolean {
    return Boolean(this.timer);
  }

  /**
   * Stop the Timer
   * @return <void>
   */
  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);

      this.emit('jobStop', null, this);
      this.timer = null;
      this.start_wait = 0;
    }
  }

  /**
   * Restart the timer, only if it has previous run
   * @param <number> interval: The new optional interval to assign
   * @return <void>
   */
  public restart(interval?: number): void {
    if (isInteger(interval) && interval > 1) {
      this.options.interval = interval;
    }

    if (this.hasStarted) {
      this.stop();
      this.start();
    }
  }

  /**
   * Determine wait time until next execution in milliseconds
   * @return <number>
   */
  public waitTime(): number {
    if (!this.start_wait) {
      return this.start_wait;
    }

    return this.start_wait + this.options.interval - Date.now();
  }

  /**
   * Retrieve the current value of countdown
   * @return <number>
   */
  get countdown(): number {
    return this._countdown;
  }

  /**
   * Set countdown to a new integer
   * @param <number> value: The new value for countdown
   * @return <void>
   */
  set countdown(value: number) {
    this._countdown = this.options.countdown =
      value && value > 1 ? Math.floor(value) : 1;
  }

  set emitLevel(value: EmitLevels) {
    this.options.emitLevel = value;
  }

  get emitLevel(): EmitLevels {
    return this.options.emitLevel;
  }

  set infinite(value: boolean) {
    this.options.infinite = value;
  }

  get infinite() {
    return this.options.infinite;
  }

  set interval(value: number) {
    this.options.interval = value;
  }

  get interval() {
    return this.options.interval;
  }
  get emitter() {
    return this._emitter.emitter;
  }

  /**
   * Find multiple timers based on predicate
   *
   * @static
   * @param {TimerPredicate} predicate
   * @returns {TimerJobs[]}
   * @memberof TimerJobs
   */
  public static findTimers(predicate: TimerPredicate): TimerJobs[] {
    return this.timers.filter(predicate);
  }

  /**
   * Remove Timers from timers array
   *
   * @static
   * @param {TimerPredicate} predicate
   * @returns {TimerJobs[]}
   * @memberof TimerJobs
   */
  public static removeTimers(predicate: TimerPredicate): TimerJobs[] {
    const timersToRemove = this.timers.filter(predicate);

    this.timers = this.timers.filter((timer) =>
      not(timersToRemove.includes(timer)),
    );

    return timersToRemove;
  }

  public static removeTimer(timer: TimerJobs): void {
    this.timers = this.timers.filter((t) => t !== timer);
  }

  dispose() {
    TimerJobs.removeTimer(this);
  }

  /**
   * Private method to wrap callback function
   * @return <void>
   * @private
   */
  private go(): void {
    if (!this.busy || !this.options.blocking) {
      this.busy = true;

      this.emit('jobBegin', null, this);

      this.executions++;
      this.start_wait = Date.now();
      this.callback(this.done.bind(this));
    }
  }

  /**
   * Function sent to timer callback, called when finished
   * @param <Error> err: Error object sent back if something went wrong
   * @param <any> args: any additional parameters sent back
   * @return <void>
   * @private
   */
  private done(err?: Error, ...args: any[]): void {
    const { ignoreErrors, infinite } = this.options;
    this.emit('jobEnd', null, this, ...args);

    if (err) {
      this.errors.push(err);
      this.emit('jobError', err, this, this.errors);

      if (not(ignoreErrors)) {
        this.stop();
      }
    }

    if (not(infinite)) {
      if (--this._countdown < 1) {
        this.emit('jobComplete', null, this);
        this.stop();
      }
    }

    this.busy = false;
  }
}
