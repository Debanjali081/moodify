import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { useSong } from '../hooks/useSong'
import YoutubePlayer from './YoutubePlayer'
import './player.scss'

// Constants
const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2]
const SKIP_SECONDS = 5
const REPLAY_THRESHOLD = 3 // seconds to restart instead of previous track
const VOLUME_STEP = 0.1

// Repeat modes
const REPEAT_MODES = {
  OFF: 0,
  ALL: 1,
  ONE: 2
}

// Format time helper
const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60).toString().padStart(2, '0')
  return `${mins}:${secs}`
}

// Get unique song ID helper
const getSongId = (song) => song?._id || song?.youtubeId || song?.spotifyId || ''

const Player = ({ playlist = [], onSongChange }) => {
  const { song, setSong } = useSong()
  
  // Refs
  const audioRef = useRef(null)
  const progressRef = useRef(null)
  const keyboardDisabledRef = useRef(false)

  // Player state
  const [playerState, setPlayerState] = useState({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    speed: 1,
    volume: 1,
    isMuted: false,
    showSpeedMenu: false,
    repeatMode: REPEAT_MODES.OFF,
    shuffle: false,
    currentIndex: -1,
    shuffledIndices: []
  })

  const [youtubeSeekTo, setYoutubeSeekTo] = useState(null)

  // Derived state
  const isYoutube = Boolean(song?.youtubeId)
  const hasPlaylist = playlist.length > 0
  const progress = playerState.duration ? (playerState.currentTime / playerState.duration) * 100 : 0

  // Update current index when song changes
  useEffect(() => {
    if (song && hasPlaylist) {
      const index = playlist.findIndex(s => getSongId(s) === getSongId(song))
      if (index !== -1 && index !== playerState.currentIndex) {
        setPlayerState(prev => ({ ...prev, currentIndex: index }))
      }
    }
  }, [song, playlist, hasPlaylist, playerState.currentIndex])

  // Generate shuffle order
  const generateShuffleOrder = useCallback((currentIdx) => {
    const indices = playlist.map((_, i) => i)
    const remainingIndices = indices.filter(i => i !== currentIdx)
    
    // Fisher-Yates shuffle
    for (let i = remainingIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [remainingIndices[i], remainingIndices[j]] = [remainingIndices[j], remainingIndices[i]]
    }
    
    return [currentIdx, ...remainingIndices]
  }, [playlist])

  // Initialize shuffle order when shuffle is enabled
  useEffect(() => {
    if (playerState.shuffle && hasPlaylist && playerState.currentIndex !== -1) {
      setPlayerState(prev => ({
        ...prev,
        shuffledIndices: generateShuffleOrder(prev.currentIndex)
      }))
    }
  }, [playerState.shuffle, hasPlaylist, playerState.currentIndex, generateShuffleOrder])

  // Get next track index
  const getNextIndex = useCallback(() => {
    if (!hasPlaylist || playerState.currentIndex === -1) return -1

    if (playerState.shuffle) {
      const currentShuffleIdx = playerState.shuffledIndices.indexOf(playerState.currentIndex)
      
      if (currentShuffleIdx < playerState.shuffledIndices.length - 1) {
        return playerState.shuffledIndices[currentShuffleIdx + 1]
      }
      
      if (playerState.repeatMode === REPEAT_MODES.ALL) {
        const newOrder = generateShuffleOrder(playerState.currentIndex)
        setPlayerState(prev => ({ ...prev, shuffledIndices: newOrder }))
        return newOrder[1]
      }
      
      return -1
    }

    if (playerState.currentIndex < playlist.length - 1) {
      return playerState.currentIndex + 1
    }

    if (playerState.repeatMode === REPEAT_MODES.ALL) {
      return 0
    }

    return -1
  }, [hasPlaylist, playerState.currentIndex, playerState.shuffle, 
      playerState.shuffledIndices, playerState.repeatMode, playlist, generateShuffleOrder])

  // Get previous track index
  const getPreviousIndex = useCallback(() => {
    if (!hasPlaylist || playerState.currentIndex === -1) return -1

    if (playerState.shuffle) {
      const currentShuffleIdx = playerState.shuffledIndices.indexOf(playerState.currentIndex)
      
      if (currentShuffleIdx > 0) {
        return playerState.shuffledIndices[currentShuffleIdx - 1]
      }
      
      if (playerState.repeatMode === REPEAT_MODES.ALL) {
        return playerState.shuffledIndices[playerState.shuffledIndices.length - 1]
      }
      
      return -1
    }

    if (playerState.currentIndex > 0) {
      return playerState.currentIndex - 1
    }

    if (playerState.repeatMode === REPEAT_MODES.ALL) {
      return playlist.length - 1
    }

    return -1
  }, [hasPlaylist, playerState.currentIndex, playerState.shuffle, 
      playerState.shuffledIndices, playerState.repeatMode, playlist])

  // Playback controls
  const playSong = useCallback((index) => {
    if (index !== -1 && index !== playerState.currentIndex) {
      const nextSong = playlist[index]
      setSong(nextSong)
      onSongChange?.(nextSong)
    }
  }, [playlist, playerState.currentIndex, setSong, onSongChange])

  const playNext = useCallback(() => {
    const nextIndex = getNextIndex()
    playSong(nextIndex)
  }, [getNextIndex, playSong])

  const playPrevious = useCallback(() => {
    // Restart if beyond threshold
    if (playerState.currentTime > REPLAY_THRESHOLD) {
      if (isYoutube) {
        setYoutubeSeekTo(0)
        setPlayerState(prev => ({ ...prev, currentTime: 0 }))
      } else if (audioRef.current) {
        audioRef.current.currentTime = 0
      }
      return
    }

    const prevIndex = getPreviousIndex()
    playSong(prevIndex)
  }, [playerState.currentTime, isYoutube, getPreviousIndex, playSong])

  // Handle song end
  const handleSongEnd = useCallback(() => {
    if (playerState.repeatMode === REPEAT_MODES.ONE) {
      // Replay current song
      if (isYoutube) {
        setYoutubeSeekTo(0)
        setPlayerState(prev => ({ ...prev, currentTime: 0 }))
        // Small delay to ensure YouTube player resets
        setTimeout(() => setPlayerState(prev => ({ ...prev, isPlaying: true })), 100)
      } else if (audioRef.current) {
        audioRef.current.currentTime = 0
        audioRef.current.play().catch(console.error)
      }
    } else {
      playNext()
    }
  }, [playerState.repeatMode, isYoutube, playNext])

  // Reset player when song changes
  useEffect(() => {
    if (!song) return

    setPlayerState(prev => ({
      ...prev,
      isPlaying: false,
      currentTime: 0,
      duration: 0
    }))
    setYoutubeSeekTo(null)

    if (!isYoutube && audioRef.current) {
      audioRef.current.load()
    }
  }, [song?.url, song?.youtubeId, isYoutube])

  // Toggle play/pause
  const togglePlay = useCallback(async () => {
    if (isYoutube) {
      setPlayerState(prev => ({ ...prev, isPlaying: !prev.isPlaying }))
      return
    }

    const audio = audioRef.current
    if (!audio) return

    try {
      if (audio.paused) {
        await audio.play()
        setPlayerState(prev => ({ ...prev, isPlaying: true }))
      } else {
        audio.pause()
        setPlayerState(prev => ({ ...prev, isPlaying: false }))
      }
    } catch (error) {
      console.error('Playback error:', error)
    }
  }, [isYoutube])

  // Seek
  const seek = useCallback((seconds) => {
    if (isYoutube) {
      const newTime = Math.max(0, Math.min(playerState.currentTime + seconds, playerState.duration))
      setYoutubeSeekTo(newTime)
      setPlayerState(prev => ({ ...prev, currentTime: newTime }))
      return
    }

    if (audioRef.current) {
      const newTime = Math.max(0, Math.min(audioRef.current.currentTime + seconds, playerState.duration))
      audioRef.current.currentTime = newTime
    }
  }, [isYoutube, playerState.currentTime, playerState.duration])

  // Progress click handler
  const handleProgressClick = useCallback((e) => {
    const bar = progressRef.current
    if (!bar || !playerState.duration) return

    const rect = bar.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const newTime = ratio * playerState.duration

    if (isYoutube) {
      setYoutubeSeekTo(newTime)
    } else if (audioRef.current) {
      audioRef.current.currentTime = newTime
    }
    
    setPlayerState(prev => ({ ...prev, currentTime: newTime }))
  }, [isYoutube, playerState.duration])

  // Speed change
  const handleSpeedChange = useCallback((newSpeed) => {
    setPlayerState(prev => ({ ...prev, speed: newSpeed, showSpeedMenu: false }))
    if (!isYoutube && audioRef.current) {
      audioRef.current.playbackRate = newSpeed
    }
  }, [isYoutube])

  // Volume control
  const handleVolumeChange = useCallback((e) => {
    const newVolume = parseFloat(e.target.value)
    setPlayerState(prev => ({ 
      ...prev, 
      volume: newVolume,
      isMuted: newVolume === 0
    }))
    
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
  }, [])

  const toggleMute = useCallback(() => {
    setPlayerState(prev => {
      const newMuted = !prev.isMuted
      if (audioRef.current) {
        audioRef.current.volume = newMuted ? 0 : prev.volume
      }
      return { ...prev, isMuted: newMuted }
    })
  }, [])

  // Toggle shuffle
  const toggleShuffle = useCallback(() => {
    setPlayerState(prev => ({ ...prev, shuffle: !prev.shuffle }))
  }, [])

  // Cycle repeat mode
  const cycleRepeat = useCallback(() => {
    setPlayerState(prev => ({
      ...prev,
      repeatMode: (prev.repeatMode + 1) % 3
    }))
  }, [])

  // Audio event handlers
  const handleTimeUpdate = useCallback(() => {
    if (!isYoutube && audioRef.current) {
      setPlayerState(prev => ({ ...prev, currentTime: audioRef.current.currentTime }))
    }
  }, [isYoutube])

  const handleLoadedMetadata = useCallback(() => {
    if (!isYoutube && audioRef.current) {
      setPlayerState(prev => ({ ...prev, duration: audioRef.current.duration }))
    }
  }, [isYoutube])

  // YouTube handlers
  const handleYoutubeReady = useCallback((player) => {
    player.playVideo()
    setPlayerState(prev => ({ ...prev, isPlaying: true }))
  }, [])

  const handleYoutubeStateChange = useCallback((state) => {
    // YouTube states: 1 = playing, 2 = paused, 0 = ended
    if (state === 1) {
      setPlayerState(prev => ({ ...prev, isPlaying: true }))
    } else if (state === 2) {
      setPlayerState(prev => ({ ...prev, isPlaying: false }))
    } else if (state === 0) {
      handleSongEnd()
    }
  }, [handleSongEnd])

  const handleYoutubeProgress = useCallback((time) => {
    setPlayerState(prev => ({ ...prev, currentTime: time }))
  }, [])

  const handleYoutubeDuration = useCallback((duration) => {
    if (duration > 0) {
      setPlayerState(prev => ({ ...prev, duration }))
    }
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing in input or if keyboard is disabled
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || keyboardDisabledRef.current) {
        return
      }

      const keyHandlers = {
        'Space': (e) => {
          e.preventDefault()
          togglePlay()
        },
        'ArrowLeft': () => seek(-SKIP_SECONDS),
        'ArrowRight': () => seek(SKIP_SECONDS),
        'ArrowUp': (e) => {
          e.preventDefault()
          setPlayerState(prev => ({ 
            ...prev, 
            volume: Math.min(1, prev.volume + VOLUME_STEP),
            isMuted: false
          }))
        },
        'ArrowDown': (e) => {
          e.preventDefault()
          setPlayerState(prev => ({ 
            ...prev, 
            volume: Math.max(0, prev.volume - VOLUME_STEP)
          }))
        },
        'KeyM': (e) => {
          e.preventDefault()
          toggleMute()
        },
        'KeyN': (e) => {
          e.preventDefault()
          playNext()
        },
        'KeyP': (e) => {
          e.preventDefault()
          playPrevious()
        },
        'KeyS': (e) => {
          e.preventDefault()
          toggleShuffle()
        },
        'KeyR': (e) => {
          e.preventDefault()
          cycleRepeat()
        }
      }

      const handler = keyHandlers[e.code]
      if (handler) handler(e)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [togglePlay, seek, toggleMute, playNext, playPrevious, toggleShuffle, cycleRepeat])

  // Render helpers
  const renderRepeatIcon = useMemo(() => {
    if (playerState.repeatMode === REPEAT_MODES.ONE) {
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
          <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z"/>
        </svg>
      )
    }
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
        <path d="M17 1l4 4-4 4"/>
        <path d="M3 11V9a4 4 0 0 1 4-4h14"/>
        <path d="M7 23l-4-4 4-4"/>
        <path d="M21 13v2a4 4 0 0 1-4 4H3"/>
      </svg>
    )
  }, [playerState.repeatMode])

  if (!song) return null

  return (
    <div className="player">
      {/* Hidden YouTube Player */}
      {isYoutube && song.youtubeId && (
        <YoutubePlayer
          videoId={song.youtubeId}
          onReady={handleYoutubeReady}
          onStateChange={handleYoutubeStateChange}
          onEnded={handleSongEnd}
          isPlaying={playerState.isPlaying}
          volume={playerState.isMuted ? 0 : playerState.volume}
          onProgress={handleYoutubeProgress}
          onDuration={handleYoutubeDuration}
          seekTo={youtubeSeekTo}
        />
      )}

      {/* Hidden Audio Element */}
      {!isYoutube && (
        <audio
          ref={audioRef}
          src={song.url}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleSongEnd}
          onError={(e) => console.error('Audio error:', e.target.error)}
          preload="auto"
        />
      )}

      {/* YouTube Link */}
      {isYoutube && (
        <div className="player__youtube-link">
          <a
            href={`https://www.youtube.com/watch?v=${song.youtubeId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="player__youtube-link__anchor"
          >
            Open on YouTube
          </a>
        </div>
      )}

      {/* Song Info */}
      <div className="player__info">
        <img
          className="player__poster"
          src={song.posterUrl}
          alt={song.title}
          loading="lazy"
        />
        <div className="player__meta">
          <h3 className="player__title">{song.title}</h3>
          <span className="player__mood">{song.mood}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="player__progress-wrap">
        <span className="player__time">{formatTime(playerState.currentTime)}</span>
        <div
          className="player__progress"
          ref={progressRef}
          onClick={handleProgressClick}
          role="progressbar"
          tabIndex={0}
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="player__progress-fill" style={{ width: `${progress}%` }} />
          <div className="player__progress-thumb" style={{ left: `${progress}%` }} />
        </div>
        <span className="player__time">{formatTime(playerState.duration)}</span>
      </div>

      {/* Controls */}
      <div className="player__controls">
        {/* Shuffle */}
        <button
          className={`player__btn player__btn--shuffle ${playerState.shuffle ? 'active' : ''}`}
          onClick={toggleShuffle}
          title={playerState.shuffle ? 'Disable shuffle' : 'Enable shuffle'}
          aria-label={playerState.shuffle ? 'Disable shuffle' : 'Enable shuffle'}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
            <path d="M16 3h5v5"/>
            <path d="M21 3l-7 7"/>
            <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/>
            <path d="M2 21l7-7"/>
          </svg>
        </button>

        {/* Previous */}
        <button
          className="player__btn player__btn--prev"
          onClick={playPrevious}
          title="Previous track"
          aria-label="Previous track"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
          </svg>
        </button>

        {/* Speed Control */}
        <div className="player__speed-wrap">
          <button
            className="player__btn player__btn--speed"
            onClick={() => setPlayerState(prev => ({ ...prev, showSpeedMenu: !prev.showSpeedMenu }))}
            title="Playback speed"
            aria-label="Playback speed"
            aria-expanded={playerState.showSpeedMenu}
          >
            {playerState.speed}×
          </button>
          {playerState.showSpeedMenu && (
            <div className="player__speed-menu" role="menu">
              {SPEED_OPTIONS.map((speed) => (
                <button
                  key={speed}
                  className={`player__speed-option ${speed === playerState.speed ? 'active' : ''}`}
                  onClick={() => handleSpeedChange(speed)}
                  role="menuitem"
                >
                  {speed}×
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Skip Backward */}
        <button
          className="player__btn player__btn--skip"
          onClick={() => seek(-SKIP_SECONDS)}
          title={`Back ${SKIP_SECONDS}s`}
          aria-label={`Skip back ${SKIP_SECONDS} seconds`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <path d="M1 4v6h6"/>
            <path d="M3.51 15a9 9 0 1 0 .49-3.6"/>
          </svg>
          <span>{SKIP_SECONDS}s</span>
        </button>

        {/* Play/Pause */}
        <button
          className="player__btn player__btn--play"
          onClick={togglePlay}
          title={playerState.isPlaying ? 'Pause' : 'Play'}
          aria-label={playerState.isPlaying ? 'Pause' : 'Play'}
        >
          {playerState.isPlaying ? (
            <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
              <path d="M8 5.14v14l11-7-11-7z" />
            </svg>
          )}
        </button>

        {/* Skip Forward */}
        <button
          className="player__btn player__btn--skip"
          onClick={() => seek(SKIP_SECONDS)}
          title={`Forward ${SKIP_SECONDS}s`}
          aria-label={`Skip forward ${SKIP_SECONDS} seconds`}
        >
          <span>{SKIP_SECONDS}s</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
            <path d="M23 4v6h-6"/>
            <path d="M20.49 15a9 9 0 1 1-.49-3.6"/>
          </svg>
        </button>

        {/* Next */}
        <button
          className="player__btn player__btn--next"
          onClick={playNext}
          title="Next track"
          aria-label="Next track"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
          </svg>
        </button>

        {/* Repeat */}
        <button
          className={`player__btn player__btn--repeat ${playerState.repeatMode !== REPEAT_MODES.OFF ? 'active' : ''}`}
          onClick={cycleRepeat}
          title={`Repeat: ${playerState.repeatMode === REPEAT_MODES.OFF ? 'Off' : playerState.repeatMode === REPEAT_MODES.ALL ? 'All' : 'One'}`}
          aria-label={`Repeat mode: ${playerState.repeatMode === REPEAT_MODES.OFF ? 'Off' : playerState.repeatMode === REPEAT_MODES.ALL ? 'All' : 'One'}`}
        >
          {renderRepeatIcon}
        </button>

        {/* Volume Control */}
        <div className="player__volume">
          <button
            className="player__btn player__btn--vol"
            onClick={toggleMute}
            title={playerState.isMuted ? 'Unmute' : 'Mute'}
            aria-label={playerState.isMuted ? 'Unmute' : 'Mute'}
          >
            {playerState.isMuted || playerState.volume === 0 ? (
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M16.5 12A4.5 4.5 0 0 0 14 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.87 8.87 0 0 0 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06A8.99 8.99 0 0 0 17.73 18L19 19.27 20.27 18 5.27 3 4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
              </svg>
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={playerState.isMuted ? 0 : playerState.volume}
            onChange={handleVolumeChange}
            className="player__volume-slider"
            aria-label="Volume"
            title={`Volume: ${Math.round((playerState.isMuted ? 0 : playerState.volume) * 100)}%`}
          />
        </div>

        {/* Playlist Info */}
        {hasPlaylist && (
          <div className="player__playlist-info" aria-label="Playlist position">
            <span>{playerState.currentIndex + 1} / {playlist.length}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default Player