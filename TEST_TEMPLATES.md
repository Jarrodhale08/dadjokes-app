# Jest Test Templates for React Native Expo Apps

This document provides comprehensive test templates for React Native screens built with Expo, TypeScript, and NativeWind.

## Prerequisites

Ensure your `package.json` includes:

```json
{
  "devDependencies": {
    "@testing-library/jest-native": "^5.4.3",
    "@testing-library/react-native": "^12.4.3",
    "@types/jest": "^29.5.12",
    "jest": "^29.7.0",
    "jest-expo": "^54.0.0"
  }
}
```

## Test File Structure

Tests should be placed in `__tests__` directories next to the files they test:

```
app/(tabs)/
├── home.tsx
├── counter.tsx
├── details.tsx
└── __tests__/
    ├── home.test.tsx
    ├── counter.test.tsx
    └── details.test.tsx
```

## Template 1: Screen with API Data (Home Screen)

This template demonstrates testing a screen that:
- Fetches data from an API/hook
- Displays loading states
- Shows data when available
- Handles empty states

```typescript
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import HomeScreen from '../home';

// Mock API hooks or services
jest.mock('@hooks/usePokemon', () => ({
  usePokemonList: jest.fn(),
}));

import { usePokemonList } from '@hooks/usePokemon';

describe('Home Screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    (usePokemonList as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });

    const { getByText } = render(<HomeScreen />);
    expect(getByText('Home')).toBeTruthy();
  });

  it('displays "No data" when list is empty', () => {
    (usePokemonList as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    });

    const { getByText } = render(<HomeScreen />);
    expect(getByText('No data')).toBeTruthy();
  });

  it('displays data when available', async () => {
    const mockData = {
      results: [
        { name: 'item1', url: 'https://example.com/1' },
        { name: 'item2', url: 'https://example.com/2' },
      ],
    };

    (usePokemonList as jest.Mock).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
    });

    const { getByText } = render(<HomeScreen />);

    await waitFor(() => {
      expect(getByText('item1')).toBeTruthy();
      expect(getByText('item2')).toBeTruthy();
    });
  });

  it('handles loading state', () => {
    (usePokemonList as jest.Mock).mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    const { getByText } = render(<HomeScreen />);
    expect(getByText('No data')).toBeTruthy();
  });

  it('handles error state', () => {
    (usePokemonList as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to fetch'),
    });

    const { getByText } = render(<HomeScreen />);
    expect(getByText('No data')).toBeTruthy();
  });
});
```

## Template 2: Screen with State Management (Counter Screen)

This template demonstrates testing a screen that:
- Uses Zustand store for state
- Has interactive buttons
- Updates UI based on state changes

```typescript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import Counter from '../counter';

// Mock Zustand store
jest.mock('@stores/useAppStore', () => ({
  useAppStore: jest.fn(),
}));

// Mock custom components
jest.mock('@components/Button', () => ({
  Button: ({ title, onPress }: { title: string; onPress: () => void }) => {
    const { Pressable, Text } = require('react-native');
    return (
      <Pressable onPress={onPress} testID={`button-${title}`}>
        <Text>{title}</Text>
      </Pressable>
    );
  },
}));

import { useAppStore } from '@stores/useAppStore';

describe('Counter Screen', () => {
  let mockIncrement: jest.Mock;
  let mockDecrement: jest.Mock;

  beforeEach(() => {
    mockIncrement = jest.fn();
    mockDecrement = jest.fn();
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    (useAppStore as unknown as jest.Mock).mockImplementation((selector: any) => {
      const store = {
        increment: mockIncrement,
        decrement: mockDecrement,
        count: 0,
      };
      return selector(store);
    });

    const { getByText } = render(<Counter />);
    expect(getByText('Counter')).toBeTruthy();
  });

  it('displays initial count', () => {
    (useAppStore as unknown as jest.Mock).mockImplementation((selector: any) => {
      const store = {
        increment: mockIncrement,
        decrement: mockDecrement,
        count: 0,
      };
      return selector(store);
    });

    const { getByText } = render(<Counter />);
    expect(getByText('0')).toBeTruthy();
  });

  it('calls increment when + button is pressed', () => {
    (useAppStore as unknown as jest.Mock).mockImplementation((selector: any) => {
      const store = {
        increment: mockIncrement,
        decrement: mockDecrement,
        count: 0,
      };
      return selector(store);
    });

    const { getByTestId } = render(<Counter />);
    fireEvent.press(getByTestId('button-+'));

    expect(mockIncrement).toHaveBeenCalledTimes(1);
  });

  it('calls decrement when - button is pressed', () => {
    (useAppStore as unknown as jest.Mock).mockImplementation((selector: any) => {
      const store = {
        increment: mockIncrement,
        decrement: mockDecrement,
        count: 5,
      };
      return selector(store);
    });

    const { getByTestId } = render(<Counter />);
    fireEvent.press(getByTestId('button--'));

    expect(mockDecrement).toHaveBeenCalledTimes(1);
  });

  it('handles multiple button presses', () => {
    (useAppStore as unknown as jest.Mock).mockImplementation((selector: any) => {
      const store = {
        increment: mockIncrement,
        decrement: mockDecrement,
        count: 0,
      };
      return selector(store);
    });

    const { getByTestId } = render(<Counter />);
    const incrementButton = getByTestId('button-+');

    fireEvent.press(incrementButton);
    fireEvent.press(incrementButton);
    fireEvent.press(incrementButton);

    expect(mockIncrement).toHaveBeenCalledTimes(3);
  });
});
```

## Template 3: Screen with Navigation Params (Details Screen)

This template demonstrates testing a screen that:
- Receives route parameters
- Uses expo-router navigation
- Displays dynamic content based on params

```typescript
import React from 'react';
import { render } from '@testing-library/react-native';
import Details from '../details';
import { useLocalSearchParams } from 'expo-router';

// expo-router is already mocked in jest.setup.js
jest.mock('expo-router');

describe('Details Screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({});

    const { getByText } = render(<Details />);
    expect(getByText('Details')).toBeTruthy();
  });

  it('displays user param when provided', () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      user: 'john_doe',
    });

    const { getByText } = render(<Details />);
    expect(getByText('Use param: john_doe')).toBeTruthy();
  });

  it('handles missing params', () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({});

    const { getByText } = render(<Details />);
    expect(getByText('Use param: ')).toBeTruthy();
  });

  it('handles multiple params', () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      user: 'alice',
      id: '123',
    });

    const { getByText } = render(<Details />);
    expect(getByText('Use param: alice')).toBeTruthy();
  });
});
```

## Template 4: Screen with Form Inputs

For screens with forms and user input:

```typescript
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../login';

describe('Login Screen', () => {
  it('updates email input value', () => {
    const { getByTestId } = render(<LoginScreen />);
    const emailInput = getByTestId('email-input');

    fireEvent.changeText(emailInput, 'test@example.com');

    expect(emailInput.props.value).toBe('test@example.com');
  });

  it('updates password input value', () => {
    const { getByTestId } = render(<LoginScreen />);
    const passwordInput = getByTestId('password-input');

    fireEvent.changeText(passwordInput, 'password123');

    expect(passwordInput.props.value).toBe('password123');
  });

  it('calls onSubmit when form is submitted', () => {
    const mockSubmit = jest.fn();
    const { getByTestId } = render(<LoginScreen onSubmit={mockSubmit} />);

    fireEvent.changeText(getByTestId('email-input'), 'test@example.com');
    fireEvent.changeText(getByTestId('password-input'), 'password123');
    fireEvent.press(getByTestId('submit-button'));

    expect(mockSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('displays validation errors', async () => {
    const { getByTestId, getByText } = render(<LoginScreen />);

    fireEvent.press(getByTestId('submit-button'));

    await waitFor(() => {
      expect(getByText('Email is required')).toBeTruthy();
      expect(getByText('Password is required')).toBeTruthy();
    });
  });
});
```

## Template 5: Screen with Loading/Error/Empty States

For comprehensive state management testing:

```typescript
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import ProductList from '../product-list';

jest.mock('@api/products', () => ({
  useProducts: jest.fn(),
}));

import { useProducts } from '@api/products';

describe('Product List Screen', () => {
  it('displays loading state', () => {
    (useProducts as jest.Mock).mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    const { getByTestId } = render(<ProductList />);
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('displays error state with retry button', () => {
    const mockRefetch = jest.fn();
    (useProducts as jest.Mock).mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Network error'),
      refetch: mockRefetch,
    });

    const { getByText, getByTestId } = render(<ProductList />);

    expect(getByText(/error/i)).toBeTruthy();
    expect(getByTestId('retry-button')).toBeTruthy();
  });

  it('displays empty state when no products', () => {
    (useProducts as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    const { getByText } = render(<ProductList />);
    expect(getByText(/no products/i)).toBeTruthy();
  });

  it('displays product list when data available', async () => {
    const mockProducts = [
      { id: 1, name: 'Product 1', price: 9.99 },
      { id: 2, name: 'Product 2', price: 19.99 },
    ];

    (useProducts as jest.Mock).mockReturnValue({
      data: mockProducts,
      isLoading: false,
      error: null,
    });

    const { getByText } = render(<ProductList />);

    await waitFor(() => {
      expect(getByText('Product 1')).toBeTruthy();
      expect(getByText('Product 2')).toBeTruthy();
    });
  });
});
```

## Common Mock Patterns

### Mock expo-router (in jest.setup.js)

```javascript
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
  Link: 'Link',
}));
```

### Mock expo-secure-store (in jest.setup.js)

```javascript
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));
```

### Mock Zustand Store

```typescript
jest.mock('@stores/useAppStore', () => ({
  useAppStore: jest.fn((selector) => {
    const mockStore = {
      user: { name: 'Test User' },
      isLoggedIn: true,
      login: jest.fn(),
      logout: jest.fn(),
    };
    return selector(mockStore);
  }),
}));
```

### Mock Axios/API Services

```typescript
jest.mock('@api/services', () => ({
  fetchUser: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
}));

import * as api from '@api/services';

beforeEach(() => {
  (api.fetchUser as jest.Mock).mockResolvedValue({
    id: 1,
    name: 'John Doe',
  });
});
```

### Mock React Query

```typescript
jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
  QueryClient: jest.fn(),
  QueryClientProvider: ({ children }: any) => children,
}));

import { useQuery } from '@tanstack/react-query';

(useQuery as jest.Mock).mockReturnValue({
  data: mockData,
  isLoading: false,
  error: null,
  refetch: jest.fn(),
});
```

## Best Practices

1. **Use testID for reliable element selection**:
   ```typescript
   <View testID="container">
   ```

2. **Clear mocks between tests**:
   ```typescript
   beforeEach(() => {
     jest.clearAllMocks();
   });
   ```

3. **Test user interactions, not implementation**:
   ```typescript
   // Good
   fireEvent.press(getByText('Submit'));

   // Avoid
   expect(component.state.value).toBe(5);
   ```

4. **Use waitFor for async operations**:
   ```typescript
   await waitFor(() => {
     expect(getByText('Success')).toBeTruthy();
   });
   ```

5. **Test accessibility**:
   ```typescript
   expect(getByLabelText('Email input')).toBeTruthy();
   expect(getByRole('button')).toBeTruthy();
   ```

6. **Descriptive test names**:
   ```typescript
   it('displays error message when email is invalid', () => {
     // test
   });
   ```

7. **One assertion per concept**:
   ```typescript
   // Good
   it('displays user name', () => {
     expect(getByText('John Doe')).toBeTruthy();
   });

   it('displays user email', () => {
     expect(getByText('john@example.com')).toBeTruthy();
   });
   ```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- home.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="displays user"
```

## Coverage Requirements

Aim for:
- **Statements**: 80%+
- **Branches**: 75%+
- **Functions**: 80%+
- **Lines**: 80%+

## Common Test Scenarios

### 1. Render Tests
- Component renders without crashing
- All UI elements are present
- Correct initial state

### 2. Interaction Tests
- Button presses trigger correct actions
- Input changes update state
- Form submissions work correctly

### 3. State Tests
- Loading states display correctly
- Error states show error messages
- Empty states show appropriate content
- Success states display data

### 4. Navigation Tests
- Links navigate to correct routes
- Back button works
- Navigation params are passed

### 5. API Tests
- API calls are made with correct params
- Loading indicators shown during fetch
- Data displayed after successful fetch
- Errors handled appropriately

### 6. Accessibility Tests
- Elements have accessibility labels
- Screen reader compatible
- Keyboard navigation works
- Color contrast meets WCAG standards

---

**Note**: These templates are designed to be copied and adapted for your specific screens. Replace component names, props, and test assertions to match your implementation.
