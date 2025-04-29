import {useEditor, EditorContent} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Heading from '@tiptap/extension-heading';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Strike from '@tiptap/extension-strike';
import Underline from '@tiptap/extension-underline';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import TextAlign from '@tiptap/extension-text-align';
import {Button} from '@mui/material';
import {
    FormatBold,
    FormatItalic,
    FormatStrikethrough,
    FormatUnderlined,
    FormatListBulleted,
    FormatListNumbered,
    FormatAlignLeft,
    FormatAlignCenter,
    FormatAlignRight,
    Title,
    ColorLens,
} from '@mui/icons-material';
import {useEffect} from 'react';
import './style.scss';

interface TiptapEditorProps {
    content: string;
    onChange: (content: string) => void;
}

export const TiptapEditor: React.FC<TiptapEditorProps> = ({content, onChange}) => {
    const editor = useEditor({
        extensions: [
            StarterKit,
            TextStyle,
            Color,
            Heading.configure({levels: [1, 2, 3]}),
            Bold,
            Italic,
            Strike,
            Underline,
            BulletList,
            OrderedList,
            ListItem,
            TextAlign.configure({types: ['heading', 'paragraph']}),
        ],
        onUpdate: ({editor}) => {
            onChange(editor.getHTML());
        },
        content: content,
        editorProps: {
            attributes: {
                class: 'tiptap',
            },
        },
    });

    useEffect(() => {
        if (editor && content !== editor.getHTML()) {
            editor.commands.setContent(content);
        }
    }, [content]);

    if (!editor) return null;

    return (
        <>
            {/* Панель інструментів */}
            <Button
                onClick={() => editor.chain().focus().toggleHeading({level: 1}).run()}
                sx={{fontWeight: editor?.isActive('heading', {level: 1}) ? 'bold' : 'normal'}}
            >
                <Title/> H1
            </Button>
            <Button
                onClick={() => editor.chain().focus().toggleHeading({level: 2}).run()}
                sx={{fontWeight: editor?.isActive('heading', {level: 2}) ? 'bold' : 'normal'}}
            >
                <Title/> H2
            </Button>
            <Button
                onClick={() => editor.chain().focus().toggleHeading({level: 3}).run()}
                sx={{fontWeight: editor?.isActive('heading', {level: 3}) ? 'bold' : 'normal'}}
            >
                <Title/> H3
            </Button>
            <Button
                onClick={() => editor.chain().focus().toggleBold().run()}
                sx={{fontWeight: editor?.isActive('bold') ? 'bold' : 'normal'}}
            >
                <FormatBold/>
            </Button>
            <Button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                sx={{fontStyle: editor?.isActive('italic') ? 'italic' : 'normal'}}
            >
                <FormatItalic/>
            </Button>
            <Button
                onClick={() => editor.chain().focus().toggleStrike().run()}
                sx={{textDecoration: editor?.isActive('strike') ? 'line-through' : 'none'}}
            >
                <FormatStrikethrough/>
            </Button>
            <Button
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                sx={{textDecoration: editor?.isActive('underline') ? 'underline' : 'none'}}
            >
                <FormatUnderlined/>
            </Button>
            <Button
                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                sx={{fontWeight: editor?.isActive({textAlign: 'left'}) ? 'bold' : 'normal'}}
            >
                <FormatAlignLeft/>
            </Button>
            <Button
                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                sx={{fontWeight: editor?.isActive({textAlign: 'center'}) ? 'bold' : 'normal'}}
            >
                <FormatAlignCenter/>
            </Button>
            <Button
                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                sx={{fontWeight: editor?.isActive({textAlign: 'right'}) ? 'bold' : 'normal'}}
            >
                <FormatAlignRight/>
            </Button>
            <Button onClick={() => editor.chain().focus().toggleBulletList().run()}>
                <FormatListBulleted/>
            </Button>
            <Button onClick={() => editor.chain().focus().toggleOrderedList().run()}>
                <FormatListNumbered/>
            </Button>
            <Button onClick={() => editor.chain().focus().setColor('#958DF1').run()}>
                <ColorLens/>
            </Button>

            <EditorContent editor={editor}/>
        </>
    );
};