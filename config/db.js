// Mock database configuration
const pool = {
  query: async (sql, params) => {
    console.log(`[DB Mock] Query executed: ${sql}`);
    console.log(`[DB Mock] Parameters:`, params);
    
    // Return mock data based on the query
    if (sql.includes('admin_users')) {
      return [
        [{
          id: 1,
          username: 'admin',
          password: '$2a$10$XQYRmvxGVKagoNSvD1LYLuQwQZ.xCgPY8QqHVn6Iy9h1JWQkWxiTC', // Hashed 'password'
          email: 'admin@example.com',
          name: 'Administrator'
        }],
        []
      ];
    }
    
    // Default empty result
    return [[], []];
  }
};

module.exports = { pool };