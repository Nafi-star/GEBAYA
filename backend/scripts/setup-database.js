const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Database setup script
async function setupDatabase() {
    console.log('🚀 Starting GebeyaNet Database Setup...\n');
    
    // First, connect without specifying database to create it
    const connection = mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        port: process.env.DB_PORT || 3306,
        multipleStatements: true
    });
    
    try {
        // Test connection
        await new Promise((resolve, reject) => {
            connection.connect((err) => {
                if (err) {
                    console.error('❌ Failed to connect to MySQL server:');
                    console.error('   Error:', err.message);
                    console.error('   Code:', err.code);
                    
                    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
                        console.error('\n🔑 Solution: Check your MySQL username and password in .env file');
                    } else if (err.code === 'ECONNREFUSED') {
                        console.error('\n🔌 Solution: Make sure MySQL server is running');
                        console.error('   - Windows: Start MySQL service from Services panel');
                        console.error('   - Mac: brew services start mysql');
                        console.error('   - Linux: sudo systemctl start mysql');
                    }
                    
                    reject(err);
                } else {
                    console.log('✅ Connected to MySQL server successfully');
                    resolve();
                }
            });
        });
        
        // Read and execute SQL setup script
        const sqlScript = fs.readFileSync(
            path.join(__dirname, '../config/database-setup.sql'), 
            'utf8'
        );
        
        console.log('📄 Executing database setup script...');
        
        await new Promise((resolve, reject) => {
            connection.query(sqlScript, (err, results) => {
                if (err) {
                    console.error('❌ Error executing SQL script:', err.message);
                    reject(err);
                } else {
                    console.log('✅ Database setup completed successfully');
                    resolve(results);
                }
            });
        });
        
        // Verify setup
        console.log('\n🔍 Verifying database setup...');
        
        const verificationQueries = [
            'USE gebeyanet_db',
            'SELECT COUNT(*) as table_count FROM information_schema.TABLES WHERE TABLE_SCHEMA = "gebeyanet_db"',
            'SELECT COUNT(*) as category_count FROM categories',
            'SELECT COUNT(*) as wholesaler_count FROM wholesalers'
        ];
        
        for (const query of verificationQueries) {
            await new Promise((resolve, reject) => {
                connection.query(query, (err, results) => {
                    if (err) {
                        console.error(`❌ Verification query failed: ${query}`);
                        reject(err);
                    } else {
                        if (results[0]) {
                            const result = results[0];
                            if (result.table_count) {
                                console.log(`✅ Created ${result.table_count} tables`);
                            } else if (result.category_count) {
                                console.log(`✅ Inserted ${result.category_count} product categories`);
                            } else if (result.wholesaler_count) {
                                console.log(`✅ Inserted ${result.wholesaler_count} sample wholesalers`);
                            }
                        }
                        resolve(results);
                    }
                });
            });
        }
        
        console.log('\n🎉 Database setup completed successfully!');
        console.log('📊 Your GebeyaNet database is ready to use.');
        console.log('\n📋 Next steps:');
        console.log('   1. Start the backend server: npm run dev');
        console.log('   2. Test API endpoints with Postman or curl');
        console.log('   3. Connect your frontend to the backend');
        
    } catch (error) {
        console.error('\n❌ Database setup failed:', error.message);
        process.exit(1);
    } finally {
        connection.end();
    }
}

// Run setup if called directly
if (require.main === module) {
    setupDatabase();
}

module.exports = setupDatabase; 