import { inRange, isFunction, isInteger, isString, not } from './helpers';
import {
  ITimerJobs,
  ITimerJobsOptions,
  TimerCallback,
} from './timerjobs.interface';

import * as events from 'eventemitter2';

const noop = () => {};

export class TimerJobs implements ITimerJobs {
  autoStart: boolean;
  blocking: boolean;
  busy: boolean;
  callback: Function;
  delimiter: string;
  emitter: any;
  errors: Error[] = [];
  executions: number = 0;

  ignoreErrors: boolean;
  immediate: boolean;
  interval: number;
  infinite: boolean;

  namespace: string;
  reference: string;

  // restart the timer on event w/ callback
  restartOn: string;
  restartCallback: Function;

  // start the timer on event w/ callback
  startOn: string;
  startCallback: Function;

  // stop the timer on event w/ callback
  stopOn: string;
  stopCallback: Function;

  // NodeJS.Timer id
  timer: NodeJS.Timeout;

  // manipulate internally
  private _countdown: number;
  // track original value
  private __countdown: number;
  private LEVEL: { [level: string]: string };
  private start_wait: number = 0;
  private hasStarted: boolean = false;

  private _emitLevel: number;
  // array of all timers
  static timers: TimerJobs[] = [];
  // a default emitter
  static emitter: any;

  constructor(options: ITimerJobsOptions, callback: TimerCallback);
  constructor(callback: TimerCallback);
  constructor(options?: any, callback?: TimerCallback) {
    if (isFunction(options)) {
      callback = options;
      options = {} as ITimerJobsOptions;
    }

    if (not(isFunction(callback))) {
      throw new Error('TimerJobs Error: a callback must be provided');
    }

    // if the job is being performed, should we block another from starting?
    this.blocking =
      options.blocking === undefined ? true : Boolean(options.blocking);

    // interval between job executions
    this.interval = isInteger(options.interval) ? options.interval : 3000;

    // autostart or ..?
    this.autoStart = Boolean(options.autoStart);

    // start this job without waiting for interval
    this.immediate = Boolean(options.immediate);

    // should we ignore errors?
    this.ignoreErrors = Boolean(options.ignoreErrors);

    // run forever or countdown times?
    this.infinite =
      options.infinite === undefined ? true : Boolean(options.infinite);
    // if we don't run forever, we'll run countdown times
    this.countdown = options.countdown;

    // a string reference for this timerjob
    this.reference = options.reference || 'timer';

    // if we operate in multiple namespace and want to distinguish between them
    this.namespace = isString(options.namespace) ? options.namespace : '';

    // should we listen for an event to stop the timer on?
    this.stopOn = options.stopOn || null;
    // if stopOn is set we can callback if that event occurs
    this.stopCallback = isFunction(options.stopCallback)
      ? options.stopCallback
      : noop;

    // should we listen for an event to start the timer on?
    this.startOn = options.startOn || null;
    // if startOn is set we can callback if that event occurs
    this.startCallback = isFunction(options.startCallback)
      ? options.startCallback
      : noop;

    // should we listen for an event to restart the timer on?
    this.restartOn =
      options.restartOn && options.restartOn.trim().length
        ? options.restartOn
        : null;
    // if restartOn is set we can callback if that event occurs
    this.restartCallback = isFunction(options.restartCallback)
      ? options.restartCallback
      : noop;

    // a delimiter for emitLevel and the default eventemitter2
    this.delimiter = options.delimiter || '::';

    // the eventemitter to utilize
    this.emitter =
      options.emitter ||
      TimerJobs.emitter ||
      new events.EventEmitter2({ wildcard: true, delimiter: this.delimiter });

    // the jobtimer
    this.timer = null;
    this.busy = false;

    this.callback = callback;

    /**
     * Emit level
     * @default <number> 1
     * 0: disabled
     * 1: job<task>
     * 2: job<task> + <namespace>
     * 3: job<task> + <namespace> + <reference>
     * 4: job<task> + <reference>
     */
    this.emitLevel = options.emitLevel;

    // protecting you from yourself
    if (!this.namespace.length) {
      if (this.emitLevel === 2) {
        this.emitLevel = 1;
      } else if (this.emitLevel === 3) {
        this.emitLevel = 4;
      }
    }

    this.LEVEL = {
      1: '',
      2: this.delimiter + this.namespace,
      3: this.delimiter + this.namespace + this.delimiter + this.reference,
      4: this.delimiter + this.reference,
    };

    // keep track of original so we can reassign if the timer gets restarted
    // this._countdown = this.countdown;

    this.setupListeners();

    if (this.autoStart) {
      this.start();
    }

    TimerJobs.timers.push(this);
  }

  /**
   * Start the timer unless it is already started
   * @return <void>
   */
  public start(): void {
    if (!this.timer) {
      this.start_wait = Date.now();
      this.hasStarted = true;

      if (this.countdown < 1) {
        this.countdown = this.__countdown;
      }

      this.timer = setInterval(this.go.bind(this), this.interval);

      if (this.emitLevel) {
        this.emitter.emit(`jobStart${this.LEVEL[this.emitLevel]}`, this);
      }

      if (this.immediate) {
        this.go();
      }
    }
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

      if (this.emitLevel) {
        this.emitter.emit(`jobStop${this.LEVEL[this.emitLevel]}`, this);
      }

      this.timer = null;
      this.start_wait = 0;
    }
  }

  /**
   * Restart the timer, only if it has previous run
   * @param <number> interval: The new optional interval to assign
   * @return <void>
   */
  public restart(interval: number = this.interval): void {
    if (not(isInteger(interval)) || interval < 1) {
      interval = this.interval;
    }

    this.interval = interval;

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

    return this.start_wait + this.interval - Date.now();
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
    this.__countdown = this._countdown =
      value && value > 1 ? Math.floor(value) : 1;
  }

  set emitLevel(value: number) {
    this._emitLevel = isInteger(value) && inRange(value, 0, 5) ? value : 1;
  }

  get emitLevel(): number {
    return this._emitLevel;
  }

  /**
   * Find Timers based on property and value
   * @param <string> property: The property to match
   * @param <string> match: What the property value should match
   * @return <TimerJobs[]>
   */
  public static findTimers<K extends keyof TimerJobs>(
    property: K,
    match: TimerJobs[K]
  ): TimerJobs[] {
    const timers: TimerJobs[] = [];

    this.timers.forEach(function(timer) {
      if (timer[property] === match) {
        timers.push(timer);
      }
    });

    return timers;
  }

  /**
   * Remove Timers from timers array
   * @param <TimerJobs> timers: The timer(s) to remove
   * @param <boolean> stop: Stop the timer(s) being removed
   * @return <void>
   */
  public static removeTimers(timers: TimerJobs, stop: boolean): void;
  public static removeTimers(timers: TimerJobs[], stop: boolean): void;
  public static removeTimers(timers: any, stop: boolean = true): void {
    if (!Array.isArray(timers)) {
      timers = [timers];
    }

    timers.forEach((timer: TimerJobs) => {
      const index = TimerJobs.timers.indexOf(timer);

      if (index >= 0) {
        TimerJobs.timers.splice(index, 1);
        stop && timer.stop();
      }
    });
  }

  /**
   * Private method to wrap callback function
   * @return <void>
   * @private
   */
  private go(): void {
    if (!this.busy || !this.blocking) {
      this.busy = true;

      if (this.emitLevel) {
        this.emitter.emit(`jobBegin${this.LEVEL[this.emitLevel]}`, this);
      }

      ++this.executions;
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
    if (this.emitLevel) {
      const emission = `jobEnd${this.LEVEL[this.emitLevel]}`;
      this.emitter.emit.apply(this.emitter, [emission, this].concat(args));
    }

    if (err) {
      let level: string;
      this.errors.push(err);

      if (this.emitLevel) {
        level = this.LEVEL[this.emitLevel];
      } else {
        level = this.LEVEL[1];
      }

      this.emitter.emit(`jobError${level}`, err, this, this.errors);

      if (!this.ignoreErrors) {
        this.stop();
      }
    }

    if (!this.infinite) {
      if (--this._countdown < 1) {
        if (this.emitLevel) {
          this.emitter.emit(`jobComplete${this.LEVEL[this.emitLevel]}`, this);
        }

        this.stop();
      }
    }

    this.busy = false;
  }

  /**
   * Setup start, stop and restart listeners, if they exist
   * @return <void>
   * @private
   */
  private setupListeners(): void {
    // do we want the timer to listen for and stop on a particular event?
    if (this.stopOn) {
      this.emitter.on(this.stopOn, (...rest: any[]) => {
        this.stop();

        // callback to perform if the stop on event fires
        this.stopCallback.call(null, ...rest);
      });
    }

    /**
     * Start the timer on event
     * @note callback only fires if the timer was not running
     */
    if (this.startOn) {
      this.emitter.on(this.startOn, (...rest: any[]) => {
        if (this.stopped()) {
          this.start();

          this.startCallback.call(null, ...rest);
        }
      });
    }

    /**
     * Restart the timer on event
     * @note callback only fires if the timer was not running
     */
    if (this.restartOn) {
      this.emitter.on(this.restartOn, (...rest: any[]) => {
        if (this.hasStarted) {
          this.restart();

          this.restartCallback.call(null, ...rest);
        }
      });
    }
  }
}
