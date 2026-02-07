import { Request as ExpressRequest, Response } from 'express';
import slugify from 'slugify';
import Post, { IPost } from '../models/Post';

interface Request extends ExpressRequest {
  user?: {
    id: string;
  };
}

export const createPost = async (req: Request, res: Response) => {
  const { title, content, status, tags } = req.body;
  if (!title || !content) return res.status(400).json({ message: 'Missing fields' });

  try {
    const slug = slugify(title, { lower: true });
    const post: IPost = await Post.create({
      title,
      slug,
      content,
      author: req.user!.id,
      status: status || 'draft',
      tags: tags || [],
    });
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPosts = async (req: Request, res: Response) => {
  const { page = 1, limit = 10, search, tag, author, status } = req.query;
  const query: any = { deletedAt: { $exists: false } }; // Soft delete filter

  if (!req.user) {
    query.status = 'published'; // Public only sees published
  } else if (status) {
    query.status = status as string;
    if (status === 'draft') query.author = req.user!.id; // Only own drafts
  }

  if (search) {
    query.$or = [{ title: { $regex: search, $options: 'i' } }, { content: { $regex: search, $options: 'i' } }];
  }
  if (tag) query.tags = { $in: [tag] };
  if (author) query.author = author;

  try {
    const posts = await Post.find(query)
      .populate('author', 'name') // Populate author name
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPostBySlug = async (req: Request, res: Response) => {
  try {
    const post = await Post.findOne({ slug: req.params.slug, status: 'published', deletedAt: { $exists: false } })
      .populate('author', 'name');
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const updatePost = async (req: Request, res: Response) => {
  try {
    const post: IPost | null = await Post.findById(req.params.id);
    if (!post || post.author.toString() !== req.user!.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    if (req.body.title) req.body.slug = slugify(req.body.title, { lower: true });
    const updatedPost = await Post.findByIdAndUpdate(req.params.id, { ...req.body, updatedAt: new Date() }, { new: true });
    res.json(updatedPost);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

export const deletePost = async (req: Request, res: Response) => {
  try {
    const post: IPost | null = await Post.findById(req.params.id);
    if (!post || post.author.toString() !== req.user!.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await Post.findByIdAndUpdate(req.params.id, { deletedAt: new Date() });
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};