import express from 'express';
import { createPost, getPosts, getPostBySlug, updatePost, deletePost } from '../controllers/posts';
import { protect } from '../middleware/auth';
import { optionalAuth } from '../middleware/optionalAuth';

const router = express.Router();

// Public routes
router.get('/', optionalAuth, getPosts);
router.get('/:slug', getPostBySlug);

// Protected routes
router.post('/', protect, createPost);
router.put('/:id', protect, updatePost);
router.delete('/:id', protect, deletePost);

export default router;
