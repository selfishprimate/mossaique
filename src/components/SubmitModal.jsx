import { useState } from 'react'
import Modal from '@/components/ui/modal'
import { categories } from '@/data/categories'

export default function SubmitModal({ isOpen, onClose, onShowToast }) {
  const [formData, setFormData] = useState({
    category: '',
    resourceName: '',
    resourceUrl: '',
    description: '',
    submitterName: '',
    submitterGithub: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState(null) // 'success' | 'error' | null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus(null)

    try {
      const response = await fetch('/.netlify/functions/submit-resource', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (response.ok) {
        // Reset form
        setFormData({
          category: '',
          resourceName: '',
          resourceUrl: '',
          description: '',
          submitterName: '',
          submitterGithub: ''
        })

        // Close modal immediately
        onClose()
        setSubmitStatus(null)

        // Show success toast
        if (onShowToast) {
          onShowToast("Your resource has been submitted successfully! We'll review it shortly.", 'success')
        }
      } else {
        setSubmitStatus('error')
        console.error('Submission error:', data)
      }
    } catch (error) {
      setSubmitStatus('error')
      console.error('Submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const isFormValid = formData.category && formData.resourceName && formData.resourceUrl && formData.description

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      variant="fullPage"
      title="Submit a Resource"
      description="Share a design resource with the community. All submissions will be reviewed before being added to the collection."
      maxWidth="max-w-xl"
    >
      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
          {/* Success/Error Messages */}
          {submitStatus === 'success' && (
            <div className="rounded-lg bg-green-50 p-4 text-green-800 dark:bg-green-900/20 dark:text-green-300">
              ✅ Thank you! Your submission has been sent for review.
            </div>
          )}
          {submitStatus === 'error' && (
            <div className="rounded-lg bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-300">
              ❌ Something went wrong. Please try again or contact us directly.
            </div>
          )}

          {/* Category */}
          <div className="relative">
            <label
              htmlFor="category"
              className="absolute left-3 top-2 text-xs font-medium text-gray-600 dark:text-gray-400"
            >
              Category *
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="w-full appearance-none rounded-lg border border-gray-300 bg-gray-100 px-3 pt-6 pb-2 pr-10 text-gray-900 transition-colors focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-blue-400"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 0.75rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em'
              }}
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.title}
                </option>
              ))}
            </select>
          </div>

          {/* Resource Name */}
          <div className="relative">
            <label
              htmlFor="resourceName"
              className="absolute left-3 top-2 text-xs font-medium text-gray-600 dark:text-gray-400"
            >
              Resource Name *
            </label>
            <input
              type="text"
              id="resourceName"
              name="resourceName"
              value={formData.resourceName}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 pt-6 pb-2 text-gray-900 transition-colors focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-blue-400"
            />
          </div>

          {/* Resource URL */}
          <div className="relative">
            <label
              htmlFor="resourceUrl"
              className="absolute left-3 top-2 text-xs font-medium text-gray-600 dark:text-gray-400"
            >
              Resource URL *
            </label>
            <input
              type="url"
              id="resourceUrl"
              name="resourceUrl"
              value={formData.resourceUrl}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 pt-6 pb-2 text-gray-900 transition-colors focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-blue-400"
            />
          </div>

          {/* Description */}
          <div className="relative">
            <label
              htmlFor="description"
              className="absolute left-3 top-2 text-xs font-medium text-gray-600 dark:text-gray-400"
            >
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={3}
              className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 pt-6 pb-2 text-gray-900 transition-colors focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-blue-400"
            />
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-800/50" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Optional: Help us credit you for this submission
          </p>

          {/* Submitter Name */}
          <div className="relative">
            <label
              htmlFor="submitterName"
              className="absolute left-3 top-2 text-xs font-medium text-gray-600 dark:text-gray-400"
            >
              Your Name
            </label>
            <input
              type="text"
              id="submitterName"
              name="submitterName"
              value={formData.submitterName}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 pt-6 pb-2 text-gray-900 transition-colors focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-blue-400"
            />
          </div>

          {/* Submitter GitHub */}
          <div className="relative">
            <label
              htmlFor="submitterGithub"
              className="absolute left-3 top-2 text-xs font-medium text-gray-600 dark:text-gray-400"
            >
              GitHub Username
            </label>
            <input
              type="text"
              id="submitterGithub"
              name="submitterGithub"
              value={formData.submitterGithub}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 pt-6 pb-2 text-gray-900 transition-colors focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-blue-400"
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border-2 border-gray-300 px-4 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Resource'}
            </button>
          </div>
        </form>
    </Modal>
  )
}
