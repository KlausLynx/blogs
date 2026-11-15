// import { API_URL } from "./config";

const $ = (id) => document.getElementById(id)

$('publishBtn').addEventListener('click', async (e) => {
    e.preventDefault()
    const categoryValue = $('category').value
    // console.log(categoryValue)
    // try {
    //     const response = await fetch(`${API_URL}/createBlog`, {
    //         method: 'POST',
    //         headers: { 'content-Type': 'application/json'},
    //         body: JSON.stringify()
    // })
    // }

})