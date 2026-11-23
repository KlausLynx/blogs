import { API_URL } from "./config.js"
const $ = (id) => document.getElementById(id);

const passwordIcon = $('togglePassword')
const passwordInput = $('password')

const toggleFunc = (icon, input) => {
    input.type = input.type === 'password' ? 'text' : 'password';
    icon.classList.toggle('fa-eye-slash') ? icon.classList.toggle('fa-eye') : icon.classList.toggle('fa-eye')
}

$('togglePassword').addEventListener('click', () => toggleFunc(passwordIcon, passwordInput))


const validate = () => {
    const emailInputValue = $('email').value
    const passwordInputValue = $('password').value
    const emailInputError = $('emailError')
    const passwordInputError = $('passwordError')

    emailInputError.textContent = ''
    passwordInputError.textContent = ''

    if( !emailInputValue.includes('@') ) {
        emailInputError.textContent = 'Email must be written in correct format'
        console.log('lets run1')
    }
    if( passwordInputValue.length < 8 ) {
        passwordInputError.textContent = 'Password must be greater than 8'
    }

    setTimeout(() => {
        emailInputError.textContent = ''
        passwordInputError.textContent = ''
    }, 1000)

    return true
}

$('login').addEventListener('submit', async (e) => {
    e.preventDefault()

    const emailInputValue = $('email').value
    const passwordInputValue = $('password').value
    const serverError = $('serverError')

    if(!validate()) return

    try {
        const response = await fetch(`${ API_URL}/login`, {
            method: 'POST',
            headers: {'content-Type': 'Application/json'},
            body: JSON.stringify({email: emailInputValue , password: passwordInputValue })
        })

        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Fetch Failed ${data.message}`)
        }else {
            localStorage.setItem('token', data.token)
            window.location.href = './dashboard.html'
        }
        e.target.reset()
    } catch (err) {
        serverError.textContent = `Fetch failed, ${err.message}`
    }   
})