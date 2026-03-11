const BASE_YT_SEARCH = "https://www.youtube.com/results?search_query=";

function extractYtInitialData(html) {
    const match = html.match(/var ytInitialData = (\{.*?\});/s);
    if (!match) return null;
    try {
        return JSON.parse(match[1]);
    } catch {
        return null;
    }
}

function extractVideoItems(initialData) {
    const contents = initialData?.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;
    if (!Array.isArray(contents)) return [];

    const itemSection = contents.find((c) => c.itemSectionRenderer);
    const items = itemSection?.itemSectionRenderer?.contents || [];

    return items
        .map((item) => item.videoRenderer)
        .filter(Boolean);
}

function buildTrackFromRenderer(videoRenderer) {
    const videoId = videoRenderer.videoId;
    const title = videoRenderer?.title?.runs?.[0]?.text || "Unknown";
    const thumbnail = videoRenderer?.thumbnail?.thumbnails?.slice(-1)[0]?.url || "";

    return {
        youtubeId: videoId,
        title,
        artist: videoRenderer?.ownerText?.runs?.[0]?.text || "",
        url: `https://www.youtube.com/watch?v=${videoId}`,
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        posterUrl: thumbnail,
    };
}

async function searchMoodVideos(mood, limit = 20) {
    const query = encodeURIComponent(`${mood} music`);
    const res = await fetch(`${BASE_YT_SEARCH}${query}`);

    if (!res.ok) {
        const body = await res.text();
        throw new Error(`YouTube search failed: ${res.status} ${body}`);
    }

    const html = await res.text();
    const initialData = extractYtInitialData(html);
    const videoRenderers = extractVideoItems(initialData);

    return videoRenderers.slice(0, limit).map(buildTrackFromRenderer);
}

module.exports = { searchMoodVideos };
