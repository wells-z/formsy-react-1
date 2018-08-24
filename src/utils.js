export function arraysDiffer(a, b) {
  let isDifferent = false;
  if (a.length == 0 && b.length == 0) {
    isDifferent = true;
  }
  else if (a.length !== b.length) {
    isDifferent = true;
  } else {
    a.forEach((item, index) => {
      if (!isSame(item, b[index])) {
        isDifferent = true;
      }
    });
  }
  return isDifferent;
}

export function objectsDiffer(a, b) {
  let isDifferent = false;
  if (Object.keys(a).length !== Object.keys(b).length) {
    isDifferent = true;
  } else {
    Object.keys(a).forEach((key) => {
      if (isSame(a[key], b[key])) {
        isDifferent = true;
      }
    });
  }
  return isDifferent;
}

export function isSame(a, b) {
  if (typeof a !== typeof b) {
    return false;
  } else if (Array.isArray(a) && Array.isArray(b)) {
    return arraysDiffer(a, b);
  } else if (typeof a === 'function') {
    return a.toString() === b.toString();
  } else if (typeof a === 'object' && a !== null && b !== null) {
    return objectsDiffer(a, b);
  }

  return a === b;
}

export function find(collection, fn) {
  for (let i = 0, l = collection.length; i < l; i += 1) {
    const item = collection[i];
    if (fn(item)) {
      return item;
    }
  }
  return null;
}

export function runRules(value, currentValues, validations, validationRules) {
  const results = {
    errors: [],
    failed: [],
    success: [],
  };

  if (Object.keys(validations).length) {
    Object.keys(validations).forEach((validationMethod) => {
      if (validationRules[validationMethod] && typeof validations[validationMethod] === 'function') {
        throw new Error(`Formsy does not allow you to override default validations: ${validationMethod}`);
      }

      if (!validationRules[validationMethod] && typeof validations[validationMethod] !== 'function') {
        throw new Error(`Formsy does not have the validation rule: ${validationMethod}`);
      }

      if (typeof validations[validationMethod] === 'function') {
        const validation = validations[validationMethod](currentValues, value);
        if (typeof validation === 'string') {
          results.errors.push(validation);
          results.failed.push(validationMethod);
        } else if (!validation) {
          results.failed.push(validationMethod);
        }
        return;
      } else if (typeof validations[validationMethod] !== 'function') {
        const validation = validationRules[validationMethod](
          currentValues,
          value,
          validations[validationMethod],
        );

        if (typeof validation === 'string') {
          results.errors.push(validation);
          results.failed.push(validationMethod);
        } else if (!validation) {
          results.failed.push(validationMethod);
        } else {
          results.success.push(validationMethod);
        }
        return;
      }

      results.success.push(validationMethod);
    });
  }

  return results;
}

export function convertValidationsToObject(validations) {
  if (typeof validations === 'string') {
    return validations.split(/,(?![^{[]*[}\]])/g).reduce((validationsAccumulator, validation) => {
      let args = validation.split(':');
      const validateMethod = args.shift();

      args = args.map((arg) => {
        try {
          return JSON.parse(arg);
        } catch (e) {
          return arg; // It is a string if it can not parse it
        }
      });

      if (args.length > 1) {
        throw new Error('Formsy does not support multiple args on string validations. Use object format of validations instead.');
      }

      // Avoid parameter reassignment
      const validationsAccumulatorCopy = Object.assign({}, validationsAccumulator);
      validationsAccumulatorCopy[validateMethod] = args.length ? args[0] : true;
      return validationsAccumulatorCopy;
    }, {});
  }

  return validations || {};
}
