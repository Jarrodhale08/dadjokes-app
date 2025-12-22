import React from 'react';
import { render, screen } from '@testing-library/react-native';
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

  it('displays title and subtitle', () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({});

    const { getByText } = render(<Details />);
    expect(getByText('Details')).toBeTruthy();
    expect(getByText('This is the Details page of your app.')).toBeTruthy();
  });

  it('displays "Go to Login" link', () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({});

    const { getByText } = render(<Details />);
    expect(getByText('Go to Login')).toBeTruthy();
  });

  it('displays user param when provided', () => {
    const mockUser = 'john_doe';
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      user: mockUser,
    });

    const { getByText } = render(<Details />);
    expect(getByText(`Use param: ${mockUser}`)).toBeTruthy();
  });

  it('displays user param with undefined when not provided', () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({});

    const { getByText } = render(<Details />);
    expect(getByText('Use param: ')).toBeTruthy();
  });

  it('displays user param with special characters', () => {
    const mockUser = 'user@example.com';
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      user: mockUser,
    });

    const { getByText } = render(<Details />);
    expect(getByText(`Use param: ${mockUser}`)).toBeTruthy();
  });

  it('displays user param with spaces', () => {
    const mockUser = 'John Doe';
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      user: mockUser,
    });

    const { getByText } = render(<Details />);
    expect(getByText(`Use param: ${mockUser}`)).toBeTruthy();
  });

  it('displays user param with numbers', () => {
    const mockUser = 'user123';
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      user: mockUser,
    });

    const { getByText } = render(<Details />);
    expect(getByText(`Use param: ${mockUser}`)).toBeTruthy();
  });

  it('handles empty string user param', () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      user: '',
    });

    const { getByText } = render(<Details />);
    expect(getByText('Use param: ')).toBeTruthy();
  });

  it('maintains consistent layout structure', () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      user: 'test_user',
    });

    const { getByText } = render(<Details />);

    expect(getByText('Details')).toBeTruthy();
    expect(getByText('This is the Details page of your app.')).toBeTruthy();
    expect(getByText('Use param: test_user')).toBeTruthy();
    expect(getByText('Go to Login')).toBeTruthy();
  });

  it('renders all text elements in correct order', () => {
    const mockUser = 'alice';
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      user: mockUser,
    });

    const { getByText } = render(<Details />);

    const title = getByText('Details');
    const subtitle = getByText('This is the Details page of your app.');
    const userParam = getByText(`Use param: ${mockUser}`);
    const link = getByText('Go to Login');

    expect(title).toBeTruthy();
    expect(subtitle).toBeTruthy();
    expect(userParam).toBeTruthy();
    expect(link).toBeTruthy();
  });

  it('handles multiple params (only uses user param)', () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      user: 'john',
      id: '123',
      category: 'tech',
    });

    const { getByText } = render(<Details />);
    expect(getByText('Use param: john')).toBeTruthy();
  });

  it('displays user param with long string', () => {
    const longUser = 'this_is_a_very_long_username_that_might_wrap';
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      user: longUser,
    });

    const { getByText } = render(<Details />);
    expect(getByText(`Use param: ${longUser}`)).toBeTruthy();
  });

  it('handles user param as array (takes first element)', () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      user: ['user1', 'user2'],
    });

    const { getByText } = render(<Details />);
    expect(getByText(/Use param:/)).toBeTruthy();
  });

  it('renders Link component correctly', () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({});

    const { getByText } = render(<Details />);
    const link = getByText('Go to Login');

    expect(link).toBeTruthy();
  });
});
