import { beforeEach, describe, expect, it } from 'vitest'
import { installUniStorage } from './setup.js'
import {
  defaultLicenseRule,
  ipRightsApi,
  validateLicenseRule
} from '../utils/api/ipRights.js'

beforeEach(() => installUniStorage())

describe('IP license versions', () => {
  it('blocks conflicting structured rules', () => {
    const rule = defaultLicenseRule()
    rule.commercialAllowed = true
    expect(validateLicenseRule(rule).commercialAllowed).toBeTruthy()
  })

  it('keeps immutable snapshots for published versions and orders', () => {
    const rule = defaultLicenseRule()
    rule.repostAllowed = true
    const version = ipRightsApi.createLicenseVersion(rule, 'content_1')
    const order = ipRightsApi.createOrder('content_1', version.id)
    rule.repostAllowed = false
    expect(version.ruleSnapshot.repostAllowed).toBe(true)
    expect(order.licenseSnapshot.ruleSnapshot.repostAllowed).toBe(true)
  })
})
