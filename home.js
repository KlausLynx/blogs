import { API_URL } from "./config.js"

const DETAILS_PAGE = './blog.html'

// Max characters shown on a card; the rest is cut off with "…"
const PREVIEW_CHARS_WITH_COVER = 110
const PREVIEW_CHARS_NO_COVER = 260

document.addEventListener('DOMContentLoaded', () => {
    const $ = (id) => document.getElementById(id)
    const list = $('blogList')

    // Create an element safely (textContent avoids HTML injection)
    const el = (tag, className, text) => {
        const node = document.createElement(tag)
        if (className) node.className = className
        if (text !== undefined && text !== null) node.textContent = text
        return node
    }

    const formatDate = (value) => {
        if (!value) return ''
        const d = new Date(value)
        return isNaN(d) ? '' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    }

    const blocksOf = (blog) => (Array.isArray(blog.blocks) ? blog.blocks : [])

    const urlOf = (v) => (typeof v === 'string' ? v : v?.url || v?.src || v?.value || '')

    // Cover image is optional: a direct image field, or the first image block
    function getCoverImage(blog) {
        for (const field of ['coverImage', 'image', 'imageUrl', 'thumbnail']) {
            const url = urlOf(blog[field]).trim()
            if (url) return url
        }
        const block = blocksOf(blog).find((b) => b.type === 'image' && urlOf(b))
        return block ? urlOf(block).trim() : ''
    }

    // Short plain-text preview, never the whole blog
    function getPreview(blog, maxChars) {
        const raw = blog.excerpt || blog.content || blog.body ||
            blocksOf(blog)
                .filter((b) => b.type === 'text')
                .map((b) => b.value || b.text || '')
                .join(' ')

        const text = String(raw).replace(/\s+/g, ' ').trim()
        if (text.length <= maxChars) return text
        return text.slice(0, maxChars).replace(/\s+\S*$/, '') + '…'
    }

    function createBlogCard(blog) {
        const id = blog._id || blog.id
        const detailsUrl = `${DETAILS_PAGE}?id=${encodeURIComponent(id)}`
        const coverUrl = getCoverImage(blog)
        const authorName = typeof blog.author === 'object' ? blog.author?.name : blog.author
        const date = formatDate(blog.createdAt || blog.date)

        const card = el('article', `blog-card ${coverUrl ? 'has-cover' : 'no-cover'}`)

        // Optional image
        if (coverUrl) {
            const img = el('img', 'blog-cover')
            img.src = coverUrl
            img.alt = blog.title || 'Blog cover image'
            img.loading = 'lazy'
            // If the image fails to load, fall back to the text-only layout
            img.addEventListener('error', () => {
                img.remove()
                card.classList.replace('has-cover', 'no-cover')
            })
            card.appendChild(img)
        }

        const content = el('div', 'blog-content')
        content.appendChild(el('h2', null, blog.title || 'Untitled'))

        const meta = el('div', 'blog-meta')
        if (blog.category) meta.appendChild(el('span', 'blog-tag', blog.category))
        if (authorName) meta.appendChild(el('span', null, authorName))
        if (date) meta.appendChild(el('span', null, date))
        content.appendChild(meta)

        const body = el('div', 'blog-body')
        body.appendChild(el('p', null, getPreview(blog, coverUrl ? PREVIEW_CHARS_WITH_COVER : PREVIEW_CHARS_NO_COVER)))
        content.appendChild(body)

        // Read more -> details page
        const readMore = el('a', 'blog-read-more')
        readMore.href = detailsUrl
        readMore.append('Read more ', el('i', 'fa-solid fa-arrow-right'))
        content.appendChild(readMore)

        card.appendChild(content)

        // Clicking anywhere else on the card also opens the blog
        card.addEventListener('click', (e) => {
            if (e.target.closest('a')) return
            window.location.href = detailsUrl
        })

        return card
    }

    // Loading / empty / error state, using the existing .no-blogs style
    function showMessage(iconClass, text) {
        const box = el('div', 'no-blogs')
        box.append(el('i', iconClass), el('p', null, text))
        list.replaceChildren(box)
    }

    function renderBlogs(blogs) {
        if (!blogs.length) {
            showMessage('fa-regular fa-newspaper', 'No blogs found.')
            return
        }
        list.replaceChildren(...blogs.map(createBlogCard))
    }

    async function loadBlogs() {
        const params = new URLSearchParams()
        const search = $('search').value.trim()
        const category = $('categoryFilter').value

        if (search) params.set('search', search)
        if (category) params.set('category', category)

        showMessage('fa-solid fa-spinner fa-spin', 'Loading posts…')

        try {
            const response = await fetch(`${API_URL}/blogs?${params}`, { method: 'GET' })
            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch blogs')
            }

            renderBlogs(Array.isArray(data) ? data : (data.blogs || data.data || []))
        } catch (err) {
            console.error(err)
            showMessage('fa-solid fa-triangle-exclamation', err.message || 'Something went wrong. Please try again.')
        }
    }

    $('filterForm').addEventListener('submit', (e) => {
        e.preventDefault()
        loadBlogs()
    })

    loadBlogs()
})