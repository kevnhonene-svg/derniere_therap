import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, CheckSquare, Download, Grid3X3, Image, Search, Share2, Star, X } from 'lucide-react'
import { api } from '../../services/api'

function GaleriePublic({ config, onBack, onError }) {
  const [albums, setAlbums] = useState([])
  const [photos, setPhotos] = useState([])
  const [activeAlbum, setActiveAlbum] = useState('')
  const [search, setSearch] = useState('')
  const [momentOnly, setMomentOnly] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedPhotos, setSelectedPhotos] = useState(new Set())
  const [selectionMode, setSelectionMode] = useState(false)
  const [touchStart, setTouchStart] = useState(null)
  const [longPressTimer, setLongPressTimer] = useState(null)
  const [viewerControlsVisible, setViewerControlsVisible] = useState(false)

  const loadAlbums = async () => {
    try {
      const albumData = await api.galerieAlbums()
      setAlbums(albumData.albums || [])
    } catch (err) {
      onError(err.message)
    }
  }

  const loadPhotos = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (activeAlbum) params.set('album_id', activeAlbum)
      if (search.trim()) params.set('q', search.trim())
      if (momentOnly) params.set('moment_fort', '1')
      const shouldLoadPhotos = activeAlbum || momentOnly || search.trim()
      const photoData = shouldLoadPhotos ? await api.galeriePhotos(params) : { photos: [] }
      setPhotos(photoData.photos || [])
      setSelectedPhotos(new Set())
      setSelectionMode(false)
    } catch (err) {
      onError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAlbums()
  }, [])

  useEffect(() => {
    loadPhotos()
  }, [activeAlbum, momentOnly])

  const filteredPhotos = useMemo(() => photos, [photos])
  const currentPhoto = viewerIndex !== null ? filteredPhotos[viewerIndex] : null
  const currentAlbum = albums.find((album) => String(album.id) === String(activeAlbum))
  const heroCover = albums.find((album) => album.couverture)?.couverture || filteredPhotos[0]?.miniature_url

  const submitSearch = (event) => {
    event.preventDefault()
    loadPhotos()
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

  const toggleSelectPhoto = (photoId) => {
    setSelectedPhotos((current) => {
      const next = new Set(current)
      if (next.has(photoId)) {
        next.delete(photoId)
      } else {
        next.add(photoId)
      }
      return next
    })
  }

  const selectedList = filteredPhotos.filter((photo) => selectedPhotos.has(photo.id))
  const browsingPhotos = activeAlbum || momentOnly || search.trim()

  const moveViewer = (direction) => {
    setViewerIndex((index) => {
      if (index === null) return index
      const next = index + direction
      if (next < 0 || next >= filteredPhotos.length) return index
      return next
    })
  }

  const handleViewerTouchEnd = (event) => {
    if (touchStart === null) return
    const diff = touchStart - event.changedTouches[0].clientX
    setTouchStart(null)
    if (Math.abs(diff) < 45) return
    moveViewer(diff > 0 ? 1 : -1)
  }

  const openViewer = (index) => {
    setViewerIndex(index)
    setViewerControlsVisible(false)
  }

  const shareSelected = async () => {
    const links = selectedList.map((photo) => photo.image_url).join('\n')
    if (!links) return
    await navigator.clipboard?.writeText(links)
    onError('Liens des photos selectionnees copies.')
  }

  const startPhotoPress = (photoId) => {
    const timer = window.setTimeout(() => {
      setSelectionMode(true)
      setSelectedPhotos(new Set([photoId]))
    }, 2000)
    setLongPressTimer(timer)
  }

  const cancelPhotoPress = () => {
    if (longPressTimer) {
      window.clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
  }

  return (
    <section className="gallery-page">
      {!browsingPhotos && (
        <header className="gallery-hero" style={heroCover ? { backgroundImage: `linear-gradient(rgba(8, 12, 11, 0.38), rgba(8, 12, 11, 0.68)), url(${heroCover})` } : undefined}>
          <button className="gallery-back" type="button" onClick={onBack}><ArrowLeft size={18} /> Retour</button>
          <div>
            <span>{config?.nom_application || 'Gala 2026'}</span>
            <h1>Galerie officielle du Gala 2026</h1>
            <p>Revivez les meilleurs moments de la soiree. Parcourez, recherchez et telechargez gratuitement les photos officielles.</p>
          </div>
        </header>
      )}

      {browsingPhotos && (
        <header className="gallery-compact-top">
          <button type="button" onClick={() => { setActiveAlbum(''); setMomentOnly(false); setSearch(''); setPhotos([]); setSelectedPhotos(new Set()); setSelectionMode(false) }}><ArrowLeft size={20} /></button>
          <strong>{momentOnly ? 'Moments forts' : search.trim() ? 'Recherche' : currentAlbum?.titre}</strong>
          <button type="button" onClick={onBack}>Sortir</button>
        </header>
      )}

      <nav className="gallery-nav">
        <button type="button" onClick={() => { setActiveAlbum(''); setMomentOnly(false); setSearch(''); setPhotos([]); setSelectedPhotos(new Set()); setSelectionMode(false) }}><Grid3X3 size={17} /> Galeries</button>
        <button type="button" onClick={() => setMomentOnly(true)}><Star size={17} /> Moments forts</button>
      </nav>

      <form className="gallery-search" onSubmit={submitSearch}>
        <Search size={18} />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un moment, categorie, photographe..." />
        <button type="submit">Rechercher</button>
      </form>

      <section className="gallery-albums">
        {!activeAlbum && !momentOnly && !search.trim() && (
          <div className="gallery-albums-title">
            <h2>Albums</h2>
            <p>Photos et videos officielles organisees par moments.</p>
          </div>
        )}
        {!activeAlbum && !momentOnly && !search.trim() && albums.map((album) => (
          <button className={String(activeAlbum) === String(album.id) ? 'active' : ''} type="button" key={album.id} onClick={() => { setActiveAlbum(String(album.id)); setMomentOnly(false) }}>
            {album.couverture ? <img src={album.couverture} alt="" loading="lazy" /> : <span><Image size={24} /></span>}
            <div>
              <strong>{album.titre}</strong>
              <small>{album.nombre_photos} photo(s)</small>
            </div>
          </button>
        ))}
      </section>

      {selectedPhotos.size > 0 && (
        <section className="gallery-selection-bar">
          <strong>{selectedPhotos.size} photo(s) selectionnee(s)</strong>
          <button type="button" onClick={() => selectedList.forEach(downloadPhoto)}><Download size={16} /> Telecharger</button>
          <button type="button" onClick={shareSelected}><Share2 size={16} /> Copier liens</button>
          <button className="secondary" type="button" onClick={() => { setSelectedPhotos(new Set()); setSelectionMode(false) }}>Annuler</button>
        </section>
      )}

      {browsingPhotos && (
        <section className="gallery-grid">
        {loading && <div className="admin-empty">Chargement des photos...</div>}
        {!loading && filteredPhotos.length === 0 && <div className="admin-empty">Aucune photo disponible pour cette selection.</div>}
        {!loading && filteredPhotos.map((photo, index) => (
          <article key={photo.id}>
            {selectionMode && (
              <label className="gallery-select-photo">
              <input type="checkbox" checked={selectedPhotos.has(photo.id)} onChange={() => toggleSelectPhoto(photo.id)} />
              <CheckSquare size={16} />
              </label>
            )}
            <button
              type="button"
              onMouseDown={() => startPhotoPress(photo.id)}
              onMouseUp={cancelPhotoPress}
              onMouseLeave={cancelPhotoPress}
              onTouchStart={() => startPhotoPress(photo.id)}
              onTouchEnd={cancelPhotoPress}
              onClick={() => selectionMode ? toggleSelectPhoto(photo.id) : openViewer(index)}
            >
              <img src={photo.miniature_url || photo.image_url} alt={photo.titre || 'Photo du gala'} loading="lazy" />
            </button>
          </article>
        ))}
        </section>
      )}

      {currentPhoto && (
        <div
          className={`gallery-viewer ${viewerControlsVisible ? 'show-controls' : ''}`}
          onClick={() => setViewerControlsVisible((visible) => !visible)}
          onTouchStart={(event) => setTouchStart(event.touches[0].clientX)}
          onTouchEnd={handleViewerTouchEnd}
        >
          <button className="close gallery-viewer-control" type="button" onClick={(event) => { event.stopPropagation(); setViewerIndex(null) }}><X size={18} /></button>
          <img src={currentPhoto.image_url} alt={currentPhoto.titre || 'Photo du gala'} />
          <aside className="gallery-viewer-actions gallery-viewer-control">
            <button type="button" onClick={(event) => { event.stopPropagation(); downloadPhoto(currentPhoto) }}><Download size={17} /> Telecharger</button>
            <button type="button" onClick={(event) => { event.stopPropagation(); sharePhoto(currentPhoto) }}><Share2 size={17} /> Partager</button>
          </aside>
        </div>
      )}
    </section>
  )
}

export default GaleriePublic
