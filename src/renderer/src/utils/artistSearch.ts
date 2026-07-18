function encodeSpaceAsPlus(query: string): string {
  return encodeURIComponent(query).replace(/%20/g, '+')
}

export function openDiscogsArtistSearch(artist: string): void {
  const url = `https://www.discogs.com/search?q=${encodeURIComponent(artist)}&type=all`
  window.open(url, '_blank')
}

export function openBandcampArtistSearch(artist: string): void {
  const query = artist.trim().split(/\s+/).join('+')
  const url = `https://bandcamp.com/search?q=${encodeURIComponent(query)}`
  window.open(url, '_blank')
}

export function openYoutubeArtistSearch(artist: string): void {
  const url = `https://www.youtube.com/results?search_query=${encodeSpaceAsPlus(artist)}`
  window.open(url, '_blank')
}
