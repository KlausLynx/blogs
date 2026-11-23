import { API_URL } from "./config.js";
const token = localStorage.getItem('token')
if (!token) window.location.href = './login.html'

const $ = (id) => document.getElementById(id)

const blocksDiv = $('blocks')
const publishBtn = $('publishBtn')

let uploading = false

function addBlock(type) {
    console.log(type)

    const inputDiv = document.createElement('div');
    inputDiv.className = 'block'
    inputDiv.dataset.type = type

    const header = document.createElement('div')
    header.className = 'block-header'

    const label = document.createElement('span')
    label.className = 'block-label'
    label.textContent = type

    const removeBtn = document.createElement('button')
    removeBtn.type = 'button'
    removeBtn.className = 'remove-btn'
    removeBtn.setAttribute('aria-label', `Remove ${type} block`)
    removeBtn.textContent = '✕'
    removeBtn.addEventListener('click', () => inputDiv.remove())

    header.append(label, removeBtn)
    inputDiv.appendChild(header)

    if (type === 'text') {
        const textArea = document.createElement('textarea');
        textArea.placeholder = 'Write Something ...'
        textArea.className = 'value'
        inputDiv.appendChild(textArea)
    } else {
        const linkInput = document.createElement('input')
        linkInput.type = 'text'
        linkInput.className = 'value'
        linkInput.placeholder = `Paste ${type} link`

        const fileInput = document.createElement('input')
        fileInput.type = 'file'
        fileInput.accept = type === 'image' ? 'image/*' : 'video/*'
        fileInput.multiple = false

        const status = document.createElement('span')
        status.className = 'status'

        fileInput.addEventListener('change', async () => {
            const file = fileInput.files[0]
            if(!file) return

            const formData = new FormData()
            formData.append('file', file)

            uploading = true
            publishBtn.disabled = true
            status.textContent = 'Uploading...'

            try {
                const response = await fetch(`${API_URL}/upload`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`},
                    body: formData
                })
                const data = await response.json()

                if(!response.ok) throw new Error(data.message)
                    linkInput.value = data.url
                status.textContent = 'Uploaded ✓'
                status.className = 'status ok'
            } catch (err) {
                status.textContent = `Failed: ${err.message}`
                status.className = 'status err'
            } finally {
                uploading = false
                if(!uploading) {
                    publishBtn.disabled = false
                }
            }
        })
        const fileRow = document.createElement('div')
        fileRow.className = 'file-row'
        fileRow.append(fileInput, status)

        inputDiv.append(linkInput, fileRow)
    }
    blocksDiv.appendChild(inputDiv)
}

$('addText').addEventListener('click', () => addBlock('text'))
$('addImage').addEventListener('click', () => addBlock('image'))
$('addVideo').addEventListener('click', () => addBlock('video'))

$('blogForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = $('title').value.trim();
    const category = $("category").value;

    const blocks = [...blocksDiv.children].map((div) => ({
        type: div.dataset.type,
        value: div.querySelector('.value').value.trim()
    }))
    .filter((block) => block.value)

    const response = await fetch(`${API_URL}/blog`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, category, blocks })
    })

        console.log(category)
    const data = await response.json()
    alert(data.message)

    if (response.ok) window.location.href = './dashboard.html'
})