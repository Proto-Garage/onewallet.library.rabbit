import R from 'ramda';

function deserialize(object: any): any {
  const type = typeof object;


  if (type === 'object') {
    if (object === null) {
      return null;
    }

    // eslint-disable-next-line no-underscore-dangle
    if (object.__classObject) {
      if (object.type === 'Date') {
        return new Date(object.data);
      }

      if (object.type === 'Set') {
        return new Set(object.data);
      }

      if (object.type === 'Map') {
        return new Map(object.data);
      }
    }

    return R.map(deserialize)(object);
  }

  return object;
}

export default deserialize;
