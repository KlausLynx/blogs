import { API_URL } from './config.js'

    const token = localStorage.getItem('token')

    if (!token) {
        window.location.href = './login.html'
    }

    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('token')
        window.location.href = './login.html'
    })

    async function loadProfile() {
        const message = document.getElementById('message')

        try {
            const response = await fetch(`${API_URL}/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })

            const data = await response.json()

            if (response.status === 401) {
                localStorage.removeItem('token')
                window.location.href = './login.html'
                return
            }

            if (!response.ok) {
                throw new Error(data.message)
            }

            document.getElementById('profileName').textContent = data.name
            document.getElementById('profileEmail').textContent = data.email
            document.getElementById('joinedAt').textContent =
                new Date(data.joinedAt).toLocaleDateString()
            document.getElementById('blogCount').textContent = data.blogCount

            document.getElementById('profileCard').hidden = false
        } catch (err) {
            console.log(err)
            message.textContent = 'Could not load your profile. Please try again.'
        }
    }

    loadProfile()