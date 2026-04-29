

































// Home route - shows login/logout status
// app.get('/', (req, res) => {
//     const isAuthenticated = req.oidc.isAuthenticated();

//     res.send(`
//         <html>
//             <head>
//                 <title>Auth0 Express Quickstart</title>
//                 <style>
//                     body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 2rem; max-width: 600px; margin: 0 auto; }
//                     a { color: #0066cc; text-decoration: none; margin-right: 1rem; }
//                     a:hover { text-decoration: underline; }
//                     .status { padding: 1rem; border-radius: 4px; margin: 1rem 0; }
//                     .logged-in { background: #d4edda; color: #155724; }
//                     .logged-out { background: #f8d7da; color: #721c24; }
//                 </style>
//             </head>
//             <body>
//                 <h1>Auth0 Express Quickstart</h1>
//                 <div class="status ${isAuthenticated ? 'logged-in' : 'logged-out'}">
//                     ${isAuthenticated ? '✓ You are logged in' : '✗ You are logged out'}
//                 </div>
//                 <nav>
//                     ${isAuthenticated
//                         ? '<a href="/profile">Profile</a> | <a href="/logout">Logout</a>'
//                         : '<a href="/login">Login</a>'}
//                 </nav>
//             </body>
//         </html>
//     `);
// });



// app.use(isActive()) // middleware for checking if user is already authenticated

// Protected profile route - requires authentication
// app.get('/profile', (req, res) => {

//     res.send(`
//         <html>
//             <head>
//                 <title>Profile - Auth0 Express</title>
//                 <style>
//                     body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 2rem; max-width: 600px; margin: 0 auto; }
//                     a { color: #0066cc; text-decoration: none; }
//                     img { border-radius: 50%; }
//                     pre { background: #f4f4f4; padding: 1rem; border-radius: 4px; overflow-x: auto; }
//                     .card { border: 1px solid #ddd; border-radius: 8px; padding: 1.5rem; margin: 1rem 0; }
//                 </style>
//             </head>
//             <body>
//                 <h1>User Profile</h1>
//                 <div class="card">
//                     ${user.picture ? `<img src="${user.picture}" alt="Profile" width="80" />` : ''}
//                     <h2>${user.name || user.nickname || 'User'}</h2>
//                     <p><strong>Email:</strong> ${user.email || 'N/A'}</p>
//                 </div>
//                 <h3>Full User Object</h3>
//                 <pre>${JSON.stringify(user, null, 2)}</pre>
//                 <nav>
//                     <a href="/">← Back to Home</a> | <a href="/logout">Logout</a>
//                 </nav>
//             </body>
//         </html>
//     `)
// });