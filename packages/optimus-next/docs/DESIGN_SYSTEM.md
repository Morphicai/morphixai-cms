# Optimus Design System - Modern Design Style

## Color System

### Primary Colors (Blue)

```css
primary-50:  #eff6ff  /* Very light blue */
primary-100: #dbeafe  /* Light blue */
primary-200: #bfdbfe
primary-300: #93c5fd
primary-400: #60a5fa
primary-500: #3b82f6  /* Main blue ⭐ */
primary-600: #2563eb  /* Dark blue */
primary-700: #1d4ed8
primary-800: #1e40af
primary-900: #1e3a8a  /* Very dark blue */
```

**Usage**:
- Primary buttons
- Links
- Brand identity
- Important information prompts

### Secondary Colors (Purple)

```css
secondary-50:  #faf5ff  /* Very light purple */
secondary-100: #f3e8ff
secondary-200: #e9d5ff
secondary-300: #d8b4fe
secondary-400: #c084fc
secondary-500: #a855f7  /* Main purple ⭐ */
secondary-600: #9333ea
secondary-700: #7e22ce
secondary-800: #6b21a8
secondary-900: #581c87  /* Very dark purple */
```

**Usage**:
- Secondary buttons
- Special emphasis
- Decorative elements
- Gradient combinations

### Accent Colors (Cyan)

```css
accent-50:  #ecfeff  /* Very light cyan */
accent-100: #cffafe
accent-200: #a5f3fc
accent-300: #67e8f9
accent-400: #22d3ee
accent-500: #06b6d4  /* Main cyan ⭐ */
accent-600: #0891b2
accent-700: #0e7490
accent-800: #155e75
accent-900: #164e63  /* Very dark cyan */
```

**Usage**:
- Accent elements
- Icon highlights
- Special states

## Gradient Colors

### Primary Gradient

```css
/* Blue-purple gradient - for titles, important buttons */
background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
```

**Effect**: Diagonal gradient from blue to purple  
**Class**: `bg-gradient-to-r from-blue-600 to-purple-600`

### Light Gradient

```css
/* Light blue-purple gradient - for backgrounds, cards */
background: linear-gradient(135deg, #dbeafe 0%, #e9d5ff 100%);
```

**Effect**: Soft background gradient  
**Class**: `bg-gradient-to-br from-blue-50 to-purple-50`

## Spacing System

### Container Spacing

```
py-20  /* 80px  - Section spacing */
py-24  /* 96px  - Standard section spacing */
py-32  /* 128px - Large section spacing */
py-40  /* 160px - Hero area */
```

### Element Spacing

```
gap-4  /* 16px - Small spacing */
gap-6  /* 24px - Standard spacing */
gap-8  /* 32px - Card spacing */
gap-12 /* 48px - Large spacing */
```

## Typography

### Heading Sizes

```css
text-5xl  /* 48px - H2 heading */
text-6xl  /* 60px - H1 heading (mobile) */
text-7xl  /* 72px - H1 heading (desktop) */
```

### Body Sizes

```css
text-base /* 16px - Body text */
text-lg   /* 18px - Large body text */
text-xl   /* 20px - Subtitle */
```

### Font Weights

```css
font-medium   /* 500 - Navigation, buttons */
font-semibold /* 600 - Card titles */
font-bold     /* 700 - Main headings */
```

## Effects

### Glass Effect

```css
.glass-effect {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}
```

**Usage**: Badges, overlays, cards

### Gradient Text

```css
.gradient-text {
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

**Usage**: Main headings, emphasized text

## Responsive Breakpoints

```css
sm:  640px  /* Small screen */
md:  768px  /* Medium screen */
lg:  1024px /* Large screen */
xl:  1280px /* Extra large screen */
2xl: 1536px /* 2X large screen */
```

## Dark Mode

### Background Colors

```css
/* Light */
bg-white
bg-gray-50

/* Dark */
dark:bg-slate-900
dark:bg-slate-800
```

### Text Colors

```css
/* Light */
text-slate-900
text-slate-600

/* Dark */
dark:text-white
dark:text-slate-300
```

---

*Last updated: 2025-12-21*
