import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider } from '@tanstack/react-query';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { routes } from '../router';
import { createQueryClient } from '../lib/queryClient';
import type { Track } from '../lib/api';
import en from '../locales/en.json';
import my from '../locales/my.json';

const songs: Track[] = [
  { id: 'id-comedy', source: 'spotify-tracks', sourceTrackId: 'source-comedy', title: 'Comedy', artistsText: 'Gen Hoshino',
    albumName: 'Comedy', genre: 'acoustic', popularity: 73, durationMs: 230666, explicit: false, catalogVersion: 'test-v1' },
  { id: 'id-other', source: 'spotify-tracks', sourceTrackId: 'source-other', title: 'Café မြန်မာ %_', artistsText: 'Another Artist',
    albumName: null, genre: 'demo', popularity: null, durationMs: null, explicit: true, catalogVersion: 'test-v1' },
];

function respond(input: RequestInfo | URL) {
  const url = new URL(String(input), 'http://test.local');
  if (url.pathname.includes('/tracks/')) {
    const song = songs.find((track) => track.id === url.pathname.split('/').at(-1));
    return Promise.resolve(new Response(JSON.stringify(song ? { data: song, meta: { requestId: 'test' } } : { error: { code: 'NOT_FOUND' } }),
      { status: song ? 200 : 404 }));
  }
  const q = (url.searchParams.get('q') || '').toLowerCase();
  const artist = url.searchParams.get('type') === 'artist';
  const data = songs.filter((track) => (artist ? track.artistsText : track.title).toLowerCase().includes(q));
  return Promise.resolve(new Response(JSON.stringify({ data,
    meta: { page: Number(url.searchParams.get('page') || 1), limit: 12, total: q ? data.length : 40, hasNext: !q, requestId: 'test' } })));
}

const fetchMock = vi.fn(respond);
beforeEach(() => { fetchMock.mockReset().mockImplementation(respond); vi.stubGlobal('fetch', fetchMock); });
function mount(path = '/') {
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const result = render(<QueryClientProvider client={createQueryClient()}><RouterProvider router={router} /></QueryClientProvider>);
  return { ...result, router };
}
const calls = () => fetchMock.mock.calls.map(([url]) => new URL(String(url), 'http://test.local'));

describe('M04 catalog experience', () => {
  it('renders API tracks and navigates from Home to real song details', async () => {
    mount();
    await userEvent.click((await screen.findAllByRole('link', { name: 'View details for Comedy' }))[0]);
    expect(await screen.findByRole('heading', { level: 1, name: 'Comedy' })).toBeVisible();
    expect(screen.getByText('source-comedy')).toBeVisible();
    expect(screen.getByText(en.noArtwork)).toBeVisible();
    expect(screen.queryByRole('button', { name: /play/i })).not.toBeInTheDocument();
  });

  it('debounces title search and commits its query to the URL', async () => {
    const { router } = mount('/search');
    const input = screen.getByRole('textbox', { name: en.searchLabel });
    await userEvent.type(input, 'Comedy');
    await waitFor(() => expect(calls().some((url) => url.searchParams.get('q') === 'Comedy')).toBe(true));
    expect(router.state.location.search).toContain('q=Comedy');
    expect(await screen.findByRole('link', { name: 'View details for Comedy' })).toBeVisible();
    expect(calls().some((url) => url.searchParams.get('q') === 'Com')).toBe(false);
  });

  it('switches to artist-text search and renders matching songs', async () => {
    mount('/search');
    await userEvent.click(screen.getByRole('button', { name: 'Artists' }));
    await userEvent.type(screen.getByRole('textbox', { name: en.searchLabel }), 'Hoshino');
    await waitFor(() => expect(calls().some((url) => url.searchParams.get('type') === 'artist' && url.searchParams.get('q') === 'Hoshino')).toBe(true));
    expect(await screen.findByRole('link', { name: 'View details for Comedy' })).toBeVisible();
    expect(screen.getByText(en.artistSearchNote)).toBeVisible();
  });

  it('paginates using the URL while retaining the search mode', async () => {
    const { router } = mount('/search?type=artist');
    await userEvent.click(await screen.findByRole('button', { name: en.next }));
    await waitFor(() => expect(calls().some((url) => url.searchParams.get('page') === '2' && url.searchParams.get('type') === 'artist')).toBe(true));
    expect(router.state.location.search).toContain('page=2');
  });

  it('shows an empty result and lets the user reset the query', async () => {
    mount('/search?q=does-not-exist');
    expect(await screen.findByRole('heading', { name: en.emptyTitle })).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: en.resetSearch }));
    expect(await screen.findByRole('link', { name: 'View details for Comedy' })).toBeVisible();
    expect(screen.getByRole('textbox', { name: en.searchLabel })).toHaveValue('');
  });

  it('shows API failure and recovers after retry', async () => {
    fetchMock.mockRejectedValueOnce(new Error('offline'));
    mount('/search');
    expect(await screen.findByRole('alert')).toHaveTextContent(en.errorTitle);
    await userEvent.click(screen.getByRole('button', { name: en.retry }));
    expect(await screen.findByRole('link', { name: 'View details for Comedy' })).toBeVisible();
  });

  it('shows loading while data is pending', async () => {
    fetchMock.mockImplementationOnce(() => new Promise(() => {}));
    mount('/search');
    expect(screen.getByRole('status', { name: en.loading })).toBeVisible();
  });

  it('handles a missing song separately from a missing page', async () => {
    const first = mount('/tracks/unknown');
    expect(await screen.findByRole('heading', { name: en.songNotFound })).toBeVisible();
    first.unmount();
    mount('/not-a-page');
    expect(screen.getByRole('heading', { name: en.notFoundTitle })).toBeVisible();
  });

  it('does not invent absent metadata or audio/artwork links', async () => {
    mount('/tracks/id-other');
    expect(await screen.findByRole('heading', { name: songs[1].title })).toBeVisible();
    expect(screen.getAllByText(en.notProvided)).toHaveLength(3);
    expect(document.querySelector('audio')).toBeNull();
    expect(document.querySelector('img')).toBeNull();
  });

  it('keeps English/Burmese key coverage aligned and can switch the core UI', async () => {
    expect(Object.keys(my).sort()).toEqual(Object.keys(en).sort());
    mount('/search');
    await userEvent.click(screen.getByRole('button', { name: en.language }));
    expect(await screen.findByRole('heading', { name: my.searchTitle })).toBeVisible();
    expect(document.documentElement.lang).toBe('my');
  });
});
