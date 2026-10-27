import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'

const defaults = { courseCode: '', rating: 5, comment: '' }

export default function ReviewForm() {
  const nav = useNavigate()
  const { id } = useParams()

  const [form, setForm] = useState(defaults)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(Boolean(id))
  const [loaded, setLoaded] = useState(!id)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    // Ignore a response if we have left this review before it arrives.
    let active = true

    setForm(defaults)
    setError('')
    setLoading(Boolean(id))
    setLoaded(!id)

    if (!id) return

    async function load() {
      try {
        const { data } = await api.get('/reviews/' + id)

        if (!active) return

        const { courseCode, rating, comment } = data.review

        setForm({
          courseCode,
          rating: Number(rating),
          comment: comment ?? ''
        })
        setLoaded(true)
      } catch (err) {
        if (active) {
          setError(
              err?.response?.data?.message || 'Could not load review'
          )
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    load()

    return () => {
      active = false
    }
  }, [id])

  function onChange(e) {
    const { name, value } = e.target

    setForm(prev => ({
      ...prev,
      [name]: name === 'rating' ? Number(value) : value
    }))
  }

  async function onSubmit(e) {
    e.preventDefault()

    if (busy || loading || !loaded) return

    setError('')
    setBusy(true)

    try {
      // Ownership comes from the token, so do not send reviewedBy.
      const { courseCode, rating, comment } = form
      const payload = { courseCode, rating, comment }

      if (id) {
        await api.patch('/reviews/' + id, payload)
      } else {
        await api.post('/reviews', payload)
      }

      nav('/reviews')
    } catch (err) {
      setError(
          err?.response?.data?.message || 'Could not save review'
      )
    } finally {
      setBusy(false)
    }
  }

  async function onDelete() {
    if (!id || busy || loading) return

    if (!window.confirm('Delete this review?')) return

    setError('')
    setBusy(true)

    try {
      await api.delete('/reviews/' + id)
      nav('/reviews')
    } catch (err) {
      setError(
          err?.response?.data?.message || 'Could not delete review'
      )
    } finally {
      setBusy(false)
    }
  }

  return (
      <div className="max-w-lg mx-auto card">
        <h1 className="text-xl font-semibold mb-4">
          {id ? 'Edit' : 'Write'} Review
        </h1>

        <form onSubmit={onSubmit} className="space-y-3">
          {loading && <p role="status">Loading review…</p>}

          <fieldset
              disabled={busy || loading || !loaded}
              className="space-y-3"
          >
            <div>
              <label
                  htmlFor="courseCode"
                  className="block text-sm mb-1"
              >
                Course code
              </label>

              <input
                  id="courseCode"
                  name="courseCode"
                  type="text"
                  className="input"
                  placeholder="CS101"
                  required
                  minLength={2}
                  value={form.courseCode}
                  onChange={onChange}
              />
            </div>

            <div>
              <label
                  htmlFor="rating"
                  className="block text-sm mb-1"
              >
                Rating
              </label>

              <select
                  id="rating"
                  name="rating"
                  className="input"
                  value={form.rating}
                  onChange={onChange}
              >
                {[1, 2, 3, 4, 5].map(rating => (
                    <option key={rating} value={rating}>
                      {rating}
                    </option>
                ))}
              </select>
            </div>

            <div>
              <label
                  htmlFor="comment"
                  className="block text-sm mb-1"
              >
                Comment (optional)
              </label>

              <textarea
                  id="comment"
                  name="comment"
                  className="input"
                  rows={4}
                  value={form.comment}
                  onChange={onChange}
              />
            </div>
          </fieldset>

          {error && (
              <div role="alert" className="text-red-600 text-sm">
                {error}
              </div>
          )}

          <div className="flex gap-2">
            <button
                className="btn"
                type="submit"
                disabled={busy || loading || !loaded}
            >
              Save
            </button>

            {id && (
                <button
                    className="btn text-red-600"
                    type="button"
                    disabled={busy || loading}
                    onClick={onDelete}
                >
                  Delete
                </button>
            )}
          </div>
        </form>
      </div>
  )
}