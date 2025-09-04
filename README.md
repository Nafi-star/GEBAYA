<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> bcc6d6ac8cd29f47f948c8a6e27541f904dd260d
# GebeyaNet Backend API

Ethiopian Retail Inventory Platform - Backend API built with Node.js, Express, and MySQL.

## 🚀 Features

- **Authentication & Authorization**: JWT-based authentication with role-based access
- **Inventory Management**: Complete CRUD operations for inventory items
- **Sales Tracking**: Record and manage sales transactions
- **Wholesaler Directory**: Browse and search wholesaler catalogs
- **Analytics & Reporting**: Comprehensive business analytics
- **Ethiopian Context**: Built specifically for Ethiopian retail businesses

## 📋 Prerequisites

- Node.js (v16 or higher)
<<<<<<< HEAD
- MySQL/xampp (v8.0 or higher)
=======
- MySQL (v8.0 or higher)
>>>>>>> bcc6d6ac8cd29f47f948c8a6e27541f904dd260d
- npm or yarn package manager

## 🛠 Installation & Setup

<<<<<<< HEAD
=======
### 1. Clone and Install Dependencies

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install
```
>>>>>>> bcc6d6ac8cd29f47f948c8a6e27541f904dd260d

### 2. Database Setup

```bash
# Login to MySQL
mysql -u root -p

# Create database and import schema
source config/database-setup.sql
```

### 3. Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your configuration
nano .env
```

**Required Environment Variables:**

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=gebeyanet_db
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d
```

### 4. Start the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "business_name": "Abebe General Store",
  "owner_name": "Abebe Kebede",
  "email": "abebe@example.com",
  "phone": "+251-911-123456",
  "password": "SecurePass123",
  "business_address": "Merkato, Addis Ababa",
  "business_type": "retail"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "abebe@example.com",
  "password": "SecurePass123"
}
```

#### Get User Profile
```http
GET /api/auth/me
Authorization: Bearer <jwt_token>
```

### Inventory Endpoints

#### Get All Inventory Items
```http
GET /api/inventory?page=1&limit=20&search=teff&category_id=1&low_stock=true
Authorization: Bearer <jwt_token>
```

#### Add New Item
```http
POST /api/inventory
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Teff Flour",
  "name_amharic": "ጤፍ ዱቄት",
  "category_id": 1,
  "quantity": 50,
  "unit": "kg",
  "cost_price": 800,
  "selling_price": 1000,
  "min_threshold": 10
}
```

#### Update Item
```http
PUT /api/inventory/:id
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "quantity": 45,
  "selling_price": 1050
}
```

#### Delete Item
```http
DELETE /api/inventory/:id
Authorization: Bearer <jwt_token>
```

### Sales Endpoints

#### Record Sale
```http
POST /api/sales
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "item_id": 1,
  "quantity": 2,
  "unit_price": 1000,
  "payment_method": "cash",
  "customer_name": "Almaz Tadesse",
  "customer_phone": "+251-911-987654"
}
```

#### Get Sales History
```http
GET /api/sales?page=1&limit=20&start_date=2024-01-01&end_date=2024-01-31
Authorization: Bearer <jwt_token>
```

#### Get Sales Summary
```http
GET /api/sales/summary/dashboard
Authorization: Bearer <jwt_token>
```

### Wholesaler Endpoints

#### Get Wholesalers
```http
GET /api/wholesalers?search=merkato&location=addis&verified_only=true
Authorization: Bearer <jwt_token>
```

#### Search Products
```http
GET /api/wholesalers/products/search?search=coffee&category_id=2&max_price=500
Authorization: Bearer <jwt_token>
```

### Analytics Endpoints

#### Dashboard Analytics
```http
GET /api/analytics/dashboard
Authorization: Bearer <jwt_token>
```

#### Sales Analytics
```http
GET /api/analytics/sales?start_date=2024-01-01&end_date=2024-01-31&group_by=day
Authorization: Bearer <jwt_token>
```

#### Profit Analytics
```http
GET /api/analytics/profit?start_date=2024-01-01&end_date=2024-01-31
Authorization: Bearer <jwt_token>
```

## 🗄 Database Schema

### Key Tables

- **users**: Shop owner accounts and business information
- **inventory_items**: Product inventory with Ethiopian context
- **sales**: Sales transactions and profit tracking
- **wholesalers**: Supplier directory with Ethiopian locations
- **wholesaler_products**: Product catalogs from suppliers
- **categories**: Product categories (Food & Grains, Spices, etc.)
- **stock_movements**: Inventory change tracking
- **user_settings**: User preferences and configurations

### Sample Data

The database comes pre-populated with:
- Ethiopian product categories (Teff, Coffee, Berbere, etc.)
- Sample wholesalers from major Ethiopian markets
- Demo inventory items with Ethiopian Birr pricing

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: API request throttling
- **Input Validation**: Comprehensive request validation
- **SQL Injection Protection**: Parameterized queries
- **CORS Configuration**: Cross-origin request handling
- **Helmet Security**: HTTP security headers

## 📊 Business Logic

### Inventory Management
- Automatic stock level updates on sales
- Low stock alerts based on thresholds
- Profit margin calculations
- Stock movement tracking

### Sales Processing
- Real-time inventory updates
- Automatic profit calculations
- Customer information tracking
- Multiple payment method support

### Analytics Engine
- Daily, weekly, monthly reporting
- Profit margin analysis
- Top-selling items tracking
- Category performance metrics

## 🌍 Ethiopian Context Features

### Currency Support
- Ethiopian Birr (ETB) formatting
- Proper decimal handling for currency

### Local Business Practices
- Ethiopian phone number validation (+251)
- Local business types (retail, wholesale, mixed)
- Ethiopian address formats

### Product Categories
- Traditional Ethiopian products
- Local spices and grains
- Cultural context in naming

## 🚀 Deployment

### Production Setup

1. **Environment Configuration**
```bash
NODE_ENV=production
DB_HOST=your_production_db_host
JWT_SECRET=your_production_jwt_secret
```

2. **Database Migration**
```bash
# Run production database setup
mysql -u production_user -p production_db < config/database-setup.sql
```

3. **Process Management**
```bash
# Using PM2
npm install -g pm2
pm2 start server.js --name gebeyanet-api
pm2 startup
pm2 save
```

### Docker Deployment

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# API testing with curl
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"business_name":"Test Store","owner_name":"Test User","email":"test@example.com","phone":"+251-911-123456","password":"TestPass123"}'
```

## 📈 Performance Optimization

- **Database Indexing**: Optimized queries with proper indexes
- **Connection Pooling**: MySQL connection pool for better performance
- **Caching**: Redis integration ready for caching
- **Pagination**: Efficient data pagination
- **Query Optimization**: Optimized SQL queries for analytics

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection Error**
```bash
# Check MySQL service
sudo systemctl status mysql

# Verify credentials in .env file
```

2. **JWT Token Issues**
```bash
# Verify JWT_SECRET in .env
# Check token expiration settings
```

3. **Port Already in Use**
```bash
# Find process using port 5000
lsof -i :5000

# Kill process or change PORT in .env
```

## 📞 Support

For technical support or questions:
- Email: support@gebeyanet.com
- Documentation: [API Docs](http://localhost:5000/api-docs)
- Health Check: [http://localhost:5000/health](http://localhost:5000/health)

## 📄 License

MIT License - see LICENSE file for details.

---

**GebeyaNet Backend API** - Empowering Ethiopian retailers with modern inventory management technology. 🇪🇹
<<<<<<< HEAD
=======
# GEBAYA
>>>>>>> 036d1e759f6bc7166ac258dd5616a3845945ed8e
=======
>>>>>>> bcc6d6ac8cd29f47f948c8a6e27541f904dd260d
