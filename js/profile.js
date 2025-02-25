document.addEventListener('DOMContentLoaded', async () => {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    const token = localStorage.getItem('jwt');
    
    try {
        // Function to decode JWT and extract user ID
        function getUserIdFromToken(token) {
            try {
                // Remove quotes if present in the token
                const cleanToken = token.replace(/^"(.*)"$/, '$1');
                const payloadBase64 = cleanToken.split('.')[1];
                const payloadJson = atob(payloadBase64);
                const payload = JSON.parse(payloadJson);
                // Check both sub and id fields since the token might use either
                return payload.sub || payload.id;
            } catch (error) {
                console.error('Error decoding token:', error);
                return null;
            }
        }

        const userId = getUserIdFromToken(token);
        if (!userId) {
            throw new Error('Could not get user ID from token');
        }

        const response = await fetch('https://learn.reboot01.com/api/graphql-engine/v1/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Remove quotes if present in the token
                'Authorization': `Bearer ${token.replace(/^"(.*)"$/, '$1')}`
            },
            body: JSON.stringify({
                query: `
                    query getUserData($userId: Int!) {
                        user: user_by_pk(id: $userId) {
                            id
                            login
                            firstName
                            lastName
                            email
                            auditRatio
                            totalUp
                            totalDown
                            transactions {
                                id
                                type
                                amount
                                createdAt
                                path
                                objectId
                            }
                            results(
                                where: { grade: { _is_null: false } }
                                order_by: { createdAt: asc }
                            ) {
                                id
                                grade
                                createdAt
                                path
                            }
                        }
                    }
                        
                `,
                variables: { userId: parseInt(userId) }
            })
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user data');
        }

        const result = await response.json();
        console.log('GraphQL Response:', result); // For debugging

        if (result.errors) {
            throw new Error(result.errors[0].message);
        }

        const userData = result.data.user;
        if (!userData) {
            throw new Error('User data not found');
        }
        
        // Update UI with more detailed information
        document.getElementById('username').textContent = 
            `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.login;

            let totalup = userData.totalUp
       
            // Bytes

            // Convert to MB and round to two decimal places
            let totalDownInMB = (userData.totalDown / 1000000).toFixed(2); 
            let totalupInMB = (userData.totalUp / 1000000).toFixed(2);
            
        document.getElementById('xp').innerHTML = `
            <p><strong>Name:</strong> ${userData.firstName || ''} ${userData.lastName || ''}</p>
            <p><strong>Username:</strong> ${userData.login}</p>
            <p><strong>Email:</strong> ${userData.email || 'Not provided'}</p>
            <p><strong>Audit Ratio:</strong> ${parseFloat(userData.auditRatio?.toFixed(1) || '0')}</p>
            <p><strong>Total Up:</strong> ${totalupInMB || 0}</p>
            <p><strong>Total Down:</strong> ${ totalDownInMB|| 0}</p>
        `;

        // Draw graphs
        await drawGraphs(userData);

    } catch (error) {
        console.error('Error:', error);
        // Only logout if it's an authentication error
        if (error.message.includes('token') || error.message.includes('unauthorized')) {
            alert('Authentication error. Please login again.');
            logout();
        } else {
            alert('Error loading profile data: ' + error.message);
        }
    }
});
