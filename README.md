## 🎯 What is Wordy?

An intelligent document generation platform for creating professional documents.
Upload reference materials, design templates with smart placeholders, and
generate contextually relevant content.

Perfect for proposals, reports, contracts, marketing materials, and any document
requiring consistent formatting with dynamic content.

## 🚀 How It Works

### 1. Upload Context Documents

Add reference materials relevant to your templates.

### 2. Design Templates

Create document structure with context variables and AI prompts.

### 3. Generate Documents

Provide your details and generate polished documents with AI-generated content.

_[Screenshot placeholder: 3-step workflow]_

## ✨ Key Features

### 📝 Smart Template Editor

Advanced rich text editor for creating document templates. Design once, generate
unlimited variations.

_[Screenshot placeholder: Template editor interface]_

### 🧠 AI-Powered Content Generation

- **Context Variables** (`{{company_name}}`): Fill with your data
- **AI Prompts** (`[[write introduction]]`): AI generates content using your
  uploaded documents

_[Screenshot placeholder: Template showing variable types]_

### 📚 Document Processing

Upload PDFs, Word docs, or text files. Wordy processes and indexes them for AI
content generation.

_[Screenshot placeholder: Document upload interface]_

### 🎨 Document Output

Generate professional documents ready for sharing. Export to PDF with full
formatting.

_[Screenshot placeholder: Template → generated document]_

## 💼 Use Cases

- **Business Proposals**: Customized proposals with relevant case studies
- **Research Reports**: Reports with AI analysis based on your documents
- **Marketing Materials**: Content using brand guidelines and campaigns
- **Legal Documents**: Contracts with consistent language
- **Educational Content**: Lesson plans using curriculum resources

## 🌟 Benefits

- **Save Time**: Automate repetitive document creation
- **Stay Consistent**: Maintain formatting and voice across documents
- **Use Existing Knowledge**: Leverage your document library
- **Professional Results**: Generate polished documents
- **Easy to Use**: Intuitive interface

_[Screenshot placeholder: Dashboard with templates and documents]_

---

## 🛠️ Technical Information

### Technology Stack

**Frontend**

- React 19 with TypeScript
- TanStack Router
- Lexical editor
- Tailwind CSS

**Backend**

- Django REST Framework
- OpenAI API
- PostgreSQL/SQLite
- Vector embeddings

### Quick Setup

1. **Clone repository**

```bash
git clone <repository-url>
cd wordy
```

2. **Backend setup**

```bash
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

3. **Frontend setup**

```bash
cd frontend
pnpm install
pnpm dev
```

4. **Environment**

```env
OPENAI_API_KEY=your_api_key_here
```

### API Endpoints

- `GET /api/templates/` - List templates
- `POST /api/templates/` - Create template
- `POST /api/templates/{id}/generate/` - Generate document
- `POST /api/documents/upload/` - Upload document

### Architecture

- **Template Engine**: Processes templates and variables
- **RAG Pipeline**: Document processing and context retrieval
- **AI Integration**: OpenAI API for content generation
- **Frontend**: React-based interface

**Wordy** - Intelligent document creation powered by AI.
