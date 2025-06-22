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

<img width="904" alt="Screenshot 2025-06-22 at 11 44 36" src="https://github.com/user-attachments/assets/84afe9a4-7860-4d14-a2e1-4d85378bacdb" />

## ✨ Key Features

### 📝 Smart Template Editor

Advanced rich text editor for creating document templates. Design once, generate
unlimited variations.

<img width="941" alt="Screenshot 2025-06-22 at 11 46 46" src="https://github.com/user-attachments/assets/45aa8960-bd7e-45b8-bf1a-48b97a66c82e" />

### 🧠 AI-Powered Content Generation

- **Context Variables** (`{{company_name}}`): Fill with your data
- **AI Prompts** (`[[write introduction]]`): AI generates content using your
  uploaded documents

<img width="772" alt="Screenshot 2025-06-22 at 11 47 53" src="https://github.com/user-attachments/assets/04ec0c51-2d93-4fd5-a46f-f3b2dbf75449" />

### 📚 Document Processing

Upload PDFs, Word docs, or text files. Wordy processes and indexes them for AI
content generation.

<img width="768" alt="Screenshot 2025-06-22 at 11 48 31" src="https://github.com/user-attachments/assets/fcd9fe9b-76fd-4b8b-b902-f374a140ed02" />

### 🎨 Document Output

Generate professional documents ready for sharing. Export to PDF with full
formatting.

![image](https://github.com/user-attachments/assets/f3cc5e12-4c46-495c-a3f1-e24c65f9b01a)

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

![image](https://github.com/user-attachments/assets/c04ace55-5b95-4f6c-a7fa-f023828e2bc7)

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
