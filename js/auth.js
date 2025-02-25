// Check if user is authenticated
function isAuthenticated() {
    const token = localStorage.getItem('jwt');
    if (!token) return false;
    
    try {
        // Remove quotes if present
        const cleanToken = token.replace(/^"(.*)"$/, '$1');
        const payloadBase64 = cleanToken.split('.')[1];
        const payloadJson = atob(payloadBase64);
        const payload = JSON.parse(payloadJson);
        
        // Check if token is expired
        const currentTime = Math.floor(Date.now() / 1000);
        return !payload.exp || payload.exp > currentTime;
    } catch (error) {
        console.error('Token validation error:', error);
        return false;
    }
}

// Redirect to login if not authenticated
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
    }
}

// Handle logout
function logout() {
    localStorage.removeItem('jwt');
    window.location.href = 'login.html';
} 