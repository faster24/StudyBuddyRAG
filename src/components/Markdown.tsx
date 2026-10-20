import ReactMarkdown from "react-markdown"
import rehypeKatex from "rehype-katex"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import "katex/dist/katex.min.css"

import { cn } from "@/lib/utils"

// remark-math only understands $...$ and $$...$$, but models often emit \(...\) and \[...\].
// Code blocks are left untouched.
const normalizeMathDelimiters = (text: string): string =>
    text
        .split(/(```[\s\S]*?```|`[^`\n]*`)/g)
        .map((part, index) => {
            if (index % 2 === 1) {
                return part
            }
            return part
                .replace(/\\\[([\s\S]*?)\\\]/g, (_, math: string) => `\n$$\n${math.trim()}\n$$\n`)
                .replace(/\\\(([\s\S]*?)\\\)/g, (_, math: string) => `$${math.trim()}$`)
        })
        .join("")

type MarkdownProps = {
    children: string
    className?: string
}

export default function Markdown({ children, className }: MarkdownProps) {
    return (
        <div
            className={cn(
                "space-y-2 break-words leading-relaxed",
                "[&_a]:underline [&_a]:underline-offset-2",
                "[&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5",
                "[&_h1]:text-base [&_h1]:font-semibold [&_h2]:text-base [&_h2]:font-semibold [&_h3]:font-semibold",
                "[&_code]:rounded [&_code]:bg-background/70 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs",
                "[&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-background/70 [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0",
                "[&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:italic",
                "[&_hr]:my-3 [&_hr]:border-border",
                "[&_table]:w-full [&_table]:text-xs [&_th]:border [&_th]:border-border [&_th]:px-2 [&_th]:py-1 [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1",
                "[&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden [&_.katex-display]:py-1",
                className,
            )}
        >
            <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                    a: ({ href, title, children }) => (
                        <a href={href} title={title} target="_blank" rel="noreferrer noopener">
                            {children}
                        </a>
                    ),
                }}
            >
                {normalizeMathDelimiters(children)}
            </ReactMarkdown>
        </div>
    )
}
