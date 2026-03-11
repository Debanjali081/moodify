import { getSong, getPlaylist, saveSong, saveSpotifySong, saveYoutubeSong } from "../service/song.api";
import { useCallback, useContext, useMemo } from "react";
import { SongContext } from "../song.context";

export const useSong = () => {
    const context = useContext(SongContext)

    const { loading, setLoading, song, setSong } = context

    const handleGetSong = useCallback(async ({ mood }) => {
        setLoading(true)
        try {
            const data = await getSong({ mood })
            setSong(data.song)
        } catch (error) {
            // swallow so UI can recover; loading is cleared below
            console.warn('Failed to fetch song', error)
        } finally {
            setLoading(false)
        }
    }, [setLoading, setSong])

    const handleGetPlaylist = useCallback(async ({ mood }) => {
        setLoading(true)
        try {
            const data = await getPlaylist({ mood })
            // default to first song in the playlist (if any)
            if (data.tracks?.length) {
                setSong(data.tracks[0])
            }
            return data.tracks || []
        } catch (error) {
            console.warn('Failed to fetch playlist', error)
            return []
        } finally {
            setLoading(false)
        }
    }, [setLoading, setSong])

    const handleSaveSong = useCallback(async (songId) => {
        const data = await saveSong(songId)
        return data
    }, [])

    const handleSaveSpotifySong = useCallback(async (track) => {
        const data = await saveSpotifySong(track)
        return data
    }, [])

    const handleSaveYoutubeSong = useCallback(async (track) => {
        const data = await saveYoutubeSong(track)
        return data
    }, [])

    return useMemo(() => ({ 
        loading, song, setSong, handleGetSong, handleGetPlaylist, handleSaveSong, handleSaveSpotifySong, handleSaveYoutubeSong 
    }), [loading, song, setSong, handleGetSong, handleGetPlaylist, handleSaveSong, handleSaveSpotifySong, handleSaveYoutubeSong])
}

