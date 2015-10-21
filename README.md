
# TimerJobs

TimerJobs is a simple way to create recurring tasks that can react to events.


## Installation

```
npm install timerjobs [--save]
```

## Basic Usage

```
var TimerJob = require( 'timerjobs' );
var timer    = new TimerJob({
    interval: 10000,
    immediate: true,  // runs immediately upon starting the timer
    ignoreErrors: true
  }, function( done ) {
    console.log( 'things are happening' );

    // other important things happen

    done();
  }
);

timer.start();
```

A Timer that only runs 'n' times and starts upon creation is easy to implement.

```
var timer = new TimerJob({
    autoStart: true,
    interval: 10000,
    infinite: false,
    countdown: 10
  }, function( done ) {
    console.log( 'things are happening' );

    // other important things happen

    done();
  }
);
```

### Events

The Timer can emit events when job tasks happen. By default it utilizes EventEmitter2,
your own eventemitter may be passed as option `emitter: myEventEmitter` to more fully
integrate TimerJobs into your application.

`jobStart`:  
  Emitted when the job is started  

`jobStop`:  
  Emitted when the job is stopped, a task may still be executing

`jobBegin`:  
  Emitted every time a job execution begins  

`jobEnd`:  
  Emitted every time a job execution completes, i.e when `done()` is called  

`jobError`:  
  Emitted whenever `done( err )` is called with an Error  

`jobComplete`:  
  Emitted when `infinite` is false and `countdown` reaches 0   

The above events, with the exception of `jobError`, can be silenced by setting
the option `emitLevel: 0`.   
Emitted events may also be refined with options `namespace` and `reference` and delimited with `delimiter`.
* Emit level
* default: 1
* 0: disabled
* 1: job\<task\>
* 2: job\<task\> + \<namespace\>
* 3: job\<task\> + \<namespace\> + \<reference\>
* 4: job\<task\> + \<reference\>

```
var timer = new TimerJob({
    interval: 10000,
    autoStart: true,
    emitLevel: 4,
    namespace: 'someNamespace',
    reference: 'mySuperTimer'
  }, function( done ) {
    console.log( 'things are happening' );

    // other important things happen

    done();
  }
);

timer.LEVEL[ timer.emitLevel ];

=> '::someNamespace::mySuperTimer'
```
Assuming `jobStart` emits, the event to listen for would be 'jobStart::someNamespace::mySuperTimer'


### React on Events

Your Timer can react to events so that it may automatically start, stop or restart.   
Simply set the options `startOn`, `stopOn`, or `restartOn` with the event to listen.
Additionally you may supply callbacks for each listen event, respectively:    `startCallback`, `stopCallback` and `restartCallback`.

```
var timer = new TimerJob({
    interval: 10000,
    immediate: true,
    emitter: myEventEmitter,
    startOn: 'startEvent',
    startCallback: function() {

      // do things when your timer starts

    },
    stopOn: 'stopEvent',
    stopCallback: function() {

      // do things when your timer stops

    },
    restartOn: 'restartEvent',
    restartCallback: function() {

      // do things when your timer restarts

    }
  }, function( done ) {
    console.log( 'things are happening' );

    // other important things happen

    done();
  }
);
```

The callback will only execute if the timer action is taken.

### TimerJobs Class
```
var timer = new TimerJob( options, callback );
```
##### Option:Default
`autoStart: false` \<boolean\> - Should the Timer start on creation?   
`blocking: true` \<boolean\> - Should we block execution if we're already executing   
`countdown: 1` \<number\> - The number of times the timer should execute before stopping, `infinite` must be false   
`delimiter: '::'` \<string\> - The delimiter used to segment namespaces   
`emitLevel: 1` \<number\> - At what level should we emit job events   
`emitter: EventEmitter2` \<EventEmitter\> - The eventemitter which emits and listens for events   
`ignoreErrors: false` \<boolean\> - Should we ignore errors? Stops execution if false.  
`immediate: false` \<boolean\> - Should the timer execute immediately upon starting?   
`interval: 3000` \<number\> - The interval in milliseconds which the job should be performed   
`infinite: true`\<boolean\> - Should the timer run forever?   
`namespace: ''` \<string\> - A way to identify the namespace of this timer   
`reference: 'timer'` \<string\> - A reference to this particular timer   
`restartOn: null` \<string\> - The event that should restart the timer   
`restartCallback: null` \<function\> - The callback which executes when the event restarts the timer   
`startOn: null` \<string\> - The event that should start the timer   
`startCallback: null` \<function\> - The callback which executes when the event starts the timer   
`stopOn: null` \<string\> - The event that should stop the timer   
`stopCallback: null` \<function\> - The callback which executes when the event stops the timer   

##### Functions

`timer.start(): void`    
Start the Timer   

`timer.stop(): void`    
Stop the Timer   

`timer.restart( interval?: number ): void`   
Restarts the timer iff it has previously started, optionally set a new interval   

`timer.started(): boolean`    
Returns `true` if the Timer is started   

`timer.stopped(): boolean`    
Returns `true` if the Timer is stopped   

`timer.waitTime(): number`    
Returns the time in milliseconds until the next job execution  

##### Variables

`timer.executions`    
The total number of times the job has executed    

`timer.busy`    
A boolean value that indicates if a task is executing     

`timer.errors`    
An array of Errors that may have occurred during execution

### Static Functionality   

```
var timer = new TimerJob({
    autoStart: true,
    interval: 10000,
    infinite: false,
    countdown: 10,
    reference: 'fancyTimer',
    namespace: 'someNamespace'
  }, function( done ) {
    console.log( 'things are happening' );

    // other important things happen

    done();
  }
);
```
An array of all timers that have been created    

`var timers = TimerJob.timers;`

Find timers by reference, namespace or any other property    

```
var refFound   = TimerJob.findTimers( 'reference', 'fancyTimer' );
var nsFound    = TimerJob.findTimers( 'namespace', 'someNamespace' );
var countFound = TimerJob.findTimers( 'countdown', 10 );
var levelFound = TimerJob.findTimers( 'emitLevel', 1 );
```
Remove one or more timers.    

`TimerJob.removeTimers( TimerJob.findTimers( 'reference', 'fancyTimer' ) ): void;`

By default the Timer being removed will also be stopped. A second argument of `false`
will keep the timer running (assuming it already is).

#### Origins

Based on https://github.com/grahamkennery/timer-jobs
