import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';

interface RichTextContent {
  type: 'doc';
  content: Array<{
    type: string;
    content?: Array<{
      type: string;
      text?: string;
      marks?: Array<{ type: string }>;
    }>;
    attrs?: Record<string, any>;
  }>;
}

interface RichTextDisplayProps {
  content: RichTextContent;
}

const RichTextDisplay = ({ content }: RichTextDisplayProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['paragraph', 'heading'],
        alignments: ['left', 'center', 'right'],
      }),
    ],
    content,
    editable: false,
  });

  if (!editor) {
    return null;
  }

  return (
    <>
      <style jsx global>{`
        .ProseMirror {
          > * + * {
            margin-top: 0.75em;
          }
        }
        
        .ProseMirror ul {
          list-style-type: disc;
          padding-left: 1.5em;
          margin: 0.5em 0;
        }
        
        .ProseMirror ol {
          list-style-type: decimal;
          padding-left: 1.5em;
          margin: 0.5em 0;
        }
        
        .ProseMirror li {
          margin: 0.2em 0;
        }
        
        .ProseMirror ul[data-type="bulletList"] {
          margin: 0.5em 0;
        }
        
        .ProseMirror p {
          margin: 0.5em 0;
        }
        
        .ProseMirror ul li p {
          margin: 0;
        }
      `}</style>
      <EditorContent 
        editor={editor} 
        className="prose prose-sm max-w-none"
      />
    </>
  );
};

export default RichTextDisplay;