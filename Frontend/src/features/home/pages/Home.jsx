import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import './home.scss'
import Player from '../components/Player'
import MoodDetector from '../components/MoodDetector'
import SongCard from '../components/SongCard'
import { useAuth } from '../../auth/hooks/useAuth'
import { useSong } from '../hooks/useSong'
import { createPlaylist } from '../service/playlist.api'
import { getSavedSongs, getSavedPlaylists, savePlaylist, removeSavedPlaylist, removeSavedSong } from '../service/song.api'

// Refresh SVG icon
const RefreshIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13" aria-hidden="true">
        <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
)

const Home = () => {
    const { user, loading: authLoading } = useAuth()
    const { handleGetPlaylist, song, setSong, loading, handleSaveSong, handleSaveSpotifySong, handleSaveYoutubeSong } = useSong()

    const userName = user?.username || user?.email || 'Guest Listener'
    const userMeta = user ? 'Logged in' : 'Not signed in'
    const userInitial = userName ? userName[0].toUpperCase() : '👤'

    const [playlist, setPlaylist] = useState([])
    const [savedSongs, setSavedSongs] = useState([])
    const [savedPlaylists, setSavedPlaylists] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const totalLibraryItems = savedSongs.length + savedPlaylists.length
    const hasLoadedLibrary = useRef(false)
    const isLoadingRef = useRef(false)
    const abortControllerRef = useRef(null)
    const isPlaylistFetchingRef = useRef(false)
    const lastMoodRef = useRef(null)

    const loadFavorites = useCallback(async (signal) => {
        if (isLoadingRef.current) return
        isLoadingRef.current = true
        
        try {
            const songsData = await getSavedSongs({ signal })
            setSavedSongs(songsData.songs || [])
            const playlistsData = await getSavedPlaylists({ signal })
            setSavedPlaylists(playlistsData.playlists || [])
        } catch (error) {
            if (error.name !== 'CanceledError' && error.name !== 'AbortError') {
                console.warn('Failed to load favorites:', error)
            }
        } finally {
            isLoadingRef.current = false
        }
    }, [])

    // Refresh saved library when the authenticated user changes.
    useEffect(() => {
        if (authLoading) return
        if (!user) {
            hasLoadedLibrary.current = false
            setSavedSongs([])
            setSavedPlaylists([])
            return
        }

        if (hasLoadedLibrary.current) return

        // Cancel any previous in-flight request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort()
        }

        abortControllerRef.current = new AbortController()

        const load = async () => {
            try {
                await loadFavorites(abortControllerRef.current.signal)
                hasLoadedLibrary.current = true
            } catch {
                hasLoadedLibrary.current = false
            }
        }

        load()

        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
            }
        }
    }, [user, authLoading, loadFavorites])

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleExpression = async (expression) => {
        if (!expression) return
        if (isPlaylistFetchingRef.current) return

        // Prevent repeated calls for the same mood in quick succession.
        if (lastMoodRef.current === expression && playlist.length > 0) return

        isPlaylistFetchingRef.current = true
        lastMoodRef.current = expression

        try {
            const songs = await handleGetPlaylist({ mood: expression })
            setPlaylist(songs)
        } finally {
            isPlaylistFetchingRef.current = false
        }
    }

    const handleSaveItem = async (item, options = {}) => {
        const { silent = false } = options
        if (!user) {
            if (!silent) {
                alert('Please sign in to save songs to your library.')
            }
            return null
        }
        let savedId = null
        try {
            if (item._id) {
                await handleSaveSong(item._id)
                savedId = item._id
            } else if (item.spotifyId) {
                const data = await handleSaveSpotifySong({
                    spotifyId: item.spotifyId,
                    title: item.title,
                    artist: item.artist,
                    url: item.url,
                    posterUrl: item.posterUrl,
                    mood: item.mood
                })
                savedId = data?.songId
            } else if (item.youtubeId) {
                const data = await handleSaveYoutubeSong({
                    youtubeId: item.youtubeId,
                    title: item.title,
                    artist: item.artist,
                    url: item.url,
                    posterUrl: item.posterUrl,
                    mood: item.mood
                })
                savedId = data?.songId
            }

            if (!silent) {
                alert(`Saved "${item.title}" to your library`)
                if (savedId) {
                    try {
                        await loadFavorites()
                    } catch {
                        // ignore refresh errors
                    }
                }
            }
            return savedId
        } catch (error) {
            console.warn('Failed to save item:', error)
            if (!silent) {
                alert('Could not save this song. Please try again.')
            }
            return null
        }
    }

    const handleSaveCurrentSong = async () => {
        if (!song) return
        await handleSaveItem(song)
    }

    const handleRemoveSong = async (item) => {
        if (!user) {
            alert('Please sign in to manage songs.')
            return
        }
        if (!item?._id) {
            alert('This song cannot be removed yet. Try saving it first.')
            return
        }
        try {
            await removeSavedSong(item._id)
            await loadFavorites()
        } catch (error) {
            console.warn('Failed to remove song:', error)
            alert('Could not remove this song. Please try again.')
        }
    }

    const handleSavePlaylist = async () => {
        if (!user) {
            alert('Please sign in to save playlists to your library.')
            return
        }
        if (!playlist?.length) return
        const name = window.prompt('Enter a name for your playlist:')
        if (!name) return
        const resolvedSongs = await Promise.all(
            playlist.map(async (item) => {
                if (item._id) return item
                const savedId = await handleSaveItem(item, { silent: true })
                if (!savedId) return item
                return { ...item, _id: savedId }
            })
        )
        const songIds = resolvedSongs.map((s) => s._id).filter(Boolean)
        if (!songIds.length) {
            alert('Could not save this playlist yet. Try saving individual songs first.')
            return
        }
        await createPlaylist({
            name,
            mood: playlist[0]?.mood || 'happy',
            songIds
        })
        setPlaylist(resolvedSongs)
        alert('Playlist saved!')
        await loadFavorites()
    }

    const handleRemovePlaylist = async (playlistId) => {
        if (!user) {
            alert('Please sign in to manage playlists.')
            return
        }
        if (!playlistId) return
        try {
            await removeSavedPlaylist(playlistId)
            await loadFavorites()
        } catch (error) {
            console.warn('Failed to remove playlist:', error)
            alert('Could not remove this playlist. Please try again.')
        }
    }

    const isActive = (item) =>
        (item._id && song?._id === item._id) ||
        (item.spotifyId && song?.spotifyId === item.spotifyId) ||
        (item.youtubeId && song?.youtubeId === item.youtubeId)

    const normalizedQuery = searchQuery.trim().toLowerCase()
    const matchesQuery = useCallback(
        (value) => (value || '').toString().toLowerCase().includes(normalizedQuery),
        [normalizedQuery]
    )

    const filteredPlaylist = useMemo(() => {
        if (!normalizedQuery) return playlist
        return playlist.filter((item) =>
            matchesQuery(item.title) ||
            matchesQuery(item.artist) ||
            matchesQuery(item.mood)
        )
    }, [normalizedQuery, playlist, matchesQuery])

    const filteredSavedSongs = useMemo(() => {
        if (!normalizedQuery) return savedSongs
        return savedSongs.filter((item) =>
            matchesQuery(item.title) ||
            matchesQuery(item.artist) ||
            matchesQuery(item.mood)
        )
    }, [normalizedQuery, savedSongs, matchesQuery])

    const filteredSavedPlaylists = useMemo(() => {
        if (!normalizedQuery) return savedPlaylists
        return savedPlaylists.filter((pl) =>
            matchesQuery(pl.name) ||
            matchesQuery(pl.mood)
        )
    }, [normalizedQuery, savedPlaylists, matchesQuery])

    return (
        <div className="home">
            <div className="home__shell">
                {/* ── Left rail ─────────────────────────────────────────── */}
                <aside className="nav-rail">
                </aside>

                <div className="home__main">
                    {/* ── Top bar ─────────────────────────────────────────── */}
                    <header className="home__nav">
                        <div className="home__brand">
                            <span className="brand-icon">🎵</span>
                            <span>Mood<span className="brand-accent">ify</span></span>
                        </div>
                        <div className="home__search">
                            <span className="home__search-icon">⌕</span>
                            <input
                                type="text"
                                placeholder="Search for songs, artists, playlists"
                                aria-label="Search"
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                            />
                        </div>
                        <div className="home__actions">
                            {loading && (
                                <div className="scan-status" role="status" aria-live="polite">
                                    <div className="scan-status__icon" aria-hidden="true">🧠</div>
                                    <div className="scan-status__copy">
                                        <span className="scan-status__title">Reading your vibe</span>
                                        <span className="scan-status__sub">This takes a few seconds</span>
                                    </div>
                                    <div className="scan-status__meter" aria-hidden="true">
                                        <span />
                                        <span />
                                        <span />
                                    </div>
                                </div>
                            )}
                        </div>
                    </header>

                    {/* ── Main content ─────────────────────────────────────────── */}
                    <main className="home__content">
                {/* ── Real-time status strip ───────────────────────────── */}
                <section className="home__status">
                    <div className="now-playing">
                        <div className="now-playing__header">
                            <h2>Now Playing</h2>
                            <span className="live-pill">Live</span>
                        </div>
                        {song ? (
                            <div className="now-playing__body">
                                {song.posterUrl ? (
                                    <img src={song.posterUrl} alt={song.title} className="now-playing__poster" />
                                ) : (
                                    <div className="now-playing__poster now-playing__poster--placeholder">🎧</div>
                                )}
                                <div className="now-playing__info">
                                    <p className="now-playing__title">{song.title}</p>
                                    <p className="now-playing__artist">{song.artist}</p>
                                    <span className={`now-playing__mood now-playing__mood--${song.mood || 'neutral'}`}>
                                        {song.mood || 'neutral'}
                                    </span>
                                </div>
                                <div className="now-playing__actions">
                                    <div className="now-playing__eq" aria-hidden="true">
                                        <span />
                                        <span />
                                        <span />
                                        <span />
                                    </div>
                                    <button className="btn-ghost" onClick={handleSaveCurrentSong}>
                                        Save
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="now-playing__empty">
                                <span className="empty-icon">⏸️</span>
                                <p>Pick a track to start the session</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Main layout: Content + Sidebar */}
                <div className="home__layout">
                    {/* Content: Mood Detector + Suggested Playlist */}
                    <div className="home__grid">
                        {/* Left: Mood Detector */}
                        <MoodDetector onDetect={handleExpression} />

                        {/* Right: Suggested Playlist */}
                        <section className="playlist">
                            {filteredPlaylist.length === 0 ? (
                                <div className="playlist__empty">
                                    <span className="empty-icon">🎶</span>
                                    <p>
                                        {normalizedQuery
                                            ? 'No matches found. Try a different search.'
                                            : 'Detect your mood to get a personalized playlist'}
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="playlist__header">
                                        <h2>Suggested for You</h2>
                                        <div className="playlist__header-actions">
                                            {song && (
                                                <button className="btn-ghost" onClick={handleSaveCurrentSong}>
                                                    Save current
                                                </button>
                                            )}
                                            <button className="btn-ghost" onClick={handleSavePlaylist}>
                                                Save playlist
                                            </button>
                                        </div>
                                    </div>
                                    <ul className="playlist__list">
                                        {filteredPlaylist.map((item) => (
                                            <SongCard
                                                key={item._id ?? item.spotifyId ?? item.youtubeId}
                                                item={item}
                                                isActive={isActive(item)}
                                                onPlay={() => setSong(item)}
                                                onSave={handleSaveItem}
                                            />
                                        ))}
                                    </ul>
                                </>
                            )}
                        </section>
                    </div>

                    {/* Sidebar: Profile + Library */}
                    <aside className="sidebar">
                        <div className="sidebar__profile">
                            <div className="profile-card">
                                <div className="profile-card__avatar">{userInitial}</div>
                                <div className="profile-card__info">
                                    <p className="profile-card__name">{userName}</p>
                                    <p className="profile-card__meta">{userMeta}</p>
                                </div>
                            </div>
                            <div className="profile-stats">
                                <div className="profile-stats__item">
                                    <span className="profile-stats__label">Library</span>
                                    <span className="profile-stats__value">{totalLibraryItems}</span>
                                </div>
                                <div className="profile-stats__item">
                                    <span className="profile-stats__label">Queue</span>
                                    <span className="profile-stats__value">{playlist.length}</span>
                                </div>
                            </div>
                        </div>

                        {/* ── Library ─────────────────────────────────────────── */}
                        <section className="library library--sidebar">
                            <div className="library__header">
                                <h2>Your Library</h2>
                                <div className="library__actions">
                                    {song && (
                                        <button className="btn-ghost" onClick={handleSaveCurrentSong}>
                                            Save current
                                        </button>
                                    )}
                                    <button className="btn-ghost" onClick={loadFavorites}>
                                        <RefreshIcon />
                                        Refresh
                                    </button>
                                </div>
                            </div>

                            {filteredSavedSongs.length === 0 && filteredSavedPlaylists.length === 0 ? (
                                <div className="library__empty">
                                    <span className="empty-icon">📚</span>
                                    <p>
                                        {normalizedQuery
                                            ? 'No matches found in your library.'
                                            : 'Your library is empty.'}
                                        <br />
                                        {normalizedQuery ? 'Try a different search.' : 'Save songs from your playlist to see them here.'}
                                    </p>
                                </div>
                            ) : (
                                <div className="library__body">
                                    <div className="library__grid">
                                        {/* Saved Songs */}
                                        {filteredSavedSongs.length > 0 && (
                                            <div className="library__section">
                                                <h3>Saved Songs</h3>
                                                <ul className="library__list">
                                                    {filteredSavedSongs.map((item) => (
                                                        <SongCard
                                                            key={item._id}
                                                            item={item}
                                                            isActive={song?._id === item._id}
                                                            onPlay={() => setSong(item)}
                                                            showSave={false}
                                                            showRemove
                                                            onRemove={handleRemoveSong}
                                                        />
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Saved Playlists */}
                                        {filteredSavedPlaylists.length > 0 && (
                                            <div className="library__section">
                                                <h3>Saved Playlists</h3>
                                                <ul className="library__list">
                                                    {filteredSavedPlaylists.map((pl) => (
                                                        <li key={pl._id} className="playlist-item">
                                                            <div className="playlist-item__icon">🎵</div>
                                                            <div className="playlist-item__info">
                                                                <p className="playlist-item__name">{pl.name}</p>
                                                                <p className="playlist-item__meta">
                                                                    {pl.mood} · {pl.songs?.length ?? 0} songs
                                                                </p>
                                                            </div>
                                                            <div className="playlist-item__actions">
                                                                <button
                                                                    className="playlist-item__btn playlist-item__btn--primary"
                                                                    onClick={() => {
                                                                        if (pl.songs?.length) {
                                                                            setSong(pl.songs[0])
                                                                            setPlaylist(pl.songs)
                                                                        }
                                                                    }}
                                                                >
                                                                    Open
                                                                </button>
                                                                <button
                                                                    className="playlist-item__btn"
                                                                    onClick={async () => {
                                                                        await savePlaylist(pl._id)
                                                                        alert('Playlist added to favorites!')
                                                                    }}
                                                                >
                                                                    ♡ Fav
                                                                </button>
                                                                <button
                                                                    className="playlist-item__btn"
                                                                    onClick={() => handleRemovePlaylist(pl._id)}
                                                                >
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </section>
                    </aside>
                </div>
            </main>
                </div>
            </div>

            <Player playlist={playlist} />
        </div>
    )
}

export default Home
