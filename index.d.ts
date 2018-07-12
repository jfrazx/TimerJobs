export declare class TimerJobs implements ITimerJobs {
  autoStart: boolean;
  blocking: boolean;
  busy: boolean;
  callback: Function;
  delimiter: string;
  emitter: any;
  emitLevel: number;
  errors: Error[];
  executions: number;
  ignoreErrors: boolean;
  immediate: boolean;
  interval: number;
  infinite: boolean;
  namespace: string;
  reference: string;
  restartOn: string;
  restartCallback: Function;
  startOn: string;
  startCallback: Function;
  stopOn: string;
  stopCallback: Function;
  timer: number;
  private _countdown;
  private __countdown;
  private LEVEL;
  private start_wait;
  private hasStarted;
  static timers: TimerJobs[];
  static emitter: any;
  constructor(options: ITimerJobsOptions, callback: (done: Function) => void);
  constructor(callback: (done: Function) => void);
  start(): void;
  stopped(): boolean;
  started(): boolean;
  stop(): void;
  restart(interval?: number): void;
  waitTime(): number;
  countdown: number;
  static findTimers<K extends keyof TimerJobs>(
    property: K,
    match: TimerJobs[K]
  ): TimerJobs[];
  static removeTimers(timers: TimerJobs, stop: boolean): void;
  static removeTimers(timers: TimerJobs[], stop: boolean): void;
  private go();
  private done(err?, ...args);
  private setupListeners();
  private isInteger(value);
}
export interface ITimerJobs extends ITimerJobsOptions {
  executions: number;
  errors: Error[];
  busy: boolean;
  timer: number;
  restart(interval?: number): void;
  start(): void;
  stop(): void;
  started(): boolean;
  stopped(): boolean;
  waitTime(): number;
}
export interface ITimerJobsOptions {
  autoStart?: boolean;
  blocking?: boolean;
  countdown?: number;
  delimiter?: string;
  emitLevel?: number;
  emitter?: any;
  ignoreErrors?: boolean;
  immediate?: boolean;
  interval?: number;
  infinite?: boolean;
  namespace?: string;
  reference?: string;
  stopOn?: string;
  stopCallback?: Function;
  startOn?: string;
  startCallback?: Function;
  restartOn?: string;
  retartCallback?: Function;
}
