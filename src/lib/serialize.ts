import R from 'ramda';

function serialize(object: any): any {
  const type = typeof object;

  if (type === 'object') {
    if (object instanceof Date) {
      return {
        __classObject: true,
        type: 'Date',
        data: object.toISOString(),
      };
    }

    if (object instanceof Set) {
      return {
        __classObject: true,
        type: 'Set',
        data: Array.from(object),
      };
    }

    if (object instanceof Map) {
      return {
        __classObject: true,
        type: 'Map',
        data: Array.from(object),
      };
    }

    if (object instanceof Buffer) {
      return {
        __classObject: true,
        type: 'Buffer',
        data: object.toString('base64'),
      };
    }

    if (object === null) {
      return null;
    }

    return R.map(serialize)(object);
  }

  return object;
}

export default serialize;
