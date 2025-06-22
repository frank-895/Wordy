import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { FileText, Loader2, RefreshCw, Edit, FileEdit, Trash2, Calendar } from 'lucide-react'

export const Route = createFileRoute('/templates/')({
  component: TemplatesList,
})

interface Template {
  id: string;
  name: string;
  created_at: string;
}

interface TemplatesResponse {
  templates: Template[];
}

function TemplatesList() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/template/');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: TemplatesResponse = await response.json();
      setTemplates(data.templates);
    } catch (err) {
      setError(`Failed to fetch templates: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const deleteTemplate = async (templateId: string, templateName: string) => {
    // Show confirmation dialog
    const confirmed = window.confirm(`Are you sure you want to delete the template "${templateName}"? This action cannot be undone.`);
    
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/template/${templateId}/delete/`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Remove the template from the state
      setTemplates(prevTemplates => 
        prevTemplates.filter(template => template.id !== templateId)
      );

      // You could also show a success message here
      alert(`Template "${templateName}" has been deleted successfully.`);
    } catch (err) {
      alert(`Failed to delete template: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="py-8">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
          <p className="mt-4 text-gray-600">Loading templates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong className="font-bold">Error: </strong>
          <span>{error}</span>
        </div>
        <button
          type="button"
          onClick={fetchTemplates}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Saved Templates
        </h1>
        <p className="text-gray-600">
          View and manage your saved document templates
        </p>
      </div>
      
      {templates.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="text-gray-400 mb-4">
            <FileText className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-600 mb-4">
            Create your first template using the editor
          </p>
          <a 
            href="/editor" 
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Editor
          </a>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">
                All Templates ({templates.length})
              </h2>
              <button
                type="button"
                onClick={fetchTemplates}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {templates.map((template) => (
              <div key={template.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <h3 className="text-lg font-medium text-gray-900">
                        {template.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>Created: {formatDate(template.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-6">
                    <Link 
                      to="/editor/$templateId" 
                      params={{ templateId: template.id }}
                      className="inline-flex items-center gap-1.5 text-gray-600 hover:text-gray-800 text-sm font-medium px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </Link>
                    <Link 
                      to="/templates/$templateId" 
                      params={{ templateId: template.id }}
                      className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-sm font-medium px-3 py-2 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors"
                    >
                      <FileEdit className="w-4 h-4" />
                      Fill Template
                    </Link>
                    <button
                      type="button"
                      onClick={() => deleteTemplate(template.id, template.name)}
                      className="inline-flex items-center gap-1.5 text-red-600 hover:text-red-800 text-sm font-medium px-3 py-2 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 