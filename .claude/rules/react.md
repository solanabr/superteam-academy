# React Component Standards

## Component Basics

### Functional Components Only

```typescript
// ✅ DO: Use functional components
export const CourseCard: React.FC<CourseCardProps> = ({ title, description }) => {
  return <div>{title}</div>;
};

// ❌ DON'T: Use class components (unless error boundary)
export class CourseCard extends React.Component { }
```

### Props Typing

```typescript
// ✅ DO: Define explicit prop interfaces
interface CourseCardProps {
  courseId: string;
  title: string;
  description?: string;
  onEnroll: (courseId: string) => Promise<void>;
  className?: string;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  courseId,
  title,
  description,
  onEnroll,
  className,
}) => {
  return <div className={className}>{title}</div>;
};

// ❌ DON'T: Use prop spreading without explicit types
export const CourseCard = (props: any) => {
  return <div {...props} />;
};

// ✅ DO: Use children prop for wrappers
interface CardProps {
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children }) => {
  return <div className="card">{children}</div>;
};
```

### Component Documentation

```typescript
/**
 * Display a single course preview card
 *
 * @component
 * @example
 * <CourseCard
 *   courseId="course-1"
 *   title="Solana Basics"
 *   onEnroll={handleEnroll}
 * />
 *
 * @param props - Component props
 * @returns Rendered course card
 */
export const CourseCard: React.FC<CourseCardProps> = (props) => {
  // ...
};
```

## Hooks

### Rules of Hooks

```typescript
// ✅ DO: Call hooks at top level
export const MyComponent = () => {
  const [count, setCount] = useState(0);
  useEffect(() => { /* ... */ }, []);
  return <div>{count}</div>;
};

// ❌ DON'T: Call hooks conditionally
if (shouldUseFetch) {
  useEffect(() => { /* ... */ }, []); // WRONG!
}

// ❌ DON'T: Call hooks in loops
for (let i = 0; i < items.length; i++) {
  useState(); // WRONG!
}
```

### Custom Hooks

```typescript
// ✅ DO: Start hook names with 'use'
export const useLearningProgress = (learnerId: string) => {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    learningProgressService
      .getProgress(learnerId)
      .then(setProgress)
      .catch(setError);
  }, [learnerId]);
  
  return { progress, error };
};

// ✅ DO: Return consistent shape
return {
  data: progress,
  isLoading: isLoading,
  error: error,
  refetch: refetch,
};

// ❌ DON'T: Return different shapes
if (error) return { error };
return { progress }; // Inconsistent!
```

### useEffect Dependencies

```typescript
// ✅ DO: Specify all dependencies
useEffect(() => {
  console.log(count);
  console.log(name);
}, [count, name]); // All used dependencies listed

// ❌ DON'T: Omit dependencies
useEffect(() => {
  console.log(count);
  console.log(name);
}, [count]); // Missing 'name' - stale closures!

// ✅ DO: Use empty array for once-only effects
useEffect(() => {
  initializeApp();
}, []); // Empty = run once on mount

// ✅ DO: Clean up subscriptions
useEffect(() => {
  const unsubscribe = eventBus.subscribe(handleEvent);
  return () => unsubscribe(); // Cleanup function
}, []);
```

## Rendering & Performance

### Conditional Rendering

```typescript
// ✅ DO: Use ternary for simple conditions
return isLoading ? <Spinner /> : <Content />;

// ✅ DO: Use && for showing/hiding
return showError && <ErrorMessage error={error} />;

// ✅ DO: Use early returns for complex logic
if (!user) return <Unauthenticated />;
if (isLoading) return <Loading />;
if (error) return <Error error={error} />;
return <Content user={user} />;

// ❌ DON'T: Use conditional JSX expressions
{error ? <Error /> : null} // Unnecessary false rendering

// ❌ DON'T: Render truthy values as JSX
{name && name} // 'name' is just text, not JSX
```

### List Rendering

```typescript
// ✅ DO: Use stable keys (unique IDs)
{courses.map((course) => (
  <CourseCard key={course.id} course={course} />
))}

// ❌ DON'T: Use array index as key (unstable)
{courses.map((course, index) => (
  <CourseCard key={index} course={course} /> // BAD!
))}

// ✅ DO: Memoize list items if expensive
import { memo } from 'react';

const CourseCardMemo = memo(CourseCard);

{courses.map((course) => (
  <CourseCardMemo key={course.id} course={course} />
))}
```

### Memoization

```typescript
// ✅ DO: Use memo for expensive components
interface ButtonProps {
  onClick: () => void;
  disabled: boolean;
}

const Button = memo(function Button({ onClick, disabled }: ButtonProps) {
  return <button onClick={onClick} disabled={disabled}>Click</button>;
});

// ✅ DO: Use useCallback for stable function references
const handleEnroll = useCallback(async (courseId: string) => {
  await courseService.enroll(courseId);
  setEnrolled(true);
}, [courseService]);

<CourseCard onEnroll={handleEnroll} />

// ✅ DO: Use useMemo for expensive computations
const totalXP = useMemo(() => {
  return courses.reduce((sum, c) => sum + c.xpReward, 0);
}, [courses]);

// ❌ DON'T: Over-memoize (premature optimization)
const name = useMemo(() => user.name, [user.name]); // Pointless!
```

## State Management

### Local Component State

```typescript
// ✅ DO: Keep form state local
const [formData, setFormData] = useState({ name: '', email: '' });
const handleChange = (e) => {
  setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
};

// ✅ DO: Use multiple useState for independent state
const [count, setCount] = useState(0);
const [isOpen, setIsOpen] = useState(false);

// ❌ DON'T: Nest useState (not a thing, but don't nest state objects unnecessarily)
const [state, setState] = useState({
  count: 0,
  isOpen: false,
  formData: { name: '', email: '' }
  // Hard to update individual fields
});

// ✅ DO: Use setState callback arg
setCount(prev => prev + 1); // Functional update for consistency
```

### External State (Zustand)

```typescript
// ✅ DO: Create selector hooks
const useLearnerName = () => useLearnerStore(s => s.learner?.displayName);
const useTotalXP = () => useLearnerStore(s => s.learner?.totalXP);

// Usage in component
const name = useLearnerName();
const xp = useTotalXP();

// ❌ DON'T: Access entire store
const learner = useLearnerStore(); // Triggers re-render on any store change
const name = learner.learner?.displayName; // Inefficient!
```

## Event Handlers

```typescript
// ✅ DO: Type event handlers properly
const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
  e.preventDefault();
};

const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setInput(e.target.value);
};

// ✅ DO: Bind functions via useCallback for passed handlers
const handleDelete = useCallback((id: string) => {
  removeCourse(id);
}, [removeCourse]);

// ❌ DON'T: Create functions in JSX
<button onClick={() => setCount(count + 1)}>Plus</button> // New function on each render

// ✅ DO: Extract complex handlers
const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  // Long logic here
};

<form onSubmit={handleFormSubmit}>...</form>
```

## Styling

### Tailwind CSS in Components

```typescript
import { cn } from '@/lib/utils/cn';

// ✅ DO: Use cn() for conditional classes
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
}

export const Button = ({ variant = 'primary', className, ...props }: ButtonProps) => {
  return (
    <button
      className={cn(
        'px-4 py-2 rounded transition-colors',
        {
          'bg-blue-500 hover:bg-blue-600': variant === 'primary',
          'bg-gray-300 hover:bg-gray-400': variant === 'secondary',
        },
        className
      )}
      {...props}
    />
  );
};

// ❌ DON'T: Create CSS modules for single components
// .button { ... } in separate .css file (use Tailwind instead)
```

## Accessibility

```typescript
// ✅ DO: Use semantic HTML
<button onClick={handleClick}>Click me</button> // Not <div onClick>

// ✅ DO: Add role attributes when needed
<div role="navigation" aria-label="Main menu">
  <ul>...</ul>
</div>

// ✅ DO: Use aria-labels for icon-only buttons
<button aria-label="Close menu" onClick={onClose}>
  <XIcon />
</button>

// ✅ DO: Link form labels to inputs
<label htmlFor="email">Email</label>
<input id="email" type="email" />

// ❌ DON'T: Use divs for interactive elements
<div onClick={handleClick}>Click me</div> // Should be <button>
```

## Error Handling in Components

```typescript
// ✅ DO: Show error states
const { data, error, isLoading } = useQuery(/* ... */);

return (
  <>
    {isLoading && <Loading />}
    {error && <ErrorMessage error={error} />}
    {data && <Content data={data} />}
  </>
);

// ✅ DO: Handle errors in event handlers
const handleSubmit = async () => {
  try {
    await submitData();
    showSuccessToast();
  } catch (error) {
    showErrorToast(error instanceof Error ? error.message : 'Unknown error');
  }
};

// ❌ DON'T: Silently fail
onClick={async () => {
  await someAsyncFunction(); // No error handling!
}}
```

## Performance Anti-patterns

```typescript
// ❌ DON'T: Create new objects in render
const myObj = { color: 'red' }; // New object every render
<MyComponent style={myObj} />

// ✅ DO: Memoize objects
const myObj = useMemo(() => ({ color: 'red' }), []);

// ❌ DON'T: Create new arrays in render
<MyComponent items={[1, 2, 3]} />

// ✅ DO: Define outside render
const ITEMS = [1, 2, 3];
<MyComponent items={ITEMS} />

// ❌ DON'T: Pass entire object when you need one property
<CourseCard {...course} /> // Re-renders if ANY property changes

// ✅ DO: Pass only needed props
<CourseCard id={course.id} title={course.title} />
```

---

**Document Version**: 1.0.0  
**Last Updated**: February 2026  
**Maintained By**: Superteam Academy Team
