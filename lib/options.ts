import { IOptions, ITimerJobsOptions } from './interfaces';
import { EmitLevels } from './emit-level';
import { merge } from './helpers';

const noop = () => {};

const defaultOptions: IOptions = {
  blocking: true,
  autoStart: false,
  countdown: 1,
  delimiter: '::',
  emitLevel: 1,
  emitter: null,
  ignoreErrors: false,
  immediate: false,
  interval: 3000,
  infinite: true,
  namespace: '',
  reference: 'timer',
  stopOn: null,
  stopCallback: noop,
  startOn: null,
  startCallback: noop,
  restartOn: null,
  restartCallback: noop,
  context: null,
};

export class Options implements IOptions {
  autoStart: boolean;
  blocking: boolean;
  countdown: number;
  delimiter: string;
  emitLevel: EmitLevels;
  emitter: any;
  ignoreErrors: boolean;
  immediate: boolean;
  interval: number;
  infinite: boolean;
  namespace: string;
  reference: string;
  stopOn: string;
  stopCallback: Function;
  startOn: string;
  startCallback: Function;
  restartOn: string;
  restartCallback: Function;
  context: any;

  constructor(options: ITimerJobsOptions = {}) {
    merge(this, { ...defaultOptions, ...options });
  }
}
