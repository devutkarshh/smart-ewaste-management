# UI Consistency Guide

This document outlines the consistent UI patterns implemented across the e-waste management system.

## Layout Components

### 1. PageLayout
Used for standard application pages with navigation.
```tsx
<PageLayout 
  title="Page Title" 
  description="Brief description of the page"
  maxWidth="full" // or "sm", "md", "lg", "xl", "2xl"
>
  {/* Page content */}
</PageLayout>
```

### 2. SpecialLayout
Used for authentication pages with background images.
```tsx
<SpecialLayout 
  backgroundImage="/ewaste-bg.jpg"
  showHomeButton={true}
  showThemeToggle={true}
>
  {/* Content with special background */}
</SpecialLayout>
```

### 3. PageCard
Consistent card wrapper for content sections.
```tsx
<PageCard 
  title="Section Title"
  description="Section description"
  className="custom-styles"
  footer={<div>Footer content</div>}
>
  {/* Card content */}
</PageCard>
```

## Form Components

### 1. FormLayout
Structured form layout with optional columns.
```tsx
<FormLayout 
  title="Form Title"
  description="Form description"
  columns={2} // 1 or 2 columns
  footer={<Button>Submit</Button>}
>
  {/* Form sections */}
</FormLayout>
```

### 2. FormField
Individual form field wrapper.
```tsx
<FormField 
  label="Field Label"
  description="Optional description"
  error="Error message if any"
  required={true}
>
  <Input />
</FormField>
```

### 3. FormSection
Group related form fields.
```tsx
<FormSection 
  title="Section Title"
  description="Section description"
>
  {/* Form fields */}
</FormSection>
```

## State Components

### 1. LoadingState
Consistent loading indicators.
```tsx
<LoadingState type="page" /> // Full page loading
<LoadingState type="card" /> // Card skeleton
<LoadingState type="inline" /> // Inline spinner
```

### 2. ErrorState
Consistent error handling.
```tsx
<ErrorState 
  type="alert" // or "page", "card", "inline"
  title="Error Title"
  message="Error description"
  onRetry={() => retryFunction()}
/>
```

## Styling Utilities

### CSS Classes
Consistent utility classes available globally:

#### Spacing
- `.page-spacing` - Standard page padding
- `.card-spacing` - Standard card padding
- `.form-spacing` - Form element spacing
- `.section-spacing` - Section spacing

#### Typography
- `.text-heading` - Main headings (2xl-3xl)
- `.text-subheading` - Sub headings (lg-xl)
- `.text-body` - Body text with muted color

#### Components
- `.card-base` - Base card styling
- `.card-hover` - Card hover effects
- `.button-primary` - Primary button styles
- `.button-secondary` - Secondary button styles

#### Status Indicators
- `.status-badge` - Base badge styling
- `.status-success` - Success state
- `.status-warning` - Warning state
- `.status-error` - Error state
- `.status-info` - Info state

#### Layout
- `.form-field` - Form field spacing
- `.form-grid` - Responsive form grid

## Color Scheme

The application uses CSS custom properties for consistent theming:

### Light Theme
- Background: `oklch(1 0 0)` (Pure white)
- Foreground: `oklch(0.145 0 0)` (Dark gray)
- Primary: `oklch(0.205 0 0)` (Dark)
- Secondary: `oklch(0.97 0 0)` (Light gray)
- Muted: `oklch(0.97 0 0)` (Light gray)
- Border: `oklch(0.922 0 0)` (Medium gray)

### Dark Theme
- Background: `oklch(0.145 0 0)` (Dark)
- Foreground: `oklch(0.985 0 0)` (Light)
- Primary: `oklch(0.985 0 0)` (Light)
- Secondary: `oklch(0.269 0 0)` (Medium dark)
- Muted: `oklch(0.269 0 0)` (Medium dark)
- Border: `oklch(0.269 0 0)` (Medium dark)

## Navigation

### AppNav Component
Consistent navigation bar used across all standard pages:
- Fixed height (h-14)
- Responsive design
- Theme toggle
- Login/logout functionality
- Role-based access control

## Responsive Design

### Breakpoints
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

### Grid Systems
- Form grids: `grid-cols-1 md:grid-cols-2`
- Tab grids: `grid-cols-2 md:grid-cols-6`
- Card grids: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`

## Animation & Transitions

### Standard Transitions
- Duration: `duration-200`
- Hover effects: `hover:shadow-md`
- Scale effects: `hover:scale-105`
- Color transitions: `transition-colors`

### Loading Animations
- Spinner: `animate-spin`
- Pulse: `animate-pulse`
- Bounce: `animate-bounce`

## Typography Scale

### Font Sizes
- Headings: `text-2xl md:text-3xl`
- Subheadings: `text-lg md:text-xl`
- Body: `text-sm md:text-base`
- Small: `text-xs sm:text-sm`

### Font Weights
- Bold: `font-bold` (headings)
- Semibold: `font-semibold` (subheadings)
- Medium: `font-medium` (labels)
- Normal: `font-normal` (body text)

## Best Practices

1. **Always use PageLayout** for standard pages
2. **Use PageCard** for content sections
3. **Implement proper loading states** with LoadingState component
4. **Handle errors consistently** with ErrorState component
5. **Use FormLayout and FormField** for all forms
6. **Apply responsive design** with mobile-first approach
7. **Maintain consistent spacing** using utility classes
8. **Follow the color scheme** using CSS custom properties
9. **Use semantic HTML** elements
10. **Ensure accessibility** with proper ARIA labels and keyboard navigation
