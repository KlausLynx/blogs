import { API_URL } from "./config.js"
const $ = (id) => document.getElementById(id);

const validate = () => {
    const nameInputValue = $('username').value
    const emailInputValue = $('email').value
    const passwordInputValue = $('password').value
    const confirmPwInputValue = $('confirm_password').value
    const nameInputError = $('nameError');
    const emailInputError = $('emailError')
    const passwordInputError = $('passwordError')
    const confirmPwInputError = $('confirmPasswordError')

    nameInputError.textContent = ''
    emailInputError.textContent = ''
    passwordInputError.textContent = ''
    confirmPwInputError.textContent = ''

    if( nameInputValue.trim() === '' ) {
        nameInputError.textContent = 'Name can\'t be empty'
    }

    if( !emailInputValue.includes('@') ) {
        emailInputError.textContent = 'Email must be written in correct format'
        console.log('lets run1')
    }
    if( passwordInputValue.length < 8 ) {
        passwordInputError.textContent = 'Password must be greater than 8'
    }

    if( confirmPwInputValue !== passwordInputValue ) {
        confirmPwInputError.textContent = 'Passwords must match'
    }

    setTimeout(() => {
        nameInputError.textContent = ''
        emailInputError.textContent = ''
        passwordInputError.textContent = ''
        confirmPwInputError.textContent = ''
    }, 1000)

    return true
}

$('register').addEventListener('submit', async (e) => {
    e.preventDefault()

    const nameInputValue = $('username').value
    const emailInputValue = $('email').value
    const passwordInputValue = $('password').value
    const serverError = $('serverError')

    if(!validate()) return

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'content-Type': 'Application/json'},
            body: JSON.stringify({name: nameInputValue, email: emailInputValue, password: passwordInputValue})
        })
        const data = await response.json();

        if (!response.ok) {
            throw new Error(`Fetch Failed ${data.message}`)
        }
        e.target.reset()
    } catch(err) {
        serverError.textContent =  `Fetch failed, ${err.message}`
    }
})