import { not, isNumber, isFunction } from '../lib/helpers';
import { expect } from 'chai';

describe('TimerJob Helpers', () => {
  it('should determine if passed value is a number', () => {
    expect(isNumber(34)).to.be.true;
    expect(isNumber(100000000000)).to.be.true;
    expect(isNumber(-1000)).to.be.true;
    expect(isNumber(234.234234)).to.be.true;

    expect(isNumber(false)).to.be.false;
    expect(isNumber('keyboard cat')).to.be.false;
    expect(isNumber({})).to.be.false;
  });

  it('should return the opposite boolean value', () => {
    expect(not(false)).to.be.true;
    expect(not(0)).to.be.true;
    expect(not(undefined)).to.be.true;
    expect(not('')).to.be.true;

    expect(not(true)).to.be.false;
    expect(not(1)).to.be.false;
    expect(not({})).to.be.false;
    expect(not([])).to.be.false;
    expect(not('cat')).to.be.false;
  });

  it('should determine if passed value is a function', () => {
    expect(isFunction(() => {})).to.be.true;
    expect(isFunction(expect)).to.be.true;

    expect(isFunction('cat')).to.be.false;
    expect(isFunction([])).to.be.false;
    expect(isFunction({})).to.be.false;
    expect(isFunction(1)).to.be.false;
    expect(isFunction(false)).to.be.false;
  });
});
