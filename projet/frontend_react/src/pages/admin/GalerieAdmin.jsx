import { useEffect, useMemo, useState } from 'react'
import { Edit3, Image, Plus, Search, Trash2, Upload } from 'lucide-react'
import { api } from '../../services/api'

const emptyAlbum = {
  titre: '',
  description: '',
  categorie: '',
  date_evenement: '',
  actif: true,
}

const emptyPhoto = {
  album: '',
  titre: '',
  description: '',
  photographe: '',
  lieu: '',
  mots_cles: '',
  moment_fort: false,
  actif: true,
  ordre: 0,
  image: null,
  images: [],
}

function GalerieAdmin({ onError }) {
  const [albums, setAlbums] = useState([])
  const [photos, setPhotos] = useState([])
  const [search, setSearch] = useState('')
  const [albumModal, setAlbumModal] = useState(null)
  const [photoModal, setPhotoModal] = useState(null)
  const [photoPreview, setPhotoPreview] = useState([])
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const [albumData, photoData] = await Promise.all([
      api.galerieAlbumsAdmin(),
      api.galeriePhotosAdmin(),
    ])
    setAlbums(albumData.albums || [])
    setPhotos(photoData.photos || [])
  }

  useEffect(() => {
    load().catch((err) => onError(err.message))
  }, [])

  useEffect(() => {
    if (!photoModal) {
      setPhotoPreview([])
      return undefined
    }

    const files = photoModal.images?.length ? photoModal.images : (photoModal.image instanceof File ? [photoModal.image] : [])
    if (files.length > 0) {
      const previews = files.map((file) => URL.createObjectURL(file))
      setPhotoPreview(previews)
      return () => previews.forEach((preview) => URL.revokeObjectURL(preview))
    }

    setPhotoPreview(photoModal.miniature_url || photoModal.image_url ? [photoModal.miniature_url || photoModal.image_url] : [])
    return undefined
  }, [photoModal])

  const filteredPhotos = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return photos
    return photos.filter((photo) => [
      photo.titre,
      photo.album_titre,
      photo.photographe,
      photo.lieu,
      photo.mots_cles,
    ].some((value) => String(value || '').toLowerCase().includes(q)))
  }, [photos, search])

  const saveAlbum = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...albumModal,
        date_evenement: albumModal.date_evenement || null,
      }
      if (albumModal.id) {
        payload.ordre = Number(albumModal.ordre || 0)
      }
      if (albumModal.id) {
        await api.updateGalerieAlbum(albumModal.id, payload)
      } else {
        await api.createGalerieAlbum(payload)
      }
      setAlbumModal(null)
      await load()
    } catch (err) {
      onError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const savePhoto = async (event) => {
    event.preventDefault()
    setSaving(true)
    try {
      const buildFormData = (imageFile = null, index = 0) => {
        const formData = new FormData()
        Object.entries(photoModal).forEach(([key, value]) => {
          if (['id', 'image', 'images', 'image_url', 'miniature_url', 'album_titre', 'telechargements', 'cree_le'].includes(key)) return
          if (value === null || value === undefined) return
          formData.append(key, value)
        })
        if (imageFile) {
          formData.append('image', imageFile)
          if (!photoModal.titre) {
            formData.set('titre', imageFile.name.replace(/\.[^/.]+$/, ''))
          } else if (photoModal.images?.length > 1) {
            formData.set('titre', `${photoModal.titre} ${index + 1}`)
          }
        } else if (photoModal.image) {
          formData.append('image', photoModal.image)
        }
        return formData
      }

      if (photoModal.id) {
        await api.updateGaleriePhoto(photoModal.id, buildFormData())
      } else {
        const files = photoModal.images || []
        if (files.length === 0) {
          throw new Error('Selectionnez au moins une photo.')
        }
        for (const [index, file] of files.entries()) {
          await api.createGaleriePhoto(buildFormData(file, index))
        }
      }
      setPhotoModal(null)
      await load()
    } catch (err) {
      onError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const removeAlbum = async (album) => {
    if (!window.confirm(`Voulez-vous vraiment supprimer l'album "${album.titre}" ?`)) return
    await api.deleteGalerieAlbum(album.id).then(load).catch((err) => onError(err.message))
  }

  const removePhoto = async (photo) => {
    if (!window.confirm(`Voulez-vous vraiment supprimer cette photo ?`)) return
    await api.deleteGaleriePhoto(photo.id).then(load).catch((err) => onError(err.message))
  }

  return (
    <section className="admin-panel gallery-admin">
      <div className="admin-panel-head">
        <div>
          <h1>Galerie officielle</h1>
          <p>Ajoutez les albums et les photos visibles publiquement sans code billet.</p>
        </div>
        <div className="gallery-admin-actions">
          <button type="button" onClick={() => setAlbumModal(emptyAlbum)}><Plus size={17} /> Album</button>
          <button type="button" onClick={() => setPhotoModal({ ...emptyPhoto, album: albums[0]?.id || '' })}><Upload size={17} /> Photo</button>
        </div>
      </div>

      <section className="gallery-admin-grid">
        <div>
          <h2>Albums</h2>
          <div className="gallery-admin-list">
            {albums.map((album) => (
              <article key={album.id}>
                {album.couverture ? <img src={album.couverture} alt="" /> : <span><Image size={22} /></span>}
                <div>
                  <strong>{album.titre}</strong>
                  <small>{album.nombre_photos || 0} photo(s) | {album.actif ? 'Visible' : 'Masque'}</small>
                </div>
                <button type="button" onClick={() => setAlbumModal(album)}><Edit3 size={16} /></button>
                <button className="danger" type="button" onClick={() => removeAlbum(album)}><Trash2 size={16} /></button>
              </article>
            ))}
            {albums.length === 0 && <div className="admin-empty">Aucun album cree.</div>}
          </div>
        </div>

        <div>
          <div className="gallery-admin-search">
            <Search size={17} />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher une photo..." />
          </div>
          <div className="gallery-admin-photos">
            {filteredPhotos.map((photo) => (
              <article key={photo.id}>
                <img src={photo.miniature_url || photo.image_url} alt={photo.titre || 'Photo'} />
                <div>
                  <strong>{photo.titre || photo.album_titre}</strong>
                  <small>{photo.album_titre} | {photo.telechargements || 0} telechargement(s)</small>
                </div>
                <button type="button" onClick={() => setPhotoModal({ ...photo, image: null, images: [], album: photo.album })}><Edit3 size={16} /></button>
                <button className="danger" type="button" onClick={() => removePhoto(photo)}><Trash2 size={16} /></button>
              </article>
            ))}
            {filteredPhotos.length === 0 && <div className="admin-empty">Aucune photo trouvee.</div>}
          </div>
        </div>
      </section>

      {albumModal && (
        <div className="modal">
          <form className="modal-box admin-modal" onSubmit={saveAlbum}>
            <button className="close" type="button" onClick={() => setAlbumModal(null)}>x</button>
            <h2>{albumModal.id ? 'Modifier album' : 'Nouvel album'}</h2>
            <div className="modal-fields">
              <label className="field-label">Titre<input required value={albumModal.titre} onChange={(e) => setAlbumModal({ ...albumModal, titre: e.target.value })} /></label>
              <label className="field-label">Categorie<input value={albumModal.categorie || ''} onChange={(e) => setAlbumModal({ ...albumModal, categorie: e.target.value })} /></label>
              <label className="field-label">Date<input type="date" value={albumModal.date_evenement || ''} onChange={(e) => setAlbumModal({ ...albumModal, date_evenement: e.target.value })} /></label>
              {albumModal.id && <label className="field-label">Ordre<input type="number" value={albumModal.ordre || 0} onChange={(e) => setAlbumModal({ ...albumModal, ordre: e.target.value })} /></label>}
              <label className="field-label field-wide">Description<textarea value={albumModal.description || ''} onChange={(e) => setAlbumModal({ ...albumModal, description: e.target.value })} /></label>
              <label className="check-row"><input type="checkbox" checked={albumModal.actif} onChange={(e) => setAlbumModal({ ...albumModal, actif: e.target.checked })} /> Visible au public</label>
            </div>
            <div className="modal-actions">
              <button className="secondary" type="button" onClick={() => setAlbumModal(null)}>Annuler</button>
              <button type="submit" disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
            </div>
          </form>
        </div>
      )}

      {photoModal && (
        <div className="modal">
          <form className="modal-box admin-modal" onSubmit={savePhoto}>
            <button className="close" type="button" onClick={() => setPhotoModal(null)}>x</button>
            <h2>{photoModal.id ? 'Modifier photo' : 'Ajouter photo'}</h2>
            <div className="modal-fields">
              <label className="field-label">Album<select required value={photoModal.album || ''} onChange={(e) => setPhotoModal({ ...photoModal, album: e.target.value })}>
                <option value="">Choisir</option>
                {albums.map((album) => <option key={album.id} value={album.id}>{album.titre}</option>)}
              </select></label>
              <label className="field-label">Titre<input value={photoModal.titre || ''} onChange={(e) => setPhotoModal({ ...photoModal, titre: e.target.value })} /></label>
              <label className="field-label">Photographe<input value={photoModal.photographe || ''} onChange={(e) => setPhotoModal({ ...photoModal, photographe: e.target.value })} /></label>
              <label className="field-label">Lieu<input value={photoModal.lieu || ''} onChange={(e) => setPhotoModal({ ...photoModal, lieu: e.target.value })} /></label>
              <label className="field-label">Mots cles<input value={photoModal.mots_cles || ''} onChange={(e) => setPhotoModal({ ...photoModal, mots_cles: e.target.value })} /></label>
              <label className="field-label">Ordre<input type="number" value={photoModal.ordre || 0} onChange={(e) => setPhotoModal({ ...photoModal, ordre: e.target.value })} /></label>
              <label className="field-label field-wide">Photo<input required={!photoModal.id} multiple={!photoModal.id} type="file" accept="image/*" onChange={(e) => {
                const files = Array.from(e.target.files || [])
                setPhotoModal({ ...photoModal, image: files[0] || null, images: photoModal.id ? [] : files })
              }} /></label>
              {photoPreview.length > 0 && (
                <div className="gallery-upload-preview">
                  <div>
                    {photoPreview.map((preview) => <img src={preview} alt="Apercu avant envoi" key={preview} />)}
                  </div>
                  <span>{photoPreview.length} photo(s) selectionnee(s)</span>
                </div>
              )}
              <label className="field-label field-wide">Description<textarea value={photoModal.description || ''} onChange={(e) => setPhotoModal({ ...photoModal, description: e.target.value })} /></label>
              <label className="check-row"><input type="checkbox" checked={photoModal.moment_fort} onChange={(e) => setPhotoModal({ ...photoModal, moment_fort: e.target.checked })} /> Moment fort</label>
              <label className="check-row"><input type="checkbox" checked={photoModal.actif} onChange={(e) => setPhotoModal({ ...photoModal, actif: e.target.checked })} /> Visible au public</label>
            </div>
            <div className="modal-actions">
              <button className="secondary" type="button" onClick={() => setPhotoModal(null)}>Annuler</button>
              <button type="submit" disabled={saving}>{saving ? 'Traitement...' : 'Enregistrer'}</button>
            </div>
          </form>
        </div>
      )}
    </section>
  )
}

export default GalerieAdmin
