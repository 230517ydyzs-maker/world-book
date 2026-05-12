import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the create story entry by default', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: '创建一本新的小说' })).toBeInTheDocument();
    expect(screen.getByLabelText('故事标题')).toBeInTheDocument();
  });
});
