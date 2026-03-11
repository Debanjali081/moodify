import React from 'react'

const PlayIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" aria-hidden="true">
        <path d="M8 5.14v14l11-7-11-7z" />
    </svg>
)

const SaveIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="14" height="14" aria-hidden="true">
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
)

const RemoveIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" width="14" height="14" aria-hidden="true">
        <path d="M3 6h18" />
        <path d="M8 6V4h8v2" />
        <path d="M6 6l1 14h10l1-14" />
    </svg>
)

const SongCard = ({ item, onPlay, onSave, onRemove, isActive, showSave = true, showRemove = false }) => {
    const moodClass = item.mood
        ? `song-card__mood--${item.mood.toLowerCase().replace(/\s+/g, '-')}`
        : ''

    return (
        <li
            className={`song-card${isActive ? ' song-card--active' : ''}`}
            onClick={() => onPlay && onPlay(item)}
        >
            {item.posterUrl ? (
                <img
                    className="song-card__poster"
                    src={item.posterUrl}
                    alt={item.title}
                    loading="lazy"
                />
            ) : (
                <div className="song-card__poster-placeholder" aria-hidden="true">🎵</div>
            )}

            <div className="song-card__info">
                <p className="song-card__title">{item.title}</p>
                {item.artist && <p className="song-card__artist">{item.artist}</p>}
            </div>

            {item.mood && (
                <span className={`song-card__mood ${moodClass}`}>
                    {item.mood}
                </span>
            )}

            <div className="song-card__actions" onClick={(e) => e.stopPropagation()}>
                <button
                    className="song-card__btn song-card__btn--play"
                    onClick={() => onPlay && onPlay(item)}
                    aria-label={`Play ${item.title}`}
                    title="Play"
                >
                    <PlayIcon />
                </button>
                {showSave && onSave && (
                    <button
                        className="song-card__btn song-card__btn--save"
                        onClick={() => onSave(item)}
                        aria-label={`Save ${item.title} to library`}
                        title="Save to library"
                    >
                        <SaveIcon />
                    </button>
                )}
                {showRemove && onRemove && (
                    <button
                        className="song-card__btn song-card__btn--remove"
                        onClick={() => onRemove(item)}
                        aria-label={`Remove ${item.title} from library`}
                        title="Remove from library"
                    >
                        <RemoveIcon />
                    </button>
                )}
            </div>
        </li>
    )
}

export default SongCard
