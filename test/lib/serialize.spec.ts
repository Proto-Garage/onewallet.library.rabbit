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
      const object = {
        id: '534aaff3-35fc-4aa1-a6f5-93bb9ede139f',
        admin: 'acc_9939c4d8bdbf5c379b6d26548f524f1c',
        isDefault: true,
        name: 'Regular',
        description: 'Hello',
        handlingFeeType: 'percentage',
        handlingFee: 0.001,
        minimumSingleWithdrawalLimit: 10,
        maximumSingleWithdrawalLimit: 1000,
        maximumDailyWithdrawalLimit: 10000,
      };

      expect(serialize(object)).to.deep.equal(object);
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

  describe('Given a complex object', () => {
    const input = {
      totalCount: 2,
      edges: [
        {
          cursor: 'anlqazZnOGs4NTg4NzcwNWRlMDI0MTE5',
          node: {
            id: 'acc_5e0554db5b6e4fa38b836d4eec3ecee7',
            username: 'a048cb5b-cc9a-49c9-8d12-e5c4b7dd0b41',
            firstname: null,
            lastname: null,
            nickname: null,
            email: null,
            currency: 'PHP',
            language: 'en',
            parent: null,
            admin: null,
            memberLevel: null,
            mobilePhone: null,
            wechat: null,
            qqnumber: null,
            gender: null,
            adminCode: null,
            role: 'member',
            site: null,
            enabled: true,
            frozen: false,
            lastLoginDateTime: new Date('2019-07-26T03:41:07.892Z'),
            registrationDateTime: new Date('2019-07-26T03:41:07.892Z'),
            timezone: 'UTC',
            timestamp: new Date('2019-07-26T03:41:07.892Z'),
            dateTimeCreated: new Date('2019-07-26T03:41:07.892Z'),
            dateTimeUpdated: new Date('2019-07-26T03:41:07.892Z'),
            vendors: null,
            revenueShares: null,
            affiliate: null,
            agent: null,
            affiliateCode: null,
            registrationMeta: null,
            adminInformation: {},
            agentLevel: null,
            permissionGroups: [],
            notes: null,
            cursor: 'jyjk6g8k85887705de024119',
            permissions: [],
          },
        },
        {
          cursor: 'anlqazZnOGswNzMyNGEzZGU4NTE5ZGZi',
          node: {
            id: 'acc_38c2bcd2e93340bfbe131f37047c056c',
            username: '83a4446c-f348-41c6-ada9-745155ebb634',
            firstname: null,
            lastname: null,
            nickname: null,
            email: null,
            currency: 'PHP',
            language: 'en',
            parent: null,
            admin: null,
            memberLevel: null,
            mobilePhone: null,
            wechat: null,
            qqnumber: null,
            gender: null,
            adminCode: null,
            role: 'member',
            site: null,
            enabled: true,
            frozen: false,
            lastLoginDateTime: new Date('2019-07-26T03:41:07.893Z'),
            registrationDateTime: new Date('2019-07-26T03:41:07.893Z'),
            timezone: 'UTC',
            timestamp: new Date('2019-07-26T03:41:07.892Z'),
            dateTimeCreated: new Date('2019-07-26T03:41:07.892Z'),
            dateTimeUpdated: new Date('2019-07-26T03:41:07.892Z'),
            vendors: null,
            revenueShares: null,
            affiliate: null,
            agent: null,
            affiliateCode: null,
            registrationMeta: null,
            adminInformation: {},
            agentLevel: null,
            permissionGroups: [],
            notes: null,
            cursor: 'jyjk6g8k07324a3de8519dfb',
            permissions: [],
          },
        },
      ],
      pageInfo: { endCursor: 'anlqazZnOGswNzMyNGEzZGU4NTE5ZGZi', hasNextPage: false },
    };

    it('should serialize correctly', () => {
      expect(serialize(input)).to.deep.equal({
        totalCount: 2,
        edges: [
          {
            cursor: 'anlqazZnOGs4NTg4NzcwNWRlMDI0MTE5',
            node: {
              id: 'acc_5e0554db5b6e4fa38b836d4eec3ecee7',
              username: 'a048cb5b-cc9a-49c9-8d12-e5c4b7dd0b41',
              firstname: null,
              lastname: null,
              nickname: null,
              email: null,
              currency: 'PHP',
              language: 'en',
              parent: null,
              admin: null,
              memberLevel: null,
              mobilePhone: null,
              wechat: null,
              qqnumber: null,
              gender: null,
              adminCode: null,
              role: 'member',
              site: null,
              enabled: true,
              frozen: false,
              lastLoginDateTime: { __classObject: true, type: 'Date', data: '2019-07-26T03:41:07.892Z' },
              registrationDateTime: { __classObject: true, type: 'Date', data: '2019-07-26T03:41:07.892Z' },
              timezone: 'UTC',
              timestamp: { __classObject: true, type: 'Date', data: '2019-07-26T03:41:07.892Z' },
              dateTimeCreated: { __classObject: true, type: 'Date', data: '2019-07-26T03:41:07.892Z' },
              dateTimeUpdated: { __classObject: true, type: 'Date', data: '2019-07-26T03:41:07.892Z' },
              vendors: null,
              revenueShares: null,
              affiliate: null,
              agent: null,
              affiliateCode: null,
              registrationMeta: null,
              adminInformation: {},
              agentLevel: null,
              permissionGroups: [],
              notes: null,
              cursor: 'jyjk6g8k85887705de024119',
              permissions: [],
            },
          },
          {
            cursor: 'anlqazZnOGswNzMyNGEzZGU4NTE5ZGZi',
            node: {
              id: 'acc_38c2bcd2e93340bfbe131f37047c056c',
              username: '83a4446c-f348-41c6-ada9-745155ebb634',
              firstname: null,
              lastname: null,
              nickname: null,
              email: null,
              currency: 'PHP',
              language: 'en',
              parent: null,
              admin: null,
              memberLevel: null,
              mobilePhone: null,
              wechat: null,
              qqnumber: null,
              gender: null,
              adminCode: null,
              role: 'member',
              site: null,
              enabled: true,
              frozen: false,
              lastLoginDateTime: { __classObject: true, type: 'Date', data: '2019-07-26T03:41:07.893Z' },
              registrationDateTime: { __classObject: true, type: 'Date', data: '2019-07-26T03:41:07.893Z' },
              timezone: 'UTC',
              timestamp: { __classObject: true, type: 'Date', data: '2019-07-26T03:41:07.892Z' },
              dateTimeCreated: { __classObject: true, type: 'Date', data: '2019-07-26T03:41:07.892Z' },
              dateTimeUpdated: { __classObject: true, type: 'Date', data: '2019-07-26T03:41:07.892Z' },
              vendors: null,
              revenueShares: null,
              affiliate: null,
              agent: null,
              affiliateCode: null,
              registrationMeta: null,
              adminInformation: {},
              agentLevel: null,
              permissionGroups: [],
              notes: null,
              cursor: 'jyjk6g8k07324a3de8519dfb',
              permissions: [],
            },
          },
        ],
        pageInfo: { endCursor: 'anlqazZnOGswNzMyNGEzZGU4NTE5ZGZi', hasNextPage: false },
      });
    });
  });
});
