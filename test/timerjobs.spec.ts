import { EventEmitter2 } from 'eventemitter2';
import { TimerJobs } from '../lib';
import { expect } from 'chai';

describe('TimerJobs', function () {
  this.timeout(120);

  describe('error handling', () => {
    it('should stop the timer on an Error', (done) => {
      let errorCompleted = 0;
      const errorStop = new TimerJobs(
        (done) => {
          errorCompleted++;
          done(new Error('something went wrong'));
        },
        {
          interval: 10,
        },
      );

      errorStop.start();
      // should have no effect
      errorStop.start();

      // this should give it plenty of time to have been called more than once,
      // thus (dis)proving stop on error
      setTimeout(() => {
        expect(errorCompleted).to.equal(1);
        done();
      }, 23);
    });

    it('should ignore errors', (done) => {
      let ignoreErrorsCompleted = 0;
      const ignoreErrors = new TimerJobs(
        (done) => {
          ignoreErrorsCompleted++;
          done(new Error('something went wrong'));
        },
        {
          interval: 7,
          autoStart: true,
          ignoreErrors: true,
        },
      );

      setTimeout(() => {
        ignoreErrors.stop();

        expect(ignoreErrorsCompleted).to.be.at.least(3);
        expect(ignoreErrors.errors.length).to.be.at.least(3);
        done();
      }, 30);
    });

    it('should assign 1 if an integer less than such is passed', () => {
      const lessThan = new TimerJobs((done) => done(), {
        infinite: false,
        countdown: 30,
        reference: 'lessThan',
        namespace: 'testing',
      });

      expect(lessThan.countdown).to.equal(30);

      lessThan.countdown = -20;

      expect(lessThan.countdown).to.equal(1);
    });

    it('should throw an error if no callback is defined', () => {
      expect(() => {
        new TimerJobs();
      }).to.throw('TimerJobs Error: a callback must be provided');
    });
  });

  describe('execute according to options', () => {
    it('should run once', (done) => {
      let runOnceCompleted = 0;
      new TimerJobs(
        (done) => {
          runOnceCompleted++;
          done();
        },
        {
          interval: 10,
          autoStart: true,
          infinite: false,
          emitLevel: 0,
        },
      );

      setTimeout(() => {
        expect(runOnceCompleted).to.equal(1);
        done();
      }, 25);
    });

    it('should run twice', (done) => {
      let runTwiceCompleted = 0;
      const runTwice = new TimerJobs(
        (done) => {
          runTwiceCompleted++;
          done();
        },
        {
          interval: 5,
          autoStart: true,
          infinite: false,
          countdown: 2.2, // will floor it
        },
      );

      expect(runTwice.countdown).to.equal(2);

      setTimeout(() => {
        expect(runTwice.countdown).to.equal(0);
        expect(runTwiceCompleted).to.equal(2);
        expect(runTwice.executions).to.equal(2);
        done();
      }, 13);
    });

    it('should be able to change infinite and countdown later', (done) => {
      let changeLaterCompleted = 0;
      const changeLater = new TimerJobs(
        (done) => {
          changeLaterCompleted++;
          done();
        },
        {
          interval: 5,
          autoStart: true,
        },
      );

      setTimeout(() => {
        changeLater.infinite = false;
        changeLater.countdown = 2;

        expect(changeLater.infinite).to.be.false;
        expect(changeLater.countdown).to.equal(2);

        setTimeout(() => {
          expect(changeLaterCompleted).to.equal(3);
          expect(changeLater.countdown).to.equal(0);

          changeLater.interval = 15;
          changeLater.start();

          // defineProperty fixes this previous shortcoming
          expect(changeLater.countdown).to.equal(2);

          setTimeout(() => {
            expect(changeLaterCompleted).to.equal(4);
            done();
          }, 15);
        }, 10);
      }, 10);
    });

    it('should continue to execute in non-blocking mode', (done) => {
      let notDoneCompleted = 0;
      const notDone = new TimerJobs(() => notDoneCompleted++, {
        blocking: false,
        autoStart: true,
        infinite: false,
        countdown: 3,
        interval: 20,
        immediate: true,
      });

      setTimeout(() => {
        notDone.stop();

        expect(notDone.executions).to.equal(notDoneCompleted);
        expect(notDone.countdown).to.equal(3);
        done();
      }, 82);
    });

    it('should block execution until a job finishes', (done) => {
      let blockingCompleted = 0;
      const blocking = new TimerJobs(
        (done) => {
          blockingCompleted++;

          setTimeout(done, 30);
        },
        {
          blocking: true,
          autoStart: true,
          immediate: true,
          interval: 10,
        },
      );

      setTimeout(() => {
        blocking.stop();

        expect(blockingCompleted).to.equal(2);
        expect(blocking.executions).to.equal(2);

        done();
      }, 50);
    });

    it('should return the time until next execution', (done) => {
      let timeLeftCompleted = 0;
      const timeLeft = new TimerJobs(
        (done) => {
          timeLeftCompleted += timeLeftCompleted;
          done();
        },
        {
          blocking: false,
          autoStart: false,
          infinite: true,
          interval: 200,
        },
      );

      // initializes to 0
      expect(timeLeft.waitTime()).to.equal(0);
      timeLeft.start();

      setTimeout(() => {
        const left = timeLeft.waitTime();
        expect(left).to.be.above(100);
        expect(left).to.be.below(200);
        timeLeft.stop();
        done();
      }, 80);
    });

    it('should restart the timer', (done) => {
      let restartComplete = 0;
      const restart = new TimerJobs(
        (done) => {
          restartComplete++;
          done();
        },
        {
          interval: 10,
          reference: 'restarter',
        },
      );

      restart.restart();

      expect(restart.stopped()).to.be.true;
      expect(restart.hasStarted).to.be.false;
      expect(restart.interval).to.equal(10);

      restart.start();

      setTimeout(() => {
        expect(restartComplete).to.equal(2);
        expect(restart.hasStarted).to.be.true;

        restart.restart(15);

        setTimeout(() => {
          expect(restart.started()).to.be.true;
          expect(restart.interval).to.equal(15);
          expect(restartComplete).to.equal(4);
          restart.stop();

          restart.restart();
          restart.stop();

          expect(restart.interval).to.equal(15);

          done();
        }, 35);
      }, 30);
    });
  });

  describe('emit events', () => {
    it('should emit when a job starts', (done) => {
      let emitStartComplete = 0;
      const emitStart = new TimerJobs(
        (done) => {
          emitStartComplete++;
          done();
        },
        {
          emitLevel: 1,
        },
      );

      emitStart.emitter.on('jobStart', () => {
        emitStart.stop();
        expect(emitStartComplete).to.equal(0);
        done();
      });

      emitStart.start();
    });

    it('should emit when a job stops', (done) => {
      let emitStopComplete = 0;
      const emitStop = new TimerJobs(
        (done) => {
          emitStopComplete++;
          done();
        },
        {
          autoStart: true,
          immediate: true,
          emitLevel: 3,
          reference: 'emitStop',
        },
      );

      emitStop.emitter.on('jobStop::emitStop', () => {
        expect(emitStopComplete).to.equal(1);
        done();
      });

      emitStop.stop();
    });

    it('should emit when a job begins', (done) => {
      let emitBeginComplete = 0;
      const emitBegin = new TimerJobs(
        (done) => {
          emitBeginComplete++;
          done();
        },
        {
          interval: 5,
          autoStart: true,
        },
      );

      emitBegin.emitter.on('jobBegin', () => {
        expect(emitBeginComplete).to.be.above(-1);
        expect(emitBeginComplete).to.be.below(3);

        if (emitBeginComplete === 2) {
          emitBegin.stop();
          done();
        }
      });
    });

    it('should emit when a job cycle ends', (done) => {
      let emitEndComplete = 0;
      const emitEnd = new TimerJobs(
        (done) => {
          emitEndComplete++;
          done(null, 1, 2, 3, 4, 5);
        },
        {
          interval: 10,
          autoStart: true,
          emitLevel: 4,
          namespace: 'emitEnd',
        },
      );

      emitEnd.emitter.on('jobEnd::emitEnd::timer', function (_timer, first) {
        const args = Array.prototype.slice.call(arguments, 1);
        expect(first).to.equal(1);
        expect(emitEndComplete).to.be.above(0).and.to.be.below(3);

        for (let i = 0; i < args.length; i++) {
          expect(args[i]).to.equal(i + 1);
        }

        if (emitEndComplete === 2) {
          emitEnd.stop();
          done();
        }
      });
    });

    it('should emit when a job completes', (done) => {
      let emitCompleteCompleted = 0;
      const emitComplete = new TimerJobs(
        (done) => {
          emitCompleteCompleted++;
          done();
        },
        {
          interval: 10,
          autoStart: true,
          immediate: true,
          infinite: false,
          countdown: 3,
          namespace: 'emitComplete',
          emitLevel: 2,
        },
      );

      emitComplete.emitter.on('jobComplete::emitComplete', () => {
        expect(emitCompleteCompleted).to.equal(3);
        done();
      });
    });

    it('should emit when there is an error', (done) => {
      let emitErrorCompleted = 0;
      const emitError = new TimerJobs(
        (done) => {
          emitErrorCompleted++;
          done(new Error('something went wrong'));
        },
        {
          interval: 10,
          ignoreErrors: false, // this is the default, but lets be explict
          autoStart: true,
          emitLevel: 3,
        },
      );

      emitError.emitter.on('jobError::timer', function (
        error: Error,
        timer: TimerJobs,
        errors: Error[],
      ) {
        expect(error).to.be.instanceof(Error);
        expect(emitError === timer).to.be.true;
        expect(emitErrorCompleted).to.equal(1);
        expect(errors).to.be.an('array');
        expect(errors).to.have.length(1);
        done();
      });
    });

    it('should emit on error with emitting disabled', (done) => {
      const emitDisabled = new TimerJobs(
        (done) => {
          done(new Error('I should still emit'));
        },
        {
          infinite: false,
          emitLevel: 0,
          interval: 10,
        },
      );

      emitDisabled.emitter.on('jobError', function (
        error: Error,
        timer: TimerJobs,
        errors: Error[],
      ) {
        expect(error).to.be.instanceof(Error);
        expect(timer).to.equal(emitDisabled);
        expect(errors).to.be.an('array');
        done();
      });

      emitDisabled.start();
    });

    it('should not start on "restart" emit, if timer has never started', () => {
      const neverStart = new TimerJobs((done) => done(), {
        interval: 10,
        restartOn: 'restartEvent',
      });

      expect(neverStart.hasStarted).to.be.false;

      neverStart.emitter.emit('restartEvent');

      expect(neverStart.hasStarted).to.be.false;
    });
  });

  describe('react on events', () => {
    let eventsCompleted = 0;

    const eventsTimer = new TimerJobs(
      (done) => {
        eventsCompleted++;
        done();
      },
      {
        interval: 100,
        immediate: true,
        startOn: 'startEvent',
        startCallback: function (
          startOn: TimerJobs,
          startOnCompleted: number,
          done: Mocha.Done,
        ) {
          expect(startOn.started()).to.be.true;
          expect(startOnCompleted).to.equal(0); //while it may have changed since starting, it was 0 when passed
          done();
        },
        stopOn: 'stopEvent',
        stopCallback: function (
          stopOn: TimerJobs,
          stopOnCompleted: number,
          done: Mocha.Done,
        ) {
          expect(stopOn.stopped()).to.be.true;
          expect(stopOnCompleted).to.equal(1);
          done();
        },
        restartOn: 'restartEvent',
        restartCallback: function (
          restartOn: TimerJobs,
          restartOnCompleted: number,
          done: Mocha.Done,
        ) {
          expect(restartOn.started()).to.be.true;
          expect(restartOnCompleted).to.equal(1);
          expect(restartOn.executions).to.equal(2);
          restartOn.stop();
          done();
        },
      },
    );

    it('should start when an event occurs', (done) => {
      // @ts-ignore
      eventsTimer.emit('startEvent', null, eventsTimer, eventsCompleted, done);
    });

    it('should stop when an event occurs', (done) => {
      // @ts-ignore
      eventsTimer.emit('stopEvent', null, eventsTimer, eventsCompleted, done);
    });

    it('should restart when an event occurs', (done) => {
      // @ts-ignore
      eventsTimer.emit(
        'restartEvent',
        null,
        eventsTimer,
        eventsCompleted,
        done,
      );
    });
  });

  describe('static functionality', () => {
    it('should have an array of added Timers', () => {
      expect(TimerJobs.timers).to.be.an('array');
      expect(TimerJobs.timers.length).to.be.at.least(19);
    });

    it('should have a default emitter', () => {
      expect(TimerJobs.emitter).to.be.undefined;
      const someEmitter = new EventEmitter2();
      TimerJobs.emitter = someEmitter;

      const timer = new TimerJobs(() => {});
      expect(timer.emitter === someEmitter).to.be.true;
    });
  });
});
