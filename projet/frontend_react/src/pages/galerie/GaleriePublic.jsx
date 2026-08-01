import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, CheckSquare, Download, Grid3X3, Image, RotateCcw, Search, Share2, Star, X, ZoomIn, ZoomOut } from 'lucide-react'
import { api } from '../../services/api'

function GaleriePublic({ config, onBack, onError }) {
  const [albums, setAlbums] = useState([])
  const [photos, setPhotos] = useState([])
  const [activeAlbum, setActiveAlbum] = useState('')
  const [search, setSearch] = useState('')
  const [momentOnly, setMomentOnly] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(null)
  const [loading, setLoading] = useState(false)
  const [selectedPhotos, setSelectedPhotos] = useState(new Set())
  const [selectionMode, setSelectionMode] = useState(false)
  const [touchStart, setTouchStart] = useState(null)
  const [viewerControlsVisible, setViewerControlsVisible] = useState(false)
  const [zoom, setZoom] = useState(1)
  const longPressTimer = useRef(null)
  const photosCache = useRef(new Map())

  const browsingPhotos = activeAlbum || momentOnly || search.trim()
  const filteredPhotos = useMemo(() => photos, [photos])
  const currentPhoto = viewerIndex !== null ? filteredPhotos[viewerIndex] : null
  const currentAlbum = albums.find((album) => String(album.id) === String(activeAlbum))
  const heroCover = albums.find((album) => album.couverture)?.couverture || filteredPhotos[0]?.miniature_url
  const selectedList = filteredPhotos.filter((photo) => selectedPhotos.has(photo.id))

  const resetToAlbums = () => {
    setActiveAlbum('')
    setMomentOnly(false)
    setSearch('')
    setPhotos([])
    setSelectedPhotos(new Set())
    setSelectionMode(false)
  }

  const loadAlbums = async () => {
    try {
      const albumData = await api.galerieAlbums()
      setAlbums(albumData.albums || [])
    } catch (err) {
      onError(err.message)
    }
  }

  const loadPhotos = async () => {
    const shouldLoadPhotos = activeAlbum || momentOnly || search.trim()
    if (!shouldLoadPhotos) {
      setPhotos([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (activeAlbum) params.set('album_id', activeAlbum)
      if (search.trim()) params.set('q', search.trim())
      if (momentOnly) params.set('moment_fort', '1')
      const cacheKey = params.toString() || 'all'
      if (photosCache.current.has(cacheKey)) {
        setPhotos(photosCache.current.get(cacheKey))
        setSelectedPhotos(new Set())
        setSelectionMode(false)
        setLoading(false)
        return
      }
      const photoData = await api.galeriePhotos(params)
      const nextPhotos = photoData.photos || []
      photosCache.current.set(cacheKey, nextPhotos)
      setPhotos(nextPhotos)
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

  const submitSearch = (event) => {
    event.preventDefault()
    loadPhotos()
  }

  const jpegUrl = (photo) => `/api/galerie/photos/${photo.id}/jpeg/`
  const fallbackImage = (event, fallbackUrl) => {
    if (!fallbackUrl || event.currentTarget.src === fallbackUrl) return
    event.currentTarget.src = fallbackUrl
  }

  const photoFileName = (photo) => {
    const name = photo.titre || photo.album_titre || `photo-${photo.id}`
    return `${name.replace(/[\\/:*?"<>|]+/g, '-').trim() || `photo-${photo.id}`}.jpg`
  }

  const downloadPhoto = async (photo) => {
    try {
      await api.galerieTelechargerPhoto(photo.id)
    } catch {
      // Le fichier reste telechargeable meme si le compteur echoue.
    }

    const response = await fetch(jpegUrl(photo), { credentials: 'include' })
    if (!response.ok) throw new Error('Telechargement impossible.')
    const blob = await response.blob()
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = photoFileName(photo)
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(link.href)
  }

  const sharePhoto = async (photo) => {
    try {
      const response = await fetch(jpegUrl(photo), { credentials: 'include' })
      if (!response.ok) throw new Error('Partage impossible.')
      const blob = await response.blob()
      const file = new File([blob], photoFileName(photo), { type: 'image/jpeg' })
      if (navigator.canShare?.({ files: [file] }) && navigator.share) {
        await navigator.share({ title: photo.titre || 'Photo du gala', files: [file] }).catch(() => {})
        return
      }
    } catch {
      // On garde le partage par lien quand le partage fichier n'est pas supporte.
    }

    const absoluteUrl = new URL(jpegUrl(photo), window.location.origin).href
    if (navigator.share) {
      await navigator.share({ title: photo.titre || 'Photo du gala', url: absoluteUrl }).catch(() => {})
      return
    }
    await navigator.clipboard?.writeText(absoluteUrl)
    onError('Lien copie.')
  }

  const shareSelected = async () => {
    const links = selectedList.map((photo) => new URL(jpegUrl(photo), window.location.origin).href).join('\n')
    if (!links) return
    await navigator.clipboard?.writeText(links)
    onError('Liens des photos selectionnees copies.')
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

  const startPhotoPress = (photoId) => {
    window.clearTimeout(longPressTimer.current)
    longPressTimer.current = window.setTimeout(() => {
      setSelectionMode(true)
      setSelectedPhotos(new Set([photoId]))
    }, 2000)
  }

  const cancelPhotoPress = () => {
    window.clearTimeout(longPressTimer.current)
  }

  const openViewer = (index) => {
    setViewerIndex(index)
    setViewerControlsVisible(false)
    setZoom(1)
  }

  const moveViewer = (direction) => {
    setViewerIndex((index) => {
      if (index === null) return index
      const next = index + direction
      if (next < 0 || next >= filteredPhotos.length) return index
      setZoom(1)
      return next
    })
  }

  const updateZoom = (nextZoom) => {
    setZoom(Math.min(4, Math.max(1, nextZoom)))
  }

  const handleViewerTouchEnd = (event) => {
    if (touchStart === null) return
    const diff = touchStart - event.changedTouches[0].clientX
    setTouchStart(null)
    if (Math.abs(diff) < 45) return
    moveViewer(diff > 0 ? 1 : -1)
  }

  return (
    <section className="gallery-page">
      {!browsingPhotos && (
        <header className="gallery-hero" style={heroCover ? { backgroundImage: `linear-gradient(rgba(8, 12, 11, 0.38), rgba(8, 12, 11, 0.68)), url(${heroCover})` } : undefined}>
          {onBack && <button className="gallery-back" type="button" onClick={onBack}><ArrowLeft size={18} /> Retour</button>}
          <div>
            <span>{config?.nom_application || 'Gala 2026'}</span>
            <h1>Galerie officielle du Gala 2026</h1>
            <p>Revivez les meilleurs moments de la soiree. Parcourez, recherchez et telechargez gratuitement les photos officielles.</p>
          </div>
        </header>
      )}

      {browsingPhotos && (
        <header className="gallery-compact-top">
          <button type="button" onClick={resetToAlbums}><ArrowLeft size={20} /></button>
          <strong>{momentOnly ? 'Moments forts' : search.trim() ? 'Recherche' : currentAlbum?.titre}</strong>
          {onBack && <button type="button" onClick={onBack}>Sortir</button>}
        </header>
      )}

      <nav className="gallery-nav">
        <button type="button" onClick={resetToAlbums}><Grid3X3 size={17} /> Galeries</button>
        <button type="button" onClick={() => { setActiveAlbum(''); setMomentOnly(true) }}><Star size={17} /> Moments forts</button>
      </nav>

      <form className="gallery-search" onSubmit={submitSearch}>
        <Search size={18} />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un moment, categorie, photographe..." />
        <button type="submit">Rechercher</button>
      </form>

      {!browsingPhotos && (
        <section className="gallery-albums">
          <div className="gallery-albums-title">
            <h2>Albums</h2>
            <p>Photos et videos officielles organisees par moments.</p>
          </div>
          {albums.map((album) => (
            <button type="button" key={album.id} onClick={() => { setActiveAlbum(String(album.id)); setMomentOnly(false) }}>
              {album.couverture ? <img src={album.couverture} alt="" loading="eager" decoding="async" /> : <span><Image size={24} /></span>}
              <div>
                <strong>{album.titre}</strong>
                <small>{album.nombre_photos} photo(s)</small>
              </div>
            </button>
          ))}
        </section>
      )}

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
                <img
                  src={photo.miniature_url || photo.image_url}
                  alt={photo.titre || 'Photo du gala'}
                  loading={index < 12 ? 'eager' : 'lazy'}
                  decoding="async"
                  onError={(event) => fallbackImage(event, photo.miniature_proxy_url || photo.image_proxy_url)}
                />
              </button>
            </article>
          ))}
        </section>
      )}

      {currentPhoto && (
        <div
          className={`gallery-viewer ${viewerControlsVisible ? 'show-controls' : ''}`}
          onClick={() => setViewerControlsVisible((visible) => !visible)}
          onWheel={(event) => {
            event.preventDefault()
            updateZoom(zoom + (event.deltaY < 0 ? 0.25 : -0.25))
          }}
          onTouchStart={(event) => setTouchStart(event.touches[0].clientX)}
          onTouchEnd={handleViewerTouchEnd}
        >
          <button className="close gallery-viewer-control" type="button" onClick={(event) => { event.stopPropagation(); setViewerIndex(null) }}><X size={18} /></button>
          <img
            src={currentPhoto.image_url}
            alt={currentPhoto.titre || 'Photo du gala'}
            style={{ transform: `scale(${zoom})` }}
            onError={(event) => fallbackImage(event, currentPhoto.image_proxy_url)}
            onDoubleClick={(event) => {
              event.stopPropagation()
              updateZoom(zoom > 1 ? 1 : 2)
            }}
          />
          <aside className="gallery-viewer-actions gallery-viewer-control">
            <button type="button" onClick={(event) => { event.stopPropagation(); updateZoom(zoom + 0.5) }}><ZoomIn size={17} /> Zoom</button>
            <button type="button" onClick={(event) => { event.stopPropagation(); updateZoom(zoom - 0.5) }}><ZoomOut size={17} /> Reduire</button>
            <button type="button" onClick={(event) => { event.stopPropagation(); updateZoom(1) }}><RotateCcw size={17} /> Normal</button>
            <button type="button" onClick={(event) => { event.stopPropagation(); downloadPhoto(currentPhoto) }}><Download size={17} /> Telecharger</button>
            <button type="button" onClick={(event) => { event.stopPropagation(); sharePhoto(currentPhoto) }}><Share2 size={17} /> Partager</button>
          </aside>
        </div>
      )}
    </section>
  )
}

export default GaleriePublic
