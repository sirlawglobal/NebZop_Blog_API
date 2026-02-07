import User, { IUser } from '../../src/models/User';

describe('User Model', () => {
  it('should create a user successfully', async () => {
    const userData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'hashedPassword',
    };

    const user = new User(userData);
    expect(user.name).toBe(userData.name);
    expect(user.email).toBe(userData.email);
    expect(user.password).toBe(userData.password);
    expect(user.createdAt).toBeDefined();
  });

  it('should require name, email, and password', () => {
    const user = new User({});
    const err = user.validateSync();
    expect(err!.errors.name).toBeDefined();
    expect(err!.errors.email).toBeDefined();
    expect(err!.errors.password).toBeDefined();
  });

  it('should enforce unique email', () => {
    const schema = User.schema;
    expect(schema.path('email').options.unique).toBe(true);
  });
});
