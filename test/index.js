'use strict'

const test = require('tape')
const uuid = require('uuid/v4')
const suite = require('abstract-level/test')
const { BrowserLevel } = require('..')

const testCommon = suite.common({
  test,
  factory (options) {
    return new BrowserLevel(uuid(), options)
  }
})

// Test abstract-level compliance
suite(testCommon)

// Additional tests for this implementation
require('./custom-test')(test, testCommon)
