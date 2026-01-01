# Avatar Component

Theme-compliant avatar component that automatically handles Chinese and English name display.

## Features

- ✅ Chinese names: Display last character (e.g., "张三" → "三")
- ✅ English names: Display first letter uppercase (e.g., "John Doe" → "J")
- ✅ Automatic theme color adaptation
- ✅ Image avatar support
- ✅ Hover effects

## Usage

```jsx
import Avatar from '@/components/Avatar';

// Chinese name
<Avatar name="张三" />  // Displays: 三

// English name
<Avatar name="John Doe" />  // Displays: J

// With image
<Avatar name="张三" src="/avatar.jpg" />

// Custom size
<Avatar name="张三" size={48} />
```

## Props

| Parameter | Description | Type | Default |
|-----------|-------------|------|---------|
| name | User name | string | - |
| src | Image address | string | - |
| size | Avatar size | number | 40 |
| style | Custom styles | object | - |

## Utility Functions

If you need to use text processing logic separately:

```javascript
import { getAvatarText } from '@/utils/avatarUtils';

const text = getAvatarText('张三'); // "三"
const text2 = getAvatarText('John Doe'); // "J"
```
