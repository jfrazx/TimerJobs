'use strict';
/* eslint max-len: 0 */
/* eslint max-statements: 0 */

const { TimerJobs } = require('../dist');
const { EventEmitter2 } = require('eventemitter2');
const { expect } = require('chai');

describe('TimerJobs', function() {
  this.timeout(120);

  describe('assign values', function() {
    it('should assign default values', function() {
      const allDefaults = new TimerJobs(function(done) {
        done();
      });

      expect(allDefaults.blocking).to.be.true;
      expect(allDefaults.interval).to.equal(3000);
      expect(allDefaults.autoStart).to.be.false;
      expect(allDefaults.immediate).to.be.false;
      expect(allDefaults.ignoreErrors).to.be.false;
      expect(allDefaults.infinite).to.be.true;
      expect(allDefaults.countdown).to.equal(1);
      expect(allDefaults._countdown).to.equal(1);
      expect(allDefaults.start_wait).to.equal(0);
      expect(allDefaults.executions).to.equal(0);
      expect(allDefaults.reference).to.equal('timer');
      expect(allDefaults.namespace).to.equal('');
      expect(allDefaults.stopOn).to.be.null;
      expect(allDefaults.startOn).to.be.null;
      expect(allDefaults.restartOn).to.be.null;
      expect(allDefaults.stopCallback).to.be.a('function');
      expect(allDefaults.startCallback).to.be.a('function');
      expect(allDefaults.restartCallback).to.be.a('function');
      expect(allDefaults.delimiter).to.equal('::');
      expect(allDefaults.emitter).to.be.instanceof(EventEmitter2);
      expect(allDefaults.busy).to.be.false;
      expect(allDefaults.timer).to.be.null;
      expect(allDefaults.emitLevel).to.equal(1);
      expect(allDefaults.callback).to.be.a('function');
      expect(allDefaults.LEVEL[allDefaults.emitLevel]).to.equal('');
    });

    it('should accept options in place of default values', function() {
      const emitter = new EventEmitter2();

      const noDefaults = new TimerJobs(
        {
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
        },
        function(done) {
          done();
        }
      );

      noDefaults.stop();

      expect(noDefaults.blocking).to.be.false;
      expect(noDefaults.interval).to.equal(100);
      expect(noDefaults.autoStart).to.be.true;
      expect(noDefaults.immediate).to.be.true;
      expect(noDefaults.ignoreErrors).to.be.true;
      expect(noDefaults.infinite).to.be.false;
      expect(noDefaults.countdown).to.equal(2); // will already execute once
      expect(noDefaults.reference).to.equal('noDefaults');
      expect(noDefaults.namespace).to.equal('mynamespace');
      expect(noDefaults.stopOn).to.equal('stoppingEvent');
      expect(noDefaults.startOn).to.equal('startEvent');
      expect(noDefaults.restartOn).to.equal('restartsEvent');
      expect(noDefaults.stopCallback).to.be.a('function');
      expect(noDefaults.startCallback).to.be.a('function');
      expect(noDefaults.restartCallback).to.be.a('function');
      expect(noDefaults.delimiter).to.equal('##');
      expect(noDefaults.emitter).to.equal(emitter);
      expect(noDefaults.emitLevel).to.equal(3);
      expect(noDefaults.LEVEL[noDefaults.emitLevel]).to.equal(
        '##mynamespace##noDefaults'
      );
    });
  });

  describe('error handling', function() {
    it('should stop the timer on an Error', function(done) {
      let errorCompleted = 0;
      const errorStop = new TimerJobs(
        {
          interval: 10,
        },
        function(done) {
          errorCompleted++;
          done(new Error('something went wrong'));
        }
      );

      errorStop.start();
      // should have no effect
      errorStop.start();

      // this should give it plenty of time to have been called more than once,
      // thus (dis)proving stop on error
      setTimeout(function() {
        expect(errorCompleted).to.equal(1);
        done();
      }, 23);
    });

    it('should ignore errors', function(done) {
      let ignoreErrorsCompleted = 0;
      const ignoreErrors = new TimerJobs(
        {
          interval: 7,
          autoStart: true,
          ignoreErrors: true,
        },
        function(done) {
          ignoreErrorsCompleted++;
          done(new Error('something went wrong'));
        }
      );

      setTimeout(function() {
        ignoreErrors.stop();

        expect(ignoreErrorsCompleted).to.be.at.least(3);
        expect(ignoreErrors.errors.length).to.be.at.least(3);
        done();
      }, 30);
    });

    it('should assign 1 if an integer less than such is passed', function() {
      const lessThan = new TimerJobs(
        {
          infinite: false,
          countdown: 30,
          reference: 'lessThan',
          namespace: 'testing',
        },
        function(done) {
          done();
        }
      );

      expect(lessThan.countdown).to.equal(30);

      lessThan.countdown = -20;

      expect(lessThan.countdown).to.equal(1);
    });

    it('should throw an error if no callback is defined', function() {
      expect(function() {
        new TimerJobs();
      }).to.throw('TimerJobs Error: a callback must be provided');
    });
  });

  describe('execute according to options', function() {
    it('should run once', function(done) {
      let runOnceCompleted = 0;
      new TimerJobs(
        {
          interval: 10,
          autoStart: true,
          infinite: false,
          emitLevel: 0,
        },
        function(done) {
          runOnceCompleted++;
          done();
        }
      );

      setTimeout(function() {
        expect(runOnceCompleted).to.equal(1);
        done();
      }, 25);
    });

    it('should run twice', function(done) {
      let runTwiceCompleted = 0;
      const runTwice = new TimerJobs(
        {
          interval: 5,
          autoStart: true,
          infinite: false,
          countdown: 2.2, // will floor it
        },
        function(done) {
          runTwiceCompleted++;
          done();
        }
      );

      expect(runTwice.countdown).to.equal(2);

      setTimeout(function() {
        expect(runTwice.countdown).to.equal(0);
        expect(runTwiceCompleted).to.equal(2);
        expect(runTwice.executions).to.equal(2);
        done();
      }, 13);
    });

    it('should be able to change infinite and countdown later', function(done) {
      let changeLaterCompleted = 0;
      const changeLater = new TimerJobs(
        {
          interval: 5,
          autoStart: true,
        },
        function(done) {
          changeLaterCompleted++;
          done();
        }
      );

      setTimeout(function() {
        changeLater.infinite = false;
        changeLater.countdown = 2;

        expect(changeLater.infinite).to.be.false;
        expect(changeLater.countdown).to.equal(2);

        setTimeout(function() {
          expect(changeLaterCompleted).to.equal(3);
          expect(changeLater.countdown).to.equal(0);

          changeLater.interval = 15;
          changeLater.start();

          // defineProperty fixes this previous shortcoming
          expect(changeLater.countdown).to.equal(2);

          setTimeout(function() {
            expect(changeLaterCompleted).to.equal(4);
            done();
          }, 15);
        }, 10);
      }, 10);
    });

    it('should continue to execute in non-blocking mode', function(done) {
      let notDoneCompleted = 0;
      const notDone = new TimerJobs(
        {
          blocking: false,
          autoStart: true,
          infinite: false,
          countdown: 3,
          interval: 20,
          immediate: true,
        },
        function() {
          notDoneCompleted++;
        }
      );

      setTimeout(function() {
        notDone.stop();

        expect(notDone.executions).to.equal(notDoneCompleted);
        expect(notDone.countdown).to.equal(3);
        done();
      }, 82);
    });

    it('should block execution until a job finishes', function(done) {
      let blockingCompleted = 0;
      const blocking = new TimerJobs(
        {
          blocking: true,
          autoStart: true,
          immediate: true,
          interval: 10,
        },
        function(done) {
          blockingCompleted++;

          setTimeout(done, 30);
        }
      );

      setTimeout(function() {
        blocking.stop();

        expect(blockingCompleted).to.equal(2);
        expect(blocking.executions).to.equal(2);

        done();
      }, 50);
    });

    it('should return the time until next execution', function(done) {
      let timeLeftCompleted = 0;
      const timeLeft = new TimerJobs(
        {
          blocking: false,
          autoStart: false,
          infinite: true,
          interval: 200,
        },
        function(done) {
          timeLeftCompleted += timeLeftCompleted;
          done();
        }
      );

      // initializes to 0
      expect(timeLeft.waitTime()).to.equal(0);
      timeLeft.start();

      setTimeout(function() {
        const left = timeLeft.waitTime();
        expect(left).to.be.above(100);
        expect(left).to.be.below(200);
        timeLeft.stop();
        done();
      }, 80);
    });

    it('should restart the timer', function(done) {
      let restartComplete = 0;
      const restart = new TimerJobs(
        {
          interval: 10,
          reference: 'restarter',
        },
        function(done) {
          restartComplete++;
          done();
        }
      );

      restart.restart();

      expect(restart.stopped()).to.be.true;
      expect(restart.hasStarted).to.be.false;
      expect(restart.interval).to.equal(10);

      restart.start();

      setTimeout(function() {
        expect(restartComplete).to.equal(2);
        expect(restart.hasStarted).to.be.true;

        restart.restart(15);

        setTimeout(function() {
          expect(restart.started()).to.be.true;
          expect(restart.interval).to.equal(15);
          expect(restartComplete).to.equal(4);
          restart.stop();

          restart.restart('not an integer');
          restart.stop();

          expect(restart.interval).to.equal(15);

          done();
        }, 35);
      }, 30);
    });
  });

  describe('emit events', function() {
    it('should emit when a job starts', function(done) {
      let emitStartComplete = 0;
      const emitStart = new TimerJobs(
        {
          emitLevel: 2,
        },
        function(done) {
          emitStartComplete++;
          done();
        }
      );

      emitStart.emitter.on('jobStart', function() {
        emitStart.stop();
        expect(emitStartComplete).to.equal(0);
        done();
      });

      emitStart.start();
    });

    it('should emit when a job stops', function(done) {
      let emitStopComplete = 0;
      const emitStop = new TimerJobs(
        {
          autoStart: true,
          immediate: true,
          emitLevel: 4,
          reference: 'emitStop',
        },
        function(done) {
          emitStopComplete++;
          done();
        }
      );

      emitStop.emitter.on('jobStop::emitStop', function() {
        expect(emitStopComplete).to.equal(1);
        done();
      });

      emitStop.stop();
    });

    it('should emit when a job begins', function(done) {
      let emitBeginComplete = 0;
      const emitBegin = new TimerJobs(
        {
          interval: 5,
          autoStart: true,
        },
        function(done) {
          emitBeginComplete++;
          done();
        }
      );

      emitBegin.emitter.on('jobBegin', function() {
        expect(emitBeginComplete).to.be.above(-1);
        expect(emitBeginComplete).to.be.below(3);

        if (emitBeginComplete === 2) {
          emitBegin.stop();
          done();
        }
      });
    });

    it('should emit when a job cycle ends', function(done) {
      let emitEndComplete = 0;
      const emitEnd = new TimerJobs(
        {
          interval: 10,
          autoStart: true,
          emitLevel: 3,
          namespace: 'emitEnd',
        },
        function(done) {
          emitEndComplete++;
          done(null, 1, 2, 3, 4, 5);
        }
      );

      emitEnd.emitter.on('jobEnd::emitEnd::timer', function(timer, first) {
        const args = Array.prototype.slice.call(arguments, 1);
        expect(first).to.equal(1);
        expect(emitEndComplete)
          .to.be.above(0)
          .and.to.be.below(3);

        for (let i = 0; i < args.length; i++) {
          expect(args[i]).to.equal(i + 1);
        }

        if (emitEndComplete === 2) {
          emitEnd.stop();
          done();
        }
      });
    });

    it('should emit when a job completes', function(done) {
      let emitCompleteCompleted = 0;
      const emitComplete = new TimerJobs(
        {
          interval: 10,
          autoStart: true,
          immediate: true,
          infinite: false,
          countdown: 3,
          namespace: 'emitComplete',
          emitLevel: 2,
        },
        function(done) {
          emitCompleteCompleted++;
          done();
        }
      );

      emitComplete.emitter.on('jobComplete::emitComplete', function() {
        expect(emitCompleteCompleted).to.equal(3);
        done();
      });
    });

    it('should emit when there is an error', function(done) {
      let emitErrorCompleted = 0;
      const emitError = new TimerJobs(
        {
          interval: 10,
          ignoreErrors: false, // this is the default, but lets be explict
          autoStart: true,
          emitLevel: 3, // when no 'namespace' is passed it will become level 4
        },
        function(done) {
          emitErrorCompleted++;
          done(new Error('something went wrong'));
        }
      );

      emitError.emitter.on('jobError::timer', function(error, timer, errors) {
        expect(error).to.be.instanceof(Error);
        expect(emitError === timer).to.be.true;
        expect(emitErrorCompleted).to.equal(1);
        expect(errors).to.be.an('array');
        expect(errors).to.have.length(1);
        done();
      });
    });

    it('should emit on error with emitting disabled', function(done) {
      const emitDisabled = new TimerJobs(
        {
          infinite: false,
          emitLevel: 0,
          interval: 10,
        },
        function(done) {
          done(new Error('I should still emit'));
        }
      );

      emitDisabled.emitter.on('jobError', function(error, timer, errors) {
        expect(error).to.be.instanceof(Error);
        expect(timer).to.equal(emitDisabled);
        expect(errors).to.be.an('array');
        done();
      });

      emitDisabled.start();
    });

    it('should not start on "restart" emit, if timer has never started', function() {
      const neverStart = new TimerJobs(
        {
          interval: 10,
          restartOn: 'restartEvent',
        },
        function(done) {
          done();
        }
      );

      expect(neverStart.hasStarted).to.be.false;

      neverStart.emitter.emit('restartEvent');

      expect(neverStart.hasStarted).to.be.false;
    });
  });

  describe('react on events', function() {
    let eventsCompleted = 0;
    const eventsTimer = new TimerJobs(
      {
        interval: 100,
        immediate: true,
        startOn: 'startEvent',
        startCallback: function(startOn, startOnCompleted, done) {
          expect(startOn.started()).to.be.true;
          expect(startOnCompleted).to.equal(0); //while it may have changed since starting, it was 0 when passed
          done();
        },
        stopOn: 'stopEvent',
        stopCallback: function(stopOn, stopOnCompleted, done) {
          expect(stopOn.stopped()).to.be.true;
          expect(stopOnCompleted).to.equal(1);
          done();
        },
        restartOn: 'restartEvent',
        restartCallback: function(restartOn, restartOnCompleted, done) {
          expect(restartOn.started()).to.be.true;
          expect(restartOnCompleted).to.equal(1);
          expect(restartOn.executions).to.equal(2);
          restartOn.stop();
          done();
        },
      },
      function(done) {
        eventsCompleted++;
        done();
      }
    );

    it('should start when an event occurs', function(done) {
      eventsTimer.emitter.emit(
        'startEvent',
        eventsTimer,
        eventsCompleted,
        done
      );
    });

    it('should stop when an event occurs', function(done) {
      eventsTimer.emitter.emit('stopEvent', eventsTimer, eventsCompleted, done);
    });

    it('should restart when an event occurs', function(done) {
      eventsTimer.emitter.emit(
        'restartEvent',
        eventsTimer,
        eventsCompleted,
        done
      );
    });
  });

  describe('static functionality', function() {
    it('should have an array of added Timers', function() {
      expect(TimerJobs.timers).to.be.an('array');
      expect(TimerJobs.timers.length).to.be.at.least(20);
    });

    it('should have a default emitter', function() {
      expect(TimerJobs.emitter).to.be.undefined;
      const someEmitter = new EventEmitter2();
      TimerJobs.emitter = someEmitter;

      const timer = new TimerJobs(function() {});
      expect(timer.emitter === someEmitter).to.be.true;
    });

    it('should find Timers by reference', function() {
      let timers = TimerJobs.findTimers('reference', 'timer');
      expect(timers).to.be.an('array');
      expect(timers.length).to.be.at.least(16);
    });

    it('should find Timers by namespace', function() {
      let timers = TimerJobs.findTimers('namespace', '');
      expect(timers).to.be.an('array');
      expect(timers.length).to.be.at.least(16);
    });

    it('should find Timers by other properties', function() {
      let level = TimerJobs.findTimers('emitLevel', 1);
      let start = TimerJobs.findTimers('startOn', 'startEvent');
      let stop = TimerJobs.findTimers('stopOn', 'stoppingEvent');
      let restart = TimerJobs.findTimers('restartOn', 'restartEvent');
      let infinite = TimerJobs.findTimers('infinite', false);

      expect(level.length).to.at.least(15);
      expect(start.length).to.be.at.least(2);
      expect(stop.length).to.be.at.least(1);
      expect(restart.length).to.be.at.least(1);
      expect(infinite.length).to.be.at.least(7);
    });

    it('should remove a single Timer and not error on second attempt', function() {
      const timer = TimerJobs.findTimers('reference', 'noDefaults');

      expect(timer).to.have.length(1);

      TimerJobs.removeTimers(timer[0], true);

      const empty = TimerJobs.findTimers('reference', 'noDefaults');

      expect(empty).to.have.length(0);

      expect(TimerJobs.removeTimers, timer[0]).to.not.throw(Error);
    });

    it('should remove multiple Timers', function() {
      expect(TimerJobs.timers.length).to.be.at.least(19);

      TimerJobs.removeTimers(TimerJobs.findTimers('reference', 'timer'));

      expect(TimerJobs.timers).to.have.length(3);
    });
  });
});
