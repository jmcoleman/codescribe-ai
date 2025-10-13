/**
 * Sample JavaScript file for upload testing
 * This file is used to test .js file upload functionality
 */

function calculateSum(a, b) {
  return a + b;
}

function calculateProduct(a, b) {
  return a * b;
}

class Calculator {
  constructor() {
    this.history = [];
  }

  add(a, b) {
    const result = a + b;
    this.history.push({ operation: 'add', result });
    return result;
  }

  multiply(a, b) {
    const result = a * b;
    this.history.push({ operation: 'multiply', result });
    return result;
  }

  getHistory() {
    return this.history;
  }
}

module.exports = { calculateSum, calculateProduct, Calculator };
