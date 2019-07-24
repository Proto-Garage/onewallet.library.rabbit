import { expect } from 'chai';

import deserialize from '../../src/lib/deserialize';

describe('deserialize', () => {
  describe('Given a string', () => {
    it('should return a string', () => {
      expect(deserialize('Hello World!')).to.equal('Hello World!');
    });
  });

  describe('Given a number', () => {
    it('should return a number', () => {
      expect(deserialize(5)).to.equal(5);
    });
  });

  describe('Given a null', () => {
    it('should return a null', () => {
      expect(deserialize(null)).to.equal(null);
    });
  });

  describe('Given an array', () => {
    it('should return an array', () => {
      expect(deserialize([1, 2, 3])).to.deep.equal([1, 2, 3]);
    });
  });

  describe('Given a serialized Date object', () => {
    it('should return a serialized Date object', () => {
      const date = new Date();
      expect(deserialize({
        __classObject: true,
        type: 'Date',
        data: date.toISOString(),
      })).to.deep.equal(date);
    });
  });

  describe('Given a Set object', () => {
    it('should return a serialized Set object', () => {
      expect(deserialize({
        __classObject: true,
        type: 'Set',
        data: [1, 2],
      })).to.deep.equal(new Set([1, 2]));
    });
  });

  describe('Given a Map object', () => {
    it('should return a serialized Map object', () => {
      expect(deserialize({
        __classObject: true,
        type: 'Map',
        data: [['one', 1], ['two', 2]],
      })).to.deep.equal(new Map([['one', 1], ['two', 2]]));
    });
  });

  describe('Given a plain object', () => {
    it('should return a plain object', () => {
      expect(deserialize({
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
      expect(deserialize({
        date: {
          __classObject: true,
          type: 'Date',
          data: date.toISOString(),
        },
      })).to.deep.equal({
        date,
      });
    });
  });
});
