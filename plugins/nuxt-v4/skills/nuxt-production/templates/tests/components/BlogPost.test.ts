import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import BlogPost from '~/components/BlogPost.vue'

describe('BlogPost', () => {
  const mockPost = {
    id: '1',
    title: 'Test Post',
    excerpt: 'This is a test post',
    content: 'Full content here',
    author: 'John Doe',
    createdAt: new Date('2025-01-01')
  }

  it('renders post title', async () => {
    const wrapper = await mountSuspended(BlogPost, {
      props: { post: mockPost }
    })

    expect(wrapper.text()).toContain('Test Post')
  })

  it('renders post excerpt', async () => {
    const wrapper = await mountSuspended(BlogPost, {
      props: { post: mockPost }
    })

    expect(wrapper.text()).toContain('This is a test post')
  })

  it('renders author name', async () => {
    const wrapper = await mountSuspended(BlogPost, {
      props: { post: mockPost }
    })

    expect(wrapper.text()).toContain('John Doe')
  })

  it('emits click event when clicked', async () => {
    const wrapper = await mountSuspended(BlogPost, {
      props: { post: mockPost }
    })

    await wrapper.trigger('click')

    expect(wrapper.emitted('click')).toBeTruthy()
  })
})
