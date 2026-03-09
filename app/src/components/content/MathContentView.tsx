import type { Components } from 'react-markdown';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import { cx } from '../layout/DesignShell';
import type { MathContent } from '../../types';

const blockComponents: Components = {
  p: ({ children }) => <p className="leading-7 text-inherit [&:not(:first-child)]:mt-4">{children}</p>,
  ul: ({ children }) => <ul className="ml-5 list-disc space-y-2 leading-7">{children}</ul>,
  ol: ({ children }) => <ol className="ml-5 list-decimal space-y-2 leading-7">{children}</ol>,
  li: ({ children }) => <li className="text-inherit">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-text-100">{children}</strong>,
  em: ({ children }) => <em className="italic text-text-200">{children}</em>,
  code: ({ children }) => (
    <code className="rounded-[4px] bg-base-600/70 px-1.5 py-0.5 font-mono text-[0.95em] text-text-200">
      {children}
    </code>
  ),
};

const inlineComponents: Components = {
  p: ({ children }) => <>{children}</>,
  code: ({ children }) => (
    <code className="rounded-[4px] bg-base-600/70 px-1.5 py-0.5 font-mono text-[0.95em] text-text-200">
      {children}
    </code>
  ),
};

function buildSource(content?: MathContent | null, inline = false) {
  if (!content) {
    return '';
  }

  if (content.markdown?.trim()) {
    return content.markdown;
  }

  if (content.latex?.trim()) {
    return inline
      ? ['$', content.latex, '$'].join('')
      : ['$$', content.latex, '$$'].join('\n');
  }

  return content.plain_text;
}

export function MarkdownMath({
  source,
  className,
  inline = false,
}: {
  source: string;
  className?: string;
  inline?: boolean;
}) {
  const Wrapper = inline ? 'span' : 'div';

  return (
    <Wrapper className={cx('math-content', inline ? 'inline' : 'space-y-4', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={inline ? inlineComponents : blockComponents}
      >
        {source}
      </ReactMarkdown>
    </Wrapper>
  );
}

export function MathContentView({
  content,
  className,
  inline = false,
}: {
  content?: MathContent | null;
  className?: string;
  inline?: boolean;
}) {
  const source = buildSource(content, inline);

  if (!source) {
    return null;
  }

  return <MarkdownMath source={source} className={className} inline={inline} />;
}

export function LatexBlock({
  latex,
  className,
}: {
  latex?: string | null;
  className?: string;
}) {
  if (!latex) {
    return null;
  }

  return <MarkdownMath source={['$$', latex, '$$'].join('\n')} className={className} />;
}

export function asMathContent(plainText: string): MathContent {
  return {
    source_format: 'markdown',
    plain_text: plainText,
    markdown: plainText,
  };
}
