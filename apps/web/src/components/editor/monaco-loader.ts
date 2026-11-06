import { loader } from "@monaco-editor/react";
import { MONACO_VS_PATH } from "@/lib/editor/monaco-cdn";

// Import for its side effect from every module that mounts an <Editor>. It has
// to run before the first mount, which is when the loader injects its script.
loader.config({ paths: { vs: MONACO_VS_PATH } });
