import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Placeholder from '@tiptap/extension-placeholder';
import { cn } from "@/lib/utils";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface RichTextContent {
  type?: 'doc';
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


export interface RichTextEditorProps {
  value: RichTextContent;
  onChange: (value: RichTextContent) => void;
  placeholder?: string;
  error?: boolean;
}

const MenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    isActive?: boolean;
    children: React.ReactNode;
  }
>(({ className, isActive, ...props }, ref) => (
  <Button
    ref={ref}
    type="button" // Add this to prevent form submission
    variant="ghost"
    size="sm"
    className={cn(
      'h-8 w-8 p-0 hover:bg-muted data-[state=on]:bg-accent data-[state=on]:text-accent-foreground',
      isActive && 'bg-accent text-accent-foreground',
      className
    )}
    {...props}
  />
));
MenuButton.displayName = 'MenuButton';

const RichTextEditor = ({ 
  value, 
  onChange, 
  placeholder = "Entrez votre description...",
  error
}: RichTextEditorProps) => {
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
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const content = editor.getJSON() as RichTextContent;
      const isEmpty = editor.isEmpty;
    
      if (!isEmpty && content.type === 'doc') {
        onChange(content);
      } else {
        onChange({ type: 'doc', content: [] }); // or another empty placeholder
      }
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className={cn(
      "border rounded-md",
      error && "border-destructive",
      "focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
    )}>
      <div className="border-b p-2 flex flex-wrap gap-1">
        <MenuButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          aria-label="Gras"
        >
          <Bold className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          aria-label="Italique"
        >
          <Italic className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          aria-label="Souligné"
        >
          <UnderlineIcon className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          aria-label="Aligner à gauche"
        >
          <AlignLeft className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          aria-label="Centrer"
        >
          <AlignCenter className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          aria-label="Aligner à droite"
        >
          <AlignRight className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          aria-label="Liste à puces"
        >
          <List className="h-4 w-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          aria-label="Liste numérotée"
        >
          <ListOrdered className="h-4 w-4" />
        </MenuButton>
      </div>
      <style jsx global>{`
        .ProseMirror {
          min-height: 150px;
          padding: 1rem;
          outline: none !important;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          color: #666;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .ProseMirror ul {
          list-style-type: disc;
          padding-left: 1.5em;
        }
        .ProseMirror ol {
          list-style-type: decimal;
          padding-left: 1.5em;
        }
        .ProseMirror ul li, .ProseMirror ol li {
          margin: 0.5em 0;
        }
        .ProseMirror ul[data-type="bulletList"], .ProseMirror ol[data-type="orderedList"] {
          margin: 0;
        }
      `}</style>
      <EditorContent 
        editor={editor} 
        className="prose prose-sm max-w-none"
      />
    </div>
  );
};

export default RichTextEditor;