import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Download, Grid3X3, Image, Search, Share2, Star, X } from 'lucide-react'
import { api } from '../../services/api'

function GaleriePublic({ config, onBack, onError }) {
  const [albums, setAlbums] = useState([])
  const [photos, setPhotos] = useState([])
  const [activeAlbum, setActiveAlbum] = useState('')
  const [search, setSearch] = useState('')
  const [momentOnly, setMomentOnly] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (activeAlbum) params.set('album_id', activeAlbum)
      if (search.trim()) params.set('q', search.trim())
      if (momentOnly) params.set('moment_fort', '1')
      const [albumData, photoData] = await Promise.all([
        api.galerieAlbums(),
        api.galeriePhotos(params),
      ])
      setAlbums(albumData.albums || [])
      setPhotos(photoData.photos || [])
    } catch (err) {
      onError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [activeAlbum, momentOnly])

  const filteredPhotos = useMemo(() => photos, [photos])
  const currentPhoto = viewerIndex !== null ? filteredPhotos[viewerIndex] : null
  const heroCover = albums.find((album) => album.couverture)?.couverture || filteredPhotos[0]?.miniature_url

  const submitSearch = (event) => {
    event.preventDefault()
    load()
  }

  const downloadPhoto = async (photo) => {
    try {
      await api.galerieTelechargerPhoto(photo.id)
    } catch {
      // Le telechargement reste possible meme si le compteur echoue.
    }
    const link = document.createElement('a')
    link.href = photo.image_url
    link.download = `${photo.titre || `photo-${photo.id}`}.webp`
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  const sharePhoto = async (photo) => {
    const url = photo.image_url
    if (navigator.share) {
      await navigator.share({ title: photo.titre || 'Photo du gala', url }).catch(() => {})
      return
    }
    await navigator.clipboard?.writeText(url)
    onError('Lien copie.')
  }

  return (
    <section className="gallery-page">
      <header className="gallery-hero" style={heroCover ? { backgroundImage: `linear-gradient(rgba(8, 12, 11, 0.38), rgba(8, 12, 11, 0.68)), url(${heroCover})` } : undefined}>
        <button className="gallery-back" type="button" onClick={onBack}><ArrowLeft size={18} /> Retour</button>
        <div>
          <span>{config?.nom_application || 'Gala 2026'}</span>
          <h1>Galerie officielle du Gala 2026</h1>
          <p>Revivez les meilleurs moments de la soiree. Parcourez, recherchez et telechargez gratuitement les photos officielles.</p>
        </div>
      </header>

      <nav className="gallery-nav">
        <button type="button" onClick={() => { setActiveAlbum(''); setMomentOnly(false) }}><Grid3X3 size={17} /> Galeries</button>
        <button type="button" onClick={() => setMomentOnly(true)}><Star size={17} /> Moments forts</button>
      </nav>

      <form className="gallery-search" onSubmit={submitSearch}>
        <Search size={18} />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un moment, categorie, photographe..." />
        <button type="submit">Rechercher</button>
      </form>

      <section className="gallery-albums">
        {albums.map((album) => (
          <button className={String(activeAlbum) === String(album.id) ? 'active' : ''} type="button" key={album.id} onClick={() => { setActiveAlbum(String(album.id)); setMomentOnly(false) }}>
            {album.couverture ? <img src={album.couverture} alt="" loading="lazy" /> : <span><Image size={24} /></span>}
            <strong>{album.titre}</strong>
            <small>{album.nombre_photos} photo(s)</small>
          </button>
        ))}
      </section>

      <section className="gallery-grid">
        {loading && <div className="admin-empty">Chargement des photos...</div>}
        {!loading && filteredPhotos.length === 0 && <div className="admin-empty">Aucune photo disponible pour cette selection.</div>}
        {!loading && filteredPhotos.map((photo, index) => (
          <article key={photo.id}>
            <button type="button" onClick={() => setViewerIndex(index)}>
              <img src={photo.miniature_url || photo.image_url} alt={photo.titre || 'Photo du gala'} loading="lazy" />
            </button>
            <div>
              <strong>{photo.titre || photo.album_titre}</strong>
              <span>{photo.album_titre}</span>
              <button type="button" onClick={() => downloadPhoto(photo)}><Download size={16} /></button>
            </div>
          </article>
        ))}
      </section>

      {currentPhoto && (
        <div className="gallery-viewer">
          <button className="close" type="button" onClick={() => setViewerIndex(null)}><X size={18} /></button>
          <img src={currentPhoto.image_url} alt={currentPhoto.titre || 'Photo du gala'} />
          <aside>
            <h2>{currentPhoto.titre || currentPhoto.album_titre}</h2>
            <p>{currentPhoto.description || 'Photo officielle du gala.'}</p>
            <span>Album: {currentPhoto.album_titre}</span>
            {currentPhoto.photographe && <span>Photographe: {currentPhoto.photographe}</span>}
            {currentPhoto.lieu && <span>Lieu: {currentPhoto.lieu}</span>}
            <div>
              <button type="button" onClick={() => setViewerIndex(Math.max(viewerIndex - 1, 0))}>Precedent</button>
              <button type="button" onClick={() => setViewerIndex(Math.min(viewerIndex + 1, filteredPhotos.length - 1))}>Suivant</button>
            </div>
            <button type="button" onClick={() => downloadPhoto(currentPhoto)}><Download size={17} /> Telecharger</button>
            <button type="button" onClick={() => sharePhoto(currentPhoto)}><Share2 size={17} /> Partager</button>
          </aside>
        </div>
      )}
    </section>
  )
}

export default GaleriePublic
