'use strict';

const chai = require('chai');
const { expect } = chai;
const {
  not,
  isString,
  isEmptyString,
  isNumber,
  inRange,
  isFunction,
} = require('../lib');

describe('TimerJob Helpers', () => {
  it('should return true if value is a string', () => {
    expect(isString('')).to.be.true;
    expect(isString('keyboard cat')).to.be.true;

    expect(isString(undefined)).to.be.false;
    expect(isString([])).to.be.false;
  });

  it('should determine if passed value is a number', () => {
    expect(isNumber(34)).to.be.true;
    expect(isNumber(100000000000)).to.be.true;
    expect(isNumber(-1000)).to.be.true;
    expect(isNumber(234.234234)).to.be.true;

    expect(isNumber(false)).to.be.false;
    expect(isNumber('keyboard cat')).to.be.false;
    expect(isNumber({})).to.be.false;
  });

  it('should determine if passed value is an empty string', () => {
    expect(isEmptyString('')).to.be.true;
    expect(isEmptyString('     ')).to.be.true;

    expect(isEmptyString('keyboard cat')).to.be.false;
    expect(isEmptyString(99)).to.be.false;
    expect(isEmptyString(undefined)).to.be.false;
  });

  it('should determine if passed value is in range', () => {
    expect(inRange(0)).to.be.true;
    expect(inRange(0.9, 0)).to.be.true;
    expect(inRange(7, 10, 5)).to.be.true;
    expect(inRange(4, 3, 5)).to.be.true;

    expect(inRange(7, 3, 5)).to.be.false;
    expect(inRange(5, 0, 5)).to.be.false;
    expect(inRange(7)).to.be.false;
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
