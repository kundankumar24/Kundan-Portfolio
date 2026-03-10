# Modern Portfolio Website

A modern, high-performance portfolio website built with a cutting-edge frontend stack. This project demonstrates technical excellence through progressive web app functionality, accessibility compliance, and performance optimization.

## Features

- **Modern Tech Stack**: Vite-powered frontend with ES6+ modules
- **Progressive Web App**: Offline support, installable, fast loading
- **Accessibility**: WCAG 2.1 AA compliant
- **Performance**: Optimized Core Web Vitals, code splitting, lazy loading
- **Advanced Interactions**: Smooth animations, theme switching, responsive design
- **Comprehensive Testing**: Unit tests and property-based tests

## Project Structure

```
.
├── src/                    # Frontend source code
│   ├── js/                 # JavaScript modules
│   │   ├── components/    # Reusable UI components
│   │   ├── modules/       # Core functionality modules
│   │   ├── pages/         # Page-specific logic
│   │   ├── config/        # Configuration and data
│   │   └── utils/         # Utility functions
│   ├── css/                # Stylesheets
│   └── test/               # Test files
├── public/                 # Static assets
├── scripts/                # Build and validation scripts
└── dist/                   # Production build output
```

## Prerequisites

- **Node.js**: v18 or higher
- **npm**: v9 or higher

## Installation

### Frontend Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Development

### Frontend Development

```bash
# Start dev server with hot reload
npm run dev

# Run tests in watch mode
npm test

# Run tests with UI
npm run test:ui

# Check code quality
npm run lint
npm run format:check

# Fix linting issues
npm run lint:fix
npm run format
```

## Testing

### Frontend Testing

- **Unit Tests**: Vitest with JSDOM environment
- **Property-Based Tests**: Fast-check for universal properties
- **Coverage**: Run `npm run test:coverage`

## Build and Deployment

### Production Build

```bash
# Frontend build
npm run build
```

### Build Validation

```bash
# Validate build output
npm run validate:build

# Validate code quality
npm run validate:quality
```

### Deployment

The project includes automated CI/CD workflows:

```bash
# Run full CI pipeline
npm run ci
```

## Configuration

### Frontend Configuration

- **Vite**: `vite.config.js` - Build and dev server settings
- **Vitest**: `vitest.config.js` - Test configuration
- **ESLint**: `eslint.config.js` - Code quality rules
- **Prettier**: `.prettierrc` - Code formatting

## Performance Targets

- **Lighthouse Score**: 95+ across all categories
- **Core Web Vitals**:
  - LCP (Largest Contentful Paint): < 2.5s
  - FID (First Input Delay): < 100ms
  - CLS (Cumulative Layout Shift): < 0.1
- **Bundle Size**: < 200KB gzipped
- **Test Coverage**: > 80%

## Browser Support

- Chrome/Edge: Last 2 versions
- Firefox: Last 2 versions
- Safari: Last 2 versions
- Mobile browsers: iOS Safari 12+, Chrome Android

## Accessibility

- WCAG 2.1 Level AA compliant
- Keyboard navigation support
- Screen reader compatible
- Reduced motion support
- High contrast mode support

## Contributing

1. Follow the existing code style
2. Write tests for new features
3. Ensure all tests pass
4. Run linting and formatting
5. Update documentation as needed

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please open an issue on the project repository.
