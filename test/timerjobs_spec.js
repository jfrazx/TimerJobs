'use strict';

var TimerJob      = require( '../index' ),
    TimerJobs     = require( '../index' ),
    EventEmitter2 = require( 'eventemitter2' ).EventEmitter2,
    chai          = require( 'chai' ),
    expect        = chai.expect;

describe( 'TimerJobs', function() {

  this.timeout( 1500 );

  describe( 'assign values', function() {
    it( 'should assign default values', function() {

      var allDefaults = new TimerJob( function( done ) {
        done();
      });

      expect( allDefaults.blocking ).to.be.true;
      expect( allDefaults.interval ).to.equal( 3000 );
      expect( allDefaults.autoStart ).to.be.false;
      expect( allDefaults.immediate ).to.be.false;
      expect( allDefaults.ignoreErrors ).to.be.false;
      expect( allDefaults.infinite ).to.be.true;
      expect( allDefaults.countdown ).to.equal( 1 );
      expect( allDefaults._countdown ).to.equal( 1 );
      expect( allDefaults.start_wait ).to.equal( 0 );
      expect( allDefaults.executions ).to.equal( 0 );
      expect( allDefaults.reference ).to.equal( 'timer' );
      expect( allDefaults.namespace ).to.equal( '' );
      expect( allDefaults.stopOn ).to.be.null;
      expect( allDefaults.stopCallback ).to.be.null;
      expect( allDefaults.startOn ).to.be.null;
      expect( allDefaults.startCallback ).to.be.null;
      expect( allDefaults.restartOn ).to.be.null;
      expect( allDefaults.restartCallback ).to.be.null;
      expect( allDefaults.delimiter ).to.equal( '::' );
      expect( allDefaults.emitter ).to.be.instanceof( EventEmitter2 );
      expect( allDefaults.busy ).to.be.false;
      expect( allDefaults.timer ).to.be.null;
      expect( allDefaults.emitLevel ).to.equal( 1 );
      expect( allDefaults.callback ).to.be.a( 'function' );
      expect( allDefaults.LEVEL[ allDefaults.emitLevel ] ).to.equal( '' );
    });

    it( 'should accept options in place of default values', function() {
      var emitter = new EventEmitter2();

      var noDefaults = new TimerJob({
        blocking: false,
        interval: 100,
        autoStart: true,
        immediate: true,
        ignoreErrors: true,
        infinite: false,
        countdown: 3,
        reference: 'noDefaults',
        namespace: 'mynamespace',
        stopOn: 'stoppingEvent',
        stopCallback: console.log,
        startOn: 'startEvent',
        startCallback: console.log,
        restartOn: 'restartsEvent',
        restartCallback: console.log,
        delimiter: '##',
        emitter: emitter,
        emitLevel: 3,
      }, function( done ) {
        done();
      });

      noDefaults.stop();

      expect( noDefaults.blocking ).to.be.false;
      expect( noDefaults.interval ).to.equal( 100 );
      expect( noDefaults.autoStart ).to.be.true;
      expect( noDefaults.immediate ).to.be.true;
      expect( noDefaults.ignoreErrors ).to.be.true;
      expect( noDefaults.infinite ).to.be.false;
      expect( noDefaults.countdown ).to.equal( 2 ); // it will already execute once
      expect( noDefaults.reference ).to.equal( 'noDefaults' );
      expect( noDefaults.namespace ).to.equal( 'mynamespace' );
      expect( noDefaults.stopOn ).to.equal( 'stoppingEvent' );
      expect( noDefaults.startOn ).to.equal( 'startEvent' );
      expect( noDefaults.restartOn ).to.equal( 'restartsEvent' );
      expect( noDefaults.stopCallback ).to.be.a( 'function' );
      expect( noDefaults.startCallback ).to.be.a( 'function' );
      expect( noDefaults.restartCallback ).to.be.a( 'function' );
      expect( noDefaults.delimiter ).to.equal( '##' );
      expect( noDefaults.emitter ).to.equal( emitter );
      expect( noDefaults.emitLevel ).to.equal( 3 );
      expect( noDefaults.LEVEL[ noDefaults.emitLevel ] ).to.equal( '##mynamespace##noDefaults' );
    });
  });

  describe( 'error handling', function() {
    it( 'should stop the timer on an Error', function( done ) {

      var errorCompleted = 0;
      var errorStop = new TimerJob({
        interval: 200
      }, function( done ){
        errorCompleted++;
        done( new Error( 'something went wrong' ));
      });

      errorStop.start();

      // this should give it plenty of time to have been called more than once, thus (dis)proving stop on error
      setTimeout( function(){
        expect( errorCompleted ).to.equal( 1 );
        done();
      }, 500 );

    });

    it( 'should ignore errors', function( done ) {
      var ignoreErrorsCompleted = 0;
      var ignoreErrors = new TimerJob({
        interval: 100,
        autoStart: true,
        ignoreErrors: true
      }, function( done ){
        ignoreErrorsCompleted++;
        done( new Error( 'something went wrong' ) );
      });

      setTimeout( function(){
        ignoreErrors.stop();

        expect( ignoreErrorsCompleted ).to.equal( 3 );
        expect( ignoreErrors.errors ).to.have.length( 3 );
        done();
      }, 400 );
    });

    it( 'should throw an error when assigning a non-integer value', function() {
      var passError = new TimerJob( function( done ) {
          done();
      });

      expect( function() {
        passError.countdown = 'this will cause an error';
      }).to.throw( 'TimerJobs Error: countdown must be an integer value' );
    });

    it( 'should assign 1 if an integer less than such is passed', function() {
      var lessThan = new TimerJob( {
        infinite: false,
        countdown: 30,
        reference: 'lessThan',
        namespace: 'testing'
      }, function( done ) {
        done();
      });

      expect( lessThan.countdown ).to.equal( 30 );

      lessThan.countdown = -20;

      expect( lessThan.countdown ).to.equal( 1 );
    });

    it( 'should throw an error if no callback is defined', function() {
      expect( function() {
        new TimerJob();
      }).to.throw( 'TimerJobs Error: a callback must be provided' );
    });
  });

  describe( 'execute according to options', function() {
    it( 'should run once', function( done ) {
      var runOnceCompleted = 0;
      var runOnce = new TimerJob({
        interval: 200,
        autoStart: true,
        infinite: false
      }, function( done ) {
        runOnceCompleted++;
        done();
      });

      setTimeout( function() {
        expect( runOnceCompleted ).to.equal( 1 );
        done();
      }, 600 );
    });

    it( 'should run twice', function( done ) {
      var runTwiceCompleted = 0;
      var runTwice = new TimerJob({
        interval: 100,
        autoStart: true,
        infinite: false,
        countdown: 2.2 // will floor it
      }, function( done ) {
        runTwiceCompleted++;
        done();
      });

      expect( runTwice.countdown ).to.equal( 2 );

      setTimeout( function(){
        expect( runTwice.countdown ).to.equal( 0 );
        expect( runTwiceCompleted ).to.equal( 2 );
        expect( runTwice.executions ).to.equal( 2 );
        done();
      }, 500 );
    });

    it( 'should be able to change infinite and countdown later', function( done ) {
      var changeLaterCompleted = 0;
      var changeLater = new TimerJob({
        interval: 100,
        autoStart: true
      }, function( done ) {
        changeLaterCompleted++;
        done();
      });

      setTimeout( function(){
        changeLater.infinite  = false;
        changeLater.countdown = 2;

        expect( changeLater.infinite ).to.be.false;
        expect( changeLater.countdown ).to.equal( 2 );

        setTimeout( function() {
          expect( changeLaterCompleted ).to.equal( 4 );
          expect( changeLater.countdown ).to.equal( 0 );

          changeLater.interval = 200;
          changeLater.start();

          // defineProperty fixes this previous shortcoming
          expect( changeLater.countdown ).to.equal( 2 );

          setTimeout( function(){
            expect( changeLaterCompleted ).to.equal( 5 );
            done();
          }, 300);
        }, 300);
      }, 300);
    });

    it( 'should continue to execute in non-blocking mode', function( done ) {
      var notDoneCompleted = 0;
      var notDone = new TimerJob({
        blocking: false,
        autoStart: true,
        infinite: false,
        countdown: 3,
        interval: 200,
        immediate: true
      }, function() {
        notDoneCompleted++;
      });

      setTimeout( function(){
        notDone.stop();

        expect( notDone.executions ).to.equal( notDoneCompleted );
        expect( notDone.countdown ).to.equal( 3 );
        done();
      }, 820);
    });

    it( 'should block execution until a job finishes', function( done ) {
      var blockingCompleted = 0;
      var blocking = new TimerJob({
        blocking: true,
        autoStart: true,
        immediate: true,
        interval: 100
      }, function( done ) {
        blockingCompleted++;

        setTimeout( done, 300 );
      });

      setTimeout( function() {
        blocking.stop();

        expect( blockingCompleted ).to.equal( 2 );
        expect( blocking.executions ).to.equal( 2 );

        done();
      }, 500 );
    });

    it( 'should return the time until next execution', function( done ) {
      var timeLeftCompleted = 0;
      var timeLeft = new TimerJob({
        blocking: false,
        autoStart: false,
        infinite: true,
        interval: 2000
      }, function( done ) {
        timeLeftCompleted++;
        done();
      });

      // initializes to 0
      expect( timeLeft.waitTime() ).to.equal( 0 );
      timeLeft.start();

      setTimeout( function(){
        var left = timeLeft.waitTime();
        expect( left ).to.be.above( 1000 );
        expect( left ).to.be.below( 2000 );
        timeLeft.stop();
        done();
      }, 800);
    });

    it( 'should restart the timer', function( done ) {
      var restartComplete = 0;
      var restart = new TimerJob({
        interval: 100,
        reference: 'restarter',
      }, function( done ) {
        restartComplete++;
        done();
      });

      restart.restart();

      expect( restart.stopped() ).to.be.true;
      expect( restart.hasStarted ).to.be.false;
      expect( restart.interval ).to.equal( 100 );

      restart.start();

      setTimeout( function() {
        expect( restartComplete ).to.equal( 2 );
        expect( restart.hasStarted ).to.be.true;

        restart.restart( 150 );

        setTimeout( function() {
          expect( restart.started() ).to.be.true;
          expect( restart.interval ).to.equal( 150 );
          expect( restartComplete ).to.equal( 4 );
          restart.stop();

          done();
        }, 310);
      }, 300);


    });
  });

  describe( 'emit events', function() {
    it( 'should emit when a job starts', function( done ) {
      var emitStartComplete = 0;
      var emitStart = new TimerJob( {
        emitLevel: 2
      }, function( done ) {
        emitStartComplete++;
        done();
      });

      emitStart.emitter.on( 'jobStart', function() {
        emitStart.stop();
        expect( emitStartComplete ).to.equal( 0 );
        done();
      });

      emitStart.start();

    });

    it( 'should emit when a job stops', function( done ) {
      var emitStopComplete = 0;
      var emitStop = new TimerJob( {
        autoStart: true,
        immediate: true,
        emitLevel: 4,
        reference: 'emitStop'
      }, function( done ) {
        emitStopComplete++;
        done();
      });

      emitStop.emitter.on( 'jobStop::emitStop', function() {
        expect( emitStopComplete ).to.equal( 1 );
        done();
      });

      emitStop.stop();
    });

    it( 'should emit when a job begins', function( done ) {
      var emitBeginComplete = 0;
      var emitBegin = new TimerJob({
        interval: 100,
        autoStart: true
      }, function( done ) {
        emitBeginComplete++;
        done();
      });

      emitBegin.emitter.on( 'jobBegin', function() {
        expect( emitBeginComplete ).to.be.above( -1 );
        expect( emitBeginComplete ).to.be.below( 3 );

        if( emitBeginComplete === 2 ) {
          emitBegin.stop();
          done();
        }

      });
    });

    it( 'should emit when a job cycle ends', function( done ) {
      var emitEndComplete = 0;
      var emitEnd = new TimerJob( {
        interval: 100,
        autoStart: true,
        emitLevel: 3,
        namespace: 'emitEnd'
      }, function( done ) {
        emitEndComplete++;
        done( null, 1, 2, 3, 4, 5 );
      });

      emitEnd.emitter.on( 'jobEnd::emitEnd::timer', function( first ) {
        var args = Array.prototype.slice.call( arguments );
        expect( first ).to.equal( 1 );
        expect( emitEndComplete ).to.be.above( 0 );
        expect( emitEndComplete ).to.be.below( 3 );

        for( var i = 0; i < args.length; i++ ) {
          expect( args[i] ).to.equal( i + 1 );
        }

        if( emitEndComplete === 2 ) {
          emitEnd.stop();
          done();
        }

      });
    });

    it( 'should emit when a job completes', function( done ) {
      var emitCompleteCompleted = 0;
      var emitComplete = new TimerJob({
        interval: 100,
        autoStart: true,
        immediate: true,
        infinite: false,
        countdown: 3,
        namespace: 'emitComplete',
        emitLevel: 2
      }, function( done ) {
        emitCompleteCompleted++;
        done();
      });

      emitComplete.emitter.on( 'jobComplete::emitComplete', function() {
        expect( emitCompleteCompleted ).to.equal( 3 );
        done();
      });
    });

    it( 'should emit when there is an error', function( done ) {
      var emitErrorCompleted = 0;
      var emitError = new TimerJob({
        interval: 100,
        ignoreErrors: false, // this is the default, but lets be explict
        autoStart: true,
        emitLevel: 3 // when no 'namespace' is passed it will become level 4
      }, function( done ) {
        emitErrorCompleted++;
        done( new Error( 'something went wrong' ) );
      });

      emitError.emitter.on( 'jobError::timer', function( errors ) {
        expect( emitErrorCompleted ).to.equal( 1 );
        expect( errors ).to.be.an( 'array' );
        expect( errors ).to.have.length( 1 );
        done();
      });
    });
  });

  describe( 'react on events', function() {
    var eventsCompleted = 0;
    var eventsTimer = new TimerJob({
      interval: 100,
      immediate: true,
      startOn: 'startEvent',
      startCallback: function( startOn, startOnCompleted, done ) {
        expect( startOn.started() ).to.be.true;
        expect( startOnCompleted ).to.equal( 0 ); //while it may have changed since starting, it was 0 when passed
        done();
      },
      stopOn: 'stopEvent',
      stopCallback: function( stopOn, stopOnCompleted, done ) {
        expect( stopOn.stopped() ).to.be.true;
        expect( stopOnCompleted ).to.equal( 1 );
        done();
      },
      restartOn: 'restartEvent',
      restartCallback: function( restartOn, restartOnCompleted, done ) {
        expect( restartOn.started() ).to.be.true;
        expect( restartOnCompleted ).to.equal( 1 );
        expect( restartOn.executions ).to.equal( 2 );
        restartOn.stop();
        done();
      }
    }, function( done ) {
      eventsCompleted++;
      done();
    });

    it( 'should start when an event occurs', function( done ) {
      eventsTimer.emitter.emit( 'startEvent', eventsTimer, eventsCompleted, done );
    });

    it( 'should stop when an event occurs', function( done ) {
      eventsTimer.emitter.emit( 'stopEvent', eventsTimer, eventsCompleted, done );
    });

    it( 'should restart when an event occurs', function( done ) {
      eventsTimer.emitter.emit( 'restartEvent', eventsTimer, eventsCompleted, done );
    });
  });

  describe( 'static functionality', function() {
    it( 'should have an array of added Timers', function() {
      expect( TimerJobs.timers ).to.be.an( 'array' );
      expect( TimerJobs.timers ).to.have.length( 20 );
    });

    it( 'should find Timers by reference', function() {
      let timers = TimerJobs.findTimers( 'reference', 'timer' );
      expect( timers ).to.be.an( 'array' );
      expect( timers ).to.have.length( 16 );
    });

    it( 'should find Timers by namespace', function() {
      let timers = TimerJobs.findTimers( 'namespace', '' );
      expect( timers ).to.be.an( 'array' );
      expect( timers ).to.have.length( 16 );
    });

    it( 'should find Timers by other properties', function() {
      let level    = TimerJobs.findTimers( 'emitLevel', 1 );
      let start    = TimerJobs.findTimers( 'startOn', 'startEvent' );
      let stop     = TimerJobs.findTimers( 'stopOn', 'stoppingEvent' );
      let restart  = TimerJobs.findTimers( 'restartOn', 'restartEvent' );
      let infinite = TimerJobs.findTimers( 'infinite', false );

      expect( level ).to.have.length( 15 );
      expect( start ).to.have.length( 2 );
      expect( stop ).to.have.length( 1 );
      expect( restart ).to.have.length( 1 );
      expect( infinite ).to.have.length( 7 );
    });

    it( 'should remove a single Timer', function() {
      let timer = TimerJobs.findTimers( 'reference', 'noDefaults' );

      expect( timer ).to.have.length( 1 );

      TimerJobs.removeTimers( timer[ 0 ] );

      let empty = TimerJobs.findTimers( 'reference', 'noDefaults' );

      expect( empty ).to.have.length( 0 );
    });

    it( 'should remove multiple Timers', function() {
      expect( TimerJobs.timers ).to.have.length( 19 );

      TimerJobs.removeTimers( TimerJobs.findTimers( 'reference', 'timer' ) );

      expect( TimerJobs.timers ).to.have.length( 3 );
    });
  });
});
