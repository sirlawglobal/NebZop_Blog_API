import { register, login } from '../../src/controllers/auth';
import User from '../../src/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';

jest.mock('../../src/models/User');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

const mockUser = User as jest.Mocked<typeof User>;
const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;

describe('Auth Controller', () => {
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

  describe('register', () => {
    it('should register a new user successfully', async () => {
      mockReq = {
        body: { name: 'John Doe', email: 'john@example.com', password: 'password123' },
      };
      mockUser.findOne.mockResolvedValue(null);
      (mockBcrypt.hash as any).mockResolvedValue('hashedPassword');
      mockUser.create.mockResolvedValue({
        _id: 'userId',
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashedPassword',
      } as any);
      mockJwt.sign.mockReturnValue('token' as any);

      await register(mockReq as Request, mockRes as Response);

      expect(mockUser.findOne).toHaveBeenCalledWith({ email: 'john@example.com' });
      expect(mockBcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockUser.create).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'hashedPassword',
      });
      expect(mockJwt.sign).toHaveBeenCalledWith({ id: 'userId' }, process.env.JWT_SECRET, { expiresIn: '1h' });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({ token: 'token' });
    });

    it('should return 400 if user already exists', async () => {
      mockReq = {
        body: { name: 'John Doe', email: 'john@example.com', password: 'password123' },
      };
      mockUser.findOne.mockResolvedValue({} as any);

      await register(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'User already exists' });
    });

    it('should return 400 if fields are missing', async () => {
      mockReq = { body: { name: 'John Doe' } };

      await register(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Missing fields' });
    });

    it('should return 500 on server error', async () => {
      mockReq = {
        body: { name: 'John Doe', email: 'john@example.com', password: 'password123' },
      };
      mockUser.findOne.mockRejectedValue(new Error('DB error'));

      await register(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      mockReq = { body: { email: 'john@example.com', password: 'password123' } };
      const user = {
        _id: 'userId',
        email: 'john@example.com',
        password: 'hashedPassword',
      };
      mockUser.findOne.mockResolvedValue(user as any);
      (mockBcrypt.compare as any).mockResolvedValue(true);
      mockJwt.sign.mockReturnValue('token' as any);

      await login(mockReq as Request, mockRes as Response);

      expect(mockUser.findOne).toHaveBeenCalledWith({ email: 'john@example.com' });
      expect(mockBcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword');
      expect(mockJwt.sign).toHaveBeenCalledWith({ id: 'userId' }, process.env.JWT_SECRET, { expiresIn: '1h' });
      expect(mockRes.json).toHaveBeenCalledWith({ token: 'token' });
    });

    it('should return 400 for invalid credentials - user not found', async () => {
      mockReq = { body: { email: 'john@example.com', password: 'password123' } };
      mockUser.findOne.mockResolvedValue(null);

      await login(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
    });

    it('should return 400 for invalid credentials - wrong password', async () => {
      mockReq = { body: { email: 'john@example.com', password: 'wrongpassword' } };
      const user = {
        _id: 'userId',
        email: 'john@example.com',
        password: 'hashedPassword',
      };
      mockUser.findOne.mockResolvedValue(user as any);
      (mockBcrypt.compare as any).mockResolvedValue(false);

      await login(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
    });

    it('should return 400 if fields are missing', async () => {
      mockReq = { body: { email: 'john@example.com' } };

      await login(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Missing fields' });
    });

    it('should return 500 on server error', async () => {
      mockReq = { body: { email: 'john@example.com', password: 'password123' } };
      mockUser.findOne.mockRejectedValue(new Error('DB error'));

      await login(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Server error' });
    });
  });
});
