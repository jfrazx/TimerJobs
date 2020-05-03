import { EventEmitter2 } from 'eventemitter2';
import { EmitLevels } from './interfaces';
import { TimerJobs } from './index';
import { Options } from './options';

interface Levels {
  [key: number]: string;
}

interface EmitArgs {
  error?: Error;
  args?: any[];
}

export class Emitter {
  level: number;

  static emitter: EventEmitter2;
  emitter: EventEmitter2;

  constructor(private readonly timer: TimerJobs, private options: Options) {
    this.emitter =
      options.emitter ??
      Emitter.emitter ??
      new EventEmitter2({ wildcard: true, delimiter: options.delimiter });

    this.setupListeners();
  }

  emit(action: string, { error = null, args = [] }: EmitArgs = {}): void {
    if (this.shouldEmit(this.options.emitLevel, error)) {
      const event = this.buildEvent(action, this.options.emitLevel, error);
      // console.log('calling emit on emitter', action, error, args, event);

      if (error) {
        args.unshift(error);
      }

      this.emitter.emit.call(this.emitter, event, ...args);
    }
  }

  private shouldEmit(level: EmitLevels, error: Error | null): boolean {
    return Boolean(level) || Boolean(error);
  }

  private buildEvent(
    event: string,
    level: EmitLevels,
    error: Error | null,
  ): string {
    const actualLevel = !level && error ? 1 : level;

    return event + this.getLevel(actualLevel);
  }

  private get levels() {
    const { delimiter, namespace, reference } = this.options;

    const levels: Levels = {
      1: '',
      2: delimiter + namespace,
      3: delimiter + reference,
      4: delimiter + namespace + delimiter + reference,
    };

    return levels;
  }

  getLevel(level: EmitLevels): string {
    return this.levels[level];
  }

  /**
   * Setup start, stop and restart listeners, if they exist
   * @return <void>
   * @private
   */
  private setupListeners(): void {
    const {
      stopOn,
      stopCallback,
      startOn,
      startCallback,
      restartOn,
      restartCallback,
    } = this.options;

    // do we want the timer to listen for and stop on a particular event?
    if (stopOn) {
      this.emitter.on(stopOn, (...rest: any[]) => {
        this.timer.stop();

        // callback to perform if the stop on event fires
        stopCallback.apply(null, rest);
      });
    }

    /**
     * Start the timer on event
     * @note callback only fires if the timer was not running
     */
    if (startOn) {
      this.emitter.on(startOn, (...rest: any[]) => {
        if (this.timer.stopped()) {
          this.timer.start();

          startCallback.apply(null, rest);
        }
      });
    }

    /**
     * Restart the timer on event
     * @note callback only fires if the timer was not running
     */
    if (restartOn) {
      this.emitter.on(restartOn, (...rest: any[]) => {
        if (this.timer.hasStarted) {
          this.timer.restart();

          restartCallback.apply(null, rest);
        }
      });
    }
  }
}
