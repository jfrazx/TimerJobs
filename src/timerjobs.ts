'use strict';

import * as events from 'eventemitter2';

export class TimerJobs implements ITimerJobs {
  public autoStart: boolean;
  public blocking: boolean;
  public busy: boolean;
  public callback: Function;
  public countdown: number; // public face of _countdown
  public delimiter: string;
  public emitter: any;
  public emitLevel: number;
  public errors: Error[] = [];
  public executions: number = 0;

  public ignoreErrors: boolean;
  public immediate: boolean;
  public interval: number;
  public infinite: boolean;

  public namespace: string;
  public reference: string;

  // restart the timer on event w/ callback
  public restartOn: string;
  public restartCallback: Function;

  // start the timer on event w/ callback
  public startOn: string;
  public startCallback: Function;

  // stop the timer on event w/ callback
  public stopOn: string;
  public stopCallback: Function;

  public timer: number; // NodeJS.Timer id

  private _countdown: number; // manipulate internally
  private __countdown: number; // track original value
  private LEVEL: { [ level: string ]:  string };
  private start_wait: number = 0;

  public static timers: TimerJobs[] = [];


  constructor( options: ITimerJobsOptions, callback: ( done: Function ) => void );
  constructor( callback: ( done: Function ) => void );
  constructor( options?: any, callback?: ( done: Function ) => void ) {

    if ( typeof options === 'function' ) {
        callback = options;
        options = {};
    }

    if ( !callback || typeof callback !== 'function' )
      throw new Error( 'TimerJobs Error: a callback must be provided' );

    // if the job is being performed, should we block another from starting?
    this.blocking = options.blocking === undefined ? true : options.blocking;

    // interval between job executions
    this.interval = this.isInteger( options.interval ) ? options.interval : 3000;

    // autostart or ..?
    this.autoStart = !( !options.autoStart );

    // start this job without waiting for interval
    this.immediate = !( !options.immediate );

    // should we ignore errors?
    this.ignoreErrors = !( !options.ignoreErrors );

    // run forever or countdown times?
    this.infinite = options.infinite === undefined ? true : options.infinite;
    // if we don't run forever, we'll run countdown times
    this.countdown = ( options.countdown && options.countdown > 1 ) ? Math.floor( options.countdown ) : 1;

    // a string reference for this timerjob
    this.reference = ( options.reference && options.reference.trim().length )  ? options.reference : 'timer';
    // if we operate in multiple namespace and want to distinguish between them
    this.namespace = ( options.namespace && options.namespace.trim().length )  ? options.namespace : '';

    // should we listen for an event to stop the timer on?
    this.stopOn = ( options.stopOn && options.stopOn.trim().length )  ? options.stopOn : null;
    // if stopOn is set we can callback if that event occurs
    this.stopCallback = ( typeof options.stopCallback === 'function' ) ? options.stopCallback : null;

    // should we listen for an event to start the timer on?
    this.startOn = ( options.startOn && options.startOn.trim().length )  ? options.startOn : null;
    // if startOn is set we can callback if that event occurs
    this.startCallback = ( typeof options.startCallback === 'function' ) ? options.startCallback : null;

    // should we listen for an event to restart the timer on?
    this.restartOn = ( options.restartOn && options.restartOn.trim().length )  ? options.restartOn : null;
    // if restartOn is set we can callback if that event occurs
    this.restartCallback = ( typeof options.restartCallback === 'function' ) ? options.restartCallback : null;

    // a delimiter for emitLevel and the default eventemitter2
    this.delimiter = options.delimiter || '::';

    // the eventemitter to utilize
    this.emitter = options.emitter || new events.EventEmitter2( { wildcard: true, delimiter: this.delimiter } );

    // the jobtimer
    this.timer = null;
    this.busy  = false;

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
    this.emitLevel = ( this.isInteger( options.emitLevel )
                        && options.emitLevel >= 0 && options.emitLevel <= 4 )
                        ? options.emitLevel : 1;

    // protecting you from yourself
    if ( !this.namespace.length ) {
      if ( this.emitLevel === 2 )
        this.emitLevel = 1;
      else if ( this.emitLevel === 3 )
        this.emitLevel = 4;
    }

    this.LEVEL = {
      1: '',
      2: this.delimiter + this.namespace,
      3: this.delimiter + this.namespace + this.delimiter + this.reference,
      4: this.delimiter + this.reference
    };

    // keep track of original so we can reassign if the timer gets restarted
    // this._countdown = this.countdown;

    this.setupListeners();

    if ( this.autoStart )
      this.start();

    TimerJobs.timers.push( this );
  }

  /**
  * Start the timer unless it is already started
  * @return <void>
  */
  public start(): void {
    if ( !this.timer ) {
      this.start_wait = Date.now();

      if ( this.countdown < 1 )
        this.countdown = this.__countdown;

      this.timer = setInterval( this.go.bind( this ), this.interval );

      this.emitter.emit( 'jobStart' + this.LEVEL[ this.emitLevel ] );

      if ( this.immediate )
        this.go();
    }
  }

  /**
  * Is the timer stopped?
  * @return <Boolean>
  */
  public stopped(): boolean {
    return this.timer == null;
  }

  /**
  * Is the timer started?
  * @return <boolean>
  */
  public started() : boolean {
    return !( !this.timer );
  }

  /**
  * Stop the Timer
  * @return <void>
  */
  public stop(): void {
    if ( this.timer ) {
      clearInterval( this.timer );

      if ( this.emitLevel )
        this.emitter.emit( 'jobStop' + this.LEVEL[ this.emitLevel ] );

      this.timer = null;
      this.start_wait = 0;
    }
  }

  /**
  * Determine wait time until next execution in milliseconds
  * @return <number>
  */
  public waitTime(): number {
    if ( !this.start_wait )
      return this.start_wait;

    return this.start_wait + this.interval - Date.now();
  }

  /**
  * Find Timers based on property and value
  * @param <string> property: The property to match
  * @param <string> match: What the property value should match
  * @return <TimerJobs[]>
  */
  public static findTimers( property: string, match: any ): TimerJobs[] {
    let timers: TimerJobs[] = [];

    this.timers.forEach( function( timer ) {
      if ( timer[ property ] === match )
        timers.push( timer );
    });

    return timers;
  }

  /**
  * Remove Timers from timers array
  * @param <TimerJobs> timers: The timer(s) to remove
  * @param <boolean> stop: Stop the timer(s) being removed
  * @return <void>
  */
  public static removeTimers( timers: TimerJobs, stop: boolean ): void;
  public static removeTimers( timers: TimerJobs[], stop: boolean ): void;
  public static removeTimers( timers: any, stop: boolean = true ): void {
    if ( !Array.isArray( timers ) )
      timers = [ timers ];

    timers.forEach( ( timer: TimerJobs ) => {
      let index = TimerJobs.timers.indexOf( timer );

      if ( index >= 0 ) {
        TimerJobs.timers.splice( index, 1 );
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

    if ( !this.busy || !this.blocking ) {
      this.busy = true;

      if ( this.emitLevel )
        this.emitter.emit( 'jobBegin' + this.LEVEL[ this.emitLevel ] );

      ++this.executions;

      if ( this.callback )
        this.callback( this.done.bind( this ) );

    }

    this.start_wait = Date.now();
  }

  /**
  * Function sent to timer callback, called when finished
  * @param <Error> err: Error object sent back if something went wrong
  * @param <any> args: any additional parameters sent back
  * @return <void>
  * @private
  */
  private done( err?: Error, ...args: any[] ): void {

    if ( this.emitLevel ) {
      let emission = 'jobEnd' + this.LEVEL[ this.emitLevel ];
      args.unshift( emission );
      this.emitter.emit.apply( this.emitter, args );
    }

    if ( err ) {
      let level: string;
      this.errors.push( err );

      if ( this.emitLevel )
        level = this.LEVEL[ this.emitLevel ];
      else
        level = this.LEVEL[ 1 ];

      this.emitter.emit( 'jobError' + level, this.errors );

      if ( !this.ignoreErrors )
        this.stop();
    }

    if ( !this.infinite ) {
      if ( --this._countdown < 1 ) {
        if ( this.emitLevel )
          this.emitter.emit( 'jobComplete' + this.LEVEL[ this.emitLevel ] );

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

    var self = this;

    // do we want the timer to listen for and stop on a particular event?
    if ( this.stopOn ) {
      this.emitter.on( this.stopOn, function() {
        self.stop();

          // callback to perform if the stop on event fires
          if ( self.stopCallback )
            self.stopCallback.apply( null, Array.prototype.slice.call( arguments ) );
      });
    }


    /**
    * Start the timer on event
    * @note callback only fires if the timer was not running
    */
    if ( this.startOn ) {
      this.emitter.on( this.startOn, function() {
        if ( self.stopped() ) {
          self.start();

          if ( self.startCallback )
            self.startCallback.apply( null, Array.prototype.slice.call( arguments ) );
        }
      });
    }

    /**
    * Restart the timer on event
    * @note callback only fires if the timer was not running
    */
    if ( this.restartOn ) {
      this.emitter.on( this.restartOn, function() {
        if ( self.stopped() ) {
          self.start();

          if ( self.restartCallback )
            self.restartCallback.apply( null, Array.prototype.slice.call( arguments ) );
        }
      });
    }
  }

  /**
  * Determine if passed value is an integer
  * @param <any> value: The value to inspect
  * @return <boolean>
  * @private
  */
  private isInteger( value: any ): boolean {
    return typeof value === 'number'
           && isFinite( value )
           && Math.floor( value ) === value;
  }
}

Object.defineProperty( TimerJobs.prototype, 'countdown', {
  get: function(): number {
    return this._countdown;
  },
  set: function( value: number ): void {
    if ( !this.isInteger( value ) )
      throw new Error( 'TimerJobs Error: countdown must be an integer value' );

    if ( value < 1 )
      value = 1;

    this.__countdown = this._countdown = value;
  }
});

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
  timer: number;
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