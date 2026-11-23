import { API_URL } from './config.js'

        const $ = (id) => document.getElementById(id)
        const message = $('message')
        message.textContent = ''

        document.addEventListener('DOMContentLoaded', async () => {
            const params = new URLSearchParams(window.location.search)
            const id  = params.get('id')

            try {
                const response = await fetch(`${API_URL}/blogs/${id}`)
                const blog = await response.json()
                console.log(blog)

                if (!response.ok) {
                    throw new Error('Error while fetching blog')
                }

                if (blog.length === 0) {
                    message.textContent = 'No blog found.'
                    return
                }

                const body = document.querySelector('.blog-body')
                body.querySelector('h2').textContent = blog.title
                document.title = `${blog.title} | Macro Map`

                const authorName = blog.author ? blog.author.name : 'Unknown'
                const date = new Date(blog.createdAt).toLocaleDateString()
                $('meta').textContent = `${blog.category} · By ${authorName} · ${date}`

                blog.blocks.forEach(block => {
                    if (block.type === 'text') {
                        const p = document.createElement('p')
                        p.textContent = block.value
                        body.appendChild(p)
                    }

                    if (block.type === 'image') {
                        const img = document.createElement('img')
                        img.src = block.value
                        img.alt = blog.title
                        body.appendChild(img)
                    }

                    if (block.type === 'video') {
                        const video = document.createElement('video')
                        video.src = block.value
                        video.controls = true
                        body.appendChild(video)
                    }
                })
            } catch (err) {
                console.log(err)
                message.textContent = 'Could not load blog. Please try again.'
                window.location.href = './index.html'
            }
        })