// Example: Use tsd to test types
import { User } from './index';

// This test will fail if 'User' type does not have 'id' and 'email'
const user: User = { id: '123', email: 'test@example.com' };
