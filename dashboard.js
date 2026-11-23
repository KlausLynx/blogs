import { API_URL } from "./config.js"
document.addEventListener('DOMContentLoaded', async () => {

    const $ = (id) => document.getElementById(id)
    const token = localStorage.getItem('token')
    if (!token) return window.location.href = './login.html'

    try {
        const response = await fetch(`${API_URL}/dashboard`, {
            method: 'GET',
            headers: {'Authorization': `bearer ${token}`}
        })

        const data = await response.json()
        console.log(data.message);
        console.log(data.blogs);
        console.log(data.name);
        if (!response.ok) throw new Error (data.message ||'Failed to fetch blogs')
            const blogList = $('blogList')
            const h1 = document.createElement('h1');
            h1.className = 'page-heading'
            h1.textContent = data.name
            data.blogs.forEach(blog => {
                const div = document.createElement('div');
                div.className = 'blog-card'
                const innerDiv = document.createElement('div');
                innerDiv.className = 'blog-body'
                blog.blocks.forEach(({ type, value }) => {
                    if(type === 'text') {
                        const p = document.createElement('p')
                        p.className = 'blog-text'
                        p.textContent = value
                        innerDiv.appendChild(p)
                    }
                    if (type === 'image') {
                        const img = document.createElement('img')
                        img.className = 'blog-img blog-media'
                        img.alt = 'Blog image'
                        img.src = value
                        innerDiv.appendChild(img)
                    }
                    if (type === 'video') {
                        const video = document.createElement('video')
                        video.className = 'blog-video blog-media'
                        video.src = value
                        video.controls = true
                        video.preload = 'metadata'
                        innerDiv.appendChild(video)
                    }
                })
                div.appendChild(innerDiv)
                blogList.appendChild(div)
            })
    } catch (err) {
        console.log(err.message)
    }
})