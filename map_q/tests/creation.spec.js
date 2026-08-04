import { beforeEach, describe, expect, it } from 'vitest'
import { installUniStorage } from './setup.js'
import {
  CREATION_STATUS,
  createCreationDraft,
  creationApi,
  validateCreationDraft
} from '../utils/api/creation.js'
import { MEDIA_STATUS } from '../utils/api/mediaUpload.js'

beforeEach(() => installUniStorage())

const uploadedImage = () => ({
  id: 'media_ok',
  kind: 'image',
  status: MEDIA_STATUS.SUCCEEDED,
  remoteUrl: '/mock/image.jpg'
})

describe('creation lifecycle', () => {
  it('rejects an empty normal draft', () => {
    const errors = validateCreationDraft(createCreationDraft('normal'))
    expect(errors.content).toBeTruthy()
  })

  it('creates scoped map, channel and timeline products', async () => {
    const draft = createCreationDraft('normal', {
      text: '成都街巷记录',
      media: [uploadedImage()],
      location: {
        precision: 'exact',
        name: '春熙路',
        address: '成都市锦江区',
        latitude: 30.657,
        longitude: 104.081
      },
      visibility: 'public'
    })
    const record = await creationApi.submit(draft)
    expect(record.status).toBe(CREATION_STATUS.REVIEW_PENDING)
    expect(record.anchorId).toBeTruthy()
    expect(record.channelRecordId).toBeTruthy()
    expect(creationApi.getTimelineRecords()[0].recordId).toBe(record.id)
  })

  it('publishes due records and updates generated products', async () => {
    const draft = createCreationDraft('normal', {
      text: '到期审核内容',
      location: {
        precision: 'exact',
        name: '测试点',
        address: '',
        latitude: 30.57,
        longitude: 104.06
      }
    })
    const record = await creationApi.submit(draft)
    const changed = creationApi.processDue(record.moderation.nextReviewAt + 1)
    expect(changed[0].status).toBe(CREATION_STATUS.PUBLISHED)
    expect(creationApi.getMapItems()[0].authorOnly).toBe(false)
    expect(creationApi.getTimelineRecords()[0].status).toBe(CREATION_STATUS.PUBLISHED)
  })
})
