import { expect } from 'chai';

import serialize from '../../src/lib/serialize';

describe('serialize', () => {
  describe('Given a string', () => {
    it('should return a string', () => {
      expect(serialize('Hello World!')).to.equal('Hello World!');
    });
  });

  describe('Given a number', () => {
    it('should return a number', () => {
      expect(serialize(5)).to.equal(5);
    });
  });

  describe('Given a null', () => {
    it('should return a null', () => {
      expect(serialize(null)).to.equal(null);
    });
  });

  describe('Given an array', () => {
    it('should return an array', () => {
      expect(serialize([1, 2, 3])).to.deep.equal([1, 2, 3]);
    });
  });

  describe('Given a Date object', () => {
    it('should return a serialized Date object', () => {
      const date = new Date();
      expect(serialize(date)).to.deep.equal({
        __classObject: true,
        type: 'Date',
        data: date.toISOString(),
      });
    });
  });

  describe('Given a Set object', () => {
    it('should return a serialized Set object', () => {
      expect(serialize(new Set([1, 1, 2]))).to.deep.equal({
        __classObject: true,
        type: 'Set',
        data: [1, 2],
      });
    });
  });

  describe('Given a Map object', () => {
    it('should return a serialized Map object', () => {
      expect(serialize(new Map([['one', 1], ['two', 2]]))).to.deep.equal({
        __classObject: true,
        type: 'Map',
        data: [['one', 1], ['two', 2]],
      });
    });
  });

  describe('Given a plain object', () => {
    it('should return a plain object', () => {
      expect(serialize({
        one: 1,
        two: 2,
      })).to.deep.equal({
        one: 1,
        two: 2,
      });
    });
  });

  describe('Given a plain object with a Date property', () => {
    it('should return a plain object with a serialized Date property', () => {
      const date = new Date();
      expect(serialize({ date })).to.deep.equal({
        date: {
          __classObject: true,
          type: 'Date',
          data: date.toISOString(),
        },
      });
    });
  });
});
