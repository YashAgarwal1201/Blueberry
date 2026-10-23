import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import TrailerModal from '../TrailerModal.vue';

describe('TrailerModal.vue', () => {
  const mountComponent = (props: Record<string, unknown> = {}) => {
    return mount(TrailerModal, {
      props: {
        visible: false,
        ...props,
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    });
  };

  it('does not render modal content when visible is false', () => {
    const wrapper = mountComponent({
      visible: false,
      trailerKey: 'dQw4w9WgXcQ',
    });

    expect(wrapper.find('iframe').exists()).toBe(false);
    expect(wrapper.find('video').exists()).toBe(false);
  });

  it('renders YouTube nocookie embed iframe when trailerKey is provided', () => {
    const wrapper = mountComponent({
      visible: true,
      trailerKey: 'dQw4w9WgXcQ',
      title: 'Inception',
      mediaType: 'movie',
    });

    const iframe = wrapper.find('iframe');
    expect(iframe.exists()).toBe(true);
    expect(iframe.attributes('src')).toContain('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ');
    expect(iframe.attributes('src')).toContain('autoplay=1');
    expect(wrapper.text()).toContain('Inception — Official Trailer');
    expect(wrapper.text()).toContain('Movie Preview');
  });

  it('resolves standard YouTube watch URLs', () => {
    const wrapper = mountComponent({
      visible: true,
      videoUrl: 'https://www.youtube.com/watch?v=abc123XYZ',
    });

    const iframe = wrapper.find('iframe');
    expect(iframe.exists()).toBe(true);
    expect(iframe.attributes('src')).toContain('https://www.youtube-nocookie.com/embed/abc123XYZ');
  });

  it('resolves youtu.be short URLs', () => {
    const wrapper = mountComponent({
      visible: true,
      videoUrl: 'https://youtu.be/shortKey123',
    });

    const iframe = wrapper.find('iframe');
    expect(iframe.exists()).toBe(true);
    expect(iframe.attributes('src')).toContain('https://www.youtube-nocookie.com/embed/shortKey123');
  });

  it('resolves Vimeo URLs', () => {
    const wrapper = mountComponent({
      visible: true,
      videoUrl: 'https://vimeo.com/76979871',
    });

    const iframe = wrapper.find('iframe');
    expect(iframe.exists()).toBe(true);
    expect(iframe.attributes('src')).toBe('https://player.vimeo.com/video/76979871?autoplay=1');
  });

  it('renders native video player for mp4 video files', () => {
    const wrapper = mountComponent({
      visible: true,
      videoUrl: 'https://example.com/trailers/sample.mp4',
    });

    const video = wrapper.find('video');
    expect(video.exists()).toBe(true);
    expect(video.attributes('src')).toBe('https://example.com/trailers/sample.mp4');
    expect(wrapper.find('iframe').exists()).toBe(false);
  });

  it('displays fallback state when neither trailerKey nor videoUrl is provided', () => {
    const wrapper = mountComponent({
      visible: true,
      trailerKey: null,
      videoUrl: null,
    });

    expect(wrapper.find('iframe').exists()).toBe(false);
    expect(wrapper.find('video').exists()).toBe(false);
    expect(wrapper.text()).toContain('Trailer unavailable');
  });

  it('emits update:visible and close when close button is clicked', async () => {
    const wrapper = mountComponent({
      visible: true,
      trailerKey: 'dQw4w9WgXcQ',
    });

    const closeButton = wrapper.find('button[aria-label="Close trailer"]');
    expect(closeButton.exists()).toBe(true);

    await closeButton.trigger('click');
    expect(wrapper.emitted('update:visible')?.[0]).toEqual([false]);
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('emits update:visible and close when Escape key is pressed', () => {
    const wrapper = mountComponent({
      visible: true,
      trailerKey: 'dQw4w9WgXcQ',
    });

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(wrapper.emitted('update:visible')?.[0]).toEqual([false]);
    expect(wrapper.emitted('close')).toBeTruthy();
  });
});
