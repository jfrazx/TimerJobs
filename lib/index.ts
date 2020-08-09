import { ITimerJobs, ITimerJobsOptions, TimerCallback } from './interfaces';
import { isInteger, not, isObject, isFunction } from './helpers';
import { EmitLevels } from './emit-level';
import { Options } from './options';
import { Emitter } from './emitter';

export * from './emit-level';
export * from './interfaces';

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
  timer: NodeJS.Timeout = null;

  options: Options;

  private _emitter: Emitter;
  private _countdown: number;
  private startWait: number = 0;

  static timers: TimerJobs[] = [];

  constructor(options?: ITimerJobsOptions);
  constructor(callback?: TimerCallback, options?: ITimerJobsOptions);
  constructor(callback?: any, options: ITimerJobsOptions = {}) {
    if (isObject(callback)) {
      options = callback;
      callback = null;
    }

    TimerJobs.timers.push(this);

    this.options = new Options(options);
    this._emitter = new Emitter(this, this.options);
    const { countdown, autoStart } = this.options;

    this.countdown = countdown;
    this.callback = callback;

    if (autoStart) {
      this.start();
    }
  }

  static set emitter(value: any) {
    Emitter.emitter = value;
  }

  static get emitter() {
    return Emitter.emitter;
  }

  /**
   * Start the timer unless it is already started
   *
   * @memberof TimerJobs
   */
  public start(): TimerJobs {
    if (!this.timer) {
      if (not(isFunction(this.callback))) {
        throw new Error('TimerJobs Error: a callback must be provided');
      }

      const opts = this.options;
      this.startWait = Date.now();
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

    return this;
  }

  private emit(event: string, error?: Error, ...args: any[]): void {
    this._emitter.emit(event, {
      error,
      args,
    });
  }

  /**
   * Is the timer stopped?
   *
   * @returns {boolean}
   * @memberof TimerJobs
   */
  get isStopped(): boolean {
    return this.timer === null;
  }

  /**
   * Is the timer started?
   *
   * @returns {boolean}
   * @memberof TimerJobs
   */
  get isStarted(): boolean {
    return Boolean(this.timer);
  }

  /**
   * Stop the Timer
   *
   * @memberof TimerJobs
   */
  public stop(): TimerJobs {
    if (this.timer) {
      clearInterval(this.timer);

      this.emit('jobStop', null, this);
      this.timer = null;
      this.startWait = 0;
    }

    return this;
  }

  /**
   * Restart the timer, only if it has previous run
   *
   * @param {number} [interval]
   * @memberof TimerJobs
   */
  public restart(interval?: number): TimerJobs {
    if (isInteger(interval) && interval > 1) {
      this.options.interval = interval;
    }

    if (this.hasStarted) {
      this.stop();
      this.start();
    }

    return this;
  }

  /**
   * Determine wait time until next execution in milliseconds
   *
   * @returns {number}
   * @memberof TimerJobs
   */
  get waitTime(): number {
    if (!this.startWait) {
      return this.startWait;
    }

    return this.startWait + this.options.interval - Date.now();
  }

  /**
   * Retrieve the current value of countdown
   *
   * @readonly
   * @type {number}
   * @memberof TimerJobs
   */
  get countdown(): number {
    return this._countdown;
  }

  /**
   * Set countdown to a new integer
   *
   * @memberof TimerJobs
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

  /**
   * Remove the passed timer
   *
   * @static
   * @param {TimerJobs} timer
   * @memberof TimerJobs
   */
  public static removeTimer(timer: TimerJobs): void {
    this.timers = this.timers.filter((t) => t !== timer);
  }

  /**
   * Stop the timer if it's running and remove the timer from the timers array
   *
   * @memberof TimerJobs
   */
  dispose() {
    this.stop();
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
      this.startWait = Date.now();

      const args = this.callback.length ? [this.done.bind(this)] : [];

      try {
        this.callback.call(this.options.context, ...args);
      } catch (error) {
        this.done(error);
      }
    }
  }

  /**
   * Function sent to timer callback, called when finished
   *
   * @private
   * @param {Error} [err]
   * @param {...any[]} args
   * @memberof TimerJobs
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

  /**
   * -------- Sugar Section -------------
   */
  /**
   * Start the interval setting process
   * @param <number> interval: The number to assign
   * @return <TimerJobs>
   */
  private _not: boolean;
  private _event: string;
  private _interval = 0;

  public after(interval: number, resetInterval = true): TimerJobs {
    if (resetInterval) {
      this.options.interval = 0;
    }
    this._interval = interval;
    return this;
  }
  public and(interval: number): TimerJobs {
    return this.after(interval, false);
  }
  /**
   * @todo: thinking of alternate uses
   */
  public every(interval: number, resetInterval = true): TimerJobs {
    return this.after(interval, resetInterval);
  }

  /**
   * Alternative, chainable, method for assigning emit_level
   * @param <number> level: The integer to assign
   * @return <TimerJobs>
   */
  public level(level: EmitLevels): TimerJobs {
    this.emitLevel = level;
    return this;
  }

  /**
   * Alternative, chainable, method for setting countdown
   * @param <number> countdown: The number to set
   * @return <TimerJobs>
   */
  public times(countdown: number): TimerJobs {
    this.countdown = countdown;
    return this;
  }

  /**
   * Alternative, chainable, method for assigning a namespace
   * @param <string> namespace: The namespace to assign
   * @return <TimerJobs>
   */
  public namespace(namespace: string): TimerJobs {
    this.options.namespace = namespace;
    return this;
  }
  public namespacing(namespace: string): TimerJobs {
    return this.namespace(namespace);
  }

  /**
   * Alternative, chainable, method for assigning a reference
   * @param <string> reference: The reference to assign
   */
  public reference(reference: string): TimerJobs {
    this.options.reference = reference;
    return this;
  }
  public referencing(reference: string): TimerJobs {
    return this.reference(reference);
  }

  /**
   * Alternative, chainable, method for infinite
   * @param <number> countdown: An optional number to assign to countdown
   * @return <TimerJobs>
   */
  public forever(countdown?: number): TimerJobs {
    this.infinite = this._not ? (this._not = false) : true;

    countdown && this.times(countdown);

    return this;
  }

  /**
   * Alternative, chainable, method for setting the event emitter to be used
   * @param <any> emitter: The emitter to utilize
   * @return <TimerJobs>
   * @todo reinitialize listeners
   */
  public using(emitter: any): TimerJobs {
    this._emitter.emitter = emitter;
    return this;
  }

  /**
   * Alternative, chainable, method for setting the main timer callback
   * @param <Function> callback: The callback to utilize
   * @return <TimerJobs>
   */
  public do(callback: TimerCallback): TimerJobs {
    this.callback = callback;
    return this;
  }
  public execute(callback: TimerCallback): TimerJobs {
    return this.do(callback);
  }

  /**
   * Alternative, chainable, method for assigning events and callbacks
   * @param <string> event: The event to react
   * @param <Function> callback: The optional callback
   * @return <TimerJobs>
   */
  public on(event: string, callback?: Function): TimerJobs {
    const _this: any = this;

    _this.options[`${this._event}On`] = event;
    _this.options[`${this._event}Callback`] = callback;
    _this._emitter[`${this._event}Setup`]();

    return this;
  }

  get blocking(): TimerJobs {
    this.options.blocking = this._not ? (this._not = false) : true;
    return this;
  }
  get blocks(): TimerJobs {
    return this.blocking;
  }

  /**
   * Sugar for immediate
   */
  get immediate(): TimerJobs {
    this.options.immediate = this._not ? (this._not = false) : true;
    return this;
  }
  get immediately(): TimerJobs {
    return this.immediate;
  }

  /**
   * Sugar negation
   */
  get not(): TimerJobs {
    this._not = true;
    return this;
  }

  /**
   * Sugar for ignoreErrors
   */
  get ignore(): TimerJobs {
    this.options.ignoreErrors = this._not ? (this._not = false) : true;
    return this;
  }
  get ignoring(): TimerJobs {
    return this.ignore;
  }

  /**
   * Sugar for autoStart
   */
  get automatically(): TimerJobs {
    const auto = this._not ? (this._not = false) : true;
    this.options.autoStart = auto;

    if (auto) {
      setTimeout(() => this.start(), 0);
    }

    return this;
  }
  get automatic() {
    return this.automatically;
  }

  /**
   * Sugar for setting countdown
   */
  get once(): TimerJobs {
    this.infinite = false;
    this.countdown = 1;

    return this;
  }

  get twice(): TimerJobs {
    this.once;
    this.countdown++;
    return this;
  }

  get thrice(): TimerJobs {
    this.twice;
    this.countdown++;
    return this;
  }

  /**
   * Sugar for infinite
   */
  get repeat(): TimerJobs {
    this.infinite = this._not ? (this._not = false) : true;
    return this;
  }
  get repeating(): TimerJobs {
    return this.repeat;
  }

  /**
   * Interval fun
   */
  get week(): TimerJobs {
    this._interval = 1;
    return this.weeks;
  }
  get weeks(): TimerJobs {
    this._interval *= 7;
    return this.days;
  }
  get day(): TimerJobs {
    this._interval = 1;
    return this.days;
  }
  get days(): TimerJobs {
    this._interval *= 24;
    return this.hours;
  }
  get hour(): TimerJobs {
    this._interval = 1;
    return this.hours;
  }
  get hours(): TimerJobs {
    this._interval *= 60;
    return this.minutes;
  }
  get minute(): TimerJobs {
    this._interval = 1;
    return this.minutes;
  }
  get minutes(): TimerJobs {
    this._interval *= 60;
    return this.seconds;
  }
  get second(): TimerJobs {
    this.interval += 1000;
    return this;
  }
  get seconds(): TimerJobs {
    this._interval *= 1000;
    return this.milliseconds;
  }
  get milliseconds(): TimerJobs {
    this.interval += this._interval;
    return this;
  }

  /**
   * Event helpers
   */
  get starting(): TimerJobs {
    this._event = 'start';
    return this;
  }
  get stopping(): TimerJobs {
    this._event = 'stop';
    return this;
  }
  get restarting(): TimerJobs {
    this._event = 'restart';
    return this;
  }
}
