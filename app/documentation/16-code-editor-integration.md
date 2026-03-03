# Code Editor Integration

## Table of Contents

- [Code Editor Architecture](#code-editor-architecture)
- [CodeMirror 6 Editor](#codemirror-6-editor)
- [Code Execution Pipeline](#code-execution-pipeline)
- [Code Challenge Interface](#code-challenge-interface)
- [Configuration](#configuration)
- [API Endpoint](#api-endpoint)

---

## Code Editor Architecture

```mermaid
graph TB
    subgraph Frontend["Frontend (Client-Side)"]
        EDITOR["CodeEditor Component<br/>CodeMirror 6 wrapper"]
        HOOK["useCodeExecution Hook<br/>State management + API calls"]
        LESSON_UI["Lesson View<br/>Split layout: content + editor"]
    end

    subgraph Backend["Backend (API Route)"]
        API_ROUTE["POST /api/code/execute<br/>Auth + rate limit + validation"]
    end

    subgraph Judge0["Judge0 CE (Self-Hosted VPS)"]
        SANDBOX["Sandboxed Execution<br/>POST /submissions?wait=true"]
    end

    LESSON_UI --> EDITOR
    LESSON_UI --> HOOK
    HOOK --> API_ROUTE
    API_ROUTE --> SANDBOX
    SANDBOX --> API_ROUTE
    API_ROUTE --> HOOK
```

---

## CodeMirror 6 Editor

### Component: `components/editor/CodeEditor.tsx`

| Feature | Implementation |
|---|---|
| Editor Engine | CodeMirror 6 (`@codemirror/view`, `@codemirror/state`) |
| Theme | One Dark (`@codemirror/theme-one-dark`) |
| Languages | Rust, TypeScript, JavaScript, JSON (dynamic imports) |
| Line Numbers | `lineNumbers()` extension |
| Bracket Matching | `bracketMatching()` + `closeBrackets()` |
| Autocompletion | `autocompletion()` extension |
| Code Folding | `foldGutter()` extension |
| Syntax Highlighting | `syntaxHighlighting(defaultHighlightStyle)` |
| Search | `searchKeymap` + `highlightSelectionMatches()` |
| History | `history()` + undo/redo keybindings |
| Indent | `indentWithTab` + `indentOnInput()` |
| Monospace Font | Fira Code, Cascadia Code, JetBrains Mono |
| Read-Only Mode | `EditorState.readOnly` for completed lessons |
| Dynamic Loading | Language extensions loaded via `import()` to reduce bundle |

### Component Props

| Prop | Type | Description |
|---|---|---|
| `language` | `'rust' \| 'typescript' \| 'json'` | Syntax highlighting language |
| `starterCode` | `string` | Pre-populated code content |
| `isCompleted` | `boolean` | Makes editor read-only when lesson complete |
| `isReadOnly` | `boolean` | Explicit read-only toggle |
| `onChange` | `(code: string) => void` | Callback on text changes |

### Exposed API

The editor exposes `resetCode()` and `getCode()` methods via a DOM reference for parent component access:

```mermaid
graph LR
    PARENT["Lesson Page"] -->|ref.__editorApi| EDITOR["CodeEditor"]
    EDITOR -->|resetCode()| RESET["Restore to starterCode"]
    EDITOR -->|getCode()| GET["Return current content"]
```

---

## Code Execution Pipeline

### End-to-End Flow

```mermaid
sequenceDiagram
    participant Student
    participant Editor as CodeEditor
    participant Hook as useCodeExecution
    participant API as POST /api/code/execute
    participant Judge0 as Judge0 CE (VPS)

    Student->>Editor: Write code
    Student->>Editor: Click "Run"
    Editor->>Hook: execute({ language, code, testCases? })

    Hook->>Hook: Abort any in-flight request
    Hook->>Hook: Set isExecuting = true

    Hook->>API: POST /api/code/execute
    API->>API: Check NEXT_PUBLIC_CODE_EXECUTION_ENABLED
    API->>API: Rate limit (lenient: 20/min)
    API->>API: Authenticate session
    API->>API: Validate language, code size

    alt No Test Cases
        API->>Judge0: POST /submissions?base64_encoded=true&wait=true
        Judge0-->>API: { stdout, stderr, compile_output, status }
        API->>API: Base64 decode output
        API-->>Hook: { output: { stdout, stderr, exitCode } }
    end

    alt With Test Cases
        loop Each Test Case
            API->>Judge0: POST /submissions (code + test input as stdin)
            Judge0-->>API: Result
            API->>API: Compare stdout.trim() === expectedOutput.trim()
            alt Compilation Error
                API->>API: Mark all remaining tests as failed
                Note over API: Break loop early
            end
        end
        API-->>Hook: { output, testResults[] }
    end

    Hook-->>Editor: Update output/testResults state
    Editor-->>Student: Display results
```

### Supported Languages

| Language | Judge0 ID | Version | File Extension |
|---|---|---|---|
| Rust | 108 | 1.85.0 | `.rs` |
| TypeScript | 94 | 5.0.3 | `.ts` |
| JavaScript | 93 | Node.js 18.15.0 | `.js` |
| Python | 100 | 3.12.5 | `.py` |

### Judge0 CE Status Codes

| ID | Status | Description |
|---|---|---|
| 1 | In Queue | Submission pending |
| 2 | Processing | Execution in progress |
| 3 | Accepted | Ran successfully |
| 4 | Wrong Answer | Output mismatch |
| 5 | Time Limit Exceeded | Exceeded CPU time |
| 6 | Compilation Error | Code failed to compile |
| 7-12 | Runtime Errors | Various runtime failures |
| 13 | Internal Error | Judge0 system error |

---

## Code Challenge Interface

### Challenge Flow

```mermaid
stateDiagram-v2
    [*] --> Editing: Load starter code
    Editing --> Running: Click "Run"
    Running --> Results: Execution complete

    state Results {
        [*] --> PassFail
        PassFail --> AllPassed: All tests pass
        PassFail --> SomeFailed: Some tests fail
    }

    AllPassed --> Complete: Mark lesson complete + award XP
    SomeFailed --> Editing: Edit and retry
    Results --> Editing: Edit code

    Complete --> [*]
```

### Test Case Structure

| Field | Type | Description |
|---|---|---|
| `name` | string | Test case display name |
| `input` | string | stdin input for the program |
| `expectedOutput` | string | Expected stdout (trimmed comparison) |
| `isHidden` | boolean | If true, expected/actual values show as `[hidden]` |

### Test Result Structure

| Field | Type | Description |
|---|---|---|
| `name` | string | Test case name |
| `passed` | boolean | Whether output matches expected |
| `expected` | string | Expected output (or `[hidden]`) |
| `actual` | string | Actual output (or `[hidden]`) |
| `isHidden` | boolean | Whether test details are hidden |

---

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_CODE_EXECUTION_ENABLED` | Yes | `false` | Feature flag (client + server) |
| `CODE_EXECUTION_API_URL` | Yes | None | Judge0 CE base URL (your VPS) |
| `CODE_EXECUTION_AUTH_TOKEN` | No | `''` | X-Auth-Token for Judge0 |
| `CODE_EXECUTION_TIMEOUT_MS` | No | `10000` | Max execution timeout (ms) |
| `CODE_EXECUTION_MAX_CODE_SIZE` | No | `65536` | Max code size (bytes, ~64KB) |

### Security Controls

| Control | Implementation |
|---|---|
| Authentication | Session required (JWT) |
| Rate Limiting | Lenient tier (20 req/min) |
| Code Size Limit | 64KB max (configurable) |
| Execution Timeout | 10s default + 5s buffer |
| Feature Flag | Disabled by default |
| Sandboxing | Judge0 CE isolates execution |
| Base64 Encoding | All payloads base64-encoded in transit |

### Judge0 CE Deployment

The code execution backend requires a self-hosted Judge0 CE instance. See `docs/judge0-vps-setup.md` for deployment instructions.

```mermaid
graph LR
    subgraph App["Superteam Academy"]
        API["POST /api/code/execute"]
    end

    subgraph VPS["Self-Hosted VPS"]
        J0["Judge0 CE<br/>Docker containers"]
        WORKERS["Worker Processes<br/>Sandboxed execution"]
    end

    API -->|HTTPS + Auth Token| J0
    J0 --> WORKERS
    WORKERS -->|Isolated containers| J0
    J0 -->|Base64 results| API
```

---

## API Endpoint

### POST /api/code/execute

| | |
|---|---|
| **Method** | POST |
| **Auth** | JWT (session required) |
| **Rate Limit** | Lenient (20/min) |
| **Feature Flag** | `NEXT_PUBLIC_CODE_EXECUTION_ENABLED=true` |

**Request Body:**

```json
{
    "language": "rust",
    "code": "fn main() { println!(\"Hello\"); }",
    "stdin": "",
    "testCases": [
        {
            "name": "Test 1",
            "input": "5",
            "expectedOutput": "25",
            "isHidden": false
        }
    ]
}
```

**Response (200) - Without test cases:**

```json
{
    "success": true,
    "output": {
        "stdout": "Hello\n",
        "stderr": "",
        "exitCode": 0,
        "compilationError": null
    }
}
```

**Response (200) - With test cases:**

```json
{
    "success": true,
    "output": {
        "stdout": "25\n",
        "stderr": "",
        "exitCode": 0,
        "compilationError": null
    },
    "testResults": [
        {
            "name": "Test 1",
            "passed": true,
            "expected": "25",
            "actual": "25",
            "isHidden": false
        }
    ]
}
```
