import { EventEmitter2 } from 'eventemitter2';
import { EmitLevel } from '../lib/emit-level';
import { TimerJobs } from '../lib';
import { expect } from 'chai';

describe('Sugar Syntax', () => {
  it('should create a timer with no options', () => {
    const timer = new TimerJobs();

    expect(timer).to.be.instanceOf(TimerJobs);
  });
  describe('Interval', () => {
    it('should set interval to 2 minutes (120000ms)', () => {
      const timer = new TimerJobs().every(2).minutes;

      expect(timer.interval).to.equal(120000);
    });

    it('should set interval to 1 week (6.048e+8ms)', () => {
      const timer = new TimerJobs().after(1).week;

      expect(timer.interval).to.equal(6.048e8);
    });

    it('should set interval to 3 hours and 2 minutes (10920000ms)', () => {
      const timer = new TimerJobs().after(3).hours.and(2).minutes;

      expect(timer.interval).to.equal(10920000);
    });

    it('should set interval to 1 week, 4 days, 7 hours, 17 minutes, 5 seconds and 345ms (976625345ms)', () => {
      const timer = new TimerJobs()
        .after(1)
        .week.and(4)
        .days.and(7)
        .hours.and(17)
        .minutes.and(5)
        .seconds.and(345).milliseconds;

      expect(timer.interval).to.equal(976625345);
    });

    it('should set interval to 1 day, 1 hour, 1 minute, 1 second (90061000ms)', () => {
      const timer = new TimerJobs().after(1).day.hour.minute.second;

      expect(timer.interval).to.equal(90061000);
    });

    it('should reset interval, then set to 500ms', () => {
      const timer = new TimerJobs()
        .after(3)
        .weeks.and(10)
        .minutes.every(500, true).milliseconds;

      expect(timer.interval).to.equal(500);
    });
  });

  it('should create a timer that runs immediately', () => {
    let exec = 0;

    const timer = new TimerJobs()
      .do(() => exec++)
      .every(10)
      .milliseconds.not.automatic.immediately.start();

    timer.stop();

    expect(exec).to.equal(1);
    expect(timer.isStopped).to.be.true;
  });

  it('should create a timer that starts automatically upon creation', (done) => {
    let exec = 0;

    const timer = new TimerJobs().do(() => exec++).every(5).seconds.immediate
      .automatically;

    expect(timer.hasStarted).to.be.false;

    setTimeout(() => {
      expect(timer.hasStarted).to.be.true;

      timer.stop();

      expect(exec).to.equal(1);
      done();
    }, 1);
  });

  describe('Options', () => {
    it('should set emit level', () => {
      const timer = new TimerJobs()
        .level(EmitLevel.Namespace)
        .do(() => {})
        .after(10).seconds;

      expect(timer.emitLevel).to.equal(EmitLevel.Namespace);
    });

    it('should set an eventemitter', () => {
      const emitter = new EventEmitter2();
      const timer = new TimerJobs().using(emitter);

      expect(timer.emitter).to.equal(emitter);
    });

    it('should set a namespace', () => {
      const timer = new TimerJobs().namespacing('testTimer');

      expect(timer.options.namespace).to.equal('testTimer');
    });

    it('should set a reference', () => {
      const timer = new TimerJobs().referencing('testTimerReference');

      expect(timer.options.reference).to.equal('testTimerReference');
    });

    it('should set infinite', () => {
      const timer = new TimerJobs().execute(() => {});

      expect(timer.infinite).to.be.true;

      timer.not.repeating;

      expect(timer.infinite).to.be.false;

      timer.repeat;

      expect(timer.infinite).to.be.true;
    });

    it('should set blocking', () => {
      const timer = new TimerJobs();

      expect(timer.options.blocking).to.be.true;

      timer.not.blocking;

      expect(timer.options.blocking).to.be.false;

      timer.blocks;

      expect(timer.options.blocking).to.be.true;
    });

    it('should set countdown', () => {
      const timer = new TimerJobs();

      expect(timer.countdown).to.equal(1);

      timer.twice;

      expect(timer.countdown).to.equal(2);

      timer.once;

      expect(timer.countdown).to.equal(1);

      timer.thrice;

      expect(timer.countdown).to.equal(3);

      timer.times(10);

      expect(timer.countdown).to.equal(10);
    });

    it('should set ignoreErrors', () => {
      const timer = new TimerJobs();

      expect(timer.options.ignoreErrors).to.be.false;

      timer.ignore;

      expect(timer.options.ignoreErrors).to.be.true;

      timer.not.ignoring;

      expect(timer.options.ignoreErrors).to.be.false;
    });

    it('should set immediate', () => {
      const timer = new TimerJobs();

      expect(timer.options.immediate).to.be.false;

      timer.immediate;

      expect(timer.options.immediate).to.be.true;

      timer.not.immediately;

      expect(timer.options.immediate).to.be.false;
    });

    it('should set infinite', () => {
      const timer = new TimerJobs();

      expect(timer.infinite).to.be.true;
      expect(timer.countdown).to.equal(1);

      timer.not.forever(4);

      expect(timer.infinite).to.be.false;
      expect(timer.countdown).to.equal(4);

      timer.forever();

      expect(timer.infinite).to.be.true;
    });

    it('should set a timer start event', () => {
      const startCallback = () => {};
      const timer = new TimerJobs().starting.on('startEvent', startCallback);

      expect(timer.options.startOn).to.equal('startEvent');
      expect(timer.options.startCallback).to.equal(startCallback);
    });

    it('should set a timer restart event', () => {
      const startCallback = () => {};
      const timer = new TimerJobs().restarting.on(
        'restartEvent',
        startCallback,
      );

      expect(timer.options.restartOn).to.equal('restartEvent');
      expect(timer.options.restartCallback).to.equal(startCallback);
    });

    it('should set a timer stop event', () => {
      const startCallback = () => {};
      const timer = new TimerJobs().stopping.on('stopEvent', startCallback);

      expect(timer.options.stopOn).to.equal('stopEvent');
      expect(timer.options.stopCallback).to.equal(startCallback);
    });
  });
});
