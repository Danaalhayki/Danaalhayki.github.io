document.addEventListener('DOMContentLoaded', () => {
    // Redirect to profile if already logged in
    if (isAuthenticated()) {
        window.location.href = 'index.html';
        return;
    }

    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMessage.textContent = ''; // Clear previous error
        
        const usernameOrEmail = document.getElementById('usernameOrEmail').value;
        const password = document.getElementById('password').value;
        
        try {
            const response = await fetch('https://learn.reboot01.com/api/auth/signin', {
                method: 'POST',
                headers: {
                    'Authorization': 'Basic ' + btoa(usernameOrEmail + ':' + password)
                }
            });
            
            if (response.ok) {
                const token = await response.text();
                // Store token without quotes
                localStorage.setItem('jwt', token.replace(/^"(.*)"$/, '$1'));
                window.location.href = 'index.html';
            } else {
                throw new Error('Invalid credentials');
            }
        } catch (error) {
            errorMessage.textContent = error.message;
            console.error('Login error:', error);
        }
    });
});

function logout() {
    localStorage.removeItem('jwt');
    window.location.href = 'login.html';
}
