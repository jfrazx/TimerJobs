export interface ITimerJobs extends ITimerJobsOptions {
  /**
   * The number of times the timer has executed
   */
  executions: number;
  /**
   * Any Errors the callback encounters are pushed into the errors array
   */
  errors: Error[];
  /**
   * Are we busy executing a task?
   */
  busy: boolean;
  /**
   * The timer to which all this is possible
   */
  timer: NodeJS.Timeout;

  restart(interval?: number): void;
  start(): void;
  stop(): void;
  started(): boolean;
  stopped(): boolean;
  waitTime(): number;
}

export interface ITimerJobsOptions {
  /**
   * Should the timer autostart?
   * @default false
   */
  autoStart?: boolean;
  /**
   * Should the timer block if the last execution has not finished?
   * @default true
   */
  blocking?: boolean;
  /**
   * Number of times the job should execute, only valid if infinite is false
   * @default 1
   */
  countdown?: number;
  /**
   * The delimiter used to segment namespaces
   * @default '::'
   */
  delimiter?: string;
  /**
   * At what level should we emit job events
   * @default 1
   */
  emitLevel?: number;
  /**
   * The eventemitter which emits events, can pass your own emitter to better integrate
   * @default EventEmitter2
   */
  emitter?: any;
  /**
   * Should we ignore errors?
   * @default true
   */
  ignoreErrors?: boolean;
  /**
   * Should we execute the task immediately upon start
   * @default false
   */
  immediate?: boolean;
  /**
   * The interval in milliseconds which the job should be performed
   * @default 3000
   */
  interval?: number;
  /**
   * Should the timer run forever?
   * @default true
   */
  infinite?: boolean;
  /**
   * A way to identify the namespace of this timer
   * @default ''
   */
  namespace?: string;
  /**
   * A reference to this particular timer
   * @default 'timer'
   */
  reference?: string;
  /**
   * The event that should stop the timer
   * @default null
   */
  stopOn?: string;
  /**
   * The callback which executes when the event stops the timer
   * @default null
   */
  stopCallback?: Function;
  /**
   * The event that should start the timer
   * @default null
   */
  startOn?: string;
  /**
   * The callback which executes when the event starts the timer
   * @default null
   */
  startCallback?: Function;
  /**
   * The event that should restart the timer (ignored if the timer is running)
   * @default null
   */
  restartOn?: string;
  /**
   * The callback which executes when the event restarts the timer
   * @default null
   */
  retartCallback?: Function;
}

export interface TimerCallback {
  (done: Function): void;
}
