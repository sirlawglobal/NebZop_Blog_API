import { createPost, getPosts, getPostBySlug, updatePost, deletePost } from '../../src/controllers/posts';
import Post from '../../src/models/Post';
import slugify from 'slugify';
import { Request as ExpressRequest, Response } from 'express';

interface Request extends ExpressRequest {
  user?: {
    id: string;
  };
}

jest.mock('../../src/models/Post');
jest.mock('slugify');

const mockPost = Post as jest.Mocked<typeof Post>;
const mockSlugify = slugify as jest.MockedFunction<typeof slugify>;

describe('Posts Controller', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockRes = {
      status: statusMock,
      json: jsonMock,
    };
    jest.clearAllMocks();
  });

  describe('createPost', () => {
    it('should create a post successfully', async () => {
      mockReq = {
        body: { title: 'Test Post', content: 'Test content', status: 'published', tags: ['tag1'] },
        user: { id: 'userId' },
      };
      mockSlugify.mockReturnValue('test-post');
      const mockCreatedPost = {
        _id: 'postId',
        title: 'Test Post',
        slug: 'test-post',
        content: 'Test content',
        author: 'userId',
        status: 'published',
        tags: ['tag1'],
      };
      mockPost.create.mockResolvedValue(mockCreatedPost as any);

      await createPost(mockReq as any, mockRes as Response);

      expect(mockSlugify).toHaveBeenCalledWith('Test Post', { lower: true });
      expect(mockPost.create).toHaveBeenCalledWith({
        title: 'Test Post',
        slug: 'test-post',
        content: 'Test content',
        author: 'userId',
        status: 'published',
        tags: ['tag1'],
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(mockCreatedPost);
    });

    it('should return 400 if title or content is missing', async () => {
      mockReq = { body: { title: 'Test Post' }, user: { id: 'userId' } };

      await createPost(mockReq as any, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Missing fields' });
    });

    it('should return 500 on server error', async () => {
      mockReq = {
        body: { title: 'Test Post', content: 'Test content' },
        user: { id: 'userId' },
      };
      mockSlugify.mockReturnValue('test-post');
      mockPost.create.mockRejectedValue(new Error('DB error'));

      await createPost(mockReq as any, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });

  describe('getPosts', () => {
    it('should get posts for authenticated user', async () => {
      mockReq = {
        query: { page: '1', limit: '10' },
        user: { id: 'userId' },
      };
      const mockPosts = [{ title: 'Post 1' }];
      mockPost.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              sort: jest.fn().mockResolvedValue(mockPosts),
            }),
          }),
        }),
      } as any);

      await getPosts(mockReq as any, mockRes as Response);

      expect(mockPost.find).toHaveBeenCalledWith({ deletedAt: { $exists: false } });
      expect(mockRes.json).toHaveBeenCalledWith(mockPosts);
    });

    it('should get published posts for unauthenticated user', async () => {
      mockReq = { query: {} };
      const mockPosts = [{ title: 'Post 1' }];
      mockPost.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              sort: jest.fn().mockResolvedValue(mockPosts),
            }),
          }),
        }),
      } as any);

      await getPosts(mockReq as any, mockRes as Response);

      expect(mockPost.find).toHaveBeenCalledWith({ deletedAt: { $exists: false }, status: 'published' });
      expect(mockRes.json).toHaveBeenCalledWith(mockPosts);
    });

    it('should filter by search', async () => {
      mockReq = { query: { search: 'test' }, user: { id: 'userId' } };
      const mockPosts = [] as any[];
      mockPost.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              sort: jest.fn().mockResolvedValue(mockPosts),
            }),
          }),
        }),
      } as any);

      await getPosts(mockReq as any, mockRes as Response);

      expect(mockPost.find).toHaveBeenCalledWith({
        deletedAt: { $exists: false },
        $or: [
          { title: { $regex: 'test', $options: 'i' } },
          { content: { $regex: 'test', $options: 'i' } },
        ],
      });
    });

    it('should return 500 on server error', async () => {
      mockReq = { query: {}, user: { id: 'userId' } };
      mockPost.find.mockImplementation(() => {
        throw new Error('DB error');
      });

      await getPosts(mockReq as any, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });

  describe('getPostBySlug', () => {
    it('should get post by slug', async () => {
      mockReq = { params: { slug: 'test-post' } };
      const mockPostData = { title: 'Test Post' };
      mockPost.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockPostData),
      } as any);

      await getPostBySlug(mockReq as any, mockRes as Response);

      expect(mockPost.findOne).toHaveBeenCalledWith({
        slug: 'test-post',
        status: 'published',
        deletedAt: { $exists: false },
      });
      expect(mockRes.json).toHaveBeenCalledWith(mockPostData);
    });

    it('should return 404 if post not found', async () => {
      mockReq = { params: { slug: 'test-post' } };
      mockPost.findOne.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      } as any);

      await getPostBySlug(mockReq as any, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Post not found' });
    });

    it('should return 500 on server error', async () => {
      mockReq = { params: { slug: 'test-post' } };
      mockPost.findOne.mockImplementation(() => {
        throw new Error('DB error');
      });

      await getPostBySlug(mockReq as any, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });

  describe('updatePost', () => {
    it('should update post successfully', async () => {
      mockReq = {
        params: { id: 'postId' },
        body: { title: 'Updated Title' },
        user: { id: 'userId' },
      };
      const mockPostData = { author: 'userId' };
      mockPost.findById.mockResolvedValue(mockPostData as any);
      mockSlugify.mockReturnValue('updated-title');
      const updatedPost = { title: 'Updated Title', slug: 'updated-title' };
      mockPost.findByIdAndUpdate.mockResolvedValue(updatedPost as any);

      await updatePost(mockReq as any, mockRes as Response);

      expect(mockPost.findById).toHaveBeenCalledWith('postId');
      expect(mockSlugify).toHaveBeenCalledWith('Updated Title', { lower: true });
      expect(mockPost.findByIdAndUpdate).toHaveBeenCalledWith('postId', {
        title: 'Updated Title',
        slug: 'updated-title',
        updatedAt: expect.any(Date),
      }, { new: true });
      expect(mockRes.json).toHaveBeenCalledWith(updatedPost);
    });

    it('should return 403 if not authorized', async () => {
      mockReq = {
        params: { id: 'postId' },
        body: {},
        user: { id: 'userId' },
      };
      const mockPostData = { author: 'differentUserId' };
      mockPost.findById.mockResolvedValue(mockPostData as any);

      await updatePost(mockReq as any, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Not authorized' });
    });

    it('should return 500 on server error', async () => {
      mockReq = {
        params: { id: 'postId' },
        body: {},
        user: { id: 'userId' },
      };
      mockPost.findById.mockRejectedValue(new Error('DB error'));

      await updatePost(mockReq as any, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });

  describe('deletePost', () => {
    it('should delete post successfully', async () => {
      mockReq = {
        params: { id: 'postId' },
        user: { id: 'userId' },
      };
      const mockPostData = { author: 'userId' };
      mockPost.findById.mockResolvedValue(mockPostData as any);
      mockPost.findByIdAndUpdate.mockResolvedValue({} as any);

      await deletePost(mockReq as any, mockRes as Response);

      expect(mockPost.findById).toHaveBeenCalledWith('postId');
      expect(mockPost.findByIdAndUpdate).toHaveBeenCalledWith('postId', { deletedAt: expect.any(Date) });
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Post deleted' });
    });

    it('should return 403 if not authorized', async () => {
      mockReq = {
        params: { id: 'postId' },
        user: { id: 'userId' },
      };
      const mockPostData = { author: 'differentUserId' };
      mockPost.findById.mockResolvedValue(mockPostData as any);

      await deletePost(mockReq as any, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Not authorized' });
    });

    it('should return 500 on server error', async () => {
      mockReq = {
        params: { id: 'postId' },
        user: { id: 'userId' },
      };
      mockPost.findById.mockRejectedValue(new Error('DB error'));

      await deletePost(mockReq as any, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });
});
