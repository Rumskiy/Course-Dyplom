export const MenuBar = ({ editor, addImage }) => {
    const handleImageUpload = async (e) => {
        const file = e.target.files[0]
        if (!file) return

        // Add your image upload logic here (e.g., to Cloudinary)
        const reader = new FileReader()
        reader.onload = (e) => {
            addImage(e.target.result) // Use base64 for demo
        }
        reader.readAsDataURL(file)
    }

    return (
        <div className="menu-bar">
            <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={editor.isActive('bold') ? 'active' : ''}
            >
                Bold
            </button>
            <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                id="image-upload"
                style={{ display: 'none' }}
            />
            <button onClick={() => document.getElementById('image-upload').click()}>
                Insert Image
            </button>
        </div>
    )
}