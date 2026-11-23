import { API_URL } from "./config.js"

const DETAILS_PAGE = './blog.html'

// Max characters shown on a card; the rest is cut off with "…"
const PREVIEW_CHARS_WITH_COVER = 110
const PREVIEW_CHARS_NO_COVER = 260

document.addEventListener('DOMContentLoaded', () => {

    const $ = (id) => document.getElementById(id)
    const list = $('blogList')
    const token = localStorage.getItem('token')
    if (!token) return window.location.href = './login.html'

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

    function showMessage(iconClass, text) {
        const box = el('div', 'no-blogs')
        box.append(el('i', iconClass), el('p', null, text))
        list.replaceChildren(box)
    }

    function buildBlogCard(blog) {
        const id = blog._id || blog.id
        const detailsUrl = `${DETAILS_PAGE}?id=${encodeURIComponent(id)}`
        const coverUrl = getCoverImage(blog)
        const date = formatDate(blog.createdAt || blog.date)

        const card = el('article', `blog-card ${coverUrl ? 'has-cover' : 'no-cover'}`)

        // Optional cover image
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

        // Meta line (no author here: the dashboard heading already shows it)
        const meta = el('div', 'blog-meta')
        if (blog.category) meta.appendChild(el('span', 'blog-tag', blog.category))
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

        // ---- Action buttons (dashboard only) ----
        const actions = el('div', 'blog-actions')

        const editBtn = el('button', 'btn-edit')
        editBtn.type = 'button'
        editBtn.title = 'Edit'
        editBtn.setAttribute('aria-label', 'Edit blog')
        editBtn.innerHTML = '<i class="fa-solid fa-pen-to-square"></i>'
        editBtn.addEventListener('click', () => {
            window.location.href = `./edit-blog.html?id=${encodeURIComponent(id)}`
        })

        const deleteBtn = el('button', 'btn-delete')
        deleteBtn.type = 'button'
        deleteBtn.title = 'Delete'
        deleteBtn.setAttribute('aria-label', 'Delete blog')
        deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>'
        deleteBtn.addEventListener('click', async () => {
            if (!confirm('Delete this blog? This cannot be undone.')) return
            deleteBtn.disabled = true
            try {
                const res = await fetch(`${API_URL}/blogs/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `bearer ${token}` }
                })
                const result = await res.json().catch(() => ({}))
                if (!res.ok) throw new Error(result.message || 'Failed to delete blog')
                card.remove()
                if (!list.children.length) {
                    showMessage('fa-solid fa-newspaper', 'No posts found')
                }
            } catch (err) {
                deleteBtn.disabled = false
                alert(err.message)
            }
        })

        actions.append(editBtn, deleteBtn)
        content.appendChild(actions)

        card.appendChild(content)

        // Clicking the card opens the blog, but not when using links or buttons
        card.addEventListener('click', (e) => {
            if (e.target.closest('a, button')) return
            window.location.href = detailsUrl
        })

        return card
    }

    // Used to ignore slow, outdated responses when filters change quickly
    let latestRequest = 0

    async function loadBlogs() {
        const requestId = ++latestRequest

        try {
            const params = new URLSearchParams()
            const search = $('search').value.trim()
            const category = $('categoryFilter').value

            if (search) params.set('search', search)
            if (category) params.set('category', category)

            showMessage('fa-solid fa-spinner fa-spin', 'Loading posts…')

            const response = await fetch(`${API_URL}/dashboard?${params}`, {
                method: 'GET',
                headers: { 'Authorization': `bearer ${token}` }
            })

            const data = await response.json()
            if (requestId !== latestRequest) return
            if (!response.ok) throw new Error(data.message || 'Failed to fetch blogs')

            const h1 = $('author')
            h1.className = 'page-heading'
            h1.textContent = data.name

            if (!data.blogs.length) {
                showMessage('fa-solid fa-newspaper', 'No posts found')
                return
            }

            list.replaceChildren(...data.blogs.map(buildBlogCard))
        } catch (err) {
            if (requestId !== latestRequest) return
            console.log(err.message)
            showMessage('fa-solid fa-circle-exclamation', err.message)
        }
    }

    // Re-fetch whenever the filters change
    $('categoryFilter').addEventListener('change', loadBlogs)

    let searchTimer
    $('search').addEventListener('input', () => {
        clearTimeout(searchTimer)
        searchTimer = setTimeout(loadBlogs, 300)   
    })

    loadBlogs()

    $('navLogout').addEventListener('click', () => {
        localStorage.removeItem('token')
        window.location.href = './login.html'
    })
})