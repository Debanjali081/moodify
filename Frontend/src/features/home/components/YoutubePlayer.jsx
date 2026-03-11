import React, { useEffect, useRef, useState, useCallback } from 'react'

const YoutubePlayer = ({ 
    videoId, 
    onReady, 
    onStateChange, 
    onEnded, 
    isPlaying, 
    volume,
    onProgress,
    onDuration,
    seekTo
}) => {
    const playerRef = useRef(null)
    const containerRef = useRef(null)
    const isMountedRef = useRef(true)
    const [isPlayerReady, setIsPlayerReady] = useState(false)
    const [currentVideoId, setCurrentVideoId] = useState(null)

    const initPlayer = useCallback(() => {
        if (playerRef.current) return

        if (!containerRef.current) return

        playerRef.current = new window.YT.Player(containerRef.current, {
            height: '200',
            width: '200',
            videoId: videoId,
            playerVars: {
                autoplay: 1,
                controls: 0,
                disablekb: 1,
                fs: 0,
                modestbranding: 1,
                rel: 0,
                showinfo: 0,
                iv_load_policy: 3,
            },
            events: {
                onReady: (event) => {
                    if (!isMountedRef.current) return
                    setIsPlayerReady(true)
                    setCurrentVideoId(videoId)
                    
                    const player = event.target
                    // Get duration
                    try {
                        const dur = player.getDuration()
                        if (dur && onDuration) onDuration(dur)
                    } catch (e) {}
                    
                    if (onReady) onReady(player)
                },
                onStateChange: (event) => {
                    if (onStateChange) onStateChange(event.data)
                    if (event.data === window.YT.PlayerState.ENDED && onEnded) {
                        onEnded()
                    }
                }
            }
        })
    }, [videoId, onReady, onStateChange, onEnded, onDuration])

    // Load YouTube IFrame API
    useEffect(() => {
        isMountedRef.current = true

        if (window.YT && window.YT.Player) {
            if (!playerRef.current) {
                initPlayer()
            }
            return () => {
                isMountedRef.current = false
                if (playerRef.current && playerRef.current.destroy) {
                    playerRef.current.destroy()
                    playerRef.current = null
                }
            }
        }

        const previousReady = window.onYouTubeIframeAPIReady
        window.onYouTubeIframeAPIReady = () => {
            if (typeof previousReady === 'function') previousReady()
            initPlayer()
        }

        const tag = document.createElement('script')
        tag.src = 'https://www.youtube.com/iframe_api'
        const firstScriptTag = document.getElementsByTagName('script')[0]
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)

        return () => {
            isMountedRef.current = false
            if (playerRef.current && playerRef.current.destroy) {
                playerRef.current.destroy()
                playerRef.current = null
            }
        }
    }, [initPlayer])

    // Progress polling
    useEffect(() => {
        if (!isPlayerReady) return

        let animationId
        const updateProgress = () => {
            if (playerRef.current && playerRef.current.getCurrentTime) {
                try {
                    const currentTime = playerRef.current.getCurrentTime()
                    const dur = playerRef.current.getDuration()
                    
                    if (onProgress && currentTime) onProgress(currentTime)
                    if (onDuration && dur) onDuration(dur)
                } catch (e) {}
            }
            
            animationId = requestAnimationFrame(updateProgress)
        }
        
        animationId = requestAnimationFrame(updateProgress)

        return () => {
            cancelAnimationFrame(animationId)
        }
    }, [isPlayerReady, onProgress, onDuration])

    // Handle video ID change
    useEffect(() => {
        if (!isPlayerReady || !playerRef.current || !videoId) return

        if (videoId !== currentVideoId) {
            setCurrentVideoId(videoId)
            try {
                playerRef.current.loadVideoById(videoId)
            } catch (e) {
                console.log('loadVideoById error:', e)
            }
            
            // Update duration after loading
            setTimeout(() => {
                try {
                    const dur = playerRef.current.getDuration()
                    if (dur && onDuration) onDuration(dur)
                } catch (e) {}
            }, 1500)
        }
    }, [videoId, currentVideoId, isPlayerReady, onDuration])

    // Sync play/pause state
    useEffect(() => {
        if (!isPlayerReady || !playerRef.current) return

        try {
            if (isPlaying) {
                playerRef.current.playVideo()
            } else {
                playerRef.current.pauseVideo()
            }
        } catch (e) {
            console.log('Play/pause error:', e)
        }
    }, [isPlaying, isPlayerReady])

    // Sync volume
    useEffect(() => {
        if (!isPlayerReady || !playerRef.current) return

        try {
            playerRef.current.setVolume(volume * 100)
        } catch (e) {
            console.log('Volume error:', e)
        }
    }, [volume, isPlayerReady])

    // Handle seek
    useEffect(() => {
        if (!isPlayerReady || !playerRef.current || seekTo === null || seekTo === undefined) return

        try {
            playerRef.current.seekTo(seekTo, true)
        } catch (e) {
            console.log('Seek error:', e)
        }
    }, [seekTo, isPlayerReady])

    return (
        <div
            style={{
                position: 'absolute',
                visibility: 'hidden',
                width: 1,
                height: 1
            }}
        >
            <div ref={containerRef} />
        </div>
    )
}

export default YoutubePlayer
