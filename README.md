# NebZo Blog API

A robust REST API for a blog platform built with Node.js, TypeScript, Express, and MongoDB. This API provides authentication and post management features, allowing users to register, log in, and manage blog posts with features like drafts, publishing, tagging, and search.

## Features

- **User Authentication**: Secure registration and login with JWT tokens.
- **Post Management**: Create, read, update, and delete blog posts.
- **Post Status**: Support for draft and published posts.
- **Tagging**: Add tags to posts for better organization.
- **Search and Filtering**: Search posts by title/content, filter by tags, author, or status.
- **Slug-based URLs**: SEO-friendly URLs for published posts.
- **Soft Deletes**: Posts are soft-deleted to allow recovery.
- **Pagination**: Efficient pagination for listing posts.
- **Error Handling**: Comprehensive error handling with custom middleware.
- **Testing**: Unit and integration tests using Jest and Supertest.

## Tech Stack

- **Backend**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JSON Web Tokens (JWT)
- **Password Hashing**: bcryptjs
- **Testing**: Jest, Supertest
- **Development**: ts-node-dev for hot reloading

## Prerequisites

Before running this project, ensure you have the following installed:

- Node.js (version 14 or higher)
- npm or yarn
- MongoDB (local or cloud instance, e.g., MongoDB Atlas)

## Installation

1. **Clone the Repository**:
   ```bash
   git clone <repo-url>
   cd nebzo-blog-api
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   - Copy the example environment file:
     ```bash
     cp .env.example .env
     ```
   - Fill in the required environment variables (see Environment Variables section below).

## Environment Variables

Create a `.env` file in the root directory with the following variables:

- `MONGODB_URI`: MongoDB connection string (e.g., `mongodb://localhost:27017/blog-api` or your MongoDB Atlas URI)
- `JWT_SECRET`: A secret key for signing JWT tokens (use a strong, random string)
- `PORT`: Server port (default: 3000)

Example `.env` file:
```
MONGODB_URI=mongodb://localhost:27017/blog-api
JWT_SECRET=your-super-secret-jwt-key-here
PORT=3000
```

## Running the Application

### Development Mode
Run the server in development mode with hot reloading:
```bash
npm run dev
```
The server will start on `http://localhost:3000` (or the port specified in `.env`).

### Production Mode
Build and run the application in production:
```bash
npm run build
npm start
```

### Testing
Run the test suite:
```bash
npm test
```
For watch mode:
```bash
npm run test:watch
```
For coverage report:
```bash
npm run test:coverage
```

## API Endpoints

The API is organized into two main routes: `/api/auth` for authentication and `/api/posts` for post management.

### Authentication Endpoints

#### Register User
- **URL**: `POST /api/auth/register`
- **Description**: Register a new user account.
- **Request Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword123"
  }
  ```
- **Response (Success - 201)**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **Response (Error - 400)**:
  ```json
  {
    "message": "User already exists"
  }
  ```

#### Login User
- **URL**: `POST /api/auth/login`
- **Description**: Authenticate and get a JWT token.
- **Request Body**:
  ```json
  {
    "email": "john@example.com",
    "password": "securepassword123"
  }
  ```
- **Response (Success - 200)**:
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
  ```
- **Response (Error - 400)**:
  ```json
  {
    "message": "Invalid credentials"
  }
  ```

#### Logout User
- **URL**: `POST /api/auth/logout`
- **Description**: Logout the user by discarding the JWT token (handled client-side).
- **Headers**:
  ```
  Authorization: Bearer <your-jwt-token>
  ```
- **Response (Success - 200)**:
  ```json
  {
    "message": "Logged out successfully"
  }
  ```

### Post Endpoints

#### Get Posts
- **URL**: `GET /api/posts`
- **Description**: Retrieve a list of posts with optional filtering and pagination.
- **Query Parameters**:
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Number of posts per page (default: 10)
  - `search` (optional): Search term for title or content
  - `tag` (optional): Filter by tag
  - `author` (optional): Filter by author ID
  - `status` (optional): Filter by status (requires auth for non-published)
- **Headers**: None required (public endpoint)
- **Response (Success - 200)**:
  ```json
  [
    {
      "_id": "60d5ecb74bbb4c001f8b4567",
      "title": "My First Post",
      "slug": "my-first-post",
      "content": "This is the content of my post.",
      "author": {
        "_id": "60d5ecb74bbb4c001f8b4568",
        "name": "John Doe"
      },
      "status": "published",
      "tags": ["introduction", "blog"],
      "createdAt": "2023-06-25T10:00:00.000Z",
      "updatedAt": "2023-06-25T10:00:00.000Z"
    }
  ]
  ```

#### Get Post by Slug
- **URL**: `GET /api/posts/:slug`
- **Description**: Retrieve a single published post by its slug.
- **Parameters**: `slug` (string) - The post's slug
- **Headers**: None required
- **Response (Success - 200)**: Same as above for a single post
- **Response (Error - 404)**:
  ```json
  {
    "message": "Post not found"
  }
  ```

#### Create Post
- **URL**: `POST /api/posts`
- **Description**: Create a new blog post (requires authentication).
- **Headers**:
  ```
  Authorization: Bearer <your-jwt-token>
  Content-Type: application/json
  ```
- **Request Body**:
  ```json
  {
    "title": "New Post Title",
    "content": "The full content of the post.",
    "status": "draft", // or "published"
    "tags": ["tag1", "tag2"]
  }
  ```
- **Response (Success - 201)**: The created post object
- **Response (Error - 400)**:
  ```json
  {
    "message": "Missing fields"
  }
  ```

#### Update Post
- **URL**: `PUT /api/posts/:id`
- **Description**: Update an existing post (requires authentication and ownership).
- **Parameters**: `id` (string) - The post's ID
- **Headers**: Same as create
- **Request Body**: Partial post data (same fields as create)
- **Response (Success - 200)**: The updated post object
- **Response (Error - 403)**:
  ```json
  {
    "message": "Not authorized"
  }
  ```

#### Delete Post
- **URL**: `DELETE /api/posts/:id`
- **Description**: Soft delete a post (requires authentication and ownership).
- **Parameters**: `id` (string) - The post's ID
- **Headers**: Same as create
- **Response (Success - 200)**:
  ```json
  {
    "message": "Post deleted"
  }
  ```
- **Response (Error - 403)**: Same as update

## Manual Testing with Postman

To test the API manually using Postman:

1. **Set Base URL**: Set your base URL to `http://localhost:3000/api`

2. **Register a User**:
   - Method: POST
   - URL: `/auth/register`
   - Body (raw JSON):
     ```json
     {
       "name": "Test User",
       "email": "test@example.com",
       "password": "password123"
     }
     ```
   - Expected Response: 201 with token

3. **Login**:
   - Method: POST
   - URL: `/auth/login`
   - Body:
     ```json
     {
       "email": "test@example.com",
       "password": "password123"
     }
     ```
   - Expected Response: 200 with token. Copy the token for authenticated requests.

4. **Create a Post**:
   - Method: POST
   - URL: `/posts`
   - Headers: `Authorization: Bearer <token>`
   - Body:
     ```json
     {
       "title": "My Test Post",
       "content": "This is a test post content.",
       "status": "published",
       "tags": ["test", "api"]
     }
     ```
   - Expected Response: 201 with post object

5. **Get Posts**:
   - Method: GET
   - URL: `/posts`
   - No auth required for published posts
   - Expected Response: 200 with array of posts

6. **Update Post**:
   - Method: PUT
   - URL: `/posts/<post-id>`
   - Headers: `Authorization: Bearer <token>`
   - Body:
     ```json
     {
       "status": "published"
     }
     ```
   - Expected Response: 200 with updated post

7. **Delete Post**:
   - Method: DELETE
   - URL: `/posts/<post-id>`
   - Headers: `Authorization: Bearer <token>`
   - Expected Response: 200 with success message

## Project Structure

```
nebzo-blog-api/
├── src/
│   ├── config/
│   │   └── db.ts          # Database connection
│   ├── controllers/
│   │   ├── auth.ts        # Authentication logic
│   │   └── posts.ts       # Post management logic
│   ├── middleware/
│   │   ├── auth.ts        # JWT authentication middleware
│   │   └── error.ts       # Error handling middleware
│   ├── models/
│   │   ├── User.ts        # User model
│   │   └── Post.ts        # Post model
│   ├── routes/
│   │   ├── auth.ts        # Auth routes
│   │   └── posts.ts       # Post routes
│   ├── types/
│   │   └── express.d.ts   # TypeScript declarations
│   └── server.ts          # Main server file
├── tests/
│   ├── controllers/
│   ├── integration/
│   ├── models/
│   └── setup.ts           # Test setup
├── .env                   # Environment variables
├── .env.example           # Example env file
├── jest.config.js         # Jest configuration
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
└── README.md              # This file
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Submit a pull request

## License

This project is licensed under the ISC License.
