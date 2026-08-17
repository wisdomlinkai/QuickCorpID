# 🎨 Design System - Bolt.new Modern Minimalist Style

## Core Design Principles

1. **Clean & Minimal** - Lots of white space, uncluttered
2. **Modern Gradients** - Blue (#2563eb) → Teal (#14b8a6)
3. **Soft Shadows** - Subtle depth and elevation
4. **Rounded Corners** - Friendly, modern feel (rounded-2xl)
5. **Smooth Transitions** - 300ms hover effects

---

## Color Palette

**Primary:**
- Blue 600: `#2563eb`
- Blue 700: `#1d4ed8`
- Teal 500: `#14b8a6`
- Teal 600: `#0d9488`

**Neutrals:**
- Slate 50: `#f8fafc` (backgrounds)
- Slate 100: `#f1f5f9` (borders)
- Slate 200: `#e2e8f0` (borders)
- Slate 500: `#64748b` (secondary text)
- Slate 600: `#475569` (text)
- Slate 700: `#334155` (text)
- Slate 900: `#0f172a` (headings)

**Status Colors:**
- Emerald: Success/Approved
- Amber: Warning/Pending
- Red: Error/Rejected
- Blue: Processing

---

## Component Styles

### 1. Cards

**Standard Card:**
```tsx
className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100"
```

**Hover Card:**
```tsx
className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-lg transition-all"
```

**Interactive Card:**
```tsx
className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:border-blue-300 hover:shadow-lg transition-all cursor-pointer"
```

---

### 2. Buttons

**Primary Button (Gradient):**
```tsx
className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
```

**Primary Button (Solid):**
```tsx
className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
```

**Secondary Button:**
```tsx
className="px-6 py-3 bg-white text-slate-700 font-semibold rounded-xl border-2 border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
```

**Small Button:**
```tsx
className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg text-sm hover:bg-blue-700 transition-colors"
```

---

### 3. Icons with Gradient Background

**Large Icon Container:**
```tsx
className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center"
```

**Medium Icon Container:**
```tsx
className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center"
```

**Icon Colors:**
```tsx
// White icons on gradient backgrounds
<Icon className="w-6 h-6 text-white" />

// Colored icons on light backgrounds
<Icon className="w-5 h-5 text-blue-600" />
<Icon className="w-5 h-5 text-teal-600" />
```

---

### 4. Inputs

**Standard Input:**
```tsx
className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
```

**Input with Icon:**
```tsx
<div className="relative">
  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
  <input className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
</div>
```

**Select/Dropdown:**
```tsx
className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white"
```

---

### 5. Typography

**Page Title:**
```tsx
className="text-3xl md:text-4xl font-bold text-slate-900"
```

**Section Title:**
```tsx
className="text-2xl font-bold text-slate-900"
```

**Card Title:**
```tsx
className="text-lg font-semibold text-slate-800"
```

**Body Text:**
```tsx
className="text-slate-600"
```

**Small Text:**
```tsx
className="text-sm text-slate-500"
```

**Label:**
```tsx
className="block text-sm font-medium text-slate-700 mb-1.5"
```

---

### 6. Badges & Status

**Status Badge:**
```tsx
// Approved/Success
className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700"

// Pending/Warning
className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700"

// Processing
className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700"

// Rejected/Error
className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700"

// Draft
className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600"
```

---

### 7. Dividers & Separators

**Horizontal Line:**
```tsx
className="border-t border-slate-200"
```

**With Text:**
```tsx
<div className="relative">
  <div className="absolute inset-0 flex items-center">
    <div className="w-full border-t border-slate-200" />
  </div>
  <div className="relative flex justify-center text-sm">
    <span className="px-2 bg-white text-slate-500">or</span>
  </div>
</div>
```

---

### 8. Loading States

**Spinner:**
```tsx
className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"
```

**Loading Screen:**
```tsx
<div className="min-h-screen flex items-center justify-center bg-slate-50">
  <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
</div>
```

---

### 9. Layout & Spacing

**Container:**
```tsx
className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
```

**Section Padding:**
```tsx
className="py-20"  // Large sections
className="py-12"  // Medium sections
className="py-8"   // Small sections
```

**Card Padding:**
```tsx
className="p-8"  // Large cards
className="p-6"  // Medium cards
className="p-5"  // Small cards
```

**Gap Between Items:**
```tsx
className="gap-8"  // Large gap
className="gap-6"  // Medium gap
className="gap-4"  // Small gap
```

---

### 10. Effects & Animations

**Hover Scale:**
```tsx
className="hover:scale-105 transition-transform"
```

**Hover Shadow:**
```tsx
className="hover:shadow-lg transition-shadow"
```

**Combined Hover:**
```tsx
className="hover:shadow-lg hover:-translate-y-1 transition-all"
```

**Transition Timing:**
```tsx
className="transition-all"      // All properties, 150ms
className="transition-colors"   // Colors only, 150ms
className="transition-shadow"   // Shadow only, 150ms
className="duration-300"        // Custom duration (300ms)
```

---

## Page-Specific Patterns

### Navbar
```tsx
<nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex justify-between items-center h-16">
      {/* Content */}
    </div>
  </div>
</nav>
```

### Footer
```tsx
<footer className="bg-slate-900 text-slate-300">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    {/* Content */}
  </div>
</footer>
```

### Page Container
```tsx
<div className="min-h-screen bg-slate-50 pt-24 pb-20">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    {/* Content */}
  </div>
</div>
```

### Stats Grid
```tsx
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Stat cards */}
</div>
```

---

## Responsive Breakpoints

**Mobile First Approach:**
- Base: Mobile (< 640px)
- `sm:` Small (≥ 640px)
- `md:` Medium (≥ 768px)
- `lg:` Large (≥ 1024px)
- `xl:` Extra Large (≥ 1280px)

**Examples:**
```tsx
// Responsive grid
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"

// Responsive text
className="text-3xl md:text-4xl lg:text-5xl font-bold"

// Responsive padding
className="px-4 sm:px-6 lg:px-8"

// Hide on mobile
className="hidden md:block"

// Show on mobile only
className="block md:hidden"
```

---

## Best Practices

1. **Consistent Spacing** - Use Tailwind's spacing scale (4, 6, 8, 12, 16, 20, 24, etc.)
2. **Semantic HTML** - Use proper heading hierarchy (h1, h2, h3)
3. **Accessible Colors** - Ensure sufficient contrast (4.5:1 minimum)
4. **Mobile First** - Start with mobile, add responsive classes
5. **Smooth Transitions** - Always add transition classes for interactive elements
6. **Focus States** - Include focus:ring classes for accessibility

---

## Quick Reference

**Most Common Combinations:**

```tsx
// Card with hover
"bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-lg transition-all"

// Primary button
"px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"

// Input field
"w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"

// Icon container
"w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center"

// Section heading
"text-2xl font-bold text-slate-900 mb-4"

// Body text
"text-slate-600 leading-relaxed"
```

---

**Use these patterns to update our existing pages!** 🚀
