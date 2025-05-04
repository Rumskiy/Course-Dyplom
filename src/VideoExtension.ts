import { Node, mergeAttributes } from "@tiptap/core";

export const Video = Node.create({
    name: "video",
    group: "block",
    atom: true,

    addAttributes() {
        return {
            src: {
                default: null,
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: "iframe",
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return ["iframe", mergeAttributes(HTMLAttributes, { width: "560", height: "315", frameborder: "0", allowfullscreen: "true" })];
    },
});
