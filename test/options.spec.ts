import { EmitLevel } from '../lib/emit-level';
import { Options } from '../lib/options';
import { TimerJobs } from '../lib';
import { expect } from 'chai';

describe('TimerJob Options', () => {
  it('should assign default values', function () {
    const allDefaults = new Options();

    expect(allDefaults.blocking).to.be.true;
    expect(allDefaults.interval).to.equal(3000);
    expect(allDefaults.autoStart).to.be.false;
    expect(allDefaults.immediate).to.be.false;
    expect(allDefaults.ignoreErrors).to.be.false;
    expect(allDefaults.infinite).to.be.true;
    expect(allDefaults.countdown).to.equal(1);
    expect(allDefaults.reference).to.equal('timer');
    expect(allDefaults.namespace).to.equal('');
    expect(allDefaults.stopOn).to.be.null;
    expect(allDefaults.startOn).to.be.null;
    expect(allDefaults.restartOn).to.be.null;
    expect(allDefaults.stopCallback).to.be.a('function');
    expect(allDefaults.startCallback).to.be.a('function');
    expect(allDefaults.restartCallback).to.be.a('function');
    expect(allDefaults.delimiter).to.equal('::');
    expect(allDefaults.emitter).to.be.null;
    expect(allDefaults.emitLevel).to.equal(1);
  });

  it('should accept options in place of default values', function () {
    const noDefaults = new Options({
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
      emitLevel: EmitLevel.Reference,
    });

    expect(noDefaults.blocking).to.be.false;
    expect(noDefaults.interval).to.equal(100);
    expect(noDefaults.autoStart).to.be.true;
    expect(noDefaults.immediate).to.be.true;
    expect(noDefaults.ignoreErrors).to.be.true;
    expect(noDefaults.infinite).to.be.false;
    expect(noDefaults.countdown).to.equal(3);
    expect(noDefaults.reference).to.equal('noDefaults');
    expect(noDefaults.namespace).to.equal('mynamespace');
    expect(noDefaults.stopOn).to.equal('stoppingEvent');
    expect(noDefaults.startOn).to.equal('startEvent');
    expect(noDefaults.restartOn).to.equal('restartsEvent');
    expect(noDefaults.stopCallback).to.be.a('function');
    expect(noDefaults.startCallback).to.be.a('function');
    expect(noDefaults.restartCallback).to.be.a('function');
    expect(noDefaults.delimiter).to.equal('##');
    expect(noDefaults.emitter).to.be.null;
    expect(noDefaults.emitLevel).to.equal(3);
  });

  it('should instantiate Options through TimerJobs without providing a callback', () => {
    expect(() => new TimerJobs()).to.not.throw;

    const timer = new TimerJobs({});
    const options = new Options();

    Object.keys(options).forEach((property) => {
      expect((timer as any).options[property]).to.equal(
        (options as any)[property],
      );
    });
  });
});
